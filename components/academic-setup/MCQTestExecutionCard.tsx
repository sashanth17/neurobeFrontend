import React, { useState } from "react";
import {
  Lock,
  Copy,
  Check,
  Users,
  Eye,
  AlertTriangle,
  BarChart2,
  Sliders,
  Settings,
} from "lucide-react";

export type MCQTestStatus =
  | "live"
  | "upcoming"
  | "setup_required"
  | "completed";

export interface MCQTestExecutionItem {
  id: string;
  testCode: string;
  title: string;
  status: MCQTestStatus;
  statusLabel?: string;
  completedTimeAgo?: string;
  unitLabel: string;
  questionsCount: string | number;
  duration: string;
  isReadOnlyDuration?: boolean;
  testWindow: string;
  isPendingWindow?: boolean;
  topics: string;
  secureCode?: string;
  submissionCount?: string;
  classAverage?: string;
  warningNotice?: string;
}

export interface MCQTestExecutionCardProps {
  test: MCQTestExecutionItem;
  onPreviewQuestions?: (test: MCQTestExecutionItem) => void;
  onEditSettings?: (test: MCQTestExecutionItem) => void;
  onConfigureTest?: (test: MCQTestExecutionItem) => void;
  onViewResults?: (test: MCQTestExecutionItem) => void;
  onCopyCode?: (code: string) => void;
}

