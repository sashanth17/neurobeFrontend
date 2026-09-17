import React, { useState } from "react";
import { AlertTriangle, Edit3 } from "lucide-react";

export interface TotalNeedsReviewCardProps {
  paperTotal?: number;
  questionTotal?: number;
  initialOption?: "paper" | "question" | "custom";
  onSave?: (finalTotal: number, selectedOption: string) => void;
  className?: string;
}

export const TotalNeedsReviewCard: React.FC<TotalNeedsReviewCardProps> = ({
  paperTotal = 43,
  questionTotal = 45,
  initialOption = "question",
  onSave,
  className = "",
}) => {
  const [selectedOption, setSelectedOption] = useState<
    "paper" | "question" | "custom"
  >(initialOption);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [customValue, setCustomValue] = useState<number>(paperTotal);

  const handleSelectPaper = () => {
    setSelectedOption("paper");
    setIsEditing(false);
  };

  const handleSelectQuestion = () => {
    setSelectedOption("question");
    setIsEditing(false);
  };

  const handleEditClick = () => {
    setSelectedOption("custom");
    setIsEditing(true);
  };

  const handleSave = () => {
    let finalVal = paperTotal;
    if (selectedOption === "paper") finalVal = paperTotal;
    else if (selectedOption === "question") finalVal = questionTotal;
    else if (selectedOption === "custom") finalVal = Number(customValue) || paperTotal;

    setIsEditing(false);
    if (onSave) {
      onSave(finalVal, selectedOption);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  return (
    <div
      className={`rounded-2xl border border-amber-200/90 bg-[#FFF9DC] p-5 shadow-2xs dark:border-amber-900/60 dark:bg-amber-950/40 ${className}`}
    >
      {/* Top Warning Title */}
      <div className="mb-1.5 flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 shrink-0 text-amber-700 dark:text-amber-400" />
        <h4 className="text-xs font-bold uppercase tracking-wide text-amber-800 dark:text-amber-300 sm:text-sm">
          TOTAL NEEDS REVIEW
        </h4>
      </div>

      {/* Subtitle Message */}
      <p className="mb-4 text-xs font-medium text-amber-900/90 dark:text-amber-200 sm:text-sm">
        The total written on the paper is{" "}
        <span className="font-bold">{paperTotal}</span>, but the question marks
        add up to <span className="font-bold">{questionTotal}</span>.
      </p>

      {/* Options Row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Option 1: Keep Paper Total */}
        <button
          type="button"
          onClick={handleSelectPaper}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all sm:text-sm ${
            selectedOption === "paper"
              ? "border-2 border-purple-500 bg-purple-50 text-purple-700 shadow-2xs dark:border-purple-400 dark:bg-purple-950/60 dark:text-purple-300"
              : "border border-amber-300/70 bg-white/70 text-gray-700 hover:bg-white dark:border-amber-800 dark:bg-gray-800 dark:text-gray-200"
          }`}
        >
          <span
            className={`flex h-4 w-4 items-center justify-center rounded-full border ${
              selectedOption === "paper"
                ? "border-purple-600 bg-purple-600"
                : "border-gray-400 bg-white"
            }`}
          >
            {selectedOption === "paper" && (
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
            )}
          </span>
          <span>Keep Paper Total — {paperTotal}</span>
        </button>

        {/* Option 2: Use Question Total */}
        <button
          type="button"
          onClick={handleSelectQuestion}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all sm:text-sm ${
            selectedOption === "question"
              ? "border-2 border-purple-500 bg-purple-50 text-purple-700 shadow-2xs dark:border-purple-400 dark:bg-purple-950/60 dark:text-purple-300"
              : "border border-amber-300/70 bg-white/70 text-gray-700 hover:bg-white dark:border-amber-800 dark:bg-gray-800 dark:text-gray-200"
          }`}
        >
          <span
            className={`flex h-4 w-4 items-center justify-center rounded-full border ${
              selectedOption === "question"
                ? "border-purple-600 bg-purple-600"
                : "border-gray-400 bg-white"
            }`}
          >
            {selectedOption === "question" && (
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
            )}
          </span>
          <span>Use Question Total — {questionTotal}</span>
        </button>

        {/* Option 3: Edit Final Total (only shown when not editing) */}
        {!isEditing && (
          <button
            type="button"
            onClick={handleEditClick}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all sm:text-sm ${
              selectedOption === "custom"
                ? "border-2 border-purple-500 bg-purple-50 text-purple-700 shadow-2xs dark:border-purple-400 dark:bg-purple-950/60 dark:text-purple-300"
                : "border border-amber-300/70 bg-white/70 text-gray-700 hover:bg-white dark:border-amber-800 dark:bg-gray-800 dark:text-gray-200"
            }`}
          >
            <Edit3 className="h-4 w-4" />
            <span>Edit Final Total</span>
          </button>
        )}
      </div>

      {/* Edit Row (shown when Edit Final Total is clicked) */}
      {isEditing && (
        <div className="mt-4 flex items-center gap-3 pt-2">
          <input
            type="number"
            value={customValue}
            onChange={(e) => setCustomValue(Number(e.target.value))}
            className="w-20 rounded-xl border border-gray-300 bg-white p-2.5 text-sm font-bold text-gray-900 shadow-2xs focus:border-purple-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
          <button
            type="button"
            onClick={handleSave}
            className="rounded-xl bg-[#111625] px-5 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-slate-800 sm:text-sm"
          >
            Save
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="px-3 py-2 text-xs font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 sm:text-sm"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

export default TotalNeedsReviewCard;
