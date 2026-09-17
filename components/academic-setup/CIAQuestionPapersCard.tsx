import React, { useState } from "react";
import {
  FileText,
  FileCode,
  Download,
  Eye,
  CheckCircle2,
  Calendar,
  Clock,
  BookOpen,
} from "lucide-react";

export interface CIAPaperItem {
  id: string;
  name: string;
  statusText: string;
  approvedDate: string;
  unitsCovered: string;
  duration: string;
  totalMarks: number;
  approvedBy: string;
  sections?: {
    part: string;
    description: string;
    marks: string;
    questionsCount: number;
  }[];
  sampleQuestions?: {
    qNo: string;
    question: string;
    co: string;
    blooms: string;
    marks: number;
  }[];
}

export interface CIAQuestionPapersCardProps {
  title?: string;
  subtitle?: string;
  approvedCountText?: string;
  programme?: string;
  batch?: string;
  semester?: string | number;
  courseCode?: string;
  courseTitle?: string;
  ciaPapers?: CIAPaperItem[];
}

const DEFAULT_CIA_PAPERS: CIAPaperItem[] = [
  {
    id: "cia1",
    name: "CIA 1",
    statusText: "Approved 25 Aug 2026",
    approvedDate: "25 Aug 2026",
    unitsCovered: "Unit I & Unit II (Physical Layer & Data Link Layer)",
    duration: "90 Mins",
    totalMarks: 50,
    approvedBy: "Dr. Arun Kumar",
    sections: [
      {
        part: "Part A",
        description: "Short Answer Questions (5 x 2 = 10 Marks)",
        marks: "10 Marks",
        questionsCount: 5,
      },
      {
        part: "Part B",
        description: "Long Answer / Analytical Questions (4 x 10 = 40 Marks)",
        marks: "40 Marks",
        questionsCount: 4,
      },
    ],
    sampleQuestions: [
      {
        qNo: "Q1",
        question:
          "Differentiate between OSI reference model and TCP/IP protocol suite with suitable layer diagrams.",
        co: "CO1",
        blooms: "K2 (Understand)",
        marks: 2,
      },
      {
        qNo: "Q2",
        question:
          "Explain the working of Selective Repeat ARQ protocol. Calculate link efficiency for a 10 Mbps channel.",
        co: "CO2",
        blooms: "K3 (Apply)",
        marks: 10,
      },
      {
        qNo: "Q3",
        question:
          "Derive the maximum data rate for a noiseless 4 kHz channel carrying binary signals using Nyquist Theorem.",
        co: "CO1",
        blooms: "K3 (Apply)",
        marks: 10,
      },
    ],
  },
  {
    id: "cia2",
    name: "CIA 2",
    statusText: "Approved 10 Oct 2026",
    approvedDate: "10 Oct 2026",
    unitsCovered: "Unit III & Unit IV (Network Layer & Transport Layer)",
    duration: "90 Mins",
    totalMarks: 50,
    approvedBy: "Dr. Arun Kumar",
    sections: [
      {
        part: "Part A",
        description: "Short Answer Questions (5 x 2 = 10 Marks)",
        marks: "10 Marks",
        questionsCount: 5,
      },
      {
        part: "Part B",
        description: "Long Answer Questions (4 x 10 = 40 Marks)",
        marks: "40 Marks",
        questionsCount: 4,
      },
    ],
    sampleQuestions: [
      {
        qNo: "Q1",
        question:
          "Explain the working of Dijkstra's shortest path routing algorithm with a neat network graph.",
        co: "CO3",
        blooms: "K4 (Analyze)",
        marks: 10,
      },
      {
        qNo: "Q2",
        question:
          "Compare IPv4 and IPv6 packet header formats. Explain CIDR subnetting with an example.",
        co: "CO3",
        blooms: "K3 (Apply)",
        marks: 10,
      },
    ],
  },
  {
    id: "cia3",
    name: "CIA 3",
    statusText: "Approved 05 Dec 2026",
    approvedDate: "05 Dec 2026",
    unitsCovered: "Unit V (Application Layer & Network Security)",
    duration: "90 Mins",
    totalMarks: 50,
    approvedBy: "Dr. Arun Kumar",
    sections: [
      {
        part: "Part A",
        description: "Short Answer Questions (5 x 2 = 10 Marks)",
        marks: "10 Marks",
        questionsCount: 5,
      },
      {
        part: "Part B",
        description: "Long Answer Questions (4 x 10 = 40 Marks)",
        marks: "40 Marks",
        questionsCount: 4,
      },
    ],
    sampleQuestions: [
      {
        qNo: "Q1",
        question:
          "Describe DNS hierarchy, domain name resolution process, and resource record types.",
        co: "CO5",
        blooms: "K2 (Understand)",
        marks: 10,
      },
    ],
  },
];