const MCQTestExecutionCard: React.FC<MCQTestExecutionCardProps> = ({
  test,
  onPreviewQuestions,
  onEditSettings,
  onConfigureTest,
  onViewResults,
  onCopyCode,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    if (onCopyCode) onCopyCode(code);
    setTimeout(() => setCopied(false), 2000);
  };

  // Outer container border styling based on status
  const getCardBorderClass = () => {
    switch (test.status) {
      case "live":
        return "border-[#A7F3D0] dark:border-emerald-800 shadow-xs";
      default:
        return "border-gray-200 dark:border-gray-700";
    }
  };

  // Render Status Badge pill on the top bar
  const renderStatusBadge = () => {
    switch (test.status) {
      case "live":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#A7F3D0] bg-[#ECFDF5] px-3 py-1 text-xs font-semibold text-[#047857] dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
            <span className="h-2 w-2 rounded-full bg-[#10B981] animate-pulse" />
            {test.statusLabel || "• Live Assessment"}
          </span>
        );
      case "upcoming":
        return (
          <span className="inline-flex items-center rounded-full border border-[#BFDBFE] bg-[#EFF6FF] px-3 py-1 text-xs font-semibold text-[#1D4ED8] dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-300">
            {test.statusLabel || "Upcoming Test"}
          </span>
        );
      case "setup_required":
        return (
          <span className="inline-flex items-center rounded-full border border-[#FED7AA] bg-[#FFF7ED] px-3 py-1 text-xs font-semibold text-[#C2410C] dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
            {test.statusLabel || "Access Setup Required"}
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-100 px-3 py-1 text-xs font-semibold text-[#000] dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300">
            {test.statusLabel || "Completed Session"}
          </span>
        );
    }
  };

  return (
    <div
      className={`rounded-2xl border bg-white p-5 shadow-xs transition-all duration-200 hover:shadow-md dark:bg-gray-800 space-y-4 ${getCardBorderClass()}`}
    >
      {/* 1. Header Top Row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-bold text-[#000] dark:bg-gray-700 dark:text-gray-300">
            {test.testCode}
          </span>
          <h3 className="text-base md:text-lg font-bold text-[#000] dark:text-white">
            {test.title}
          </h3>
          {renderStatusBadge()}
        </div>

        {test.completedTimeAgo && (
          <span className="text-xs font-medium text-[#000] dark:text-pri">
            {test.completedTimeAgo}
          </span>
        )}
      </div>

      {/* 2. Middle Gray Details Container */}
      <div className="rounded-xl border border-gray-100 bg-[#F8FAFC] p-4 text-xs md:text-sm text-[#000] dark:border-gray-700/60 dark:bg-gray-700/40 dark:text-gray-300 space-y-3">
        {/* Row 1: Unit, Questions, Duration, Test Window */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 items-center">
          <div className="flex items-center gap-2">
            <span className="text-pri font-medium">Unit:</span>
            <span className="font-bold text-[#000] dark:text-white">
              {test.unitLabel}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-pri font-medium">
              {test.status === "completed" ? "Questions" : "Questions:"}
            </span>
            <span className="font-semibold text-[#000] dark:text-white">
              {test.questionsCount}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-pri font-medium">Test Duration:</span>
            <span className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2.5 py-0.5 text-xs font-bold text-[#000] shadow-2xs dark:border-gray-600 dark:bg-gray-800 dark:text-white">
              {test.duration}
              {test.isReadOnlyDuration && (
                <span className="rounded bg-gray-200 px-1 py-0.2 text-[10px] font-extrabold uppercase text-[#000] dark:bg-gray-700 dark:text-gray-300">
                  READ-ONLY
                </span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-pri font-medium">Test Window:</span>
            <span
              className={`font-semibold ${test.isPendingWindow
                ? "text-amber-600 dark:text-amber-400"
                : "text-[#000] dark:text-white"
                }`}
            >
              {test.testWindow}
            </span>
          </div>
        </div>

        {/* Divider line */}
        <div className="border-t border-gray-200/60 dark:border-gray-700/60" />

        {/* Row 2: Topics */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-pri font-medium shrink-0">
            {test.status === "completed" ? "Topics Covered" : "Topics:"}
          </span>
          <span className="font-medium text-[#000] dark:text-gray-200">
            {test.topics}
          </span>
        </div>
      </div>

      {/* 3. Optional Alert Warning Box (for setup_required) */}
      {test.warningNotice && (
        <div className="flex items-center gap-2.5 rounded-xl border border-amber-200 bg-[#FFFBEB] p-3 text-xs md:text-sm font-medium text-amber-800 dark:border-amber-800/80 dark:bg-amber-950/30 dark:text-amber-300">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <span>{test.warningNotice}</span>
        </div>
      )}

      {/* 4. Bottom Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
        {/* Left Badges Group */}
        <div className="flex flex-wrap items-center gap-3">
          {test.secureCode && (
            <div className="inline-flex items-center gap-2 rounded-xl border border-purple-200 bg-[#F3E8FF] px-3.5 py-1.5 text-xs font-bold text-[#7E22CE] dark:border-purple-800 dark:bg-purple-950/50 dark:text-purple-300">
              <Lock className="h-3.5 w-3.5" />
              <span className="font-bold text-md">Secure Test Code: {test.secureCode}</span>
              <button
                type="button"
                onClick={() => handleCopy(test.secureCode || "")}
                className="ml-0.5 text-purple-600 hover:text-purple-900 dark:text-purple-300 dark:hover:text-white transition-colors"
                title="Copy Code"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          )}

          {test.submissionCount && (
            <div
              className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-semibold ${test.status === "completed"
                ? "bg-purple-50 text-[#5C28CA] border border-purple-200 dark:bg-purple-950/40 dark:border-purple-800 dark:text-purple-300"
                : "bg-[#ECFDF5] text-[#059669] border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300"
                }`}
            >
              <Users className="h-4 w-4" />
              <span className="font-bold text-md">Submission Count: {test.submissionCount}</span>
            </div>
          )}

          {test.classAverage && (
            <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-xs font-semibold text-emerald-600 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
              <BarChart2 className="h-4 w-4 text-emerald-500" />
              <span>Class Average: {test.classAverage}</span>
            </div>
          )}
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-3">
          {/* Main Primary Action Button by Status */}
          {test.status === "live" && (
            <span className="inline-flex items-center gap-2 rounded-xl bg-[#D1FAE5] px-4 py-1.5 text-xs md:text-sm font-semibold text-[#059669] dark:bg-emerald-950/60 dark:text-emerald-300">
              Test In Progress
            </span>
          )}

          {test.status === "upcoming" && (
            <button
              type="button"
              onClick={() => onEditSettings && onEditSettings(test)}
              className="inline-flex items-center gap-2 rounded-xl bg-[#6D28D9] px-4 py-1.5 text-xs md:text-sm font-semibold text-white shadow-xs hover:bg-[#5B21B6] active:scale-[0.99] transition-all dark:bg-purple-600 dark:hover:bg-purple-700"

            >
              Edit Test Settings
            </button>
          )}

          {test.status === "setup_required" && (
            <button
              type="button"
              onClick={() => onConfigureTest && onConfigureTest(test)}
              className="inline-flex items-center gap-2 rounded-xl bg-[#6D28D9] px-4 py-1.5 text-xs md:text-sm font-semibold text-white shadow-xs hover:bg-[#5B21B6] active:scale-[0.99] transition-all dark:bg-purple-600 dark:hover:bg-purple-700"
            >
              Configure Test
            </button>
          )}

          {test.status === "completed" && (
            <button
              type="button"
              onClick={() => onViewResults && onViewResults(test)}
              className="inline-flex items-center gap-2 rounded-xl bg-[#13112E] px-4 py-1.5 text-xs md:text-sm font-semibold text-white shadow-xs hover:bg-[#1E1B4B] active:scale-[0.99] transition-all dark:bg-gray-700 dark:hover:bg-gray-600"
            >
              <BarChart2 className="h-4 w-4" />
              <span>View Results</span>
            </button>
          )}

          {/* Secondary Action Button: Preview Questions */}
          <button
            type="button"
            onClick={() => onPreviewQuestions && onPreviewQuestions(test)}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-1.5 text-xs md:text-sm font-semibold text-[#000] shadow-2xs hover:bg-gray-50 hover:border-gray-300 active:scale-[0.99] transition-all dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            <Eye className="h-4 w-4 text-pri" />
            <span>Preview Questions</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MCQTestExecutionCard;
