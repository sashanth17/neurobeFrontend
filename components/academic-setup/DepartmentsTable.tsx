import { DataTable } from "mantine-datatable";
import IconEdit from "@/components/Icon/IconEdit";
import IconTrash from "@/components/Icon/IconTrash";
import IconLoader from "@/components/Icon/IconLoader";

export const MOCK_DEPARTMENTS = [
  { id: 1, code: "CSE", name: "Computer Science & Engineering", hod: "Dr. A. Kumar",    programmes: 3, status: "Active" },
  { id: 2, code: "ECE", name: "Electronics & Communication",    hod: "Dr. B. Sharma",   programmes: 2, status: "Active" },
  { id: 3, code: "ME",  name: "Mechanical Engineering",         hod: "Dr. C. Patel",    programmes: 2, status: "Active" },
  { id: 4, code: "CE",  name: "Civil Engineering",              hod: "Dr. D. Reddy",    programmes: 1, status: "Inactive" },
  { id: 5, code: "AI",  name: "Artificial Intelligence",        hod: "Dr. E. Nair",     programmes: 2, status: "Active" },
];

interface Props { search: string; statusFilter: string; loading?: boolean; }

const DepartmentsTable = ({ search, statusFilter, loading }: Props) => {
  const records = MOCK_DEPARTMENTS.filter((r) => {
    const s = search.toLowerCase();
    const matchSearch = !s || r.code.toLowerCase().includes(s) || r.name.toLowerCase().includes(s);
    const matchStatus = statusFilter === "All Statuses" || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <DataTable
      noRecordsText="No departments found"
      highlightOnHover
      className="whitespace-nowrap"
      records={records}
      fetching={loading}
      customLoader={<div className="flex items-center justify-center py-12"><IconLoader className="h-6 w-6 animate-spin text-color2" /></div>}
      columns={[
        { accessor: "code",  title: "CODE",  render: ({ code }) => <span className="font-medium text-color2">{code}</span> },
        { accessor: "name",  title: "DEPARTMENT NAME", render: ({ name }) => <span className="text-[#000] dark:text-gray-200">{name}</span> },
        { accessor: "hod",   title: "HEAD OF DEPARTMENT", render: ({ hod }) => <span className="text-[#000] dark:text-[#000]">{hod}</span> },
        { accessor: "programmes", title: "PROGRAMMES", render: ({ programmes }) => (
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#ede9fe] text-xs font-bold text-color2">{programmes}</span>
        )},
        { accessor: "status", title: "STATUS", render: ({ status }) => (
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${status === "Active" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${status === "Active" ? "bg-green-500" : "bg-red-400"}`} />{status}
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

export default DepartmentsTable;
