import IconEdit from "@/components/Icon/IconEdit";
import IconTrash from "@/components/Icon/IconTrash";
import IconEye from "@/components/Icon/IconEye";

// ─── Shared cells ─────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  "bg-blue-500",
  "bg-purple-500",
  "bg-green-500",
  "bg-orange-500",
  "bg-pink-500",
  "bg-teal-500",
  "bg-red-500",
  "bg-indigo-500",
];

const getColor = (name: string) =>
  AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

export const AvatarCell = ({ name, sub }: { name: string; sub: string }) => (
  <div className="flex items-center gap-2.5">
    <div
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-color2 bg-color2-l`}
    >
      {name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")}
    </div>
    <div>
      <p className="text-sm font-semibold text-[#000] dark:text-gray-100">
        {name}
      </p>
      <p className="text-xs text-[#000]">{sub}</p>
    </div>
  </div>
);

const RoleBadge = ({ role }: { role: string }) => {
  const normRole = role === "ERP_ADMIN" ? "ERP Admin" : role;
  const map: Record<string, string> = {
    "Course Coordinator": "bg-purple-50 text-purple-700",
    "Course Instructor": "bg-blue-50 text-blue-700",
    Student: "bg-gray-100 text-[#000]",
    "ERP Admin": "bg-orange-50 text-orange-700",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        map[normRole] ?? "bg-gray-100 text-[#000]"
      }`}
    >
      {normRole}
    </span>
  );
};

const StatusBadge = ({ status }: { status: string }) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
      status === "Active"
        ? "bg-green-50 text-green-700"
        : status === "Inactive"
        ? "bg-red-50 text-red-600"
        : status === "Locked"
        ? "bg-yellow-50 text-yellow-700"
        : "bg-gray-100 text-[#000]"
    }`}
  >
    <span
      className={`h-1.5 w-1.5 rounded-full ${
        status === "Active"
          ? "bg-green-500"
          : status === "Inactive"
          ? "bg-red-400"
          : status === "Locked"
          ? "bg-yellow-500"
          : "bg-gray-400"
      }`}
    />
    {status}
  </span>
);

const TypeBadge = ({ type }: { type: string }) => (
  <span
    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
      type === "Faculty / Staff"
        ? "bg-blue-50 text-blue-700"
        : "bg-gray-100 text-[#000]"
    }`}
  >
    {type}
  </span>
);

// ─── Mock data ────────────────────────────────────────────────────────────────
export const MOCK_USERS = [
  {
    id: 1,
    name: "Arun Kumar",
    sub: "Joined 2022",
    email: "arun.kumar@karpagam.edu",
    regNo: "FAC-CSE-038",
    role: "Course Coordinator",
    department: "Computer Science & Eng...",
    programme: "B.E. Computer Science...",
    batch: "Faculty / Staff",
    status: "Active",
    type: "Faculty / Staff",
  },
  {
    id: 2,
    name: "Priya Selvan",
    sub: "Joined 2021",
    email: "priya.selvan@karpagam.edu",
    regNo: "FAC-CSE-042",
    role: "Course Instructor",
    department: "Computer Science & Eng...",
    programme: "B.E. Computer Science...",
    batch: "Faculty / Staff",
    status: "Active",
    type: "Faculty / Staff",
  },
  {
    id: 3,
    name: "Kevin Raj",
    sub: "Joined 2023",
    email: "kevin.raj@karpagam.edu",
    regNo: "FAC-CSE-044",
    role: "Student",
    department: "Computer Science & Eng...",
    programme: "B.E. Computer Science...",
    batch: "2023-2026",
    status: "Active",
    type: "Student",
  },
  {
    id: 4,
    name: "Nivetha Krishnan",
    sub: "Joined 2020",
    email: "nivetha.k@karpagam.edu",
    regNo: "FAC-ECE-019",
    role: "Course Coordinator",
    department: "Electronics & Comm...",
    programme: "B.Tech ECE",
    batch: "Faculty / Staff",
    status: "Active",
    type: "Faculty / Staff",
  },
  {
    id: 5,
    name: "Rahul Mohan",
    sub: "Joined 2024",
    email: "rahul.m@karpagam.edu",
    regNo: "24C0068",
    role: "Student",
    department: "Artificial Intelligence",
    programme: "D.Tech AI",
    batch: "2024-2028",
    status: "Active",
    type: "Student",
  },
  {
    id: 6,
    name: "Deepa Natarajan",
    sub: "Joined 2019",
    email: "deepa.n@karpagam.edu",
    regNo: "ADM-003",
    role: "ERP Admin",
    department: "Information Technology",
    programme: "D.Tech IT",
    batch: "Faculty / Staff",
    status: "Active",
    type: "Faculty / Staff",
  },
  {
    id: 7,
    name: "Siddharth Verma",
    sub: "Joined 2022",
    email: "siddharth.v@karpagam.edu",
    regNo: "22C0112",
    role: "Student",
    department: "Computer Science & Eng...",
    programme: "B.E. Computer Science...",
    batch: "2022-2026",
    status: "Inactive",
    type: "Student",
  },
  {
    id: 8,
    name: "Ananya Iyer",
    sub: "Joined 2021",
    email: "ananya.iyer@karpagam.edu",
    regNo: "21C0045",
    role: "Student",
    department: "Electronics & Comm...",
    programme: "B.Tech ECE",
    batch: "2021-2025",
    status: "Locked",
    type: "Student",
  },
];

