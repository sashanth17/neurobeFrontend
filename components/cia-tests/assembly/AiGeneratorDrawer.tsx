  import React, { useState, useEffect } from "react";
import {
  Sparkles,
  X,
  AlertCircle,
  Loader2,
  BookOpen,
  Check,
} from "lucide-react";
import { AiGenerationJobPayload, SyllabusTopicItem } from "@/types/cia-test.types";
import { isLimitExhaustion } from "@/utils/function.utils";
import { toast } from "react-toastify";

interface AiGeneratorDrawerProps {
  isOpen: boolean;
  isGenerating: boolean;
  jobProgress: number;
  statusMessage: string;
  generationError: string | null;
  defaultMarks?: number | null;
  syllabusTopics?: SyllabusTopicItem[];
  topicsLoading?: boolean;
  onClose: () => void;
  onGenerate: (payload: AiGenerationJobPayload) => Promise<any>;
  onCancelGeneration?: () => Promise<any>;
  cancellingJob?: boolean;
}

export const AiGeneratorDrawer: React.FC<AiGeneratorDrawerProps> = ({
  isOpen,
  isGenerating,
  jobProgress,
  statusMessage,
  generationError,
  defaultMarks,
  syllabusTopics = [],
  topicsLoading = false,
  onClose,
  onGenerate,
  onCancelGeneration,
  cancellingJob = false,
}) => {
  const [selectedTopicIds, setSelectedTopicIds] = useState<number[]>([]);
  const [knowledgeLevel, setKnowledgeLevel] = useState<string>("K2");
  const [maxMarks, setMaxMarks] = useState<number>(defaultMarks || 10);
  const [numQuestions, setNumQuestions] = useState<number>(5);
  const [difficulty, setDifficulty] = useState<string>("medium");
  const [customPrompt, setCustomPrompt] = useState<string>("");

  // Auto-select first topic when syllabusTopics loads (up to 3 max)
  useEffect(() => {
    if (syllabusTopics.length > 0 && selectedTopicIds.length === 0) {
      setSelectedTopicIds([syllabusTopics[0].id]);
    }
  }, [syllabusTopics, selectedTopicIds.length]);

  if (!isOpen) return null;

  const toggleTopic = (id: number) => {
    setSelectedTopicIds((prev) => {
      if (prev.includes(id)) {
        if (prev.length <= 1) return prev; // Keep at least one selected
        return prev.filter((t) => t !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedTopicIds.length === 0) {
      toast.warning("Please select at least 1 topic.");
      return;
    }

    const selectedTopicNames = selectedTopicIds
      .map((id) => syllabusTopics.find((t) => t.id === id)?.topic_name)
      .filter(Boolean) as string[];

    const payload: AiGenerationJobPayload = {
      topic_ids: selectedTopicIds,
      topic_names: selectedTopicNames,
      knowledge_level: knowledgeLevel,
      max_marks: Number(maxMarks),
      num_questions: Math.min(20, Math.max(1, Number(numQuestions) || 5)),
      difficulty,
      is_either_or: false,
      has_sub_questions: false,
      num_sub_questions: null,
      sub_question_marks: null,
      custom_instructions: customPrompt.trim() || null,
      bloom_level: knowledgeLevel,
      question_type: "direct",
    };

    try {
      await onGenerate(payload);
      // Close drawer once queued so user can freely interact with other screens in the UI
      onClose();
    } catch (err) {
      // Handled by hook error banner
    }
  };

  // Group topics by unit
  const unitsMap = syllabusTopics.reduce((acc, t) => {
    const unitKey = t.unit_title || `Unit ${t.unit_number || 1}`;
    if (!acc[unitKey]) acc[unitKey] = [];
    acc[unitKey].push(t);
    return acc;
  }, {} as Record<string, SyllabusTopicItem[]>);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-sm">
      <div className="h-full w-full max-w-lg bg-white p-6 shadow-2xl dark:bg-gray-800 flex flex-col justify-between overflow-y-auto">
        <div>
          {/* Header */}
          <div className="mb-5 flex items-center justify-between border-b border-gray-100 pb-4 dark:border-gray-700">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-white">
                  AI Question Generator Studio
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Async AI synthesis powered by syllabus topics & Bloom&apos;s Taxonomy.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Background Async Progress Indicator */}
          {isGenerating && (
            <div className="mb-5 rounded-2xl border border-purple-200 bg-purple-50 p-4 dark:border-purple-800 dark:bg-purple-950/40">
              <div className="flex items-center justify-between text-xs font-bold text-purple-900 dark:text-purple-200 mb-2">
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                  <span>{statusMessage || "AI is synthesizing questions..."}</span>
                </span>
                <span>{jobProgress}%</span>
              </div>

              <div className="h-2 w-full overflow-hidden rounded-full bg-purple-200 dark:bg-purple-800">
                <div
                  className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 transition-all duration-300"
                  style={{ width: `${jobProgress}%` }}
                />
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-[11px] text-purple-700 dark:text-purple-300">
                  Generation is non-blocking. You can close this drawer and continue working.
                </p>
                <div className="flex items-center gap-2">
                  {onCancelGeneration && (
                    <button
                      type="button"
                      onClick={onCancelGeneration}
                      disabled={cancellingJob}
                      className="rounded-lg border border-red-300 bg-white px-2.5 py-1 text-[11px] font-bold text-red-600 hover:bg-red-50 shadow-sm disabled:opacity-50 transition-all"
                    >
                      {cancellingJob ? "Cancelling..." : "Cancel Job"}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-shrink-0 rounded-lg bg-purple-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-purple-700 shadow-sm"
                  >
                    Continue in Background
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {generationError && !isGenerating && (
            <div
              className={`mb-5 flex items-start gap-2.5 rounded-xl border p-3.5 text-xs ${
                isLimitExhaustion(generationError)
                  ? "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
                  : "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300"
              }`}
            >
              <AlertCircle
                className={`h-4 w-4 flex-shrink-0 mt-0.5 ${
                  isLimitExhaustion(generationError) ? "text-amber-600 dark:text-amber-400" : "text-red-600"
                }`}
              />
              <div>
                <strong className="font-bold">
                  {isLimitExhaustion(generationError) ? "Generation Limit Exhausted: " : "Generation Failed: "}
                </strong>
                <span>{generationError}</span>
                {isLimitExhaustion(generationError) && (
                  <p className="mt-1 text-[11px] font-medium text-amber-800 dark:text-amber-300">
                    Solution: Ask your admin to request for more generations.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Syllabus Topic Selector */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5 text-purple-600" />
                  <span>Syllabus Topics *</span>
                </label>
                <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400">
                  {selectedTopicIds.length} Selected
                </span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-2">
                Select your desired syllabus topics. AI will intelligently select 1 to 3 balanced topics for synthesis.
              </p>

              {topicsLoading ? (
                <div className="py-4 text-center text-gray-400">Loading syllabus topics...</div>
              ) : syllabusTopics.length === 0 ? (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-gray-500 dark:border-gray-700 dark:bg-gray-900">
                  <span>Using default syllabus units (Topic #1).</span>
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto rounded-xl border border-gray-200 bg-gray-50 p-2.5 dark:border-gray-700 dark:bg-gray-900 space-y-2">
                  {Object.entries(unitsMap).map(([unitTitle, topics]) => {
                    const unitTopicIds = topics.map((t) => t.id);
                    const isAllUnitSelected = unitTopicIds.length > 0 && unitTopicIds.every((id) => selectedTopicIds.includes(id));

                    const toggleSelectAllUnit = () => {
                      if (isAllUnitSelected) {
                        setSelectedTopicIds((prev) => {
                          const remaining = prev.filter((id) => !unitTopicIds.includes(id));
                          return remaining.length > 0 ? remaining : prev;
                        });
                      } else {
                        setSelectedTopicIds((prev) => Array.from(new Set([...prev, ...unitTopicIds])));
                      }
                    };

                    return (
                      <div key={unitTitle} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-extrabold uppercase text-gray-500 tracking-wider">
                            {unitTitle}
                          </span>
                          <button
                            type="button"
                            onClick={toggleSelectAllUnit}
                            className="text-[10px] font-bold text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                          >
                            {isAllUnitSelected ? "Deselect Unit" : "Select Unit"}
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {topics.map((t) => {
                            const isSelected = selectedTopicIds.includes(t.id);
                            return (
                              <button
                                type="button"
                                key={t.id}
                                onClick={() => toggleTopic(t.id)}
                                title={t.topic_name}
                                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all ${
                                  isSelected
                                    ? "bg-purple-600 text-white shadow-sm"
                                    : "bg-white text-gray-700 border border-gray-200 hover:border-purple-300 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
                                }`}
                              >
                                {isSelected && <Check className="h-3 w-3" />}
                                <span>{t.topic_name}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Target Marks & Question Count Row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Target Marks *
                </label>
                <select
                  value={maxMarks}
                  onChange={(e) => setMaxMarks(Number(e.target.value))}
                  disabled={isGenerating}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 font-bold text-purple-700 focus:border-purple-500 focus:bg-white focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-purple-300"
                >
                  <option value="2">2 Marks (Short)</option>
                  <option value="4">4 Marks</option>
                  <option value="5">5 Marks</option>
                  <option value="8">8 Marks</option>
                  <option value="10">10 Marks (Analytical)</option>
                  <option value="12">12 Marks</option>
                  <option value="13">13 Marks</option>
                  <option value="15">15 Marks</option>
                  <option value="16">16 Marks (Comprehensive)</option>
                  <option value="20">20 Marks</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-gray-700 dark:text-gray-300">
                    Count *
                  </label>
                  <span className="text-[10px] font-semibold text-purple-600">Max: 20</span>
                </div>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={numQuestions}
                  onChange={(e) =>
                    setNumQuestions(Math.min(20, Math.max(1, Number(e.target.value) || 1)))
                  }
                  disabled={isGenerating}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 font-bold text-gray-800 focus:border-purple-500 focus:bg-white focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                />
              </div>
            </div>

            {/* Bloom's Level & Difficulty Row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Bloom&apos;s Level *
                </label>
                <select
                  value={knowledgeLevel}
                  onChange={(e) => setKnowledgeLevel(e.target.value)}
                  disabled={isGenerating}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 font-medium text-gray-800 focus:border-purple-500 focus:bg-white focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                >
                  <option value="K1">K1 — Remember</option>
                  <option value="K2">K2 — Understand</option>
                  <option value="K3">K3 — Apply</option>
                  <option value="K4">K4 — Analyze</option>
                  <option value="K5">K5 — Evaluate</option>
                  <option value="K6">K6 — Create</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Difficulty Level
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  disabled={isGenerating}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 font-medium text-gray-800 focus:border-purple-500 focus:bg-white focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 capitalize"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>

            {/* Prompt Specific / Custom Instructions Field */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-gray-700 dark:text-gray-300">
                  Prompt Specific (Optional)
                </label>
                <span className="text-[10px] text-gray-400">e.g. Include real-world scenario, numerical problem</span>
              </div>
              <textarea
                rows={2}
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                disabled={isGenerating}
                placeholder="Add specific instructions or guidance for question generation..."
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-800 placeholder-gray-400 focus:border-purple-500 focus:bg-white focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 resize-none"
              />
            </div>

            <div className="pt-2 flex items-center gap-2">
              {isGenerating ? (
                <>
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 rounded-xl border border-purple-300 bg-white py-3 text-xs font-bold text-purple-700 shadow-sm hover:bg-purple-50 dark:border-purple-700 dark:bg-gray-800 dark:text-purple-300"
                  >
                    Access Other Screens
                  </button>
                  {onCancelGeneration && (
                    <button
                      type="button"
                      onClick={onCancelGeneration}
                      disabled={cancellingJob}
                      className="flex-1 rounded-xl border border-red-200 bg-red-50 py-3 text-xs font-bold text-red-700 shadow-sm hover:bg-red-100 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300 disabled:opacity-50 transition-all"
                    >
                      {cancellingJob ? "Cancelling..." : "Cancel Generation"}
                    </button>
                  )}
                </>
              ) : (
                <button
                  type="submit"
                  disabled={selectedTopicIds.length === 0}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 py-3 text-sm font-bold text-white shadow-lg shadow-purple-500/25 transition-all hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 cursor-pointer"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>
                    Generate {numQuestions} Questions ({maxMarks}M each)
                  </span>
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-5 border-t border-gray-100 pt-3 dark:border-gray-700 text-[11px] text-gray-400">
          Generated candidate questions are placed in the pool and are ready to be mapped into question paper slots.
        </div>
      </div>
    </div>
  );
};

export default AiGeneratorDrawer;
