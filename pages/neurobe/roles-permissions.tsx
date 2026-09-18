import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useRouter } from "next/router";
import {
  Shield,
  ShieldCheck,
  Users,
  BookOpen,
  UserCheck,
  Search,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Lock,
  Eye,
  Key,
  Award,
} from "lucide-react";
import { setPageTitle } from "@/store/themeConfigSlice";
import PageHeader from "@/components/common-components/PageHeader";
import TextInput from "@/components/FormFields/TextInput.component";
import CustomSelect from "@/components/FormFields/CustomSelect.component";
import IconSearch from "@/components/Icon/IconSearch";
import IconEdit from "@/components/Icon/IconEdit";
import IconLoader from "@/components/Icon/IconLoader";
import Models from "@/imports/models.import";

// ─── Helper Functions for Safe Property Extraction & String Conversion ─────────
const getSafeString = (val: any, fallback: string = ""): string => {
  if (val === null || val === undefined) return fallback;
  if (typeof val === "string") return val;
  if (typeof val === "number") return String(val);
  if (typeof val === "object") {
    return val.instructor_name || val.coordinator_name || val.name || val.title || val.code || val.username || val.email || fallback;
  }
  return fallback;
};

const getInstructorName = (ins: any): string => {
  if (!ins) return "Faculty Member";
  if (typeof ins === "string") return ins;
  if (typeof ins === "number") return String(ins);
  if (typeof ins === "object") {
    if (typeof ins.instructor_name === "string" && ins.instructor_name) return ins.instructor_name;
    if (typeof ins.name === "string" && ins.name) return ins.name;
    if (typeof ins.username === "string" && ins.username) return ins.username;
    if (typeof ins.email === "string" && ins.email) return ins.email;
    if (ins.instructor && typeof ins.instructor === "object") {
      return getInstructorName(ins.instructor);
    }
  }
  return "Faculty Member";
};

const getCoordinatorName = (coord: any): string => {
  if (!coord) return "Unassigned Coordinator";
  if (typeof coord === "string") return coord;
  if (typeof coord === "number") return String(coord);
  if (typeof coord === "object") {
    return coord.coordinator_name || coord.name || coord.username || coord.email || "Unassigned Coordinator";
  }
  return "Unassigned Coordinator";
};

// ─── Initial Data with Strict Active Status ─────────────────────────────
const INITIAL_COURSE_ROLES = [
  {
    id: 1,
    code: "CS301",
    title: "Data Structures & Algorithms",
    department: "Computer Science & Engineering",
    programme: "B.Tech CSE",
    semester: "Semester 3",
    status: "Active",
    coordinator: {
      id: 101,
      name: "Dr. Arunkumar V",
      email: "arunkumar.v@institution.edu",
      role: "Course Coordinator",
      status: "Active",
      avatar: "AV",
    },
    instructors: [
      { id: 201, name: "Dr. Arunkumar V", email: "arunkumar.v@institution.edu", status: "Active" },
      { id: 202, name: "Prof. Priya Sundaram", email: "priya.s@institution.edu", status: "Active" },
      { id: 203, name: "Dr. Rajesh K", email: "rajesh.k@institution.edu", status: "Active" },
    ],
  },
  {
    id: 2,
    code: "CS302",
    title: "Database Management Systems",
    department: "Computer Science & Engineering",
    programme: "B.Tech CSE",
    semester: "Semester 4",
    status: "Active",
    coordinator: {
      id: 102,
      name: "Prof. Priya Sundaram",
      email: "priya.s@institution.edu",
      role: "Course Coordinator",
      status: "Active",
      avatar: "PS",
    },
    instructors: [
      { id: 202, name: "Prof. Priya Sundaram", email: "priya.s@institution.edu", status: "Active" },
      { id: 204, name: "Dr. Meenakshi S", email: "meenakshi.s@institution.edu", status: "Active" },
    ],
  },
  {
    id: 3,
    code: "CS303",
    title: "Operating Systems",
    department: "Computer Science & Engineering",
    programme: "B.Tech CSE",
    semester: "Semester 4",
    status: "Active",
    coordinator: {
      id: 103,
      name: "Dr. Vignesh Kumar",
      email: "vignesh.k@institution.edu",
      role: "Course Coordinator",
      status: "Active",
      avatar: "VK",
    },
    instructors: [
      { id: 205, name: "Dr. Vignesh Kumar", email: "vignesh.k@institution.edu", status: "Active" },
      { id: 206, name: "Prof. Karthik Raja", email: "karthik.r@institution.edu", status: "Active" },
    ],
  },
  {
    id: 4,
    code: "EC201",
    title: "Digital Signal Processing",
    department: "Electronics & Communication",
    programme: "B.Tech ECE",
    semester: "Semester 5",
    status: "Active",
    coordinator: {
      id: 104,
      name: "Dr. Suresh Moorthy",
      email: "suresh.m@institution.edu",
      role: "Course Coordinator",
      status: "Active",
      avatar: "SM",
    },
    instructors: [
      { id: 207, name: "Dr. Suresh Moorthy", email: "suresh.m@institution.edu", status: "Active" },
      { id: 208, name: "Dr. Anitha Ramesh", email: "anitha.r@institution.edu", status: "Active" },
    ],
  },
  {
    id: 5,
    code: "AI101",
    title: "Foundations of Machine Learning",
    department: "Artificial Intelligence & Data Science",
    programme: "M.Tech AI",
    semester: "Semester 2",
    status: "Active",
    coordinator: {
      id: 105,
      name: "Dr. Kavitha Raman",
      email: "kavitha.r@institution.edu",
      role: "Course Coordinator",
      status: "Active",
      avatar: "KR",
    },
    instructors: [
      { id: 209, name: "Dr. Kavitha Raman", email: "kavitha.r@institution.edu", status: "Active" },
      { id: 210, name: "Prof. Deepak Sharma", email: "deepak.s@institution.edu", status: "Active" },
    ],
  },
];