// ─── Column factory ───────────────────────────────────────────────────────────
export const makeUserListColumns = (
  onEdit: (r: any) => void,
  onDelete?: (r: any) => void
) => [
  {
    accessor: "name",
    title: "NAME / JOINED",
    render: (row: any) => {
      const fullName = row.first_name
        ? `${row.first_name} ${row.last_name || ""}`.trim()
        : row.name || "-";
      const sub = row.registered_on
        ? `Joined ${new Date(row.registered_on).toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          })}`
        : row.sub || "-";
      return <AvatarCell name={fullName} sub={sub} />;
    },
  },
  {
    accessor: "email",
    title: "EMAIL",
    render: (row: any) => (
      <span className="flex items-center gap-1 text-xs dark:text-[#000]">
        {row.email || "-"}
      </span>
    ),
  },
  {
    accessor: "regNo",
    title: "REGISTER NO.",
    render: (row: any) => (
      <span className="font-mono text-xs font-medium text-[#000] dark:text-gray-300">
        {row.regNo || row.registry_number || (row.id ? `USR-${String(row.id).padStart(4, "0")}` : "-")}
      </span>
    ),
  },
  {
    accessor: "role",
    title: "ROLE",
    render: (row: any) => <RoleBadge role={row.role || "-"} />,
  },
  {
    accessor: "department",
    title: "DEPARTMENT",
    render: (row: any) => (
      <span className="text-xs text-[#000] dark:text-[#000]">
        {row.department?.department_name || row.department_name || row.department || "-"}
      </span>
    ),
  },
  {
    accessor: "programme",
    title: "PROGRAMME",
    render: (row: any) => (
      <span className="text-xs text-[#000] dark:text-[#000]">
        {row.programme?.programme_name || row.programme_name || row.programme || "-"}
      </span>
    ),
  },
  {
    accessor: "batch",
    title: "BATCH",
    render: (row: any) => (
      <span className="text-xs text-[#000] dark:text-[#000]">
        {row.batch?.name || row.batch_name || row.batch || (row.is_staff ? "Faculty / Staff" : "-")}
      </span>
    ),
  },
  {
    accessor: "status",
    title: "STATUS",
    render: (row: any) => {
      const status = row.status || (row.is_active ? "Active" : "Inactive");
      return <StatusBadge status={status} />;
    },
  },
  {
    accessor: "type",
    title: "ACTIONS",
    render: (row: any) => {
      const type = row.type || (row.is_staff ? "Faculty / Staff" : "Student");
      return (
        <div className="flex items-center gap-2">
          <TypeBadge type={type} />
          <button
            onClick={() => onEdit(row)}
            className="text-[#000] hover:text-color2"
            title="Edit"
          >
            <IconEdit className="h-4 w-4" />
          </button>
          {onDelete && (
            <button
              onClick={() => onDelete(row)}
              className="text-[#000] hover:text-red-500"
              title="Delete"
            >
              <IconTrash className="h-4 w-4" />
            </button>
          )}
        </div>
      );
    },
  },
];

// static export for backward compat
export const USER_LIST_COLUMNS = makeUserListColumns(() => {});
