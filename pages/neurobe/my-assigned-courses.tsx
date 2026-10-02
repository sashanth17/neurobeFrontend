import React, { useEffect, useState, useMemo } from "react";
import { useDispatch } from "react-redux";
import { setPageTitle } from "@/store/themeConfigSlice";
import IconSearch from "@/components/Icon/IconSearch";
import PrivateRouter from "@/hook/privateRouter";
import AssignedCourseCard, { AssignedCourseItem } from "@/components/academic-setup/AssignedCourseCard";
import Models from "@/imports/models.import";
import { useRouter } from "next/router";
import { BookOpen, ShieldCheck, UserCheck, RefreshCw, AlertCircle } from "lucide-react";

const MyAssignedCourses = () => {
  const dispatch = useDispatch();
  const router = useRouter();

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
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

  useEffect(() => {
    dispatch(setPageTitle("My Assigned Courses"));
  }, [dispatch]);

  // Load once on mount / manual refresh only (ZERO background polling)
  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const res: any = await Models.course.my_assigned_courses();
      setData(res || { summary: { total_courses: 0, coordinator_courses: 0, instructor_courses: 0 }, courses: [] });
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

  // Client-side filtering (zero re-fetch needed for search/filter)
  const filteredCourses = useMemo(() => {
    return coursesList.filter((c) => {
      // 1. Search filter
      const q = search.trim().toLowerCase();
      if (q) {
        const matchCode = c.course_code.toLowerCase().includes(q);
        const matchTitle = c.course_title.toLowerCase().includes(q);
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
  }, [coursesList, search, roleFilter, semesterFilter]);

  const summary = data?.summary || {
    total_courses: coursesList.length,
    coordinator_courses: coursesList.filter((c) => c.is_coordinator).length,
    instructor_courses: coursesList.filter((c) => !c.is_coordinator).length,
  };

  return (
    <div className="min-h-screen space-y-6 pb-12">
      {/* Header & Page Title */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            My Assigned Courses
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            View course syllabus, curriculum extractions, CO-PO mappings, pedagogies, and lesson plans.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchCourses}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-95 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-indigo-500" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Total Courses
              </p>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {summary.total_courses}
              </h2>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Coordinated by You
              </p>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {summary.coordinator_courses}
              </h2>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Instructor Courses
              </p>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {summary.instructor_courses}
              </h2>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by course code, title, or department..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-sm text-slate-900 transition focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-indigo-400"
          />
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <IconSearch className="h-4 w-4" />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Role Filter Tabs */}
          <div className="inline-flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setRoleFilter("all")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                roleFilter === "all"
                  ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter("coordinator")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                roleFilter === "coordinator"
                  ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              Coordinator
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter("instructor")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                roleFilter === "instructor"
                  ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              Instructor
            </button>
          </div>

          {/* Semester Dropdown (if multiple semesters) */}
          {availableSemesters.length > 0 && (
            <select
              value={semesterFilter}
              onChange={(e) => setSemesterFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              <option value="all">All Semesters</option>
              {availableSemesters.map((s) => (
                <option key={s} value={s}>
                  Semester {s}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-400">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && !data && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-64 animate-pulse rounded-2xl border border-slate-200/80 bg-slate-100 p-6 dark:border-slate-800 dark:bg-slate-800/50"
            />
          ))}
        </div>
      )}

      {/* Courses Cards Grid */}
      {!loading && filteredCourses.length > 0 && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredCourses.map((c) => (
            <AssignedCourseCard
              key={c.course_id}
              course={c}
              onOpenCourse={(id) => router.push(`/neurobe/course-artifacts?course_id=${id}`)}
              onOpenVersionHistory={(id) => router.push(`/neurobe/course-version-history?course_id=${id}`)}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredCourses.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center dark:border-slate-800 dark:bg-slate-900">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
            <BookOpen className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
            No Assigned Courses Found
          </h3>
          <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
            {search || roleFilter !== "all" || semesterFilter !== "all"
              ? "No courses matched your current filter criteria. Try clearing filters or changing your search."
              : "You have not been assigned to any courses yet. Please contact your academic administrator."}
          </p>
          {(search || roleFilter !== "all" || semesterFilter !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setRoleFilter("all");
                setSemesterFilter("all");
              }}
              className="mt-4 rounded-xl bg-indigo-50 px-4 py-2 text-xs font-semibold text-indigo-600 transition hover:bg-indigo-100 dark:bg-indigo-950/50 dark:text-indigo-400"
            >
              Reset Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default PrivateRouter(MyAssignedCourses);
