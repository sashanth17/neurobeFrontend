import React, { useState, useEffect } from "react";
import {
  X,
  ChevronRight,
  Check,
  Search,
  ChevronDown,
  ChevronUp,
  Trash2,
  Ticket,
} from "lucide-react";
import CustomSelect from "@/components/FormFields/CustomSelect.component";

const SET_OPTIONS = [
  { value: "all", label: "All Sets" },
  { value: "set-1", label: "Set 01 — Unit 4 TCP/UDP" },
  { value: "set-2", label: "Set 02 — Network Layer" },
  { value: "set-3", label: "Set 03 — Application Layer" },
];

export interface QuestionItem {
  id: string;
  question: string;
  level: string;
  marks: string;
  topic: string;
  subtopic: string;
  selected: boolean;
  explanation?: string;
  options?: { key: string; text: string }[];
}

const SAMPLE_QUESTIONS_LIST: QuestionItem[] = [
  {
    id: "qb_cn_u4_k1_2",
    question:
      "Which TCP control flag in the segment header is set by a host to request graceful, bidirectional connection termination?",
    level: "K1",
    marks: "2 Marks",
    topic: "4.2 TCP Segment Header & 3-Way Handshake",
    subtopic: "TCP Header Control Flags",
    selected: false,
    explanation:
      "The FIN (Finish) flag in the TCP header notifies the remote end that the sender has finished transmitting data and requests graceful teardown.",
  },
  {
    id: "qb_cn_03",
    question:
      "What is the primary role of the SYN control flag during the TCP 3-way connection handshake?",
    level: "K2",
    marks: "2 Marks",
    topic: "4.2 TCP Segment Header & 3-Way Handshake",
    subtopic: "TCP Connection Handshake State",
    selected: true,
    explanation:
      "The SYN (Synchronize) flag synchronizes sequence numbers between sender and receiver to establish reliable bidirectional communication.",
  },
  {
    id: "qb_cn_u5_k3_1",
    question:
      "In TCP sliding connection control, how is the congestion window (cwnd) updated during Congestion Avoidance phase?",
    level: "K3",
    marks: "2 Marks",
    topic: "5.1 TCP Congestion Control Mechanisms",
    subtopic: "Additive Increase Multiplicative Decrease",
    selected: false,
    explanation:
      "During Congestion Avoidance, cwnd increases linearly by approximately 1 MSS per RTT (Additive Increase).",
  },
  {
    id: "qb_cn_u4_k2_4",
    question:
      "Which field in the IPv4 header prevents packets from circulating indefinitely in a routing loop?",
    level: "K2",
    marks: "2 Marks",
    topic: "3.1 IPv4 Addressing & Header Fields",
    subtopic: "Time To Live (TTL) Expiration",
    selected: true,
    explanation:
      "The Time To Live (TTL) field is decremented by each router; when it reaches 0, the packet is discarded and an ICMP Time Exceed is sent.",
  },
];

export interface SelectApprovedQuestionsModalProps {
  open: boolean;
  onClose: () => void;
  onBackToStep1?: () => void;
  mode?: "create" | "configure";
  code?: string;
  requiredCount?: number;
  onSaveTest?: (data: any) => void;
  onSaveDraft?: (data: any) => void;
}

const SelectApprovedQuestionsModal: React.FC<
  SelectApprovedQuestionsModalProps