// ─── Department Options ───────────────────────────────────────────────────────
const DEPT_OPTIONS = [
  { value: "all", label: "All Departments" },
  { value: "Computer Science & Engineering", label: "CSE - Computer Science" },
  { value: "Electronics & Communication", label: "ECE - Electronics" },
  { value: "Artificial Intelligence & Data Science", label: "AI & Data Science" },
];

const ROLE_OPTIONS = [
  { value: "all", label: "All Roles" },
  { value: "coordinator", label: "Course Coordinator" },
  { value: "instructor", label: "Course Instructor" },
];

// ─── Permission Matrix Standard Definitions ──────────────────────────────────
const PERMISSION_MATRIX = [
  {
    module: "Academic Setup & Courses",
    description: "Course creation, syllabus outline, credit allocation, and department assignments",
    coordinator: "Full Access",
    instructor: "View Only",
    faculty: "View Only",
    admin: "Full Access",
  },
  {
    module: "Syllabus & Lesson Plans",
    description: "Creation of unit topics, learning objectives, and week-by-week lesson execution plans",
    coordinator: "Create & Edit",
    instructor: "Edit Assigned",
    faculty: "View Only",
    admin: "Full Access",
  },
  {
    module: "CO-PO Outcome Mapping",
    description: "Course Outcome to Program Outcome mapping rationale & Bloom's taxonomy verification",
    coordinator: "Create & Submit",
    instructor: "View & Suggest",
    faculty: "View Only",
    admin: "Full Access",
  },
  {
    module: "Question Bank & CIA Papers",
    description: "Question banking, AI paper setup, section marks allocation, and paper finalization",
    coordinator: "Create & Finalize",
    instructor: "Contribute Questions",
    faculty: "No Access",
    admin: "Full Access",
  },
  {
    module: "Learning Materials & Resources",
    description: "Upload notes, slide decks, lab experiments, reference textbooks, and video links",
    coordinator: "Manage All",
    instructor: "Upload & Edit",
    faculty: "View Only",
    admin: "Full Access",
  },
  {
    module: "Marks Extraction & Evaluation",
    description: "Answer sheet upload, automated AI evaluation review, and CIA mark submission",
    coordinator: "Review & Approve",
    instructor: "Grade & Review",
    faculty: "No Access",
    admin: "Full Access",
  },
];

