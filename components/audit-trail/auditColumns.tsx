// ─── Shared cells ─────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  "bg-blue-500", "bg-purple-500", "bg-green-500", "bg-orange-500",
  "bg-pink-500",  "bg-teal-500",  "bg-red-500",   "bg-indigo-500",
];
const getColor = (name: string) => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

const UserCell = ({ name, email }: { name: string; email: string }) => (
  <div className="flex items-center gap-2.5">
    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-color2 bg-color2-l`}>
      {name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
    </div>
    <div>
      <p className="text-sm font-semibold text-[#000] dark:text-gray-100">{name}</p>
      <p className="text-xs text-[#000]">{email}</p>
    </div>
  </div>
);

const RoleBadge = ({ role }: { role: string }) => {
  const map: Record<string, string> = {
    "ERP Admin":          "bg-orange-50 text-orange-700",
    "Course Coordinator": "bg-purple-50 text-purple-700",
    "Course Instructor":  "bg-blue-50 text-blue-700",
    "Student":            "bg-gray-100 text-[#000]",
    "Super Admin":        "bg-red-50 text-red-700",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${map[role] ?? "bg-gray-100 text-[#000]"}`}>
      {role}
    </span>
  );
};

const CategoryBadge = ({ category }: { category: string }) => {
  const map: Record<string, string> = {
    "User & Access":       "bg-blue-50 text-blue-700",
    "Course & Enrollment": "bg-purple-50 text-purple-700",
    "Academic Setup":      "bg-green-50 text-green-700",
    "Assessment & Marks":  "bg-yellow-50 text-yellow-700",
    "AI & Attainment":     "bg-pink-50 text-pink-700",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${map[category] ?? "bg-gray-100 text-[#000]"}`}>
      {category}
    </span>
  );
};

// ─── Mock data ────────────────────────────────────────────────────────────────
export const MOCK_AUDIT = [
  { id: 1,  name: "Meena Subramanian", email: "meena.subramanian@karpag...", role: "ERP Admin",          action: "Created user Kevin Raj",                    entity: "User",            category: "User & Access",       date: "Aug 24, 2026", time: "3:00 am" },
  { id: 2,  name: "Meena Subramanian", email: "meena.subramanian@karpag...", role: "ERP Admin",          action: "Assigned Priya Selvan to CS301",             entity: "Course Offering", category: "Course & Enrollment", date: "Aug 24, 2026", time: "2:58 am" },
  { id: 3,  name: "Arun Kumar",        email: "arun.kumar@karpagam.edu...",  role: "Course Coordinator", action: "Approved syllabus attraction for CS301",     entity: "Syllabus",        category: "Academic Setup",      date: "Aug 24, 2026", time: "11:40 am" },
  { id: 4,  name: "Priya Selvan",      email: "priya.selvan@karpagam.edu",   role: "Course Instructor",  action: "Corrected entered mark for CIA-1",           entity: "Marks",           category: "Assessment & Marks",  date: "Aug 24, 2026", time: "9:20 am" },
  { id: 5,  name: "Priya Selvan",      email: "priya.selvan@karpagam.edu",   role: "Course Instructor",  action: "Enrolled Kevin Rajin CS301",                 entity: "Enrollment",      category: "Course & Enrollment", date: "Aug 24, 2026", time: "9:15 am" },
  { id: 6,  name: "Kevin Raj",         email: "kevin.raj@karpagam.edu...",   role: "Student",            action: "Login successful",                           entity: "User Account",    category: "User & Access",       date: "Aug 23, 2026", time: "8:30 am" },
  { id: 7,  name: "Karthik Raja",      email: "karthik.raja@karpagam...",    role: "Super Admin",        action: "Updated Program Outcome version",            entity: "Program Outcome", category: "Academic Setup",      date: "Aug 22, 2026", time: "5:00 pm" },
  { id: 8,  name: "Arun Kumar",        email: "arun.kumar@karpagam.edu...",  role: "Course Coordinator", action: "Reattainment calculation for CS301",         entity: "Attainment",      category: "AI & Attainment",     date: "Aug 22, 2026", time: "4:45 pm" },
  { id: 9,  name: "Meena Subramanian", email: "meena.subramanian@karpag...", role: "ERP Admin",          action: "Deleted batch B2020",                        entity: "Batch",           category: "Academic Setup",      date: "Aug 21, 2026", time: "2:10 pm" },
  { id: 10, name: "Priya Selvan",      email: "priya.selvan@karpagam.edu",   role: "Course Instructor",  action: "Uploaded course material for CS302",         entity: "Course Material", category: "Course & Enrollment", date: "Aug 21, 2026", time: "11:00 am" },
  { id: 11, name: "Kevin Raj",         email: "kevin.raj@karpagam.edu...",   role: "Student",            action: "Submitted assignment for CS301",             entity: "Assignment",      category: "Assessment & Marks",  date: "Aug 20, 2026", time: "3:45 pm" },
  { id: 12, name: "Karthik Raja",      email: "karthik.raja@karpagam...",    role: "Super Admin",        action: "Created new department AI",                  entity: "Department",      category: "Academic Setup",      date: "Aug 20, 2026", time: "10:00 am" },
  { id: 13, name: "Arun Kumar",        email: "arun.kumar@karpagam.edu...",  role: "Course Coordinator", action: "Mapped CO to PO for CS301",                  entity: "CO-PO Mapping",   category: "AI & Attainment",     date: "Aug 19, 2026", time: "9:30 am" },
  { id: 14, name: "Meena Subramanian", email: "meena.subramanian@karpag...", role: "ERP Admin",          action: "Reset password for Kevin Raj",               entity: "User Account",    category: "User & Access",       date: "Aug 19, 2026", time: "8:00 am" },
  { id: 15, name: "Priya Selvan",      email: "priya.selvan@karpagam.edu",   role: "Course Instructor",  action: "Published marks for CIA-2",                  entity: "Marks",           category: "Assessment & Marks",  date: "Aug 18, 2026", time: "4:00 pm" },
  { id: 16, name: "Kevin Raj",         email: "kevin.raj@karpagam.edu...",   role: "Student",            action: "Viewed course material CS303",               entity: "Course Material", category: "Course & Enrollment", date: "Aug 18, 2026", time: "2:30 pm" },
  { id: 17, name: "Karthik Raja",      email: "karthik.raja@karpagam...",    role: "Super Admin",        action: "Approved programme MTECH-AI",                entity: "Programme",       category: "Academic Setup",      date: "Aug 17, 2026", time: "11:15 am" },
  { id: 18, name: "Arun Kumar",        email: "arun.kumar@karpagam.edu...",  role: "Course Coordinator", action: "Updated course outline for EC201",           entity: "Syllabus",        category: "Academic Setup",      date: "Aug 17, 2026", time: "9:00 am" },
  { id: 19, name: "Meena Subramanian", email: "meena.subramanian@karpag...", role: "ERP Admin",          action: "Exported user report",                       entity: "Report",          category: "User & Access",       date: "Aug 16, 2026", time: "5:30 pm" },
  { id: 20, name: "Priya Selvan",      email: "priya.selvan@karpagam.edu",   role: "Course Instructor",  action: "Graded project submission for CS302",        entity: "Marks",           category: "Assessment & Marks",  date: "Aug 16, 2026", time: "3:00 pm" },
  { id: 21, name: "Kevin Raj",         email: "kevin.raj@karpagam.edu...",   role: "Student",            action: "Registered for elective AI101",              entity: "Enrollment",      category: "Course & Enrollment", date: "Aug 15, 2026", time: "10:45 am" },
  { id: 22, name: "Karthik Raja",      email: "karthik.raja@karpagam...",    role: "Super Admin",        action: "Configured academic year 2026-27",           entity: "Academic Year",   category: "Academic Setup",      date: "Aug 15, 2026", time: "9:00 am" },
  { id: 23, name: "Arun Kumar",        email: "arun.kumar@karpagam.edu...",  role: "Course Coordinator", action: "Finalised attainment report CS301",          entity: "Attainment",      category: "AI & Attainment",     date: "Aug 14, 2026", time: "4:20 pm" },
  { id: 24, name: "Meena Subramanian", email: "meena.subramanian@karpag...", role: "ERP Admin",          action: "Deactivated user Sanjay Murugan",            entity: "User",            category: "User & Access",       date: "Aug 14, 2026", time: "2:00 pm" },
  { id: 25, name: "Priya Selvan",      email: "priya.selvan@karpagam.edu",   role: "Course Instructor",  action: "Added question bank for CS301",              entity: "Assessment",      category: "Assessment & Marks",  date: "Aug 13, 2026", time: "11:30 am" },
  { id: 26, name: "Kevin Raj",         email: "kevin.raj@karpagam.edu...",   role: "Student",            action: "Downloaded grade card",                      entity: "Report",          category: "User & Access",       date: "Aug 13, 2026", time: "9:15 am" },
  { id: 27, name: "Karthik Raja",      email: "karthik.raja@karpagam...",    role: "Super Admin",        action: "Merged duplicate department records",        entity: "Department",      category: "Academic Setup",      date: "Aug 12, 2026", time: "3:45 pm" },
  { id: 28, name: "Arun Kumar",        email: "arun.kumar@karpagam.edu...",  role: "Course Coordinator", action: "Submitted PSO mapping for review",           entity: "PSO",             category: "AI & Attainment",     date: "Aug 12, 2026", time: "1:00 pm" },
  { id: 29, name: "Meena Subramanian", email: "meena.subramanian@karpag...", role: "ERP Admin",          action: "Bulk imported 45 students",                  entity: "User",            category: "User & Access",       date: "Aug 11, 2026", time: "10:00 am" },
  { id: 30, name: "Priya Selvan",      email: "priya.selvan@karpagam.edu",   role: "Course Instructor",  action: "Locked marks for semester 5",                entity: "Marks",           category: "Assessment & Marks",  date: "Aug 11, 2026", time: "8:45 am" },
  { id: 31, name: "Kevin Raj",         email: "kevin.raj@karpagam.edu...",   role: "Student",            action: "Updated profile information",                entity: "User Account",    category: "User & Access",       date: "Aug 10, 2026", time: "5:00 pm" },
  { id: 32, name: "Karthik Raja",      email: "karthik.raja@karpagam...",    role: "Super Admin",        action: "Archived batch B2019",                       entity: "Batch",           category: "Academic Setup",      date: "Aug 10, 2026", time: "3:30 pm" },
  { id: 33, name: "Arun Kumar",        email: "arun.kumar@karpagam.edu...",  role: "Course Coordinator", action: "Reviewed CO attainment for EC201",           entity: "Attainment",      category: "AI & Attainment",     date: "Aug 9, 2026",  time: "2:15 pm" },
  { id: 34, name: "Meena Subramanian", email: "meena.subramanian@karpag...", role: "ERP Admin",          action: "Assigned role Course Coordinator to Arun",  entity: "User",            category: "User & Access",       date: "Aug 9, 2026",  time: "11:00 am" },
  { id: 35, name: "Priya Selvan",      email: "priya.selvan@karpagam.edu",   role: "Course Instructor",  action: "Created internal assessment for CS303",     entity: "Assessment",      category: "Assessment & Marks",  date: "Aug 8, 2026",  time: "9:30 am" },
  { id: 36, name: "Kevin Raj",         email: "kevin.raj@karpagam.edu...",   role: "Student",            action: "Attended online class CS301",                entity: "Attendance",      category: "Course & Enrollment", date: "Aug 8, 2026",  time: "8:00 am" },
  { id: 37, name: "Karthik Raja",      email: "karthik.raja@karpagam...",    role: "Super Admin",        action: "Generated accreditation report",             entity: "Report",          category: "AI & Attainment",     date: "Aug 7, 2026",  time: "4:00 pm" },
  { id: 38, name: "Arun Kumar",        email: "arun.kumar@karpagam.edu...",  role: "Course Coordinator", action: "Updated lesson plan for CS301",              entity: "Syllabus",        category: "Academic Setup",      date: "Aug 7, 2026",  time: "2:45 pm" },
  { id: 39, name: "Meena Subramanian", email: "meena.subramanian@karpag...", role: "ERP Admin",          action: "Enabled two-factor authentication",          entity: "User Account",    category: "User & Access",       date: "Aug 6, 2026",  time: "1:30 pm" },
  { id: 40, name: "Priya Selvan",      email: "priya.selvan@karpagam.edu",   role: "Course Instructor",  action: "Shared feedback report with students",      entity: "Report",          category: "Assessment & Marks",  date: "Aug 6, 2026",  time: "10:00 am" },
  { id: 41, name: "Kevin Raj",         email: "kevin.raj@karpagam.edu...",   role: "Student",            action: "Requested re-evaluation for CIA-1",         entity: "Marks",           category: "Assessment & Marks",  date: "Aug 5, 2026",  time: "9:00 am" },
  { id: 42, name: "Karthik Raja",      email: "karthik.raja@karpagam...",    role: "Super Admin",        action: "Closed academic year 2025-26",               entity: "Academic Year",   category: "Academic Setup",      date: "Aug 5, 2026",  time: "8:00 am" },
];

// ─── Column definitions — defined outside <DataTable> ─────────────────────────
export const AUDIT_COLUMNS = [
  {
    accessor: "name",
    title: "USER",
    render: ({ name, email }: any) => <UserCell name={name} email={email} />,
  },
  {
    accessor: "role",
    title: "ROLE",
    render: ({ role }: any) => <RoleBadge role={role} />,
  },
  {
    accessor: "action",
    title: "ACTION",
    render: ({ action }: any) => (
      <span className="text-sm text-[#000] dark:text-gray-300">{action}</span>
    ),
  },
  {
    accessor: "entity",
    title: "ENTITY",
    render: ({ entity }: any) => (
      <span className="text-sm text-[#000] dark:text-[#000]">{entity}</span>
    ),
  },
  {
    accessor: "category",
    title: "CATEGORY",
    render: ({ category }: any) => <CategoryBadge category={category} />,
  },
  {
    accessor: "date",
    title: "DATE & TIME",
    render: ({ date, time }: any) => (
      <div>
        <p className="text-sm font-medium text-[#000] dark:text-gray-100">{date}</p>
        <p className="text-xs text-[#000]">{time}</p>
      </div>
    ),
  },
  {
    accessor: "details",
    title: "DETAILS",
    render: () => (
      <button className="flex items-center gap-1 text-xs font-medium text-color2 hover:underline">
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        View Changes
      </button>
    ),
  },
];
