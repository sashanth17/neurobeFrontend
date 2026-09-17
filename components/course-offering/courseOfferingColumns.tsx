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
export const makeCourseOfferingColumns = (onEdit: (row: any) => void) => [
  {
    accessor: "course",
    title: "COURSE",
    render: ({ code, course, subtitle }: any) => (
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#ede9fe] text-xs font-bold text-color2">
          {code}
        </span>
        <div>
          <p className="text-sm font-medium text-[#000] dark:text-gray-100">{course}</p>
          <p className="text-xs text-pri">{subtitle}</p>
        </div>
      </div>
    ),
  },
  {
    accessor: "programme",
    title: "PROGRAMME",
    render: ({ programme }: any) => <ProgrammeBadge programme={programme} />,
  },
  {
    accessor: "batch",
    title: "BATCH",
    render: ({ batch }: any) => <span className="text-sm text-[#000] dark:text-[#000]">{batch}</span>,
  },
  {
    accessor: "term",
    title: "ACADEMIC YEAR / TERM",
    render: ({ term, ay }: any) => (
      <div>
        <p className="text-sm font-medium text-[#000] dark:text-gray-100">{term}</p>
        <p className="text-xs text-pri">{ay}</p>
      </div>
    ),
  },
  {
    accessor: "coordinator",
    title: "COORDINATOR",
    render: ({ coordinator, coordinatorInfo }: any) => (
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-color2-l text-xs font-bold text-color2">
          {coordinator.charAt(0)}
        </div>
        <div>
          <p className="text-sm font-medium text-[#000] dark:text-gray-100">{coordinator}</p>
          <p className="text-xs text-pri">{coordinatorInfo}</p>
        </div>
      </div>
    ),
  },
  {
    accessor: "instructors",
    title: "INSTRUCTOR(S)",
    render: ({ instructors }: any) => (
      <div className="flex flex-col gap-1">
        {instructors.map((name: string, i: number) => (
          <div key={i} className="flex items-center gap-1.5 text-xs text-[#000] dark:text-[#000]">
            <Users className="h-3 w-3 shrink-0 text-[#000]" />
            {name}
          </div>
        ))}
      </div>
    ),
  },
  {
    accessor: "students",
    title: "STUDENTS",
    render: ({ students }: any) => <span className="text-sm font-semibold text-[#000] dark:text-gray-300">{students}</span>,
  },
  {
    accessor: "status",
    title: "STATUS",
    render: ({ status }: any) => <StatusCell status={status} />,
  },
  {
    accessor: "actions",
    title: "ACTIONS",
    render: (row: any) => (
      <div className="flex items-center gap-2">
        {/* <FacultyBadge label={row.type} /> */}
        <button onClick={() => onEdit(row)} className="text-[#000] hover:text-color2" title="Edit">
          <IconEdit className="h-4 w-4" />
        </button>
      </div>
    ),
  },
];

// keep static export for backward compat
export const COURSE_OFFERING_COLUMNS = makeCourseOfferingColumns(() => {});
