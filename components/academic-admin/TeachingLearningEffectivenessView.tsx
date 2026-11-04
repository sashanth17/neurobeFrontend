import React, { useState, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  academicAdminService,
  TeachingLearningEffectivenessData,
  KLevelKey,
  ClassroomPushPullItem,
  CoursePushPullItem,
  CourseBreakdownItem,
} from "@/services/academicAdminAnalytics.service";
import CoursePushPullFullscreenModal from "@/components/academic-admin/CoursePushPullFullscreenModal";
import AiAcademicAnalyticsModal from "@/components/academic-admin/AiAcademicAnalyticsModal";
import { GenerateSuggestionInput } from "@/services/academicAdminAiDb.service";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface TeachingLearningEffectivenessViewProps {
  type: "cia" | "mcq";
  onDrilldownToAttainment?: (departmentCode: string, courseCode?: string) => void;
}

const ALL_K_LEVELS: KLevelKey[] = ["K1", "K2", "K3", "K4", "K5", "K6"];

const K_LEVEL_LABELS: Record<KLevelKey, string> = {
  K1: "K1 - Remember",
  K2: "K2 - Understand",
  K3: "K3 - Apply",
  K4: "K4 - Analyze",
  K5: "K5 - Evaluate",
  K6: "K6 - Create",
};

const K_LEVEL_COLORS: Record<KLevelKey, string> = {
  K1: "#2563eb", // Blue
  K2: "#10b981", // Green
  K3: "#ef4444", // Red
  K4: "#f59e0b", // Amber
  K5: "#8b5cf6", // Purple
  K6: "#06b6d4", // Cyan
};

export const TeachingLearningEffectivenessView: React.FC<
  TeachingLearningEffectivenessViewProps
