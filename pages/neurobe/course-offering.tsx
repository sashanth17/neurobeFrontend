import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useDispatch } from "react-redux";
import { useRouter } from "next/router";
import {
  BookOpen,
  Users,
  ShieldCheck,
  UserCheck,
  RefreshCw,
  Layers,
  Filter,
  X,
  Plus,
} from "lucide-react";
import { setPageTitle } from "@/store/themeConfigSlice";
import { Success, Failure, getAuthUser } from "@/utils/function.utils";
import IconSearch from "@/components/Icon/IconSearch";
import IconPlus from "@/components/Icon/IconPlus";
import AcademicTable from "@/components/common-components/TableComponent";
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

const ACTIVE_FILTER_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "archived", label: "Archived" },
  { value: "inactive", label: "Inactive" },
  { value: "all", label: "All Status" },
];

const SEMESTER_OPTIONS = [
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
  const authUser = getAuthUser();

  // ── State ──────────────────────────────────────────────────────────────────
  const [assignedCourses, setAssignedCourses] = useState<AssignedCourseItem[]>([]);
  const [allInstances, setAllInstances] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  // Filters
  const [search, setSearch] = useState<string>("");
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>("all");
  const [semesterFilter, setSemesterFilter] = useState<string>("all");
  const [activeFilter, setActiveFilter] = useState<string>("active");
  const [ownershipFilter, setOwnershipFilter] = useState<"all" | "my_creations" | "others">("all");

  // Modal State
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editRow, setEditRow] = useState<any>(null);

  useEffect(() => {
    dispatch(setPageTitle("Classrooms"));
  }, [dispatch]);

  // Sync URL query with course filter if provided
  useEffect(() => {
    if (!router.isReady) return;
    const cid = router.query.course_id;
    if (cid && typeof cid === "string") {
      setSelectedCourseFilter(cid);
    }
  }, [router.isReady, router.query.course_id]);

  // ── Helper: User Ownership Check ──────────────────────────────────────────
  const authId = authUser?.id !== undefined && authUser?.id !== null ? String(authUser.id) : null;
  const authReg = authUser?.register_number ? String(authUser.register_number).toLowerCase().trim() : null;
  const authEmail = authUser?.email ? String(authUser.email).toLowerCase().trim() : null;

  const isSelfCreation = useCallback(
    (r: any): boolean => {
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
    },
    [authId, authReg, authEmail]
  );

  // ── Fetch Assigned Courses & All User Instances ────────────────────────────
  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      const userId = authUser?.id || 1;

      // 1. Fetch Assigned Courses
      let rawCourses: any[] = [];
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
          console.warn("faculty_dashboard_overview fallback failed:", e2);
        }
      }

      const seenCourseIds = new Set<number>();
      const normalizedCourses: AssignedCourseItem[] = [];

      for (const c of rawCourses) {
        const cid = Number(c.course_id || c.id);
        if (!cid || seenCourseIds.has(cid)) continue;
        seenCourseIds.add(cid);

        const roleStr = c.assigned_role || c.faculty_role || c.role || "Course Instructor";
        const isCoord =
          roleStr.toLowerCase().includes("coordinator") ||
          c.role_type === "coordinator" ||
          c.is_coordinator === true;
        const isInst =
          roleStr.toLowerCase().includes("instructor") ||
          c.role_type === "instructor" ||
          isCoord;

        normalizedCourses.push({
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

      setAssignedCourses(normalizedCourses);

      // Build course lookup map for enrichment
      const courseMap = new Map<number, AssignedCourseItem>();
      normalizedCourses.forEach((c) => courseMap.set(c.id, c));

      // 2. Fetch Instances: Global list + assigned courses fallback
      let rawInstances: any[] = [];
      try {
        const globalRes: any = await Models.course_instance.list({ limit: 500 });
        const list = Array.isArray(globalRes) ? globalRes : globalRes?.data ?? globalRes?.results ?? [];
        if (list.length > 0) {
          rawInstances = list;
        }
      } catch (e) {
        console.warn("Global course_instance.list failed, fetching per assigned course:", e);
      }

      // If global list is empty or returned no instances, fetch per assigned course in parallel
      if (rawInstances.length === 0 && normalizedCourses.length > 0) {
        const perCourseResults = await Promise.all(
          normalizedCourses.map((c) =>
            Models.course_instance.list({ course_id: c.id }).catch(() => [])
          )
        );
        const collected: any[] = [];
        perCourseResults.forEach((res: any, idx) => {
          const list = Array.isArray(res) ? res : res?.data ?? res?.results ?? [];
          list.forEach((item: any) => {
            collected.push({
              ...item,
              course_id: item.course_id || normalizedCourses[idx]?.id,
              course_code: item.course_code || normalizedCourses[idx]?.course_code,
              course_title: item.course_title || normalizedCourses[idx]?.course_title,
              programme_name: item.programme_name || normalizedCourses[idx]?.programme_name,
              department_name: item.department_name || normalizedCourses[idx]?.department_name,
            });
          });
        });
        rawInstances = collected;
      }

      // 3. Deduplicate and normalize instances
      const seenInstanceIds = new Set<any>();
      const normalizedInstances: any[] = [];

      for (const inst of rawInstances) {
        const iid = inst.id || inst.course_instance_id;
        if (!iid || seenInstanceIds.has(iid)) continue;
        seenInstanceIds.add(iid);

        const matchedCourse = inst.course_id ? courseMap.get(Number(inst.course_id)) : null;

        normalizedInstances.push({
          ...inst,
          id: iid,
          course_id: inst.course_id ?? matchedCourse?.id,
          course_code: inst.course_code || matchedCourse?.course_code || `CRS-${inst.course_id || ""}`,
          course_title:
            inst.course_title ||
            matchedCourse?.course_title ||
            inst.course_instance_name ||
            "Course Delivery",
          programme_name:
            inst.programme_name ||
            matchedCourse?.programme_name ||
            inst.programme ||
            "B.Tech",
          department_name:
            inst.department_name ||
            matchedCourse?.department_name ||
            inst.department ||
            "Department",
          semester: inst.semester ?? matchedCourse?.semester ?? 1,
        });
      }

      setAllInstances(normalizedInstances);
      setLastRefreshed(new Date());
    } catch (err: any) {
      console.error("Failed to load classrooms data:", err);
      Failure(typeof err === "string" ? err : err?.message || "Failed to load classrooms.");
    } finally {
      setLoading(false);
    }
  }, [authUser?.id]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditRow(null);
    setModalOpen(true);
  };

  const openEdit = (row: any) => {
    setEditRow(row);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditRow(null);
  };

  const handleManageStudents = (row: any) => {
    const courseId = row.course_id || "";
    router.push(`/neurobe/student-enrollment?instance_id=${row.id}&course_id=${courseId}`);
  };

  const handleRowClick = (arg: any) => {
    const row = arg && typeof arg === "object" && "record" in arg ? arg.record : arg;
    if (!row) return;
    const courseId = row.course_id ?? 1;
    const instanceId = row.id ?? row.course_instance_id;
    if (instanceId) {
      router.push(`/neurobe/course-instance/${instanceId}?courseId=${courseId}`);
    }
  };

  const handleToggleArchive = async (row: any) => {
    try {
      setLoading(true);
      const nextArchived = !row.is_archived;
      await Models.course_instance.update(row.id, {
        ...row,
        is_archived: nextArchived,
      });
      Success(nextArchived ? "Course Classroom archived" : "Course Classroom unarchived");
      await fetchAllData();
    } catch (error: any) {
      Failure(typeof error === "string" ? error : error?.message || "Failed to update archive status");
      setLoading(false);
    }
  };

  // ── Metrics & Counts ───────────────────────────────────────────────────────
  const myCreationsCount = useMemo(
    () => allInstances.filter((r) => isSelfCreation(r)).length,
    [allInstances, isSelfCreation]
  );
  const othersCount = useMemo(
    () => allInstances.filter((r) => !isSelfCreation(r)).length,
    [allInstances, isSelfCreation]
  );
  const totalCount = allInstances.length;

  // ── Filter Options ─────────────────────────────────────────────────────────
  const courseFilterOptions = useMemo(() => {
    const options = [{ value: "all", label: `All Assigned Courses (${assignedCourses.length})` }];
    assignedCourses.forEach((c) => {
      options.push({
        value: String(c.id),
        label: `${c.course_code} - ${c.course_title}`,
      });
    });
    return options;
  }, [assignedCourses]);

  const activeSelectedCourse = useMemo(() => {
    if (selectedCourseFilter === "all") return null;
    return assignedCourses.find((c) => String(c.id) === String(selectedCourseFilter)) || null;
  }, [assignedCourses, selectedCourseFilter]);

  // ── Filtered Instances ────────────────────────────────────────────────────
  const filteredInstances = useMemo(() => {
    return allInstances.filter((r: any) => {
      // 1. Ownership Scope filter
      if (ownershipFilter === "my_creations" && !isSelfCreation(r)) {
        return false;
      }
      if (ownershipFilter === "others" && isSelfCreation(r)) {
        return false;
      }

      // 2. Course filter
      if (selectedCourseFilter !== "all") {
        if (String(r.course_id) !== String(selectedCourseFilter)) {
          return false;
        }
      }

      // 3. Semester filter
      if (semesterFilter !== "all") {
        if (String(r.semester) !== String(semesterFilter)) {
          return false;
        }
      }

      // 4. Single Active Filter
      if (activeFilter === "active") {
        if (r.is_archived || r.status === "Inactive" || r.is_active === false) {
          return false;
        }
      } else if (activeFilter === "archived") {
        if (!r.is_archived) {
          return false;
        }
      } else if (activeFilter === "inactive") {
        if (r.is_active !== false && r.status !== "Inactive" && !r.is_archived) {
          return false;
        }
      }

      // 5. Search query
      const s = search.trim().toLowerCase();
      if (s) {
        const courseTitle = (r.course_title || "").toLowerCase();
        const instanceName = (r.course_instance_name || r.course || "").toLowerCase();
        const courseCode = (r.course_code || r.code || "").toLowerCase();
        const createdBy = (r.created_by_name || r.created_by || "").toLowerCase();
        const prog = (r.programme_name || "").toLowerCase();
        const sec = (r.section || "").toLowerCase();

        const matches =
          courseTitle.includes(s) ||
          instanceName.includes(s) ||
          courseCode.includes(s) ||
          createdBy.includes(s) ||
          prog.includes(s) ||
          sec.includes(s);

        if (!matches) return false;
      }

      return true;
    });
  }, [
    allInstances,
    ownershipFilter,
    selectedCourseFilter,
    semesterFilter,
    activeFilter,
    search,
    isSelfCreation,
  ]);

  const hasActiveFilters =
    search.trim() !== "" ||
    selectedCourseFilter !== "all" ||
    semesterFilter !== "all" ||
    activeFilter !== "active" ||
    ownershipFilter !== "all";

  const clearAllFilters = () => {
    setSearch("");
    setSelectedCourseFilter("all");
    setSemesterFilter("all");
    setActiveFilter("active");
    setOwnershipFilter("all");
  };

  return (
    <div className="min-h-screen space-y-3 pb-8">
      {/* ── Compact Header & Action Toolbar ──────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-slate-200/70 pb-3 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-700 shadow-xs dark:bg-purple-950/60 dark:text-purple-300">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                Classrooms
              </h1>
              <span className="inline-flex items-center rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-bold text-purple-700 border border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800">
                {totalCount} Total
              </span>
              {lastRefreshed && (
                <span className="hidden text-xs text-slate-400 dark:text-slate-500 sm:inline">
                  • Synced {lastRefreshed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage section deliveries, monitor student rosters, and assign faculty.
            </p>
          </div>
        </div>

        {/* Action CTAs */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.push("/neurobe/student-enrollment")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50/70 px-3 py-1.5 text-xs font-bold text-purple-700 hover:bg-purple-100 transition shadow-xs dark:border-purple-800 dark:bg-purple-950/30 dark:text-purple-300 dark:hover:bg-purple-900/40"
          >
            <Users className="h-3.5 w-3.5" />
            <span>Enroll Students</span>
          </button>

          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:from-purple-700 hover:to-indigo-700 active:scale-95 transition"
          >
            <IconPlus className="h-3.5 w-3.5" />
            <span>Create Classroom</span>
          </button>

          <button
            type="button"
            onClick={fetchAllData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white p-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 active:scale-95 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            title="Refresh Classrooms"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-purple-600" : ""}`} />
          </button>
        </div>
      </div>

      {/* ── Unified Compact Filter Bar (Search, Course Dropdown, Tabs & Filters) ── */}
      <div className="flex flex-col gap-2 rounded-xl border border-slate-200/90 bg-white p-2.5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Ownership Filter Pills */}
          <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-0.5 dark:bg-slate-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setOwnershipFilter("all")}
              className={`rounded-md px-2.5 py-1 transition flex items-center gap-1.5 ${
                ownershipFilter === "all"
                  ? "bg-white text-purple-700 shadow-xs dark:bg-slate-700 dark:text-white"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <span>All Classrooms</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                  ownershipFilter === "all"
                    ? "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300"
                    : "bg-slate-200/80 text-slate-600 dark:bg-slate-700 dark:text-slate-400"
                }`}
              >
                {totalCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setOwnershipFilter("my_creations")}
              className={`rounded-md px-2.5 py-1 transition flex items-center gap-1.5 ${
                ownershipFilter === "my_creations"
                  ? "bg-white text-purple-700 shadow-xs dark:bg-slate-700 dark:text-white"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <UserCheck className="h-3 w-3" />
              <span>My Created</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                  ownershipFilter === "my_creations"
                    ? "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300"
                    : "bg-slate-200/80 text-slate-600 dark:bg-slate-700 dark:text-slate-400"
                }`}
              >
                {myCreationsCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setOwnershipFilter("others")}
              className={`rounded-md px-2.5 py-1 transition flex items-center gap-1.5 ${
                ownershipFilter === "others"
                  ? "bg-white text-purple-700 shadow-xs dark:bg-slate-700 dark:text-white"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <ShieldCheck className="h-3 w-3" />
              <span>Other Instructors</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                  ownershipFilter === "others"
                    ? "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300"
                    : "bg-slate-200/80 text-slate-600 dark:bg-slate-700 dark:text-slate-400"
                }`}
              >
                {othersCount}
              </span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[220px] flex-1 max-w-[340px]">
            <TextInput
              placeholder="Search classrooms, course, faculty..."
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<IconSearch className="h-4 w-4" />}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Second Row: Course Selector + Semester + Status + Archive + Clear */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
          {/* Course Selector Dropdown */}
          <div className="min-w-[240px] flex-1 max-w-[360px]">
            <CustomSelect
              options={courseFilterOptions}
              value={courseFilterOptions.find((o) => o.value === selectedCourseFilter) ?? courseFilterOptions[0]}
              onChange={(e) => setSelectedCourseFilter(String(e?.value ?? "all"))}
              placeholder="Filter by Course"
              isClearable={false}
              className="text-xs"
            />
          </div>

          {/* Semester Selector */}
          <div className="w-[140px]">
            <CustomSelect
              options={SEMESTER_OPTIONS}
              value={SEMESTER_OPTIONS.find((o) => o.value === semesterFilter) ?? SEMESTER_OPTIONS[0]}
              onChange={(e) => setSemesterFilter(String(e?.value ?? "all"))}
              placeholder="All Semesters"
              isClearable={false}
              className="text-xs"
            />
          </div>

          {/* Single Active Filter */}
          <div className="w-[140px]">
            <CustomSelect
              options={ACTIVE_FILTER_OPTIONS}
              value={ACTIVE_FILTER_OPTIONS.find((o) => o.value === activeFilter) ?? ACTIVE_FILTER_OPTIONS[0]}
              onChange={(e) => setActiveFilter(String(e?.value ?? "active"))}
              placeholder="Active Status"
              isClearable={false}
              className="text-xs"
            />
          </div>

          {/* Clear Filters CTA */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition"
            >
              <X className="h-3.5 w-3.5" />
              <span>Reset</span>
            </button>
          )}

          <div className="ml-auto text-xs text-slate-500 dark:text-slate-400 font-medium">
            Showing <strong className="text-slate-800 dark:text-slate-200">{filteredInstances.length}</strong> of {totalCount}
          </div>
        </div>
      </div>

      {/* ── Classrooms Table ──────────────────────────────────────────────── */}
      <div className="panel p-0 overflow-hidden border border-slate-200/80 rounded-xl dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        <AcademicTable
          records={filteredInstances}
          columns={makeCourseOfferingColumns(openEdit, handleManageStudents, handleToggleArchive)}
          loading={loading}
          noRecordsText={
            hasActiveFilters
              ? "No course classrooms match your current filters. Try resetting the filter criteria."
              : "No classrooms found for your assigned courses. Click '+ Create Classroom' to start one."
          }
          onRowClick={handleRowClick}
          rowClassName={() => "cursor-pointer hover:bg-purple-50/40 dark:hover:bg-slate-800/60 transition-colors"}
        />
      </div>

      {/* ── Course Offering Modal ─────────────────────────────────────────── */}
      <CourseOfferingModal
        open={modalOpen}
        onClose={closeModal}
        onSuccess={() => {
          closeModal();
          fetchAllData();
        }}
        initialData={editRow}
        defaultCourseId={activeSelectedCourse?.id}
        defaultCourseName={
          activeSelectedCourse
            ? `${activeSelectedCourse.course_code} - ${activeSelectedCourse.course_title}`
            : undefined
        }
      />
    </div>
  );
};

export default PrivateRouter(CourseOfferingPage);
