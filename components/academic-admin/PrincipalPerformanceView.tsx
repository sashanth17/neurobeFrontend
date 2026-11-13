import React, { useState, useEffect, useMemo } from "react";
import {
  academicAdminService,
  CourseComparativeData,
  TopClassCohortItem,
  PerformanceOverviewSummary,
  ClassroomComparativeItem,
  CourseBreakdownItem,
} from "@/services/academicAdminAnalytics.service";
import MistakeAnalysisModal from "@/components/academic-admin/MistakeAnalysisModal";

interface PrincipalPerformanceViewProps {
  initialDepartment?: string;
  onNavigateToSuggestions?: () => void;
}

type PerformanceSubTab =
  | "course_faculty_abnormalities"
  | "classroom_multicourse_abnormalities"
  | "course_comparative";

type AbnormalityFilterType = "ALL" | "OUTLIERS_ONLY" | "NEGATIVE_ONLY" | "POSITIVE_ONLY";

const PrincipalPerformanceView: React.FC<PrincipalPerformanceViewProps> = ({
  initialDepartment = "ALL",
  onNavigateToSuggestions,
}) => {
  // Global Filters
  const [selectedBatch, setSelectedBatch] = useState<string>("ALL");
  const [selectedDept, setSelectedDept] = useState<string>(initialDepartment);
  const [selectedMode, setSelectedMode] = useState<"COMBINED" | "CIA" | "MCQ">("COMBINED");
  const [selectedSemester, setSelectedSemester] = useState<string>("ALL");

  // Filter options from backend
  const [departments, setDepartments] = useState<Array<{ id: number; code: string; name: string }>>([]);
  const [batches, setBatches] = useState<Array<{ year: string }>>([]);

  // Active Sub-Tab: "course_faculty_abnormalities" | "classroom_multicourse_abnormalities" | "course_comparative"
  const [activeSubTab, setActiveSubTab] = useState<PerformanceSubTab>("course_faculty_abnormalities");

  // State for Overview Summary
  const [summary, setSummary] = useState<PerformanceOverviewSummary | null>(null);

  // Search & Filter State for Course Faculty Abnormalities
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [outlierFilter, setOutlierFilter] = useState<AbnormalityFilterType>("ALL");

  // State for Courses & Classrooms
  const [courses, setCourses] = useState<CourseComparativeData[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [activeMistakeClass, setActiveMistakeClass] = useState<ClassroomComparativeItem | null>(null);
  const [isMistakeModalOpen, setIsMistakeModalOpen] = useState<boolean>(false);

  // State for Classroom Multi-Course Performance
  const [topClasses, setTopClasses] = useState<TopClassCohortItem[]>([]);
  const [expandedClassKey, setExpandedClassKey] = useState<string | null>(null);

  // Loading & Error States
  const [loading, setLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Load Filter Options
  useEffect(() => {
    academicAdminService.getFilters().then((res) => {
      if (res?.departments) {
        setDepartments(res.departments);
      }
      if (res?.academic_years) {
        setBatches(res.academic_years.map((y) => ({ year: y.year })));
      }
    });
  }, []);

  // Fetch Performance Data
  const fetchData = () => {
    let isMounted = true;
    setFetchError(null);
    setLoading(true);

    Promise.all([
      academicAdminService.getPerformanceOverviewSummary(1, selectedBatch),
      academicAdminService.getCourseComparativeAnalysis(1, selectedBatch, undefined, selectedDept, selectedMode),
      academicAdminService.getTopClassrooms(
        1,
        selectedBatch,
        selectedDept,
        selectedSemester !== "ALL" ? Number(selectedSemester) : undefined
      ),
    ])
      .then(([summaryRes, courseRes, classRes]) => {
        if (!isMounted) return;
        setSummary(summaryRes);
        setCourses(courseRes?.courses || []);
        if (courseRes?.courses && courseRes.courses.length > 0 && selectedCourseId === null) {
          setSelectedCourseId(courseRes.courses[0].course_id);
        }
        setTopClasses(classRes?.top_classes || []);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("Error fetching principal performance data:", err);
        const status = err?.response?.status;
        const detail = err?.response?.data?.detail || err?.message || "Failed to load performance data.";
        if (status === 404) {
          setFetchError("Backend endpoint not found (HTTP 404). Please ensure the backend course-management-service is deployed with the latest performance endpoints and restarted.");
        } else {
          setFetchError(`Server error (${status || "Network"}): ${detail}`);
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  };

  useEffect(() => {
    return fetchData();
  }, [selectedBatch, selectedDept, selectedMode, selectedSemester]);

  // =========================================================================
  // 1. Course-Level Faculty Abnormality Analytics
  // Evaluates every course:
  // - Multiple faculties / classrooms per course
  // - Teachers going down while course passes (Negative Outliers)
  // - Faculties performing better while course struggles (Positive Outliers)
  // =========================================================================
  const analyzedCourseAbnormalities = useMemo(() => {
    return courses.map((crs) => {
      const baselineAttainment = crs.baseline_attainment_pct;
      const baselinePass = crs.baseline_pass_pct;

      // Evaluate each teacher & classroom section
      const evaluatedSections = crs.classroom_comparisons.map((cl) => {
        const deltaAttain = cl.delta_from_baseline;
        const passRate = cl.pass_pct;
        const attain = cl.attainment_pct;

        let abnormalityType: "NEGATIVE_OUTLIER" | "POSITIVE_OUTLIER" | "ON_PAR" = "ON_PAR";
        let diagnosis = "Section aligns with course average.";

        // Abnormality Pattern 1: Dragging Down
        // Course baseline pass rate is acceptable (>= 50%), but this teacher's class dropped to < 50%
        // OR Attainment deficit <= -7% below baseline
        if (passRate < 50.0 || deltaAttain <= -7.0 || (baselinePass >= 60.0 && passRate < 55.0)) {
          abnormalityType = "NEGATIVE_OUTLIER";
          if (baselinePass >= 60.0 && passRate < 50.0) {
            diagnosis = `Critical Drag: Course maintains ${baselinePass}% pass rate, but this section plummeted to ${passRate}% under ${cl.faculty_name || "Instructor"}.`;
          } else if (deltaAttain <= -7.0) {
            diagnosis = `Attainment Deficit: Section lags ${Math.abs(deltaAttain)}% below course benchmark (${attain}% vs ${baselineAttainment}%).`;
          } else {
            diagnosis = `Underperforming section requiring immediate syllabus / teaching review.`;
          }
        }
        // Abnormality Pattern 2: Positive Outlier / Excelling
        // Teacher outperforms course baseline by >= +4% with pass rate >= 70%
        // Or in a struggling course (< 65%), teacher achieves outstanding performance
        else if (deltaAttain >= 4.0 && passRate >= 70.0) {
          abnormalityType = "POSITIVE_OUTLIER";
          if (baselineAttainment < 65.0) {
            diagnosis = `Star Teacher Amidst Struggle: Course averages ${baselineAttainment}%, but ${cl.faculty_name || "Instructor"} achieved ${attain}% (+${deltaAttain}% above course average).`;
          } else {
            diagnosis = `High Performer: Outperformed course baseline by +${deltaAttain}% with a strong ${passRate}% pass rate.`;
          }
        }

        return {
          ...cl,
          abnormalityType,
          diagnosis,
        };
      });

      const negativeOutliers = evaluatedSections.filter((s) => s.abnormalityType === "NEGATIVE_OUTLIER");
      const positiveOutliers = evaluatedSections.filter((s) => s.abnormalityType === "POSITIVE_OUTLIER");
      const hasAbnormality = negativeOutliers.length > 0 || positiveOutliers.length > 0;

      return {
        ...crs,
        evaluatedSections,
        negativeOutliers,
        positiveOutliers,
        hasAbnormality,
      };
    });
  }, [courses]);

  // Filtered Course Abnormalities
  const filteredCourseAbnormalities = useMemo(() => {
    let list = analyzedCourseAbnormalities;

    // Filter by Outlier type
    if (outlierFilter === "OUTLIERS_ONLY") {
      list = list.filter((c) => c.hasAbnormality);
    } else if (outlierFilter === "NEGATIVE_ONLY") {
      list = list.filter((c) => c.negativeOutliers.length > 0);
    } else if (outlierFilter === "POSITIVE_ONLY") {
      list = list.filter((c) => c.positiveOutliers.length > 0);
    }

    // Filter by Search Query (Course code, title, department, or faculty name)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (c) =>
          c.course_code.toLowerCase().includes(q) ||
          c.course_title.toLowerCase().includes(q) ||
          c.department_code.toLowerCase().includes(q) ||
          c.evaluatedSections.some((s) => s.faculty_name.toLowerCase().includes(q))
      );
    }

    return list;
  }, [analyzedCourseAbnormalities, outlierFilter, searchQuery]);

  // Total abnormality counts across all courses
  const totalNegativeOutliersCount = useMemo(() => {
    return analyzedCourseAbnormalities.reduce((acc, c) => acc + c.negativeOutliers.length, 0);
  }, [analyzedCourseAbnormalities]);

  const totalPositiveOutliersCount = useMemo(() => {
    return analyzedCourseAbnormalities.reduce((acc, c) => acc + c.positiveOutliers.length, 0);
  }, [analyzedCourseAbnormalities]);

  // =========================================================================
  // 2. Classroom Multi-Course Performance & Abnormality Analytics
  // One classroom engaged in multiple courses:
  // - Stats about how they perform in each course
  // - Class performing well in many courses failing in certain courses (drop abnormality)
  // =========================================================================
  const analyzedClassroomMultiCourse = useMemo(() => {
    return topClasses.map((cohort) => {
      const classHolisticAttainment = cohort.holistic_attainment_pct;
      const classHolisticPass = cohort.holistic_pass_pct;
      const coursesList = cohort.courses_breakdown || [];

      // Evaluate each course taken by this classroom cohort
      const evaluatedCourses = coursesList.map((crs) => {
        const deltaFromClassAvg = Number((crs.attainment_pct - classHolisticAttainment).toFixed(1));
        let isDropAbnormality = false;
        let isBreakthrough = false;
        let diagnosis = "Performance consistent with class holistic average.";

        // Abnormality: Class performing well overall (>= 60%), but in this course drops by >= 12% or pass < 50%
        if (crs.pass_pct < 50.0 || deltaFromClassAvg <= -12.0) {
          isDropAbnormality = true;
          diagnosis = `Critical Subject Drop: Class averages ${classHolisticAttainment}% across subjects, but dropped to ${crs.attainment_pct}% (${deltaFromClassAvg}% deficit) in this course under ${crs.instructor_name || "Instructor"}.`;
        } else if (deltaFromClassAvg >= 12.0) {
          isBreakthrough = true;
          diagnosis = `Subject Breakthrough: Class scored ${crs.attainment_pct}% (+${deltaFromClassAvg}% higher than multi-subject average).`;
        }

        return {
          ...crs,
          deltaFromClassAvg,
          isDropAbnormality,
          isBreakthrough,
          diagnosis,
        };
      });

      const dropAbnormalities = evaluatedCourses.filter((c) => c.isDropAbnormality);
      const breakthroughs = evaluatedCourses.filter((c) => c.isBreakthrough);

      return {
        ...cohort,
        evaluatedCourses,
        dropAbnormalities,
        breakthroughs,
        hasDropAnomaly: dropAbnormalities.length > 0,
      };
    });
  }, [topClasses]);

  const totalClassroomsWithDropAnomalies = useMemo(() => {
    return analyzedClassroomMultiCourse.filter((c) => c.hasDropAnomaly).length;
  }, [analyzedClassroomMultiCourse]);

  // Map courses to breakdown items for AI Suggestions
  const breakdownCourses: CourseBreakdownItem[] = useMemo(() => {
    return courses.map((c, idx) => ({
      course_id: c.course_id ?? idx + 1,
      course_code: c.course_code,
      course_title: c.course_title,
      course_name: c.course_title,
      department_code: c.department_code,
      semester: 1,
      attainment_pct: c.baseline_attainment_pct,
      total_pct: c.baseline_attainment_pct,
      student_count: c.total_students || 0,
      k_levels: { K1: 0, K2: 0, K3: 0, K4: 0, K5: 0, K6: 0 },
      instances: (c.classroom_comparisons || []).map((cl) => ({
        id: cl.instance_id,
        instance_id: cl.instance_id,
        name: cl.instance_name || "—",
        faculty_name: cl.faculty_name || "—",
        student_count: cl.student_count || 0,
        attainment_pct: cl.attainment_pct || 0,
        total_pct: cl.attainment_pct || 0,
        k_levels: (cl.k_levels as any) || { K1: 0, K2: 0, K3: 0, K4: 0, K5: 0, K6: 0 },
      })),
    }));
  }, [courses]);

  // Selected Course for Section 3
  const currentCourse = useMemo(() => {
    if (!courses || courses.length === 0) return null;
    return courses.find((c) => c.course_id === selectedCourseId) || courses[0];
  }, [courses, selectedCourseId]);

  const handleOpenMistakeModal = (classroom: ClassroomComparativeItem) => {
    setActiveMistakeClass(classroom);
    setIsMistakeModalOpen(true);
  };

  const handleAskSuggestionsClick = () => {
    if (onNavigateToSuggestions) {
      onNavigateToSuggestions();
    }
  };

  return (
    <div className="space-y-6 w-full">
      {/* ── 1. Top Executive KPI Cards (Abnormality & Divergence Focused) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Courses & Faculties Evaluated */}
        <div className="bg-white dark:bg-[#1a2234] rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">
                Total Scope Evaluated
              </span>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-1">
                {courses.length} <span className="text-sm font-semibold text-gray-400">Courses</span>
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {summary?.total_faculties_evaluated ?? 0} teaching faculties tracked
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <span>{selectedMode === "MCQ" ? "Avg College Score:" : "Avg Attainment:"}</span>
            <span className="font-extrabold">
              {summary?.average_faculty_attainment !== undefined ? `${summary.average_faculty_attainment}%` : "—"}
            </span>
          </div>
        </div>

        {/* Card 2: Course Faculty Abnormalities */}
        <div className="bg-white dark:bg-[#1a2234] rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">
                Teacher Divergences
              </span>
              <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
                {totalNegativeOutliersCount + totalPositiveOutliersCount} <span className="text-xs font-semibold text-gray-400">Outliers</span>
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Across multi-teacher courses
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-rose-600 font-extrabold">
              ↓ {totalNegativeOutliersCount} Dragging Down
            </span>
            <span className="text-emerald-600 font-extrabold">
              ↑ {totalPositiveOutliersCount} Star Performers
            </span>
          </div>
        </div>

        {/* Card 3: Classroom Multi-Course Drop Anomalies */}
        <div className="bg-white dark:bg-[#1a2234] rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">
                Class Course Drops
              </span>
              <h3 className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">
                {totalClassroomsWithDropAnomalies} <span className="text-xs font-semibold text-gray-400">Classes</span>
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Passing overall but failed specific subjects
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-purple-600 dark:text-purple-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            <span>Multi-Subject Deficit Alerts</span>
          </div>
        </div>

        {/* Card 4: Critical Divergence & Intervention Alerts */}
        <div className="bg-white dark:bg-[#1a2234] rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">
                Critical Interventions
              </span>
              <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
                {totalNegativeOutliersCount}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Sections failing while course passes
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span>Direct Mistake Diagnostics Available</span>
          </div>
        </div>
      </div>

      {/* ── 2. Filters & Sub-Tab Toolbar ── */}
      <div className="bg-white dark:bg-[#1a2234] rounded-2xl border border-gray-100 dark:border-gray-800 p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        {/* Sub-tab Switcher: Abnormality Focused (Leaderboard Removed as Requested) */}
        <div className="flex items-center bg-gray-100 dark:bg-gray-800/80 p-1.5 rounded-xl border border-gray-200/80 dark:border-gray-700/80 flex-wrap gap-1">
          {/* Sub-Tab 1: Course-Level Faculty Abnormalities */}
          <button
            type="button"
            onClick={() => setActiveSubTab("course_faculty_abnormalities")}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeSubTab === "course_faculty_abnormalities"
                ? "bg-white dark:bg-gray-900 text-primary shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span>1. Course Faculty Abnormalities</span>
          </button>

          {/* Sub-Tab 2: Classroom Multi-Course Abnormalities */}
          <button
            type="button"
            onClick={() => setActiveSubTab("classroom_multicourse_abnormalities")}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeSubTab === "classroom_multicourse_abnormalities"
                ? "bg-white dark:bg-gray-900 text-primary shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span>2. Classroom Multi-Course Abnormalities</span>
          </button>

          {/* Sub-Tab 3: Single Course Diagnostics & Mistake Analysis */}
          <button
            type="button"
            onClick={() => setActiveSubTab("course_comparative")}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeSubTab === "course_comparative"
                ? "bg-white dark:bg-gray-900 text-primary shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            <span>3. Single Course Diagnostics</span>
          </button>
        </div>

        {/* Global Filter Dropdowns */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Batch */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-gray-500 uppercase">Batch:</span>
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="form-select text-xs py-1.5 pl-3 pr-8 min-w-[125px] rounded-lg border-gray-200 dark:border-gray-700 dark:bg-gray-800 font-bold"
            >
              <option value="ALL">All Batches</option>
              {batches.map((b) => (
                <option key={b.year} value={b.year}>
                  {b.year}
                </option>
              ))}
            </select>
          </div>

          {/* Department */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-gray-500 uppercase">Dept:</span>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="form-select text-xs py-1.5 pl-3 pr-8 min-w-[160px] rounded-lg border-gray-200 dark:border-gray-700 dark:bg-gray-800 font-bold"
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d.code} value={d.code}>
                  {d.code} - {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Mode */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-gray-500 uppercase">Mode:</span>
            <select
              value={selectedMode}
              onChange={(e) => setSelectedMode(e.target.value as any)}
              className="form-select text-xs py-1.5 pl-3 pr-8 min-w-[180px] rounded-lg border-gray-200 dark:border-gray-700 dark:bg-gray-800 font-bold"
            >
              <option value="COMBINED">Combined (CIA + MCQ)</option>
              <option value="CIA">CIA Only</option>
              <option value="MCQ">MCQ Only</option>
            </select>
          </div>

          {/* Ask AI for Suggestions Button */}
          <button
            type="button"
            onClick={handleAskSuggestionsClick}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-xs hover:shadow-md transition-all scale-100 hover:scale-105"
            title="Open Principal Suggestions Chatbot"
          >
            <svg className="w-3.5 h-3.5 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>Ask for Suggestions</span>
          </button>
        </div>
      </div>

      {/* Error Alert Banner */}
      {fetchError && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl p-4 text-xs flex items-center justify-between gap-3 text-rose-800 dark:text-rose-200 shadow-sm animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-300 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <span className="font-extrabold block text-rose-900 dark:text-rose-100 text-sm">
                Error Loading Performance Data
              </span>
              <p className="mt-0.5 text-rose-700 dark:text-rose-300 font-medium">{fetchError}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={fetchData}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shrink-0 transition-colors shadow-xs"
          >
            Retry Request
          </button>
        </div>
      )}

      {/* Loading Indicator */}
      {loading && (
        <div className="flex items-center justify-center p-12 bg-white dark:bg-[#1a2234] rounded-2xl border border-gray-100 dark:border-gray-800">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          <span className="ml-3 text-xs font-bold text-gray-600 dark:text-gray-400">
            Calculating principal abnormality analytics...
          </span>
        </div>
      )}

      {/* ── 3. Sub-Tab Content ── */}
      {!loading && (
        <>
          {/* ========================================================================= */}
          {/* SUB-TAB 1: Course-Level Faculty Abnormality Detection (Across All Courses) */}
          {/* Replaces the old Leaderboard: Shows multiple classrooms per course,       */}
          {/* teachers performing better while others drop, or teacher classes going down */}
          {/* ========================================================================= */}
          {activeSubTab === "course_faculty_abnormalities" && (
            <div className="space-y-6">
              {/* Abnormality Filter Bar & Search */}
              <div className="bg-white dark:bg-[#1a2234] rounded-2xl border border-gray-100 dark:border-gray-800 p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-black uppercase tracking-wider text-gray-400 mr-1">
                    Filter Outliers:
                  </span>
                  <button
                    type="button"
                    onClick={() => setOutlierFilter("ALL")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      outlierFilter === "ALL"
                        ? "bg-primary text-white shadow-xs"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                    }`}
                  >
                    All Courses ({analyzedCourseAbnormalities.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setOutlierFilter("OUTLIERS_ONLY")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      outlierFilter === "OUTLIERS_ONLY"
                        ? "bg-amber-600 text-white shadow-xs"
                        : "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                    }`}
                  >
                    ⚡ All Abnormalities (
                    {analyzedCourseAbnormalities.filter((c) => c.hasAbnormality).length}
                    )
                  </button>
                  <button
                    type="button"
                    onClick={() => setOutlierFilter("NEGATIVE_ONLY")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      outlierFilter === "NEGATIVE_ONLY"
                        ? "bg-rose-600 text-white shadow-xs"
                        : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                    }`}
                  >
                    🚨 Dragging Down / At-Risk ({totalNegativeOutliersCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setOutlierFilter("POSITIVE_ONLY")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      outlierFilter === "POSITIVE_ONLY"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                    }`}
                  >
                    ⭐ Star Performers ({totalPositiveOutliersCount})
                  </button>
                </div>

                {/* Search Box */}
                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    placeholder="Search course, code, or faculty..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="form-input text-xs py-1.5 pl-8 pr-3 rounded-xl border-gray-200 dark:border-gray-700 dark:bg-gray-800 w-full"
                  />
                  <svg className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              {/* Course-by-Course Abnormality Cards Grid */}
              <div className="space-y-4">
                {filteredCourseAbnormalities.length === 0 && (
                  <div className="bg-white dark:bg-[#1a2234] rounded-2xl p-12 text-center text-gray-400 border border-gray-100 dark:border-gray-800">
                    <p className="text-sm font-bold text-gray-700 dark:text-gray-300">No Course Abnormalities Found</p>
                    <p className="text-xs mt-1">No courses match the selected outlier filter or search query.</p>
                  </div>
                )}

                {filteredCourseAbnormalities.map((crs) => {
                  const hasNegative = crs.negativeOutliers.length > 0;
                  const hasPositive = crs.positiveOutliers.length > 0;

                  return (
                    <div
                      key={crs.course_id}
                      className={`bg-white dark:bg-[#1a2234] rounded-2xl border p-5 transition space-y-4 ${
                        hasNegative
                          ? "border-rose-200 dark:border-rose-900/60 shadow-xs hover:border-rose-300"
                          : hasPositive
                          ? "border-emerald-200 dark:border-emerald-900/60 shadow-xs"
                          : "border-gray-100 dark:border-gray-800"
                      }`}
                    >
                      {/* Course Header Banner */}
                      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800 pb-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-sm text-primary">
                              {crs.course_code}
                            </span>
                            <span className="font-black text-sm text-gray-900 dark:text-white">
                              {crs.course_title}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 font-bold text-[10px] text-gray-600 dark:text-gray-400">
                              {crs.department_code}
                            </span>
                            {hasNegative && (
                              <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white font-black text-[9px] uppercase tracking-wider animate-pulse">
                                Teacher Class Going Down
                              </span>
                            )}
                            {hasPositive && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white font-black text-[9px] uppercase tracking-wider">
                                Star Teacher Detected
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 mt-1">
                            Total {crs.total_classrooms} sections • {crs.total_students} students evaluated
                          </p>
                        </div>

                        {/* Course Baseline Stats */}
                        <div className="flex items-center gap-4 text-xs font-semibold">
                          <div className="text-right">
                            <span className="text-[10px] text-gray-400 uppercase block">Course Baseline</span>
                            <span className="font-extrabold text-gray-900 dark:text-white">
                              {crs.baseline_attainment_pct}% {selectedMode === "MCQ" ? "Score" : "Attain"}
                            </span>
                          </div>
                          <div className="text-right pl-3 border-l border-gray-200 dark:border-gray-700">
                            <span className="text-[10px] text-gray-400 uppercase block">Baseline Pass</span>
                            <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                              {crs.baseline_pass_pct}%
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Faculty & Classrooms Table inside Course */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="text-[10px] font-black uppercase text-gray-400 bg-gray-50/70 dark:bg-gray-800/40 rounded-xl">
                            <tr>
                              <th className="py-2.5 px-3">Faculty Name</th>
                              <th className="py-2.5 px-3">Classroom / Section</th>
                              <th className="py-2.5 px-3 text-center">Students</th>
                              <th className="py-2.5 px-3 text-right">{selectedMode === "MCQ" ? "Score %" : "Attainment %"}</th>
                              <th className="py-2.5 px-3 text-right">Pass %</th>
                              <th className="py-2.5 px-3 text-right">vs Baseline</th>
                              <th className="py-2.5 px-3">Abnormality Diagnosis</th>
                              <th className="py-2.5 px-3 text-center">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-semibold">
                            {crs.evaluatedSections.map((sec) => {
                              const isNeg = sec.abnormalityType === "NEGATIVE_OUTLIER";
                              const isPos = sec.abnormalityType === "POSITIVE_OUTLIER";

                              return (
                                <tr
                                  key={sec.instance_id}
                                  className={`hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition ${
                                    isNeg
                                      ? "bg-rose-50/30 dark:bg-rose-950/20"
                                      : isPos
                                      ? "bg-emerald-50/20 dark:bg-emerald-950/10"
                                      : ""
                                  }`}
                                >
                                  {/* Faculty Name */}
                                  <td className="py-3 px-3">
                                    <div className="flex items-center gap-2">
                                      <div className={`w-7 h-7 rounded-full font-bold text-xs flex items-center justify-center shrink-0 ${
                                        isNeg
                                          ? "bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300"
                                          : isPos
                                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300"
                                          : "bg-primary/10 text-primary"
                                      }`}>
                                        {(sec.faculty_name || "F").charAt(0)}
                                      </div>
                                      <div>
                                        <span className="font-extrabold text-gray-900 dark:text-white block">
                                          {sec.faculty_name || "Assigned Faculty"}
                                        </span>
                                        <span className="text-[10px] text-gray-400">Teacher</span>
                                      </div>
                                    </div>
                                  </td>

                                  {/* Section Name */}
                                  <td className="py-3 px-3 font-bold text-gray-800 dark:text-gray-200">
                                    {sec.instance_name}
                                  </td>

                                  {/* Students count */}
                                  <td className="py-3 px-3 text-center font-bold text-gray-600 dark:text-gray-400">
                                    {sec.student_count}
                                  </td>

                                  {/* Attainment / Score */}
                                  <td className="py-3 px-3 text-right font-black text-gray-900 dark:text-white">
                                    {sec.attainment_pct}%
                                  </td>

                                  {/* Pass Rate */}
                                  <td className="py-3 px-3 text-right font-black">
                                    <span className={sec.pass_pct < 50 ? "text-rose-600" : "text-emerald-600"}>
                                      {sec.pass_pct}%
                                    </span>
                                  </td>

                                  {/* Delta vs Baseline */}
                                  <td className="py-3 px-3 text-right font-extrabold">
                                    <span
                                      className={`px-2 py-0.5 rounded text-[10px] ${
                                        sec.delta_from_baseline >= 0
                                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                                          : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                                      }`}
                                    >
                                      {sec.delta_from_baseline >= 0
                                        ? `+${sec.delta_from_baseline}%`
                                        : `${sec.delta_from_baseline}%`}
                                    </span>
                                  </td>

                                  {/* Diagnosis & Abnormality Alert */}
                                  <td className="py-3 px-3">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      {isNeg && (
                                        <span className="px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 font-black text-[9px] uppercase tracking-wider">
                                          Dragging Down
                                        </span>
                                      )}
                                      {isPos && (
                                        <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-black text-[9px] uppercase tracking-wider">
                                          Excelling
                                        </span>
                                      )}
                                      <span className="text-[11px] text-gray-600 dark:text-gray-300 font-medium">
                                        {sec.diagnosis}
                                      </span>
                                    </div>
                                  </td>

                                  {/* Action: Mistake Analysis Modal for Negative Outliers */}
                                  <td className="py-3 px-3 text-center">
                                    {isNeg ? (
                                      <button
                                        type="button"
                                        onClick={() => handleOpenMistakeModal(sec)}
                                        className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black rounded-lg shadow-xs transition flex items-center gap-1 mx-auto"
                                        title="View root causes and remedial interventions"
                                      >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                        <span>Mistake Analysis</span>
                                      </button>
                                    ) : (
                                      <span className="text-[10px] text-gray-400 font-semibold">—</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SUB-TAB 2: Classroom Multi-Course Performance & Abnormality Analytics      */}
          {/* One classroom engaged in multiple courses: Stats per course + detects      */}
          {/* when a class performing well in many courses failed in certain courses     */}
          {/* ========================================================================= */}
          {activeSubTab === "classroom_multicourse_abnormalities" && (
            <div className="space-y-6">
              {/* Header Card */}
              <div className="bg-white dark:bg-[#1a2234] rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                    Multi-Subject Classroom Diagnostics
                  </span>
                  <h3 className="text-lg font-black text-gray-900 dark:text-white mt-0.5">
                    Classroom Multi-Course Performance & Drop Abnormalities
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Analyzes how each class cohort performs across all their subjects to detect specific course failures
                  </p>
                </div>

                {/* Semester Filter */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-500">Semester:</span>
                  <select
                    value={selectedSemester}
                    onChange={(e) => setSelectedSemester(e.target.value)}
                    className="form-select text-xs py-1.5 pl-3 pr-8 min-w-[140px] rounded-xl border-gray-200 dark:border-gray-700 dark:bg-gray-800 font-bold"
                  >
                    <option value="ALL">All Semesters</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>
                        Semester {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Classroom Cohort Cards */}
              <div className="space-y-4">
                {analyzedClassroomMultiCourse.length === 0 && (
                  <div className="bg-white dark:bg-[#1a2234] rounded-2xl p-12 text-center text-gray-400 border border-gray-100 dark:border-gray-800">
                    <p className="text-sm font-bold text-gray-700 dark:text-gray-300">No Classroom Cohorts Found</p>
                    <p className="text-xs mt-1">No classroom data available for the selected department/semester.</p>
                  </div>
                )}

                {analyzedClassroomMultiCourse.map((cohort) => {
                  const isExpanded = expandedClassKey === cohort.cohort_key;
                  const hasAnomaly = cohort.hasDropAnomaly;

                  return (
                    <div
                      key={cohort.cohort_key}
                      className={`bg-white dark:bg-[#1a2234] rounded-2xl border p-5 transition space-y-4 ${
                        hasAnomaly
                          ? "border-rose-200 dark:border-rose-900/60 shadow-xs"
                          : "border-gray-100 dark:border-gray-800 hover:border-primary/40"
                      }`}
                    >
                      {/* Cohort Header Bar */}
                      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-xl font-black text-sm shrink-0 ${
                            hasAnomaly
                              ? "bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200"
                              : "bg-primary/10 text-primary"
                          }`}>
                            {cohort.rank}
                          </span>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-base font-black text-gray-900 dark:text-white">
                                {cohort.class_name}
                              </h4>
                              {hasAnomaly ? (
                                <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 text-[10px] font-extrabold uppercase tracking-wider border border-rose-200 dark:border-rose-800 animate-pulse">
                                  🚨 Specific Course Drop Detected
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 text-[10px] font-extrabold uppercase tracking-wider border border-emerald-200 dark:border-emerald-800">
                                  ✓ Consistent Across Subjects
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                              Department: <strong className="text-gray-700 dark:text-gray-300">{cohort.department_name}</strong> • Semester: {cohort.semester} • Students: {cohort.total_students}
                            </p>
                          </div>
                        </div>

                        {/* Holistic Performance Metrics */}
                        <div className="flex items-center flex-wrap gap-4 sm:gap-6">
                          <div className="text-center sm:text-right">
                            <span className="text-[10px] text-gray-400 uppercase font-bold block">
                              Courses Taken
                            </span>
                            <span className="text-base font-black text-primary">
                              {cohort.total_courses_count} subjects
                            </span>
                          </div>

                          <div className="text-center sm:text-right">
                            <span className="text-[10px] text-gray-400 uppercase font-bold block">
                              Multi-Course Pass
                            </span>
                            <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                              {cohort.holistic_pass_pct}%
                            </span>
                          </div>

                          <div className="text-center sm:text-right pl-3 border-l border-gray-100 dark:border-gray-800">
                            <span className="text-[10px] text-gray-400 uppercase font-bold block">
                              {selectedMode === "MCQ" ? "Class Avg Score" : "Class Avg Attain"}
                            </span>
                            <span className="text-xl font-black text-primary">
                              {cohort.holistic_attainment_pct}%
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => setExpandedClassKey(isExpanded ? null : cohort.cohort_key)}
                            className="px-3 py-1.5 text-xs font-bold rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                          >
                            {isExpanded ? "Hide Courses" : "Inspect All Courses"}
                          </button>
                        </div>
                      </div>

                      {/* Drop Abnormality Alert Banner if Class failed a specific subject */}
                      {hasAnomaly && (
                        <div className="p-3.5 rounded-xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-3 text-xs">
                          <div className="w-6 h-6 rounded-lg bg-rose-500 text-white flex items-center justify-center shrink-0 mt-0.5">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                          </div>
                          <div>
                            <span className="font-extrabold text-rose-900 dark:text-rose-100 block">
                              Abnormality Detected in Specific Subject(s)
                            </span>
                            <div className="mt-1 space-y-1">
                              {cohort.dropAbnormalities.map((d, i) => (
                                <p key={i} className="text-rose-700 dark:text-rose-300 font-semibold">
                                  • {d.course_code} ({d.course_title}): Dropped to <strong>{d.attainment_pct}%</strong> ({d.deltaFromClassAvg}% below class average) with <strong>{d.pass_pct}% pass rate</strong> under {d.instructor_name || "Instructor"}.
                                </p>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Course Grid for this Classroom */}
                      <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                        <h5 className="text-[11px] font-black uppercase tracking-wider text-gray-500 mb-2.5">
                          Course-by-Course Performance Breakdown for {cohort.class_name}
                        </h5>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {cohort.evaluatedCourses.map((crs) => (
                            <div
                              key={crs.course_id}
                              className={`p-3.5 rounded-xl border transition space-y-2 ${
                                crs.isDropAbnormality
                                  ? "bg-rose-50/50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800"
                                  : crs.isBreakthrough
                                  ? "bg-emerald-50/40 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800"
                                  : "bg-gray-50 dark:bg-gray-800/60 border-gray-100 dark:border-gray-800"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-black text-xs text-primary">
                                  {crs.course_code}
                                </span>
                                {crs.isDropAbnormality && (
                                  <span className="px-2 py-0.5 rounded bg-rose-500 text-white font-black text-[9px] uppercase tracking-wider">
                                    Drop Anomaly
                                  </span>
                                )}
                                {crs.isBreakthrough && (
                                  <span className="px-2 py-0.5 rounded bg-emerald-500 text-white font-black text-[9px] uppercase tracking-wider">
                                    Breakthrough
                                  </span>
                                )}
                              </div>

                              <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">
                                {crs.course_title}
                              </p>

                              <p className="text-[10px] text-gray-400">
                                Instructor: <strong className="text-gray-700 dark:text-gray-300">{crs.instructor_name || "Assigned Faculty"}</strong>
                              </p>

                              <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-xs">
                                <div>
                                  <span className="text-[10px] text-gray-400 block">Score</span>
                                  <span className="font-black text-gray-900 dark:text-white">
                                    {crs.attainment_pct}%
                                  </span>
                                </div>
                                <div className="text-right">
                                  <span className="text-[10px] text-gray-400 block">Pass Rate</span>
                                  <span className={`font-black ${crs.pass_pct < 50 ? "text-rose-600" : "text-emerald-600"}`}>
                                    {crs.pass_pct}%
                                  </span>
                                </div>
                                <div className="text-right">
                                  <span className="text-[10px] text-gray-400 block">vs Class Avg</span>
                                  <span className={`font-black ${crs.deltaFromClassAvg >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                                    {crs.deltaFromClassAvg >= 0 ? `+${crs.deltaFromClassAvg}%` : `${crs.deltaFromClassAvg}%`}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SUB-TAB 3: Single Course Diagnostics & Mistake Analysis                     */}
          {/* ========================================================================= */}
          {activeSubTab === "course_comparative" && (
            <div className="space-y-6">
              {courses.length === 0 ? (
                <div className="bg-white dark:bg-[#1a2234] rounded-2xl p-12 text-center text-gray-400 border border-gray-100 dark:border-gray-800">
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-300">No Course Comparative Data</p>
                  <p className="text-xs mt-1">No courses found matching the selected filter criteria.</p>
                </div>
              ) : (
                <>
                  {/* Course Selector Header */}
                  <div className="bg-white dark:bg-[#1a2234] rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                        Single Course Deep-Dive Diagnostics
                      </span>
                      <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">
                        {currentCourse?.course_code} - {currentCourse?.course_title}
                      </h3>
                      <p className="text-xs text-gray-400">
                        Comparing all classrooms and teachers against the course baseline
                      </p>
                    </div>

                    {/* Course Switcher */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-500">Select Course:</span>
                      <select
                        value={currentCourse?.course_id ?? ""}
                        onChange={(e) => setSelectedCourseId(Number(e.target.value))}
                        className="form-select text-xs py-1.5 pl-3 pr-8 min-w-[200px] rounded-xl border-gray-200 dark:border-gray-700 dark:bg-gray-800 font-bold"
                      >
                        {courses.map((c) => (
                          <option key={c.course_id} value={c.course_id}>
                            {c.course_code} - {c.course_title}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Course Baseline Stats Banner */}
                  {currentCourse && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 dark:bg-gray-800/40 p-4 rounded-2xl border border-gray-200 dark:border-gray-700/60">
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase">
                          {selectedMode === "MCQ" ? "Course Baseline Score" : "Course Baseline Attainment"}
                        </span>
                        <p className="text-xl font-black text-gray-900 dark:text-white mt-0.5">
                          {currentCourse.baseline_attainment_pct}%
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Course Baseline Pass Rate</span>
                        <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                          {currentCourse.baseline_pass_pct}%
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Total Classrooms</span>
                        <p className="text-xl font-black text-primary mt-0.5">
                          {currentCourse.total_classrooms} sections
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Evaluated Students</span>
                        <p className="text-xl font-black text-purple-600 dark:text-purple-400 mt-0.5">
                          {currentCourse.total_students} students
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Dual Panel: Star Teachers + Classroom Divergence */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Panel A: Teacher Leaderboard */}
                    <div className="bg-white dark:bg-[#1a2234] rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
                      <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
                        <div>
                          <h4 className="text-sm font-extrabold text-gray-900 dark:text-white">
                            Course Teacher Leaderboard
                          </h4>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            Sections handled by each teacher for this course
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {currentCourse?.teacher_leaderboard.map((t) => (
                          <div
                            key={t.faculty_id}
                            className={`p-3.5 rounded-xl border transition ${
                              t.is_star_performer
                                ? "bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/60 shadow-sm"
                                : "bg-gray-50/50 dark:bg-gray-800/40 border-gray-100 dark:border-gray-800"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <span className="w-6 h-6 rounded-full bg-white dark:bg-gray-800 font-black text-xs text-gray-700 dark:text-gray-300 flex items-center justify-center border shadow-xs">
                                  #{t.rank}
                                </span>
                                <div>
                                  <h5 className="text-xs font-black text-gray-900 dark:text-white flex items-center gap-2">
                                    <span>{t.faculty_name}</span>
                                    {t.is_star_performer && (
                                      <span className="px-2 py-0.5 rounded bg-amber-400 text-amber-950 font-black text-[9px] uppercase tracking-wider">
                                        Star Teacher
                                      </span>
                                    )}
                                  </h5>
                                  <p className="text-[10px] text-gray-400 mt-0.5">
                                    Handles: {t.sections_handled.join(", ")} ({t.total_students} students)
                                  </p>
                                </div>
                              </div>

                              <div className="text-right">
                                <div className="text-sm font-black text-gray-900 dark:text-white">
                                  {t.attainment_pct}%
                                </div>
                                <div className={`text-[10px] font-bold ${
                                  t.delta_from_baseline >= 0 ? "text-emerald-600" : "text-rose-600"
                                }`}>
                                  {t.delta_from_baseline >= 0 ? `+${t.delta_from_baseline}%` : `${t.delta_from_baseline}%`} vs avg
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Panel B: Classroom Divergence & Mistake Analysis */}
                    <div className="bg-white dark:bg-[#1a2234] rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
                      <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
                        <div>
                          <h4 className="text-sm font-extrabold text-gray-900 dark:text-white">
                            Classroom Divergence & Mistake Analysis
                          </h4>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            Detects cases where course passes but specific section fails
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {currentCourse?.classroom_comparisons.map((cl) => {
                          const isAtRisk = cl.status === "AT_RISK";
                          const isStar = cl.status === "STAR_PERFORMER";

                          return (
                            <div
                              key={cl.instance_id}
                              className={`p-3.5 rounded-xl border transition ${
                                isAtRisk
                                  ? "bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900 shadow-sm"
                                  : isStar
                                  ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900"
                                  : "bg-gray-50/50 dark:bg-gray-800/40 border-gray-100 dark:border-gray-800"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h5 className="text-xs font-black text-gray-900 dark:text-white">
                                      {cl.instance_name}
                                    </h5>
                                    {isAtRisk && (
                                      <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white font-extrabold text-[9px] uppercase tracking-wider animate-pulse">
                                        Failing Section
                                      </span>
                                    )}
                                    {isStar && (
                                      <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white font-extrabold text-[9px] uppercase tracking-wider">
                                        Top Section
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-gray-400 mt-0.5">
                                    Teacher: <span className="font-bold">{cl.faculty_name}</span> | Students: {cl.student_count}
                                  </p>
                                </div>

                                <div className="text-right">
                                  <div className="text-xs font-black text-gray-900 dark:text-white">
                                    {cl.attainment_pct}% {selectedMode === "MCQ" ? "Score" : "Attain"} | {cl.pass_pct}% Pass
                                  </div>
                                  <div className={`text-[10px] font-bold ${
                                    cl.delta_from_baseline >= 0 ? "text-emerald-600" : "text-rose-600"
                                  }`}>
                                    {cl.delta_from_baseline >= 0 ? `+${cl.delta_from_baseline}%` : `${cl.delta_from_baseline}%`} vs course
                                  </div>
                                </div>
                              </div>

                              {isAtRisk && (
                                <div className="mt-3 pt-2.5 border-t border-rose-100 dark:border-rose-900/40 flex items-center justify-between">
                                  <span className="text-[11px] text-rose-700 dark:text-rose-300 font-bold">
                                    Course pass rate {currentCourse.baseline_pass_pct}% vs Section {cl.pass_pct}%
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenMistakeModal(cl)}
                                    className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-extrabold rounded-lg shadow-sm transition flex items-center gap-1.5"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>Mistake Analysis</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}

      {/* Mistake Analysis Modal */}
      {currentCourse && (
        <MistakeAnalysisModal
          isOpen={isMistakeModalOpen}
          onClose={() => setIsMistakeModalOpen(false)}
          courseCode={currentCourse.course_code}
          courseTitle={currentCourse.course_title}
          baselineAttainment={currentCourse.baseline_attainment_pct}
          baselinePass={currentCourse.baseline_pass_pct}
          classroom={activeMistakeClass}
          isMcq={selectedMode === "MCQ"}
        />
      )}
    </div>
  );
};

export default PrincipalPerformanceView;
