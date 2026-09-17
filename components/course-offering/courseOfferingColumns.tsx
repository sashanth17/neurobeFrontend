import { Users } from "lucide-react";
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

// ─── Column factory — accepts onEdit callback ─────────────────────────────────
export const makeCourseOfferingColumns = (onEdit?: (row: any) => void) => [
  {
    accessor: "course",
    title: "COURSE OFFERING",
    render: (row: any) => {
      const code = row.course_code || row.code || "CS";
      const title = row.course_instance_name || row.course || row.course_title || "Course Offering";
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
    render: (row: any) => (
      <span className="text-sm font-semibold text-[#000] dark:text-gray-300">
        {row.enrolled_count ?? row.students ?? 0} Students
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
];

// keep static export for backward compat
export const COURSE_OFFERING_COLUMNS = makeCourseOfferingColumns(() => {});
