import React, { useState } from "react";
import { Plus, ChevronDown, ChevronUp, Settings, Check, Trash2, Edit3, Sparkles } from "lucide-react";

export interface QuestionItem {
  id: string;
  qNo: string;
  text: string;
  co: string;
  kLevel: string;
  marks: number | string;
  topic: string;
}

export interface SectionItem {
  id: string;
  sectionLetter: string;
  title: string;
  totalMarks: number | string;
  questionsCount?: number;
  marksUsed?: number | string;
  remainingMarksText?: string;
  isComplete?: boolean;
  questions: QuestionItem[];
}

export interface CIASectionsQuestionsCardProps {
  title?: string;
  subtitle?: string;
  sections?: SectionItem[];
  onAddSection?: () => void;
  onAddQuestion?: (sectionId: string) => void;
  onGenerateQuestions?: (sectionId: string) => void;
  onDeleteQuestion?: (sectionId: string, questionId: string) => void;
  onDeleteSection?: (sectionId: string) => void;
  onSectionSettings?: (sectionId: string) => void;
}

const DEFAULT_SECTIONS: SectionItem[] = [
  {
    id: "sec-a",
    sectionLetter: "A",
    title: "Short Answer Questions",
    totalMarks: "20 Marks",
    questionsCount: 4,
    marksUsed: "20 / 20",
    isComplete: true,
    questions: [
      {
        id: "q1",
        qNo: "Q1",
        text: "State the difference between protocol independence and layered abstraction in network architecture.",
        co: "CO1",
        kLevel: "K1",
        marks: "5 Marks",
        topic: "Network Models & Layered Architecture",
      },
      {
        id: "q2",
        qNo: "Q2",
        text: "Explain the difference between bit stuffing and byte stuffing with a simple frame delimiter example.",
        co: "CO2",
        kLevel: "K2",
        marks: "5 Marks",
        topic: "Data Link Layer & Framing",
      },
      {
        id: "q3",
        qNo: "Q3",
        text: "Define the purpose of Time-to-Live (TTL) field in an IPv4 packet header.",
        co: "CO3",
        kLevel: "K1",
        marks: "5 Marks",
        topic: "Network Layer & Routing Protocols",
      },
      {
        id: "q4",
        qNo: "Q4",
        text: "Distinguish between port numbers and socket addresses in the transport layer.",
        co: "CO4",
        kLevel: "K2",
        marks: "5 Marks",
        topic: "Transport Layer Protocols",
      },
    ],
  },
  {
    id: "sec-b",
    sectionLetter: "B",
    title: "Descriptive Questions",
    totalMarks: "65 Marks",
    remainingMarksText: "25 Marks Remaining",
    isComplete: false,
    questions: [
      {
        id: "q5",
        qNo: "Q5",
        text: "Explain the role of the Network Layer and contrast virtual circuit packet switching with datagram networks.",
        co: "CO2",
        kLevel: "K2",
        marks: "15 Marks",
        topic: "Network Layer & Routing Protocols",
      },
      {
        id: "q6",
        qNo: "Q6",
        text: "Analyze the working principle of the TCP three-way handshake and describe how connection teardown is achieved using FIN packets.",
        co: "CO4",
        kLevel: "K3",
        marks: "15 Marks",
        topic: "TCP Connection Lifecycle & Three-Way Handshake",
      },
      {
        id: "q7",
        qNo: "Q7",
        text: "Given the generator polynomial G(x) = x^4 + x + 1 and data bits 1101011011, calculate the transmitted frame using Cyclic Redundancy Check.",
        co: "CO2",
        kLevel: "K3",
        marks: "10 Marks",
        topic: "Error Detection (CRC, Checksum, Parity)",
      },
    ],
  },
  {
    id: "sec-c",
    sectionLetter: "C",
    title: "Application Questions",
    totalMarks: "15 Marks",
    isComplete: true,
    questions: [
      {
        id: "q8",
        qNo: "Q8",
        text: "Design a variable length subnet masking (VLSM) scheme for an organization allocated 192.168.1.0/24 with three departments having 60, 28, and 12 hosts respectively. List network IDs, broadcast IDs, and usable IP ranges.",
        co: "CO3",
        kLevel: "K3",
        marks: "15 Marks",
        topic: "IPv4 Addressing, Subnetting & CIDR",
      },
    ],
  },
];

