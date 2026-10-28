import React, { useState, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  academicAdminService,
  TeachingLearningEffectivenessData,
  KLevelKey,
  ClassroomPushPullItem,
  CoursePushPullItem,
} from "@/services/academicAdminAnalytics.service";

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

  // Toggle a K-level
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

  // Horizontal Bar Chart (Total + Active K-Levels)
  const barSeries = useMemo(() => {
    if (!data) return [];
    const categoriesData: number[] = [data.total_attainment_pct];
    activeKLevels.forEach((k) => {
      categoriesData.push(data.k_level_performance[k] || 0);
    });
    return [{ name: "Attainment %", data: categoriesData }];
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

  if (loading || !data) {
    return (
      <div className="p-12 text-center bg-white dark:bg-[#1a2234] rounded-2xl border border-gray-100 dark:border-gray-800">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-gray-500 font-medium">Loading Academic Effectiveness Analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* -- Top Header / Filters Bar -- */}
      <div className="bg-white dark:bg-[#1a2234] rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-gray-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-primary/10 text-primary">
                {type === "cia" ? "Continuous Internal Assessments (CIA)" : "Multiple Choice Questions (MCQ)"}
              </span>
              <h2 className="text-lg lg:text-xl font-bold text-gray-900 dark:text-white">
                {data.title}
              </h2>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Select K-levels and filters to evaluate cognitive mastery and identify classrooms & courses pushing up or pulling down.
            </p>
          </div>

          {/* Narrowing status indicator */}
          {selectedDept !== "ALL" && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-xs">
              <span className="text-primary font-semibold">
                Narrowed down to: <strong>{selectedDept}</strong>
              </span>
              <button
                onClick={() => setSelectedDept("ALL")}
                className="text-primary hover:text-primary-dark font-bold ml-1 text-sm leading-none"
                title="Clear department filter"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* 6 K-Level Buttons Row & Dropdown Filters */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          {/* 6 K-Level Buttons */}
          <div className="flex items-center flex-wrap gap-2">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 mr-1">
              Cognitive Bloom Levels:
            </span>
            {ALL_K_LEVELS.map((k) => {
              const isActive = activeKLevels.includes(k);
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => toggleKLevel(k)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm ${
                    isActive
                      ? "text-white shadow-md scale-105"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                  style={{
                    backgroundColor: isActive ? K_LEVEL_COLORS[k] : undefined,
                  }}
                  title={K_LEVEL_LABELS[k]}
                >
                  <span>{k}</span>
                  {isActive && (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>

          {/* Filter Dropdowns (Target, Department, Batch, Test) */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Target Benchmark (50%) */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-semibold text-gray-700 dark:text-gray-300">Target:</span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
                {targetBenchmark}%
              </span>
            </div>

            {/* Department Dropdown (Populated via API) */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-semibold text-gray-700 dark:text-gray-300">Department:</span>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
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

            {/* Batch Dropdown (Populated via API) */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-semibold text-gray-700 dark:text-gray-300">Batch:</span>
              <select
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
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

            {/* Test Filter */}
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

      {/* -- ROW 1: K-Level Bar Chart, Participation Donut, Classrooms Push/Pull -- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Horizontal K-Level & Total Bar Chart */}
        <div className="lg:col-span-4 bg-white dark:bg-[#1a2234] rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                Cognitive Mastery by Selected K-Levels
              </h3>
              <span className="text-xs font-bold text-primary">
                Total: {data.total_attainment_pct}%
              </span>
            </div>
            <p className="text-[11px] text-gray-400 mb-2">
              Attainment % across active K-level filters against 50% target.
            </p>
            <div className="min-h-[250px]">
              <ReactApexChart
                options={barOptions}
                series={barSeries}
                type="bar"
                height={250}
              />
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-[11px] text-gray-500">
            <span>Red dashed line = Target (50%)</span>
            <span>Active Levels: {activeKLevels.join(", ")}</span>
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
            <div className="min-h-[250px]">
              <ReactApexChart
                options={pieOptions}
                series={pieSeries}
                type="donut"
                height={250}
              />
            </div>
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
                  <span>Attainment</span>
                </div>
                <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                  {data.classrooms_pushing_up.length === 0 ? (
                    <div className="py-2 text-center text-[11px] text-gray-400 font-medium">0 classrooms pushing up</div>
                  ) : (
                    data.classrooms_pushing_up.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => onDrilldownToAttainment && onDrilldownToAttainment(c.department_code, c.course_code)}
                      className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-white dark:bg-gray-800/80 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/40 cursor-pointer transition-colors"
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
                  <span>Attainment</span>
                </div>
                <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                  {data.classrooms_pulling_down.length === 0 ? (
                    <div className="py-2 text-center text-[11px] text-gray-400 font-medium">0 classrooms pulling down</div>
                  ) : (
                    data.classrooms_pulling_down.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => onDrilldownToAttainment && onDrilldownToAttainment(c.department_code, c.course_code)}
                      className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-white dark:bg-gray-800/80 hover:bg-rose-100/60 dark:hover:bg-rose-900/40 cursor-pointer transition-colors"
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
                Click any department row to narrow down dashboard.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-400 uppercase tracking-wider font-semibold">
                  <th className="py-2.5 px-3">Dept</th>
                  {activeKLevels.map((k) => (
                    <th key={k} className="py-2.5 px-2 text-center">
                      {k}
                    </th>
                  ))}
                  <th className="py-2.5 px-3 text-right">Total %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {data.department_breakdown.length === 0 ? (
                  <tr>
                    <td colSpan={activeKLevels.length + 2} className="py-6 text-center text-gray-400">
                      0 departments found
                    </td>
                  </tr>
                ) : (
                  data.department_breakdown.map((row) => {
                  const isSelected = selectedDept === row.department_code;
                  return (
                    <tr
                      key={row.department_code}
                      onClick={() =>
                        setSelectedDept(
                          isSelected ? "ALL" : row.department_code
                        )
                      }
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
                Attainment across active K-levels.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-400 uppercase tracking-wider font-semibold">
                  <th className="py-2.5 px-2">Year</th>
                  {activeKLevels.map((k) => (
                    <th key={k} className="py-2.5 px-1.5 text-center">
                      {k}
                    </th>
                  ))}
                  <th className="py-2.5 px-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {data.year_breakdown.length === 0 ? (
                  <tr>
                    <td colSpan={activeKLevels.length + 2} className="py-6 text-center text-gray-400">
                      0 year cohorts found
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
              <button
                onClick={() => setShowCourseModal(true)}
                className="text-xs font-bold text-primary hover:underline"
              >
                Detail
              </button>
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
                  <span>Attainment</span>
                </div>
                <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                  {data.courses_pushing_up.length === 0 ? (
                    <div className="py-2 text-center text-[11px] text-gray-400 font-medium">0 courses pushing up</div>
                  ) : (
                    data.courses_pushing_up.map((c) => (
                    <div
                      key={c.course_code}
                      onClick={() => onDrilldownToAttainment && onDrilldownToAttainment(c.department_code, c.course_code)}
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
                  <span>Attainment</span>
                </div>
                <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                  {data.courses_pulling_down.length === 0 ? (
                    <div className="py-2 text-center text-[11px] text-gray-400 font-medium">0 courses pulling down</div>
                  ) : (
                    data.courses_pulling_down.map((c) => (
                    <div
                      key={c.course_code}
                      onClick={() => onDrilldownToAttainment && onDrilldownToAttainment(c.department_code, c.course_code)}
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

      {/* Detail Modal for Classrooms */}
      {showClassroomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-[#1a2234] w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 p-6 overflow-hidden max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                All Classrooms Performance Detail
              </h3>
              <button onClick={() => setShowClassroomModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg font-bold">×</button>
            </div>
            <div className="py-4 overflow-y-auto space-y-2">
              {[...data.classrooms_pushing_up, ...data.classrooms_pulling_down].map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700"
                >
                  <div>
                    <span className="font-bold text-gray-900 dark:text-white text-sm">{c.name}</span>
                    <span className="text-xs text-gray-400 block">{c.department_code}  -  {c.course_code}  -  {c.faculty_name}</span>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-extrabold ${c.attainment_pct >= 50 ? "text-emerald-600" : "text-rose-600"}`}>
                      {c.attainment_pct}%
                    </span>
                    <span className="text-[10px] text-gray-400 block">{c.student_count} Students</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-3 border-t border-gray-100 dark:border-gray-800 text-right">
              <button onClick={() => setShowClassroomModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg font-bold">×</button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal for Courses */}
      {showCourseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-[#1a2234] w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 p-6 overflow-hidden max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                All Courses Performance Detail
              </h3>
              <button onClick={() => setShowCourseModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg font-bold">×</button>
            </div>
            <div className="py-4 overflow-y-auto space-y-2">
              {[...data.courses_pushing_up, ...data.courses_pulling_down].map((c) => (
                <div
                  key={c.course_code}
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700"
                >
                  <div>
                    <span className="font-bold text-gray-900 dark:text-white text-sm">{c.course_code} - {c.course_name}</span>
                    <span className="text-xs text-gray-400 block">{c.department_code}  -  Semester {c.semester}</span>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-extrabold ${c.attainment_pct >= 50 ? "text-emerald-600" : "text-rose-600"}`}>
                      {c.attainment_pct}%
                    </span>
                    <span className="text-[10px] text-gray-400 block">{c.attainment_pct >= 50 ? "Above Target" : "Below Target"}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-3 border-t border-gray-100 dark:border-gray-800 text-right">
              <button onClick={() => setShowCourseModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg font-bold">×</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeachingLearningEffectivenessView;
