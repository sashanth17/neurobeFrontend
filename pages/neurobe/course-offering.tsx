import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useDispatch } from "react-redux";
import { useRouter } from "next/router";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Users,
  ShieldCheck,
  UserCheck,
  RefreshCw,
  AlertCircle,
  HelpCircle,
  Award,
  Calendar,
  Layers,
  Sparkles,
  Info,
} from "lucide-react";
import { setPageTitle } from "@/store/themeConfigSlice";
import { useSetState, Success, Failure, getAuthUser } from "@/utils/function.utils";
import IconSearch from "@/components/Icon/IconSearch";
import IconPlus from "@/components/Icon/IconPlus";
import AcademicTable from "@/components/common-components/TableComponent";
import PageBanner from "@/components/common-components/PageBanner";
import PageHeader from "@/components/common-components/PageHeader";
import TextInput from "@/components/FormFields/TextInput.component";
import CustomSelect from "@/components/FormFields/CustomSelect.component";
import { makeCourseOfferingColumns } from "@/components/course-offering/courseOfferingColumns";
import CourseOfferingModal from "@/components/course-offering/CourseOfferingModal";
import PrivateRouter from "@/hook/privateRouter";
import Models from "@/imports/models.import";

export interface AssignedCourseItem {
  id: number;
  course_code: string;
  course_title: string;
  department_name?: string;
  programme_name?: string;
  semester?: number | string;
  academic_year?: string;
  batch?: string;
  role: string;
  is_coordinator: boolean;
  is_instructor: boolean;
  role_type: "coordinator" | "instructor";
  instances_count?: number;
  students_count?: number;
}

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const ARCHIVE_OPTIONS = [
  { value: "all", label: "All Instances" },
  { value: "active", label: "Active Instances" },
  { value: "archived", label: "Archived Instances" },
];

const semesterOptions = [
  { label: "All Semesters", value: "all" },
  { label: "Semester 1", value: "1" },
  { label: "Semester 2", value: "2" },
  { label: "Semester 3", value: "3" },
  { label: "Semester 4", value: "4" },
  { label: "Semester 5", value: "5" },
  { label: "Semester 6", value: "6" },
  { label: "Semester 7", value: "7" },
  { label: "Semester 8", value: "8" },
];

