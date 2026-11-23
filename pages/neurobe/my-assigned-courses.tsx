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
  Building2,
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

  // Primary tab: 'courses' or 'departments'
  const [mainTab, setMainTab] = useState<"courses" | "departments">("courses");

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

  // Departments State (for HOD assigned departments)
  const [deptLoading, setDeptLoading] = useState<boolean>(false);
  const [deptError, setDeptError] = useState<string | null>(null);
  const [departmentsData, setDepartmentsData] = useState<{
    summary?: {
      total_departments: number;
      active_departments: number;
      role?: string;
    };
    departments: any[];
  } | null>(null);
  const [deptSearch, setDeptSearch] = useState<string>("");
  const [deptStatusFilter, setDeptStatusFilter] = useState<string>("all");

  const [search, setSearch] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<"all" | "coordinator" | "instructor">("all");
  const [semesterFilter, setSemesterFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("code_asc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    dispatch(setPageTitle("Faculty Dashboard"));
  }, [dispatch]);

  // Handle URL tab param
  useEffect(() => {
    if (router.query.tab === "departments" || router.query.tab === "my-assigned-departments") {
      setMainTab("departments");
    } else if (router.query.tab === "courses") {
      setMainTab("courses");
    }
  }, [router.query.tab]);

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

  const fetchAssignedDepartments = async () => {
    try {
      setDeptLoading(true);
      setDeptError(null);
      let res: any;
      try {
        res = await Models.department.my_assigned_departments();
      } catch (e) {
        res = await Models.course.my_assigned_departments();
      }
      setDepartmentsData(res || { summary: { total_departments: 0, active_departments: 0 }, departments: [] });
    } catch (err: any) {
      console.error("Failed fetching assigned departments:", err);
      setDeptError(typeof err === "string" ? err : err?.message || "Failed to fetch assigned departments.");
    } finally {
      setDeptLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
    fetchAssignedDepartments();
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

  // Client-side filtering and sorting for courses
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

  // Filtered assigned departments
  const deptList = departmentsData?.departments || [];
  const filteredDepts = useMemo(() => {
    return deptList.filter((d: any) => {
      const q = deptSearch.trim().toLowerCase();
      if (q) {
        const matchName = (d.department_name || "").toLowerCase().includes(q);
        const matchCode = (d.department_short_name || "").toLowerCase().includes(q);
        const matchProg = (d.programme_name || "").toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchProg) return false;
      }
      if (deptStatusFilter !== "all") {
        if ((d.status || "active").toLowerCase() !== deptStatusFilter.toLowerCase()) return false;
      }
      return true;
    });
  }, [deptList, deptSearch, deptStatusFilter]);

  const hasActiveFilters = search.trim() !== "" || roleFilter !== "all" || semesterFilter !== "all";

  const clearAllFilters = () => {
    setSearch("");
    setRoleFilter("all");
    setSemesterFilter("all");
  };

  return (
    <div className="min-h-screen space-y-4 pb-8">
      {/* Top Primary Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={() => {
            setMainTab("courses");
            router.push("/neurobe/my-assigned-courses?tab=courses", undefined, { shallow: true });
          }}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
            mainTab === "courses"
              ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          <BookOpen className="h-4 w-4" />
          <span>My Assigned Courses</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {summary.total_courses}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setMainTab("departments");
            router.push("/neurobe/my-assigned-courses?tab=departments", undefined, { shallow: true });
          }}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
            mainTab === "departments"
              ? "border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          <Building2 className="h-4 w-4" />
          <span>My Assigned Departments</span>
          <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-bold text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
            {deptList.length}
          </span>
        </button>
      </div>

      {/* ─── TAB 1: MY COURSES ─── */}
      {mainTab === "courses" && (
        <div className="space-y-3">
          {/* Header & Page Title */}
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

          {/* Unified Compact Control Bar */}
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

              <div className="relative flex items-center">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="appearance-none rounded-lg border border-slate-200 bg-white py-1.5 pl-2 pr-6 text-xs font-medium text-slate-700 transition hover:border-slate-300 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  <option value="code_asc">Code (A-Z)</option>
                  <option value="code_desc">Code (Z-A)</option>
                  <option value="title_asc">Title (A-Z)</option>
                  <option value="readiness_desc">Readiness (High to Low)</option>
                  <option value="readiness_asc">Readiness (Low to High)</option>
                  <option value="semester_asc">Semester (Ascending)</option>
                </select>
                <ArrowUpDown className="pointer-events-none absolute right-2 h-3 w-3 text-slate-400" />
              </div>

              <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 dark:border-slate-700 dark:bg-slate-800">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  title="Grid View"
                  className={`rounded-md p-1 transition ${
                    viewMode === "grid"
                      ? "bg-white text-indigo-600 shadow-xs dark:bg-slate-700 dark:text-indigo-400"
                      : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  }`}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  title="List View"
                  className={`rounded-md p-1 transition ${
                    viewMode === "list"
                      ? "bg-white text-indigo-600 shadow-xs dark:bg-slate-700 dark:text-indigo-400"
                      : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  }`}
                >
                  <List className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Active Filter Badges */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
              <span className="font-medium text-slate-400">Filters:</span>
              {search && (
                <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  Search: "{search}"
                  <button type="button" onClick={() => setSearch("")} className="hover:text-slate-900">
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>
              )}
              {roleFilter !== "all" && (
                <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  Role: {roleFilter === "coordinator" ? "Coordinated" : "Instructor"}
                  <button type="button" onClick={() => setRoleFilter("all")} className="hover:text-slate-900">
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>
              )}
              {semesterFilter !== "all" && (
                <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  Sem: {semesterFilter}
                  <button type="button" onClick={() => setSemesterFilter("all")} className="hover:text-slate-900">
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>
              )}
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-[11px] font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Loading Skeleton */}
          {loading && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-44 animate-pulse rounded-xl border border-slate-200/60 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="h-4 w-24 rounded bg-slate-100 dark:bg-slate-800" />
                  <div className="mt-3 h-5 w-3/4 rounded bg-slate-100 dark:bg-slate-800" />
                  <div className="mt-6 h-2 w-full rounded bg-slate-100 dark:bg-slate-800" />
                  <div className="mt-4 flex gap-2">
                    <div className="h-6 w-16 rounded bg-slate-100 dark:bg-slate-800" />
                    <div className="h-6 w-16 rounded bg-slate-100 dark:bg-slate-800" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={fetchCourses}
                className="font-semibold underline hover:text-rose-900 dark:hover:text-rose-200"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Course Cards Grid */}
          {!loading && filteredAndSortedCourses.length > 0 && (
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
                  : "flex flex-col gap-2.5"
              }
            >
              {filteredAndSortedCourses.map((c) => (
                <AssignedCourseCard key={c.course_id} course={c} viewMode={viewMode} />
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
      )}

      {/* ─── TAB 2: MY ASSIGNED DEPARTMENTS (HOD DASHBOARD) ─── */}
      {mainTab === "departments" && (
        <div className="space-y-3">
          {/* Header & Page Title */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 pb-2.5 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                My Assigned Departments
              </h1>
              <span className="inline-flex items-center rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-bold text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                {deptList.length} Assigned as HOD
              </span>
            </div>

            <button
              type="button"
              onClick={fetchAssignedDepartments}
              disabled={deptLoading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 active:scale-95 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700/80"
            >
              <RefreshCw className={`h-3 w-3 ${deptLoading ? "animate-spin text-purple-500" : ""}`} />
              <span>{deptLoading ? "Refreshing..." : "Refresh"}</span>
            </button>
          </div>

          {/* Unified Compact Control Bar */}
          <div className="flex flex-col gap-2 rounded-xl border border-slate-200/90 bg-white p-2 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 sm:max-w-xs">
              <input
                type="text"
                value={deptSearch}
                onChange={(e) => setDeptSearch(e.target.value)}
                placeholder="Search department name or code..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50/70 py-1.5 pl-7 pr-6 text-xs text-slate-900 transition placeholder:text-slate-400 focus:border-purple-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2 text-slate-400">
                <IconSearch className="h-3.5 w-3.5" />
              </div>
              {deptSearch && (
                <button
                  type="button"
                  onClick={() => setDeptSearch("")}
                  className="absolute inset-y-0 right-0 flex items-center pr-2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <select
                value={deptStatusFilter}
                onChange={(e) => setDeptStatusFilter(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white py-1.5 px-2.5 text-xs font-medium text-slate-700 transition hover:border-slate-300 focus:border-purple-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>
          </div>

          {/* Loading */}
          {deptLoading && (
            <div className="flex items-center justify-center py-16">
              <RefreshCw className="h-6 w-6 animate-spin text-purple-600" />
            </div>
          )}

          {/* Error */}
          {deptError && !deptLoading && (
            <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                <span>{deptError}</span>
              </div>
              <button
                type="button"
                onClick={fetchAssignedDepartments}
                className="font-semibold underline hover:text-red-900"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Department Cards Grid */}
          {!deptLoading && filteredDepts.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredDepts.map((d: any) => (
                <div
                  key={d.id}
                  className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:border-purple-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-purple-800"
                >
                  <div>
                    {/* Top row: Code badge + Status */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center rounded-lg bg-purple-50 px-2.5 py-1 text-xs font-bold text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                        {d.department_short_name || "DEPT"}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                          (d.status || "").toLowerCase() === "active"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            (d.status || "").toLowerCase() === "active" ? "bg-emerald-500" : "bg-slate-400"
                          }`}
                        />
                        {d.status ? d.status.charAt(0).toUpperCase() + d.status.slice(1) : "Active"}
                      </span>
                    </div>

                    {/* Department Title */}
                    <h3 className="mt-3 text-base font-bold text-slate-900 group-hover:text-purple-600 dark:text-white dark:group-hover:text-purple-400">
                      {d.department_name}
                    </h3>

                    {/* Programme info if available */}
                    {d.programme_name && (
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        {d.programme_name}
                      </p>
                    )}

                    {/* Role Pill */}
                    <div className="mt-3 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        <span>Head of Department (HOD)</span>
                      </span>
                    </div>
                  </div>

                  {/* Metrics Footer */}
                  <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-800">
                    <div className="grid grid-cols-2 gap-2 text-center text-xs">
                      <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800/60">
                        <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                          {d.courses_count ?? 0}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">Assigned Courses</div>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800/60">
                        <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                          {d.faculties_count ?? 0}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">Faculty Members</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!deptLoading && filteredDepts.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white py-14 px-4 text-center dark:border-slate-800 dark:bg-slate-900">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400">
                <Building2 className="h-6 w-6" />
              </div>
              <h3 className="mt-3 text-base font-bold text-slate-900 dark:text-white">
                {deptSearch ? "No Matching Departments Found" : "No Assigned Departments"}
              </h3>
              <p className="mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">
                {deptSearch
                  ? "Try clearing your search query to see all your assigned departments."
                  : "You have not been assigned as Head of Department (HOD) to any department yet. Institutional administrators can assign you in Academic Setup."}
              </p>
              {deptSearch && (
                <button
                  type="button"
                  onClick={() => setDeptSearch("")}
                  className="mt-3.5 inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-purple-700 active:scale-95"
                >
                  <X className="h-3 w-3" />
                  <span>Clear Search</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PrivateRouter(MyAssignedCourses);
