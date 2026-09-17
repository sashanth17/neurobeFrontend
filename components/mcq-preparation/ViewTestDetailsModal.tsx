import React, { useState, useEffect } from "react";
import {
  X,
  FileText,
  HelpCircle,
  Lock,
  ChevronDown,
  ChevronUp,
  Calendar,
} from "lucide-react";

export interface ViewQuestionDetail {
  id: string;
  questionNumber: number;
  code: string;
  level: string;
  marks: string;
  topic: string;
  subtopic: string;
  question: string;
  options?: { key: string; text: string; isCorrect?: boolean }[];
  explanation?: string;
}

export interface ViewTestDetailsModalProps {
  open: boolean;
  onClose: () => void;
  testData?: {
    code?: string;
    title?: string;
    status?: string;
    courseCode?: string;
    unit?: string;
    questionsCount?: number | string;
    knowledgeLevels?: string;
    testWindowDate?: string;
    testWindowTime?: string;
    topics?: string[];
    questions?: ViewQuestionDetail[];
  };
}

const SAMPLE_TEST_QUESTIONS: ViewQuestionDetail[] = [
  {
    id: "q-1",
    questionNumber: 1,
    code: "qb_cn_u1_k1_1",
    level: "K1",
    marks: "2 Marks",
    topic: "1.3 OSI and TCP/IP Reference Models",
    subtopic: "OSI 7–Layer Architecture",
    question:
      "How many distinct structural layers are defined in the ISO/OSI standard reference architecture?",
    options: [
      { key: "A", text: "5 Layers" },
      { key: "B", text: "7 Layers", isCorrect: true },
      { key: "C", text: "4 Layers" },
      { key: "D", text: "6 Layers" },
    ],
    explanation:
      "The ISO/OSI model defines seven distinct abstraction layers: Physical, Data Link, Network, Transport, Session, Presentation, and Application.",
  },
  {
    id: "q-2",
    questionNumber: 2,
    code: "qb_cn_u1_k1_2",
    level: "K1",
    marks: "2 Marks",
    topic: "1.1 Overview of Data Communications and Networks",
    subtopic: "Data Flow Modes",
    question:
      "Which communication transmission mode permits signals to flow in both directions simultaneously?",
    options: [
      { key: "A", text: "Simplex" },
      { key: "B", text: "Half-Duplex" },
      { key: "C", text: "Full-Duplex", isCorrect: true },
      { key: "D", text: "Multiplex" },
    ],
    explanation:
      "Full-Duplex mode allows bidirectional data communication simultaneously (e.g., telephone call or full-duplex Ethernet).",
  },
  {
    id: "q-3",
    questionNumber: 3,
    code: "qb_cn_u2_k2_1",
    level: "K2",
    marks: "2 Marks",
    topic: "2.2 Error Detection & Correction",
    subtopic: "Cyclic Redundancy Check (CRC)",
    question:
      "In a Cyclic Redundancy Check (CRC) error detection mechanism, what mathematical operation is used during division?",
    options: [
      { key: "A", text: "Binary Addition" },
      { key: "B", text: "Modulo-2 Arithmetic (XOR)", isCorrect: true },
      { key: "C", text: "2's Complement Addition" },
      { key: "D", text: "Bitwise AND" },
    ],
    explanation:
      "CRC polynomial division uses Modulo-2 binary arithmetic, where subtraction and addition are equivalent to XOR operations.",
  },
];