const CourseOfferingPage = () => {
  const dispatch = useDispatch();
  const router = useRouter();

  // ── Global Course Selection State ──────────────────────────────────────────
  const [assignedCourses, setAssignedCourses] = useState<AssignedCourseItem[]>([]);
  const [loadingCourses, setLoadingCourses] = useState<boolean>(true);
  const [errorCourses, setErrorCourses] = useState<string | null>(null);

  // Filters for Step 1 (Course Selection View)
  const [courseSearch, setCourseSearch] = useState<string>("");
  const [courseRoleFilter, setCourseRoleFilter] = useState<"all" | "coordinator" | "instructor">("all");
  const [courseSemesterFilter, setCourseSemesterFilter] = useState<string>("all");

  // Selected Course for Step 2 (Instance Management View)
  const [selectedCourse, setSelectedCourse] = useState<AssignedCourseItem | null>(null);

  // Instance Table State for Step 2
  const [instanceState, setInstanceState] = useSetState({
    search: "",
    statusFilter: "all",
    archiveFilter: "active",
    ownershipFilter: "my_creations" as "my_creations" | "others",
    loadingInstances: false,
    showModal: false,
    editRow: null as any,
    instanceList: [] as any[],
  });

  const authUser = getAuthUser();

  useEffect(() => {
    dispatch(setPageTitle("Course Instances & Offerings"));
  }, [dispatch]);

  // ── Fetch Only Assigned Courses (Coordinator & Instructor) ─────────────────
  const fetchAssignedCourses = useCallback(async () => {
    try {
      setLoadingCourses(true);
      setErrorCourses(null);

      const userId = authUser?.id || 1;
      let rawCourses: any[] = [];

      // 1. Try my_assigned_courses endpoint
      try {
        const res: any = await Models.course.my_assigned_courses({ faculty_id: userId });
        if (res?.courses && Array.isArray(res.courses)) {
          rawCourses = res.courses;
        } else if (Array.isArray(res)) {
          rawCourses = res;
        }
      } catch (e) {
        console.warn("my_assigned_courses failed, trying faculty_dashboard_overview:", e);
      }

      // 2. Fallback to faculty_dashboard_overview
      if (rawCourses.length === 0) {
        try {
          const res2: any = await Models.course.faculty_dashboard_overview({
            faculty_id: userId,
            coordinator_id: userId,
          });
          if (res2?.courses && Array.isArray(res2.courses)) {
            rawCourses = res2.courses;
          } else if (Array.isArray(res2)) {
            rawCourses = res2;
          }
        } catch (e2) {
          console.warn("faculty_dashboard_overview failed:", e2);
        }
      }

      // 3. Deduplicate and normalize
      const seen = new Set<number>();
      const normalized: AssignedCourseItem[] = [];

      for (const c of rawCourses) {
        const cid = Number(c.course_id || c.id);
        if (!cid || seen.has(cid)) continue;
        seen.add(cid);

        const roleStr = c.assigned_role || c.faculty_role || c.role || "Course Instructor";
        const isCoord =
          roleStr.toLowerCase().includes("coordinator") ||
          c.role_type === "coordinator" ||
          c.is_coordinator === true;
        const isInst =
          roleStr.toLowerCase().includes("instructor") ||
          c.role_type === "instructor" ||
          isCoord; // Coordinators automatically possess instructor permissions

        normalized.push({
          id: cid,
          course_code: c.course_code || c.code || `COURSE-${cid}`,
          course_title: c.course_title || c.title || c.name || "Academic Course",
          department_name: c.department_name || c.department || "Academic Department",
          programme_name: c.programme_name || c.programme || "B.Tech",
          semester: c.semester,
          academic_year: c.academic_year || "2026-2027",
          batch: c.batch || "",
          role: roleStr,
          is_coordinator: isCoord,
          is_instructor: isInst,
          role_type: isCoord ? "coordinator" : "instructor",
          instances_count: c.instances_count || c.sections_count || c.total_sections || 0,
          students_count: c.total_students || c.students_count || c.enrolled_students_count || 0,
        });
      }

      setAssignedCourses(normalized);
    } catch (err: any) {
      console.error("Failed to fetch assigned courses:", err);
      setErrorCourses(typeof err === "string" ? err : err?.message || "Failed to load assigned courses.");
    } finally {
      setLoadingCourses(false);
    }
  }, [authUser?.id]);

  useEffect(() => {
    fetchAssignedCourses();
  }, [fetchAssignedCourses]);

  // ── Sync URL Query with Selected Course ────────────────────────────────────
  useEffect(() => {
    if (!router.isReady) return;
    const cid = router.query.course_id;
    if (cid) {
      const targetId = Number(cid);
      const found = assignedCourses.find((c) => c.id === targetId);
      if (found) {
        setSelectedCourse(found);
        loadInstancesForCourse(found.id);
      } else if (!loadingCourses && assignedCourses.length > 0) {
        // If not found in loaded assigned courses, keep or attempt fallback
        const titleStr = (Array.isArray(router.query.title) ? router.query.title[0] : router.query.title) || "";
        const codeStr = (Array.isArray(router.query.code) ? router.query.code[0] : router.query.code) || "";
        const fallbackCourse: AssignedCourseItem = {
          id: targetId,
          course_code: codeStr || `COURSE-${targetId}`,
          course_title: titleStr || "Assigned Course",
          role: "Course Instructor",
          is_coordinator: false,
          is_instructor: true,
          role_type: "instructor",
        };
        setSelectedCourse(fallbackCourse);
        loadInstancesForCourse(targetId);
      }
    } else {
      setSelectedCourse(null);
      setInstanceState({ instanceList: [] });
    }
  }, [router.isReady, router.query.course_id, assignedCourses, loadingCourses]);

  // ── Fetch Instances for the Selected Course ────────────────────────────────
  const loadInstancesForCourse = async (courseId: number) => {
    if (!courseId) return;
    setInstanceState({ loadingInstances: true });
    try {
      const res: any = await Models.course_instance.list({ course_id: courseId });
      const list = Array.isArray(res) ? res : res?.data ?? res?.results ?? [];
      setInstanceState({ instanceList: list, loadingInstances: false });
    } catch (err) {
      console.error("Failed to load instances for course:", err);
      setInstanceState({ instanceList: [], loadingInstances: false });
    }
  };

  // ── Course Selection Handler (Transitions to Instance Management) ──────────
  const handleSelectCourse = (course: AssignedCourseItem) => {
    setSelectedCourse(course);
    loadInstancesForCourse(course.id);
    router.push(
      {
        pathname: "/neurobe/course-offering",
        query: {
          course_id: course.id,
          code: course.course_code,
          title: course.course_title,
        },
      },
      undefined,
      { shallow: true }
    );
  };

  const handleBackToCourses = () => {
    setSelectedCourse(null);
    router.push("/neurobe/course-offering", undefined, { shallow: true });
  };

  // ── Instance Actions ───────────────────────────────────────────────────────
  const openCreate = () => setInstanceState({ showModal: true, editRow: null });
  const openEdit = (row: any) => setInstanceState({ showModal: true, editRow: row });
  const closeModal = () => setInstanceState({ showModal: false, editRow: null });

  const handleManageStudents = (row: any) => {
    router.push(`/neurobe/student-enrollment?instance_id=${row.id}&course_id=${row.course_id || selectedCourse?.id || ""}`);
  };

  const handleRowClick = (arg: any) => {
    const row = arg && typeof arg === "object" && "record" in arg ? arg.record : arg;
    if (!row) return;
    const courseId = row.course_id ?? selectedCourse?.id ?? 1;
    const instanceId = row.id ?? row.course_instance_id;
    if (instanceId) {
      router.push(`/neurobe/course-instance/${instanceId}?courseId=${courseId}`);
    }
  };

  const handleToggleArchive = async (row: any) => {
    try {
      setInstanceState({ loadingInstances: true });
      const nextArchived = !row.is_archived;
      await Models.course_instance.update(row.id, {
        ...row,
        is_archived: nextArchived,
      });
      Success(nextArchived ? "Course instance archived" : "Course instance unarchived");
      if (selectedCourse) {
        loadInstancesForCourse(selectedCourse.id);
      }
    } catch (error: any) {
      Failure(typeof error === "string" ? error : error?.message || "Failed to update archive status");
      setInstanceState({ loadingInstances: false });
    }
  };

  // ── Self-Creation Filtering ────────────────────────────────────────────────
  const authId = authUser?.id !== undefined && authUser?.id !== null ? String(authUser.id) : null;
  const authReg = authUser?.register_number ? String(authUser.register_number).toLowerCase().trim() : null;
  const authEmail = authUser?.email ? String(authUser.email).toLowerCase().trim() : null;

  const isSelfCreation = (r: any): boolean => {
    if (r.created_by_id !== undefined && r.created_by_id !== null && authId) {
      if (String(r.created_by_id) === authId) return true;
    }
    if (r.created_by_register_number && authReg) {
      if (String(r.created_by_register_number).toLowerCase().trim() === authReg) return true;
    }
    if (r.created_by_email && authEmail) {
      if (String(r.created_by_email).toLowerCase().trim() === authEmail) return true;
    }
    return false;
  };

  const rawInstances = instanceState.instanceList || [];
  const myCreationsCount = rawInstances.filter((r: any) => isSelfCreation(r)).length;
  const othersCount = rawInstances.filter((r: any) => !isSelfCreation(r)).length;

  const filteredInstances = rawInstances.filter((r: any) => {
    if (instanceState.ownershipFilter === "my_creations") {
      if (!isSelfCreation(r)) return false;
    } else if (instanceState.ownershipFilter === "others") {
      if (isSelfCreation(r)) return false;
    }

    const s = instanceState.search.toLowerCase();
    const courseTitle = r.course_instance_name || r.course || r.course_title || "";
    const courseCode = r.course_code || r.code || "";
    const createdBy = r.created_by_name || r.created_by || "";
    const matchSearch =
      !s ||
      courseTitle.toLowerCase().includes(s) ||
      courseCode.toLowerCase().includes(s) ||
      createdBy.toLowerCase().includes(s);
    const matchStatus =
      !instanceState.statusFilter ||
      instanceState.statusFilter === "all" ||
      String(r.status || (r.is_active ? "active" : "inactive")).toLowerCase() === instanceState.statusFilter.toLowerCase();
    const matchArchive =
      !instanceState.archiveFilter ||
      instanceState.archiveFilter === "all" ||
      (instanceState.archiveFilter === "archived" ? Boolean(r.is_archived) : !r.is_archived);

    return matchSearch && matchStatus && matchArchive;
  });

  // ── Filtered Courses for Step 1 ───────────────────────────────────────────
  const filteredAssignedCourses = useMemo(() => {
    return assignedCourses.filter((c) => {
      const q = courseSearch.trim().toLowerCase();
      if (q) {
        const matchCode = c.course_code.toLowerCase().includes(q);
        const matchTitle = c.course_title.toLowerCase().includes(q);
        const matchDept = (c.department_name || "").toLowerCase().includes(q);
        const matchProg = (c.programme_name || "").toLowerCase().includes(q);
        if (!matchCode && !matchTitle && !matchDept && !matchProg) {
          return false;
        }
      }

      if (courseRoleFilter === "coordinator" && !c.is_coordinator) {
        return false;
      }
      if (courseRoleFilter === "instructor" && c.is_coordinator && !c.is_instructor) {
        return false;
      }

      if (courseSemesterFilter !== "all" && String(c.semester) !== courseSemesterFilter) {
        return false;
      }

      return true;
    });
  }, [assignedCourses, courseSearch, courseRoleFilter, courseSemesterFilter]);

  const coordinatorCount = assignedCourses.filter((c) => c.is_coordinator).length;
  const instructorCount = assignedCourses.filter((c) => c.is_instructor).length;

  // ══════════════════════════════════════════════════════════════════════════
  // VIEW 1: Course Selection Grid (Like CIA Question Bank)
  // ══════════════════════════════════════════════════════════════════════════
  if (!selectedCourse) {
    return (
      <div className="min-h-screen pb-16">
        {/* Top Banner */}
        <PageBanner
          title="Classrooms"
          description="Course Coordinator & Instructor Workspace — Select one of your assigned courses to view instances, configure section deliveries, allocate faculty, and manage student enrollments."
          icon={<BookOpen className="h-6 w-6 text-white" />}
        />

        <div className="pt-6">
          {/* Filter & Search Bar */}
          <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            {/* Search Box */}
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
                <IconSearch className="h-4 w-4" />
              </span>
              <input
                type="text"
                placeholder="Search by course code, title, or programme..."
                value={courseSearch}
                onChange={(e) => setCourseSearch(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50/70 py-2.5 pl-10 pr-4 text-sm text-gray-800 placeholder-gray-400 transition-colors focus:border-purple-500 focus:bg-white focus:outline-none dark:border-gray-700 dark:bg-gray-900/60 dark:text-gray-100"
              />
              {courseSearch && (
                <button
                  onClick={() => setCourseSearch("")}
                  className="absolute inset-y-0 right-3 flex items-center text-xs font-semibold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Role Filter Tabs */}
            <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-700/60 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setCourseRoleFilter("all")}
                className={`rounded-lg px-3 py-1.5 transition cursor-pointer ${
                  courseRoleFilter === "all"
                    ? "bg-white text-purple-700 shadow-xs dark:bg-slate-800 dark:text-purple-300"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-300"
                }`}
              >
                All Assigned ({assignedCourses.length})
              </button>
              <button
                type="button"
                onClick={() => setCourseRoleFilter("coordinator")}
                className={`rounded-lg px-3 py-1.5 transition cursor-pointer flex items-center gap-1 ${
                  courseRoleFilter === "coordinator"
                    ? "bg-white text-purple-700 shadow-xs dark:bg-slate-800 dark:text-purple-300"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-300"
                }`}
              >
                <ShieldCheck className="h-3.5 w-3.5 text-purple-600" />
                <span>Coordinator ({coordinatorCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setCourseRoleFilter("instructor")}
                className={`rounded-lg px-3 py-1.5 transition cursor-pointer flex items-center gap-1 ${
                  courseRoleFilter === "instructor"
                    ? "bg-white text-purple-700 shadow-xs dark:bg-slate-800 dark:text-purple-300"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-300"
                }`}
              >
                <UserCheck className="h-3.5 w-3.5 text-blue-600" />
                <span>Instructor ({instructorCount})</span>
              </button>
            </div>

            {/* Semester Selector & Refresh */}
            <div className="flex items-center gap-3">
              <select
                value={courseSemesterFilter}
                onChange={(e) => setCourseSemesterFilter(e.target.value)}
                className="rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm font-medium text-gray-700 transition-colors focus:border-purple-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
              >
                {semesterOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              <button
                onClick={fetchAssignedCourses}
                disabled={loadingCourses}
                title="Refresh assigned courses"
                className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors cursor-pointer"
              >
                <RefreshCw className={`h-4 w-4 ${loadingCourses ? "animate-spin text-purple-600" : ""}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {errorCourses && (
            <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-400">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span>{errorCourses}</span>
            </div>
          )}

          {/* Loading Skeleton */}
          {loadingCourses ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800"
                >
                  <div className="flex justify-between mb-4">
                    <div className="h-5 w-24 rounded bg-gray-200 dark:bg-gray-700" />
                    <div className="h-5 w-20 rounded bg-gray-200 dark:bg-gray-700" />
                  </div>
                  <div className="h-6 w-3/4 rounded bg-gray-200 dark:bg-gray-700 mb-2" />
                  <div className="h-4 w-1/2 rounded bg-gray-200 dark:bg-gray-700 mb-6" />
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="h-12 rounded-xl bg-gray-100 dark:bg-gray-700/60" />
                    <div className="h-12 rounded-xl bg-gray-100 dark:bg-gray-700/60" />
                  </div>
                  <div className="h-4 w-full rounded bg-gray-100 dark:bg-gray-700" />
                </div>
              ))}
            </div>
          ) : filteredAssignedCourses.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-800/50">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 mb-4">
                <HelpCircle className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                No Assigned Courses Found
              </h3>
              <p className="max-w-md text-sm text-gray-500 dark:text-gray-400 mb-6">
                {courseSearch
                  ? `No courses match your search "${courseSearch}". Try clearing your search or choosing a different role or semester.`
                  : "Only courses where you are assigned as a Course Coordinator or Course Instructor appear here. No matching courses were found for your user account."}
              </p>
              {courseSearch && (
                <button
                  onClick={() => setCourseSearch("")}
                  className="rounded-xl bg-purple-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-purple-700 transition-colors"
                >
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAssignedCourses.map((course) => (
                <div
                  key={course.id}
                  onClick={() => handleSelectCourse(course)}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-purple-300 hover:shadow-xl dark:border-gray-700 dark:bg-gray-800 dark:hover:border-purple-500 cursor-pointer"
                >
                  {/* Top Accent Gradient Bar */}
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 opacity-80 group-hover:opacity-100 transition-opacity" />

                  <div>
                    {/* Header Badges */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-700 font-mono">
                        {course.course_code}
                      </span>

                      {/* Explicit Role Badge */}
                      {course.is_coordinator ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300">
                          <ShieldCheck className="h-3 w-3" />
                          <span>Coordinator</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/50 dark:text-blue-300">
                          <UserCheck className="h-3 w-3" />
                          <span>Instructor</span>
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-purple-600 dark:text-white dark:group-hover:text-purple-400 transition-colors line-clamp-2 mb-1.5">
                      {course.course_title}
                    </h3>

                    {/* Department & Programme */}
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 flex items-center gap-1.5 truncate">
                      <Award className="h-3.5 w-3.5 text-purple-500 flex-shrink-0" />
                      <span className="truncate">
                        {course.programme_name || course.department_name}
                        {course.semester ? ` • Semester ${course.semester}` : ""}
                      </span>
                    </p>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-4 rounded-xl bg-gray-50/80 p-3 dark:bg-gray-700/40">
                      <div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Instances</span>
                        <p className="text-sm font-extrabold text-gray-800 dark:text-gray-200">
                          {course.instances_count || 0} Offerings
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Enrolled</span>
                        <p className="text-sm font-extrabold text-gray-800 dark:text-gray-200">
                          {course.students_count || 0} Students
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Footer CTA */}
                  <div className="pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-xs font-semibold text-purple-600 dark:text-purple-400 group-hover:translate-x-0.5 transition-transform">
                    <span className="flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5" />
                      Manage Instances
                    </span>
                    <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // VIEW 2: Course Instance Management Workspace for the Selected Course
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen pb-16">
      {/* Top Navigation & Breadcrumbs (Matching CIA Question Bank) */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={handleBackToCourses}
          className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400 transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to All Assigned Courses</span>
        </button>

        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <span>Instance Management</span>
          <span>/</span>
          <span className="font-bold text-gray-800 dark:text-gray-200">
            {selectedCourse.course_code}
          </span>
        </div>
      </div>

      {/* Resolved Course Header Banner */}
      <div className="mb-6 overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-xs dark:border-gray-700 dark:bg-gray-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="font-mono text-xs font-extrabold px-2.5 py-0.5 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-900/40 dark:text-purple-300">
                  {selectedCourse.course_code}
                </span>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                  {selectedCourse.course_title}
                </h1>
                {selectedCourse.is_coordinator ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 text-xs font-bold text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
                    <ShieldCheck className="h-3 w-3" />
                    <span>Course Coordinator</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-xs font-bold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                    <UserCheck className="h-3 w-3" />
                    <span>Course Instructor</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {selectedCourse.programme_name || selectedCourse.department_name}
                {selectedCourse.semester ? ` • Term: Semester ${selectedCourse.semester}` : ""}
                {selectedCourse.academic_year ? ` • Academic Year ${selectedCourse.academic_year}` : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => loadInstancesForCourse(selectedCourse.id)}
              disabled={instanceState.loadingInstances}
              className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${instanceState.loadingInstances ? "animate-spin text-purple-600" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Auto-instructor note */}
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-purple-50/70 px-4 py-2 text-xs text-purple-800 dark:bg-purple-950/30 dark:text-purple-300 border border-purple-100 dark:border-purple-900/40">
          <UserCheck className="h-4 w-4 shrink-0 text-purple-600" />
          <span>
            <strong>Co-delivery Mode: </strong>Course Coordinators possess full Course Instructor permissions for this course instance delivery.
          </span>
        </div>
      </div>

      {/* Main Action Header */}
      <PageHeader
        title="Instance Deliveries & Sections"
        subtitle={`Managing active and archived instance sections for ${selectedCourse.course_code}.`}
        icon={<Layers className="h-5 w-5 text-purple-600" />}
        records={`${filteredInstances.length} Instances`}
        actionBtn2={{
          label: "Enroll Students",
          icon: <Users className="h-4 w-4" />,
          onClick: () => router.push(`/neurobe/student-enrollment?course_id=${selectedCourse.id}`),
          outline: true,
        }}
        actionBtn1={{
          label: "Create Instance",
          icon: <IconPlus className="h-4 w-4" />,
          onClick: openCreate,
          view: false,
        }}
      />

      {/* Instance Creation & Edit Modal */}
      <CourseOfferingModal
        open={instanceState.showModal}
        onClose={closeModal}
        onSuccess={() => loadInstancesForCourse(selectedCourse.id)}
        initialData={instanceState.editRow}
        defaultCourseId={selectedCourse.id}
        defaultCourseName={`${selectedCourse.course_code} - ${selectedCourse.course_title}`}
      />

      {/* Filters Toolbar (NO TOP-LEVEL COURSE DROPDOWN) */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 py-2">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[320px]">
          {/* Sliding Filter: My Creations | Others */}
          <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setInstanceState({ ownershipFilter: "my_creations" })}
              className={`rounded-lg px-3 py-1.5 transition cursor-pointer flex items-center gap-1.5 ${
                instanceState.ownershipFilter === "my_creations"
                  ? "bg-white text-purple-700 shadow-xs dark:bg-slate-700 dark:text-white"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <span>My Creations</span>
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                  instanceState.ownershipFilter === "my_creations"
                    ? "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300"
                    : "bg-slate-200/80 text-slate-600 dark:bg-slate-700 dark:text-slate-400"
                }`}
              >
                {myCreationsCount}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setInstanceState({ ownershipFilter: "others" })}
              className={`rounded-lg px-3 py-1.5 transition cursor-pointer flex items-center gap-1.5 ${
                instanceState.ownershipFilter === "others"
                  ? "bg-white text-purple-700 shadow-xs dark:bg-slate-700 dark:text-white"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <span>Others</span>
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                  instanceState.ownershipFilter === "others"
                    ? "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300"
                    : "bg-slate-200/80 text-slate-600 dark:bg-slate-700 dark:text-slate-400"
                }`}
              >
                {othersCount}
              </span>
            </button>
          </div>

          {/* Search */}
          <div className="relative max-w-[280px] flex-1 min-w-[200px]">
            <TextInput
              placeholder="Search by instance, faculty..."
              type="text"
              value={instanceState.search}
              onChange={(e) => setInstanceState({ search: e.target.value })}
              icon={<IconSearch className="h-4 w-4" />}
            />
          </div>
        </div>

        <div className="flex gap-3">
          <CustomSelect
            options={STATUS_OPTIONS}
            value={STATUS_OPTIONS.find((o) => o.value === instanceState.statusFilter) ?? null}
            onChange={(e) => setInstanceState({ statusFilter: e?.value ?? "all" })}
            placeholder="All Statuses"
            className="filter-input"
            isClearable
          />

          <CustomSelect
            options={ARCHIVE_OPTIONS}
            value={ARCHIVE_OPTIONS.find((o) => o.value === instanceState.archiveFilter) ?? null}
            onChange={(e) => setInstanceState({ archiveFilter: e?.value ?? "all" })}
            placeholder="Active Instances"
            className="filter-input"
            isClearable={false}
          />
        </div>
      </div>

      {/* Instances Table */}
      <div className="panel">
        <AcademicTable
          records={filteredInstances}
          columns={makeCourseOfferingColumns(openEdit, handleManageStudents, handleToggleArchive)}
          loading={instanceState.loadingInstances}
          noRecordsText={
            instanceState.ownershipFilter === "my_creations"
              ? `No course instances created by you for ${selectedCourse.course_code}. Click "+ Create Instance" to add one.`
              : `No course instances created by other instructors for ${selectedCourse.course_code}.`
          }
          onRowClick={handleRowClick}
          rowClassName={() => "cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"}
        />
      </div>
    </div>
  );
};

export default PrivateRouter(CourseOfferingPage);
