import React, { useState } from "react";

export interface MCQTestOption {
  id: string;
  code: string;
  title: string;
}

export interface CIATestOption {
  id: string;
  label: string;
}

export interface ResultAnalysisHeaderCardProps {
  courseCode?: string;
  enrolledStudentsMcq?: string;
  enrolledStudentsCia?: string;
  activeMode?: "mcq" | "cia";
  onModeChange?: (mode: "mcq" | "cia") => void;

  mcqTests?: MCQTestOption[];
  selectedMcqId?: string;
  onMcqSelect?: (id: string) => void;

  ciaTests?: CIATestOption[];
  selectedCiaId?: string;
  onCiaSelect?: (id: string) => void;
}

const DEFAULT_MCQ_TESTS: MCQTestOption[] = [
  {
    id: "mcq-1",
    code: "MCQ-CN-2026-T1",
    title: "Application Layer Protocols & DNS MCQ Assessment",
  },
  {
    id: "mcq-2",
    code: "MCQ-CN-2026-T2",
    title: "Physical & Data Link Layer Fundamentals MCQ Test",
  },
];

const DEFAULT_CIA_TESTS: CIATestOption[] = [
  { id: "cia-1", label: "CIA-1" },
  { id: "cia-2", label: "CIA-2" },
];

export const ResultAnalysisHeaderCard: React.FC<ResultAnalysisHeaderCardProps> = ({
  courseCode = "CS309 — Computer Networks",
  enrolledStudentsMcq = "45 Enrolled Students",
  enrolledStudentsCia = "40 Enrolled Students",
  activeMode,
  onModeChange,
  mcqTests = DEFAULT_MCQ_TESTS,
  selectedMcqId,
  onMcqSelect,
  ciaTests = DEFAULT_CIA_TESTS,
  selectedCiaId,
  onCiaSelect,
}) => {
  // Internal state for uncontrolled mode
  const [internalMode, setInternalMode] = useState<"mcq" | "cia">("mcq");
  const [internalMcqId, setInternalMcqId] = useState<string>(
    mcqTests[0]?.id || "mcq-1"
  );
  const [internalCiaId, setInternalCiaId] = useState<string>(
    ciaTests[0]?.id || "cia-1"
  );

  const mode = activeMode !== undefined ? activeMode : internalMode;
  const currentMcqId = selectedMcqId !== undefined ? selectedMcqId : internalMcqId;
  const currentCiaId = selectedCiaId !== undefined ? selectedCiaId : internalCiaId;

  const handleModeChange = (newMode: "mcq" | "cia") => {
    if (onModeChange) {
      onModeChange(newMode);
    } else {
      setInternalMode(newMode);
    }
  };

  const handleMcqSelect = (id: string) => {
    if (onMcqSelect) {
      onMcqSelect(id);
    } else {
      setInternalMcqId(id);
    }
  };

  const handleCiaSelect = (id: string) => {
    if (onCiaSelect) {
      onCiaSelect(id);
    } else {
      setInternalCiaId(id);
    }
  };

  const enrolledText =
    mode === "mcq" ? enrolledStudentsMcq : enrolledStudentsCia;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 md:p-6 shadow-xs dark:border-gray-800 dark:bg-gray-900">
      {/* Top Section: Title, Badges & Toggle */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-xl font-bold text-[#000] dark:text-white">
            Results & Analysis
          </h2>
          <span className="rounded-lg bg-color2-l px-3 py-1 text-xs font-semibold text-color2 dark:bg-purple-950/60 dark:text-purple-300">
            {courseCode}
          </span>
          <span className="rounded-lg bg-gray-100 px-3 py-1 text-xs font-medium text-[#000] dark:bg-gray-800 dark:text-gray-300">
            {enrolledText}
          </span>
        </div>

        {/* Mode Toggle Buttons */}
        <div className="inline-flex rounded-xl bg-gray-100/90 p-1 dark:bg-gray-800 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => handleModeChange("mcq")}
            className={`rounded-lg px-4 py-1.5 text-xs font-bold transition-all ${mode === "mcq"
              ? "bg-color2 text-white shadow-xs"
              : "text-[#000] hover:text-[#000] dark:text-gray-400 dark:hover:text-white"
              }`}
          >
            MCQ Tests
          </button>
          <button
            type="button"
            onClick={() => handleModeChange("cia")}
            className={`rounded-lg px-4 py-1.5 text-xs font-bold transition-all ${mode === "cia"
              ? "bg-color2 text-white shadow-xs"
              : "text-[#000] hover:text-[#000] dark:text-gray-400 dark:hover:text-white"
              }`}
          >
            CIA Results
          </button>
        </div>
      </div>

      {/* Description */}
      <p className=" text-md font-medium text-pri dark:text-gray-400">
        {mode === "mcq"
          ? "Review completed MCQ test results, student submissions, and knowledge-level performance metrics."
          : "Review verified and finalized CIA marks from evaluated answer sheets."}
      </p>

      {/* Filter Section */}
      <div
        className={`mt-4 flex flex-wrap items-center gap-2 ${mode === "cia" ? "border-t border-gray-100 pt-4 dark:border-gray-800" : ""
          }`}
      >
        <span className="text-sm font-bold text-[#000] dark:text-gray-300 shrink-0">
          {mode === "mcq"
            ? "Select Completed MCQ Test:"
            : "Select Internal Assessment:"}
        </span>

        <div className="flex flex-wrap items-center gap-2.5">
          {mode === "mcq" ? (
            mcqTests.map((test) => {
              const isActive = test.id === currentMcqId;
              return (
                <button
                  key={test.id}
                  type="button"
                  onClick={() => handleMcqSelect(test.id)}
                  className={`rounded-xl px-3.5 py-1.5 text-xs transition-all ${isActive
                    ? "border border-color2 bg-[#F9F5FF] text-[#000] shadow-2xs dark:border-purple-500 dark:bg-purple-950/40 dark:text-white"
                    : "border border-gray-200 bg-white text-[#000] hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                    }`}
                >
                  <span
                    className={
                      isActive
                        ? "font-bold text-color2 dark:text-purple-400 mr-1.5"
                        : "font-bold text-pri mr-1.5"
                    }
                  >
                    [{test.code}]
                  </span>
                  <span className={isActive ? "font-bold text-[#000] dark:text-white text-sm" : "font-medium text-pri text-sm dark:text-gray-400"}>
                    {test.title}
                  </span>
                </button>
              );
            })
          ) : (
            ciaTests.map((cia) => {
              const isActive = cia.id === currentCiaId;
              return (
                <button
                  key={cia.id}
                  type="button"
                  onClick={() => handleCiaSelect(cia.id)}
                  className={`rounded-full px-4 py-1 text-sm font-bold transition-all ${isActive
                    ? "border border-color2 bg-[#F9F5FF] text-color2 shadow-2xs dark:border-purple-500 dark:bg-purple-950/40 dark:text-purple-300"
                    : "border border-gray-200 bg-white text-pri hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                    }`}
                >
                  {cia.label}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultAnalysisHeaderCard;
