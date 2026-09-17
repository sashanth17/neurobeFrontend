import { DataTable } from "mantine-datatable";
import IconEdit from "@/components/Icon/IconEdit";
import IconTrash from "@/components/Icon/IconTrash";
import IconLoader from "@/components/Icon/IconLoader";

export const MOCK_BATCHES = [
  { id: 1, code: "B2021", name: "Batch 2021-25", programme: "BTECH-CSE", startYear: 2021, endYear: 2025, students: 120, status: "Active" },
  { id: 2, code: "B2022", name: "Batch 2022-26", programme: "BTECH-CSE", startYear: 2022, endYear: 2026, students: 115, status: "Active" },
  { id: 3, code: "B2023", name: "Batch 2023-27", programme: "BTECH-ECE", startYear: 2023, endYear: 2027, students: 90,  status: "Active" },
  { id: 4, code: "B2020", name: "Batch 2020-24", programme: "BTECH-ME",  startYear: 2020, endYear: 2024, students: 80,  status: "Inactive" },
  { id: 5, code: "B2022M", name: "Batch 2022-24", programme: "MTECH-AI", startYear: 2022, endYear: 2024, students: 40,  status: "Active" },
  { id: 6, code: "B2023M", name: "Batch 2023-25", programme: "MTECH-AI", startYear: 2023, endYear: 2025, students: 38,  status: "Active" },
];

interface Props { search: string; statusFilter: string; loading?: boolean; }

const BatchesTable = ({ search, statusFilter, loading }: Props) => {
  const records = MOCK_BATCHES.filter((r) => {
    const s = search.toLowerCase();
    const matchSearch = !s || r.code.toLowerCase().includes(s) || r.name.toLowerCase().includes(s);
    const matchStatus = statusFilter === "All Statuses" || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <DataTable
      noRecordsText="No batches found"
      highlightOnHover
      className="whitespace-nowrap"
      records={records}
      fetching={loading}
      customLoader={<div className="flex items-center justify-center py-12"><IconLoader className="h-6 w-6 animate-spin text-color2" /></div>}
      columns={[
        { accessor: "code",      title: "BATCH CODE", render: ({ code }) => <span className="font-medium text-color2">{code}</span> },
        { accessor: "name",      title: "BATCH NAME",  render: ({ name }) => <span className="text-[#000] dark:text-gray-200">{name}</span> },
        { accessor: "programme", title: "PROGRAMME",   render: ({ programme }) => <span className="text-[#000] dark:text-[#000]">{programme}</span> },
        { accessor: "startYear", title: "START YEAR",  render: ({ startYear }) => <span className="text-[#000] dark:text-[#000]">{startYear}</span> },
        { accessor: "endYear",   title: "END YEAR",    render: ({ endYear }) => <span className="text-[#000] dark:text-[#000]">{endYear}</span> },
        { accessor: "students",  title: "STUDENTS",    render: ({ students }) => (
          <span className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-[#ede9fe] px-2 text-xs font-bold text-color2">{students}</span>
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

export default BatchesTable;
