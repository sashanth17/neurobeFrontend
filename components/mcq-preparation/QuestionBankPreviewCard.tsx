import React from "react";

export interface PreviewQuestionOption {
  key: string;
  text: string;
  isCorrect?: boolean;
}

export interface QuestionBankPreviewCardProps {
  id?: string;
  questionNumber: number;
  question: string;
  level?: string;
  co?: string;
  options: PreviewQuestionOption[];
  className?: string;
}

const QuestionBankPreviewCard: React.FC<QuestionBankPreviewCardProps> = ({
  questionNumber,
  question,
  level = "K1",
  co = "CO1",
  options,
  className = "",
}) => {
  return (
    <div
      className={`rounded-2xl border border-gray-200/80 bg-white p-3 shadow-sm dark:border-gray-800 dark:bg-gray-800/80 ${className}`}
    >
      {/* Top Header Row */}
      <div className="flex items-center justify-between">
        <h4 className="text-base font-bold text-[#000] dark:text-white">
          Question {questionNumber}
        </h4>
        <div className="flex items-center gap-2">
          {level && (
            <span className="rounded-md bg-blue-50/80 dark:bg-blue-950/60 px-2.5 py-0.5 text-xs font-bold text-blue-600 dark:text-blue-400">
              {level}
            </span>
          )}
          {co && (
            <span className="rounded-md bg-purple-50/80 dark:bg-purple-950/60 px-2.5 py-0.5 text-xs font-bold text-purple-600 dark:text-purple-400">
              {co}
            </span>
          )}
        </div>
      </div>

      {/* Question Text */}
      <p className="mt-1.5 text-sm font-bold text-[#000] dark:text-white leading-snug">
        {question}
      </p>

      {/* Options Grid (2 Columns) */}
      <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {options.map((opt) => (
          <div
            key={opt.key}
            className={`rounded-xl border px-4 py-2 text-sm font-semibold transition flex items-start gap-2 ${opt.isCorrect
              ? "border-emerald-500 bg-emerald-50/60 text-emerald-800 font-bold dark:border-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300"
              : "border-gray-200 bg-white text-[#000] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
              }`}
          >
            <span className="font-bold">{opt.key}.</span>
            <span>{opt.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuestionBankPreviewCard;
