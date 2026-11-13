import React, { useState, useEffect, useMemo } from "react";
import {
  academicAdminService,
  DepartmentAttainmentSummary,
  CourseAttainmentSummaryItem,
  ClassInstanceAttainmentItem,
} from "@/services/academicAdminAnalytics.service";
import CourseAttainmentReport from "@/components/academic-setup/CourseAttainmentReport";

interface AcademicAdminAttainmentViewProps {
  initialDepartmentCode?: string;
  initialCourseCode?: string;
}

export const AcademicAdminAttainmentView: React.FC<
  AcademicAdminAttainmentViewProps
> = ({ initialDepartmentCode = "CSE", initialCourseCode }) => {
  const [selectedBatch, setSelectedBatch] = useState<string>("2025-2026");
  const [selectedDept, setSelectedDept] = useState<string>(initialDepartmentCode);

  // Dynamic filter lists loaded via API
  const [departments, setDepartments] = useState<{ id: number; code: string; name: string }[]>([]);
  const [batches, setBatches] = useState<{ id: number | string; name: string }[]>([]);

  // Comparison cards view controls
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<"attainment_desc" | "attainment_asc" | "code" | "semester">("attainment_desc");
  const [statusFilter, setStatusFilter] = useState<"all" | "met" | "focus">("all");
  const [outcomeScope, setOutcomeScope] = useState<"both" | "po" | "pso">("both");

  // Load filter options dynamically on mount
  useEffect(() => {
    let isMounted = true;
    academicAdminService.getFilters().then((res) => {
      if (!isMounted) return;
      if (res?.departments && res.departments.length > 0) {
        setDepartments(res.departments);
        if (!initialDepartmentCode) {
          setSelectedDept(res.departments[0].code);
        }
      }
      if (res?.batches && res.batches.length > 0) {
        setBatches(res.batches.map((b) => ({ id: b.id, name: b.name })));
        setSelectedBatch(res.batches[0].name);
      } else if (res?.academic_years && res.academic_years.length > 0) {
        setBatches(res.academic_years.map((y) => ({ id: y.year, name: y.year })));
        setSelectedBatch(res.academic_years[0].year);
      }
    }).catch((err) => {
      console.error("Failed to load filter options from API:", err);
    });
    return () => {
      isMounted = false;
    };
  }, [initialDepartmentCode]);

  // Deep drilldown selection: Course and Instance
  const [selectedCourse, setSelectedCourse] =
    useState<CourseAttainmentSummaryItem | null>(null);
  const [selectedInstance, setSelectedInstance] =
    useState<ClassInstanceAttainmentItem | null>(null);

  const [attainmentData, setAttainmentData] =
    useState<DepartmentAttainmentSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Load department attainment summary
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    academicAdminService
      .getDepartmentCourseAttainment(selectedDept, selectedBatch)
      .then((res) => {
        if (isMounted) {
          setAttainmentData(res);
          setLoading(false);

          // If initial course was requested, auto-select it
          if (initialCourseCode) {
            const matched = res.courses.find(
              (c) => c.course_code.toLowerCase() === initialCourseCode.toLowerCase()
            );
            if (matched) {
              setSelectedCourse(matched);
              if (matched.instances && matched.instances.length > 0) {
                setSelectedInstance(matched.instances[0]);
              }
            }
          }
        }
      });
    return () => {
      isMounted = false;
    };
  }, [selectedDept, selectedBatch, initialCourseCode]);

  // When changing department, reset course & instance selection
  const handleDeptChange = (newDept: string) => {
    setSelectedDept(newDept);
    setSelectedCourse(null);
    setSelectedInstance(null);
  };

  // Back to Department Courses view
  const handleBackToAllCourses = () => {
    setSelectedCourse(null);
    setSelectedInstance(null);
  };

  // Calculate department overall average attainment
  const deptAverageAttainment =
    attainmentData && attainmentData.courses && attainmentData.courses.length > 0
      ? (
          attainmentData.courses.reduce(
            (acc, c) => acc + c.average_copo_attainment_pct,
            0
          ) / attainmentData.courses.length
        ).toFixed(1)
      : "0.0";

  // Filtered and sorted courses for comparison cards
  const filteredAndSortedCourses = useMemo(() => {
    if (!attainmentData?.courses) return [];
    let list = [...attainmentData.courses];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.course_code.toLowerCase().includes(q) ||
          c.course_title.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (statusFilter === "met") {
      list = list.filter((c) => c.attainment_level >= 2.0 || c.average_copo_attainment_pct >= 60);
    } else if (statusFilter === "focus") {
      list = list.filter((c) => c.attainment_level < 2.0 && c.average_copo_attainment_pct < 60);
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === "attainment_desc") {
        return b.average_copo_attainment_pct - a.average_copo_attainment_pct;
      }
      if (sortBy === "attainment_asc") {
        return a.average_copo_attainment_pct - b.average_copo_attainment_pct;
      }
      if (sortBy === "code") {
        return a.course_code.localeCompare(b.course_code);
      }
      if (sortBy === "semester") {
        return a.semester - b.semester;
      }
      return 0;
    });

    return list;
  }, [attainmentData?.courses, searchQuery, statusFilter, sortBy]);

  // Overall Department OBE statistics
  const stats = useMemo(() => {
    if (!attainmentData?.courses || attainmentData.courses.length === 0) {
      return {
        totalCourses: 0,
        metCount: 0,
        focusCount: 0,
        metPct: 0,
        topCourse: null,
      };
    }
    const total = attainmentData.courses.length;
    const met = attainmentData.courses.filter(
      (c) => c.attainment_level >= 2.0 || c.average_copo_attainment_pct >= 60
    ).length;
    const focus = total - met;
    const metPct = Math.round((met / total) * 100);

    const sortedByScore = [...attainmentData.courses].sort(
      (a, b) => b.average_copo_attainment_pct - a.average_copo_attainment_pct
    );

    // PSO statistics across courses
    let psoSum = 0;
    let psoCount = 0;
    attainmentData.courses.forEach((c) => {
      if (c.pso_averages) {
        const vals = Object.values(c.pso_averages);
        if (vals.length > 0) {
          psoSum += vals.reduce((a, b) => a + Number(b), 0) / vals.length;
          psoCount++;
        }
      }
    });
    const deptPsoLevel = psoCount > 0 ? (psoSum / psoCount).toFixed(2) : "0.00";

    return {
      totalCourses: total,
      metCount: met,
      focusCount: focus,
      metPct,
      topCourse: sortedByScore[0] || null,
      deptPsoLevel,
    };
  }, [attainmentData?.courses]);

  if (loading || !attainmentData) {
    return (
      <div className="p-12 text-center bg-white dark:bg-[#1a2234] rounded-2xl border border-gray-100 dark:border-gray-800">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-gray-500 font-medium">Loading Department CO-PO Attainment...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* -- Top Filters Bar -- */}
      <div className="bg-white dark:bg-[#1a2234] rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-primary/10 text-primary">
                Outcome Based Education (OBE)
              </span>
              <h2 className="text-lg lg:text-xl font-bold text-gray-900 dark:text-white">
                Course Outcome & Program Outcome (CO-PO / PSO) Attainment
              </h2>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Select Batch and Department to view all courses average attainment, or pick a specific course classroom for deep attainment reports.
            </p>
          </div>

          {/* Department and Batch Dropdowns */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Batch Filter (Populated via API) */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-semibold text-gray-700 dark:text-gray-300">Batch:</span>
              <select
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                className="form-select text-xs py-1.5 pl-3 pr-8 min-w-[130px] rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-medium"
              >
                {batches.map((b) => (
                  <option key={String(b.id)} value={b.name}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Department Filter (Populated via API) */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-semibold text-gray-700 dark:text-gray-300">Department:</span>
              <select
                value={selectedDept}
                onChange={(e) => handleDeptChange(e.target.value)}
                className="form-select text-xs py-1.5 pl-3 pr-8 min-w-[160px] rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-medium"
              >
                {departments.map((d) => (
                  <option key={d.code} value={d.code}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Course Filter */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-semibold text-gray-700 dark:text-gray-300">Course:</span>
              <select
                value={selectedCourse ? selectedCourse.course_code : "ALL"}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "ALL") {
                    setSelectedCourse(null);
                    setSelectedInstance(null);
                  } else {
                    const matched = attainmentData.courses.find((c) => c.course_code === val);
                    setSelectedCourse(matched || null);
                    if (matched && matched.instances && matched.instances.length > 0) {
                      setSelectedInstance(matched.instances[0]);
                    } else {
                      setSelectedInstance(null);
                    }
                  }
                }}
                className="form-select text-xs py-1.5 pl-3 pr-8 min-w-[200px] rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-medium"
              >
                <option value="ALL">All Courses (Department Average)</option>
                {attainmentData.courses.map((c) => (
                  <option key={c.course_id} value={c.course_code}>
                    {c.course_code} - {c.course_title}
                  </option>
                ))}
              </select>
            </div>

            {/* Classroom Instance Filter */}
            {selectedCourse && (
              <div className="flex items-center gap-1.5 text-xs animate-fadeIn">
                <span className="font-semibold text-gray-700 dark:text-gray-300">Classroom:</span>
                <select
                  value={selectedInstance ? String(selectedInstance.instance_id) : ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    const matched = selectedCourse.instances.find(
                      (inst) => String(inst.instance_id) === val
                    );
                    setSelectedInstance(matched || null);
                  }}
                  className="form-select text-xs py-1.5 pl-3 pr-8 min-w-[170px] rounded-lg border-primary/50 dark:border-primary/50 bg-primary/5 dark:bg-primary/10 text-primary font-bold"
                >
                  {selectedCourse.instances.map((inst) => (
                    <option key={inst.instance_id} value={String(inst.instance_id)}>
                      {inst.instance_name} ({inst.instructor_name})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Breadcrumb Path when Deep in Class Instance */}
        {selectedCourse && selectedInstance && (
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-2 text-gray-400">
              <button
                onClick={handleBackToAllCourses}
                className="hover:text-primary font-semibold text-primary transition-colors flex items-center gap-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>{selectedDept} All Courses</span>
              </button>
              <span>/</span>
              <span className="font-bold text-gray-700 dark:text-gray-200">
                {selectedCourse.course_code} - {selectedCourse.course_title}
              </span>
              <span>/</span>
              <span className="font-extrabold text-primary px-2 py-0.5 rounded bg-primary/10">
                {selectedInstance.instance_name}
              </span>
            </div>

            <button
              onClick={handleBackToAllCourses}
              className="px-3 py-1 text-xs font-semibold rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Back to All Courses
            </button>
          </div>
        )}
      </div>

      {/* -- VIEW 1: Batch & Department alone given (All courses comparison cards & table) -- */}
      {!selectedCourse && (
        <div className="space-y-6">
          {/* Department Executive Overview & KPI Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Department Info */}
            <div className="p-4 rounded-2xl bg-white dark:bg-[#1a2234] border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
                  Academic Department
                </span>
                <div className="text-lg font-black text-gray-900 dark:text-white mt-1">
                  {attainmentData.department_name}
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
                <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-bold">
                  {attainmentData.department_code}
                </span>
                <span>Batch: <strong>{attainmentData.academic_year}</strong></span>
              </div>
            </div>

            {/* Card 2: Department Average Attainment */}
            <div className="p-4 rounded-2xl bg-white dark:bg-[#1a2234] border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
                  PO & PSO Attainment Avg
                </span>
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 flex items-baseline gap-2">
                  <span>{deptAverageAttainment}%</span>
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                    (PO Level {(Number(deptAverageAttainment) * 0.03).toFixed(2)} / 3.0)
                  </span>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between gap-1 flex-wrap text-xs">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Target: 60%
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60">
                  PSO Avg: Level {stats.deptPsoLevel} / 3.0
                </span>
              </div>
            </div>

            {/* Card 3: Evaluated Courses & Distribution */}
            <div className="p-4 rounded-2xl bg-white dark:bg-[#1a2234] border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
                  Evaluated Courses
                </span>
                <div className="text-2xl font-black text-primary mt-1">
                  {stats.totalCourses} <span className="text-xs font-semibold text-gray-400">Courses</span>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2 text-xs">
                <span className="px-2 py-0.5 rounded font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 text-[11px]">
                  {stats.metCount} Target Met
                </span>
                {stats.focusCount > 0 && (
                  <span className="px-2 py-0.5 rounded font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 text-[11px]">
                    {stats.focusCount} Action Needed
                  </span>
                )}
              </div>
            </div>

            {/* Card 4: Top Performing Course Spotlight */}
            <div className="p-4 rounded-2xl bg-white dark:bg-[#1a2234] border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
                  Compliance Rate & Spotlight
                </span>
                <div className="text-2xl font-black text-gray-900 dark:text-white mt-1">
                  {stats.metPct}%
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-2 truncate">
                {stats.topCourse ? (
                  <span>
                    Top: <strong className="text-primary">{stats.topCourse.course_code}</strong> ({stats.topCourse.average_copo_attainment_pct}%)
                  </span>
                ) : (
                  <span>No course data evaluated</span>
                )}
              </div>
            </div>
          </div>

          {/* Comparison Cards Toolbar: Search, Filters, Sorters & View Switcher */}
          <div className="bg-white dark:bg-[#1a2234] rounded-2xl border border-gray-100 dark:border-gray-800 p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Left: Search and Status Filters */}
              <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
                {/* Search Box */}
                <div className="relative min-w-[220px] max-w-sm flex-1">
                  <svg
                    className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search course code or title..."
                    className="w-full pl-9 pr-8 py-1.5 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:border-primary"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Status Filter Pills */}
                <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl text-xs">
                  <button
                    onClick={() => setStatusFilter("all")}
                    className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                      statusFilter === "all"
                        ? "bg-white dark:bg-gray-900 text-primary shadow-xs"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900"
                    }`}
                  >
                    All ({stats.totalCourses})
                  </button>
                  <button
                    onClick={() => setStatusFilter("met")}
                    className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                      statusFilter === "met"
                        ? "bg-white dark:bg-gray-900 text-emerald-600 shadow-xs"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900"
                    }`}
                  >
                    Target Met ({stats.metCount})
                  </button>
                  <button
                    onClick={() => setStatusFilter("focus")}
                    className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                      statusFilter === "focus"
                        ? "bg-white dark:bg-gray-900 text-rose-600 shadow-xs"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900"
                    }`}
                  >
                    Action Needed ({stats.focusCount})
                  </button>
                </div>

                {/* Outcome Scope: All / POs / PSOs */}
                <div className="flex items-center gap-1 bg-purple-50/70 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-800/40 p-1 rounded-xl text-xs">
                  <button
                    onClick={() => setOutcomeScope("both")}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                      outcomeScope === "both"
                        ? "bg-purple-600 text-white shadow-xs"
                        : "text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/40"
                    }`}
                  >
                    PO + PSO
                  </button>
                  <button
                    onClick={() => setOutcomeScope("po")}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                      outcomeScope === "po"
                        ? "bg-purple-600 text-white shadow-xs"
                        : "text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/40"
                    }`}
                  >
                    POs Only
                  </button>
                  <button
                    onClick={() => setOutcomeScope("pso")}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                      outcomeScope === "pso"
                        ? "bg-purple-600 text-white shadow-xs"
                        : "text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/40"
                    }`}
                  >
                    PSOs Only
                  </button>
                </div>
              </div>

              {/* Right: Sorter & View Switcher */}
              <div className="flex items-center gap-2">
                {/* Sort Dropdown */}
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="font-semibold text-gray-500 dark:text-gray-400">Sort:</span>
                  <select
                    value={sortBy}
                    onChange={(e: any) => setSortBy(e.target.value)}
                    className="form-select text-xs py-1.5 pl-3 pr-8 min-w-[160px] rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-medium"
                  >
                    <option value="attainment_desc">Highest Attainment</option>
                    <option value="attainment_asc">Lowest Attainment</option>
                    <option value="code">Course Code (A-Z)</option>
                    <option value="semester">Semester</option>
                  </select>
                </div>

                {/* View Mode Toggle */}
                <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                  <button
                    onClick={() => setViewMode("cards")}
                    title="Comparison Cards View"
                    className={`p-1.5 rounded-lg transition-all ${
                      viewMode === "cards"
                        ? "bg-white dark:bg-gray-900 text-primary shadow-xs"
                        : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode("table")}
                    title="Tabular View"
                    className={`p-1.5 rounded-lg transition-all ${
                      viewMode === "table"
                        ? "bg-white dark:bg-gray-900 text-primary shadow-xs"
                        : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 12h16M4 18h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* -- VIEW MODE 1: COMPARISON CARDS GRID (PRIMARY EXPERIENCE) -- */}
          {viewMode === "cards" && (
            <div className="space-y-4">
              {filteredAndSortedCourses.length === 0 ? (
                <div className="p-12 text-center bg-white dark:bg-[#1a2234] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                  <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3 text-gray-400">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">
                    No courses match your search or filter
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">
                    Try adjusting your search query or selecting &quot;All Courses&quot;.
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setStatusFilter("all");
                    }}
                    className="mt-4 px-4 py-1.5 rounded-xl text-xs font-semibold bg-primary text-white hover:bg-primary/90 transition-colors"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredAndSortedCourses.map((course) => {
                    const isMet = course.average_copo_attainment_pct >= 60 || course.attainment_level >= 2.0;
                    const isMod = !isMet && (course.average_copo_attainment_pct >= 45 || course.attainment_level >= 1.5);

                    return (
                      <div
                        key={course.course_id}
                        className="group relative bg-white dark:bg-[#1a2234] rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-primary/50 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between overflow-hidden"
                      >
                        {/* Top Performance Accent Stripe */}
                        <div
                          className={`h-1.5 w-full ${
                            isMet
                              ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                              : isMod
                              ? "bg-gradient-to-r from-amber-500 to-yellow-400"
                              : "bg-gradient-to-r from-rose-500 to-red-400"
                          }`}
                        />

                        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                          {/* Card Header: Code, Sem, and Status Badge */}
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="px-2.5 py-1 text-xs font-black tracking-wide rounded-lg bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground border border-primary/20">
                                  {course.course_code}
                                </span>
                                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                                  Sem {course.semester}
                                </span>
                              </div>

                              {isMet ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  Target Met
                                </span>
                              ) : isMod ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                  Moderate
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/80">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                  Action Required
                                </span>
                              )}
                            </div>

                            {/* Course Title */}
                            <h3
                              className="text-base font-bold text-gray-900 dark:text-white mt-3 group-hover:text-primary transition-colors line-clamp-2"
                              title={course.course_title}
                            >
                              {course.course_title}
                            </h3>

                            {/* Enrolled Students & Sections Metadata */}
                            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-2">
                              <span className="flex items-center gap-1 font-medium">
                                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                                {course.total_enrolled_students} Students
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1 font-medium">
                                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                {course.instances?.length || 0} Sections
                              </span>
                            </div>
                          </div>

                          {/* Attainment Score & Progress Gauge */}
                          <div className="bg-gray-50/80 dark:bg-gray-800/40 rounded-xl p-3.5 border border-gray-100 dark:border-gray-800">
                            <div className="flex items-baseline justify-between mb-1">
                              <div>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                                  Attainment Percentage
                                </span>
                                <span className="text-2xl font-black text-gray-900 dark:text-white">
                                  {course.average_copo_attainment_pct}%
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                                  OBE Scale
                                </span>
                                <span className="inline-block px-2 py-0.5 rounded text-xs font-black bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground border border-primary/20">
                                  Level {course.attainment_level.toFixed(2)} / 3.0
                                </span>
                              </div>
                            </div>

                            {/* Progress bar with target tick line at 60% */}
                            <div className="relative w-full h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mt-2">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  isMet
                                    ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                                    : isMod
                                    ? "bg-gradient-to-r from-amber-500 to-yellow-400"
                                    : "bg-gradient-to-r from-rose-500 to-red-400"
                                }`}
                                style={{ width: `${Math.min(course.average_copo_attainment_pct, 100)}%` }}
                              />
                              <div
                                className="absolute top-0 bottom-0 w-0.5 bg-gray-900 dark:bg-white/80 z-10"
                                style={{ left: "60%" }}
                                title="OBE Benchmark Target: 60%"
                              />
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-gray-400 mt-1 font-medium">
                              <span>0%</span>
                              <span className="text-primary font-bold">Target: 60% (Level 2.0)</span>
                              <span>100%</span>
                            </div>
                          </div>

                          {/* Program Outcomes (PO) Values Breakdown */}
                          {outcomeScope !== "pso" && course.po_averages && Object.keys(course.po_averages).length > 0 && (
                            <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  PO Attainment Values
                                </span>
                                <span className="text-[10px] text-gray-400">Scale 0 - 3.0</span>
                              </div>
                              <div className="grid grid-cols-4 gap-1.5">
                                {Object.entries(course.po_averages)
                                  .slice(0, 8)
                                  .map(([poKey, val]) => {
                                    const numVal = Number(val);
                                    const poMet = numVal >= 2.0;
                                    const poMod = numVal >= 1.5;
                                    return (
                                      <div
                                        key={poKey}
                                        className={`px-1.5 py-1 rounded text-center border text-[10px] font-bold transition-transform hover:scale-105 ${
                                          poMet
                                            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/80"
                                            : poMod
                                            ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/80"
                                            : "bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700"
                                        }`}
                                        title={`${poKey}: ${numVal.toFixed(2)} / 3.0`}
                                      >
                                        <span className="block text-[9px] text-gray-400 font-medium">{poKey}</span>
                                        <span>{numVal.toFixed(2)}</span>
                                      </div>
                                    );
                                  })}
                              </div>
                            </div>
                          )}

                          {/* Program Specific Outcomes (PSO) Section */}
                          {outcomeScope !== "po" && course.pso_averages && Object.keys(course.pso_averages).length > 0 && (
                            <div className="pt-2 border-t border-purple-100 dark:border-purple-900/30">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                                  PSO Attainment (Program Specific)
                                </span>
                                <span className="text-[10px] text-purple-500 font-semibold">Target ≥ 2.0</span>
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                {Object.entries(course.pso_averages).map(([psoKey, val]) => {
                                  const numVal = Number(val);
                                  const psoMet = numVal >= 2.0;
                                  const psoMod = numVal >= 1.5;
                                  const pct = Math.round((numVal / 3.0) * 100);

                                  return (
                                    <div
                                      key={psoKey}
                                      className={`p-2 rounded-xl border text-center transition-all hover:scale-[1.02] shadow-xs ${
                                        psoMet
                                          ? "bg-gradient-to-b from-purple-50/70 to-purple-100/40 dark:from-purple-950/30 dark:to-purple-900/20 border-purple-200 dark:border-purple-800/80 text-purple-900 dark:text-purple-200"
                                          : psoMod
                                          ? "bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200"
                                          : "bg-gray-50 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                                      }`}
                                    >
                                      <div className="flex items-center justify-between text-[10px] font-bold">
                                        <span className="text-purple-700 dark:text-purple-400 font-black">{psoKey}</span>
                                        <span className={`text-[9px] px-1 rounded ${psoMet ? "bg-purple-200/60 dark:bg-purple-800/60 text-purple-800 dark:text-purple-200 font-extrabold" : "text-gray-400"}`}>
                                          {pct}%
                                        </span>
                                      </div>
                                      <div className="text-sm font-black mt-0.5">
                                        {numVal.toFixed(2)}
                                        <span className="text-[9px] font-normal text-gray-400 ml-0.5">/ 3.0</span>
                                      </div>
                                      {/* Mini Progress Bar for each PSO */}
                                      <div className="w-full h-1 bg-purple-200/50 dark:bg-purple-950 rounded-full overflow-hidden mt-1.5">
                                        <div
                                          className={`h-full rounded-full ${
                                            psoMet
                                              ? "bg-purple-600 dark:bg-purple-400"
                                              : psoMod
                                              ? "bg-amber-500"
                                              : "bg-rose-500"
                                          }`}
                                          style={{ width: `${Math.min(pct, 100)}%` }}
                                        />
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Available Classroom Sections */}
                          <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                            <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-1.5">
                              Classroom Sections ({course.instances?.length || 0})
                            </span>
                            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                              {course.instances?.map((inst) => (
                                <button
                                  key={inst.instance_id}
                                  onClick={() => {
                                    setSelectedCourse(course);
                                    setSelectedInstance(inst);
                                  }}
                                  className="group/btn inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-50 dark:bg-gray-800 hover:bg-primary hover:text-white dark:hover:bg-primary text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 transition-all shadow-xs"
                                  title={`Inspect ${inst.instance_name} (${inst.instructor_name}) - ${inst.average_attainment_pct}%`}
                                >
                                  <span>{inst.instance_name}</span>
                                  <span className="text-[10px] opacity-75 font-normal">
                                    ({inst.average_attainment_pct}%)
                                  </span>
                                  <svg
                                    className="w-3 h-3 opacity-0 group-hover/btn:opacity-100 transition-opacity"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Card Action Footer */}
                        <div className="p-4 bg-gray-50/70 dark:bg-gray-800/30 border-t border-gray-100 dark:border-gray-800">
                          <button
                            onClick={() => {
                              setSelectedCourse(course);
                              if (course.instances && course.instances.length > 0) {
                                setSelectedInstance(course.instances[0]);
                              }
                            }}
                            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow"
                          >
                            <span>Inspect Detailed CO-PO Report</span>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* -- VIEW MODE 2: TABULAR VIEW (ALTERNATIVE SCANNING MODE) -- */}
          {viewMode === "table" && (
            <div className="bg-white dark:bg-[#1a2234] rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    Tabular Course Attainment Summary for {attainmentData.department_code}
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Click any classroom section to inspect its complete CO-PO matrix report.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-400 uppercase tracking-wider font-semibold">
                      <th className="py-3 px-4">Course Code</th>
                      <th className="py-3 px-4">Course Title</th>
                      <th className="py-3 px-3 text-center">Semester</th>
                      <th className="py-3 px-3 text-center">Enrolled</th>
                      <th className="py-3 px-4 text-center">Avg Attainment</th>
                      <th className="py-3 px-4 text-center">OBE Level</th>
                      <th className="py-3 px-4 text-center">PSO Level</th>
                      <th className="py-3 px-4 text-center">Target Status</th>
                      <th className="py-3 px-4 text-right">Classrooms</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {filteredAndSortedCourses.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-gray-400 font-medium">
                          No records match your criteria for department {attainmentData.department_code}.
                        </td>
                      </tr>
                    ) : (
                      filteredAndSortedCourses.map((course) => {
                        const isMet = course.average_copo_attainment_pct >= 60 || course.attainment_level >= 2.0;
                        return (
                          <tr
                            key={course.course_id}
                            className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors"
                          >
                            <td className="py-3 px-4 font-bold text-primary">
                              {course.course_code}
                            </td>
                            <td className="py-3 px-4 font-semibold text-gray-800 dark:text-gray-200">
                              {course.course_title}
                            </td>
                            <td className="py-3 px-3 text-center font-medium text-gray-500">
                              Sem {course.semester}
                            </td>
                            <td className="py-3 px-3 text-center font-medium text-gray-500">
                              {course.total_enrolled_students}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="inline-block px-2.5 py-1 rounded-lg font-extrabold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300">
                                {course.average_copo_attainment_pct}%
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                Level {course.attainment_level.toFixed(2)} / 3.0
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              {course.pso_averages && Object.keys(course.pso_averages).length > 0 ? (
                                <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                                  Level {(Object.values(course.pso_averages).reduce((a, b) => a + Number(b), 0) / Object.values(course.pso_averages).length).toFixed(2)} / 3.0
                                </span>
                              ) : (
                                <span className="text-gray-400">—</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {isMet ? (
                                <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  Target Met
                                </span>
                              ) : (
                                <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                  Action Needed
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                {course.instances.map((inst) => (
                                  <button
                                    key={inst.instance_id}
                                    onClick={() => {
                                      setSelectedCourse(course);
                                      setSelectedInstance(inst);
                                    }}
                                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-100 hover:bg-primary text-gray-700 hover:text-white dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-primary transition-all shadow-xs"
                                    title={`View ${inst.instance_name} (${inst.instructor_name})`}
                                  >
                                    {inst.instance_name} ({inst.average_attainment_pct}%)
                                  </button>
                                ))}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* -- VIEW 2: Exact Course & Instance / Class Chosen (Notation like course-instance/[instanceId].tsx) -- */}
      {selectedCourse && selectedInstance && (
        <div className="space-y-6 animate-fadeIn">
          {/* Class Header Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-primary text-white">
                  {selectedCourse.course_code}
                </span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  {selectedCourse.course_title}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Classroom Instance: <strong>{selectedInstance.instance_name}</strong>  -  Assigned Instructor: <strong>{selectedInstance.instructor_name}</strong>  -  Students: <strong>{selectedInstance.student_count}</strong>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[10px] text-gray-400 block font-medium">Class Average Attainment</span>
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                  {selectedInstance.average_attainment_pct}%
                </span>
              </div>

              <button
                onClick={handleBackToAllCourses}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 transition-colors"
              >
                ← Back to Courses
              </button>
            </div>
          </div>

          {/* Embedded Course Attainment Report matching course-instance/[instanceId].tsx notation */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
            <CourseAttainmentReport
              key={`report-${selectedCourse.course_id}-${selectedInstance.instance_id}`}
              courseId={String(selectedCourse.course_id)}
              offeringId={String(selectedInstance.instance_id)}
              courseMetadata={{
                course_code: selectedCourse.course_code,
                course_title: selectedCourse.course_title,
                instance_name: selectedInstance.instance_name,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AcademicAdminAttainmentView;
