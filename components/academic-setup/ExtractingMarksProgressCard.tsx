import React from "react";
import { FileText, CheckCircle2, ArrowRight } from "lucide-react";

export interface ExtractingMarksProgressCardProps {
  title?: string;
  subtitle?: string;
  extractedItems?: string[];
  progressPercent?: number;
  progressStatusText?: string;
  disclaimerText?: string;
  onNext?: () => void;
  nextBtnLabel?: string;
  className?: string;
}

const DEFAULT_ITEMS = [
  "Register Number",
  "Question-wise Marks",
  "Section Marks",
  "Total Marks",
  "Confidence & Consistency Check",
];

export const ExtractingMarksProgressCard: React.FC<
  ExtractingMarksProgressCardProps
> = ({
  title = "Extracting Marks",
  subtitle = "Reading evaluator-written marks from 40 student answer sheets...",
  extractedItems = DEFAULT_ITEMS,
  progressPercent = 80,
  progressStatusText = "Reading evaluator marks",
  disclaimerText = "The system only reads marks written on the evaluated answer sheet. If any value is unclear or inconsistent, it is flagged as Needs Review.",
  onNext,
  nextBtnLabel = "Next",
  className = "",
}) => {
  return (
    <div
      className={`relative mx-auto max-w-2xl rounded-3xl border border-gray-100 bg-white p-6 text-center shadow-xs dark:border-gray-800 dark:bg-gray-900 sm:p-10 ${className}`}
    >
      {/* Top Right Next Button */}
      {onNext && (
        <div className="absolute right-5 top-5">
          <button
            type="button"
            onClick={onNext}
            className="create-btn inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold sm:text-sm"
          >
            <span>{nextBtnLabel}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}
      {/* Top Document Icon */}
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-color2 dark:bg-purple-950/40 dark:text-purple-300 mx-auto">
        <FileText className="h-6 w-6" />
      </div>

      {/* Main Title & Subtitle */}
      <h3 className="mb-1 text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
        {title}
      </h3>
      <p className="mb-6 text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
        {subtitle}
      </p>

      {/* Data Extracted Checklist Card */}
      <div className="mb-6 w-full rounded-2xl border border-gray-100 bg-[#F8FAFC] p-5 text-left dark:border-gray-800 dark:bg-gray-800/40 sm:p-6">
        <p className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-800 dark:text-gray-200">
          DATA EXTRACTED:
        </p>

        <div className="space-y-3">
          {extractedItems.map((item, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 shrink-0 fill-emerald-800 text-white dark:fill-emerald-600" />
              <span className="text-xs font-semibold text-slate-700 dark:text-gray-200 sm:text-sm">
                {item}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Progress Bar & Stats */}
      <div className="w-full">
        <div className="mb-2 h-2.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
          <div
            className="h-full rounded-full bg-color2 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs font-medium text-gray-500 dark:text-gray-400">
          <span>{progressStatusText}</span>
          <span className="font-bold text-gray-800 dark:text-gray-200">
            {progressPercent}%
          </span>
        </div>
      </div>

      {/* Bottom Disclaimer */}
      <p className="mt-8 text-center text-xs font-semibold text-emerald-700 dark:text-emerald-400 sm:text-sm">
        {disclaimerText}
      </p>
    </div>
  );
};

export default ExtractingMarksProgressCard;