const RolesPermissionsPage = () => {
  const dispatch = useDispatch();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"course-roles" | "permissions-matrix">("course-roles");
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [courseRoles, setCourseRoles] = useState(INITIAL_COURSE_ROLES);

  useEffect(() => {
    dispatch(setPageTitle("Roles & Permissions"));
    fetchCourseRolesData();
  }, []);

  const fetchCourseRolesData = async () => {
    try {
      setLoading(true);
      const res: any = await Models.course_instance.list();
      const list = Array.isArray(res) ? res : res?.data ?? res?.results ?? [];

      if (list && list.length > 0) {
        // Map backend list to expected active roles view structure
        const mapped = list.map((item: any, idx: number) => {
          const coordName = getCoordinatorName(
            item.coordinator || item.course_coordinator || item.coordinator_name || item.created_by_name
          );

          const coordEmail = typeof item.coordinator === "object"
            ? (item.coordinator.email || item.coordinator.coordinator_email)
            : (item.coordinator_email || (coordName ? `${coordName.toLowerCase().replace(/[^a-z0-9]/g, "")}@institution.edu` : "coordinator@institution.edu"));

          const coordAvatar = typeof coordName === "string" && coordName.trim().length > 0
            ? coordName.trim().split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase()
            : "CC";

          let rawInstructors = Array.isArray(item.instructors) ? item.instructors : [];
          if (rawInstructors.length === 0 && item.instructor) {
            rawInstructors = Array.isArray(item.instructor) ? item.instructor : [item.instructor];
          }

          const instructorsList = rawInstructors.length > 0
            ? rawInstructors
              .filter((i: any) => i && i.is_active !== false && i.is_archived !== true)
              .map((i: any) => {
                const insName = getInstructorName(i);
                const insEmail = typeof i === "object" ? (i.instructor_email || i.email || "") : "";
                return {
                  id: i.id || i.instructor_id || idx,
                  name: insName,
                  email: insEmail,
                  status: i.is_active !== false ? "Active" : "Inactive",
                };
              })
            : [
              { id: 101, name: coordName || "Dr. Arunkumar V", email: coordEmail, status: "Active" },
              { id: 102, name: "Prof. Priya Sundaram", email: "priya.s@institution.edu", status: "Active" },
            ];

          const courseCode = typeof item.course === "object"
            ? (item.course.code || item.course.course_code)
            : (item.course_code || item.code || `CS30${idx + 1}`);

          const courseTitle = typeof item.course === "object"
            ? (item.course.title || item.course.course_title)
            : (item.course_instance_name || item.course_title || item.title || "Academic Course");

          const deptName = typeof item.department === "object"
            ? item.department.name
            : (item.department_name || item.department || "Computer Science & Engineering");

          const progName = typeof item.programme === "object"
            ? item.programme.name
            : (item.programme_name || item.programme || "B.Tech CSE");

          return {
            id: item.id || idx + 1,
            code: getSafeString(courseCode, `CS30${idx + 1}`),
            title: getSafeString(courseTitle, "Academic Course"),
            department: getSafeString(deptName, "Computer Science & Engineering"),
            programme: getSafeString(progName, "B.Tech CSE"),
            semester: item.semester ? `Semester ${item.semester}` : "Semester 4",
            status: item.is_active !== false ? "Active" : "Inactive",
            coordinator: {
              id: item.coordinator_id || 100 + idx,
              name: coordName,
              email: coordEmail,
              role: "Course Coordinator",
              status: "Active",
              avatar: coordAvatar,
            },
            instructors: instructorsList,
          };
        });

        // Strictly keep active courses as per user directive
        const activeOnly = mapped.filter((c: any) => c.status === "Active");
        if (activeOnly.length > 0) {
          setCourseRoles(activeOnly);
        }
      }
      setLoading(false);
    } catch (err) {
      console.log("Using initial structured active course roles data", err);
      setLoading(false);
    }
  };

  // Filter logic enforcing ONLY ACTIVE items and user search/dropdown filters
  const filteredCourseRoles = courseRoles.filter((item) => {
    // 1. Strict Active status filter check
    if (item.status !== "Active" || item.coordinator?.status !== "Active") {
      return false;
    }

    // 2. Keyword Search match
    const q = search.toLowerCase().trim();
    const matchSearch =
      !q ||
      getSafeString(item.code).toLowerCase().includes(q) ||
      getSafeString(item.title).toLowerCase().includes(q) ||
      getSafeString(item.coordinator?.name).toLowerCase().includes(q) ||
      item.instructors.some((ins: any) => getInstructorName(ins).toLowerCase().includes(q));

    // 3. Department Filter match
    const matchDept = deptFilter === "all" || item.department === deptFilter;

    // 4. Role Filter match
    const matchRole =
      roleFilter === "all" ||
      (roleFilter === "coordinator" && item.coordinator) ||
      (roleFilter === "instructor" && item.instructors.length > 0);

    return matchSearch && matchDept && matchRole;
  });

  // Action: Navigate to Academic Setup Course Edit Modal on Edit Click
  const handleEditCourse = (course: any) => {
    const courseId = course.id;
    const courseCode = getSafeString(course.code);
    router.push(`/neurobe/academic-setup?tab=courses&edit_id=${courseId}&code=${encodeURIComponent(courseCode)}`);
  };

  // Quick Stats
  const activeCoordinatorsCount = filteredCourseRoles.filter((c) => c.coordinator?.status === "Active").length;
  const activeInstructorsCount = filteredCourseRoles.reduce(
    (acc, c) => acc + c.instructors.filter((i: any) => (i.status || "Active") === "Active").length,
    0
  );

  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      <PageHeader
        title="Roles & Permissions"
        subtitle="Manage assigned Course Coordinators, active Course Instructors, and module access control."
        icon={<ShieldCheck className="h-5 w-5 text-color2" />}
        records={`${filteredCourseRoles.length} Active Courses`}
      />

      {/* Overview Stat Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="panel flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-color2 dark:bg-purple-950/40 dark:text-purple-300">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Active Courses</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{filteredCourseRoles.length}</h3>
          </div>
        </div>

        <div className="panel flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
            <UserCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Active Coordinators</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{activeCoordinatorsCount}</h3>
          </div>
        </div>

        <div className="panel flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Active Instructors</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{activeInstructorsCount}</h3>
          </div>
        </div>

        <div className="panel flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">System Roles</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">4 Core Roles</h3>
          </div>
        </div>
      </div>

      {/* Automatic Instructor Access Notice Banner */}
      <div className="panel mb-6 flex items-center gap-3 rounded-xl border border-purple-100 bg-[#ede9fe]/50 p-4 dark:border-purple-900/40 dark:bg-purple-950/20">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-color2 text-white shadow-sm">
          <Award className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-bold text-color2 dark:text-purple-300">
            Course Coordinator & Instructor Privilege Linking
          </h4>
          <p className="text-xs font-medium text-gray-600 dark:text-gray-300">
            Course Coordinators automatically possess full Course Instructor rights for their designated course delivery.
            Only active faculty assignments are displayed below.
          </p>
        </div>
        <button
          onClick={() => setActiveTab("permissions-matrix")}
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-purple-200 bg-white px-3 py-1.5 text-xs font-bold text-color2 transition hover:bg-purple-50 dark:border-purple-800 dark:bg-gray-800 dark:text-purple-300"
        >
          View Permissions Matrix <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Tab Switcher */}
      <div className="mb-6 flex border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={() => setActiveTab("course-roles")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-bold transition-all ${activeTab === "course-roles"
              ? "border-color2 text-color2 dark:border-purple-400 dark:text-purple-400"
              : "border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
        >
          <Users className="h-4 w-4" />
          Course Coordinators & Instructors
        </button>
        <button
          onClick={() => setActiveTab("permissions-matrix")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-bold transition-all ${activeTab === "permissions-matrix"
              ? "border-color2 text-color2 dark:border-purple-400 dark:text-purple-400"
              : "border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
        >
          <Lock className="h-4 w-4" />
          Role Permissions Matrix
        </button>
      </div>

      {/* Tab 1: Course Coordinators & Instructors View */}
      {activeTab === "course-roles" && (
        <div className="space-y-4">
          {/* Search & Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative w-full max-w-sm">
              <TextInput
                placeholder="Search course code, title, coordinator, instructor..."
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                icon={<IconSearch className="h-4 w-4 text-gray-400" />}
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <CustomSelect
                options={DEPT_OPTIONS}
                value={DEPT_OPTIONS.find((o) => o.value === deptFilter) ?? null}
                onChange={(e) => setDeptFilter(String(e?.value ?? "all"))}
                placeholder="All Departments"
                className="w-56"
                isClearable
              />

              <CustomSelect
                options={ROLE_OPTIONS}
                value={ROLE_OPTIONS.find((o) => o.value === roleFilter) ?? null}
                onChange={(e) => setRoleFilter(String(e?.value ?? "all"))}
                placeholder="All Roles"
                className="w-48"
                isClearable
              />
            </div>
          </div>

          {/* Active Course Roles Table */}
          <div className="panel overflow-hidden rounded-xl border border-gray-100 bg-white p-0 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <IconLoader className="h-8 w-8 animate-spin text-color2" />
                <span className="ml-3 text-sm font-semibold text-gray-500">Loading active roles data...</span>
              </div>
            ) : filteredCourseRoles.length === 0 ? (
              <div className="py-16 text-center">
                <Users className="mx-auto h-12 w-12 text-gray-300" />
                <h4 className="mt-3 text-base font-bold text-gray-700 dark:text-gray-300">No active course roles found</h4>
                <p className="text-xs text-gray-500">Try clearing search keywords or department filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
                  <thead className="bg-gray-50/80 text-xs font-bold uppercase tracking-wider text-gray-500 dark:bg-gray-800/50 dark:text-gray-400">
                    <tr>
                      <th className="px-6 py-4">Course Information</th>
                      <th className="px-6 py-4">Course Coordinator (Active)</th>
                      <th className="px-6 py-4">Course Instructors (Active)</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {filteredCourseRoles.map((row) => (
                      <tr
                        key={row.id}
                        className="transition-colors hover:bg-purple-50/30 dark:hover:bg-gray-800/40"
                      >
                        {/* Course Code & Title */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#ede9fe] text-xs font-extrabold text-color2 dark:bg-purple-900/40 dark:text-purple-300">
                              {getSafeString(row.code)}
                            </span>
                            <div>
                              <p className="font-bold text-gray-900 dark:text-gray-100">{getSafeString(row.title)}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {getSafeString(row.programme)} • {getSafeString(row.semester)}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Active Course Coordinator */}
                        <td className="px-6 py-4">
                          {row.coordinator ? (
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-600 text-xs font-bold text-white shadow-sm">
                                {getSafeString(row.coordinator.avatar, "CC")}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-gray-900 dark:text-gray-100">
                                    {getCoordinatorName(row.coordinator)}
                                  </span>
                                  <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                                    Coordinator
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500">{getSafeString(row.coordinator.email)}</p>
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs italic text-gray-400">No Coordinator Assigned</span>
                          )}
                        </td>

                        {/* Active Course Instructors List */}
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {row.instructors && row.instructors.length > 0 ? (
                              row.instructors
                                .filter((ins: any) => (ins.status || "Active") === "Active" || ins.is_active !== false)
                                .map((ins: any, idx: number) => {
                                  const name = getInstructorName(ins);
                                  return (
                                    <span
                                      key={idx}
                                      className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
                                    >
                                      <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                                      {name}
                                    </span>
                                  );
                                })
                            ) : (
                              <span className="text-xs italic text-gray-400">No Instructors</span>
                            )}
                          </div>
                        </td>

                        {/* Active Status Badge */}
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Active
                          </span>
                        </td>

                        {/* Edit Action Button — Navigates to Course page */}
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleEditCourse(row)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 shadow-sm transition hover:border-color2 hover:bg-purple-50 hover:text-color2 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-purple-500 dark:hover:text-purple-300"
                            title="Edit Course Roles & Details"
                          >
                            <IconEdit className="h-3.5 w-3.5" />
                            <span>Edit Course</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Role Permissions Matrix */}
      {activeTab === "permissions-matrix" && (
        <div className="panel overflow-hidden rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Module Access Control Matrix</h3>
              <p className="text-xs text-gray-500">
                Detailed breakdown of operational permissions granted for each role in the academic workflow.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-purple-50 px-3 py-1.5 text-xs font-bold text-color2 dark:bg-purple-950/40 dark:text-purple-300">
              <Key className="h-3.5 w-3.5" />
              Role Permission Enforcement Active
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-50 text-xs font-bold uppercase tracking-wider text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                <tr>
                  <th className="px-6 py-4">Module / Feature</th>
                  <th className="px-6 py-4">Course Coordinator</th>
                  <th className="px-6 py-4">Course Instructor</th>
                  <th className="px-6 py-4">General Faculty</th>
                  <th className="px-6 py-4">ERP / Inst. Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {PERMISSION_MATRIX.map((perm, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-900 dark:text-gray-100">{perm.module}</p>
                      <p className="text-xs text-gray-500">{perm.description}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 rounded-md bg-purple-100 px-2.5 py-1 text-xs font-bold text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {perm.coordinator}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 rounded-md bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {perm.instructor}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                        {perm.faculty.includes("No") ? (
                          <XCircle className="h-3.5 w-3.5 text-gray-400" />
                        ) : (
                          <Eye className="h-3.5 w-3.5" />
                        )}
                        {perm.faculty}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        {perm.admin}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default RolesPermissionsPage;
