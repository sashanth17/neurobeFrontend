import React from "react";
import {
  Sparkles,
  Zap,
  Target,
  BookOpen,
  ChevronDown,
  Check,
  CheckCircle2,
  Edit3,
  Eye,
  Archive,
  Trash2,
  Plus,
  FileCheck2,
  X,
} from "lucide-react";
import { MCQQuestion, normalizeMCQ } from "./types";

interface QuestionReviewPoolProps {
  currentQuestions: MCQQuestion[];
  displayedQuestions: MCQQuestion[];
  selectedBannerFilter: string;
  onSelectBannerFilter: (filter: any) => void;
  recentQuestionIds: string[];
  expandedQuestionIds: string[];
  onToggleExpandOne: (id: string) => void;
  onToggleExpandAll: () => void;
  onToggleApprove: (id: string) => void;
  onToggleArchive: (id: string) => void;
  onEditQuestion: (q: MCQQuestion) => void;
  onViewQuestion: (q: MCQQuestion) => void;
  onDeleteQuestion: (id: string) => void;
  onApproveAll: () => void;
  onCreateQuestionSet: () => void;
  isGeneratingAI: boolean;
}

export const QuestionReviewPool: React.FC<QuestionReviewPoolProps> = ({
  currentQuestions,
  displayedQuestions,
  selectedBannerFilter,
  onSelectBannerFilter,
  recentQuestionIds,
  expandedQuestionIds,
  onToggleExpandOne,
  onToggleExpandAll,
  onToggleApprove,
  onToggleArchive,
  onEditQuestion,
  onViewQuestion,
  onDeleteQuestion,
  onApproveAll,
  onCreateQuestionSet,
  isGeneratingAI,
}) => {
  const isAllExpanded =
    (expandedQuestionIds || []).length === displayedQuestions.length && displayedQuestions.length > 0;

  return (
    <div id="questions-section" className="pt-2">
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-gray-955 dark:text-white flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-indigo-600" />
            <span>Question Studio & Review Pool</span>
            <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
              {displayedQuestions.length} Questions
            </span>
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Review question details, expand dropdown to inspect options & explanation, or edit metadata.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Recent vs All Quick Toggle */}
          <div className="flex rounded-xl border border-gray-200 bg-white p-1 text-xs dark:border-gray-800 dark:bg-gray-800">
            <button
              type="button"
              onClick={() => onSelectBannerFilter("recent")}
              className={`rounded-lg px-3 py-1 font-semibold transition-colors ${
                selectedBannerFilter === "recent"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              }`}
            >
              ⚡ Recent Batch ({recentQuestionIds?.length > 0 ? recentQuestionIds.length : Math.min(10, currentQuestions.length)})
            </button>
            <button
              type="button"
              onClick={() => onSelectBannerFilter("all")}
              className={`rounded-lg px-3 py-1 font-semibold transition-colors ${
                selectedBannerFilter === "all"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              }`}
            >
              📚 All History ({currentQuestions.length})
            </button>
          </div>

          <button
            type="button"
            onClick={onToggleExpandAll}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-300 transition"
          >
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isAllExpanded ? "rotate-180" : ""}`} />
            <span>{isAllExpanded ? "Collapse All" : "Expand All"}</span>
          </button>

          {selectedBannerFilter !== "recent" && selectedBannerFilter !== "all" && (
            <button
              type="button"
              onClick={() => onSelectBannerFilter("all")}
              className="flex items-center gap-1 rounded-xl border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100"
            >
              <span>Reset Filter ({selectedBannerFilter})</span>
              <X className="h-3.5 w-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={onCreateQuestionSet}
            className="flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50/80 px-3 py-2 text-xs font-bold text-indigo-700 transition hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create Question Set</span>
          </button>

          <button
            type="button"
            onClick={onApproveAll}
            className="flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
          >
            <Check className="h-3.5 w-3.5" />
            <span>Approve All to Bank</span>
          </button>
        </div>
      </div>

      {displayedQuestions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-12 text-center dark:border-gray-800 dark:bg-gray-900">
          <FileCheck2 className="h-8 w-8 text-gray-300 dark:text-gray-600 mb-2" />
          <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">
            No questions found matching "{selectedBannerFilter}".
          </p>
          <button
            type="button"
            onClick={() => onSelectBannerFilter("all")}
            className="mt-3 text-xs font-bold text-indigo-600 hover:underline"
          >
            Show All Course Questions ({currentQuestions.length})
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedQuestions.map((q, idx) => {
            const question = normalizeMCQ(q, idx);
            const isApproved = (question.status || "").toLowerCase() === "approved";
            const isArchived = (question.status || "").toLowerCase() === "archived";
            const isDraft =
              (question.status || "").toLowerCase() === "draft" ||
              (question.status || "").toLowerCase() === "drafted";
            const isExpanded = (expandedQuestionIds || []).includes(question.id);

            return (
              <div
                key={question.id}
                className={`group relative overflow-hidden rounded-2xl border transition-all duration-200 bg-white shadow-xs hover:shadow-md dark:bg-gray-900 ${
                  isApproved
                    ? "border-emerald-200/90 dark:border-emerald-900/50 hover:border-emerald-300"
                    : isArchived
                    ? "border-purple-300 dark:border-purple-800/80 hover:border-purple-400 bg-purple-50/20 dark:bg-purple-950/10"
                    : "border-amber-200/90 dark:border-amber-900/50 hover:border-amber-300"
                }`}
              >
                {/* Left vertical accent bar */}
                <div
                  className={`absolute left-0 top-0 bottom-0 w-1.5 transition-colors ${
                    isApproved ? "bg-emerald-500" : isArchived ? "bg-purple-600" : "bg-amber-500"
                  }`}
                />

                {/* Summary Header */}
                <div className="p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3.5 dark:border-slate-800">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Question Number */}
                      <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-slate-900 text-xs font-black text-white shadow-xs dark:bg-slate-100 dark:text-slate-900">
                        #{idx + 1}
                      </span>

                      {/* Question Code */}
                      <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-300 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                        {question.code}
                      </span>

                      {/* Knowledge Level */}
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-purple-50 px-2.5 py-1 text-xs font-bold text-purple-700 border border-purple-100 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900/50">
                        <Zap className="h-3 w-3 text-purple-500" />
                        {question.level}
                      </span>

                      {/* Course Outcome */}
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 border border-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900/50">
                        <Target className="h-3 w-3 text-indigo-500" />
                        {question.co}
                      </span>

                      {/* Unit Name */}
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 border border-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/50">
                        <BookOpen className="h-3 w-3 text-blue-500 shrink-0" />
                        <span>{question.unit}</span>
                      </span>

                      {/* Subunit / Topic Name */}
                      {question.topic && (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 border border-slate-200/70 dark:bg-slate-800 dark:text-slate-300">
                          <span>{question.topic}</span>
                          {question.subtopic && (
                            <>
                              <span className="text-slate-400">›</span>
                              <span className="text-slate-600 dark:text-slate-400">{question.subtopic}</span>
                            </>
                          )}
                        </span>
                      )}

                      {/* Marks */}
                      <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300">
                        {question.marks} {Number(question.marks) === 1 ? "Mark" : "Marks"}
                      </span>

                      {/* Difficulty with color dot */}
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold border ${
                          (question.difficulty || "").toLowerCase() === "easy"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300"
                            : (question.difficulty || "").toLowerCase() === "hard"
                            ? "bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300"
                            : "bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            (question.difficulty || "").toLowerCase() === "easy"
                              ? "bg-emerald-500"
                              : (question.difficulty || "").toLowerCase() === "hard"
                              ? "bg-rose-500"
                              : "bg-amber-500"
                          }`}
                        />
                        {question.difficulty}
                      </span>
                    </div>

                    {/* Right: Status badge & Dropdown chevron toggle button */}
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold shadow-2xs border ${
                          isApproved
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300"
                            : isArchived
                            ? "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/70 dark:text-purple-200 dark:border-purple-700"
                            : isDraft
                            ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300"
                            : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300"
                        }`}
                      >
                        <span
                          className={`h-2 w-2 rounded-full ${
                            isApproved
                              ? "bg-emerald-500 animate-pulse"
                              : isArchived
                              ? "bg-purple-600"
                              : isDraft
                              ? "bg-amber-500"
                              : "bg-blue-500"
                          }`}
                        />
                        {isApproved
                          ? "Approved"
                          : isArchived
                          ? "Archived"
                          : isDraft
                          ? "Drafted"
                          : "Need Review"}
                      </span>

                      <button
                        type="button"
                        onClick={() => onToggleExpandOne(question.id)}
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
                  <div className="mt-3.5 cursor-pointer" onClick={() => onToggleExpandOne(question.id)}>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-relaxed tracking-tight hover:text-indigo-600 transition-colors">
                      {question.question || question.text}
                    </h3>
                  </div>

                  {/* Expanded Dropdown Content */}
                  {isExpanded && (
                    <div className="mt-5 border-t border-slate-100 pt-5 dark:border-slate-800">
                      {/* Options Grid */}
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {question.options.map((opt) => (
                          <div
                            key={opt.key}
                            className={`relative flex items-center gap-3.5 rounded-xl p-3.5 transition-all duration-150 ${
                              opt.isCorrect
                                ? "border-2 border-emerald-500 bg-gradient-to-r from-emerald-50 to-teal-50/50 shadow-xs dark:from-emerald-950/40 dark:to-teal-950/20 dark:border-emerald-500"
                                : "border border-slate-200 bg-slate-50/40 hover:bg-slate-50 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-800/30 dark:hover:bg-slate-800/60"
                            }`}
                          >
                            <span
                              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-black transition-colors ${
                                opt.isCorrect
                                  ? "bg-emerald-600 text-white shadow-xs"
                                  : "border border-slate-200 bg-white text-slate-700 shadow-2xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                              }`}
                            >
                              {opt.key}
                            </span>
                            <span
                              className={`flex-1 text-xs sm:text-sm leading-snug ${
                                opt.isCorrect
                                  ? "font-bold text-emerald-950 dark:text-emerald-100"
                                  : "font-medium text-slate-700 dark:text-slate-300"
                              }`}
                            >
                              {opt.text}
                            </span>
                            {opt.isCorrect && (
                              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-xs shrink-0">
                                <Check className="h-3 w-3 stroke-[3]" />
                                <span>Correct</span>
                              </span>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Explanation & Rationale */}
                      {question.explanation && (
                        <div className="mt-4 flex items-start gap-3 rounded-xl border border-indigo-100 bg-gradient-to-r from-indigo-50/70 via-sky-50/40 to-white p-4 dark:border-indigo-900/40 dark:bg-indigo-950/20">
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
                            <Sparkles className="h-3.5 w-3.5" />
                          </div>
                          <div className="space-y-0.5 flex-1">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-300 block">
                              Explanation & Rationale
                            </span>
                            <p className="text-xs sm:text-[13px] text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
                              {question.explanation}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Action Footer */}
                      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3.5 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onToggleApprove(question.id)}
                            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all shadow-xs active:scale-98 ${
                              isApproved
                                ? "border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
                                : "border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300"
                            }`}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>{isApproved ? "Move to Draft" : "Approve to Bank"}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onEditQuestion(question)}
                            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition active:scale-98"
                          >
                            <Edit3 className="h-3.5 w-3.5 text-slate-500" />
                            <span>Edit Question</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onViewQuestion(question)}
                            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition active:scale-98"
                          >
                            <Eye className="h-3.5 w-3.5 text-slate-500" />
                            <span>View Details</span>
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* High-visibility Archive button with distinct vibrant violet/purple styling */}
                          <button
                            type="button"
                            onClick={() => onToggleArchive(question.id)}
                            className={`flex items-center gap-1.5 rounded-xl border-2 px-4 py-2 text-xs font-extrabold transition-all shadow-sm active:scale-98 ${
                              isArchived
                                ? "border-purple-600 bg-purple-600 text-white hover:bg-purple-700 shadow-purple-200"
                                : "border-purple-500 bg-purple-50 text-purple-700 hover:bg-purple-100 hover:border-purple-600 dark:border-purple-400 dark:bg-purple-950/70 dark:text-purple-200"
                            }`}
                          >
                            <Archive className="h-3.5 w-3.5 stroke-[2.5]" />
                            <span>{isArchived ? "Unarchive" : "Archive Question"}</span>
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => onDeleteQuestion(question.id)}
                            className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300 transition active:scale-98"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {currentQuestions.length === 0 && !isGeneratingAI && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center dark:border-gray-800 dark:bg-gray-900 mt-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/40">
            <Sparkles className="h-8 w-8 text-indigo-500" />
          </div>
          <h4 className="mt-4 text-sm font-bold text-gray-700 dark:text-gray-300">No questions generated yet</h4>
          <p className="mt-1 max-w-xs text-xs text-gray-500 dark:text-gray-400">
            Select your topics and configure the Bloom's matrix above, then click{" "}
            <strong>Generate Questions Now</strong>.
          </p>
        </div>
      )}
    </div>
  );
};

export default QuestionReviewPool;
