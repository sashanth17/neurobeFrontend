import React, { useState, useEffect } from "react";
import { Users, Search, CheckCircle2 } from "lucide-react";
import TableComponent from "@/components/common-components/TableComponent";
import { MarkExtractionService } from "@/services/markExtraction.service";

export interface StudentResultRecord {
  seq: number;
  regNo: string;
  name: string;
  score: string;
  percentage: string;
  coMarks?: {
    CO1?: { obtained: number; max_mark: number; percentage: number };
    CO2?: { obtained: number; max_mark: number; percentage: number };
    CO3?: { obtained: number; max_mark: number; percentage: number };
    [key: string]: { obtained: number; max_mark: number; percentage: number } | undefined;
  };
}

export interface StudentResultsTableCardProps {
  title?: string;
  subtitle?: string;
  mode?: "mcq" | "cia";
  ciaTestId?: number;
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
  {
    seq: 1,
    regNo: "721225C5DB04",
    name: "Arun Kumar M",
    score: "78/100",
    percentage: "(78%)",
    coMarks: {
      CO1: { obtained: 34, max_mark: 42, percentage: 81.0 },
      CO2: { obtained: 32, max_mark: 42, percentage: 76.2 },
      CO3: { obtained: 12, max_mark: 16, percentage: 75.0 },
    },
  },
  {
    seq: 2,
    regNo: "721225C5DB05",
    name: "Bhavana S",
    score: "85/100",
    percentage: "(85%)",
    coMarks: {
      CO1: { obtained: 37, max_mark: 42, percentage: 88.1 },
      CO2: { obtained: 35, max_mark: 42, percentage: 83.3 },
      CO3: { obtained: 13, max_mark: 16, percentage: 81.3 },
    },
  },
  {
    seq: 3,
    regNo: "721225C5DB06",
    name: "Chandru K",
    score: "92/100",
    percentage: "(92%)",
    coMarks: {
      CO1: { obtained: 39, max_mark: 42, percentage: 92.9 },
      CO2: { obtained: 38, max_mark: 42, percentage: 90.5 },
      CO3: { obtained: 15, max_mark: 16, percentage: 93.8 },
    },
  },
  {
    seq: 4,
    regNo: "721225C5DB07",
    name: "Divya Bharathi R",
    score: "74/100",
    percentage: "(74%)",
    coMarks: {
      CO1: { obtained: 31, max_mark: 42, percentage: 73.8 },
      CO2: { obtained: 31, max_mark: 42, percentage: 73.8 },
      CO3: { obtained: 12, max_mark: 16, percentage: 75.0 },
    },
  },
  {
    seq: 5,
    regNo: "721225C5DB08",
    name: "Ezhil Vendhan P",
    score: "68/100",
    percentage: "(68%)",
    coMarks: {
      CO1: { obtained: 28, max_mark: 42, percentage: 66.7 },
      CO2: { obtained: 29, max_mark: 42, percentage: 69.0 },
      CO3: { obtained: 11, max_mark: 16, percentage: 68.8 },
    },
  },
  {
    seq: 6,
    regNo: "721225C5DB09",
    name: "Gowtham Raj S",
    score: "88/100",
    percentage: "(88%)",
    coMarks: {
      CO1: { obtained: 38, max_mark: 42, percentage: 90.5 },
      CO2: { obtained: 36, max_mark: 42, percentage: 85.7 },
      CO3: { obtained: 14, max_mark: 16, percentage: 87.5 },
    },
  },
  {
    seq: 7,
    regNo: "721225C5DB10",
    name: "Harini Priya V",
    score: "80/100",
    percentage: "(80%)",
    coMarks: {
      CO1: { obtained: 34, max_mark: 42, percentage: 81.0 },
      CO2: { obtained: 33, max_mark: 42, percentage: 78.6 },
      CO3: { obtained: 13, max_mark: 16, percentage: 81.3 },
    },
  },
  {
    seq: 8,
    regNo: "721225C5DB11",
    name: "Janani Shree M",
    score: "95/100",
    percentage: "(95%)",
    coMarks: {
      CO1: { obtained: 41, max_mark: 42, percentage: 97.6 },
      CO2: { obtained: 40, max_mark: 42, percentage: 95.2 },
      CO3: { obtained: 14, max_mark: 16, percentage: 87.5 },
    },
  },
  {
    seq: 9,
    regNo: "721225C5DB12",
    name: "Karthik Raja T",
    score: "72/100",
    percentage: "(72%)",
    coMarks: {
      CO1: { obtained: 30, max_mark: 42, percentage: 71.4 },
      CO2: { obtained: 30, max_mark: 42, percentage: 71.4 },
      CO3: { obtained: 12, max_mark: 16, percentage: 75.0 },
    },
  },
  {
    seq: 10,
    regNo: "721225C5DB13",
    name: "Lavanya Devi R",
    score: "89/100",
    percentage: "(89%)",
    coMarks: {
      CO1: { obtained: 38, max_mark: 42, percentage: 90.5 },
      CO2: { obtained: 37, max_mark: 42, percentage: 88.1 },
      CO3: { obtained: 14, max_mark: 16, percentage: 87.5 },
    },
  },
];

