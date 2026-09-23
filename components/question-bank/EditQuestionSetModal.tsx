import React, { useState, useEffect } from "react";
import { X, Edit3, Check, Layers } from "lucide-react";
import { QuestionSetItem } from "./QuestionSetsList";

interface EditQuestionSetModalProps {
  open: boolean;
  onClose: () => void;
  set: QuestionSetItem | null;
  onSave: (setId: string, newName: string) => Promise<void> | void;
}

export const EditQuestionSetModal: React.FC<EditQuestionSetModalProps> = ({
  open,
  onClose,
  set,
  onSave,
}) => {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (set) {
      setName(set.name || set.title || "");
      setError("");
    }
  }, [set]);

  if (!open || !set) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Question set name cannot be empty.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave(set.id, trimmed);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to update question set name.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 transition-all">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
              <Edit3 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Edit Question Set Name
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Rename this curriculum assessment set.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-750 dark:text-slate-200 mb-1.5">
              Question Set Title / Name
            </label>
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Unit 1 Practice Assessment"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                autoFocus
              />
            </div>
            {error && <p className="mt-1 text-xs font-semibold text-rose-500">{error}</p>}
          </div>

          <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500 dark:bg-slate-800/60 dark:text-slate-400 flex items-center gap-2">
            <Layers className="h-4 w-4 text-slate-400 shrink-0" />
            <span>
              Contains <strong>{set.question_ids?.length || set.questions?.length || 0} questions</strong>. Renaming will not affect the linked questions.
            </span>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="h-4 w-4" />
              <span>{saving ? "Saving..." : "Save Changes"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditQuestionSetModal;
