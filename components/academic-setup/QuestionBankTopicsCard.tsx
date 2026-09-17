import React, { useState } from "react";
import { ChevronDown, ChevronRight, Search, Eye, CheckCircle } from "lucide-react";

export interface QuestionOption {
  key: string;
  text: string;
  isCorrect?: boolean;
}

export interface QuestionBankItem {
  id: string;
  questionCode: string;
  topicCode: string;
  topicTitle: string;
  questionText: string;
  tags: string[];
  options?: QuestionOption[];
  correctAnswer?: string;
  explanation?: string;
}

export interface UnitQuestionBankData {
  id: string;
  unitNumber: number;
  unitCodeText: string;
  title: string;
  questionsCountText: string;
  questions: QuestionBankItem[];
}

export interface QuestionBankTopicsCardProps {
  title?: string;
  subtitle?: string;
  headerStatsText?: string;
  units?: UnitQuestionBankData[];
  onViewQuestion?: (question: QuestionBankItem) => void;
  className?: string;
}

const DEFAULT_UNITS: UnitQuestionBankData[] = [
  {
    id: "unit-1",
    unitNumber: 1,
    unitCodeText: "UNIT 1",
    title: "Introduction & Physical Layer",
    questionsCountText: "3 Questions",
    questions: [
      {
        id: "q-1.3-1",
        questionCode: "Q-CN-001",
        topicCode: "1.3",
        topicTitle: "OSI and TCP/IP Reference Models",
        questionText:
          "Which OSI layer is responsible for logical addressing and packet routing across intermediate networks?",
        tags: ["CO1", "K2", "MCQ", "2 Marks"],
        options: [
          { key: "A", text: "Data Link Layer" },
          { key: "B", text: "Network Layer", isCorrect: true },
          { key: "C", text: "Transport Layer" },
          { key: "D", text: "Physical Layer" },
        ],
        correctAnswer: "Option B (Network Layer)",
        explanation:
          "The Network Layer (Layer 3) handles logical IPv4/IPv6 addressing and determines optimal packet routing paths across interconnected subnets.",
      },
      {
        id: "q-1.4-1",
        questionCode: "Q-CN-002",
        topicCode: "1.4",
        topicTitle: "Physical Layer and Transmission Media",
        questionText:
          "Which transmission medium provides the highest immunity to electromagnetic interference?",
        tags: ["CO1", "K2", "MCQ", "2 Marks"],
        options: [
          { key: "A", text: "Unshielded Twisted Pair (UTP)" },
          { key: "B", text: "Coaxial Cable" },
          { key: "C", text: "Optical Fiber Cable", isCorrect: true },
          { key: "D", text: "Shielded Twisted Pair (STP)" },
        ],
        correctAnswer: "Option C (Optical Fiber Cable)",
        explanation:
          "Optical Fiber transmits light pulses through glass/plastic strands rather than electrical currents, making it completely immune to EMI and RFI.",
      },
      {
        id: "q-1.3-2",
        questionCode: "Q-CN-003",
        topicCode: "1.3",
        topicTitle: "OSI and TCP/IP Reference Models",
        questionText:
          "Which TCP/IP layer corresponds most closely to the OSI Transport Layer?",
        tags: ["CO1", "K2", "MCQ", "2 Marks"],
        options: [
          { key: "A", text: "Application Layer" },
          { key: "B", text: "Transport Layer", isCorrect: true },
          { key: "C", text: "Internet Layer" },
          { key: "D", text: "Network Access Layer" },
        ],
        correctAnswer: "Option B (Transport Layer)",
        explanation:
          "The TCP/IP Transport Layer provides end-to-end communication services (TCP/UDP) equivalent to the OSI Transport Layer.",
      },
    ],
  },
  {
    id: "unit-2",
    unitNumber: 2,
    unitCodeText: "UNIT 2",
    title: "Data Link Layer & MAC Sublayer",
    questionsCountText: "2 Questions",
    questions: [
      {
        id: "q-2.1-1",
        questionCode: "Q-CN-004",
        topicCode: "2.1",
        topicTitle: "Data Link Layer Design & Framing",
        questionText:
          "What pattern is used as a flag byte to mark frame boundaries in HDLC bit stuffing?",
        tags: ["CO2", "K2", "MCQ", "2 Marks"],
        options: [
          { key: "A", text: "01111110", isCorrect: true },
          { key: "B", text: "11111111" },
          { key: "C", text: "00000000" },
          { key: "D", text: "10101010" },
        ],
        correctAnswer: "Option A (01111110)",
        explanation:
          "HDLC uses the bit pattern 01111110 (0x7E) as a frame delimiter and inserts a 0 bit after five consecutive 1s in body payload.",
      },
      {
        id: "q-2.1-2",
        questionCode: "Q-CN-005",
        topicCode: "2.1",
        topicTitle: "Data Link Layer Design & Framing",
        questionText:
          "Explain the working mechanism of CRC-32 polynomial division in detecting transmission errors.",
        tags: ["CO2", "K3", "Descriptive", "10 Marks"],
        explanation:
          "Sender appends r-bit CRC remainder from modulo-2 division of payload by generator polynomial G(x). Receiver divides incoming frame by G(x); zero remainder indicates error-free transmission.",
      },
    ],
  },
  {
    id: "unit-3",
    unitNumber: 3,
    unitCodeText: "UNIT 3",
    title: "Network Layer & Routing",
    questionsCountText: "2 Questions",
    questions: [
      {
        id: "q-3.1-1",
        questionCode: "Q-CN-006",
        topicCode: "3.1",
        topicTitle: "IPv4/IPv6 Addressing & Subnetting",
        questionText:
          "How many usable host IP addresses are available in a standard /26 CIDR subnet?",
        tags: ["CO3", "K3", "MCQ", "2 Marks"],
        options: [
          { key: "A", text: "64" },
          { key: "B", text: "62", isCorrect: true },
          { key: "C", text: "128" },
          { key: "D", text: "30" },
        ],
        correctAnswer: "Option B (62)",
        explanation:
          "A /26 subnet leaves 6 host bits (2^6 = 64 total addresses). Subtracting Network ID and Broadcast address yields 62 usable host IPs.",
      },
    ],
  },
  {
    id: "unit-4",
    unitNumber: 4,
    unitCodeText: "UNIT 4",
    title: "Transport Layer Protocols",
    questionsCountText: "2 Questions",
    questions: [
      {
        id: "q-4.1-1",
        questionCode: "Q-CN-007",
        topicCode: "4.1",
        topicTitle: "TCP Connection Management & Flow Control",
        questionText:
          "Which TCP control flags are exchanged during the initial 3-way handshake connection establishment phase?",
        tags: ["CO4", "K2", "MCQ", "2 Marks"],
        options: [
          { key: "A", text: "SYN -> SYN-ACK -> ACK", isCorrect: true },
          { key: "B", text: "FIN -> ACK -> FIN-ACK" },
          { key: "C", text: "RST -> SYN -> ACK" },
          { key: "D", text: "URG -> PSH -> ACK" },
        ],
        correctAnswer: "Option A (SYN -> SYN-ACK -> ACK)",
        explanation:
          "Client initiates with SYN, Server responds with SYN-ACK, and Client completes connection setup with ACK.",
      },
    ],
  },
  {
    id: "unit-5",
    unitNumber: 5,
    unitCodeText: "UNIT 5",
    title: "Application Layer",
    questionsCountText: "2 Questions",
    questions: [
      {
        id: "q-5.1-1",
        questionCode: "Q-CN-008",
        topicCode: "5.1",
        topicTitle: "Application Protocols",
        questionText:
          "Which default transport layer protocol and port number are utilized by DNS recursive resolvers for standard query transactions?",
        tags: ["CO5", "K2", "MCQ", "2 Marks"],
        options: [
          { key: "A", text: "TCP Port 80" },
          { key: "B", text: "UDP Port 53", isCorrect: true },
          { key: "C", text: "TCP Port 443" },
          { key: "D", text: "UDP Port 67" },
        ],
        correctAnswer: "Option B (UDP Port 53)",
        explanation:
          "Standard DNS domain name lookups use lightweight UDP port 53 for fast query and response round trips.",
      },
    ],
  },
];

