import React, { useEffect } from "react";
import { X, Check, HelpCircle } from "lucide-react";

interface OptionItem {
  key?: string;
  text?: string;
  option_key?: string;
  option_text?: string;
  is_correct?: boolean;
}

interface QuestionItem {
  id?: string | number;
  questionNumber?: number;
  question_code?: string;
  code?: string;
  text?: string;
  question?: string;
  options?: OptionItem[];
  explanation?: string;
  knowledge_level?: string;
  level?: string;
  difficulty?: string;
  marks?: number | string;
  unit_number?: number;
  unit?: string;
  topic?: string;
}

export interface PreviewQuestionsModalProps {
  open: boolean;
  onClose: () => void;
  testTitle?: string;
  testCode?: string;
  unitLabel?: string;
  questionSetName?: string;
  questions?: QuestionItem[];
}

export const PreviewQuestionsModal: React.FC<PreviewQuestionsModalProps> = ({
  open,
  onClose,
  testTitle,
  testCode,
  unitLabel,
  questionSetName,
  questions = [],
}) => {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog Box */}
      <div className="relative w-full max-w-3xl max-h-[88vh] flex flex-col rounded-3xl bg-white shadow-2xl dark:bg-gray-900 border border-gray-100 dark:border-gray-800 animate-slideUp">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-4 dark:border-gray-800 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-purple-100 px-2.5 py-0.5 font-mono text-xs font-bold text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                {testCode || "MCQ TEST"}
              </span>
              {questionSetName && (
                <span className="rounded-md bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                  Set: {questionSetName}
                </span>
              )}
            </div>
            <h3 className="mt-1 text-lg font-bold text-gray-900 dark:text-white">
              {testTitle || "Preview Test Questions"}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {unitLabel ? `${unitLabel} • ` : ""}{questions.length} Questions in this assessment
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Questions Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {questions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <HelpCircle className="h-10 w-10 text-gray-300 dark:text-gray-600" />
              <p className="mt-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                No questions assigned to this test yet.
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Select a Question Set or configure question pool in test settings.
              </p>
            </div>
          ) : (
            questions.map((q, idx) => {
              const qNum = q.questionNumber || idx + 1;
              const qText = q.text || q.question || "Question Text";
              const qLevel = q.knowledge_level || q.level || "K2";
              const qDiff = q.difficulty || "Medium";
              const qMarks = q.marks || 2;
              const qOptions = q.options || [];

              return (
                <div
                  key={q.id || idx}
                  className="rounded-2xl border border-gray-200/80 bg-gray-50/50 p-4 dark:border-gray-800 dark:bg-gray-800/40 space-y-3"
                >
                  {/* Top badges */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-600 text-xs font-bold text-white">
                        {qNum}
                      </span>
                      {q.question_code && (
                        <span className="font-mono text-xs font-semibold text-gray-500">
                          {q.question_code}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-purple-100 px-2 py-0.5 text-[11px] font-bold text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                        {qLevel}
                      </span>
                      <span className="rounded-md bg-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-300 capitalize">
                        {qDiff}
                      </span>
                      <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                        {qMarks} Marks
                      </span>
                    </div>
                  </div>

                  {/* Question Text */}
                  <p className="text-sm font-semibold text-gray-900 dark:text-white leading-relaxed">
                    {qText}
                  </p>

                  {/* Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {qOptions.map((opt, oIdx) => {
                      const optKey = opt.key || opt.option_key || String.fromCharCode(65 + oIdx);
                      const optText = opt.text || opt.option_text || String(opt);
                      const isCorrect = Boolean(opt.is_correct);

                      return (
                        <div
                          key={oIdx}
                          className={`flex items-start gap-2.5 rounded-xl border p-2.5 text-xs transition-colors ${
                            isCorrect
                              ? "border-emerald-300 bg-emerald-50 text-emerald-900 font-medium dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200"
                              : "border-gray-200 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                          }`}
                        >
                          <span
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md font-bold text-[11px] ${
                              isCorrect
                                ? "bg-emerald-600 text-white"
                                : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                            }`}
                          >
                            {optKey}
                          </span>
                          <span className="flex-1 min-w-0 pt-0.5">{optText}</span>
                          {isCorrect && (
                            <Check className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation if present */}
                  {q.explanation && (
                    <div className="mt-2 rounded-xl bg-purple-50/60 p-3 text-xs text-purple-900 dark:bg-purple-950/30 dark:text-purple-200 border border-purple-100 dark:border-purple-900/50">
                      <span className="font-bold">Explanation: </span>
                      <span>{q.explanation}</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-100 px-6 py-3.5 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 shrink-0">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Total {questions.length} questions in this set
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-gray-900 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white transition-all"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreviewQuestionsModal;
