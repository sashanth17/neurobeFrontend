import React, { useEffect } from "react";
import { X } from "lucide-react";
import QuestionBankPreviewCard, {
  QuestionBankPreviewCardProps,
} from "./QuestionBankPreviewCard";

export interface QuestionBankPreviewModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  questions?: QuestionBankPreviewCardProps[];
}

const QuestionBankPreviewModal: React.FC<QuestionBankPreviewModalProps> = ({
  open,
  onClose,
  title = "Network Models & Physical Layer Quiz",
  subtitle = "Unit 1: Physical & Network Models • 5 Questions Selected",
  questions = [],
}) => {
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="relative flex max-h-[92vh] w-full max-w-3xl flex-col rounded-3xl bg-white shadow-2xl dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between border-b border-gray-100 px-8 py-5 dark:border-gray-800">
          <div>
            <h3 className="text-xl font-bold text-[#000] dark:text-white">
              {title}
            </h3>
            <p className="mt-1 text-xs font-semibold text-pri dark:text-gray-400">
              {subtitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-gray-200 p-1.5 text-[#000] hover:bg-gray-100 hover:text-[#000] dark:border-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div
          className="flex-1 overflow-y-auto px-5 py-4 space-y-4"
          style={{ scrollbarWidth: "none" }}
        >
          {questions.map((q, idx) => (
            <QuestionBankPreviewCard
              key={q.id || idx}
              questionNumber={q.questionNumber || idx + 1}
              question={q.question}
              level={q.level}
              co={q.co}
              options={q.options}
            />
          ))}
        </div>

        {/* Modal Footer */}
        <div className="flex shrink-0 items-center justify-end border-t border-gray-100 px-8 py-4 bg-gray-50/50 rounded-b-3xl dark:border-gray-800 dark:bg-gray-900">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[#0f172a] px-7 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#1e293b] transition"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuestionBankPreviewModal;
