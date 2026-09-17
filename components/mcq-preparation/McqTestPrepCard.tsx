import React from "react";
import { Eye, Settings, Calendar } from "lucide-react";
import { ViewQuestionDetail } from "./ViewTestDetailsModal";

export type MCQTestStatus = "live" | "upcoming" | "draft" | "completed";

export interface McqTestPrepCardProps {
  id?: string;
  code: string;
  title: string;
  status: MCQTestStatus;
  statusLabel?: string;
  unit: string;
  questionsCount: number | string;
  knowledgeLevels: string;
  selectedQuestions: string;
  selectedDotColor?: string;
  topics: string[];
  testWindowDate?: string;
  testWindowTime?: string;
  readOnly?: boolean;
  readOnlyLabel?: string;
  questions?: ViewQuestionDetail[];
  onViewTest?: () => void;
  onConfigureTest?: () => void;
  onPreviewQuestions?: () => void;
  className?: string;
}

const STATUS_CONFIG: Record<
  MCQTestStatus,
  {
    label: string;
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
    dotColor: string;
  }
> = {
  live: {
    label: "LIVE",
    badgeBg: "bg-emerald-50 dark:bg-emerald-950/40",
    badgeText: "text-emerald-600 dark:text-emerald-400",
    badgeBorder: "border-emerald-200 dark:border-emerald-800/50",
    dotColor: "bg-emerald-500 animate-pulse",
  },
  upcoming: {
    label: "Upcoming",
    badgeBg: "bg-sky-50 dark:bg-sky-950/40",
    badgeText: "text-sky-600 dark:text-sky-400",
    badgeBorder: "border-sky-200 dark:border-sky-800/50",
    dotColor: "bg-sky-500",
  },
  draft: {
    label: "Draft",
    badgeBg: "bg-amber-50 dark:bg-amber-950/40",
    badgeText: "text-amber-600 dark:text-amber-400",
    badgeBorder: "border-amber-200 dark:border-amber-800/50",
    dotColor: "bg-amber-500",
  },
  completed: {
    label: "Completed",
    badgeBg: "bg-purple-50 dark:bg-purple-950/40",
    badgeText: "text-purple-600 dark:text-purple-400",
    badgeBorder: "border-purple-200 dark:border-purple-800/50",
    dotColor: "bg-purple-500",
  },
};

const McqTestPrepCard: React.FC<McqTestPrepCardProps> = ({
  code,
  title,
  status,
  statusLabel,
  unit,
  questionsCount,
  knowledgeLevels,
  selectedQuestions,
  selectedDotColor = "bg-emerald-500",
  topics,
  testWindowDate,
  testWindowTime,
  readOnly = true,
  readOnlyLabel = "READ ONLY",
  onViewTest,
  onConfigureTest,
  onPreviewQuestions,
  className = "",
}) => {
  const statusCfg = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  const displayStatusLabel = statusLabel || statusCfg.label;

  return (
    <div
      className={`rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm transition hover:shadow-md ${className}`}
    >
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left Side: Code Badge + Title + Status Pill */}
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="rounded bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-[#000] dark:text-gray-300">
            {code}
          </span>
          <h3 className="text-base sm:text-lg font-bold text-[#000] dark:text-white">
            {title}
          </h3>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusCfg.badgeBg} ${statusCfg.badgeText} ${statusCfg.badgeBorder}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dotColor}`} />
            {displayStatusLabel}
          </span>
        </div>

        {/* Right Side: Action Buttons */}
        <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
          {status === "draft" ? (
            <button
              onClick={onConfigureTest}
              className="flex items-center gap-1.5 rounded-lg bg-[#7c3aed] px-3.5 py-1.5 text-md font-semibold text-white shadow-sm hover:bg-[#6d28d9] transition"
            >
              <Settings className="h-3.5 w-3.5" />
              Configure Test
            </button>
          ) : (
            <button
              onClick={onViewTest}
              className="flex items-center gap-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-1.5 text-md font-semibold text-[#000] dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition"
            >
              <Eye className="h-3.5 w-3.5 text-[#000] dark:text-gray-300" />
              View Test
            </button>
          )}

          <button
            onClick={onPreviewQuestions}
            className="text-md font-medium text-pri dark:text-gray-400 hover:text-[#000] dark:hover:text-gray-200 transition"
          >
            Preview Questions
          </button>
        </div>
      </div>

      {/* Main Grid Details */}
      <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-y-4 gap-x-6 text-xs">
        {/* Unit */}
        <div>
          <p className="text-md font-bold uppercase tracking-wider text-pri dark:text-pri mb-1">
            UNIT
          </p>
          <p className="font-bold text-color1 text-sm  dark:text-gray-100">{unit}</p>
        </div>

        {/* Questions */}
        <div>
          <p className="text-md font-bold uppercase tracking-wider text-pri dark:text-pri mb-1">
            QUESTIONS
          </p>
          <p className="font-bold text-color1 text-sm  dark:text-gray-100">{questionsCount}</p>
        </div>

        {/* Knowledge Levels */}
        <div>
          <p className="text-md font-bold uppercase tracking-wider text-pri dark:text-pri mb-1">
            KNOWLEDGE LEVELS
          </p>
          <p className="font-bold text-color1 text-sm  dark:text-gray-100">{knowledgeLevels}</p>
        </div>

        {/* Selected */}
        <div>
          <p className="text-md font-bold uppercase tracking-wider text-pri dark:text-pri mb-1">
            SELECTED
          </p>
          <p className="font-bold text-color1 text-sm  dark:text-gray-100 flex items-center gap-1.5">
            {selectedDotColor && (
              <span className={`h-1.5 w-1.5 rounded-full ${selectedDotColor}`} />
            )}
            {selectedQuestions}
          </p>
        </div>
      </div>

      {/* Topics section */}
      {topics && topics.length > 0 && (
        <div className="mt-4 text-xs">
          <p className="text-md font-bold uppercase tracking-wider text-pri dark:text-pri mb-1">
            TOPICS
          </p>
          <div className="space-y-0.5 text-color1 text-sm  dark:text-gray-300">
            {topics.map((t, idx) => (
              <p key={idx}>{t}</p>
            ))}
          </div>
        </div>
      )}

      {/* Footer Window */}
      {(testWindowDate || readOnly) && (
        <div className="mt-5 border-t border-gray-100 dark:border-gray-700/60 pt-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-[#000] dark:text-pri">
            <Calendar className="h-3.5 w-3.5" />
            <span className="text-[10px] text-color1 mt-1 uppercase tracking-wider">
              TEST WINDOW :
            </span>
            {testWindowDate && (
              <span className="font-bold text-[#000] mt-1 dark:text-gray-200">
                {testWindowDate}
              </span>
            )}
            {testWindowTime && (
              <span className="text-pri dark:text-gray-400 mt-1 text-color1  font-normal">
                {testWindowTime}
              </span>
            )}
          </div>

          {readOnly && (
            <span className="rounded bg-gray-100 dark:bg-gray-700 text-color1  px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-pri dark:text-gray-400">
              {readOnlyLabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default McqTestPrepCard;
