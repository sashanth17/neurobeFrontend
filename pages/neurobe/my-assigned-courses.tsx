import React, { useEffect, useState, useMemo } from "react";
import { useDispatch } from "react-redux";
import { setPageTitle } from "@/store/themeConfigSlice";
import IconSearch from "@/components/Icon/IconSearch";
import PrivateRouter from "@/hook/privateRouter";
import AssignedCourseCard, { AssignedCourseItem } from "@/components/academic-setup/AssignedCourseCard";
import Models from "@/imports/models.import";
import { useRouter } from "next/router";
import {
  BookOpen,
  ShieldCheck,
  UserCheck,
  RefreshCw,
  AlertCircle,
  LayoutGrid,
  List,
  ArrowUpDown,
  X,
  Calendar,
  Sparkles,
  Filter,
} from "lucide-react";

type SortOption =
  | "code_asc"
  | "code_desc"
  | "title_asc"
  | "readiness_desc"
  | "readiness_asc"
  | "semester_asc";

const MyAssignedCourses = () => {
  const dispatch = useDispatch();
  const router = useRouter();

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [data, setData] = useState<{
    summary?: {
      total_courses: number;
      coordinator_courses: number;
      instructor_courses: number;
    };
    courses: AssignedCourseItem[];
  } | null>(null);

  const [search, setSearch] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<"all" | "coordinator" | "instructor">("all");
  const [semesterFilter, setSemesterFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("code_asc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    dispatch(setPageTitle("My Courses"));
  }, [dispatch]);

  // Load once on mount / manual refresh only (ZERO background polling)
  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const res: any = await Models.course.my_assigned_courses();
      setData(res || { summary: { total_courses: 0, coordinator_courses: 0, instructor_courses: 0 }, courses: [] });
      setLastRefreshed(new Date());
    } catch (err: any) {
      console.error("Failed fetching assigned courses:", err);
      setError(typeof err === "string" ? err : err?.message || "Failed to fetch assigned courses.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const coursesList = data?.courses || [];

  // Extract unique available semesters for dropdown
  const availableSemesters = useMemo(() => {
    const sems = new Set<string>();
    coursesList.forEach((c) => {
      if (c.semester !== null && c.semester !== undefined) {
        sems.add(String(c.semester));
      }
    });
    return Array.from(sems).sort((a, b) => Number(a) - Number(b));
  }, [coursesList]);

  // Client-side filtering and sorting (zero re-fetch needed)
  const filteredAndSortedCourses = useMemo(() => {
    const filtered = coursesList.filter((c) => {
      // 1. Search filter
      const q = search.trim().toLowerCase();
      if (q) {
        const matchCode = (c.course_code || "").toLowerCase().includes(q);
        const matchTitle = (c.course_title || "").toLowerCase().includes(q);
        const matchDept = (c.department_name || "").toLowerCase().includes(q);
        const matchProg = (c.programme_name || "").toLowerCase().includes(q);
        if (!matchCode && !matchTitle && !matchDept && !matchProg) {
          return false;
        }
      }

      // 2. Role filter
      if (roleFilter === "coordinator" && !c.is_coordinator) {
        return false;
      }
      if (roleFilter === "instructor" && c.is_coordinator) {
        return false;
      }

      // 3. Semester filter
      if (semesterFilter !== "all" && String(c.semester) !== semesterFilter) {
        return false;
      }

      return true;
    });

    // 4. Sorting
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "code_asc":
          return (a.course_code || "").localeCompare(b.course_code || "");
        case "code_desc":
          return (b.course_code || "").localeCompare(a.course_code || "");
        case "title_asc":
          return (a.course_title || "").localeCompare(b.course_title || "");
        case "readiness_desc":
          return (b.readiness_percentage ?? 0) - (a.readiness_percentage ?? 0);
        case "readiness_asc":
          return (a.readiness_percentage ?? 0) - (b.readiness_percentage ?? 0);
        case "semester_asc":
          return Number(a.semester || 0) - Number(b.semester || 0);
        default:
          return 0;
      }
    });
  }, [coursesList, search, roleFilter, semesterFilter, sortBy]);

  const summary = useMemo(() => {
    if (data?.summary) return data.summary;
    return {
      total_courses: coursesList.length,
      coordinator_courses: coursesList.filter((c) => c.is_coordinator).length,
      instructor_courses: coursesList.filter((c) => !c.is_coordinator).length,
    };
  }, [data, coursesList]);

  const hasActiveFilters = search.trim() !== "" || roleFilter !== "all" || semesterFilter !== "all";

  const clearAllFilters = () => {
    setSearch("");
    setRoleFilter("all");
    setSemesterFilter("all");
  };

  return (
    <div className="min-h-screen space-y-3 pb-8">
      {/* Header & Page Title - Compact Single Line */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 pb-2.5 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            My Courses
          </h1>
          <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
            {summary.total_courses} Enrolled
          </span>
          {lastRefreshed && (
            <span className="hidden text-xs text-slate-400 dark:text-slate-500 sm:inline">
              • Updated {lastRefreshed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={fetchCourses}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 active:scale-95 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700/80"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin text-indigo-500" : ""}`} />
          <span>{loading ? "Refreshing..." : "Refresh"}</span>
        </button>
      </div>

      {/* Unified Compact Control Bar (KPI Tabs + Search + Filters in ONE Sleek Row) */}
      <div className="flex flex-col gap-2 rounded-xl border border-slate-200/90 bg-white p-2 shadow-xs dark:border-slate-800 dark:bg-slate-900 md:flex-row md:items-center md:justify-between">
        {/* Left: Role Filter Tabs with Metric Badges */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          <button
            type="button"
            onClick={() => setRoleFilter("all")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
              roleFilter === "all"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>All Courses</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                roleFilter === "all"
                  ? "bg-white/20 text-white"
                  : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
              }`}
            >
              {summary.total_courses}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setRoleFilter("coordinator")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
              roleFilter === "coordinator"
                ? "bg-purple-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Coordinated</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                roleFilter === "coordinator"
                  ? "bg-white/20 text-white"
                  : "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300"
              }`}
            >
              {summary.coordinator_courses}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setRoleFilter("instructor")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
              roleFilter === "instructor"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            }`}
          >
            <UserCheck className="h-3.5 w-3.5" />
            <span>Instructor</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                roleFilter === "instructor"
                  ? "bg-white/20 text-white"
                  : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
              }`}
            >
              {summary.instructor_courses}
            </span>
          </button>
        </div>

        {/* Right: Search + Semester + Sort + View Mode */}
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Compact Search Input */}
          <div className="relative flex-1 sm:w-56 md:w-60">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search code, title, dept..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50/70 py-1.5 pl-7 pr-6 text-xs text-slate-900 transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
            />
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2 text-slate-400">
              <IconSearch className="h-3.5 w-3.5" />
            </div>
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute inset-y-0 right-0 flex items-center pr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Semester Dropdown */}
          {availableSemesters.length > 0 && (
            <select
              value={semesterFilter}
              onChange={(e) => setSemesterFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white py-1.5 px-2 text-xs font-medium text-slate-700 transition hover:border-slate-300 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              <option value="all">All Sem</option>
              {availableSemesters.map((s) => (
                <option key={s} value={s}>
                  Sem {s}
                </option>
              ))}
            </select>
          )}

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="rounded-lg border border-slate-200 bg-white py-1.5 px-2 text-xs font-medium text-slate-700 transition hover:border-slate-300 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            <option value="code_asc">Code (A-Z)</option>
            <option value="code_desc">Code (Z-A)</option>
            <option value="title_asc">Title (A-Z)</option>
            <option value="readiness_desc">Readiness (High)</option>
            <option value="readiness_asc">Readiness (Low)</option>
            <option value="semester_asc">Semester (Asc)</option>
          </select>

          {/* View Mode Toggle */}
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              title="Grid View"
              className={`rounded p-1 transition ${
                viewMode === "grid"
                  ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400"
                  : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              title="List View"
              className={`rounded p-1 transition ${
                viewMode === "list"
                  ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400"
                  : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Slim Active Filter Notice if filtered */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-1">
          <span>
            Showing <strong className="text-slate-900 dark:text-white">{filteredAndSortedCourses.length}</strong> of{" "}
            {coursesList.length} courses
          </span>
          <button
            type="button"
            onClick={clearAllFilters}
            className="font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
          >
            Reset filters
          </button>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-400">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={fetchCourses}
            className="rounded bg-rose-100 px-2 py-1 font-semibold text-rose-800 hover:bg-rose-200 dark:bg-rose-900/50 dark:text-rose-300"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && !data && (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 gap-3.5 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4"
              : "space-y-2.5"
          }
        >
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-xs dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-center justify-between">
                <div className="h-4 w-20 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="h-4 w-12 rounded-full bg-slate-200 dark:bg-slate-800" />
              </div>
              <div className="mt-2.5 h-4 w-3/4 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="mt-2 h-3 w-1/2 rounded bg-slate-100 dark:bg-slate-800/60" />
              <div className="mt-3 grid grid-cols-5 gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <div key={s} className="h-7 rounded bg-slate-100 dark:bg-slate-800/60" />
                ))}
              </div>
              <div className="mt-3 h-7 rounded-lg bg-slate-200 dark:bg-slate-800" />
            </div>
          ))}
        </div>
      )}

      {/* Courses Display (Grid or List) */}
      {!loading && filteredAndSortedCourses.length > 0 && (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 gap-3.5 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4"
              : "space-y-2"
          }
        >
          {filteredAndSortedCourses.map((c) => (
            <AssignedCourseCard
              key={c.course_id}
              course={c}
              viewMode={viewMode}
              onOpenCourse={(id) => router.push(`/neurobe/course-artifacts?course_id=${id}`)}
              onOpenVersionHistory={(id) => router.push(`/neurobe/course-version-history?course_id=${id}`)}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredAndSortedCourses.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white py-12 px-4 text-center dark:border-slate-800 dark:bg-slate-900">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-500 dark:bg-indigo-950/50 dark:text-indigo-400">
            <BookOpen className="h-6 w-6" />
          </div>
          <h3 className="mt-3 text-base font-bold text-slate-900 dark:text-white">
            No Assigned Courses Found
          </h3>
          <p className="mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">
            {hasActiveFilters
              ? "No courses matched your current filter criteria."
              : "You have not been assigned to any courses yet. Please contact your administrator."}
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="mt-3.5 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-indigo-700 active:scale-95 dark:bg-indigo-500"
            >
              <Filter className="h-3 w-3" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default PrivateRouter(MyAssignedCourses);
