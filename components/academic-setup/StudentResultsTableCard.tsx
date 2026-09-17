import React, { useState } from "react";
import { Users, Search, CheckCircle2, BookOpen } from "lucide-react";
import TableComponent from "@/components/common-components/TableComponent";

export interface StudentResultRecord {
  seq: number;
  regNo: string;
  name: string;
  score: string;
  percentage: string;
}

export interface StudentResultsTableCardProps {
  title?: string;
  subtitle?: string;
  mode?: "mcq" | "cia";
  records?: StudentResultRecord[];
}

const DEFAULT_MCQ_RECORDS: StudentResultRecord[] = [
  { seq: 1, regNo: "24CS1001", name: "Aarav Swaminathan", score: "9/10", percentage: "(90%)" },
  { seq: 2, regNo: "24CS1002", name: "Abinaya Sundaram", score: "8/10", percentage: "(80%)" },
  { seq: 3, regNo: "24CS1003", name: "Aditya Narayanan", score: "10/10", percentage: "(100%)" },
  { seq: 4, regNo: "24CS1004", name: "Ananya Ramesh", score: "9/10", percentage: "(90%)" },
  { seq: 5, regNo: "24CS1005", name: "Bala Chandran", score: "7/10", percentage: "(70%)" },
  { seq: 6, regNo: "24CS1006", name: "Deepa Muthukumar", score: "9/10", percentage: "(90%)" },
  { seq: 7, regNo: "24CS1007", name: "Dharun Karthik", score: "8/10", percentage: "(80%)" },
  { seq: 8, regNo: "24CS1008", name: "Divya Bharathi", score: "10/10", percentage: "(100%)" },
  { seq: 9, regNo: "24CS1009", name: "Gokul Prasanth", score: "8/10", percentage: "(80%)" },
  { seq: 10, regNo: "24CS1010", name: "Harini Venkatesh", score: "9/10", percentage: "(90%)" },
];

const DEFAULT_CIA_RECORDS: StudentResultRecord[] = [
  { seq: 1, regNo: "24CS1001", name: "Aarav Swaminathan", score: "43/50", percentage: "(86%)" },
  { seq: 2, regNo: "24CS1002", name: "Abinaya Sundaram", score: "40/50", percentage: "(80%)" },
  { seq: 3, regNo: "24CS1003", name: "Aditya Narayanan", score: "49/50", percentage: "(98%)" },
  { seq: 4, regNo: "24CS1004", name: "Ananya Ramesh", score: "44/50", percentage: "(88%)" },
  { seq: 5, regNo: "24CS1005", name: "Bala Chandran", score: "36/50", percentage: "(72%)" },
  { seq: 6, regNo: "24CS1006", name: "Deepa Muthukumar", score: "42/50", percentage: "(84%)" },
  { seq: 7, regNo: "24CS1007", name: "Dharun Karthik", score: "38/50", percentage: "(76%)" },
  { seq: 8, regNo: "24CS1008", name: "Divya Bharathi", score: "48/50", percentage: "(96%)" },
  { seq: 9, regNo: "24CS1009", name: "Gokul Prasanth", score: "39/50", percentage: "(78%)" },
  { seq: 10, regNo: "24CS1010", name: "Harini Venkatesh", score: "45/50", percentage: "(90%)" },
];

export const StudentResultsTableCard: React.FC<StudentResultsTableCardProps> = ({
  title = "Student Results",
  subtitle,
  mode = "mcq",
  records,
}) => {
  const [search, setSearch] = useState("");

  const rawRecords =
    records || (mode === "cia" ? DEFAULT_CIA_RECORDS : DEFAULT_MCQ_RECORDS);

  const displaySubtitle =
    subtitle ||
    (mode === "cia"
      ? "Verified Continuous Internal Assessment marks for CS309 — Computer Networks (40 Enrolled Students)"
      : "Individual test submissions for CS309 — Computer Networks (40 Enrolled Students)");

  const filteredRecords = rawRecords.filter((row) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      row.regNo.toLowerCase().includes(q) || row.name.toLowerCase().includes(q)
    );
  });

  const columns = [
    {
      accessor: "seq",
      title: "#",
      render: ({ seq }: StudentResultRecord) => (
        <span className="text-xs font-semibold text-pri">{seq}</span>
      ),
    },
    {
      accessor: "regNo",
      title: "REGISTER NUMBER",
      render: ({ regNo }: StudentResultRecord) => (
        <span className="text-xs font-bold text-[#000] dark:text-white">
          {regNo}
        </span>
      ),
    },
    {
      accessor: "name",
      title: "STUDENT NAME",
      render: ({ name }: StudentResultRecord) => (
        <span className="text-xs font-semibold text-[#000] dark:text-gray-200">
          {name}
        </span>
      ),
    },
    {
      accessor: "score",
      title: "SCORE",
      textAlignment: "right",
      render: ({ score, percentage }: StudentResultRecord) => (
        <div className="text-right">
          <span className="text-xs font-bold text-[#000] dark:text-white">
            {score}
          </span>
          <span className="ml-1 text-xs font-medium text-pri">
            {percentage}
          </span>
        </div>
      ),
    },
  ];

  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-5 md:p-6 shadow-xs dark:border-gray-800 dark:bg-gray-900 space-y-4">
      {/* Table Header: Title & Description on left, Search on right */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <Users className="h-5 w-5 text-color2" />
            <h3 className="text-base md:text-lg font-bold text-[#000] dark:text-white">
              {title}
            </h3>

            {/* Show Green Chip ONLY when mode is CIA */}
            {mode === "cia" && (
              <span className="inline-flex border border-[#10B981] items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-0.5 text-xs font-bold text-emerald-600 border border-emerald-100/60 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/60">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#047857] font-bold  dark:text-emerald-400" />
                <span className="text-[#047857] font-bold">Verified Marks from Evaluated Answer Sheets</span>
              </span>
            )}
          </div>

          <p className="mt-1 text-sm font-medium text-pri dark:text-gray-400">
            {displaySubtitle}
          </p>
        </div>

        {/* Search Box on right */}
        <div className="relative self-start sm:self-auto">
          <Search className="absolute left-3.5 top-3 h-4.5 w-4.5 text-[#000] pointer-events-none" />
          <input
            type="text"
            placeholder="Search register no. or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-80 md:w-96 rounded-xl border border-gray-200 bg-white pl-10 pr-4 py-2.5 text-sm font-semibold text-[#000] shadow-2xs focus:border-color2 focus:bg-white focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </div>
      </div>

      {/* Table Component */}
      <div className="panel p-0 overflow-hidden border-0 shadow-none">
        <TableComponent
          records={filteredRecords}
          columns={columns}
          noRecordsText="No student results found"
        />
      </div>
    </div>
  );
};

export default StudentResultsTableCard;