export const CIASectionsQuestionsCard: React.FC<CIASectionsQuestionsCardProps> = ({
  title = "2. Sections & Questions",
  subtitle = "Allocate marks per section and compose syllabus-aligned questions",
  sections = DEFAULT_SECTIONS,
  onAddSection,
  onAddQuestion,
  onGenerateQuestions,
  onDeleteQuestion,
  onDeleteSection,
  onSectionSettings,
}) => {
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (id: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-5 md:p-6 shadow-xs dark:border-gray-800 dark:bg-gray-900 space-y-6">
      {/* Top Header Row */}
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
          onClick={onAddSection}
          className="inline-flex items-center gap-1.5 rounded-xl border-1 border border-color2 bg-white px-4 py-1.5 text-xs md:text-sm font-bold text-color2 shadow-2xs hover:bg-purple-50 active:scale-[0.99] transition-all dark:bg-gray-800 dark:hover:bg-purple-950/40"
        >
          <Plus className="h-4 w-4 font-bold" />
          <span className="font-bold">Add Section</span>
        </button>
      </div>

      {/* Sections List */}
      <div className="space-y-6">
        {sections.map((sec) => {
          const isCollapsed = collapsedSections[sec.id];
          const qCount = sec.questionsCount ?? sec.questions.length;
          const marksUsed = sec.marksUsed ?? `${sec.questions.length * 5} / ${sec.totalMarks}`;

          return (
            <div
              key={sec.id}
              className="rounded-2xl border border-gray-200/70 bg-[#FAF9FF]/40 p-4 md:p-5 space-y-3 dark:border-gray-800 dark:bg-gray-800/30"
            >
              {/* Section Header Bar */}
              <div className={`flex flex-wrap items-center justify-between gap-4 ${!isCollapsed ? "-mx-4 md:-mx-5 px-4 md:px-5 border-b border-gray-200/80 pb-4 dark:border-gray-800" : ""}`}>
                {/* Left side: Chevron, Badge, Title, Marks Pill, Settings Button */}
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => toggleSection(sec.id)}
                    className="text-gray-400 hover:text-[#000] dark:hover:text-gray-200 transition-colors"
                  >
                    {isCollapsed ? (
                      <ChevronDown className="h-5 w-5" />
                    ) : (
                      <ChevronUp className="h-5 w-5" />
                    )}
                  </button>

                  <span className="h-7 w-7 rounded-full bg-color2 text-white font-bold text-xs md:text-sm flex items-center justify-center shrink-0">
                    {sec.sectionLetter}
                  </span>

                  <h3 className="text-base md:text-lg font-bold text-[#000] dark:text-white">
                    {sec.title}
                  </h3>

                  <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                    {sec.totalMarks}
                  </span>

                  <button
                    type="button"
                    onClick={() => onSectionSettings?.(sec.id)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-[#000] shadow-2xs hover:bg-gray-50 transition-all dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                  >
                    <Settings className="font-bold h-3.5 w-3.5 text-pri dark:text-gray-400" />
                    <span className="font-bold">Section Settings</span>
                  </button>
                </div>

                {/* Right side: Questions Count, Marks Used, Complete Badge, Delete Section */}
                <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm">
                  {sec.questionsCount !== undefined || sec.marksUsed !== undefined ? (
                    <>
                      <span className="font-semibold text-pri dark:text-gray-400">
                        Questions:{" "}
                        <strong className="font-bold text-[#000] dark:text-white">
                          {qCount}
                        </strong>
                      </span>

                      <span className="text-gray-300 dark:text-[#000]">|</span>

                      <span className="font-semibold text-pri dark:text-gray-400">
                        Marks Used:{" "}
                        <strong className="font-bold text-[#000] dark:text-white">
                          {marksUsed}
                        </strong>
                      </span>
                    </>
                  ) : null}

                  {sec.isComplete ? (
                    <span className="flex text-green-dark btn-green-l rounded-full px-2 py-0.5 text-xs font-semibold">
                      <Check className="h-3.5 w-3.5" />
                      <span>Complete</span>
                    </span>
                  ) : sec.remainingMarksText ? (
                    <span className="text-amber-600 dark:text-amber-400 font-bold text-xs md:text-sm">
                      {sec.remainingMarksText}
                    </span>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => onDeleteSection?.(sec.id)}
                    className="text-color1 hover:text-red-500 transition-colors p-1"
                    title="Delete Section"
                  >
                    <Trash2 className="h-4 w-4 " />
                  </button>
                </div>
              </div>

              {/* Collapsible Questions Body */}
              {!isCollapsed && (
                <div className="space-y-4 pt-1">
                  {/* Questions List */}
                  <div className="space-y-3.5 ">
                    {sec.questions.map((q) => (
                      <div
                        key={q.id}
                        className="rounded-2xl border border-gray-100 bg-white p-4 md:p-5 shadow-xs hover:border-gray-200 transition-all dark:border-gray-800 dark:bg-gray-900 flex items-start justify-between gap-4"
                      >
                        {/* Question Content */}
                        <div className="space-y-1.5">
                          <div className="flex items-start gap-3">
                            <span className="inline-flex items-center justify-center rounded-lg bg-[#F1F5F9] px-2 py-0.5 text-sm  font-bold text-color1 shrink-0 dark:bg-gray-800 dark:text-white">
                              {q.qNo}
                            </span>
                            <p className="text-sm md:text-base font-bold text-[#000] dark:text-white leading-snug">
                              {q.text}
                            </p>
                          </div>

                          {/* Badges Row */}
                          <div className="flex flex-wrap items-center gap-2.5 text-xs md:text-sm md:pl-7">
                            <span className="rounded-full bg-purple-100/90 px-2.5 py-0.5 font-bold text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                              {q.co}
                            </span>

                            <span className="rounded-full bg-purple-100/90 px-2.5 py-0.5 font-bold text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                              {q.kLevel}
                            </span>

                            <span className="rounded-full border border-gray-200 bg-gray-50/80 px-3 py-0.5 font-bold text-[#000] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                              {q.marks}
                            </span>

                            <span className="text-gray-300 dark:text-[#000] font-light">
                              |
                            </span>

                            <span className="font-semibold text-pri text-sm md:text-base dark:text-gray-400">
                              Topic:{" "}
                              <span className="font-bold text-sm md:text-base text-color1 dark:text-gray-200">
                                {q.topic}
                              </span>
                            </span>
                          </div>
                        </div>

                        {/* Question Action Icons */}
                        <div className="flex items-center gap-2 shrink-0 pt-1">
                          <button
                            type="button"
                            onClick={() => console.log("Edit Question", q.id)}
                            className="text-color1 hover:text-[#000] dark:hover:text-gray-200 transition-colors p-1"
                            title="Edit Question"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onDeleteQuestion?.(sec.id, q.id)}
                            className="text-color1 hover:text-red-500 transition-colors p-1"
                            title="Delete Question"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Section Footer Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pt-2 ">
                    <button
                      type="button"
                      onClick={() => onAddQuestion?.(sec.id)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs md:text-sm font-bold text-[#000] shadow-2xs hover:bg-gray-50 active:scale-[0.99] transition-all dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                    >
                      <Plus className="h-4 w-4 text-color1 dark:text-gray-400" />
                      <span className="font-bold text-color1">Add Question</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onGenerateQuestions?.(sec.id)}
                      className="inline-flex items-center gap-2 rounded-xl bg-color2 px-5 py-2.5 text-xs md:text-sm font-bold text-white shadow-xs hover:opacity-90 active:scale-[0.99] transition-all"
                    >
                      <Sparkles className="h-4 w-4 fill-white/20" />
                      <span>Generate More Questions</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CIASectionsQuestionsCard;