const QuestionBankTopicsCard: React.FC<QuestionBankTopicsCardProps> = ({
  title = "QUESTION BANK BY TOPICS",
  subtitle = "Curated question bank items categorized by units and topics.",
  headerStatsText = "5 Units • 10 Questions",
  units = DEFAULT_UNITS,
  onViewQuestion,
  className = "",
}) => {
  const [openUnits, setOpenUnits] = useState<Record<string, boolean>>({
    "unit-1": true,
  });
  const [openQuestions, setOpenQuestions] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState("");

  const toggleUnit = (id: string) => {
    setOpenUnits((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const toggleQuestion = (id: string, question: QuestionBankItem) => {
    setOpenQuestions((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
    onViewQuestion?.(question);
  };

  const handleExpandAll = () => {
    const allOpened: Record<string, boolean> = {};
    units.forEach((u) => {
      allOpened[u.id] = true;
    });
    setOpenUnits(allOpened);
  };

  const handleCollapseAll = () => {
    setOpenUnits({});
  };

  const filteredUnits = units
    .map((unit) => {
      if (!searchQuery.trim()) return unit;
      const q = searchQuery.toLowerCase();
      const unitMatches =
        unit.title.toLowerCase().includes(q) ||
        unit.unitCodeText.toLowerCase().includes(q);

      const matchingQuestions = unit.questions.filter((item) => {
        return (
          item.questionCode.toLowerCase().includes(q) ||
          item.topicTitle.toLowerCase().includes(q) ||
          item.topicCode.toLowerCase().includes(q) ||
          item.questionText.toLowerCase().includes(q) ||
          item.tags.some((tag) => tag.toLowerCase().includes(q))
        );
      });

      if (unitMatches || matchingQuestions.length > 0) {
        return {
          ...unit,
          questions: unitMatches ? unit.questions : matchingQuestions,
        };
      }
      return null;
    })
    .filter(Boolean) as UnitQuestionBankData[];

  return (
    <div className={`space-y-4 ${className} panel p-5`}>
      {/* Top Heading Row */}
      <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-gray-100 dark:border-gray-800">
        <div>
          <div className="flex items-center gap-2 text-sm sm:text-base font-extrabold uppercase tracking-wider text-[#000] dark:text-white">
            <span className="h-2 w-2 rounded-full bg-[#7c3aed] shrink-0" />
            <span className="font-bold text-[#1e1b4b] dark:text-white">
              {title}
            </span>
          </div>
          {subtitle && (
            <p className="mt-1 text-xs font-medium text-pri dark:text-gray-400">
              {subtitle}
            </p>
          )}
        </div>

        {headerStatsText && (
          <span className="text-xs sm:text-sm font-bold text-[#1e1b4b] dark:text-white shrink-0">
            {headerStatsText}
          </span>
        )}
      </div>

      {/* Toolbar Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 py-1 px-1">
        <div className="relative flex items-center w-64 sm:w-72">
          <Search className="absolute left-3.5 h-4 w-4 text-[#000] pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions..."
            className="w-full pl-10 pr-4 py-1.5 text-xs sm:text-sm rounded-xl border border-gray-200/90 bg-white shadow-2xs outline-none transition-all focus:border-[#7c3aed] dark:border-gray-800 dark:bg-gray-900 dark:text-white"
          />
        </div>

        <div className="flex items-center font-bold gap-2 text-xs sm:text-sm shrink-0">
          <button
            type="button"
            onClick={handleExpandAll}
            className="text-pri hover:text-color2 transition-colors"
          >
            Expand All
          </button>
          <span className="text-gray-300 dark:text-[#000]">|</span>
          <button
            type="button"
            onClick={handleCollapseAll}
            className="text-color2 font-bold hover:underline transition-colors"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Accordion Units List */}
      <div className="space-y-3">
        {filteredUnits.map((unit) => {
          const isOpen = Boolean(openUnits[unit.id] || searchQuery.trim());
          return (
            <div
              key={unit.id}
              className="rounded-2xl border border-gray-200/80 bg-white shadow-2xs dark:border-gray-800 dark:bg-gray-900 overflow-hidden transition-all"
            >
              {/* Unit Accordion Bar */}
              <button
                type="button"
                onClick={() => toggleUnit(unit.id)}
                className={`w-full flex items-center justify-between gap-4 p-4 sm:px-5 text-left outline-none transition-colors ${isOpen
                  ? "bg-[#fcfaff] border-b border-gray-100 dark:bg-purple-950/20 dark:border-gray-800"
                  : "hover:bg-gray-50/50 dark:hover:bg-gray-800/40"
                  }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4 text-color2 shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-[#000] shrink-0" />
                  )}

                  <div className="flex items-center gap-3 text-sm sm:text-base font-bold truncate">
                    <span className="text-color2 font-bold shrink-0">
                      {unit.unitCodeText}
                    </span>
                    <span className="text-[#000] dark:text-white font-bold truncate">
                      {unit.title}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs sm:text-sm font-bold shrink-0">
                  <span className="text-color2 font-bold">
                    {unit.questionsCountText}
                  </span>
                </div>
              </button>

              {/* Expanded Unit Content */}
              {isOpen && (
                <div className="space-y-3 p-3">
                  {unit.questions.map((q) => {
                    const isQuestionOpen = Boolean(openQuestions[q.id]);

                    return (
                      <div
                        key={q.id}
                        className="rounded-2xl border border-purple-100/80 bg-white p-4 sm:p-5 shadow-2xs dark:border-gray-800 dark:bg-gray-900/90 space-y-3 transition-all"
                      >
                        {/* Top Line: Badge + Topic Title + View Question Button */}
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="rounded-md bg-[#f5f3ff] px-2.5 py-1 text-xs sm:text-sm font-bold text-color2 dark:bg-purple-950/60 dark:text-purple-300 shrink-0">
                              {q.questionCode}
                            </span>
                            <span className="text-sm sm:text-base font-bold text-[#000] dark:text-white truncate">
                              {q.topicCode} {q.topicTitle}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => toggleQuestion(q.id, q)}
                            className="flex items-center gap-1.5 rounded-xl bg-[#f5f3ff] hover:bg-purple-100 text-color2 px-3.5 py-1.5 text-xs sm:text-sm font-bold transition-colors dark:bg-purple-950/60 dark:text-purple-300 dark:hover:bg-purple-900/80 shrink-0"
                          >
                            <Eye className="h-4 w-4 text-color2 font-bold" />
                            <span className="text-color2 font-bold ">{isQuestionOpen ? "Hide Question" : "View Question"}</span>
                          </button>
                        </div>

                        {/* Question Text */}
                        <p className="text-xs sm:text-sm font-medium text-[#000] dark:text-gray-200 leading-relaxed">
                          {q.questionText}
                        </p>

                        {/* Bottom Tag Badges */}
                        <div className="flex flex-wrap items-center gap-2 pt-0.5">
                          {q.tags.map((tag, tagIdx) => (
                            <span
                              key={tagIdx}
                              className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-gray-800 dark:text-gray-300"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        {/* Expanded Question Details (Options / Answer / Explanation) */}
                        {isQuestionOpen && (
                          <div className="mt-3 pt-3 border-t border-purple-100 dark:border-gray-800 space-y-3">
                            {q.options && q.options.length > 0 && (
                              <div className="space-y-2">
                                <span className="text-xs font-bold uppercase tracking-wider text-color2">
                                  Options:
                                </span>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {q.options.map((opt) => (
                                    <div
                                      key={opt.key}
                                      className={`flex items-start gap-2.5 rounded-xl border p-2.5 text-xs sm:text-sm font-medium ${opt.isCorrect
                                        ? "border-emerald-200 bg-emerald-50/60 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300"
                                        : "border-gray-200/80 bg-gray-50/50 text-[#000] dark:border-gray-800 dark:bg-gray-800/40 dark:text-gray-300"
                                        }`}
                                    >
                                      <span
                                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${opt.isCorrect
                                          ? "bg-emerald-600 text-white"
                                          : "bg-gray-200 text-[#000] dark:bg-gray-700 dark:text-gray-300"
                                          }`}
                                      >
                                        {opt.key}
                                      </span>
                                      <span className="leading-snug">{opt.text}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {q.correctAnswer && (
                              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                                <CheckCircle className="h-4 w-4 shrink-0" />
                                <span>Correct Answer: {q.correctAnswer}</span>
                              </div>
                            )}

                            {q.explanation && (
                              <div className="rounded-xl border border-purple-100 bg-[#fbf9ff] p-3 text-xs text-[#000] dark:border-purple-950 dark:bg-purple-950/20 dark:text-gray-300">
                                <strong className="text-color2 font-bold">Explanation: </strong>
                                {q.explanation}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default QuestionBankTopicsCard;
