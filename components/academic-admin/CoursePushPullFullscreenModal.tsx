import React, { useState, useMemo, useEffect } from "react";
import { CoursePushPullItem, KLevelKey } from "@/services/academicAdminAnalytics.service";

interface CoursePushPullFullscreenModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "cia" | "mcq";
  targetBenchmark: number;
  coursesPushingUp: CoursePushPullItem[];
  coursesPullingDown: CoursePushPullItem[];
  activeKLevels?: KLevelKey[];
  department?: string;
  batch?: string;
  scope?: string;
}

type FilterCategory = "all" | "pushing_up" | "pulling_down";
type SortField = "score" | "diff" | "code" | "name" | "semester" | "department";
type SortOrder = "asc" | "desc";

export const CoursePushPullFullscreenModal: React.FC<CoursePushPullFullscreenModalProps> = ({
  isOpen,
  onClose,
  type,
  targetBenchmark,
  coursesPushingUp,
  coursesPullingDown,
  department = "ALL",
  batch = "ALL",
  scope = "ALL",
}) => {
  // Filter and Sorting State
  const [filterCategory, setFilterCategory] = useState<FilterCategory>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>("ALL");
  const [sortField, setSortField] = useState<SortField>("score");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // Keyboard escape listener
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Combine courses into a normalized enriched list
  const allCourses = useMemo(() => {
    const list: Array<
      CoursePushPullItem & {
        isAbove: boolean;
        diffFromTarget: number;
        statusLabel: "Pull Up" | "Low / Pull Down";
      }
    > = [];

    (coursesPushingUp || []).forEach((c) => {
      const diff = Number((c.attainment_pct - targetBenchmark).toFixed(1));
      list.push({
        ...c,
        isAbove: true,
        diffFromTarget: diff,
        statusLabel: "Pull Up",
      });
    });

    (coursesPullingDown || []).forEach((c) => {
      const diff = Number((c.attainment_pct - targetBenchmark).toFixed(1));
      list.push({
        ...c,
        isAbove: false,
        diffFromTarget: diff,
        statusLabel: "Low / Pull Down",
      });
    });

    return list;
  }, [coursesPushingUp, coursesPullingDown, targetBenchmark]);

  // Extract unique departments for filter dropdown
  const uniqueDepartments = useMemo(() => {
    const depts = new Set<string>();
    allCourses.forEach((c) => {
      if (c.department_code) depts.add(c.department_code);
    });
    return Array.from(depts).sort();
  }, [allCourses]);

  // Filtered & Sorted courses
  const displayedCourses = useMemo(() => {
    let result = [...allCourses];

    // 1. Status Filter
    if (filterCategory === "pushing_up") {
      result = result.filter((c) => c.isAbove);
    } else if (filterCategory === "pulling_down") {
      result = result.filter((c) => !c.isAbove);
    }

    // 2. Department Filter
    if (selectedDeptFilter !== "ALL") {
      result = result.filter((c) => c.department_code === selectedDeptFilter);
    }

    // 3. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.course_code.toLowerCase().includes(q) ||
          c.course_name.toLowerCase().includes(q) ||
          (c.department_code && c.department_code.toLowerCase().includes(q))
      );
    }

    // 4. Sorting
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "score":
          comparison = a.attainment_pct - b.attainment_pct;
          break;
        case "diff":
          comparison = a.diffFromTarget - b.diffFromTarget;
          break;
        case "code":
          comparison = a.course_code.localeCompare(b.course_code);
          break;
        case "name":
          comparison = a.course_name.localeCompare(b.course_name);
          break;
        case "semester":
          comparison = (a.semester || 0) - (b.semester || 0);
          break;
        case "department":
          comparison = (a.department_code || "").localeCompare(b.department_code || "");
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return result;
  }, [allCourses, filterCategory, selectedDeptFilter, searchQuery, sortField, sortOrder]);

  if (!isOpen) return null;

  const pullUpsCount = coursesPushingUp?.length || 0;
  const lowsCount = coursesPullingDown?.length || 0;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex flex-col overflow-hidden animate-fadeIn">
      {/* ── Top Bar / Header ── */}
      <header className="bg-white dark:bg-[#1a2234] border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex flex-wrap items-center justify-between gap-4 shadow-sm shrink-0">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-black uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
              {type.toUpperCase()} Academic Performance
            </span>
            <span className="text-xs text-gray-400 font-medium">•</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Benchmark Target: <strong>{targetBenchmark}%</strong>
            </span>
            {department !== "ALL" && (
              <>
                <span className="text-xs text-gray-400 font-medium">•</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Dept: <strong>{department}</strong>
                </span>
              </>
            )}
            {batch !== "ALL" && (
              <>
                <span className="text-xs text-gray-400 font-medium">•</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Batch: <strong>{batch}</strong>
                </span>
              </>
            )}
            {scope !== "ALL" && (
              <>
                <span className="text-xs text-gray-400 font-medium">•</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Scope: <strong>{scope}</strong>
                </span>
              </>
            )}
          </div>
          <h1 className="text-xl lg:text-2xl font-black text-gray-900 dark:text-white tracking-tight mt-1 flex items-center gap-3">
            <span>Course Performance Highlights — Pull Ups & Lows</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
              Cards Full-Screen View
            </span>
          </h1>
        </div>

        {/* Header Right: Counts + Close Button */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Quick Stats Badges */}
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800/70 p-1.5 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold text-xs">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              <span>Pull Ups: {pullUpsCount}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-500/10 text-rose-700 dark:text-rose-300 font-bold text-xs">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
              <span>Lows: {lowsCount}</span>
            </div>
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-all border border-gray-300 dark:border-gray-700 shadow-xs"
            title="Close full-screen cards view (Esc)"
          >
            <span>Close View</span>
            <kbd className="px-1.5 py-0.5 text-[10px] bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded">
              ESC
            </kbd>
          </button>
        </div>
      </header>

      {/* ── Toolbar: Filters, Search, Ordering & Sorting Controls ── */}
      <div className="bg-white/90 dark:bg-[#1a2234]/90 border-b border-gray-200/80 dark:border-gray-800/80 px-6 py-3 flex flex-wrap items-center justify-between gap-4 shrink-0 backdrop-blur-xs">
        {/* Left: Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={() => setFilterCategory("all")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              filterCategory === "all"
                ? "bg-white dark:bg-gray-900 text-primary shadow-xs"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            All Courses ({allCourses.length})
          </button>

          <button
            type="button"
            onClick={() => setFilterCategory("pushing_up")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              filterCategory === "pushing_up"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            <span>Pull Ups ({pullUpsCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterCategory("pulling_down")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              filterCategory === "pulling_down"
                ? "bg-rose-600 text-white shadow-xs"
                : "text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
            <span>Lows ({lowsCount})</span>
          </button>
        </div>

        {/* Right: Search + Department Filter + Sort Field + Sort Direction */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search Box */}
          <div className="relative min-w-[220px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search course code or title..."
              className="w-full text-xs py-1.5 pl-8 pr-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary shadow-2xs"
            />
            <svg
              className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2"
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
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Department Filter (if multiple) */}
          {uniqueDepartments.length > 1 && (
            <div className="flex items-center gap-1 text-xs">
              <span className="font-semibold text-gray-600 dark:text-gray-400">Dept:</span>
              <select
                value={selectedDeptFilter}
                onChange={(e) => setSelectedDeptFilter(e.target.value)}
                className="form-select text-xs py-1 px-2.5 rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-medium"
              >
                <option value="ALL">ALL ({allCourses.length})</option>
                {uniqueDepartments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Ordering / Sorting Field */}
          <div className="flex items-center gap-1 text-xs">
            <span className="font-semibold text-gray-600 dark:text-gray-400">Sort by:</span>
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as SortField)}
              className="form-select text-xs py-1 px-2.5 rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-medium"
            >
              <option value="score">{type === "cia" ? "Attainment Score" : "Test Score"}</option>
              <option value="diff">Difference vs Target</option>
              <option value="code">Course Code</option>
              <option value="name">Course Name</option>
              <option value="semester">Semester</option>
              <option value="department">Department</option>
            </select>
          </div>

          {/* Ascending / Descending Toggle Button */}
          <button
            type="button"
            onClick={() => setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 shadow-2xs"
            title={`Current: ${sortOrder === "desc" ? "Descending (Highest first)" : "Ascending (Lowest first)"}. Click to toggle.`}
          >
            {sortOrder === "desc" ? (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                </svg>
                <span>High → Low</span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
                </svg>
                <span>Low → High</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Main Body: Cards Alone in Full-Screen Responsive Grid ── */}
      <main className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-[#0f172a]">
        {displayedCourses.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 mb-3 shadow-inner">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-gray-800 dark:text-gray-200">
              No Courses Match Your Criteria
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mt-1 mb-4">
              Try adjusting your search terms, changing the department filter, or switching between Pull Ups and Lows.
            </p>
            <button
              type="button"
              onClick={() => {
                setFilterCategory("all");
                setSearchQuery("");
                setSelectedDeptFilter("ALL");
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-primary text-white hover:bg-primary-dark transition-all shadow-xs"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-4.5">
            {displayedCourses.map((c) => {
              const pct = c.attainment_pct;
              const isAbove = c.isAbove;
              const diff = c.diffFromTarget;

              return (
                <div
                  key={`${c.course_code}-${c.department_code || ""}`}
                  className={`rounded-2xl p-4.5 transition-all duration-200 border flex flex-col justify-between shadow-xs hover:shadow-md ${
                    isAbove
                      ? "bg-white dark:bg-[#1a2234] border-emerald-200 dark:border-emerald-800/60 hover:border-emerald-400 dark:hover:border-emerald-600"
                      : "bg-white dark:bg-[#1a2234] border-rose-200 dark:border-rose-800/60 hover:border-rose-400 dark:hover:border-rose-600"
                  }`}
                >
                  {/* Card Header: Badges & Status */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      {/* Pull Up / Low Status Pill */}
                      {isAbove ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wide uppercase bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                          </svg>
                          <span>Pull Up</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wide uppercase bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                          </svg>
                          <span>Low / Pull Down</span>
                        </span>
                      )}

                      {/* Department & Semester Pill */}
                      <div className="flex items-center gap-1">
                        {c.department_code && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                            {c.department_code}
                          </span>
                        )}
                        {c.semester && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                            Sem {c.semester}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Course Code & Name */}
                    <h3 className="text-base font-extrabold text-gray-900 dark:text-white tracking-tight">
                      {c.course_code}
                    </h3>
                    <p
                      className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 mt-0.5 font-medium min-h-[32px]"
                      title={c.course_name}
                    >
                      {c.course_name}
                    </p>
                  </div>

                  {/* Card Score & Progress Section */}
                  <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800/80 space-y-2">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">
                          {type === "cia" ? "Attainment" : "Score"}
                        </span>
                        <span
                          className={`text-2xl font-black tracking-tight ${
                            isAbove ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {pct.toFixed(1)}%
                        </span>
                      </div>

                      {/* Difference vs Benchmark Pill */}
                      <div className="text-right">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-black ${
                            isAbove
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                              : "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                          }`}
                        >
                          {diff >= 0 ? `+${diff}%` : `${diff}%`}
                        </span>
                        <span className="text-[9px] text-gray-400 block mt-0.5 font-medium">
                          vs {targetBenchmark}% target
                        </span>
                      </div>
                    </div>

                    {/* Visual Progress Bar with Target Marker Line */}
                    <div className="relative pt-1">
                      <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isAbove ? "bg-emerald-500" : "bg-rose-500"
                          }`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                      {/* Target benchmark reference line */}
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-gray-700 dark:bg-gray-300 pointer-events-none"
                        style={{ left: `${targetBenchmark}%` }}
                        title={`Target Benchmark: ${targetBenchmark}%`}
                      />
                    </div>

                    {/* Optional K-Levels mini chips if available */}
                    {c.k_levels && Object.keys(c.k_levels).length > 0 && (
                      <div className="pt-1.5 flex flex-wrap gap-1">
                        {Object.entries(c.k_levels).map(([k, score]) => (
                          <span
                            key={k}
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                              Number(score) >= targetBenchmark
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
                                : "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300"
                            }`}
                          >
                            {k}: {Number(score).toFixed(0)}%
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="bg-white dark:bg-[#1a2234] border-t border-gray-200 dark:border-gray-800 px-6 py-3 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 shrink-0">
        <div>
          Showing <strong>{displayedCourses.length}</strong> of <strong>{allCourses.length}</strong> courses (
          <span className="text-emerald-600 dark:text-emerald-400 font-bold">{pullUpsCount} Pull Ups</span>,{" "}
          <span className="text-rose-600 dark:text-rose-400 font-bold">{lowsCount} Lows</span>) • Benchmark: {targetBenchmark}%
        </div>
        <div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors"
          >
            Close Full Screen
          </button>
        </div>
      </footer>
    </div>
  );
};

export default CoursePushPullFullscreenModal;