> = ({
  open,
  onClose,
  onBackToStep1,
  mode = "configure",
  code = "MCQ-CN-2026-T3",
  requiredCount = 5,
  onSaveTest,
  onSaveDraft,
}) => {
    const [questions, setQuestions] = useState<QuestionItem[]>(
      SAMPLE_QUESTIONS_LIST
    );
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedSet, setSelectedSet] = useState(SET_OPTIONS[0]);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const modalTitle = mode === "create" ? "Create MCQ Test" : "Configure Test";
    const primaryBtnText = mode === "create" ? "Create MCQ Test" : "Save Test";

    useEffect(() => {
      document.body.style.overflow = open ? "hidden" : "";
      return () => {
        document.body.style.overflow = "";
      };
    }, [open]);

    if (!open) return null;

    const toggleSelectQuestion = (id: string) => {
      setQuestions((prev) =>
        prev.map((q) => (q.id === id ? { ...q, selected: !q.selected } : q))
      );
    };

    const removeQuestion = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setQuestions((prev) => prev.filter((q) => q.id !== id));
    };

    const selectedCount = questions.filter((q) => q.selected).length;

    const filteredQuestions = questions.filter((q) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        q.question.toLowerCase().includes(query) ||
        q.id.toLowerCase().includes(query) ||
        q.topic.toLowerCase().includes(query) ||
        q.subtopic.toLowerCase().includes(query)
      );
    });

    const handleSave = () => {
      const data = {
        code,
        selectedQuestions: questions.filter((q) => q.selected),
      };
      onSaveTest?.(data);
      console.log("Created & Saved Test:", data);
      onClose();
    };

    const handleDraft = () => {
      const data = {
        code,
        selectedQuestions: questions.filter((q) => q.selected),
        status: "draft",
      };
      onSaveDraft?.(data);
      console.log("Saved Draft Test:", data);
      onClose();
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
        <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-2xl dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
          {/* Modal Header */}
          <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-8 py-5 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-[#000] dark:text-white">
                {modalTitle}
              </h2>
              <span className="rounded-full border border-[#ddd6fe] bg-[#f5f3ff] px-3 py-0.5 text-xs font-semibold text-color2 dark:bg-purple-950/40 dark:border-purple-800 dark:text-purple-300">
                {code}
              </span>
            </div>
            <button
              onClick={onClose}
              className="rounded-full border border-gray-200 p-1 text-[#000] hover:bg-gray-100 hover:text-[#000] dark:border-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200 transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Stepper Navigation */}
          <div className="border-b border-gray-100 bg-white px-8 py-3.5 dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center gap-3 text-sm font-semibold">
              {/* Step 1 - Completed */}
              <div
                onClick={onBackToStep1}
                className="flex cursor-pointer items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-[#000] hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 transition-all"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white text-xs font-bold">
                  <Check className="h-3 w-3 stroke-[2.5]" />
                </span>
                <span>Step 1 — Test Details</span>
              </div>

              <ChevronRight className="h-4 w-4 text-[#000]" />

              {/* Step 2 - Active */}
              <div className="flex items-center gap-2 rounded-full bg-[#7c3aed] px-4 py-2 text-white shadow-sm transition-all">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[11px] font-bold text-color2">
                  2
                </span>
                <span>Step 2 — Select Approved Questions</span>
              </div>
            </div>
          </div>

          {/* Scrollable Form Body */}
          <div
            className="flex-1 overflow-y-auto px-8 py-6 space-y-5"
            style={{ scrollbarWidth: "none" }}
          >
            {/* Filter / Stats Top Card */}
            <div className="rounded-2xl border border-gray-200/80 bg-white p-5 space-y-4 dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-[#000] dark:text-white mb-1">
                    Select {requiredCount} Approved Questions
                  </h3>
                  <p className="text-sm font-bold text-[#000] dark:text-gray-100">
                    {selectedCount} of {requiredCount} Selected
                  </p>
                  <p className="text-xs font-semibold text-pri dark:text-gray-400 mt-0.5">
                    Selected Mix: K1: 0 - K2: 2 - K3: 2 - K4: 1
                  </p>
                </div>
                <span className="rounded-md bg-gray-100 px-2.5 py-1 text-xs font-semibold text-pri dark:bg-gray-700 dark:text-gray-300">
                  {requiredCount} required
                </span>
              </div>

              {/* Search + Dropdown Row */}
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3.5 top-3 h-4 w-4 text-[#000]" />
                  <input
                    type="text"
                    placeholder="Search Questions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 py-2.5 text-sm text-[#000] placeholder:text-gray-400 outline-none focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed] dark:border-gray-700 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <label className="text-sm font-semibold text-[#000] dark:text-gray-300 whitespace-nowrap">
                    Question Set:
                  </label>
                  <CustomSelect
                    options={SET_OPTIONS}
                    value={selectedSet}
                    onChange={(val: any) => setSelectedSet(val)}
                    isSearchable={false}
                    isClearable={false}
                    borderRadius={12}
                    className="w-36"
                  />
                </div>
              </div>
            </div>

            {/* Question Cards List */}
            <div className="space-y-4">
              {filteredQuestions.map((q) => {
                const isSelected = q.selected;
                const isExpanded = expandedId === q.id;

                return (
                  <div
                    key={q.id}
                    onClick={() => toggleSelectQuestion(q.id)}
                    className={`relative cursor-pointer rounded-2xl p-5 transition-all ${isSelected
                      ? "border-2 border-[#7c3aed] bg-[#fbfaff] shadow-sm dark:bg-purple-950/20 dark:border-purple-600"
                      : "border border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800"
                      }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Checkbox */}
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border transition-all mt-0.5 ${isSelected
                          ? "border-[#7c3aed] bg-[#7c3aed] text-white"
                          : "border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-700"
                          }`}
                      >
                        {isSelected && (
                          <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                        )}
                      </span>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {/* Top Question Row + Badges */}
                        <div className="flex items-start justify-between gap-3 mb-1">
                          <h4 className="text-sm font-bold text-[#000] dark:text-white leading-snug">
                            {q.question}
                          </h4>
                          <div
                            className="flex items-center gap-2 shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="rounded bg-purple-50 px-2 py-0.5 text-xs font-bold text-color2 dark:bg-purple-900/40 dark:text-purple-300">
                              {q.level}
                            </span>
                            <span className="rounded bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-[#000] dark:bg-gray-700 dark:text-gray-300">
                              {q.marks}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => removeQuestion(q.id, e)}
                              className="p-1 text-red-500 hover:text-red-600 transition"
                              title="Remove Question"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {/* Question Code / ID */}
                        <p className="text-xs font-medium text-[#000] dark:text-pri mb-2">
                          {q.id}
                        </p>

                        {/* Topic & Subtopic */}
                        <div className="space-y-0.5 text-xs text-pri dark:text-gray-400 font-medium">
                          <p>
                            <span className="font-semibold text-[#000] dark:text-gray-300">
                              Topic:
                            </span>{" "}
                            {q.topic}
                          </p>
                          <p>
                            <span className="font-semibold text-[#000] dark:text-gray-300">
                              Subtopic:
                            </span>{" "}
                            {q.subtopic}
                          </p>
                        </div>

                        {/* Expand / View Question Link */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedId(isExpanded ? null : q.id);
                          }}
                          className="mt-2.5 flex items-center gap-1 text-xs font-semibold text-color2 hover:underline dark:text-purple-400"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="h-3.5 w-3.5" />
                              Hide Explanation
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-[#3.5] w-3.5" />
                              View Question
                            </>
                          )}
                        </button>

                        {/* Expanded View */}
                        {isExpanded && q.explanation && (
                          <div
                            className="mt-3 rounded-xl bg-purple-50/70 p-3.5 text-xs text-purple-900 dark:bg-purple-950/40 dark:text-purple-200 border border-purple-100 dark:border-purple-900"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <p className="font-bold mb-1 text-color2 dark:text-purple-300">
                              Explanation:
                            </p>
                            <p className="leading-relaxed">{q.explanation}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="flex shrink-0 items-center justify-between border-t border-gray-100 px-8 py-4 bg-white rounded-b-2xl dark:border-gray-800 dark:bg-gray-900">
            <button
              type="button"
              onClick={onClose}
              className="text-sm font-semibold text-[#000] hover:text-[#000] dark:text-gray-400 dark:hover:text-white transition"
            >
              Cancel
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleDraft}
                className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-[#000] shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 transition"
              >
                Save Draft
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="create-btn"
              >
                <Check className="h-4 w-4" />
                {primaryBtnText}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

export default SelectApprovedQuestionsModal;
