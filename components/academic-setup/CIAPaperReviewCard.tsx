import React from "react";
import { Award } from "lucide-react";

export interface QuestionPreviewItem {
  id: string;
  qNoNumber: number | string;
  text: string;
  marks: number | string;
  co: string;
  kLevel: string;
  topic: string;
}

export interface SectionPreviewItem {
  id: string;
  sectionTitle: string;
  totalMarksText: string;
  questions: QuestionPreviewItem[];
}

export interface ExamHeaderInfo {
  collegeName?: string;
  naacText?: string;
  departmentName?: string;
  examTitle?: string;
  courseCodeTitle?: string;
  academicYear?: string;
  duration?: string;
  maxMarks?: string;
  programmeBranch?: string;
  semester?: string;
  totalQuestions?: number | string;
  status?: string;
  instructions?: string;
  regulation?: string;
  bloomsLevelsText?: string;
}

export interface CIAPaperReviewCardProps {
  title?: string;
  subtitle?: string;
  onFinalInspection?: () => void;
  headerInfo?: ExamHeaderInfo;
  sections?: SectionPreviewItem[];
  hideHeader?: boolean;
}

const DEFAULT_HEADER_INFO: ExamHeaderInfo = {
  collegeName: "KARPAGAM COLLEGE OF ENGINEERING",
  naacText: "Accredited by NAAC with 'A+' Grade • NBA Accredited • Myleripalayam, Coimbatore - 641 032",
  departmentName: "DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING",
  examTitle: "CONTINUOUS INTERNAL ASSESSMENT (CIA) EXAMINATION — CIA-1 QUESTION PAPER",
  courseCodeTitle: "CS309 - Computer Networks",
  academicYear: "2026 - 2027 (Odd Semester)",
  duration: "3 Hours",
  maxMarks: "100 Marks",
  programmeBranch: "B.E. — CSE",
  semester: "V Semester / III Year",
  totalQuestions: 8,
  status: "Draft",
  instructions: "Answer ALL questions according to the marks specified for each section.",
  regulation: "Regulation: Autonomous",
  bloomsLevelsText: "K1: Remember K2: Understand K3: Apply K4: Analyze K5: Evaluate K6: Create",
};

const DEFAULT_SECTIONS: SectionPreviewItem[] = [
  {
    id: "sec-a",
    sectionTitle: "SECTION A — SHORT ANSWER QUESTIONS",
    totalMarksText: "[20 MARKS]",
    questions: [
      {
        id: "q1",
        qNoNumber: 1,
        text: "State the difference between protocol independence and layered abstraction in network architecture.",
        marks: "5 Marks",
        co: "CO1",
        kLevel: "K1",
        topic: "Network Models & Layered Architecture",
      },
      {
        id: "q2",
        qNoNumber: 2,
        text: "Explain the difference between bit stuffing and byte stuffing with a simple frame delimiter example.",
        marks: "5 Marks",
        co: "CO2",
        kLevel: "K2",
        topic: "Data Link Layer & Framing",
      },
      {
        id: "q3",
        qNoNumber: 3,
        text: "Define the purpose of Time-to-Live (TTL) field in an IPv4 packet header.",
        marks: "5 Marks",
        co: "CO3",
        kLevel: "K1",
        topic: "Network Layer & Routing Protocols",
      },
      {
        id: "q4",
        qNoNumber: 4,
        text: "Distinguish between port numbers and socket addresses in the transport layer.",
        marks: "5 Marks",
        co: "CO4",
        kLevel: "K2",
        topic: "Transport Layer Protocols",
      },
    ],
  },
  {
    id: "sec-b",
    sectionTitle: "SECTION B — DESCRIPTIVE QUESTIONS",
    totalMarksText: "[65 MARKS]",
    questions: [
      {
        id: "q5",
        qNoNumber: 5,
        text: "Explain the role of the Network Layer and contrast virtual circuit packet switching with datagram networks.",
        marks: "15 Marks",
        co: "CO2",
        kLevel: "K2",
        topic: "Network Layer & Routing Protocols",
      },
      {
        id: "q6",
        qNoNumber: 6,
        text: "Analyze the working principle of the TCP three-way handshake and describe how connection teardown is achieved using FIN packets.",
        marks: "15 Marks",
        co: "CO4",
        kLevel: "K3",
        topic: "TCP Connection Lifecycle & Three-Way Handshake",
      },
      {
        id: "q7",
        qNoNumber: 7,
        text: "Given the generator polynomial G(x) = x^4 + x + 1 and data bits 1101011011, calculate the transmitted frame using Cyclic Redundancy Check.",
        marks: "10 Marks",
        co: "CO2",
        kLevel: "K3",
        topic: "Error Detection (CRC, Checksum, Parity)",
      },
    ],
  },
  {
    id: "sec-c",
    sectionTitle: "SECTION C — APPLICATION QUESTIONS",
    totalMarksText: "[15 MARKS]",
    questions: [
      {
        id: "q8",
        qNoNumber: 8,
        text: "Design a variable length subnet masking (VLSM) scheme for an organization allocated 192.168.1.0/24 with three departments having 60, 28, and 12 hosts respectively. List network IDs, broadcast IDs, and usable IP ranges.",
        marks: "15 Marks",
        co: "CO3",
        kLevel: "K3",
        topic: "IPv4 Addressing, Subnetting & CIDR",
      },
    ],
  },
];

