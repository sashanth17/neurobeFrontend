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
  CheckCircle2,
  Target,
  GraduationCap,
  Users,
  BarChart3,
  Layers,
  ChevronRight,
  Info,
  ExternalLink,
  Loader2,
  TrendingUp,
  TrendingDown,
  Award,
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
      total_classrooms?: number;
      total_enrolled_students?: number;
      avg_syllabus_pct?: number;
      role?: string;
    };
    departments: any[];
  } | null>(null);
  const [deptSearch, setDeptSearch] = useState<string>("");
  const [deptStatusFilter, setDeptStatusFilter] = useState<string>("all");

  // State for Department Intelligence Dashboard Modal
  const [selectedDeptForDashboard, setSelectedDeptForDashboard] = useState<any | null>(null);
  const [deptDashboardLoading, setDeptDashboardLoading] = useState<boolean>(false);
  const [deptDashboardData, setDeptDashboardData] = useState<any | null>(null);
  const [deptDashboardError, setDeptDashboardError] = useState<string | null>(null);
  const [deptActiveSection, setDeptActiveSection] = useState<"courses" | "classrooms" | "outliers" | "blooms" | "copo" | "insights">("courses");
  const [deptInsightsTab, setDeptInsightsTab] = useState<"insights" | "suggestions">("insights");

  const handleOpenDeptDashboard = async (dept: any) => {
    setSelectedDeptForDashboard(dept);
    setDeptDashboardLoading(true);
    setDeptDashboardError(null);
    setDeptActiveSection("courses");
    try {
      const res: any = await Models.department.getDepartmentDashboard(dept.id);
      setDeptDashboardData(res);
    } catch (err: any) {
      console.error("Failed to load department dashboard:", err);
      setDeptDashboardError(typeof err === "string" ? err : err?.message || "Failed to load department dashboard intelligence.");
    } finally {
      setDeptDashboardLoading(false);
    }
  };

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
                    ? "bg-color1 text-white shadow-xs"
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

          {/* Department KPI Summary Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>Assigned Depts</span>
                <Building2 className="h-4 w-4 text-purple-600" />
              </div>
              <div className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
                {departmentsData?.summary?.total_departments ?? deptList.length}
              </div>
              <div className="text-[10px] text-purple-600 font-semibold mt-0.5">HOD Administration</div>
            </div>

            <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>Total Courses</span>
                <BookOpen className="h-4 w-4 text-indigo-600" />
              </div>
              <div className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
                {deptList.reduce((acc, d) => acc + (d.courses_count || 0), 0)}
              </div>
              <div className="text-[10px] text-slate-400 font-medium mt-0.5">Department Offerings</div>
            </div>

            <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>Total Classrooms</span>
                <GraduationCap className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
                {departmentsData?.summary?.total_classrooms ?? deptList.reduce((acc, d) => acc + (d.classrooms_count || 0), 0)}
              </div>
              <div className="text-[10px] text-slate-400 font-medium mt-0.5">Active Sections</div>
            </div>

            <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>Total Faculty</span>
                <ShieldCheck className="h-4 w-4 text-amber-600" />
              </div>
              <div className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
                {deptList.reduce((acc, d) => acc + (d.faculties_count || 0), 0)}
              </div>
              <div className="text-[10px] text-slate-400 font-medium mt-0.5">Department Members</div>
            </div>

            <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>Enrolled Students</span>
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <div className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
                {departmentsData?.summary?.total_enrolled_students ?? deptList.reduce((acc, d) => acc + (d.enrolled_students || 0), 0)}
              </div>
              <div className="text-[10px] text-slate-400 font-medium mt-0.5">Across Department</div>
            </div>
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
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">Courses</div>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800/60">
                        <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                          {d.classrooms_count ?? 0}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">Classrooms</div>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800/60">
                        <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                          {d.faculties_count ?? 0}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">Faculty</div>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800/60">
                        <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                          {d.enrolled_students ?? 0}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">Students</div>
                      </div>
                    </div>

                    {/* View Intelligence Action Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenDeptDashboard(d)}
                      className="mt-3.5 flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 py-2 px-3 text-xs font-bold text-white shadow-xs transition hover:bg-purple-700 active:scale-98 dark:bg-purple-500 dark:hover:bg-purple-600"
                    >
                      <BarChart3 className="h-3.5 w-3.5" />
                      <span>View Department Intelligence</span>
                    </button>
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

      {/* ─── MODAL: DEPARTMENT INTELLIGENCE DASHBOARD ─── */}
      {selectedDeptForDashboard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative flex max-h-[92vh] w-full max-w-5xl flex-col rounded-3xl bg-white shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-100 text-purple-600 dark:bg-purple-950/60 dark:text-purple-300">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                      {selectedDeptForDashboard.department_name}
                    </h2>
                    <span className="rounded-md bg-purple-100 px-2 py-0.5 text-xs font-bold text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                      {selectedDeptForDashboard.department_short_name || "DEPT"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Department Intelligence &amp; Aggregated Classroom Analytics (HOD View)
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedDeptForDashboard(null);
                  setDeptDashboardData(null);
                }}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {deptDashboardLoading && (
                <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-600 mb-2" />
                  <p className="text-xs font-medium">Aggregating department classroom telemetry...</p>
                </div>
              )}

              {deptDashboardError && !deptDashboardLoading && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
                  <div className="flex items-center gap-2 font-bold mb-1">
                    <AlertCircle className="h-4 w-4" /> Error Loading Department Intelligence
                  </div>
                  <p>{deptDashboardError}</p>
                </div>
              )}

              {!deptDashboardLoading && deptDashboardData && (
                <>
                  {/* Top-Level Department Counters (Section 4.2) */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                      <div className="text-xs font-semibold text-slate-500">Department Courses</div>
                      <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                        {deptDashboardData.department?.total_courses || 0}
                      </div>
                      <div className="text-[11px] text-purple-600 font-semibold mt-0.5">
                        {deptDashboardData.department?.classrooms_count || 0} active classrooms
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                      <div className="text-xs font-semibold text-slate-500">Total Students</div>
                      <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                        {deptDashboardData.department?.total_students || 0}
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                        Enrolled across sections
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                      <div className="text-xs font-semibold text-slate-500">Total Faculty</div>
                      <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                        {deptDashboardData.department?.total_faculty || 0}
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                        Teaching &amp; coordinators
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                      <div className="text-xs font-semibold text-slate-500">Syllabus Completion</div>
                      <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                        {deptDashboardData.syllabus_progress?.completion_percentage || 0}%
                      </div>
                      <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">
                        {deptDashboardData.syllabus_progress?.completed_topics || 0} / {deptDashboardData.syllabus_progress?.total_topics || 0} topics
                      </div>
                    </div>
                  </div>

                  {/* Secondary Assessment Metrics Banner */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-2xl border border-slate-200/90 bg-white dark:bg-slate-800/70 p-3.5 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-slate-500">CIA Class Average</div>
                        <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                          {deptDashboardData.cia_performance?.average_score_pct != null
                            ? `${deptDashboardData.cia_performance.average_score_pct}%`
                            : "No assessments"}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] font-bold text-indigo-600">
                          {deptDashboardData.cia_performance?.pass_rate_pct != null
                            ? `Pass: ${deptDashboardData.cia_performance.pass_rate_pct}%`
                            : "Pending evaluation"}
                        </span>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200/90 bg-white dark:bg-slate-800/70 p-3.5 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-slate-500">MCQ Assessment</div>
                        <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                          {deptDashboardData.mcq_performance?.average_score_pct != null
                            ? `${deptDashboardData.mcq_performance.average_score_pct}%`
                            : "No attempts"}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] font-bold text-amber-600">
                          {deptDashboardData.mcq_performance?.total_attempts || 0} attempts
                        </span>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200/90 bg-white dark:bg-slate-800/70 p-3.5 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-slate-500">Program Outcomes (PO)</div>
                        <div className="text-lg font-black text-purple-700 dark:text-purple-300 mt-0.5">
                          {deptDashboardData.copo_attainment?.average_po_percentage != null
                            ? `${deptDashboardData.copo_attainment.average_po_percentage}%`
                            : "Yet to be calculated"}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] font-bold text-purple-600">
                          {deptDashboardData.copo_attainment?.average_po_level != null
                            ? `Level: ${deptDashboardData.copo_attainment.average_po_level} / 3.0`
                            : "Scale 0-3"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Section Tabs */}
                  <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-1">
                    <button
                      type="button"
                      onClick={() => setDeptActiveSection("courses")}
                      className={`border-b-2 px-3 py-2 text-xs font-bold whitespace-nowrap transition ${
                        deptActiveSection === "courses"
                          ? "border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400"
                          : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400"
                      }`}
                    >
                      Courses &amp; Batches ({deptDashboardData.courses_breakdown?.length || 0})
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeptActiveSection("classrooms")}
                      className={`border-b-2 px-3 py-2 text-xs font-bold whitespace-nowrap transition ${
                        deptActiveSection === "classrooms"
                          ? "border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400"
                          : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400"
                      }`}
                    >
                      Classrooms ({deptDashboardData.classrooms_comparison?.length || 0})
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeptActiveSection("outliers")}
                      className={`border-b-2 px-3 py-2 text-xs font-bold whitespace-nowrap transition ${
                        deptActiveSection === "outliers"
                          ? "border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400"
                          : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400"
                      }`}
                    >
                      Statistical Outliers (σ)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeptActiveSection("blooms")}
                      className={`border-b-2 px-3 py-2 text-xs font-bold whitespace-nowrap transition ${
                        deptActiveSection === "blooms"
                          ? "border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400"
                          : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400"
                      }`}
                    >
                      Bloom&apos;s Taxonomy (K1-K6)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeptActiveSection("copo")}
                      className={`border-b-2 px-3 py-2 text-xs font-bold whitespace-nowrap transition ${
                        deptActiveSection === "copo"
                          ? "border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400"
                          : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400"
                      }`}
                    >
                      PO Attainment (NBA)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeptActiveSection("insights")}
                      className={`border-b-2 px-3 py-2 text-xs font-bold whitespace-nowrap transition ${
                        deptActiveSection === "insights"
                          ? "border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400"
                          : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400"
                      }`}
                    >
                      Key Insights &amp; Suggestions
                    </button>
                  </div>

                  {/* ── Tab 1: Courses & Batch Performance ── */}
                  {deptActiveSection === "courses" && (
                    <div className="space-y-5">
                      {/* Batch Performance Segmentation (Section 4.2) */}
                      <div>
                        <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-1.5">
                          <GraduationCap className="h-4 w-4 text-purple-600" /> Batch Assessment Segmentation
                        </h3>
                        {deptDashboardData.batch_performance?.length > 0 ? (
                          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-slate-50 dark:bg-slate-800/80 font-bold text-slate-600 dark:text-slate-300">
                                <tr>
                                  <th className="py-2.5 px-3">Batch Name</th>
                                  <th className="py-2.5 px-2 text-center">Enrolled Students</th>
                                  <th className="py-2.5 px-2 text-center">Evaluated Count</th>
                                  <th className="py-2.5 px-2 text-center">CIA Pass Rate</th>
                                  <th className="py-2.5 px-2 text-center">CIA Class Average</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {deptDashboardData.batch_performance.map((b: any, idx: number) => (
                                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                                    <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                                      {b.batch_name}
                                    </td>
                                    <td className="py-2.5 px-2 text-center font-bold">{b.student_count}</td>
                                    <td className="py-2.5 px-2 text-center text-slate-600 dark:text-slate-300">{b.appeared_students}</td>
                                    <td className="py-2.5 px-2 text-center">
                                      {b.cia_pass_rate != null ? (
                                        <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                          b.cia_pass_rate >= 70 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                                        }`}>
                                          {b.cia_pass_rate}%
                                        </span>
                                      ) : (
                                        <span className="text-slate-400">Yet to be calculated</span>
                                      )}
                                    </td>
                                    <td className="py-2.5 px-2 text-center font-semibold">
                                      {b.cia_avg_pct != null ? `${b.cia_avg_pct}%` : <span className="text-slate-400">No marks</span>}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="rounded-2xl border border-slate-200 p-4 text-center text-xs text-slate-500">
                            No batch-level student assessment data recorded yet.
                          </div>
                        )}
                      </div>

                      {/* Course-Wise Performance Breakdown (Section 4.2) */}
                      <div>
                        <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-1.5">
                          <BookOpen className="h-4 w-4 text-indigo-600" /> Course-Wise Performance Breakdown
                        </h3>
                        {deptDashboardData.courses_breakdown?.length > 0 ? (
                          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-slate-50 dark:bg-slate-800/80 font-bold text-slate-600 dark:text-slate-300">
                                <tr>
                                  <th className="py-2.5 px-3">Course Code</th>
                                  <th className="py-2.5 px-3">Course Title</th>
                                  <th className="py-2.5 px-2 text-center">Sections</th>
                                  <th className="py-2.5 px-2 text-center">Students</th>
                                  <th className="py-2.5 px-2 text-center">Syllabus %</th>
                                  <th className="py-2.5 px-2 text-center">CIA Pass %</th>
                                  <th className="py-2.5 px-2 text-center">CIA Avg %</th>
                                  <th className="py-2.5 px-2 text-center">MCQ Avg %</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {deptDashboardData.courses_breakdown.map((c: any) => (
                                  <tr key={c.course_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                                    <td className="py-2.5 px-3 font-bold text-purple-600 dark:text-purple-400">
                                      {c.course_code}
                                    </td>
                                    <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-white">
                                      {c.course_title}
                                    </td>
                                    <td className="py-2.5 px-2 text-center font-bold">{c.classrooms_count}</td>
                                    <td className="py-2.5 px-2 text-center">{c.enrolled_students}</td>
                                    <td className="py-2.5 px-2 text-center">
                                      <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700">
                                        {c.syllabus_coverage_pct}%
                                      </span>
                                    </td>
                                    <td className="py-2.5 px-2 text-center">
                                      {c.cia_pass_rate != null ? (
                                        <span className="font-bold text-indigo-700">{c.cia_pass_rate}%</span>
                                      ) : (
                                        <span className="text-slate-400">-</span>
                                      )}
                                    </td>
                                    <td className="py-2.5 px-2 text-center">
                                      {c.cia_avg_pct != null ? `${c.cia_avg_pct}%` : <span className="text-slate-400">-</span>}
                                    </td>
                                    <td className="py-2.5 px-2 text-center">
                                      {c.mcq_avg_pct != null ? `${c.mcq_avg_pct}%` : <span className="text-slate-400">-</span>}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="rounded-2xl border border-slate-200 p-4 text-center text-xs text-slate-500">
                            No courses mapped to this department yet.
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ── Tab 2: Classroom Comparison ── */}
                  {deptActiveSection === "classrooms" && (
                    <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-800/80 font-bold text-slate-600 dark:text-slate-300">
                          <tr>
                            <th className="py-2.5 px-3">Classroom / Section</th>
                            <th className="py-2.5 px-3">Course</th>
                            <th className="py-2.5 px-3">Faculty</th>
                            <th className="py-2.5 px-2 text-center">Students</th>
                            <th className="py-2.5 px-2 text-center">Syllabus %</th>
                            <th className="py-2.5 px-2 text-center">CIA Avg %</th>
                            <th className="py-2.5 px-2 text-center">CIA Pass %</th>
                            <th className="py-2.5 px-2 text-center">MCQ Avg %</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {(deptDashboardData.classrooms_comparison || []).map((c: any) => (
                            <tr key={c.instance_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                              <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                                {c.instance_name}
                              </td>
                              <td className="py-2.5 px-3">
                                <span className="font-semibold text-purple-600 dark:text-purple-400">{c.course_code}</span>
                                <div className="text-[11px] text-slate-400 truncate max-w-xs">{c.course_title}</div>
                              </td>
                              <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                                {c.faculty_name}
                              </td>
                              <td className="py-2.5 px-2 text-center font-bold">
                                {c.enrolled_students}
                              </td>
                              <td className="py-2.5 px-2 text-center">
                                <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                                  {c.syllabus_coverage_pct}%
                                </span>
                              </td>
                              <td className="py-2.5 px-2 text-center">
                                {c.cia_avg_pct != null ? `${c.cia_avg_pct}%` : <span className="text-slate-400">-</span>}
                              </td>
                              <td className="py-2.5 px-2 text-center">
                                {c.cia_pass_rate != null ? (
                                  <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                                    {c.cia_pass_rate}%
                                  </span>
                                ) : (
                                  <span className="text-slate-400">-</span>
                                )}
                              </td>
                              <td className="py-2.5 px-2 text-center">
                                {c.mcq_avg_pct != null ? `${c.mcq_avg_pct}%` : <span className="text-slate-400">-</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* ── Tab 3: Statistical Outliers (Section 4.2) ── */}
                  {deptActiveSection === "outliers" && (
                    <div className="space-y-4">
                      {/* Outlier Thresholds Banner */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-purple-50/50 dark:bg-purple-950/20 p-4 rounded-2xl border border-purple-100 dark:border-purple-900/50">
                        <div>
                          <div className="text-[11px] font-semibold text-purple-700 dark:text-purple-300">Department Mean (μ)</div>
                          <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                            {deptDashboardData.outlier_analysis?.mean != null ? `${deptDashboardData.outlier_analysis.mean}%` : "N/A"}
                          </div>
                        </div>
                        <div>
                          <div className="text-[11px] font-semibold text-purple-700 dark:text-purple-300">Std Deviation (σ)</div>
                          <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                            {deptDashboardData.outlier_analysis?.std_dev != null ? `${deptDashboardData.outlier_analysis.std_dev}%` : "N/A"}
                          </div>
                        </div>
                        <div>
                          <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">Upper Threshold (μ + σ)</div>
                          <div className="text-xl font-black text-emerald-700 dark:text-emerald-300 mt-0.5">
                            {deptDashboardData.outlier_analysis?.upper_threshold != null ? `${deptDashboardData.outlier_analysis.upper_threshold}%` : "N/A"}
                          </div>
                        </div>
                        <div>
                          <div className="text-[11px] font-semibold text-rose-700 dark:text-rose-400">Lower Threshold (μ - σ)</div>
                          <div className="text-xl font-black text-rose-700 dark:text-rose-300 mt-0.5">
                            {deptDashboardData.outlier_analysis?.lower_threshold != null ? `${deptDashboardData.outlier_analysis.lower_threshold}%` : "N/A"}
                          </div>
                        </div>
                      </div>

                      {/* Top Performers (Classrooms above mu + sigma) */}
                      <div>
                        <h4 className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-2 flex items-center gap-1.5">
                          <TrendingUp className="h-4 w-4" /> Top Performers (Above Upper Threshold)
                        </h4>
                        {(deptDashboardData.outlier_analysis?.top_performers || []).length > 0 ? (
                          <div className="overflow-x-auto rounded-2xl border border-emerald-200 dark:border-emerald-900/60">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-emerald-50 dark:bg-emerald-950/40 font-bold text-emerald-900 dark:text-emerald-200">
                                <tr>
                                  <th className="py-2.5 px-3">Classroom</th>
                                  <th className="py-2.5 px-3">Course</th>
                                  <th className="py-2.5 px-3">Faculty</th>
                                  <th className="py-2.5 px-2 text-center">Score</th>
                                  <th className="py-2.5 px-2 text-center">Delta from Mean</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-emerald-100 dark:divide-emerald-900/40">
                                {deptDashboardData.outlier_analysis.top_performers.map((p: any) => (
                                  <tr key={p.instance_id}>
                                    <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">{p.instance_name}</td>
                                    <td className="py-2.5 px-3">
                                      <span className="font-semibold text-purple-600">{p.course_code}</span> - {p.course_title}
                                    </td>
                                    <td className="py-2.5 px-3 font-medium text-slate-700 dark:text-slate-300">{p.faculty_name}</td>
                                    <td className="py-2.5 px-2 text-center font-black text-emerald-600">{p.score_pct}%</td>
                                    <td className="py-2.5 px-2 text-center font-bold text-emerald-700">+{p.delta_from_mean}%</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="rounded-2xl border border-slate-200 p-3.5 text-center text-xs text-slate-500">
                            No classrooms performing above upper threshold standard deviation.
                          </div>
                        )}
                      </div>

                      {/* Top Dips (Classrooms below mu - sigma) */}
                      <div>
                        <h4 className="text-xs font-bold text-rose-700 dark:text-rose-400 mb-2 flex items-center gap-1.5">
                          <TrendingDown className="h-4 w-4" /> Top Dips / Low Performers (Below Lower Threshold)
                        </h4>
                        {(deptDashboardData.outlier_analysis?.top_dips || []).length > 0 ? (
                          <div className="overflow-x-auto rounded-2xl border border-rose-200 dark:border-rose-900/60">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-rose-50 dark:bg-rose-950/40 font-bold text-rose-900 dark:text-rose-200">
                                <tr>
                                  <th className="py-2.5 px-3">Classroom</th>
                                  <th className="py-2.5 px-3">Course</th>
                                  <th className="py-2.5 px-3">Faculty</th>
                                  <th className="py-2.5 px-2 text-center">Score</th>
                                  <th className="py-2.5 px-2 text-center">Delta from Mean</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-rose-100 dark:divide-rose-900/40">
                                {deptDashboardData.outlier_analysis.top_dips.map((d: any) => (
                                  <tr key={d.instance_id}>
                                    <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">{d.instance_name}</td>
                                    <td className="py-2.5 px-3">
                                      <span className="font-semibold text-rose-600">{d.course_code}</span> - {d.course_title}
                                    </td>
                                    <td className="py-2.5 px-3 font-medium text-slate-700 dark:text-slate-300">{d.faculty_name}</td>
                                    <td className="py-2.5 px-2 text-center font-black text-rose-600">{d.score_pct}%</td>
                                    <td className="py-2.5 px-2 text-center font-bold text-rose-700">{d.delta_from_mean}%</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="rounded-2xl border border-slate-200 p-3.5 text-center text-xs text-slate-500">
                            No classrooms flagged below lower threshold standard deviation.
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ── Tab 4: Bloom's Taxonomy Distribution ── */}
                  {deptActiveSection === "blooms" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                        {(deptDashboardData.knowledge_level_stats?.distribution || []).map((k: any) => (
                          <div key={k.level} className="rounded-2xl border border-slate-200/90 bg-slate-50/60 p-3.5 text-center dark:border-slate-800 dark:bg-slate-800/40">
                            <div className="text-xs font-bold text-slate-500">{k.level}</div>
                            <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{k.name}</div>
                            <div className="text-xl font-black text-purple-700 dark:text-purple-300 mt-2">
                              {k.score_pct != null ? `${k.score_pct}%` : "-"}
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 mt-2 overflow-hidden">
                              <div className="h-full rounded-full bg-purple-600" style={{ width: `${Math.min(100, k.score_pct || 0)}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Cognitive performance is computed mathematically by aggregating question marks across internal CIA examinations and MCQ assessment questions for all classrooms in this department.
                      </p>
                    </div>
                  )}

                  {/* ── Tab 5: PO Attainment Summary (Exclusion Rule: Strictly NO Heatmap Articulation Matrix) ── */}
                  {deptActiveSection === "copo" && (
                    <div className="space-y-4">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40 flex items-center justify-between">
                        <div>
                          <div className="text-xs font-bold text-slate-700 dark:text-slate-200">Department PO Attainment Overview</div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            Accreditation Target: ≥ 70% threshold (2.10 on scale 0-3.0)
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-black text-purple-700 dark:text-purple-300">
                            {deptDashboardData.copo_attainment?.average_po_percentage != null
                              ? `${deptDashboardData.copo_attainment.average_po_percentage}%`
                              : "Pending Calculation"}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                        {(deptDashboardData.copo_attainment?.po_attainments || []).map((p: any) => (
                          <div key={p.po} className="rounded-2xl border border-slate-200 p-3.5 bg-white dark:bg-slate-800/60 text-center">
                            <div className="text-xs font-black text-purple-700 dark:text-purple-300">{p.po}</div>
                            <div className="text-[11px] text-slate-500 font-medium truncate mt-0.5" title={p.label}>
                              {p.label}
                            </div>
                            <div className="text-xl font-black text-slate-900 dark:text-white mt-2">
                              {p.percentage != null ? `${p.percentage}%` : "-"}
                            </div>
                            <div className="text-[10px] text-slate-400 font-semibold mt-0.5">
                              {p.level != null ? `Level: ${p.level} / 3.0` : "Scale 0-3"}
                            </div>
                            <div className="mt-2">
                              {p.has_data ? (
                                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  p.is_attained ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                                }`}>
                                  {p.is_attained ? "Target Met" : "Target Deficit"}
                                </span>
                              ) : (
                                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-500">
                                  No assessment data
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="p-3 bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40 rounded-xl text-[11px] text-slate-500">
                        <span className="font-bold text-purple-700 dark:text-purple-300">NBA Accreditation Governance Note:</span> As specified in accreditation guidelines (Section 4.3), CO-PO articulation matrices apply only at the individual course level and are strictly omitted from departmental aggregation.
                      </div>
                    </div>
                  )}

                  {/* ── Tab 6: Dual-Tab Key Insights & Suggestions (Section 5.1 & 5.3) ── */}
                  {deptActiveSection === "insights" && (
                    <div className="space-y-4">
                      {/* Sub-tab toggle */}
                      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 pb-1">
                        <button
                          type="button"
                          onClick={() => setDeptInsightsTab("insights")}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                            deptInsightsTab === "insights"
                              ? "bg-purple-600 text-white shadow-xs"
                              : "text-slate-500 hover:text-slate-800 dark:text-slate-300"
                          }`}
                        >
                          Deterministic Key Insights ({deptDashboardData.key_insights?.length || 0})
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeptInsightsTab("suggestions")}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                            deptInsightsTab === "suggestions"
                              ? "bg-purple-600 text-white shadow-xs"
                              : "text-slate-500 hover:text-slate-800 dark:text-slate-300"
                          }`}
                        >
                          Suggestions / Remedies
                        </button>
                      </div>

                      {/* Sub-tab 1: Key Insights */}
                      {deptInsightsTab === "insights" && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {(deptDashboardData.key_insights || []).map((ins: any, idx: number) => (
                            <div key={idx} className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-900 dark:text-white">{ins.title}</span>
                                {ins.std_dev != null && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold">
                                    σ = {ins.std_dev}%
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">{ins.description}</p>
                              <p className="text-[11px] text-slate-400">{ins.detail}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Sub-tab 2: Suggestions / Remedies (Scoped out per Section 5.3) */}
                      {deptInsightsTab === "suggestions" && (
                        <div className="rounded-2xl border border-purple-200 bg-purple-50/50 p-6 dark:border-purple-900/60 dark:bg-purple-950/20 text-center space-y-3">
                          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300">
                            <Sparkles className="h-6 w-6" />
                          </div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            Course &amp; Classroom-Level Remedial Scope
                          </h4>
                          <p className="text-xs text-slate-600 dark:text-slate-300 max-w-xl mx-auto leading-relaxed">
                            {deptDashboardData.ai_suggestions?.notice ||
                              "AI pedagogical remedies and suggestions are scoped strictly to individual Course and Classroom dashboards to prevent generic advice. Department-level governance relies on deterministic statistical insights."}
                          </p>
                          <div className="text-[11px] text-purple-700 dark:text-purple-300 font-semibold">
                            Open individual Course or Classroom dashboards to generate granular, grounded AI remediation plans.
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrivateRouter(MyAssignedCourses);
