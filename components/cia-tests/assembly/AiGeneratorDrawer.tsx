import React, { useState, useEffect } from "react";
import {
  Sparkles,
  X,
  AlertCircle,
  CheckCircle2,
  Loader2,
  BookOpen,
  Layers,
  Award,
  ArrowRight,
  Sliders,
  Check,
  Split,
  GitBranch,
  Compass,
  Image as ImageIcon,
  PenTool,
} from "lucide-react";
import { AiGenerationJobPayload, SyllabusTopicItem } from "@/types/cia-test.types";

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
  const [customInstructions, setCustomInstructions] = useState<string>("");

  // Dynamic Toggles
  const [hasSubQuestions, setHasSubQuestions] = useState<boolean>(false);
  const [numSubQuestions, setNumSubQuestions] = useState<number>(2);
  const [subQuestionMarks, setSubQuestionMarks] = useState<number[]>([4, 6]);

  const [isEitherOr, setIsEitherOr] = useState<boolean>(false);
  const [includeDiagram, setIncludeDiagram] = useState<boolean>(false);
  const [diagramType, setDiagramType] = useState<string>("auto");

  // Auto-select first topics when syllabusTopics loads
  useEffect(() => {
    if (syllabusTopics.length > 0 && selectedTopicIds.length === 0) {
      setSelectedTopicIds([syllabusTopics[0].id]);
    }
  }, [syllabusTopics, selectedTopicIds.length]);

  // Adjust sub question marks automatically when maxMarks or numSubQuestions changes
  useEffect(() => {
    if (hasSubQuestions) {
      const count = Math.max(1, numSubQuestions);
      const base = Math.floor(maxMarks / count);
      const remainder = maxMarks % count;
      const marks = Array(count).fill(base);
      if (remainder > 0) {
        marks[marks.length - 1] += remainder;
      }
      setSubQuestionMarks(marks);
    }
  }, [maxMarks, numSubQuestions, hasSubQuestions]);

  if (!isOpen) return null;

  // Validate Sub-questions sum
  const subMarksSum = hasSubQuestions
    ? subQuestionMarks.reduce((sum, m) => sum + (Number(m) || 0), 0)
    : maxMarks;
  const isMarksMatching = !hasSubQuestions || subMarksSum === maxMarks;

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

  const handleSubMarkChange = (index: number, val: number) => {
    const updated = [...subQuestionMarks];
    updated[index] = Number(val) || 0;
    setSubQuestionMarks(updated);
  };

  const autoDistributeMarks = () => {
    const count = Math.max(1, numSubQuestions);
    const base = Math.floor(maxMarks / count);
    const remainder = maxMarks % count;
    const marks = Array(count).fill(base);
    if (remainder > 0) {
      marks[marks.length - 1] += remainder;
    }
    setSubQuestionMarks(marks);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (hasSubQuestions && !isMarksMatching) {
      alert(`Sub-question marks sum (${subMarksSum}M) must equal target marks (${maxMarks}M).`);
      return;
    }

    const finalTopicIds =
      selectedTopicIds.length > 0
        ? selectedTopicIds
        : syllabusTopics.length > 0
        ? [syllabusTopics[0].id]
        : [1];

    const selectedTopicNames = finalTopicIds
      .map((id) => syllabusTopics.find((t) => t.id === id)?.topic_name)
      .filter(Boolean) as string[];

    const payload: AiGenerationJobPayload = {
      topic_ids: finalTopicIds,
      topic_names: selectedTopicNames,
      knowledge_level: knowledgeLevel,
      max_marks: Number(maxMarks),
      num_questions: Math.min(20, Math.max(1, Number(numQuestions) || 5)),
      difficulty,
      is_either_or: isEitherOr,
      has_sub_questions: hasSubQuestions,
      num_sub_questions: hasSubQuestions ? numSubQuestions : null,
      sub_question_marks: hasSubQuestions ? subQuestionMarks : null,
      custom_instructions: customInstructions.trim() || null,
      include_diagram: includeDiagram,
      diagram_type: includeDiagram ? diagramType : undefined,
      bloom_level: knowledgeLevel,
      additional_instructions: customInstructions.trim() || undefined,
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
            <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
              <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-600 mt-0.5" />
              <div>
                <strong className="font-bold">Generation Failed: </strong>
                <span>{generationError}</span>
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

              {topicsLoading ? (
                <div className="py-4 text-center text-gray-400">Loading syllabus topics...</div>
              ) : syllabusTopics.length === 0 ? (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-gray-500 dark:border-gray-700 dark:bg-gray-900">
                  <span>Using default syllabus units (Topic #1).</span>
                </div>
              ) : (
                <div className="max-h-44 overflow-y-auto rounded-xl border border-gray-200 bg-gray-50 p-2.5 dark:border-gray-700 dark:bg-gray-900 space-y-2">
                  {Object.entries(unitsMap).map(([unitTitle, topics]) => (
                    <div key={unitTitle} className="space-y-1">
                      <div className="text-[10px] font-extrabold uppercase text-gray-400 tracking-wider">
                        {unitTitle}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {topics.map((t) => {
                          const isSelected = selectedTopicIds.includes(t.id);
                          return (
                            <button
                              type="button"
                              key={t.id}
                              onClick={() => toggleTopic(t.id)}
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
                  ))}
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

            {/* DYNAMIC STRUCTURAL TOGGLES */}
            <div className="rounded-xl border border-purple-200/80 bg-purple-50/40 p-3.5 dark:border-purple-900 dark:bg-purple-950/20 space-y-3">
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                <Sliders className="h-3.5 w-3.5" />
                <span>Dynamic Structure Toggles</span>
              </div>

              {/* Sub-Questions Toggle */}
              <div className="rounded-lg border border-gray-200 bg-white p-2.5 dark:border-gray-700 dark:bg-gray-800">
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Split className="h-4 w-4 text-purple-600" />
                    <div>
                      <span className="font-bold text-gray-800 dark:text-gray-200">
                        Split into Sub-questions
                      </span>
                      <p className="text-[11px] text-gray-400">
                        e.g. Generate parts (a) and (b) with custom mark allocation.
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={hasSubQuestions}
                    onChange={(e) => setHasSubQuestions(e.target.checked)}
                    disabled={isGenerating}
                    className="h-4 w-4 rounded text-purple-600 focus:ring-purple-500"
                  />
                </label>

                {hasSubQuestions && (
                  <div className="mt-3 border-t border-gray-100 pt-2.5 dark:border-gray-700 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-300">
                        Sub-Parts Count:
                      </span>
                      <div className="flex gap-1.5">
                        {[2, 3, 4].map((count) => (
                          <button
                            type="button"
                            key={count}
                            onClick={() => setNumSubQuestions(count)}
                            className={`rounded-md px-2 py-0.5 text-xs font-bold ${
                              numSubQuestions === count
                                ? "bg-purple-600 text-white"
                                : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                            }`}
                          >
                            {count} Parts
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Marks Breakdown Inputs */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-300">
                          Marks Breakdown (Must sum to {maxMarks}M):
                        </span>
                        {!isMarksMatching && (
                          <button
                            type="button"
                            onClick={autoDistributeMarks}
                            className="text-[10px] font-bold text-purple-600 hover:underline"
                          >
                            Auto-Distribute
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {subQuestionMarks.map((m, idx) => (
                          <div key={idx} className="flex items-center gap-1">
                            <span className="text-[11px] font-bold text-gray-400">
                              ({String.fromCharCode(97 + idx)})
                            </span>
                            <input
                              type="number"
                              min="1"
                              max={maxMarks}
                              value={m}
                              onChange={(e) => handleSubMarkChange(idx, Number(e.target.value))}
                              className="w-14 rounded-lg border border-gray-300 bg-gray-50 p-1 text-center font-bold text-purple-700 dark:border-gray-600 dark:bg-gray-900 dark:text-purple-300"
                            />
                            {idx < subQuestionMarks.length - 1 && (
                              <span className="font-bold text-gray-400">+</span>
                            )}
                          </div>
                        ))}
                        <span className="font-bold text-gray-400">=</span>
                        <span
                          className={`rounded px-1.5 py-0.5 font-extrabold text-[11px] ${
                            isMarksMatching
                              ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                              : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                          }`}
                        >
                          {subMarksSum}M {isMarksMatching ? "✓" : "≠"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Either / Or Choice Toggle */}
              <div className="rounded-lg border border-gray-200 bg-white p-2.5 dark:border-gray-700 dark:bg-gray-800">
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2">
                    <GitBranch className="h-4 w-4 text-purple-600" />
                    <div>
                      <span className="font-bold text-gray-800 dark:text-gray-200">
                        Either / Or Choice (Option A or Option B)
                      </span>
                      <p className="text-[11px] text-gray-400">
                        Generates both choice branches carrying {maxMarks} Marks each.
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={isEitherOr}
                    onChange={(e) => setIsEitherOr(e.target.checked)}
                    disabled={isGenerating}
                    className="h-4 w-4 rounded text-purple-600 focus:ring-purple-500"
                  />
                </label>

                {isEitherOr && hasSubQuestions && (
                  <p className="mt-2 text-[10px] text-purple-600 dark:text-purple-400 font-semibold border-t border-gray-100 pt-1.5 dark:border-gray-700">
                    ⚡ Option A and Option B will both inherit the [{subQuestionMarks.join("m + ")}m] sub-question structure.
                  </p>
                )}
              </div>

              {/* Visualization Diagram Toggle & Domain Presets */}
              <div className="rounded-xl border border-gray-200 bg-white p-3.5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <label className="flex cursor-pointer items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400">
                      <ImageIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-800 dark:text-gray-200">
                          Include Visualization Diagram
                        </span>
                        <span className="text-[10px] bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300 font-bold px-1.5 py-0.5 rounded">
                          SVG Engine
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400">
                        AI will synthesize engineering diagram specifications and auto-compile them into crisp vector SVGs.
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={includeDiagram}
                    onChange={(e) => setIncludeDiagram(e.target.checked)}
                    disabled={isGenerating}
                    className="h-4 w-4 rounded text-teal-600 focus:ring-teal-500 mt-1"
                  />
                </label>

                {includeDiagram && (
                  <div className="mt-3.5 pt-3 border-t border-gray-100 dark:border-gray-700 space-y-2">
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Select Engineering / Science Domain:
                    </span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: "auto", label: "Auto Detect" },
                        { id: "beam", label: "Civil Beam" },
                        { id: "truss", label: "Structural Truss" },
                        { id: "logic_circuit", label: "Digital Logic" },
                        { id: "flowchart", label: "Process Flow" },
                        { id: "geometry", label: "2D Geometry" },
                      ].map((type) => (
                        <button
                          key={type.id}
                          type="button"
                          disabled={isGenerating}
                          onClick={() => setDiagramType(type.id)}
                          className={`px-2 py-1.5 rounded-lg text-xs font-semibold text-center border transition-all ${
                            diagramType === type.id
                              ? "bg-teal-500 text-white border-teal-600 shadow-sm"
                              : "bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600"
                          }`}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bloom's Level & Difficulty Row (CO input removed) */}
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

            {/* Custom Instructions */}
            <div>
              <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                Special Prompt Instructions (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Include numerical derivation or focus on industrial case studies."
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                disabled={isGenerating}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 font-medium text-gray-800 focus:border-purple-500 focus:bg-white focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
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
                  disabled={hasSubQuestions && !isMarksMatching}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 py-3 text-sm font-bold text-white shadow-lg shadow-purple-500/25 transition-all hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50"
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
