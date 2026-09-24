import React, { useState, useMemo } from "react";
import { X, Plus, Search, Check, Filter, Layers, Zap, Target } from "lucide-react";
import { QuestionSetItem } from "./QuestionSetsList";

interface AddQuestionsToSetModalProps {
  open: boolean;
  onClose: () => void;
  set: QuestionSetItem | null;
  availableQuestions: any[];
  onAddQuestions: (setId: string, questionIds: string[]) => Promise<void> | void;
}

export const AddQuestionsToSetModal: React.FC<AddQuestionsToSetModalProps> = ({
  open,
  onClose,
  set,
  availableQuestions = [],
  onAddQuestions,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [submitting, setSubmitting] = useState(false);

  // Existing question IDs in this set
  const existingSetQIds = useMemo(() => {
    if (!set) return new Set<string>();
    const qIds = Array.isArray(set.question_ids)
      ? set.question_ids
      : Array.isArray(set.questions)
      ? set.questions.map((q: any) => q.id || q)
      : [];
    return new Set<string>(qIds.map((id) => String(id)));
  }, [set]);

  // Questions available to add (not yet in set)
  const candidateQuestions = useMemo(() => {
    return availableQuestions.filter((q) => !existingSetQIds.has(String(q.id)));
  }, [availableQuestions, existingSetQIds]);

  // Filtered candidate questions based on search & tags
  const filteredCandidates = useMemo(() => {
    return candidateQuestions.filter((q) => {
      if (levelFilter !== "all" && (q.level || q.knowledge_level || "").toUpperCase() !== levelFilter.toUpperCase()) {
        return false;
      }
      if (
        difficultyFilter !== "all" &&
        (q.difficulty || "").toLowerCase() !== difficultyFilter.toLowerCase()
      ) {
        return false;
      }
      if (search) {
        const text = (q.question || q.text || "").toLowerCase();
        const code = (q.code || q.question_code || "").toLowerCase();
        const term = search.toLowerCase();
        if (!text.includes(term) && !code.includes(term)) return false;
      }
      return true;
    });
  }, [candidateQuestions, levelFilter, difficultyFilter, search]);

  if (!open || !set) return null;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectAllFiltered = () => {
    const filteredIds = filteredCandidates.map((q) => String(q.id));
    const allSelected = filteredIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  const handleConfirm = async () => {
    if (selectedIds.length === 0) return;
    setSubmitting(true);
    try {
      await onAddQuestions(set.id, selectedIds);
      setSelectedIds([]);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full max-w-3xl max-h-[85vh] rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 transition-all">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Add Questions to "{set.name || set.title}"
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pick approved or drafted questions from the question bank to append to this set.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Filter Controls */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search question code or text..."
              className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3.5 py-2 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              <option value="all">All Levels</option>
              <option value="K1">K1 Remember</option>
              <option value="K2">K2 Understand</option>
              <option value="K3">K3 Apply</option>
              <option value="K4">K4 Analyze</option>
            </select>

            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              <option value="all">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>

            <button
              type="button"
              onClick={selectAllFiltered}
              className="rounded-xl border border-indigo-200 bg-indigo-50/80 px-3 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition"
            >
              Toggle Page
            </button>
          </div>
        </div>

        {/* Questions Candidate List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filteredCandidates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Layers className="h-10 w-10 text-slate-300 mb-2" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                No available questions to add
              </p>
              <p className="text-xs text-slate-500">
                All questions in this course are either already in this set or match no filter.
              </p>
            </div>
          ) : (
            filteredCandidates.map((q, idx) => {
              const qId = String(q.id);
              const isSelected = selectedIds.includes(qId);
              return (
                <div
                  key={qId}
                  onClick={() => toggleSelect(qId)}
                  className={`flex items-start gap-3 rounded-2xl border p-4 cursor-pointer transition-all ${
                    isSelected
                      ? "border-indigo-500 bg-indigo-50/40 ring-1 ring-indigo-500/30 dark:bg-indigo-950/20"
                      : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(qId)}
                    className="mt-1 h-4 w-4 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md dark:bg-slate-800 dark:text-slate-300">
                        {q.code || q.question_code || `#${idx + 1}`}
                      </span>
                      <span className="rounded-md bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                        {q.level || q.knowledge_level || "K2"}
                      </span>
                      <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                        {q.difficulty || "Medium"}
                      </span>
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                        {q.marks || "2"} Marks
                      </span>
                    </div>
                    <p className="text-xs font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                      {q.question || q.text}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-slate-100 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900 rounded-b-3xl">
          <div className="text-xs font-bold text-slate-600 dark:text-slate-300">
            <span className="text-indigo-600 font-extrabold">{selectedIds.length}</span> Questions Selected
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={selectedIds.length === 0 || submitting}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="h-4 w-4" />
              <span>{submitting ? "Adding..." : `Add ${selectedIds.length} to Set`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddQuestionsToSetModal;