export const StudentResultsTableCard: React.FC<StudentResultsTableCardProps> = ({
  title = "Student Results",
  subtitle,
  mode = "mcq",
  ciaTestId,
  records,
}) => {
  const [search, setSearch] = useState("");
  const [liveCiaRecords, setLiveCiaRecords] = useState<StudentResultRecord[] | null>(null);

  useEffect(() => {
    if (mode === "cia" && !records) {
      let isMounted = true;
      const testId = ciaTestId || 1;
      MarkExtractionService.getVerifiedMarks(testId)
        .then((resp) => {
          if (!isMounted || !resp?.verified_students || resp.verified_students.length === 0) return;
          const mapped: StudentResultRecord[] = resp.verified_students.map((st, idx) => {
            const total = st.total_mark ?? 0;
            const max = st.max_mark || 100;
            const pct = (st as any).percentage ?? (max > 0 ? Math.round((total / max) * 1000) / 10 : 0);
            return {
              seq: idx + 1,
              regNo: st.register_number,
              name: st.student_name || st.register_number,
              score: `${total}/${max}`,
              percentage: `(${pct}%)`,
              coMarks: st.co_marks,
            };
          });
          setLiveCiaRecords(mapped);
        })
        .catch((err) => {
          console.warn("Could not fetch live verified marks for CIA, using template defaults", err);
        });
      return () => {
        isMounted = false;
      };
    }
  }, [mode, records, ciaTestId]);

  const rawRecords =
    records || (mode === "cia" ? (liveCiaRecords || DEFAULT_CIA_RECORDS) : DEFAULT_MCQ_RECORDS);

  const displaySubtitle =
    subtitle ||
    (mode === "cia"
      ? "Verified Continuous Internal Assessment marks for CS309 — Computer Networks (Course Outcome & Blueprint Aligned)"
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
        <span className="text-xs font-bold text-[#000] dark:text-white font-mono">
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
    ...(mode === "cia"
      ? [
          {
            accessor: "co1",
            title: "CO1 (MAX 42)",
            textAlignment: "center" as const,
            render: (rec: StudentResultRecord) => {
              const co = rec.coMarks?.CO1;
              if (!co) return <span className="text-xs text-gray-400 font-mono">—</span>;
              return (
                <div className="flex items-center justify-center gap-1.5 font-mono">
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                    {co.obtained}
                  </span>
                  <span className="text-[10px] text-gray-400">/{co.max_mark || 42}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                    {co.percentage}%
                  </span>
                </div>
              );
            },
          },
          {
            accessor: "co2",
            title: "CO2 (MAX 42)",
            textAlignment: "center" as const,
            render: (rec: StudentResultRecord) => {
              const co = rec.coMarks?.CO2;
              if (!co) return <span className="text-xs text-gray-400 font-mono">—</span>;
              return (
                <div className="flex items-center justify-center gap-1.5 font-mono">
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                    {co.obtained}
                  </span>
                  <span className="text-[10px] text-gray-400">/{co.max_mark || 42}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                    {co.percentage}%
                  </span>
                </div>
              );
            },
          },
          {
            accessor: "co3",
            title: "CO3 (MAX 16)",
            textAlignment: "center" as const,
            render: (rec: StudentResultRecord) => {
              const co = rec.coMarks?.CO3;
              if (!co) return <span className="text-xs text-gray-400 font-mono">—</span>;
              return (
                <div className="flex items-center justify-center gap-1.5 font-mono">
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                    {co.obtained}
                  </span>
                  <span className="text-[10px] text-gray-400">/{co.max_mark || 16}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                    {co.percentage}%
                  </span>
                </div>
              );
            },
          },
        ]
      : []),
    {
      accessor: "score",
      title: mode === "cia" ? "TOTAL SCORE (100)" : "SCORE",
      textAlignment: "right" as const,
      render: ({ score, percentage }: StudentResultRecord) => (
        <div className="text-right font-mono">
          <span className="text-xs font-black text-[#000] dark:text-white">
            {score}
          </span>
          <span className="ml-1 text-xs font-bold text-pri">
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
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-0.5 text-xs font-bold text-emerald-600 border border-[#10B981] dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/60">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#047857] font-bold dark:text-emerald-400" />
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
