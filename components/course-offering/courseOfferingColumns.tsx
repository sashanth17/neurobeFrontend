import { Users, Archive, Eye, EyeOff, UserPlus } from "lucide-react";
import IconEdit from "@/components/Icon/IconEdit";

// ─── Shared cells ─────────────────────────────────────────────────────────────
export const StatusCell = ({ status }: { status: string }) => (
  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${status === "Active" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
    <span className={`h-1.5 w-1.5 rounded-full ${status === "Active" ? "bg-green-500" : "bg-red-400"}`} />
    {status}
  </span>
);

const FacultyBadge = ({ label }: { label: string }) => (
  <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
    <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
    {label}
  </span>
);

const ProgrammeBadge = ({ programme }: { programme: string }) => (
  <span className="inline-flex items-center rounded-full bg-[#ede9fe] px-2.5 py-0.5 text-xs font-semibold text-color2">
    {programme}
  </span>
);

// ─── Mock data ────────────────────────────────────────────────────────────────
export const MOCK_OFFERINGS = [
  {
    id: 1,
    code: "CS",
    course: "CS301 Data Structures",
    subtitle: "3 Credits",
    programme: "B.Tech CSE",
    batch: "2025-29",
    term: "Semester 5",
    ay: "AY 2024-25",
    coordinator: "Arjun Kumar",
    coordinatorInfo: "Coordinator Info",
    instructors: ["Arjun Kumar", "Priya Schram"],
    students: 40,
    status: "Active",
    type: "Faculty",
  },
  {
    id: 2,
    code: "CS",
    course: "CS301 Data Structures",
    subtitle: "3 Credits",
    programme: "B.Tech CSE",
    batch: "2025-29",
    term: "Semester 5",
    ay: "AY 2024-25",
    coordinator: "Arjun Kumar",
    coordinatorInfo: "Coordinator Info",
    instructors: ["Arjun Kumar", "Priya Schram"],
    students: 40,
    status: "Active",
    type: "Faculty",
  },
  {
    id: 3,
    code: "CS",
    course: "CS302 Database Management Systems",
    subtitle: "3 Credits",
    programme: "B.Tech CSE",
    batch: "2024-28",
    term: "Semester 4",
    ay: "AY 2024-25",
    coordinator: "Priya Balwani",
    coordinatorInfo: "Coordinator Info",
    instructors: ["Priya Schram", "Sanjay Murugan"],
    students: 65,
    status: "Active",
    type: "Faculty",
  },
  {
    id: 4,
    code: "CS",
    course: "CS303 Operating Systems",
    subtitle: "3 Credits",
    programme: "B.Tech CSE",
    batch: "2024-28",
    term: "Semester 4",
    ay: "AY 2024-25",
    coordinator: "Vignesh Kumar",
    coordinatorInfo: "Coordinator Info",
    instructors: ["Vignesh Kumar"],
    students: 38,
    status: "Active",
    type: "Faculty",
  },
  {
    id: 5,
    code: "EC",
    course: "EC201 Digital Signal Processing",
    subtitle: "3 Credits",
    programme: "B.Tech ECE",
    batch: "2025-29",
    term: "Semester 3",
    ay: "AY 2024-25",
    coordinator: "Vignesh Kumar",
    coordinatorInfo: "Coordinator Info",
    instructors: ["Vignesh Kumar"],
    students: 42,
    status: "Active",
    type: "Faculty",
  },
];

// ─── Column factory — accepts onEdit, onManageStudents, onToggleArchive callbacks ──
export const makeCourseOfferingColumns = (
  onEdit?: (row: any) => void,
  onManageStudents?: (row: any) => void,
  onToggleArchive?: (row: any) => void
) => [
  {
    accessor: "course",
    title: "COURSE INSTANCE",
    render: (row: any) => {
      const code = row.course_code || row.code || "CS";
      const title = row.course_instance_name || row.course || row.course_title || "Course Instance";
      const sub = row.course_title ? `${row.course_code || ""} · ${row.course_title}` : (row.subtitle || `Semester ${row.semester || 1}`);
      return (
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#ede9fe] text-xs font-bold text-color2">
            {code.substring(0, 4)}
          </span>
          <div>
            <p className="text-sm font-medium text-[#000] dark:text-gray-100">{title}</p>
            <p className="text-xs text-pri">{sub}</p>
          </div>
        </div>
      );
    },
  },
  {
    accessor: "programme",
    title: "PROGRAMME",
    render: (row: any) => (
      <ProgrammeBadge programme={row.programme_name || row.programme || "B.Tech"} />
    ),
  },
  {
    accessor: "semester",
    title: "TERM / SEMESTER",
    render: (row: any) => (
      <span className="text-sm text-[#000] dark:text-[#000]">
        {row.semester ? `Semester ${row.semester}` : (row.term || "Semester 1")}
      </span>
    ),
  },
  {
    accessor: "created_by",
    title: "CREATED BY",
    render: (row: any) => (
      <div className="flex items-center gap-1.5 text-xs text-[#000] dark:text-[#000]">
        <Users className="h-3 w-3 shrink-0 text-[#000]" />
        {row.created_by_name || row.created_by || `User #${row.created_by_id || 1}`}
      </div>
    ),
  },
  {
    accessor: "students",
    title: "ENROLLED STUDENTS",
    render: (row: any) => {
      const count =
        row.student_count ??
        row.students_count ??
        row.enrolled_students_count ??
        row.enrolled_count ??
        row.students ??
        row.total_enrolled ??
        0;
      return (
        <span className="text-sm font-semibold text-[#000] dark:text-gray-300">
          {count} Students
        </span>
      );
    },
  },
  {
    accessor: "term_visibility",
    title: "STUDENT VISIBILITY",
    render: (row: any) => {
      const isVisible = row.term_visibility !== false;
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            isVisible
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
              : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
          }`}
        >
          {isVisible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
          {isVisible ? "Visible" : "Hidden"}
        </span>
      );
    },
  },
  {
    accessor: "is_archived",
    title: "ARCHIVED",
    render: (row: any) => (
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
          row.is_archived
            ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
            : "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
        }`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${row.is_archived ? "bg-amber-500" : "bg-blue-500"}`} />
        {row.is_archived ? "Archived" : "Active"}
      </span>
    ),
  },
  {
    accessor: "status",
    title: "STATUS",
    render: (row: any) => (
      <StatusCell status={row.status || (row.is_active !== false ? "Active" : "Inactive")} />
    ),
  },
  {
    accessor: "actions",
    title: "ACTIONS",
    render: (row: any) => (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onManageStudents?.(row)}
          className="flex items-center gap-1 rounded-lg border border-purple-200 bg-purple-50 px-2.5 py-1 text-xs font-semibold text-color2 hover:bg-purple-100 dark:border-purple-800 dark:bg-purple-950/30 dark:hover:bg-purple-900/40"
          title="Manage Students"
        >
          <UserPlus className="h-3.5 w-3.5" />
          <span>Students</span>
        </button>
        <button
          type="button"
          onClick={() => onToggleArchive?.(row)}
          className={`p-1.5 rounded-lg border text-xs transition ${
            row.is_archived
              ? "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
              : "border-gray-200 text-gray-500 hover:text-amber-600 hover:bg-amber-50"
          }`}
          title={row.is_archived ? "Unarchive Instance" : "Archive Instance"}
        >
          <Archive className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onEdit?.(row)}
          className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:text-color2 dark:border-gray-700 dark:text-gray-300 dark:hover:text-purple-400"
          title="Edit Course Instance"
        >
          <IconEdit className="h-3.5 w-3.5" />
        </button>
      </div>
    ),
  },
];

// keep static export for backward compat
export const COURSE_OFFERING_COLUMNS = makeCourseOfferingColumns(() => {});
