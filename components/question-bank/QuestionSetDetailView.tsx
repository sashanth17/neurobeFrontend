import React, { useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Layers,
  Sparkles,
  Zap,
  Target,
  ChevronDown,
  Check,
  Edit3,
  Eye,
  Trash2,
  FileCheck2,
  Plus,
} from "lucide-react";
import { QuestionSetItem } from "./QuestionSetsList";

interface QuestionSetDetailViewProps {
  set: QuestionSetItem;
  questions: any[];
  onBack: () => void;
  onEditQuestion: (question: any) => void;
  onViewQuestion: (question: any) => void;
  onRemoveQuestionFromSet?: (questionId: string) => void;
  onEditSetName?: (set: QuestionSetItem) => void;
  onOpenAddQuestions?: () => void;
  onDeleteSet?: (setId: string) => void;
}

export const QuestionSetDetailView: React.FC<QuestionSetDetailViewProps> = ({
  set,
  questions = [],
  onBack,
  onEditQuestion,
  onViewQuestion,
  onRemoveQuestionFromSet,
  onEditSetName,
  onOpenAddQuestions,
  onDeleteSet,
}) => {
  const [expandedIds, setExpandedIds] = useState<string[]>([]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleExpandAll = () => {
    if (expandedIds.length === questions.length) {
      setExpandedIds([]);
    } else {
      setExpandedIds(questions.map((q) => q.id));
    }
  };

  const totalMarks = questions.reduce((sum, q) => sum + (Number(q.marks) || 2), 0);

  return (
    <div className="space-y-6">
      {/* Top Navigation & Set Banner */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <button
              type="button"
              onClick={onBack}
              className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 shadow-2xs transition"
              title="Back to Question Sets"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300">
                  {questions.length} {questions.length === 1 ? "Question" : "Questions"}
                </span>

                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {totalMarks} Marks Total
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  {set.name || set.title || "Question Set"}
                </h2>
                {onEditSetName && (
                  <button
                    type="button"
                    onClick={() => onEditSetName(set)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800 dark:hover:text-indigo-400 transition"
                    title="Rename Question Set"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                )}
              </div>

              {set.description && (
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
                  {set.description}
                </p>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {onOpenAddQuestions && (
              <button
                type="button"
                onClick={onOpenAddQuestions}
                className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition active:scale-98"
              >
                <Plus className="h-4 w-4" />
                <span>Add Questions</span>
              </button>
            )}

            <button
              type="button"
              onClick={toggleExpandAll}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition"
            >
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expandedIds.length === questions.length && questions.length > 0 ? "rotate-180" : ""}`} />
              <span>{expandedIds.length === questions.length && questions.length > 0 ? "Collapse All" : "Expand All"}</span>
            </button>

            {onDeleteSet && (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Are you sure you want to delete the question set "${set.name || set.title}"?`)) {
                    onDeleteSet(set.id);
                  }
                }}
                className="rounded-xl border border-rose-200 bg-rose-50 p-2 text-rose-600 hover:bg-rose-100 transition"
                title="Delete Question Set"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Questions List */}
      {questions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white py-16 text-center dark:border-slate-800 dark:bg-slate-900">
          <FileCheck2 className="h-10 w-10 text-slate-300 mb-3" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
            No questions linked to this set
          </h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm">
            Questions might have been deleted or not yet assigned.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((q, idx) => {
            const isExpanded = expandedIds.includes(q.id);
            const isApproved = (q.status || "").toLowerCase() === "approved";
            const options: any[] = q.options || [];

            return (
              <div
                key={q.id}
                className="group relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs hover:shadow-md dark:border-slate-800 dark:bg-slate-900 transition-all duration-200"
              >
                {/* Left accent bar */}
                <div
                  className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                    isApproved ? "bg-emerald-500" : "bg-amber-500"
                  }`}
                />

                {/* Collapsed / Summary Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3.5 dark:border-slate-800">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Question Number in set */}
                    <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-slate-900 text-xs font-black text-white shadow-xs dark:bg-slate-100 dark:text-slate-900">
                      #{idx + 1}
                    </span>

                    {/* Question Code */}
                    <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-300 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                      {q.code || q.question_code}
                    </span>

                    {/* Knowledge Level */}
                    {q.level && (
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-purple-50 px-2.5 py-1 text-xs font-bold text-purple-700 border border-purple-100 dark:bg-purple-950/40 dark:text-purple-300">
                        <Zap className="h-3 w-3 text-purple-500" />
                        {q.level}
                      </span>
                    )}

                    {/* Course Outcome */}
                    {q.co && (
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 border border-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300">
                        <Target className="h-3 w-3 text-indigo-500" />
                        {q.co}
                      </span>
                    )}

                    {/* Unit */}
                    {q.unit && (
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 border border-blue-100 dark:bg-blue-950/40 dark:text-blue-300">
                        <BookOpen className="h-3 w-3 text-blue-500 shrink-0" />
                        <span>{q.unit}</span>
                      </span>
                    )}

                    {/* Subunit / Topic if available */}
                    {q.topic && (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 border border-slate-200/70 dark:bg-slate-800 dark:text-slate-300">
                        <span>{q.topic}</span>
                        {q.subtopic && (
                          <>
                            <span className="text-slate-400">›</span>
                            <span className="text-slate-600 dark:text-slate-400">{q.subtopic}</span>
                          </>
                        )}
                      </span>
                    )}

                    {/* Marks */}
                    <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300">
                      {q.marks || 2} Marks
                    </span>
                  </div>

                  {/* Right: Dropdown toggle button */}
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold shadow-2xs border ${
                        isApproved
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      <span
                        className={`h-2 w-2 rounded-full ${
                          isApproved ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                        }`}
                      />
                      {isApproved ? "Approved" : "Draft"}
                    </span>

                    <button
                      type="button"
                      onClick={() => toggleExpand(q.id)}
                      className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                        isExpanded
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      }`}
                    >
                      <span>{isExpanded ? "Hide Details" : "View Options & Rationale"}</span>
                      <ChevronDown
                        className={`h-4 w-4 transition-transform duration-200 ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Question Statement */}
                <div className="mt-3.5 cursor-pointer" onClick={() => toggleExpand(q.id)}>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-relaxed tracking-tight hover:text-indigo-600 transition-colors">
                    {q.question || q.text}
                  </h3>
                </div>

                {/* Expanded Options, Explanation, Actions */}
                {isExpanded && (
                  <div className="mt-5 border-t border-slate-100 pt-5 dark:border-slate-800 space-y-4">
                    {/* Options Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {options.map((opt: any, oIdx: number) => {
                        const isCorrect = opt.isCorrect === true || opt.is_correct === true;
                        const key = opt.key || (oIdx === 0 ? "A" : oIdx === 1 ? "B" : oIdx === 2 ? "C" : "D");

                        return (
                          <div
                            key={oIdx}
                            className={`flex items-center gap-3.5 rounded-xl p-3.5 transition-all ${
                              isCorrect
                                ? "border-2 border-emerald-500 bg-gradient-to-r from-emerald-50 to-teal-50/50 shadow-xs dark:from-emerald-950/40 dark:to-teal-950/20"
                                : "border border-slate-200 bg-slate-50/40 dark:border-slate-800 dark:bg-slate-800/30"
                            }`}
                          >
                            <span
                              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-black ${
                                isCorrect
                                  ? "bg-emerald-600 text-white shadow-xs"
                                  : "border border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                              }`}
                            >
                              {key}
                            </span>
                            <span
                              className={`flex-1 text-xs sm:text-sm ${
                                isCorrect
                                  ? "font-bold text-emerald-950 dark:text-emerald-100"
                                  : "font-medium text-slate-700 dark:text-slate-300"
                              }`}
                            >
                              {opt.text || opt.option}
                            </span>
                            {isCorrect && (
                              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-0.5 text-[10px] font-black uppercase text-white shadow-xs shrink-0">
                                <Check className="h-3 w-3 stroke-[3]" />
                                <span>Correct</span>
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation */}
                    {q.explanation && (
                      <div className="flex items-start gap-3 rounded-xl border border-indigo-100 bg-gradient-to-r from-indigo-50/70 via-sky-50/40 to-white p-4 dark:border-indigo-900/40 dark:bg-indigo-950/20">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
                          <Sparkles className="h-3.5 w-3.5" />
                        </div>
                        <div className="space-y-0.5 flex-1">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-300 block">
                            Explanation & Rationale
                          </span>
                          <p className="text-xs sm:text-[13px] text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
                            {q.explanation}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Action Footer */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3.5 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onEditQuestion(q)}
                          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition"
                        >
                          <Edit3 className="h-3.5 w-3.5 text-slate-500" />
                          <span>Edit Question</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onViewQuestion(q)}
                          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition"
                        >
                          <Eye className="h-3.5 w-3.5 text-slate-500" />
                          <span>View Details</span>
                        </button>
                      </div>

                      {onRemoveQuestionFromSet && (
                        <button
                          type="button"
                          onClick={() => onRemoveQuestionFromSet(q.id)}
                          className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300 transition"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Remove from Set</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default QuestionSetDetailView;
