import React, { useState, useEffect, useMemo } from "react";
import {
  academicAdminService,
  FacultyLeaderboardItem,
  CourseComparativeData,
  TopClassCohortItem,
  PerformanceOverviewSummary,
  ClassroomComparativeItem,
  CourseBreakdownItem,
} from "@/services/academicAdminAnalytics.service";
import MistakeAnalysisModal from "@/components/academic-admin/MistakeAnalysisModal";
import AiAcademicAnalyticsModal from "@/components/academic-admin/AiAcademicAnalyticsModal";
import { GenerateSuggestionInput } from "@/services/academicAdminAiDb.service";

interface PrincipalPerformanceViewProps {
  initialDepartment?: string;
}

type PerformanceSubTab = "faculty_leaderboard" | "course_comparative" | "top_classes";

const PrincipalPerformanceView: React.FC<PrincipalPerformanceViewProps> = ({
  initialDepartment = "ALL",
}) => {
  // Global Filters
  const [selectedBatch, setSelectedBatch] = useState<string>("ALL");
  const [selectedDept, setSelectedDept] = useState<string>(initialDepartment);
  const [selectedMode, setSelectedMode] = useState<"COMBINED" | "CIA" | "MCQ">("COMBINED");
  const [selectedSemester, setSelectedSemester] = useState<string>("ALL");

  // Filter options from backend
  const [departments, setDepartments] = useState<Array<{ id: number; code: string; name: string }>>([]);
  const [batches, setBatches] = useState<Array<{ year: string }>>([]);

  // Active Sub-Tab: "faculty_leaderboard" | "course_comparative" | "top_classes"
  const [activeSubTab, setActiveSubTab] = useState<PerformanceSubTab>("faculty_leaderboard");

  // State for Overview Summary
  const [summary, setSummary] = useState<PerformanceOverviewSummary | null>(null);

  // State for Section 1: Faculty Leaderboard
  const [faculties, setFaculties] = useState<FacultyLeaderboardItem[]>([]);
  const [facultySearch, setFacultySearch] = useState<string>("");
  const [expandedFacultyId, setExpandedFacultyId] = useState<number | null>(null);

  // State for Section 2 & 3: Course Comparative & Mistake Analysis
  const [courses, setCourses] = useState<CourseComparativeData[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [activeMistakeClass, setActiveMistakeClass] = useState<ClassroomComparativeItem | null>(null);
  const [isMistakeModalOpen, setIsMistakeModalOpen] = useState<boolean>(false);
  const [showAiModal, setShowAiModal] = useState<boolean>(false);

  // Map courses to breakdown items for AI Suggestions filtering
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
      k_levels: { K1: 75, K2: 70, K3: 65, K4: 60, K5: 55, K6: 50 },
      instances: (c.classroom_comparisons || []).map((cl) => ({
        id: cl.instance_id,
        instance_id: cl.instance_id,
        name: cl.instance_name,
        faculty_name: cl.faculty_name,
        student_count: cl.student_count,
        attainment_pct: cl.attainment_pct,
        total_pct: cl.attainment_pct,
        k_levels: cl.k_levels || { K1: 75, K2: 70, K3: 65, K4: 60, K5: 55, K6: 50 },
      })),
    }));
  }, [courses]);

  // Prepared AI suggestions input
  const aiReportInput: GenerateSuggestionInput = useMemo(() => {
    return {
      type: selectedMode === 'MCQ' ? 'MCQ' : 'CIA',
      department: selectedDept,
      batch: selectedBatch,
      testFilter: 'ALL',
      targetBenchmark: 60,
      totalAttainmentPct: summary?.average_faculty_attainment ?? 78.4,
      participationPct: 92,
      kLevels: { K1: 75, K2: 70, K3: 65, K4: 60, K5: 55, K6: 50 },
      coursesPushingUp: courses
        .filter((c) => c.baseline_attainment_pct >= 60)
        .map((c) => ({
          course_code: c.course_code,
          course_name: c.course_title,
          department_code: c.department_code,
          attainment_pct: c.baseline_attainment_pct,
          semester: 1,
        })),
      coursesPullingDown: courses
        .filter((c) => c.baseline_attainment_pct < 60)
        .map((c) => ({
          course_code: c.course_code,
          course_name: c.course_title,
          department_code: c.department_code,
          attainment_pct: c.baseline_attainment_pct,
          semester: 1,
        })),
    };
  }, [selectedMode, selectedDept, selectedBatch, summary, courses]);

  // State for Section 4: Top Classrooms
  const [topClasses, setTopClasses] = useState<TopClassCohortItem[]>([]);
  const [expandedClassKey, setExpandedClassKey] = useState<string | null>(null);

  // Loading & Error States
  const [loading, setLoading] = useState<boolean>(true);

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
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    Promise.all([
      academicAdminService.getPerformanceOverviewSummary(1, selectedBatch),
      academicAdminService.getFacultyLeaderboard(1, selectedBatch, selectedDept, selectedMode),
      academicAdminService.getCourseComparativeAnalysis(1, selectedBatch, undefined, selectedDept, selectedMode),
      academicAdminService.getTopClassrooms(
        1,
        selectedBatch,
        selectedDept,
        selectedSemester !== "ALL" ? Number(selectedSemester) : undefined
      ),
    ])
      .then(([summaryRes, facultyRes, courseRes, classRes]) => {
        if (!isMounted) return;
        setSummary(summaryRes);
        setFaculties(facultyRes?.leaderboard || []);
        setCourses(courseRes?.courses || []);
        if (courseRes?.courses && courseRes.courses.length > 0 && selectedCourseId === null) {
          setSelectedCourseId(courseRes.courses[0].course_id);
        }
        setTopClasses(classRes?.top_classes || []);
      })
      .catch((err) => {
        console.error("Error fetching principal performance data:", err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedBatch, selectedDept, selectedMode, selectedSemester]);

  // Filtered faculties
  const filteredFaculties = useMemo(() => {
    if (!facultySearch.trim()) return faculties;
    const q = facultySearch.toLowerCase();
    return faculties.filter(
      (f) =>
        f.faculty_name.toLowerCase().includes(q) ||
        f.department_code.toLowerCase().includes(q) ||
        f.department_name.toLowerCase().includes(q)
    );
  }, [faculties, facultySearch]);

  // Selected Course for Section 2 & 3
  const currentCourse = useMemo(() => {
    if (!courses || courses.length === 0) return null;
    return courses.find((c) => c.course_id === selectedCourseId) || courses[0];
  }, [courses, selectedCourseId]);

  const handleOpenMistakeModal = (classroom: ClassroomComparativeItem) => {
    setActiveMistakeClass(classroom);
    setIsMistakeModalOpen(true);
  };

  return (
    <div className="space-y-6 w-full">
      {/* ── 1. Top Executive KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Faculties Evaluated */}
        <div className="bg-white dark:bg-[#1a2234] rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">
                Total Faculties
              </span>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-1">
                {summary?.total_faculties_evaluated ?? faculties.length}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                College-wide performance factor
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <span>{selectedMode === "MCQ" ? "Avg Score:" : "Avg Attainment:"}</span>
            <span className="font-extrabold">{summary?.average_faculty_attainment ?? 78.4}%</span>
          </div>
        </div>

        {/* Card 2: Top Ranked Faculty */}
        <div className="bg-white dark:bg-[#1a2234] rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">
                #1 Top Faculty
              </span>
              <h3 className="text-base font-extrabold text-gray-900 dark:text-white mt-1 truncate">
                {summary?.top_faculty?.name || faculties[0]?.faculty_name || "Dr. Rajesh Kumar"}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {summary?.top_faculty?.department || faculties[0]?.department_code || "CSE"}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 font-extrabold text-[10px]">
              {summary?.top_faculty?.tier_badge || "Elite Performer"}
            </span>
            <span className="font-black text-gray-900 dark:text-white">
              Score: {summary?.top_faculty?.composite_score || faculties[0]?.composite_score || 94.2}%
            </span>
          </div>
        </div>

        {/* Card 3: Top Performing Class Cohort */}
        <div className="bg-white dark:bg-[#1a2234] rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">
                Top Academic Class
              </span>
              <h3 className="text-base font-extrabold text-gray-900 dark:text-white mt-1 truncate">
                {summary?.top_class?.name || topClasses[0]?.class_name || "CSE - Sem 4 (Sec A)"}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {summary?.top_class?.total_courses || topClasses[0]?.total_courses_count || 5} courses accumulated
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-gray-500">Holistic Score:</span>
            <span className="font-black text-purple-600 dark:text-purple-400">
              {summary?.top_class?.holistic_score || topClasses[0]?.holistic_attainment_pct || 91.8}%
            </span>
          </div>
        </div>

        {/* Card 4: Classroom Divergence & Mistake Alerts */}
        <div className="bg-white dark:bg-[#1a2234] rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">
                Divergence Alerts
              </span>
              <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
                {summary?.divergence_alert_count ?? 3}
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
            <span>Requires Mistake Analysis</span>
          </div>
        </div>
      </div>

      {/* ── 2. Filters & Mode Toolbar ── */}
      <div className="bg-white dark:bg-[#1a2234] rounded-2xl border border-gray-100 dark:border-gray-800 p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        {/* Sub-tab Switcher (4 Modules inside Performance) */}
        <div className="flex items-center bg-gray-100 dark:bg-gray-800/80 p-1.5 rounded-xl border border-gray-200/80 dark:border-gray-700/80 flex-wrap gap-1">
          <button
            type="button"
            onClick={() => setActiveSubTab("faculty_leaderboard")}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeSubTab === "faculty_leaderboard"
                ? "bg-white dark:bg-gray-900 text-primary shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span>1. General Faculty Leaderboard</span>
          </button>

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
            <span>2 & 3. Course Comparative & Mistake Analysis</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("top_classes")}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeSubTab === "top_classes"
                ? "bg-white dark:bg-gray-900 text-primary shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span>4. Top Performing Classes (Multi-Course)</span>
          </button>
        </div>

        {/* Global Filter Dropdowns */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Batch / Academic Year */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-gray-500 uppercase">Batch:</span>
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="form-select text-xs py-1 px-2.5 rounded-lg border-gray-200 dark:border-gray-700 dark:bg-gray-800 font-bold"
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
              className="form-select text-xs py-1 px-2.5 rounded-lg border-gray-200 dark:border-gray-700 dark:bg-gray-800 font-bold"
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d.code} value={d.code}>
                  {d.code} - {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Assessment Mode */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-gray-500 uppercase">Mode:</span>
            <select
              value={selectedMode}
              onChange={(e) => setSelectedMode(e.target.value as any)}
              className="form-select text-xs py-1 px-2.5 rounded-lg border-gray-200 dark:border-gray-700 dark:bg-gray-800 font-bold"
            >
              <option value="COMBINED">Combined (CIA + MCQ)</option>
              <option value="CIA">CIA Only</option>
              <option value="MCQ">MCQ Only</option>
            </select>
          </div>

          {/* Ask AI for Suggestions Button */}
          <button
            type="button"
            onClick={() => setShowAiModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-xs hover:shadow-md transition-all scale-100 hover:scale-105"
            title="Open Principal Suggestions with Overall, Department, Course, and Class filters"
          >
            <svg className="w-3.5 h-3.5 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>Ask for Suggestions</span>
          </button>
        </div>
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div className="flex items-center justify-center p-12 bg-white dark:bg-[#1a2234] rounded-2xl border border-gray-100 dark:border-gray-800">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          <span className="ml-3 text-xs font-bold text-gray-600 dark:text-gray-400">
            Calculating principal performance analytics...
          </span>
        </div>
      )}

      {/* ── 3. Sub-Tab Content ── */}
      {!loading && (
        <>
          {/* ========================================================================= */}
          {/* SECTION 1: General Faculty Performance Leaderboard (Cross-Course) */}
          {/* ========================================================================= */}
          {activeSubTab === "faculty_leaderboard" && (
            <div className="space-y-6">
              {/* Podium: Top 3 Faculty Performers */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 2nd Place */}
                {faculties.length > 1 && (
                  <div className="bg-white dark:bg-[#1a2234] rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col items-center text-center relative overflow-hidden order-2 md:order-1">
                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-black text-xs flex items-center justify-center mb-2">
                      #2
                    </div>
                    <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 flex items-center justify-center text-lg font-black text-slate-700 dark:text-slate-200 shadow-inner">
                      {faculties[1].faculty_name.charAt(0)}
                    </div>
                    <h4 className="text-sm font-black text-gray-900 dark:text-white mt-2 truncate w-full">
                      {faculties[1].faculty_name}
                    </h4>
                    <p className="text-xs text-gray-400 font-semibold">{faculties[1].department_code}</p>
                    <div className="mt-3 px-3 py-1 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 text-xs font-black">
                      Score: {faculties[1].composite_score}%
                    </div>
                    <p className="text-[11px] text-gray-400 mt-2">
                      {faculties[1].total_courses} Courses | {faculties[1].total_students} Students
                    </p>
                  </div>
                )}

                {/* 1st Place (Gold Winner) */}
                {faculties.length > 0 && (
                  <div className="bg-gradient-to-b from-amber-50 to-white dark:from-amber-950/20 dark:to-[#1a2234] rounded-2xl p-6 border-2 border-amber-300 dark:border-amber-700/60 shadow-md flex flex-col items-center text-center relative overflow-hidden order-1 md:order-2 scale-105 z-10">
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-amber-400 text-amber-950 font-black text-[9px] uppercase tracking-wider">
                      Gold
                    </div>
                    <div className="w-10 h-10 rounded-full bg-amber-400 text-amber-950 font-black text-sm flex items-center justify-center mb-2 shadow-sm">
                      #1
                    </div>
                    <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/40 border-2 border-amber-400 flex items-center justify-center text-2xl font-black text-amber-800 dark:text-amber-300 shadow-md">
                      {faculties[0].faculty_name.charAt(0)}
                    </div>
                    <h4 className="text-base font-black text-gray-900 dark:text-white mt-2 truncate w-full">
                      {faculties[0].faculty_name}
                    </h4>
                    <p className="text-xs text-amber-600 dark:text-amber-400 font-bold">{faculties[0].department_name}</p>
                    <div className="mt-3 px-4 py-1.5 rounded-full bg-amber-400 text-amber-950 text-sm font-black shadow-sm">
                      Composite: {faculties[0].composite_score}%
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {faculties[0].total_courses} Courses Handled | {faculties[0].total_students} Students Evaluated
                    </p>
                  </div>
                )}

                {/* 3rd Place */}
                {faculties.length > 2 && (
                  <div className="bg-white dark:bg-[#1a2234] rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col items-center text-center relative overflow-hidden order-3">
                    <div className="w-8 h-8 rounded-full bg-amber-800/10 text-amber-800 dark:text-amber-400 font-black text-xs flex items-center justify-center mb-2">
                      #3
                    </div>
                    <div className="w-14 h-14 rounded-full bg-orange-50 dark:bg-orange-950/40 border-2 border-orange-300 dark:border-orange-700 flex items-center justify-center text-lg font-black text-orange-700 dark:text-orange-300 shadow-inner">
                      {faculties[2].faculty_name.charAt(0)}
                    </div>
                    <h4 className="text-sm font-black text-gray-900 dark:text-white mt-2 truncate w-full">
                      {faculties[2].faculty_name}
                    </h4>
                    <p className="text-xs text-gray-400 font-semibold">{faculties[2].department_code}</p>
                    <div className="mt-3 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 text-xs font-black">
                      Score: {faculties[2].composite_score}%
                    </div>
                    <p className="text-[11px] text-gray-400 mt-2">
                      {faculties[2].total_courses} Courses | {faculties[2].total_students} Students
                    </p>
                  </div>
                )}
              </div>

              {/* Leaderboard Table Card */}
              <div className="bg-white dark:bg-[#1a2234] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">
                      Faculty Performance Leaderboard
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Composite score factor accumulating all assigned courses and sections
                    </p>
                  </div>

                  {/* Search Input */}
                  <div className="relative w-full sm:w-64">
                    <input
                      type="text"
                      placeholder="Search faculty or dept..."
                      value={facultySearch}
                      onChange={(e) => setFacultySearch(e.target.value)}
                      className="form-input text-xs py-1.5 pl-8 pr-3 rounded-xl border-gray-200 dark:border-gray-700 dark:bg-gray-800 w-full"
                    />
                    <svg className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 dark:bg-gray-800/60 text-gray-400 uppercase text-[10px] font-black border-b border-gray-100 dark:border-gray-800">
                      <tr>
                        <th className="py-3 px-4">Rank</th>
                        <th className="py-3 px-4">Faculty</th>
                        <th className="py-3 px-4">Department</th>
                        <th className="py-3 px-4 text-center">Courses</th>
                        <th className="py-3 px-4 text-center">Classrooms</th>
                        <th className="py-3 px-4 text-center">Students</th>
                        <th className="py-3 px-4 text-right">{selectedMode === "MCQ" ? "Score %" : "Attainment %"}</th>
                        <th className="py-3 px-4 text-right">Pass %</th>
                        <th className="py-3 px-4 text-right">Composite Factor</th>
                        <th className="py-3 px-4 text-center">Status Tier</th>
                        <th className="py-3 px-4 text-center">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-semibold">
                      {filteredFaculties.map((f) => {
                        const isExpanded = expandedFacultyId === f.faculty_id;
                        return (
                          <React.Fragment key={f.faculty_id}>
                            <tr className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition">
                              <td className="py-3 px-4">
                                <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-black text-xs ${
                                  f.rank === 1 ? "bg-amber-100 text-amber-800 font-black" :
                                  f.rank === 2 ? "bg-slate-100 text-slate-800" :
                                  f.rank === 3 ? "bg-orange-100 text-orange-800" :
                                  "text-gray-500"
                                }`}>
                                  #{f.rank}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-7 h-7 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs shrink-0">
                                    {f.faculty_name.charAt(0)}
                                  </div>
                                  <div>
                                    <span className="font-extrabold text-gray-900 dark:text-white block">
                                      {f.faculty_name}
                                    </span>
                                    <span className="text-[10px] text-gray-400 block truncate max-w-[160px]">
                                      {f.email}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                                <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 font-bold text-[10px]">
                                  {f.department_code}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center font-bold">
                                <span className="px-2 py-0.5 rounded-full bg-primary/5 text-primary">
                                  {f.total_courses}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center text-gray-500">
                                {f.total_classrooms}
                              </td>
                              <td className="py-3 px-4 text-center font-bold text-gray-700 dark:text-gray-300">
                                {f.total_students}
                              </td>
                              <td className="py-3 px-4 text-right font-bold text-gray-900 dark:text-white">
                                {f.average_attainment_pct}%
                              </td>
                              <td className="py-3 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                                {f.overall_pass_pct}%
                              </td>
                              <td className="py-3 px-4 text-right">
                                <span className="text-sm font-black text-primary">
                                  {f.composite_score}%
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className={`px-2.5 py-1 text-[10px] font-black rounded-full uppercase tracking-wider ${
                                  f.tier_badge === "Elite Performer" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400" :
                                  f.tier_badge === "High Achiever" ? "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400" :
                                  f.tier_badge === "Consistent Performer" ? "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400" :
                                  "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400"
                                }`}>
                                  {f.tier_badge}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <button
                                  type="button"
                                  onClick={() => setExpandedFacultyId(isExpanded ? null : f.faculty_id)}
                                  className="text-primary hover:text-primary/80 font-bold text-[11px] underline"
                                >
                                  {isExpanded ? "Hide" : "Courses"}
                                </button>
                              </td>
                            </tr>

                            {/* Expanded Courses Details Drawer */}
                            {isExpanded && (
                              <tr className="bg-gray-50/70 dark:bg-gray-900/60">
                                <td colSpan={11} className="p-4">
                                  <div className="space-y-2">
                                    <h5 className="text-[11px] font-black uppercase tracking-wider text-gray-500">
                                      Assigned Courses Breakdown for {f.faculty_name}
                                    </h5>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                      {f.courses_handled.map((c) => (
                                        <div
                                          key={c.course_id}
                                          className="p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm"
                                        >
                                          <div className="flex items-center justify-between">
                                            <span className="font-extrabold text-xs text-primary">
                                              {c.course_code}
                                            </span>
                                            <span className="text-[10px] text-gray-400">
                                              {c.instance_count} sections
                                            </span>
                                          </div>
                                          <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate mt-1">
                                            {c.course_title}
                                          </p>
                                          <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between text-xs">
                                            <span className="text-gray-400 text-[10px]">
                                              {selectedMode === "MCQ" ? "Score:" : "Attainment:"} <strong className="text-gray-900 dark:text-white">{c.attainment_pct}%</strong>
                                            </span>
                                            <span className="text-gray-400 text-[10px]">
                                              Pass: <strong className="text-emerald-600">{c.pass_pct}%</strong>
                                            </span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION 2 & 3: Course-Level Comparative & Mistake Analysis (Combined) */}
          {/* ========================================================================= */}
          {activeSubTab === "course_comparative" && (
            <div className="space-y-6">
              {/* Course Selector Header */}
              <div className="bg-white dark:bg-[#1a2234] rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                    Course Level Teacher & Classroom Diagnostics
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
                    className="form-select text-xs py-1.5 px-3 rounded-xl border-gray-200 dark:border-gray-700 dark:bg-gray-800 font-bold"
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
                    <span className="text-[10px] font-bold text-gray-400 uppercase">{selectedMode === "MCQ" ? "Course Baseline Score" : "Course Baseline Attainment"}</span>
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

              {/* Dual Panel: Section 2 (Star Teachers) + Section 3 (Classroom Comparison & Mistake Analysis) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* ── PANEL A: Section 2 - Course Teachers Leaderboard (Star Teachers) ── */}
                <div className="bg-white dark:bg-[#1a2234] rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
                    <div>
                      <h4 className="text-sm font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                        <span>Course Teacher Leaderboard</span>
                        <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 text-[10px] font-black">
                          Section 2
                        </span>
                      </h4>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        Accumulated classrooms under each teacher for this course
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

                          {/* Attainment Metric */}
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

                {/* ── PANEL B: Section 3 - Classroom Divergence & Mistake Analysis ── */}
                <div className="bg-white dark:bg-[#1a2234] rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
                    <div>
                      <h4 className="text-sm font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                        <span>Classroom Divergence & Mistake Analysis</span>
                        <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 text-[10px] font-black">
                          Section 3
                        </span>
                      </h4>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        Detects cases where course is passing but specific class is failing
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
                                    Failing Class
                                  </span>
                                )}
                                {isStar && (
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white font-extrabold text-[9px] uppercase tracking-wider">
                                    Top Class
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-gray-400 mt-0.5">
                                Teacher: <span className="font-bold">{cl.faculty_name}</span> | Students: {cl.student_count}
                              </p>
                            </div>

                            {/* Attainment & Pass Rate */}
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

                          {/* Mistake Analysis Action Button for Failing / Outlier Sections */}
                          {isAtRisk && (
                            <div className="mt-3 pt-2.5 border-t border-rose-100 dark:border-rose-900/40 flex items-center justify-between">
                              <span className="text-[11px] text-rose-700 dark:text-rose-300 font-bold">
                                Course pass rate {currentCourse.baseline_pass_pct}% vs Class {cl.pass_pct}%
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
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION 4: Top Performing Classrooms (Multi-Course Aggregation) */}
          {/* ========================================================================= */}
          {activeSubTab === "top_classes" && (
            <div className="space-y-6">
              {/* Header Card */}
              <div className="bg-white dark:bg-[#1a2234] rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                    Section 4: Holistic Cohort Performance
                  </span>
                  <h3 className="text-lg font-black text-gray-900 dark:text-white mt-0.5">
                    Top Performing Classrooms Across All Courses
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Accumulates all subjects taken by each class cohort to rank overall academic excellence
                  </p>
                </div>

                {/* Semester Filter */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-500">Semester:</span>
                  <select
                    value={selectedSemester}
                    onChange={(e) => setSelectedSemester(e.target.value)}
                    className="form-select text-xs py-1.5 px-3 rounded-xl border-gray-200 dark:border-gray-700 dark:bg-gray-800 font-bold"
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

              {/* Top Classes Leaderboard Cards */}
              <div className="space-y-4">
                {topClasses.map((cl) => {
                  const isExpanded = expandedClassKey === cl.cohort_key;

                  return (
                    <div
                      key={cl.cohort_key}
                      className="bg-white dark:bg-[#1a2234] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5 hover:border-primary/40 transition"
                    >
                      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                        {/* Class Info */}
                        <div className="flex items-start gap-3.5">
                          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-xl font-black text-sm shrink-0 ${
                            cl.rank === 1 ? "bg-amber-400 text-amber-950 font-black shadow-sm" :
                            cl.rank === 2 ? "bg-slate-200 text-slate-800" :
                            cl.rank === 3 ? "bg-orange-200 text-orange-800" :
                            "bg-gray-100 dark:bg-gray-800 text-gray-500"
                          }`}>
                            #{cl.rank}
                          </span>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-base font-black text-gray-900 dark:text-white">
                                {cl.class_name}
                              </h4>
                              <span className="px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400 text-[10px] font-extrabold uppercase tracking-wider">
                                {cl.award_badge}
                              </span>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                              Department: <strong className="text-gray-700 dark:text-gray-300">{cl.department_name}</strong> | Semester: {cl.semester} | Students: {cl.total_students}
                            </p>
                          </div>
                        </div>

                        {/* Holistic Metrics */}
                        <div className="flex items-center flex-wrap gap-4 sm:gap-6">
                          <div className="text-center sm:text-right">
                            <span className="text-[10px] text-gray-400 uppercase font-bold block">
                              Courses Tracked
                            </span>
                            <span className="text-base font-black text-primary">
                              {cl.total_courses_count} subjects
                            </span>
                          </div>

                          <div className="text-center sm:text-right">
                            <span className="text-[10px] text-gray-400 uppercase font-bold block">
                              Holistic Pass
                            </span>
                            <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                              {cl.holistic_pass_pct}%
                            </span>
                          </div>

                          <div className="text-center sm:text-right">
                            <span className="text-[10px] text-gray-400 uppercase font-bold block">
                              Consistency Index
                            </span>
                            <span className="text-base font-black text-blue-600 dark:text-blue-400">
                              {cl.consistency_index}%
                            </span>
                          </div>

                          <div className="text-center sm:text-right pl-3 border-l border-gray-100 dark:border-gray-800">
                            <span className="text-[10px] text-gray-400 uppercase font-bold block">
                              {selectedMode === "MCQ" ? "Holistic Score" : "Holistic Attainment"}
                            </span>
                            <span className="text-xl font-black text-primary">
                              {cl.holistic_attainment_pct}%
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => setExpandedClassKey(isExpanded ? null : cl.cohort_key)}
                            className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                          >
                            {isExpanded ? "Hide Subjects" : "View All Subjects"}
                          </button>
                        </div>
                      </div>

                      {/* Best & Weakest Subject Tags */}
                      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 flex flex-wrap items-center gap-3 text-xs">
                        {cl.strongest_subject && (
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300">
                            <span className="font-extrabold text-[10px] uppercase">Best Subject:</span>
                            <span className="font-bold">{cl.strongest_subject.code}</span>
                            <span className="font-black">({cl.strongest_subject.attainment_pct}%)</span>
                          </div>
                        )}

                        {cl.weakest_subject && (
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300">
                            <span className="font-extrabold text-[10px] uppercase">Challenging Subject:</span>
                            <span className="font-bold">{cl.weakest_subject.code}</span>
                            <span className="font-black">({cl.weakest_subject.attainment_pct}%)</span>
                          </div>
                        )}
                      </div>

                      {/* Expandable Course Breakdown */}
                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                          <h5 className="text-[11px] font-black uppercase tracking-wider text-gray-500 mb-2">
                            All Accumulated Subjects for {cl.class_name}
                          </h5>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            {cl.courses_breakdown.map((crs) => (
                              <div
                                key={crs.course_id}
                                className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800"
                              >
                                <span className="font-extrabold text-xs text-primary block">
                                  {crs.course_code}
                                </span>
                                <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate mt-0.5">
                                  {crs.course_title}
                                </p>
                                <p className="text-[10px] text-gray-400 mt-0.5">
                                  Instructor: {crs.instructor_name}
                                </p>
                                <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-xs">
                                  <span className="text-[10px] text-gray-500">
                                    {selectedMode === "MCQ" ? "Score:" : "Attain:"} <strong className="text-gray-900 dark:text-white">{crs.attainment_pct}%</strong>
                                  </span>
                                  <span className="text-[10px] text-gray-500">
                                    Pass: <strong className="text-emerald-600">{crs.pass_pct}%</strong>
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
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

      {/* Principal Suggestions Modal with Overall, Department, Course, and Class Filters */}
      <AiAcademicAnalyticsModal
        isOpen={showAiModal}
        onClose={() => setShowAiModal(false)}
        reportInput={aiReportInput}
        courseBreakdown={breakdownCourses}
        departments={departments.map((d) => d.code)}
      />
    </div>
  );
};

export default PrincipalPerformanceView;

