import React, { useState } from "react";
import {
  ChevronDown,
  Check,
  Archive,
  BookOpen,
  Target,
  Zap,
  Sparkles,
  Edit3,
  Eye,
  CheckCircle2,
  Trash2,
} from "lucide-react";

export interface TagItem {
  label: string;
}

export interface SpecialTag {
  label: string;
  color?: "green" | "orange" | "gray";
}

export interface QuestionOption {
  key?: string;
  text: string;
  isCorrect?: boolean;
  is_correct?: boolean;
}

export interface QuestionDetailCardProps {
  id: string;
  code?: string;
  questionNumber?: number | string;
  question: string;
  text?: string;
  unit: string;
  topic: string;
  subtopic?: string;
  level?: string;
  knowledge_level?: string;
  co?: string;
  course_outcome?: string;
  marks?: string | number;
  difficulty?: string;
  options?: (QuestionOption | string)[];
  explanation?: string;
  tags?: (string | TagItem)[];
  specialTag?: SpecialTag;
  status: string;
  onView?: () => void;
  onEdit?: () => void;
  onMarkAsReviewed?: () => void;
  onApprove?: () => void;
  onToggleArchive?: () => void;
  onDelete?: () => void;
}

const QuestionDetailCard: React.FC<QuestionDetailCardProps> = ({
  id,
  code,
  questionNumber,
  question,
  text,
  unit,
  topic,
  subtopic,
  level,
  knowledge_level,
  co,
  course_outcome,
  marks,
  difficulty,
  options = [],
  explanation,
  tags = [],
  specialTag,
  status,
  onView,
  onEdit,
  onMarkAsReviewed,
  onApprove,
  onToggleArchive,
  onDelete,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const statusNorm = (status || "").toLowerCase();
  const isApproved = statusNorm === "approved";
  const isArchived = statusNorm === "archived";
  const isDraft = statusNorm === "draft" || statusNorm === "drafted";
  const isReview = statusNorm === "review" || statusNorm === "need review" || (!isApproved && !isArchived && !isDraft);

  const kLevel = level || knowledge_level || "";
  const coLevel = co || course_outcome || "";
  const questionStatement = question || text || "";
  const displayCode = code || id;

  // Normalize options
  const normalizedOptions: { key: string; text: string; isCorrect: boolean }[] = options.map((opt, i) => {
    const letters = ["A", "B", "C", "D", "E", "F"];
    const key = letters[i] || `${i + 1}`;
    if (typeof opt === "string") {
      return { key, text: opt, isCorrect: i === 0 };
    }
    return {
      key: opt.key || key,
      text: opt.text || "",
      isCorrect: opt.isCorrect === true || (opt as any).is_correct === true,
    };
  });

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border transition-all duration-200 bg-white shadow-xs hover:shadow-md dark:bg-gray-900 ${
        isApproved
          ? "border-emerald-200/90 dark:border-emerald-900/50 hover:border-emerald-300"
          : isArchived
          ? "border-purple-300 dark:border-purple-800/80 hover:border-purple-400 bg-purple-50/20 dark:bg-purple-950/10"
          : "border-amber-200/90 dark:border-amber-900/50 hover:border-amber-300"
      }`}
    >
      {/* Left accent bar */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1.5 transition-colors ${
          isApproved
            ? "bg-emerald-500"
            : isArchived
            ? "bg-purple-600"
            : "bg-amber-500"
        }`}
      />

      {/* Main Card Container */}
      <div className="p-5">
        {/* Top Badges Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3.5 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-2">
            {/* Question Number */}
            {questionNumber !== undefined && (
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-slate-900 text-xs font-black text-white shadow-xs dark:bg-slate-100 dark:text-slate-900">
                #{questionNumber}
              </span>
            )}

            {/* Question Code */}
            {displayCode && (
              <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-300 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                {displayCode}
              </span>
            )}

            {/* Knowledge Level */}
            {kLevel && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-purple-50 px-2.5 py-1 text-xs font-bold text-purple-700 border border-purple-100 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900/50">
                <Zap className="h-3 w-3 text-purple-500" />
                {kLevel}
              </span>
            )}

            {/* Course Outcome */}
            {coLevel && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 border border-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900/50">
                <Target className="h-3 w-3 text-indigo-500" />
                {coLevel}
              </span>
            )}

            {/* Unit Name */}
            {unit && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 border border-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/50">
                <BookOpen className="h-3 w-3 text-blue-500 shrink-0" />
                <span>{unit}</span>
              </span>
            )}

            {/* Subunit / Topic Name if available */}
            {topic && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 border border-slate-200/70 dark:bg-slate-800 dark:text-slate-300">
                <span>{topic}</span>
                {subtopic && (
                  <>
                    <span className="text-slate-400">›</span>
                    <span className="text-slate-600 dark:text-slate-400">{subtopic}</span>
                  </>
                )}
              </span>
            )}

            {/* Marks */}
            {marks !== undefined && marks !== "" && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300">
                {marks} {Number(marks) === 1 ? "Mark" : "Marks"}
              </span>
            )}

            {/* Difficulty */}
            {difficulty && (
              <span
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold border ${
                  difficulty.toLowerCase() === "easy"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300"
                    : difficulty.toLowerCase() === "hard"
                    ? "bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300"
                    : "bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    difficulty.toLowerCase() === "easy"
                      ? "bg-emerald-500"
                      : difficulty.toLowerCase() === "hard"
                      ? "bg-rose-500"
                      : "bg-amber-500"
                  }`}
                />
                {difficulty}
              </span>
            )}
          </div>

          {/* Right side: Status Badge + Dropdown toggle */}
          <div className="flex items-center gap-2.5">
            {/* Status Badge */}
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

            {/* Dropdown Toggle Button */}
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
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

        {/* Question Statement (Clickable to toggle expand) */}
        <div className="mt-3.5 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-relaxed tracking-tight hover:text-indigo-600 transition-colors">
            {questionStatement}
          </h3>
        </div>

        {/* Collapsed view quick tag strip if not expanded */}
        {!isExpanded && tags.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {tags.map((tag, idx) => {
              const label = typeof tag === "string" ? tag : tag.label;
              return (
                <span
                  key={idx}
                  className="rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 border border-slate-200/60 dark:bg-slate-800 dark:text-slate-300"
                >
                  {label}
                </span>
              );
            })}
          </div>
        )}

        {/* Expanded Dropdown Content: Options, Explanation, Actions */}
        {isExpanded && (
          <div className="mt-5 border-t border-slate-100 pt-5 dark:border-slate-800">
            {/* Options Grid */}
            {normalizedOptions.length > 0 && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {normalizedOptions.map((opt) => (
                  <div
                    key={opt.key}
                    className={`relative flex items-center gap-3.5 rounded-xl p-3.5 transition-all duration-150 ${
                      opt.isCorrect
                        ? "border-2 border-emerald-500 bg-gradient-to-r from-emerald-50 to-teal-50/50 shadow-xs dark:from-emerald-950/40 dark:to-teal-950/20 dark:border-emerald-500"
                        : "border border-slate-200 bg-slate-50/40 hover:bg-slate-50 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-800/30 dark:hover:bg-slate-800/60"
                    }`}
                  >
                    {/* Letter Badge */}
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-black transition-colors ${
                        opt.isCorrect
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "border border-slate-200 bg-white text-slate-700 shadow-2xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      }`}
                    >
                      {opt.key}
                    </span>

                    {/* Option Text */}
                    <span
                      className={`flex-1 text-xs sm:text-sm leading-snug ${
                        opt.isCorrect
                          ? "font-bold text-emerald-950 dark:text-emerald-100"
                          : "font-medium text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {opt.text}
                    </span>

                    {/* Correct Label Badge */}
                    {opt.isCorrect && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-xs shrink-0">
                        <Check className="h-3 w-3 stroke-[3]" />
                        <span>Correct</span>
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Rationale / Explanation Box */}
            {explanation && (
              <div className="mt-4 flex items-start gap-3 rounded-xl border border-indigo-100 bg-gradient-to-r from-indigo-50/70 via-sky-50/40 to-white p-4 dark:border-indigo-900/40 dark:bg-indigo-950/20">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
                  <Sparkles className="h-3.5 w-3.5" />
                </div>
                <div className="space-y-0.5 flex-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-300 block">
                    Explanation & Rationale
                  </span>
                  <p className="text-xs sm:text-[13px] text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
                    {explanation}
                  </p>
                </div>
              </div>
            )}

            {/* Action Footer inside dropdown */}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3.5 dark:border-slate-800">
              <div className="flex items-center gap-2">
                {onApprove && (
                  <button
                    type="button"
                    onClick={onApprove}
                    className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all shadow-xs active:scale-98 ${
                      isApproved
                        ? "border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
                        : "border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300"
                    }`}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>{isApproved ? "Move to Draft" : "Approve to Bank"}</span>
                  </button>
                )}

                {onEdit && (
                  <button
                    type="button"
                    onClick={onEdit}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition active:scale-98"
                  >
                    <Edit3 className="h-3.5 w-3.5 text-slate-500" />
                    <span>Edit Question</span>
                  </button>
                )}

                {onView && (
                  <button
                    type="button"
                    onClick={onView}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition active:scale-98"
                  >
                    <Eye className="h-3.5 w-3.5 text-slate-500" />
                    <span>View Details</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* High-visibility Archive button with distinctive vibrant purple/violet styling */}
                {onToggleArchive && (
                  <button
                    type="button"
                    onClick={onToggleArchive}
                    className={`flex items-center gap-1.5 rounded-xl border-2 px-4 py-2 text-xs font-extrabold transition-all shadow-sm active:scale-98 ${
                      isArchived
                        ? "border-purple-600 bg-purple-600 text-white hover:bg-purple-700 shadow-purple-200"
                        : "border-purple-500 bg-purple-50 text-purple-700 hover:bg-purple-100 hover:border-purple-600 dark:border-purple-400 dark:bg-purple-950/70 dark:text-purple-200"
                    }`}
                  >
                    <Archive className="h-3.5 w-3.5 stroke-[2.5]" />
                    <span>{isArchived ? "Unarchive" : "Archive Question"}</span>
                  </button>
                )}

                {/* Delete Button */}
                {onDelete && (
                  <button
                    type="button"
                    onClick={onDelete}
                    className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300 transition active:scale-98"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionDetailCard;
