import React from "react";
import {
  Layers,
  Plus,
  BookOpen,
  Calendar,
  ChevronRight,
  Trash2,
  FileCheck2,
  Sparkles,
  Edit3,
} from "lucide-react";

export interface QuestionSetItem {
  id: string;
  name: string;
  title?: string;
  description?: string;
  unit_number?: number;
  question_ids?: string[];
  questions?: any[];
  total_marks?: number;
  created_at?: string;
}

interface QuestionSetsListProps {
  sets: QuestionSetItem[];
  loading?: boolean;
  onOpenSet: (set: QuestionSetItem) => void;
  onCreateNew: () => void;
  onDeleteSet: (setId: string) => void;
  onEditSet?: (set: QuestionSetItem) => void;
}

export const QuestionSetsList: React.FC<QuestionSetsListProps> = ({
  sets = [],
  loading = false,
  onOpenSet,
  onCreateNew,
  onDeleteSet,
  onEditSet,
}) => {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mb-3" />
        <p className="text-xs font-bold text-slate-500">Loading course question sets...</p>
      </div>
    );
  }

  if (sets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white py-16 px-6 text-center dark:border-slate-800 dark:bg-slate-900 shadow-xs">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 mb-4 shadow-xs">
          <Layers className="h-8 w-8" />
        </div>
        <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
          No Question Sets Created Yet
        </h3>
        <p className="mt-1.5 max-w-md text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          Question Sets group curated questions together for semester tests, CIA assessments, or unit-wise practice tests.
        </p>
        <button
          type="button"
          onClick={onCreateNew}
          className="mt-5 flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700 transition active:scale-98"
        >
          <Plus className="h-4 w-4" />
          <span>Create First Question Set</span>
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {sets.map((set) => {
        const qCount = Array.isArray(set.question_ids)
          ? set.question_ids.length
          : Array.isArray(set.questions)
          ? set.questions.length
          : 0;

        const dateStr = set.created_at
          ? new Date(set.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "Active";

        return (
          <div
            key={set.id}
            className="group flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs hover:shadow-md hover:border-indigo-200 dark:border-slate-800 dark:bg-slate-900 transition-all duration-200"
          >
            <div>
              {/* Card Header Pills - No Unit Tag */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
                  <Layers className="h-3.5 w-3.5" />
                  <span>Question Set</span>
                </span>

                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
                  <Calendar className="h-3 w-3" />
                  <span>{dateStr}</span>
                </div>
              </div>

              {/* Set Title */}
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white line-clamp-1 group-hover:text-indigo-600 transition-colors">
                {set.name || set.title || "Untitled Question Set"}
              </h3>

              {/* Description */}
              {set.description && (
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {set.description}
                </p>
              )}

              {/* Metrics Box */}
              <div className="mt-4 flex items-center justify-between rounded-2xl bg-slate-50 p-3.5 text-xs dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Questions Count
                  </span>
                  <span className="text-sm font-black text-slate-900 dark:text-white mt-0.5 block">
                    {qCount} {qCount === 1 ? "Question" : "Questions"}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Total Marks
                  </span>
                  <span className="text-sm font-black text-indigo-600 dark:text-indigo-400 mt-0.5 block">
                    {set.total_marks || qCount * 2} Marks
                  </span>
                </div>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="mt-5 flex items-center justify-between gap-2 border-t border-slate-100 pt-3.5 dark:border-slate-800">
              <button
                type="button"
                onClick={() => onOpenSet(set)}
                className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition active:scale-98"
              >
                <span>Open & View</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>

              <div className="flex items-center gap-1">
                {onEditSet && (
                  <button
                    type="button"
                    onClick={() => onEditSet(set)}
                    className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800 dark:hover:text-indigo-400 transition"
                    title="Edit / Rename Question Set"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Are you sure you want to delete the question set "${set.name}"?`)) {
                      onDeleteSet(set.id);
                    }
                  }}
                  className="rounded-xl p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30 transition"
                  title="Delete Question Set"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default QuestionSetsList;