const CIAQuestionPapersCard: React.FC<CIAQuestionPapersCardProps> = ({
  title = "CIA Question Papers",
  subtitle = "View approved CIA question papers for this course.",
  approvedCountText = "3 Approved Papers",
  programme = "B.Tech CSE",
  batch = "2025–2029",
  semester = "3",
  courseCode = "CS309",
  courseTitle = "Computer Networks",
  ciaPapers = DEFAULT_CIA_PAPERS,
}) => {
  const [selectedCiaId, setSelectedCiaId] = useState<string>(
    ciaPapers[0]?.id || "cia1"
  );

  const selectedPaper =
    ciaPapers.find((p) => p.id === selectedCiaId) || ciaPapers[0];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800 space-y-6">
      {/* Top Banner Info Bar */}
      <div className="flex flex-wrap items-center justify-between rounded-xl bg-[#F8FAFC] px-4 py-2.5 text-sm dark:bg-gray-700/60">
        <div className="flex flex-wrap items-center gap-4 text-pri dark:text-gray-400">
          <span>
            Programme:{" "}
            <strong className="font-bold text-[#000] dark:text-white">
              {programme}
            </strong>
          </span>
          <span>
            Batch:{" "}
            <strong className="font-bold text-[#000] dark:text-white">
              {batch}
            </strong>
          </span>
          <span>
            Semester:{" "}
            <strong className="font-bold text-[#000] dark:text-white">
              {semester}
            </strong>
          </span>
        </div>
        <span className="font-semibold text-color2 dark:text-purple-400">
          {courseCode} — {courseTitle}
        </span>
      </div>

      {/* Header Info Section (Title & Approved Papers Badge) */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-color2 dark:bg-purple-900/30 dark:text-purple-300">
            <FileCode className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-[#000] dark:text-white">
              {title}
            </h3>
            <p className="mt-0.5 text-sm text-pri dark:text-gray-400">
              {subtitle}
            </p>
          </div>
        </div>
        <span className="rounded-full bg-[#ECE3FC] px-4 py-1.5 text-xs font-bold text-[#5C28CA] dark:bg-purple-900/40 dark:text-purple-300">
          {approvedCountText}
        </span>
      </div>

      {/* Selector & Details Content */}
      <div className="space-y-5 pt-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#000] dark:text-gray-300">
          CIA QUESTION PAPERS
        </h4>

        {/* Tab Pills */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {ciaPapers.map((paper) => {
            const isSelected = selectedCiaId === paper.id;
            return (
              <div
                key={paper.id}
                onClick={() => setSelectedCiaId(paper.id)}
                className={`flex cursor-pointer items-center justify-between rounded-2xl px-4 py-2 transition-all duration-200 ${isSelected
                  ? "border border-[#5C28CA] bg-purple-50/50 shadow-sm dark:border-purple-500 dark:bg-purple-950/20"
                  : "border border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800"
                  }`}
              >
                <span
                  className={`text-base font-bold ${isSelected
                    ? "text-[#5C28CA] dark:text-purple-300"
                    : "text-[#000] dark:text-white"
                    }`}
                >
                  {paper.name}
                </span>
                <span
                  className={`text-sm ${isSelected
                    ? "font-semibold text-[#5C28CA] dark:text-purple-300"
                    : "font-medium text-pri dark:text-gray-400"
                    }`}
                >
                  {paper.statusText}
                </span>
              </div>
            );
          })}
        </div>


      </div>
    </div>
  );
};

export default CIAQuestionPapersCard;