> = ({ type, onDrilldownToAttainment }) => {
  // 6 K-Level Buttons — first three (K1, K2, K3) are ON by default
  const [activeKLevels, setActiveKLevels] = useState<KLevelKey[]>([
    "K1",
    "K2",
    "K3",
  ]);

  // Target Benchmark: 50% default
  const [targetBenchmark, setTargetBenchmark] = useState<number>(50);

  // Filters matching Excel
  const [selectedDept, setSelectedDept] = useState<string>("ALL");
  const [selectedBatch, setSelectedBatch] = useState<string>("ALL");
  const [selectedTest, setSelectedTest] = useState<string>("ALL");

  // Step-by-step Course Drilldown state ("konjam konjama")
  const [selectedDrilldownCourse, setSelectedDrilldownCourse] = useState<CourseBreakdownItem | null>(null);

  // Dedicated K-Level Full Screen ("normal la full a metha screen lam varuthula same athu pola")
  const [inspectKLevel, setInspectKLevel] = useState<KLevelKey | null>(null);
  // Course section drilldown within inspectKLevel view
  const [selectedKSectionCourse, setSelectedKSectionCourse] = useState<any | null>(null);

  // Dynamic filter options loaded from API
  const [departments, setDepartments] = useState<{ id: number; code: string; name: string }[]>([]);
  const [batches, setBatches] = useState<{ id: number | string; name: string }[]>([]);

  // Fetch filter options dynamically on mount
  useEffect(() => {
    let isMounted = true;
    academicAdminService.getFilters().then((res) => {
      if (!isMounted) return;
      if (res?.departments && res.departments.length > 0) {
        setDepartments(res.departments);
      }
      if (res?.batches && res.batches.length > 0) {
        setBatches(res.batches.map((b) => ({ id: b.id, name: b.name })));
      } else if (res?.academic_years && res.academic_years.length > 0) {
        setBatches(res.academic_years.map((y) => ({ id: y.year, name: y.year })));
      }
    }).catch((err) => {
      console.error("Failed to load filter options from API:", err);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Data state
  const [data, setData] = useState<TeachingLearningEffectivenessData | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(true);

  // Modals for "Detail" clicks
  const [showClassroomModal, setShowClassroomModal] = useState<boolean>(false);
  const [showCourseModal, setShowCourseModal] = useState<boolean>(false);
  const [showAiModal, setShowAiModal] = useState<boolean>(false);

  // Toggle a K-level in overview mode
  const toggleKLevel = (k: KLevelKey) => {
    setActiveKLevels((prev) => {
      if (prev.includes(k)) {
        if (prev.length === 1) return prev; // Keep at least one
        return prev.filter((item) => item !== k);
      } else {
        return [...prev, k].sort(
          (a, b) => ALL_K_LEVELS.indexOf(a) - ALL_K_LEVELS.indexOf(b)
        );
      }
    });
  };

  // Fetch data
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    academicAdminService
      .getTeachingLearningEffectiveness(
        type,
        selectedDept,
        selectedBatch,
        selectedTest,
        activeKLevels,
        targetBenchmark
      )
      .then((res) => {
        if (isMounted) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch teaching learning effectiveness:", err);
        if (isMounted) {
          setLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [type, selectedDept, selectedBatch, selectedTest, activeKLevels, targetBenchmark]);

  // Reset course drilldown when department or batch filter changes
  useEffect(() => {
    setSelectedDrilldownCourse(null);
  }, [selectedDept, selectedBatch]);

  // Filtered course breakdown list
  const displayedCourses: CourseBreakdownItem[] = useMemo(() => {
    if (!data?.course_breakdown) return [];
    if (selectedDept === "ALL") return data.course_breakdown;
    return data.course_breakdown.filter(
      (c) => c.department_code === selectedDept || !c.department_code
    );
  }, [data?.course_breakdown, selectedDept]);

  // Prepared current report metrics for the AI Task (injected with past memory)
  const aiReportInput: GenerateSuggestionInput = useMemo(() => {
    return {
      type: type === "cia" ? "CIA" : "MCQ",
      department: selectedDept,
      batch: selectedBatch,
      testFilter: selectedTest,
      targetBenchmark,
      totalAttainmentPct: data?.total_attainment_pct ?? 0,
      participationPct: data?.participation?.participation_pct ?? 0,
      kLevels: data?.k_level_performance ?? { K1: 0, K2: 0, K3: 0, K4: 0, K5: 0, K6: 0 },
      coursesPushingUp: (data?.courses_pushing_up || []).map((c) => ({
        course_code: c.course_code,
        course_name: c.course_name,
        department_code: c.department_code,
        attainment_pct: c.attainment_pct,
        semester: c.semester,
      })),
      coursesPullingDown: (data?.courses_pulling_down || []).map((c) => ({
        course_code: c.course_code,
        course_name: c.course_name,
        department_code: c.department_code,
        attainment_pct: c.attainment_pct,
        semester: c.semester,
      })),
      departmentBreakdown: (data?.department_breakdown || []).map((d) => ({
        department_code: d.department_code,
        department_name: d.department_name,
        total_pct: d.total_pct,
      })),
    };
  }, [type, selectedDept, selectedBatch, selectedTest, targetBenchmark, data]);

  // ==========================================
  // Computed specifically for inspectKLevel when full-screen is active
  // ==========================================
  const kCourses = useMemo(() => {
    if (!data?.course_breakdown || !inspectKLevel) return [];
    return data.course_breakdown
      .filter((c) => selectedDept === "ALL" || c.department_code === selectedDept || !c.department_code)
      .map((c) => {
        const kScore = c.k_levels[inspectKLevel] ?? 0;
        return {
          ...c,
          kScore,
          isAbove: kScore >= targetBenchmark,
        };
      })
      .sort((a, b) => b.kScore - a.kScore);
  }, [data?.course_breakdown, inspectKLevel, targetBenchmark, selectedDept]);

  const kClassrooms = useMemo(() => {
    if (!data?.course_breakdown || !inspectKLevel) return [];
    const sections: any[] = [];
    data.course_breakdown
      .filter((c) => selectedDept === "ALL" || c.department_code === selectedDept || !c.department_code)
      .forEach((c) => {
        (c.instances || []).forEach((inst) => {
          const kScore = inst.k_levels[inspectKLevel] ?? c.k_levels[inspectKLevel] ?? 0;
          sections.push({
            id: inst.id,
            name: inst.name,
            course_code: c.course_code,
            course_title: c.course_title,
            department_code: c.department_code,
            faculty_name: inst.faculty_name,
            student_count: inst.student_count,
            kScore,
            isAbove: kScore >= targetBenchmark,
          });
        });
      });
    return sections.sort((a, b) => b.kScore - a.kScore);
  }, [data?.course_breakdown, inspectKLevel, targetBenchmark, selectedDept]);

  const kDepartments = useMemo(() => {
    if (!data?.department_breakdown || !inspectKLevel) return [];
    return data.department_breakdown
      .filter((d) => selectedDept === "ALL" || d.department_code === selectedDept)
      .map((d) => {
        const kScore = d.k_levels[inspectKLevel] ?? 0;
        return {
          ...d,
          kScore,
          isAbove: kScore >= targetBenchmark,
        };
      })
      .sort((a, b) => b.kScore - a.kScore);
  }, [data?.department_breakdown, inspectKLevel, targetBenchmark, selectedDept]);

  const kPushingUpCourses = useMemo(() => {
    return kCourses.filter((c) => c.isAbove);
  }, [kCourses]);

  const kPullingDownCourses = useMemo(() => {
    return kCourses.filter((c) => !c.isAbove);
  }, [kCourses]);

  const kPushingUpClassrooms = useMemo(() => {
    return kClassrooms.filter((c) => c.isAbove);
  }, [kClassrooms]);

  const kPullingDownClassrooms = useMemo(() => {
    return kClassrooms.filter((c) => !c.isAbove);
  }, [kClassrooms]);

  // Single K-level Bar Chart for full screen
  const kSingleBarOptions: any = useMemo(() => {
    if (!inspectKLevel) return {};
    const color = K_LEVEL_COLORS[inspectKLevel];
    return {
      chart: {
        type: "bar",
        height: 250,
        toolbar: { show: false },
      },
      plotOptions: {
        bar: {
          horizontal: true,
          barHeight: "50%",
          borderRadius: 6,
          distributed: true,
          dataLabels: { position: "right" },
        },
      },
      colors: [color],
      dataLabels: {
        enabled: true,
        formatter: (val: number) => `${val.toFixed(1)}%`,
        offsetX: 28,
        style: { fontSize: "12px", fontWeight: "bold", colors: ["#334155"] },
      },
      xaxis: {
        categories: [`${inspectKLevel} - ${K_LEVEL_LABELS[inspectKLevel]}`],
        max: 100,
        labels: { formatter: (v: number) => `${v}%` },
      },
      legend: { show: false },
      annotations: {
        xaxis: [
          {
            x: targetBenchmark,
            borderColor: "#ef4444",
            strokeDashArray: 3,
            label: {
              borderColor: "#ef4444",
              style: { color: "#fff", background: "#ef4444", fontSize: "10px" },
              text: `Target: ${targetBenchmark}%`,
            },
          },
        ],
      },
      grid: { borderColor: "#f1f5f9" },
    };
  }, [inspectKLevel, targetBenchmark]);

  const kSingleBarSeries = useMemo(() => {
    if (!data || !inspectKLevel) return [];
    return [
      {
        name: `${inspectKLevel} ${type === "cia" ? "Attainment" : "Score"} %`,
        data: [Number(data.k_level_performance[inspectKLevel] || 0)],
      },
    ];
  }, [data, inspectKLevel]);

  // Horizontal Bar Chart (Total + Active K-Levels) for Overview
  const barSeries = useMemo(() => {
    if (!data) return [];
    const categoriesData: number[] = [data.total_attainment_pct];
    activeKLevels.forEach((k) => {
      categoriesData.push(data.k_level_performance[k] || 0);
    });
    return [
      {
        name: type === "cia" ? "Attainment %" : "Score %",
        data: categoriesData,
      },
    ];
  }, [data, activeKLevels]);

  const barCategories = useMemo(() => {
    return ["Total", ...activeKLevels];
  }, [activeKLevels]);

  const barOptions: any = useMemo(() => {
    const colors = [
      "#0284c7", // Total
      ...activeKLevels.map((k) => K_LEVEL_COLORS[k]),
    ];

    return {
      chart: {
        type: "bar",
        height: 250,
        toolbar: { show: false },
        events: {
          dataPointSelection: (event: any, chartContext: any, config: any) => {
            const idx = config.dataPointIndex;
            if (idx > 0 && barCategories[idx]) {
              const k = barCategories[idx] as KLevelKey;
              setInspectKLevel(k);
            } else if (idx === 0) {
              setInspectKLevel(activeKLevels[0] || "K1");
            }
          },
        },
      },
      plotOptions: {
        bar: {
          horizontal: true,
          barHeight: "55%",
          borderRadius: 5,
          distributed: true,
          dataLabels: { position: "right" },
        },
      },
      colors: colors,
      dataLabels: {
        enabled: true,
        formatter: (val: number) => `${val.toFixed(1)}%`,
        offsetX: 28,
        style: { fontSize: "11px", fontWeight: "bold", colors: ["#334155"] },
      },
      xaxis: {
        categories: barCategories,
        max: 100,
        labels: { formatter: (v: number) => `${v}%` },
      },
      legend: { show: false },
      annotations: {
        xaxis: [
          {
            x: targetBenchmark,
            borderColor: "#ef4444",
            strokeDashArray: 3,
            label: {
              borderColor: "#ef4444",
              style: { color: "#fff", background: "#ef4444", fontSize: "10px" },
              text: `Target: ${targetBenchmark}%`,
            },
          },
        ],
      },
      grid: { borderColor: "#f1f5f9" },
    };
  }, [barCategories, activeKLevels, targetBenchmark]);

  // Participation Donut Chart
  const pieSeries = useMemo(() => {
    if (!data) return [0, 0];
    return [data.participation.attended_count, data.participation.absent_count];
  }, [data]);

  const pieOptions: any = useMemo(() => {
    return {
      chart: {
        type: "donut",
        height: 250,
      },
      labels: ["Attended Test", "Absent / Not Attended"],
      colors: ["#10b981", "#ef4444"],
      legend: { position: "bottom", fontSize: "12px" },
      dataLabels: {
        enabled: true,
        formatter: (val: number, opts: any) => {
          return `${opts.w.globals.series[opts.seriesIndex]} (${val.toFixed(1)}%)`;
        },
      },
      plotOptions: {
        pie: {
          donut: {
            size: "65%",
            labels: {
              show: true,
              total: {
                show: true,
                label: "Participation",
                formatter: () => `${data?.participation.participation_pct}%`,
              },
            },
          },
        },
      },
    };
  }, [data]);

  const hasEvaluatedMarks = useMemo(() => {
    if (!data) return false;
    if (data.total_attainment_pct > 0) return true;
    return Object.values(data.k_level_performance).some((v) => Number(v) > 0);
  }, [data]);

  if (loading || !data) {
    return (
      <div className="p-12 text-center bg-white dark:bg-[#1a2234] rounded-2xl border border-gray-100 dark:border-gray-800">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-gray-500 font-medium">Loading Academic Effectiveness Analytics...</p>
      </div>
    );
  }

  const kScore = inspectKLevel ? Number(data.k_level_performance[inspectKLevel] || 0) : 0;
  const isKMet = kScore >= targetBenchmark;

  return (
    <div className="space-y-6">
      {/* ── UNIFIED TOP HEADER & FILTERS BAR (Consistent in both Overview & Detail views) ── */}
      <div className="bg-white dark:bg-[#1a2234] rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-gray-800">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-primary/10 text-primary">
                {type === "cia" ? "Continuous Internal Assessments (CIA)" : "Multiple Choice Questions (MCQ)"}
              </span>
              <h2 className="text-lg lg:text-xl font-bold text-gray-900 dark:text-white">
                {data.title}
              </h2>
              {inspectKLevel && (
                <span
                  className="px-2.5 py-0.5 rounded-full text-xs font-bold text-white shadow-xs"
                  style={{ backgroundColor: K_LEVEL_COLORS[inspectKLevel] }}
                >
                  {inspectKLevel} Detail View
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Select K-levels and filters to evaluate cognitive mastery and drill down into courses and classrooms.
            </p>
          </div>

          {/* AI Academic Intelligence Button & Narrowing indicator */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={() => setShowAiModal(true)}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-sm hover:shadow-md transition-all scale-100 hover:scale-105"
              title="Open AI Academic Intelligence: 6 Improvement & Analytics Points"
            >
              <svg className="w-4 h-4 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>AI Advisory & 6 Improvement Points</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-white/20 text-white">
                AI Task
              </span>
            </button>

            {selectedDept !== "ALL" && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-xs">
                <span className="text-primary font-semibold">
                  Narrowed down to: <strong>{selectedDept}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDept("ALL");
                    setSelectedDrilldownCourse(null);
                  }}
                  className="text-primary hover:text-primary-dark font-bold ml-1 text-sm leading-none"
                  title="Clear department filter"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Cognitive Bloom Levels Row & Dropdown Filters (Identical & Unified in all screens) */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          {/* Cognitive Bloom Levels Pills */}
          <div className="flex items-center flex-wrap gap-2">
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 mr-1">
              Cognitive Bloom Levels:
            </span>

            {/* "All" Overview Button */}
            <button
              type="button"
              onClick={() => {
                setInspectKLevel(null);
                setSelectedKSectionCourse(null);
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all shadow-xs ${
                inspectKLevel === null
                  ? "bg-primary text-white shadow-md scale-105"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
              title="View all cognitive levels overview"
            >
              All
            </button>

            {ALL_K_LEVELS.map((k) => {
              const isInspected = inspectKLevel === k;
              const isActive = activeKLevels.includes(k);
              const isHighlighted = inspectKLevel ? isInspected : isActive;

              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => {
                    if (inspectKLevel) {
                      setInspectKLevel(k);
                      setSelectedKSectionCourse(null);
                    } else {
                      toggleKLevel(k);
                    }
                  }}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-xs ${
                    isHighlighted
                      ? "text-white shadow-md scale-105"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                  style={{
                    backgroundColor: isHighlighted ? K_LEVEL_COLORS[k] : undefined,
                  }}
                  title={
                    inspectKLevel
                      ? `Switch to dedicated ${k} view (${K_LEVEL_LABELS[k]})`
                      : `${K_LEVEL_LABELS[k]} (Click to toggle filter)`
                  }
                >
                  <span>{k}</span>
                  {isHighlighted && (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>

          {/* Filter Dropdowns (Target, Department, Batch, Scope) */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Target Benchmark (Interactive Input & Quick Presets) */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-semibold text-gray-700 dark:text-gray-300">Target:</span>
              <div className="relative inline-flex items-center">
                <input
                  type="number"
                  min={1}
                  max={100}
                  step={5}
                  value={targetBenchmark}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (!isNaN(val) && val >= 1 && val <= 100) {
                      setTargetBenchmark(val);
                    }
                  }}
                  className="w-16 py-1 pl-2.5 pr-6 text-xs font-black text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
                />
                <span className="absolute right-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 pointer-events-none">
                  %
                </span>
              </div>
              <select
                value={[40, 50, 60, 65, 70, 75, 80].includes(targetBenchmark) ? targetBenchmark : "custom"}
                onChange={(e) => {
                  if (e.target.value !== "custom") {
                    setTargetBenchmark(Number(e.target.value));
                  }
                }}
                className="form-select text-xs py-1 px-2 rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium"
                title="Select preset benchmark target"
              >
                <option value={40}>40%</option>
                <option value={50}>50% (Default)</option>
                <option value={60}>60%</option>
                <option value={65}>65%</option>
                <option value={70}>70%</option>
                <option value={75}>75%</option>
                <option value={80}>80%</option>
                {![40, 50, 60, 65, 70, 75, 80].includes(targetBenchmark) && (
                  <option value="custom">{targetBenchmark}% (Custom)</option>
                )}
              </select>
            </div>

            {/* Department Dropdown */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-semibold text-gray-700 dark:text-gray-300">Department:</span>
              <select
                value={selectedDept}
                onChange={(e) => {
                  setSelectedDept(e.target.value);
                  setSelectedDrilldownCourse(null);
                }}
                className="form-select text-xs py-1.5 px-3 rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-medium"
              >
                <option value="ALL">ALL Departments</option>
                {departments.map((d) => (
                  <option key={d.code} value={d.code}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Batch Dropdown */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-semibold text-gray-700 dark:text-gray-300">Batch:</span>
              <select
                value={selectedBatch}
                onChange={(e) => {
                  setSelectedBatch(e.target.value);
                  setSelectedDrilldownCourse(null);
                }}
                className="form-select text-xs py-1.5 px-3 rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-medium"
              >
                <option value="ALL">ALL Batches</option>
                {batches.map((b) => (
                  <option key={String(b.id)} value={b.name}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Scope Dropdown */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-semibold text-gray-700 dark:text-gray-300">
                {type === "cia" ? "CIA Scope:" : "MCQ Scope:"}
              </span>
              <select
                value={selectedTest}
                onChange={(e) => setSelectedTest(e.target.value)}
                className="form-select text-xs py-1.5 px-3 rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-medium"
              >
                <option value="ALL">ALL Tests</option>
                {type === "cia" ? (
                  <>
                    <option value="CIA I">CIA I</option>
                    <option value="CIA II">CIA II</option>
                    <option value="CIA III">CIA III</option>
                  </>
                ) : (
                  <>
                    <option value="MCQ 1">MCQ Test 1</option>
                    <option value="MCQ 2">MCQ Test 2</option>
                    <option value="MCQ 3">MCQ Test 3</option>
                  </>
                )}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ── Active K-Level Detail Notice Bar (Only shown in dedicated view) ── */}
      {inspectKLevel && (
        <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/90 to-purple-50/90 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-purple-950/30 border border-blue-200/80 dark:border-blue-800/80 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs animate-fadeIn">
          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => setInspectKLevel(null)}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 hover:bg-primary hover:text-white transition-all inline-flex items-center gap-1.5 shadow-xs"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back to All K-Levels Overview</span>
            </button>
            <div className="flex items-center gap-2">
              <span
                className="px-2.5 py-1 rounded-lg text-xs font-black text-white shadow-xs"
                style={{ backgroundColor: K_LEVEL_COLORS[inspectKLevel] }}
              >
                {inspectKLevel}
              </span>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                {inspectKLevel} — {K_LEVEL_LABELS[inspectKLevel]} Dedicated Analysis
              </h3>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                ({type === "cia" ? "Attainment" : "Score"}: <strong>{kScore.toFixed(1)}%</strong> | Target: <strong>{targetBenchmark}%</strong>)
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span>Viewing individual Bloom level. Click <strong>All</strong> in Cognitive Bloom Levels above to return.</span>
          </div>
        </div>
      )}

      {/* ── Main Content Body: Dedicated K-Level Screen OR All Overview ── */}
      {inspectKLevel ? (
        <div className="space-y-6 animate-fadeIn">
        {/* -- ROW 1: K-Level Bar Card, Participation Donut, Classrooms Push/Pull in K -- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Card 1: K-Level Attainment Horizontal Bar */}
          <div className="lg:col-span-4 bg-white dark:bg-[#1a2234] rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  {inspectKLevel} Cognitive {type === "cia" ? "Attainment" : "Performance"}
                </h3>
                <span className="text-xs font-extrabold" style={{ color: K_LEVEL_COLORS[inspectKLevel] }}>
                  {kScore.toFixed(1)}%
                </span>
              </div>
              <p className="text-[11px] text-gray-400 mb-2">
                Evaluated {type === "cia" ? "attainment" : "score"} % for {inspectKLevel} against {targetBenchmark}% target benchmark.
              </p>
              <div className="min-h-[250px]">
                <ReactApexChart
                  options={kSingleBarOptions}
                  series={kSingleBarSeries}
                  type="bar"
                  height={250}
                />
              </div>
            </div>

            <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-[11px]">
              <span className="text-gray-500">Target Line: {targetBenchmark}%</span>
              <span
                className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                  isKMet
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                    : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                }`}
              >
                {isKMet ? `Target Met (+${(kScore - targetBenchmark).toFixed(1)}%)` : `Below Target (${(kScore - targetBenchmark).toFixed(1)}%)`}
              </span>
            </div>
          </div>

          {/* Card 2: Test Participation Donut */}
          <div className="lg:col-span-4 bg-white dark:bg-[#1a2234] rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  Test Participation for {inspectKLevel}
                </h3>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40">
                  {data.participation.participation_pct}% Attended
                </span>
              </div>
              <p className="text-[11px] text-gray-400 mb-2">
                Evaluated student attendance across {data.participation.total_enrolled} enrolled students.
              </p>
              {data.participation.total_enrolled === 0 ? (
                <div className="h-[250px] flex flex-col items-center justify-center text-center p-4">
                  <span className="text-xs text-gray-500 font-semibold">No records found</span>
                  <span className="text-[11px] text-gray-400 mt-1">No attendance records found for this scope.</span>
                </div>
              ) : (
                <div className="min-h-[250px]">
                  <ReactApexChart options={pieOptions} series={pieSeries} type="donut" height={250} />
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-gray-100 dark:border-gray-800 grid grid-cols-2 text-center text-xs">
              <div className="border-r border-gray-100 dark:border-gray-800 pr-2">
                <span className="text-[10px] text-gray-400 block">Attended</span>
                <strong className="text-emerald-600">{data.participation.attended_count} Students</strong>
              </div>
              <div className="pl-2">
                <span className="text-[10px] text-gray-400 block">Absent</span>
                <strong className="text-rose-600">{data.participation.absent_count} Students</strong>
              </div>
            </div>
          </div>

          {/* Card 3: Classrooms Pushing UP / Pulling Down specifically in this K-Level */}
          <div className="lg:col-span-4 bg-white dark:bg-[#1a2234] rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  Classrooms Pushing UP / Down in {inspectKLevel}
                </h3>
                <span className="text-xs font-bold text-primary">
                  {kClassrooms.length} Sections
                </span>
              </div>

              <div className="space-y-3">
                {/* Pushing Up */}
                <div className="rounded-xl border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20 p-3">
                  <div className="text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center justify-between mb-1.5">
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                      </svg>
                      Pushing UP ({inspectKLevel} &ge; {targetBenchmark}%)
                    </span>
                    <span>{inspectKLevel} Score</span>
                  </div>
                  <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                    {kPushingUpClassrooms.length === 0 ? (
                      <div className="py-3 text-center text-xs text-gray-400 font-medium">No records found</div>
                    ) : (
                      kPushingUpClassrooms.map((c, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-white dark:bg-gray-800/80 hover:bg-emerald-100/60 transition-colors"
                        >
                          <div className="truncate pr-2">
                            <span className="font-bold text-gray-800 dark:text-gray-200">{c.name}</span>
                            <span className="text-[10px] text-gray-400 block truncate">{c.faculty_name}</span>
                          </div>
                          <span className="font-extrabold text-emerald-600 shrink-0">
                            {c.kScore.toFixed(1)}%
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Pulling Down */}
                <div className="rounded-xl border border-rose-100 dark:border-rose-900/40 bg-rose-50/40 dark:bg-rose-950/20 p-3">
                  <div className="text-xs font-bold text-rose-700 dark:text-rose-300 flex items-center justify-between mb-1.5">
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                      Pulling Down ({inspectKLevel} &lt; {targetBenchmark}%)
                    </span>
                    <span>{inspectKLevel} Score</span>
                  </div>
                  <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                    {kPullingDownClassrooms.length === 0 ? (
                      <div className="py-3 text-center text-xs text-gray-400 font-medium">No records found</div>
                    ) : (
                      kPullingDownClassrooms.map((c, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-white dark:bg-gray-800/80 hover:bg-rose-100/60 transition-colors"
                        >
                          <div className="truncate pr-2">
                            <span className="font-bold text-gray-800 dark:text-gray-200">{c.name}</span>
                            <span className="text-[10px] text-gray-400 block truncate">{c.faculty_name}</span>
                          </div>
                          <span className="font-extrabold text-rose-600 shrink-0">
                            {c.kScore.toFixed(1)}%
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 text-right">
              <span className="text-[11px] text-gray-400 font-medium">
                Benchmark: {targetBenchmark}%
              </span>
            </div>
          </div>
        </div>

        {/* -- ROW 2: Department-Wise K Breakdown, Year Cohort Breakdown, Courses Push/Down in K -- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Department-Wise Table for this K */}
          <div className="lg:col-span-5 bg-white dark:bg-[#1a2234] rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  Department-Wise {inspectKLevel} Breakdown
                </h3>
                <p className="text-[11px] text-gray-400">
                  Performance across departments in {inspectKLevel}.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-400 uppercase tracking-wider font-semibold">
                    <th className="py-2.5 px-3">Dept</th>
                    <th className="py-2.5 px-2 text-center">Students</th>
                    <th className="py-2.5 px-3 text-right" style={{ color: K_LEVEL_COLORS[inspectKLevel] }}>
                      {inspectKLevel} %
                    </th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {kDepartments.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-xs text-gray-400 font-medium">
                        No records found
                      </td>
                    </tr>
                  ) : (
                    kDepartments.map((d) => (
                      <tr key={d.department_code} className="hover:bg-primary/5 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-gray-900 dark:text-white">
                          <span className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 mr-1.5 font-bold text-[10px]">
                            {d.department_code}
                          </span>
                          <span className="text-gray-600 dark:text-gray-300 font-normal">
                            {d.department_name}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-center text-gray-500 font-semibold">
                          {d.student_count}
                        </td>
                        <td className="py-2.5 px-3 text-right font-black text-sm" style={{ color: K_LEVEL_COLORS[inspectKLevel] }}>
                          {d.kScore.toFixed(1)}%
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                              d.isAbove
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                                : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                            }`}
                          >
                            {d.isAbove ? "Above Target" : "Below Target"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Year Cohort Table for this K */}
          <div className="lg:col-span-3 bg-white dark:bg-[#1a2234] rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  Year-Wise {inspectKLevel} Cohort
                </h3>
                <p className="text-[11px] text-gray-400">
                  Cohort achievement in {inspectKLevel}.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-400 uppercase tracking-wider font-semibold">
                    <th className="py-2.5 px-2">Cohort</th>
                    <th className="py-2.5 px-2 text-right" style={{ color: K_LEVEL_COLORS[inspectKLevel] }}>
                      {inspectKLevel} %
                    </th>
                    <th className="py-2.5 px-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {data.year_breakdown.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-xs text-gray-400 font-medium">
                        No records found
                      </td>
                    </tr>
                  ) : (
                    data.year_breakdown.map((row) => {
                      const val = Number(row.k_levels[inspectKLevel] || 0);
                      const isAbv = val >= targetBenchmark;
                      return (
                        <tr key={row.year_label} className="hover:bg-gray-50/80 transition-colors">
                          <td className="py-2.5 px-2 font-bold text-gray-900 dark:text-white">
                            {row.year_label}
                          </td>
                          <td className="py-2.5 px-2 text-right font-black" style={{ color: K_LEVEL_COLORS[inspectKLevel] }}>
                            {val.toFixed(1)}%
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <span
                              className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                isAbv
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-rose-50 text-rose-700"
                              }`}
                            >
                              {isAbv ? "Met" : "Below"}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Courses Pushing UP / Pulling Down in this K */}
          <div className="lg:col-span-4 bg-white dark:bg-[#1a2234] rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  Courses Pushing UP / Down in {inspectKLevel}
                </h3>
                <span className="text-xs font-bold text-primary">
                  {kCourses.length} Courses
                </span>
              </div>

              <div className="space-y-3">
                {/* Pushing Up */}
                <div className="rounded-xl border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20 p-3">
                  <div className="text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center justify-between mb-1.5">
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                      </svg>
                      Pushing UP ({inspectKLevel} &ge; {targetBenchmark}%)
                    </span>
                    <span>{inspectKLevel} Score</span>
                  </div>
                  <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                    {kPushingUpCourses.length === 0 ? (
                      <div className="py-3 text-center text-xs text-gray-400 font-medium">No records found</div>
                    ) : (
                      kPushingUpCourses.map((c) => (
                        <div
                          key={c.course_code}
                          className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-white dark:bg-gray-800/80 hover:bg-emerald-100/60 transition-colors"
                        >
                          <div className="truncate pr-2">
                            <span className="font-bold text-gray-800 dark:text-gray-200">{c.course_code}</span>
                            <span className="text-[10px] text-gray-400 block truncate">{c.course_name}</span>
                          </div>
                          <span className="font-extrabold text-emerald-600 shrink-0">
                            {c.kScore.toFixed(1)}%
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Pulling Down */}
                <div className="rounded-xl border border-rose-100 dark:border-rose-900/40 bg-rose-50/40 dark:bg-rose-950/20 p-3">
                  <div className="text-xs font-bold text-rose-700 dark:text-rose-300 flex items-center justify-between mb-1.5">
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                      Pulling Down ({inspectKLevel} &lt; {targetBenchmark}%)
                    </span>
                    <span>{inspectKLevel} Score</span>
                  </div>
                  <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                    {kPullingDownCourses.length === 0 ? (
                      <div className="py-3 text-center text-xs text-gray-400 font-medium">No records found</div>
                    ) : (
                      kPullingDownCourses.map((c) => (
                        <div
                          key={c.course_code}
                          className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-white dark:bg-gray-800/80 hover:bg-rose-100/60 transition-colors"
                        >
                          <div className="truncate pr-2">
                            <span className="font-bold text-gray-800 dark:text-gray-200">{c.course_code}</span>
                            <span className="text-[10px] text-gray-400 block truncate">{c.course_name}</span>
                          </div>
                          <span className="font-extrabold text-rose-600 shrink-0">
                            {c.kScore.toFixed(1)}%
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 text-right">
              <span className="text-[11px] text-gray-400 font-medium">
                Benchmark: {targetBenchmark}%
              </span>
            </div>
          </div>
        </div>

        {/* -- ROW 3: Full Course & Section Breakdown Table in this K-Level -- */}
        <div className="bg-white dark:bg-[#1a2234] rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-gray-800">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-black text-white uppercase tracking-wider"
                  style={{ backgroundColor: K_LEVEL_COLORS[inspectKLevel] }}
                >
                  {inspectKLevel} Detail
                </span>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  {selectedKSectionCourse
                    ? `Classroom Sections for ${selectedKSectionCourse.course_code} - ${selectedKSectionCourse.course_title} in ${inspectKLevel}`
                    : `Courses Performance in ${inspectKLevel} (${K_LEVEL_LABELS[inspectKLevel]})`}
                </h3>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                {selectedKSectionCourse
                  ? `Classroom section level performance breakdown for ${inspectKLevel} against ${targetBenchmark}% target benchmark.`
                  : `Full list of courses evaluated for ${inspectKLevel} against ${targetBenchmark}% target benchmark.`}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {selectedKSectionCourse && (
                <button
                  type="button"
                  onClick={() => setSelectedKSectionCourse(null)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all shadow-xs"
                >
                  &larr; Back to {inspectKLevel} Courses
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setSelectedKSectionCourse(null);
                  setInspectKLevel(null);
                }}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-primary hover:text-white transition-all shadow-xs"
              >
                &larr; Back to Overview
              </button>
            </div>
          </div>

          {selectedKSectionCourse ? (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-primary">
                    {selectedKSectionCourse.course_code} - {selectedKSectionCourse.course_title}
                  </span>
                  <span className="text-gray-400">&bull;</span>
                  <span className="text-gray-500">Dept: {selectedKSectionCourse.department_code}</span>
                  <span className="text-gray-400">&bull;</span>
                  <span className="text-gray-500">Sem {selectedKSectionCourse.semester}</span>
                  <span className="text-gray-400">&bull;</span>
                  <span className="font-bold" style={{ color: K_LEVEL_COLORS[inspectKLevel] }}>
                    Course {inspectKLevel}: {selectedKSectionCourse.kScore.toFixed(1)}%
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedKSectionCourse(null)}
                  className="text-xs font-bold text-primary hover:underline"
                >
                  &larr; Back to All {inspectKLevel} Courses
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-400 uppercase tracking-wider font-semibold">
                      <th className="py-2.5 px-3">Classroom / Section</th>
                      <th className="py-2.5 px-3">Faculty Coordinator</th>
                      <th className="py-2.5 px-2 text-center">Students</th>
                      <th className="py-2.5 px-3 text-right" style={{ color: K_LEVEL_COLORS[inspectKLevel] }}>
                        {inspectKLevel} {type === "cia" ? "Attainment" : "Score"} %
                      </th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {(!selectedKSectionCourse.instances || selectedKSectionCourse.instances.length === 0) ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-xs text-gray-400 font-medium">
                          No classroom sections found for this course.
                        </td>
                      </tr>
                    ) : (
                      selectedKSectionCourse.instances.map((inst: any) => {
                        const instKScore = inst.k_levels?.[inspectKLevel] ?? selectedKSectionCourse.k_levels?.[inspectKLevel] ?? 0;
                        const isInstAbove = instKScore >= targetBenchmark;
                        return (
                          <tr key={inst.id} className="hover:bg-primary/5 transition-colors">
                            <td className="py-3 px-3 font-bold text-gray-900 dark:text-white">
                              {inst.name}
                            </td>
                            <td className="py-3 px-3 text-gray-600 dark:text-gray-300">
                              {inst.faculty_name}
                            </td>
                            <td className="py-3 px-2 text-center font-semibold text-gray-700 dark:text-gray-300">
                              {inst.student_count}
                            </td>
                            <td className="py-3 px-3 text-right font-black text-sm" style={{ color: K_LEVEL_COLORS[inspectKLevel] }}>
                              {instKScore.toFixed(1)}%
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span
                                className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                  isInstAbove
                                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200"
                                    : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200"
                                }`}
                              >
                                {isInstAbove ? "Above Target" : "Below Target"}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right">
                              {type === "cia" && onDrilldownToAttainment && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    onDrilldownToAttainment(
                                      selectedKSectionCourse.department_code,
                                      selectedKSectionCourse.course_code
                                    )
                                  }
                                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-primary/10 hover:bg-primary text-primary hover:text-white transition-all shadow-xs"
                                >
                                  View Attainment Matrix &rarr;
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-400 uppercase tracking-wider font-semibold">
                    <th className="py-2.5 px-3">Course Code</th>
                    <th className="py-2.5 px-3">Course Title</th>
                    <th className="py-2.5 px-2 text-center">Dept</th>
                    <th className="py-2.5 px-2 text-center">Sem</th>
                    <th className="py-2.5 px-3 text-right" style={{ color: K_LEVEL_COLORS[inspectKLevel] }}>
                      {inspectKLevel} {type === "cia" ? "Attainment" : "Score"} %
                    </th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-right">Classrooms</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {kCourses.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-xs text-gray-400 font-medium">
                        No records found
                      </td>
                    </tr>
                  ) : (
                    kCourses.map((c) => (
                      <tr key={c.course_code} className="hover:bg-primary/5 transition-colors">
                        <td className="py-3 px-3 font-extrabold text-primary">
                          {c.course_code}
                        </td>
                        <td className="py-3 px-3 font-semibold text-gray-800 dark:text-gray-200">
                          {c.course_title}
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-[10px] font-bold">
                            {c.department_code}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-center text-gray-500">
                          Sem {c.semester}
                        </td>
                        <td className="py-3 px-3 text-right font-black text-sm" style={{ color: K_LEVEL_COLORS[inspectKLevel] }}>
                          {c.kScore.toFixed(1)}%
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                              c.isAbove
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200"
                                : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200"
                            }`}
                          >
                            {c.isAbove ? "Above Target" : "Below Target"}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedKSectionCourse(c);
                            }}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-primary hover:text-white transition-all shadow-xs"
                            title={`View sections in ${inspectKLevel}`}
                          >
                            {c.instances?.length || 0} Sections &rsaquo;
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
        </div>
      ) : (
        <div className="space-y-6">
      {/* -- ROW 1: K-Level Bar Chart, Participation Donut, Classrooms Push/Pull -- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Horizontal K-Level & Total Bar Chart */}
        <div className="lg:col-span-4 bg-white dark:bg-[#1a2234] rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                Cognitive Mastery by Selected K-Levels
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-primary">
                  Total: {data.total_attainment_pct}%
                </span>
                <button
                  type="button"
                  onClick={() => setInspectKLevel(activeKLevels[0] || "K1")}
                  className="text-xs font-bold text-primary hover:underline cursor-pointer"
                >
                  Detail
                </button>
              </div>
            </div>
            <p className="text-[11px] text-gray-400 mb-2">
              {type === "cia" ? "Attainment %" : "Score %"} across active K-level filters against {targetBenchmark}% target. Click any bar or level below for full screen.
            </p>
            {!hasEvaluatedMarks ? (
              <div className="h-[250px] flex flex-col items-center justify-center text-center p-4">
                <span className="text-xs text-gray-500 font-semibold">No records found</span>
                <span className="text-[11px] text-gray-400 mt-1">
                  No evaluated assessment marks available for this selection.
                </span>
              </div>
            ) : (
              <div className="min-h-[250px] cursor-pointer" title="Click any bar to open its full screen">
                <ReactApexChart
                  key={`benchmark-${targetBenchmark}`}
                  options={barOptions}
                  series={barSeries}
                  type="bar"
                  height={250}
                />
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-[11px] text-gray-500 flex-wrap gap-1">
            <span>Red line = Target ({targetBenchmark}%)</span>
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-[10px] text-gray-400">Inspect:</span>
              {activeKLevels.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setInspectKLevel(k)}
                  className="px-1.5 py-0.5 rounded text-[10px] font-bold text-white hover:scale-105 transition-transform shadow-xs"
                  style={{ backgroundColor: K_LEVEL_COLORS[k] }}
                  title={`Open dedicated ${k} full screen`}
                >
                  {k} ({data.k_level_performance[k] || 0}%) ›
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* PIE Chart on Test Participation */}
        <div className="lg:col-span-4 bg-white dark:bg-[#1a2234] rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                PIE Chart on Test Participation
              </h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40">
                {data.participation.participation_pct}% Attended
              </span>
            </div>
            <p className="text-[11px] text-gray-400 mb-2">
              Evaluated student attendance across {data.participation.total_enrolled} enrolled students.
            </p>
            {data.participation.total_enrolled === 0 ? (
              <div className="h-[250px] flex flex-col items-center justify-center text-center p-4">
                <span className="text-xs text-gray-500 font-semibold">No records found</span>
                <span className="text-[11px] text-gray-400 mt-1">
                  No student attendance recorded for this scope.
                </span>
              </div>
            ) : (
              <div className="min-h-[250px]">
                <ReactApexChart
                  options={pieOptions}
                  series={pieSeries}
                  type="donut"
                  height={250}
                />
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-gray-100 dark:border-gray-800 grid grid-cols-2 text-center text-xs">
            <div className="border-r border-gray-100 dark:border-gray-800 pr-2">
              <span className="text-[10px] text-gray-400 block">Attended</span>
              <strong className="text-emerald-600">{data.participation.attended_count} Students</strong>
            </div>
            <div className="pl-2">
              <span className="text-[10px] text-gray-400 block">Absent</span>
              <strong className="text-rose-600">{data.participation.absent_count} Students</strong>
            </div>
          </div>
        </div>

        {/* Classrooms Pushing UP & Classroom Pulling Down */}
        <div className="lg:col-span-4 bg-white dark:bg-[#1a2234] rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                Classrooms Pushing UP / Pulling Down
              </h3>
              <button
                onClick={() => setShowClassroomModal(true)}
                className="text-xs font-bold text-primary hover:underline"
              >
                Detail
              </button>
            </div>

            {/* Split Tables: Pushing UP and Pulling Down */}
            <div className="space-y-3">
              {/* Pushing Up */}
              <div className="rounded-xl border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20 p-3">
                <div className="text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center justify-between mb-1.5">
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                    Classrooms Pushing UP
                  </span>
                  <span>{type === "cia" ? "Attainment" : "Score"}</span>
                </div>
                <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                  {data.classrooms_pushing_up.length === 0 ? (
                    <div className="py-3 text-center text-xs text-gray-400 font-medium">No records found</div>
                  ) : (
                    data.classrooms_pushing_up.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => type === "cia" && onDrilldownToAttainment && onDrilldownToAttainment(c.department_code, c.course_code)}
                      className={`flex items-center justify-between text-xs p-1.5 rounded-lg bg-white dark:bg-gray-800/80 ${type === "cia" ? "hover:bg-emerald-100/60 dark:hover:bg-emerald-900/40 cursor-pointer" : "cursor-default"} transition-colors`}
                    >
                      <div className="truncate pr-2">
                        <span className="font-bold text-gray-800 dark:text-gray-200">{c.name}</span>
                        <span className="text-[10px] text-gray-400 block truncate">{c.faculty_name}</span>
                      </div>
                      <span className="font-extrabold text-emerald-600 dark:text-emerald-400 shrink-0">
                        {c.attainment_pct}%
                      </span>
                    </div>
                  )))}
                </div>
              </div>

              {/* Pulling Down */}
              <div className="rounded-xl border border-rose-100 dark:border-rose-900/40 bg-rose-50/40 dark:bg-rose-950/20 p-3">
                <div className="text-xs font-bold text-rose-700 dark:text-rose-300 flex items-center justify-between mb-1.5">
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                    Classroom Pulling Down
                  </span>
                  <span>{type === "cia" ? "Attainment" : "Score"}</span>
                </div>
                <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                  {data.classrooms_pulling_down.length === 0 ? (
                    <div className="py-3 text-center text-xs text-gray-400 font-medium">No records found</div>
                  ) : (
                    data.classrooms_pulling_down.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => type === "cia" && onDrilldownToAttainment && onDrilldownToAttainment(c.department_code, c.course_code)}
                      className={`flex items-center justify-between text-xs p-1.5 rounded-lg bg-white dark:bg-gray-800/80 ${type === "cia" ? "hover:bg-rose-100/60 dark:hover:bg-rose-900/40 cursor-pointer" : "cursor-default"} transition-colors`}
                    >
                      <div className="truncate pr-2">
                        <span className="font-bold text-gray-800 dark:text-gray-200">{c.name}</span>
                        <span className="text-[10px] text-gray-400 block truncate">{c.faculty_name}</span>
                      </div>
                      <span className="font-extrabold text-rose-600 dark:text-rose-400 shrink-0">
                        {c.attainment_pct}%
                      </span>
                    </div>
                  )))}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 text-right">
            <button
              onClick={() => setShowClassroomModal(true)}
              className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
            >
              <span>View All Classroom Details</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* -- ROW 2: Department Breakdown Table, Year Breakdown Table, Courses Push/Pull -- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Department Breakdown Table */}
        <div className="lg:col-span-5 bg-white dark:bg-[#1a2234] rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                Department-Wise K-Level Breakdown
              </h3>
              <p className="text-[11px] text-gray-400">
                Click any department row to drill down into its courses.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-400 uppercase tracking-wider font-semibold">
                  <th className="py-2.5 px-3">Dept</th>
                  {activeKLevels.map((k) => (
                    <th key={k} className="py-2.5 px-2 text-center" style={{ color: K_LEVEL_COLORS[k] }}>
                      {k}
                    </th>
                  ))}
                  <th className="py-2.5 px-3 text-right">Total %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {data.department_breakdown.length === 0 ? (
                  <tr>
                    <td colSpan={activeKLevels.length + 2} className="py-8 text-center text-xs text-gray-400 font-medium">
                      No records found
                    </td>
                  </tr>
                ) : (
                  data.department_breakdown.map((row) => {
                  const isSelected = selectedDept === row.department_code;
                  return (
                    <tr
                      key={row.department_code}
                      onClick={() => {
                        setSelectedDept(
                          isSelected ? "ALL" : row.department_code
                        );
                        setSelectedDrilldownCourse(null);
                      }}
                      className={`hover:bg-primary/5 cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-primary/10 font-bold border-l-4 border-primary"
                          : ""
                      }`}
                    >
                      <td className="py-2.5 px-3 font-semibold text-gray-900 dark:text-white">
                        <span className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 mr-1.5 font-bold text-[10px]">
                          {row.department_code}
                        </span>
                        <span className="hidden sm:inline text-gray-600 dark:text-gray-300 font-normal text-[11px]">
                          {row.department_name}
                        </span>
                      </td>

                      {activeKLevels.map((k) => {
                        const val = row.k_levels[k] || 0;
                        const isAbove = val >= targetBenchmark;
                        return (
                          <td
                            key={k}
                            className={`py-2.5 px-2 text-center font-medium ${
                              isAbove ? "text-gray-800 dark:text-gray-200" : "text-rose-500 font-bold"
                            }`}
                          >
                            {val.toFixed(1)}%
                          </td>
                        );
                      })}

                      <td className="py-2.5 px-3 text-right font-bold text-primary">
                        {row.total_pct.toFixed(1)}%
                      </td>
                    </tr>
                  );
                }))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Year Breakdown Table */}
        <div className="lg:col-span-3 bg-white dark:bg-[#1a2234] rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                Year-Wise Cohort Breakdown
              </h3>
              <p className="text-[11px] text-gray-400">
                {type === "cia" ? "Attainment" : "Performance score"} across active K-levels.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-400 uppercase tracking-wider font-semibold">
                  <th className="py-2.5 px-2">Year</th>
                  {activeKLevels.map((k) => (
                    <th key={k} className="py-2.5 px-1.5 text-center" style={{ color: K_LEVEL_COLORS[k] }}>
                      {k}
                    </th>
                  ))}
                  <th className="py-2.5 px-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {data.year_breakdown.length === 0 ? (
                  <tr>
                    <td colSpan={activeKLevels.length + 2} className="py-8 text-center text-xs text-gray-400 font-medium">
                      No records found
                    </td>
                  </tr>
                ) : (
                  data.year_breakdown.map((row) => (
                  <tr
                    key={row.year_label}
                    className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors"
                  >
                    <td className="py-2.5 px-2 font-bold text-gray-900 dark:text-white">
                      {row.year_label}
                    </td>

                    {activeKLevels.map((k) => {
                      const val = row.k_levels[k] || 0;
                      return (
                        <td
                          key={k}
                          className="py-2.5 px-1.5 text-center font-medium text-gray-700 dark:text-gray-300"
                        >
                          {val.toFixed(1)}%
                        </td>
                      );
                    })}

                    <td className="py-2.5 px-2 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {row.total_pct.toFixed(1)}%
                    </td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Courses Pushing Up & Courses Pulling Down */}
        <div className="lg:col-span-4 bg-white dark:bg-[#1a2234] rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                Courses Pushing Up / Pulling Down
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAiModal(true)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-violet-600 dark:text-violet-400 hover:underline"
                  title="Run AI 6 Improvement & Analytics Diagnostics on these courses"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>AI Diagnostics</span>
                </button>
                <span className="text-gray-300 dark:text-gray-600">•</span>
                <button
                  onClick={() => setShowCourseModal(true)}
                  className="text-xs font-bold text-primary hover:underline"
                  title="Open full-screen cards view for courses pulling up and down"
                >
                  Detail
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {/* Courses Pushing Up */}
              <div className="rounded-xl border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20 p-3">
                <div className="text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center justify-between mb-1.5">
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                    Courses Pushing Up
                  </span>
                  <span>{type === "cia" ? "Attainment" : "Score"}</span>
                </div>
                <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                  {data.courses_pushing_up.length === 0 ? (
                    <div className="py-3 text-center text-xs text-gray-400 font-medium">No records found</div>
                  ) : (
                    data.courses_pushing_up.map((c) => (
                    <div
                      key={c.course_code}
                      onClick={() => setShowCourseModal(true)}
                      title="Click to view cards full-screen"
                      className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-white dark:bg-gray-800/80 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/40 cursor-pointer transition-colors"
                    >
                      <div className="truncate pr-2">
                        <span className="font-bold text-gray-800 dark:text-gray-200">{c.course_code}</span>
                        <span className="text-[10px] text-gray-400 block truncate">{c.course_name}</span>
                      </div>
                      <span className="font-extrabold text-emerald-600 dark:text-emerald-400 shrink-0">
                        {c.attainment_pct}%
                      </span>
                    </div>
                  )))}
                </div>
              </div>

              {/* Courses Pulling Down */}
              <div className="rounded-xl border border-rose-100 dark:border-rose-900/40 bg-rose-50/40 dark:bg-rose-950/20 p-3">
                <div className="text-xs font-bold text-rose-700 dark:text-rose-300 flex items-center justify-between mb-1.5">
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                    Courses Pulling Down
                  </span>
                  <span>{type === "cia" ? "Attainment" : "Score"}</span>
                </div>
                <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                  {data.courses_pulling_down.length === 0 ? (
                    <div className="py-3 text-center text-xs text-gray-400 font-medium">No records found</div>
                  ) : (
                    data.courses_pulling_down.map((c) => (
                    <div
                      key={c.course_code}
                      onClick={() => setShowCourseModal(true)}
                      title="Click to view cards full-screen"
                      className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-white dark:bg-gray-800/80 hover:bg-rose-100/60 dark:hover:bg-rose-900/40 cursor-pointer transition-colors"
                    >
                      <div className="truncate pr-2">
                        <span className="font-bold text-gray-800 dark:text-gray-200">{c.course_code}</span>
                        <span className="text-[10px] text-gray-400 block truncate">{c.course_name}</span>
                      </div>
                      <span className="font-extrabold text-rose-600 dark:text-rose-400 shrink-0">
                        {c.attainment_pct}%
                      </span>
                    </div>
                  )))}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 text-right">
            <button
              onClick={() => setShowCourseModal(true)}
              className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
            >
              <span>View All Courses Details</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* ── ROW 3: Dedicated Progressive Drilldown — Course-Wise & Section-Wise Cognitive Mastery (K-Level Breakdown) ── */}
      <div className="bg-white dark:bg-[#1a2234] rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-gray-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                Progressive Cognitive Drilldown
              </span>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                {selectedDrilldownCourse
                  ? `Classroom Sections Breakdown for ${selectedDrilldownCourse.course_code}`
                  : selectedDept !== "ALL"
                  ? `${selectedDept} Department Course-Wise K-Level Breakdown`
                  : "All Courses Cognitive Mastery (K-Level Breakdown)"}
              </h3>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Active Bloom K-levels:{" "}
              {activeKLevels.map((k) => (
                <span
                  key={k}
                  className="inline-block px-1.5 py-0.2 mx-0.5 rounded text-[10px] font-bold text-white"
                  style={{ backgroundColor: K_LEVEL_COLORS[k] }}
                >
                  {k}
                </span>
              ))}{" "}
              against {targetBenchmark}% target. Click a course to inspect its classroom sections.
            </p>
          </div>

          {/* Drilldown Breadcrumb Navigation ("Batch -> Dept -> Course -> Section") */}
          <div className="flex items-center gap-1.5 text-xs bg-gray-50 dark:bg-gray-800/80 px-3 py-1.5 rounded-xl border border-gray-200/60 dark:border-gray-700/60 flex-wrap">
            <span className="text-gray-400 font-medium">Filter Path:</span>
            <span className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold text-[10px]">
              Batch: {selectedBatch}
            </span>
            <span className="text-gray-300">›</span>
            <button
              onClick={() => {
                setSelectedDept("ALL");
                setSelectedDrilldownCourse(null);
              }}
              className={`font-semibold hover:underline ${
                selectedDept === "ALL" ? "text-gray-900 dark:text-white" : "text-primary"
              }`}
            >
              All Depts
            </button>
            {selectedDept !== "ALL" && (
              <>
                <span className="text-gray-300">›</span>
                <button
                  onClick={() => setSelectedDrilldownCourse(null)}
                  className={`font-semibold hover:underline ${
                    !selectedDrilldownCourse ? "text-gray-900 dark:text-white" : "text-primary"
                  }`}
                >
                  {selectedDept}
                </button>
              </>
            )}
            {selectedDrilldownCourse && (
              <>
                <span className="text-gray-300">›</span>
                <span className="font-extrabold text-primary">
                  {selectedDrilldownCourse.course_code}
                </span>
                <button
                  onClick={() => setSelectedDrilldownCourse(null)}
                  className="ml-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 font-bold text-xs"
                  title="Back to course list"
                >
                  ✕
                </button>
              </>
            )}
          </div>
        </div>

        {/* Level 3: When a Course is Selected -> Show Classroom Section Breakdown */}
        {selectedDrilldownCourse ? (
          <div className="space-y-4 animate-fadeIn">
            <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold text-primary uppercase block">Selected Course</span>
                <h4 className="text-base font-extrabold text-gray-900 dark:text-white">
                  {selectedDrilldownCourse.course_code} - {selectedDrilldownCourse.course_title}
                </h4>
                <span className="text-xs text-gray-500">
                  {selectedDrilldownCourse.department_code} • Semester {selectedDrilldownCourse.semester} • Overall {type === "cia" ? "Attainment" : "Score"}:{" "}
                  <strong>{selectedDrilldownCourse.attainment_pct}%</strong>
                </span>
              </div>
              <button
                onClick={() => setSelectedDrilldownCourse(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 transition-colors shadow-sm"
              >
                ← Back to Courses
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-400 uppercase tracking-wider font-semibold">
                    <th className="py-2.5 px-3">Classroom / Section</th>
                    <th className="py-2.5 px-3">Faculty Coordinator</th>
                    <th className="py-2.5 px-2 text-center">Students</th>
                    {activeKLevels.map((k) => (
                      <th
                        key={k}
                        className="py-2.5 px-2 text-center font-bold"
                        style={{ color: K_LEVEL_COLORS[k] }}
                      >
                        {k}
                      </th>
                    ))}
                    <th className="py-2.5 px-3 text-right">{type === "cia" ? "Attainment %" : "Score %"}</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {selectedDrilldownCourse.instances.length === 0 ? (
                    <tr>
                      <td
                        colSpan={activeKLevels.length + 5}
                        className="py-8 text-center text-xs text-gray-400 font-medium"
                      >
                        No records found
                      </td>
                    </tr>
                  ) : (
                    selectedDrilldownCourse.instances.map((inst) => (
                      <tr key={inst.id} className="hover:bg-primary/5 transition-colors">
                        <td className="py-3 px-3 font-bold text-gray-900 dark:text-white">
                          {inst.name}
                        </td>
                        <td className="py-3 px-3 text-gray-600 dark:text-gray-300 font-medium">
                          {inst.faculty_name}
                        </td>
                        <td className="py-3 px-2 text-center text-gray-500 font-semibold">
                          {inst.student_count}
                        </td>
                        {activeKLevels.map((k) => {
                          const val = inst.k_levels[k] ?? selectedDrilldownCourse.k_levels[k] ?? 0;
                          const isAbove = val >= targetBenchmark;
                          return (
                            <td
                              key={k}
                              className={`py-3 px-2 text-center font-bold ${
                                isAbove ? "text-gray-800 dark:text-gray-200" : "text-rose-500"
                              }`}
                            >
                              {val.toFixed(1)}%
                            </td>
                          );
                        })}
                        <td className="py-3 px-3 text-right font-extrabold text-primary text-sm">
                          {inst.attainment_pct.toFixed(1)}%
                        </td>
                        <td className="py-3 px-3 text-right">
                          {type === "cia" && onDrilldownToAttainment && (
                            <button
                              onClick={() =>
                                onDrilldownToAttainment(
                                  selectedDrilldownCourse.department_code,
                                  selectedDrilldownCourse.course_code
                                )
                              }
                              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all shadow-sm"
                            >
                              View Attainment Matrix →
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Level 2: Course-Wise K-Level Breakdown Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-400 uppercase tracking-wider font-semibold">
                  <th className="py-2.5 px-3">Course Code</th>
                  <th className="py-2.5 px-3">Course Title</th>
                  <th className="py-2.5 px-2 text-center">Dept</th>
                  <th className="py-2.5 px-2 text-center">Sem</th>
                  {activeKLevels.map((k) => (
                    <th
                      key={k}
                      className="py-2.5 px-2 text-center font-bold"
                      style={{ color: K_LEVEL_COLORS[k] }}
                    >
                      {k}
                    </th>
                  ))}
                  <th className="py-2.5 px-3 text-right">{type === "cia" ? "Total Attainment %" : "Total Score %"}</th>
                  <th className="py-2.5 px-3 text-center">OBE Status</th>
                  <th className="py-2.5 px-3 text-right">Classrooms</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {displayedCourses.length === 0 ? (
                  <tr>
                    <td
                      colSpan={activeKLevels.length + 7}
                      className="py-8 text-center text-xs text-gray-400 font-medium"
                    >
                      No records found
                    </td>
                  </tr>
                ) : (
                  displayedCourses.map((crs) => {
                    const isAbove = crs.attainment_pct >= targetBenchmark;
                    return (
                      <tr
                        key={crs.course_code}
                        onClick={() => setSelectedDrilldownCourse(crs)}
                        className="hover:bg-primary/5 cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-3 font-extrabold text-primary">
                          {crs.course_code}
                        </td>
                        <td className="py-3 px-3 font-semibold text-gray-800 dark:text-gray-200">
                          {crs.course_title}
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-[10px] font-bold">
                            {crs.department_code}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-center text-gray-500 font-medium">
                          Sem {crs.semester}
                        </td>
                        {activeKLevels.map((k) => {
                          const val = crs.k_levels[k] ?? 0;
                          const isKAbove = val >= targetBenchmark;
                          return (
                            <td
                              key={k}
                              className={`py-3 px-2 text-center font-bold ${
                                isKAbove ? "text-gray-800 dark:text-gray-200" : "text-rose-500"
                              }`}
                            >
                              {val.toFixed(1)}%
                            </td>
                          );
                        })}
                        <td className="py-3 px-3 text-right font-extrabold text-primary text-sm">
                          {crs.attainment_pct.toFixed(1)}%
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                              isAbove
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                                : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                            }`}
                          >
                            {isAbove ? "Above Target" : "Below Target"}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDrilldownCourse(crs);
                            }}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-primary hover:text-white transition-all shadow-sm"
                          >
                            {crs.instances?.length || 0} Sections ›
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>


        </div>
      )}
      {/* Detail Modal for Classrooms */}
      {showClassroomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-[#1a2234] w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 p-6 overflow-hidden max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                All Classrooms Performance Detail
              </h3>
              <button
                onClick={() => setShowClassroomModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg font-bold"
              >
                ×
              </button>
            </div>
            <div className="py-4 overflow-y-auto space-y-2">
              {[...data.classrooms_pushing_up, ...data.classrooms_pulling_down].length === 0 ? (
                <div className="py-8 text-center text-xs text-gray-400 font-medium">No records found</div>
              ) : (
                [...data.classrooms_pushing_up, ...data.classrooms_pulling_down].map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700"
                  >
                    <div>
                      <span className="font-bold text-gray-900 dark:text-white text-sm">{c.name}</span>
                      <span className="text-xs text-gray-400 block">
                        {c.department_code} - {c.course_code} - {c.faculty_name}
                      </span>
                    </div>
                    <div className="text-right">
                      <span
                        className={`text-sm font-extrabold ${
                          c.attainment_pct >= targetBenchmark ? "text-emerald-600" : "text-rose-600"
                        }`}
                      >
                        {c.attainment_pct}%
                      </span>
                      <span className="text-[10px] text-gray-400 block">{c.student_count} Students</span>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="pt-3 border-t border-gray-100 dark:border-gray-800 text-right">
              <button
                onClick={() => setShowClassroomModal(false)}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full-Screen Detail Modal for Courses Pushing Up / Pulling Down (Cards Alone with Ordering & Sorting) */}
      {showCourseModal && (
        <CoursePushPullFullscreenModal
          isOpen={showCourseModal}
          onClose={() => setShowCourseModal(false)}
          type={type}
          targetBenchmark={targetBenchmark}
          coursesPushingUp={data.courses_pushing_up}
          coursesPullingDown={data.courses_pulling_down}
          activeKLevels={activeKLevels}
          department={selectedDept}
          batch={selectedBatch}
          scope={selectedTest}
        />
      )}

      {/* AI Academic Advisory & 6 Key Improvement Points Modal */}
      {data && (
        <AiAcademicAnalyticsModal
          isOpen={showAiModal}
          onClose={() => setShowAiModal(false)}
          reportInput={aiReportInput}
          courseBreakdown={data.course_breakdown}
          departmentBreakdown={data.department_breakdown}
          departments={departments.map((d) => d.code)}
        />
      )}
    </div>
  );
};

export default TeachingLearningEffectivenessView;