export const CIAPaperReviewCard: React.FC<CIAPaperReviewCardProps> = ({
  title = "3. Review & Finalize",
  subtitle = "Academic printable preview of the question paper",
  onFinalInspection,
  headerInfo = DEFAULT_HEADER_INFO,
  sections = DEFAULT_SECTIONS,
  hideHeader = false,
}) => {
  const info = { ...DEFAULT_HEADER_INFO, ...headerInfo };

  const paperSheet = (
    <div className="rounded-2xl bg-[#F6F8FA] p-4 md:p-8 flex justify-center dark:bg-gray-950">
      {/* Printable Paper Card */}
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-lg border border-gray-200/80 p-6 md:p-10 space-y-6 text-[#000] dark:bg-gray-900 dark:text-gray-100 dark:border-gray-800">

          {/* Header Section: Logo & Titles */}
          <div className="text-center space-y-2 border-b border-gray-200 pb-5 dark:border-gray-800">
            {/* Logos Row */}
            <div className="flex items-center justify-center gap-4 flex-wrap">
              {/* Karpagam Logo Placeholder */}
              <div className="flex items-center gap-2">
                <div className="grid grid-cols-2 gap-1 w-6 h-6">
                  <span className="bg-amber-500 rounded-xs" />
                  <span className="bg-emerald-500 rounded-xs" />
                  <span className="bg-indigo-600 rounded-xs" />
                  <span className="bg-purple-600 rounded-xs" />
                </div>
                <div className="text-left leading-tight">
                  <h1 className="text-lg md:text-xl font-extrabold tracking-tight text-[#000] dark:text-white">
                    {info.collegeName}
                  </h1>
                </div>
              </div>

              {/* Badges */}
              <div className="flex items-center gap-1.5">
                <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white uppercase">
                  NAAC A+
                </span>
                <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white uppercase">
                  NBA
                </span>
              </div>
            </div>

            {/* Subtitle accreditation info */}
            <p className="text-sm  text-pri dark:text-gray-400">
              (An Autonomous Institution, Approved by AICTE, Affiliated to Anna University, Chennai)
            </p>
            <p className="text-sm text-pri dark:text-gray-400">
              {info.naacText}
            </p>

            {/* Department & Exam Title */}
            <div className="pt-2 space-y-0.5">
              <h2 className="text-sm md:text-base font-extrabold tracking-wide uppercase text-[#000] dark:text-white">
                {info.departmentName}
              </h2>
              <h3 className="text-xs md:text-sm font-bold tracking-wide uppercase text-[#000] dark:text-gray-200">
                {info.examTitle}
              </h3>
            </div>
          </div>

          {/* Exam Details Grid Table */}
          <div className="rounded-xl border border-gray-200 overflow-hidden text-xs md:text-sm dark:border-gray-800">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 divide-y sm:divide-y-0 md:divide-x divide-gray-200 dark:divide-gray-800 border-b border-gray-200 dark:border-gray-800">
              <div className="p-3 bg-white dark:bg-gray-900">
                <span className="text-sm text-pri dark:text-gray-400 block font-semibold">Course:</span>
                <strong className="font-bold text-[#000] dark:text-white">{info.courseCodeTitle}</strong>
              </div>

              <div className="p-3 bg-white dark:bg-gray-900">
                <span className="text-sm text-pri dark:text-gray-400 block font-semibold">Academic Year:</span>
                <strong className="font-bold text-[#000] dark:text-white">{info.academicYear}</strong>
              </div>

              <div className="p-3 bg-white dark:bg-gray-900">
                <span className="text-sm text-pri dark:text-gray-400 block font-semibold">Duration / Time:</span>
                <strong className="font-bold text-[#000] dark:text-white">{info.duration}</strong>
              </div>

              <div className="p-3 bg-white dark:bg-gray-900">
                <span className="text-sm text-pri dark:text-gray-400 block font-semibold">Maximum Marks:</span>
                <strong className="font-bold text-color2 dark:text-purple-400">{info.maxMarks}</strong>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 divide-y sm:divide-y-0 md:divide-x divide-gray-200 dark:divide-gray-800">
              <div className="p-3 bg-white dark:bg-gray-900">
                <span className="text-sm text-pri dark:text-gray-400 block font-semibold">Programme / Branch:</span>
                <strong className="font-bold text-[#000] dark:text-white">{info.programmeBranch}</strong>
              </div>

              <div className="p-3 bg-white dark:bg-gray-900">
                <span className="text-sm text-pri dark:text-gray-400 block font-semibold">Semester:</span>
                <strong className="font-bold text-[#000] dark:text-white">{info.semester}</strong>
              </div>

              <div className="p-3 bg-white dark:bg-gray-900">
                <span className="text-sm text-pri dark:text-gray-400 block font-semibold">Total Questions:</span>
                <strong className="font-bold text-[#000] dark:text-white">{info.totalQuestions}</strong>
              </div>

              <div className="p-3 bg-white dark:bg-gray-900">
                <span className="text-sm text-pri dark:text-gray-400 block font-semibold">Status:</span>
                <strong className="font-bold text-amber-600 dark:text-amber-400">{info.status}</strong>
              </div>
            </div>
          </div>

          {/* Instructions Box */}
          <div className="rounded-xl border border-gray-200 bg-[#F9FAFB] p-4 text-xs space-y-2.5 dark:border-gray-800 dark:bg-gray-800/50">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <p className="text-[#000] dark:text-gray-300">
                <strong className="font-bold text-color1 text-sm dark:text-white">Instructions:</strong>
                <span className="ml-2 text-sm">{info.instructions}</span>
              </p>

              <span className="rounded-md border border-purple-200 bg-purple-50 px-2.5 py-1 text-sm font-bold text-purple-700 dark:border-purple-800 dark:bg-purple-950/60 dark:text-purple-300">
                {info.regulation}
              </span>
            </div>

            <div className="border-t border-gray-200/80 pt-2.5 dark:border-gray-700/80">
              <p className="text-pri dark:text-gray-400">
                <strong className="font-bold text-color1 text-sm dark:text-white">Bloom's Levels:</strong>

                <span className="ml-2 text-sm">{info.bloomsLevelsText}</span>
              </p>
            </div>
          </div>

          {/* Sections & Questions Preview */}
          <div className="space-y-6 pt-2">
            {sections.map((sec) => (
              <div key={sec.id} className="space-y-4">
                {/* Section Header Line */}
                <div className="flex items-center justify-between border-b border-gray-200 pb-2 dark:border-gray-800">
                  <h4 className="font-extrabold text-sm md:text-base text-[#000] dark:text-white uppercase tracking-wide">
                    {sec.sectionTitle}
                  </h4>
                  <span className="font-extrabold text-sm md:text-base text-color2 dark:text-purple-400">
                    {sec.totalMarksText}
                  </span>
                </div>

                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {sec.questions.map((q) => (
                    <div key={q.id} className="py-2 space-y-0.5">
                      <div className="flex items-start justify-between gap-4">
                        <p className="text-sm font-semibold text-[#000] dark:text-white leading-snug">
                          <strong className="font-bold">{q.qNoNumber}.</strong>
                          <span className="text-sm font-bold"> {q.text}</span>
                        </p>

                        <div className="text-right shrink-0">
                          <span className="font-bold text-xs md:text-sm text-[#000] dark:text-white block">
                            [{q.marks}]
                          </span>
                          <span className="text-[11px] font-bold text-pri dark:text-gray-400">
                            {q.co} • {q.kLevel}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs md:text-sm font-semibold text-pri dark:text-gray-400 leading-tight">
                        Topic: <span className="font-bold text-pri dark:text-gray-200">{q.topic}</span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );

  if (hideHeader) {
    return paperSheet;
  }

  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-5 md:p-6 shadow-xs dark:border-gray-800 dark:bg-gray-900 space-y-6">
      {/* Outer Panel Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-[#000] dark:text-white">
            {title}
          </h2>
          <p className="mt-0.5 text-xs md:text-sm font-semibold text-pri dark:text-gray-400">
            {subtitle}
          </p>
        </div>

        <button
          type="button"
          onClick={onFinalInspection || (() => console.log("Final Inspection"))}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs md:text-sm font-bold text-[#000] shadow-2xs hover:bg-gray-50 active:scale-[0.99] transition-all dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
        >
          <span>Final Inspection</span>
        </button>
      </div>

      {paperSheet}
    </div>
  );
};

export default CIAPaperReviewCard;
