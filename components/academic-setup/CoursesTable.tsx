import { DataTable } from "mantine-datatable";
import IconEdit from "@/components/Icon/IconEdit";
import IconTrash from "@/components/Icon/IconTrash";
import IconLoader from "@/components/Icon/IconLoader";

export const MOCK_COURSES = [
  { id: 1, code: "CS301", title: "Data Structures",               l: 3, t: 0, p: 2, c: 4, theory: "45 hrs", lab: "30 hrs", status: "Active", department: "CSE" },
  { id: 2, code: "CS302", title: "Database Management Systems",   l: 3, t: 0, p: 2, c: 4, theory: "45 hrs", lab: "30 hrs", status: "Active", department: "CSE" },
  { id: 3, code: "CS303", title: "Operating Systems",             l: 3, t: 0, p: 2, c: 4, theory: "45 hrs", lab: "30 hrs", status: "Active", department: "CSE" },
  { id: 4, code: "CS304", title: "Computer Networks",             l: 3, t: 0, p: 0, c: 3, theory: "45 hrs", lab: "—",      status: "Active", department: "CSE" },
  { id: 5, code: "EC201", title: "Digital Signal Processing",     l: 3, t: 1, p: 0, c: 4, theory: "45 hrs", lab: "15 hrs", status: "Active", department: "ECE" },
  { id: 6, code: "AI101", title: "Foundations of Machine Learning", l: 3, t: 0, p: 2, c: 4, theory: "45 hrs", lab: "30 hrs", status: "Active", department: "AI" },
];

interface Props { search: string; statusFilter: string; deptFilter: string; loading?: boolean; }

const CoursesTable = ({ search, statusFilter, deptFilter, loading }: Props) => {
  const records = MOCK_COURSES.filter((r) => {
    const s = search.toLowerCase();
    const matchSearch = !s || r.code.toLowerCase().includes(s) || r.title.toLowerCase().includes(s);
    const matchStatus = statusFilter === "All Statuses" || r.status === statusFilter;
    const matchDept   = deptFilter === "All Departments" || r.department === deptFilter;
    return matchSearch && matchStatus && matchDept;
  });

  return (
    <DataTable
      noRecordsText="No courses found"
      highlightOnHover
      className="whitespace-nowrap"
      records={records}
      fetching={loading}
      customLoader={<div className="flex items-center justify-center py-12"><IconLoader className="h-6 w-6 animate-spin text-color2" /></div>}
      columns={[
        { accessor: "code",   title: "COURSE CODE",  render: ({ code }) => <span className="font-medium text-color2">{code}</span> },
        { accessor: "title",  title: "COURSE TITLE", render: ({ title }) => <span className="text-[#000] dark:text-gray-200">{title}</span> },
        { accessor: "l",      title: "L",            render: ({ l }) => <span className="text-[#000] dark:text-[#000]">{l}</span> },
        { accessor: "t",      title: "T",            render: ({ t }) => <span className="text-[#000] dark:text-[#000]">{t}</span> },
        { accessor: "p",      title: "P",            render: ({ p }) => <span className="text-[#000] dark:text-[#000]">{p}</span> },
        { accessor: "c",      title: "C",            render: ({ c }) => (
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#ede9fe] text-xs font-bold text-color2">{c}</span>
        )},
        { accessor: "theory", title: "THEORY HOURS", render: ({ theory }) => <span className="text-[#000] dark:text-[#000]">{theory}</span> },
        { accessor: "lab",    title: "LAB HOURS",    render: ({ lab }) => <span className="text-[#000] dark:text-[#000]">{lab}</span> },
        { accessor: "status", title: "STATUS",       render: ({ status }) => (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />{status}
          </span>
        )},
        { accessor: "actions", title: "ACTIONS", render: () => (
          <div className="flex items-center gap-3">
            <button className="text-[#000] hover:text-color2"><IconEdit className="h-4 w-4" /></button>
            <button className="text-[#000] hover:text-red-500"><IconTrash className="h-4 w-4" /></button>
          </div>
        )},
      ]}
      minHeight={200}
    />
  );
};

export default CoursesTable;
