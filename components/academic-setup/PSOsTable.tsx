import { DataTable } from "mantine-datatable";
import IconEdit from "@/components/Icon/IconEdit";
import IconTrash from "@/components/Icon/IconTrash";
import IconLoader from "@/components/Icon/IconLoader";

export const MOCK_PSOS = [
  { id: 1, code: "PSO1", programme: "BTECH-CSE", description: "Apply knowledge of computing to solve real-world problems.",          status: "Active" },
  { id: 2, code: "PSO2", programme: "BTECH-CSE", description: "Design and develop software systems using modern engineering tools.", status: "Active" },
  { id: 3, code: "PSO3", programme: "BTECH-ECE", description: "Analyse and design electronic circuits and communication systems.",   status: "Active" },
  { id: 4, code: "PSO4", programme: "BTECH-ECE", description: "Apply signal processing techniques to real-time applications.",      status: "Active" },
  { id: 5, code: "PSO5", programme: "MTECH-AI",  description: "Develop intelligent systems using machine learning algorithms.",     status: "Active" },
  { id: 6, code: "PSO6", programme: "MTECH-AI",  description: "Evaluate AI models for performance, fairness and robustness.",      status: "Inactive" },
];

interface Props { search: string; statusFilter: string; loading?: boolean; }

const PSOsTable = ({ search, statusFilter, loading }: Props) => {
  const records = MOCK_PSOS.filter((r) => {
    const s = search.toLowerCase();
    const matchSearch = !s || r.code.toLowerCase().includes(s) || r.description.toLowerCase().includes(s) || r.programme.toLowerCase().includes(s);
    const matchStatus = statusFilter === "All Statuses" || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <DataTable
      noRecordsText="No PSOs found"
      highlightOnHover
      className="whitespace-nowrap"
      records={records}
      fetching={loading}
      customLoader={<div className="flex items-center justify-center py-12"><IconLoader className="h-6 w-6 animate-spin text-color2" /></div>}
      columns={[
        { accessor: "code",        title: "PSO CODE",   render: ({ code }) => <span className="font-medium text-color2">{code}</span> },
        { accessor: "programme",   title: "PROGRAMME",  render: ({ programme }) => <span className="text-[#000] dark:text-[#000]">{programme}</span> },
        { accessor: "description", title: "DESCRIPTION", render: ({ description }) => (
          <span className="max-w-md whitespace-normal text-[#000] dark:text-gray-200">{description}</span>
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

export default PSOsTable;