const ViewTestDetailsModal: React.FC<ViewTestDetailsModalProps> = ({
  open,
  onClose,
  testData = {
    code: "MCQ-CN-2026-T1",
    title: "Network Models & Physical Layer Quiz",
    status: "Live",
    courseCode: "CS309 – Computer Networks",
    unit: "Unit 1 — Physical & Network Models",
    questionsCount: 5,
    knowledgeLevels: "K1: 2 • K2: 3",
    testWindowDate: "01 Sep 2026",
    testWindowTime: "2:00 PM – 3:00 PM",
    topics: [
      "1.3 OSI and TCP/IP Reference Models",
      "1.4 Physical Layer and Transmission Media",
    ],
    questions: SAMPLE_TEST_QUESTIONS,
  },
}) => {
  const [expandedQuestions, setExpandedQuestions] = useState<
    Record<string, boolean>
  >({});
  const [allExpanded, setAllExpanded] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  const questionsList =
    testData?.questions && testData.questions.length > 0
      ? testData.questions
      : SAMPLE_TEST_QUESTIONS;

  const toggleExpand = (id: string) => {
    setExpandedQuestions((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleToggleAll = () => {
    const nextState = !allExpanded;
    setAllExpanded(nextState);
    const newExpandedMap: Record<string, boolean> = {};
    questionsList.forEach((q) => {
      newExpandedMap[q.id] = nextState;
    });
    setExpandedQuestions(newExpandedMap);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-2xl dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
        {/* Modal Header */}
        <div className="flex shrink-0 items-start justify-between border-b border-gray-100 px-8 py-5 dark:border-gray-800">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-xl font-bold text-[#000] dark:text-white">
                {testData?.title || "Network Models & Physical Layer Quiz"}
              </h2>
              <span className="rounded-full border border-[#ddd6fe] bg-[#f5f3ff] px-3 py-0.5 text-xs font-semibold text-color2 dark:bg-purple-950/40 dark:border-purple-800 dark:text-purple-300">
                {testData?.code || "MCQ-CN-2026-T1"}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-0.5 text-xs font-semibold text-emerald-600 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {testData?.status || "Live"}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-0.5 text-xs font-semibold text-[#000] dark:bg-gray-800 dark:text-gray-300">
                <Lock className="h-3 w-3 text-pri" />
                Read Only
              </span>
            </div>
            <p className="mt-1 text-sm font-medium text-pri dark:text-gray-400">
              Academic test configuration & approved question preview
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-full border border-gray-200 p-1 text-[#000] hover:bg-gray-100 hover:text-[#000] dark:border-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div
          className="flex-1 overflow-y-auto px-8 py-6 space-y-6"
          style={{ scrollbarWidth: "none" }}
        >
          {/* SECTION 1 — TEST SUMMARY */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-md font-extrabold uppercase tracking-wider text-[#000] dark:text-white">
                <FileText className="h-4 w-4 text-color2" />
                <span className="font-bold">SECTION 1 — TEST SUMMARY</span>
              </div>
              <span className="text-xs font-semibold text-pri dark:text-gray-400">
                {testData?.courseCode || "CS309 – Computer Networks"}
              </span>
            </div>

            {/* Grid Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
              {/* Unit */}
              <div className="rounded-2xl border border-gray-100 bg-[#f8fafc] p-4 dark:border-gray-800 dark:bg-gray-800/40">
                <p className="text-[11px] font-bold uppercase tracking-wider text-pri dark:text-gray-400 mb-1">
                  UNIT
                </p>
                <p className="text-sm font-bold text-[#000] dark:text-white leading-snug">
                  {testData?.unit || "Unit 1 — Physical & Network Models"}
                </p>
              </div>

              {/* Questions */}
              <div className="rounded-2xl border border-gray-100 bg-[#f8fafc] p-4 dark:border-gray-800 dark:bg-gray-800/40">
                <p className="text-[11px] font-bold uppercase tracking-wider text-pri dark:text-gray-400 mb-1">
                  QUESTIONS
                </p>
                <p className="text-sm font-bold text-[#000] dark:text-white">
                  {testData?.questionsCount || 5}
                </p>
              </div>

              {/* Knowledge Levels */}
              <div className="rounded-2xl border border-gray-100 bg-[#f8fafc] p-4 dark:border-gray-800 dark:bg-gray-800/40">
                <p className="text-[11px] font-bold uppercase tracking-wider text-pri dark:text-gray-400 mb-1">
                  KNOWLEDGE LEVELS
                </p>
                <p className="text-sm font-bold text-[#000] dark:text-white">
                  {testData?.knowledgeLevels || "K1: 2 • K2: 3"}
                </p>
              </div>

              {/* Test Window */}
              <div className="rounded-2xl border border-gray-100 bg-[#f8fafc] p-4 dark:border-gray-800 dark:bg-gray-800/40">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-pri dark:text-gray-400">
                    TEST WINDOW
                  </p>
                  <Calendar className="h-3.5 w-3.5 text-[#000]" />
                </div>
                <p className="text-sm font-bold text-[#000] dark:text-white leading-snug">
                  {testData?.testWindowDate || "01 Sep 2026"},{" "}
                  <span className="font-semibold text-[#000] dark:text-gray-300">
                    {testData?.testWindowTime || "2:00 PM – 3:00 PM"}
                  </span>
                </p>
              </div>
            </div>

            {/* Topics Card */}
            <div className="mt-3.5 rounded-2xl border border-gray-100 bg-[#f8fafc] p-4 dark:border-gray-800 dark:bg-gray-800/40">
              <p className="text-[11px] font-bold uppercase tracking-wider text-pri dark:text-gray-400 mb-2">
                TOPICS
              </p>
              <div className="space-y-1 text-xs font-semibold text-[#000] dark:text-gray-300">
                {(
                  testData?.topics || [
                    "1.3 OSI and TCP/IP Reference Models",
                    "1.4 Physical Layer and Transmission Media",
                  ]
                ).map((t, idx) => (
                  <p key={idx}>• {t}</p>
                ))}
              </div>
            </div>
          </div>

          {/* Section Divider Line */}
          <div className="border-t border-gray-200/70 dark:border-gray-800 my-6" />

          {/* SECTION 2 — SELECTED QUESTIONS */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wider text-[#000] dark:text-white">
                  <HelpCircle className="h-4 w-4 text-color2" />
                  <span className="font-bold">
                    SECTION 2 — SELECTED QUESTIONS ({questionsList.length})
                  </span>
                </div>
                <p className="text-xs font-medium text-[#000] dark:text-gray-400 mt-0.5">
                  Complete approved question list in read-only mode.
                </p>
              </div>

              <button
                type="button"
                onClick={handleToggleAll}
                className="rounded-xl bg-[#f5f3ff] px-4 py-2 text-sm font-semibold text-color2 hover:bg-[#ede9fe] dark:bg-purple-950/50 dark:text-purple-300 transition"
              >
                {allExpanded ? "Collapse All Answers" : "Expand All Answers"}
              </button>
            </div>

            {/* Questions List */}
            <div className="space-y-4">
              {questionsList.map((q) => {
                const isExpanded = !!expandedQuestions[q.id];

                return (
                  <div
                    key={q.id}
                    className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800"
                  >
                    {/* Top Row: Question Badge + Code + Level + Marks + Toggle */}
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-gray-100 px-2.5 py-1 text-xs font-bold text-[#000] dark:bg-gray-700 dark:text-gray-200">
                          Question {q.questionNumber}
                        </span>
                        <span className="text-xs font-medium text-[#000] dark:text-pri">
                          {q.code}
                        </span>
                        <span className="rounded bg-[#eff6ff] px-2 py-0.5 text-xs font-bold text-[#3b82f6] dark:bg-blue-950/50 dark:text-blue-300">
                          {q.level}
                        </span>
                        <span className="text-xs font-semibold text-[#000] dark:text-gray-300">
                          {q.marks}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleExpand(q.id)}
                        className="flex items-center gap-1 text-sm font-semibold text-color2 hover:underline dark:text-purple-400"
                      >
                        {isExpanded ? (
                          <>
                            Hide Answer Details
                            <ChevronUp className="h-3.5 w-3.5" />
                          </>
                        ) : (
                          <>
                            View Answer Details
                            <ChevronDown className="h-3.5 w-3.5" />
                          </>
                        )}
                      </button>
                    </div>

                    {/* Topic & Subtopic */}
                    <p className="text-[11px] font-bold text-[#000] dark:text-gray-400 uppercase tracking-wide mb-2">
                      TOPIC: <span className="text-xs font-bold text-[#000] dark:text-gray-200 normal-case">{q.topic}</span>
                      <span className="mx-1.5 text-gray-300 dark:text-[#000]">•</span>
                      SUBTOPIC:{" "}
                      <span className="text-xs font-bold text-[#000] dark:text-gray-200 normal-case">{q.subtopic}</span>
                    </p>

                    {/* Question Text */}
                    <h4 className="text-sm font-bold text-[#000] dark:text-white leading-snug">
                      {q.question}
                    </h4>

                    {/* Expandable Options & Explanation */}
                    {isExpanded && (
                      <div className="mt-4 space-y-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                        {q.options && q.options.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {q.options.map((opt) => (
                              <div
                                key={opt.key}
                                className={`rounded-xl border px-3.5 py-2 text-xs font-medium ${opt.isCorrect
                                  ? "border-emerald-300 bg-emerald-50 text-emerald-900 font-bold dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200"
                                  : "border-gray-200 bg-gray-50 text-[#000] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                                  }`}
                              >
                                <span className="font-bold mr-1.5">
                                  {opt.key}.
                                </span>
                                {opt.text}
                                {opt.isCorrect && (
                                  <span className="ml-2 text-[10px] uppercase font-bold text-emerald-600">
                                    ✓ Correct
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {q.explanation && (
                          <div className="rounded-xl bg-purple-50/70 p-3.5 text-xs text-purple-900 dark:bg-purple-950/40 dark:text-purple-200 border border-purple-100 dark:border-purple-900">
                            <p className="font-bold mb-1 text-color2 dark:text-purple-300">
                              Explanation:
                            </p>
                            <p className="leading-relaxed">{q.explanation}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex shrink-0 items-center justify-end border-t border-gray-100 px-8 py-4 bg-[#f8fafc] rounded-b-2xl dark:border-gray-800 dark:bg-gray-900">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[#1c1a27] px-7 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#2b273b] transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewTestDetailsModal;
