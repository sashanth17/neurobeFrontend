import { DataTable } from "mantine-datatable";
import IconEdit from "@/components/Icon/IconEdit";
import IconTrash from "@/components/Icon/IconTrash";
import IconLoader from "@/components/Icon/IconLoader";

export const MOCK_PROGRAMMES = [
  { id: 1, code: "BTECH-CSE", name: "B.Tech Computer Science",       department: "CSE", duration: "4 Years", type: "UG", status: "Active" },
  { id: 2, code: "BTECH-ECE", name: "B.Tech Electronics & Comm.",    department: "ECE", duration: "4 Years", type: "UG", status: "Active" },
  { id: 3, code: "MTECH-AI",  name: "M.Tech Artificial Intelligence",department: "AI",  duration: "2 Years", type: "PG", status: "Active" },
  { id: 4, code: "MBA",       name: "Master of Business Admin.",      department: "MBA", duration: "2 Years", type: "PG", status: "Inactive" },
];

interface Props { search: string; statusFilter: string; loading?: boolean; }

const ProgrammesTable = ({ search, statusFilter, loading }: Props) => {
  const records = MOCK_PROGRAMMES.filter((r) => {
    const s = search.toLowerCase();
    const matchSearch = !s || r.code.toLowerCase().includes(s) || r.name.toLowerCase().includes(s);
    const matchStatus = statusFilter === "All Statuses" || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <DataTable
      noRecordsText="No programmes found"
      highlightOnHover
      className="whitespace-nowrap"
      records={records}
      fetching={loading}
      customLoader={<div className="flex items-center justify-center py-12"><IconLoader className="h-6 w-6 animate-spin text-color2" /></div>}
      columns={[
        { accessor: "code",       title: "CODE",       render: ({ code }) => <span className="font-medium text-color2">{code}</span> },
        { accessor: "name",       title: "PROGRAMME NAME", render: ({ name }) => <span className="text-[#000] dark:text-gray-200">{name}</span> },
        { accessor: "department", title: "DEPARTMENT", render: ({ department }) => <span className="text-[#000] dark:text-[#000]">{department}</span> },
        { accessor: "duration",   title: "DURATION",   render: ({ duration }) => <span className="text-[#000] dark:text-[#000]">{duration}</span> },
        { accessor: "type",       title: "TYPE",       render: ({ type }) => (
          <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">{type}</span>
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

export default ProgrammesTable;
