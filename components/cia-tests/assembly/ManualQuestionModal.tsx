import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  AlertCircle,
  Loader2,
  BookOpen,
  Check,
} from "lucide-react";
import { CandidateQuestion, SyllabusTopicItem } from "@/types/cia-test.types";
import CKEditorField from "@/components/FormFields/CKEditorField.component";
import LatexFormulaModal from "@/components/common-components/LatexFormulaModal";
import { renderMathInHtml } from "@/components/common-components/katexLoader";

interface ManualQuestionModalProps {
  isOpen: boolean;
  questionToEdit?: CandidateQuestion | null;
  defaultMarks?: number | null;
  courseId?: string | number;
  availableCos?: string[];
  syllabusTopics?: SyllabusTopicItem[];
  onClose: () => void;
  onSave: (payload: any) => Promise<boolean>;
}

const isHtmlEmpty = (html: string) => {
  if (!html) return true;
  const stripped = html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
  if (!stripped && !/<img\s/i.test(html)) return true;
  return false;
};

export const ManualQuestionModal: React.FC<ManualQuestionModalProps> = ({
  isOpen,
  questionToEdit,
  defaultMarks,
  syllabusTopics = [],
  onClose,
  onSave,
}) => {
  const [totalMarks, setTotalMarks] = useState<number>(defaultMarks || 10);
  const [bloomLevel, setBloomLevel] = useState<string>("K3");
  const [selectedUnit, setSelectedUnit] = useState<string>("");
  const [topicName, setTopicName] = useState<string>("");
  const [questionText, setQuestionText] = useState<string>("");

  // Group syllabus topics by Unit
  const unitsMap = useMemo(() => {
    return syllabusTopics.reduce((acc, t) => {
      const unitKey = t.unit_title || (t.unit_number ? `Unit ${t.unit_number}` : "General Topics");
      if (!acc[unitKey]) acc[unitKey] = [];
      acc[unitKey].push(t);
      return acc;
    }, {} as Record<string, SyllabusTopicItem[]>);
  }, [syllabusTopics]);

  // Preview state
  const [questionPreview, setQuestionPreview] = useState(false);

  // LaTeX Formula Modal State
  const [formulaModalState, setFormulaModalState] = useState<{
    open: boolean;
    target: string;
    targetLabel: string;
    initialFormula?: string;
  }>({
    open: false,
    target: "questionText",
    targetLabel: "Question Text",
    initialFormula: "",
  });

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  // Sync state if editing
  useEffect(() => {
    if (questionToEdit) {
      setQuestionText(questionToEdit.question_text || "");
      setTotalMarks(questionToEdit.max_marks || defaultMarks || 10);
      setBloomLevel(questionToEdit.knowledge_level || questionToEdit.bloom_level || "K3");
      const existingTopic =
        (questionToEdit as any).primary_topic_name ||
        questionToEdit.topic_names?.[0] ||
        "";
      setTopicName(existingTopic);
      if (existingTopic && syllabusTopics.length > 0) {
        const matched = syllabusTopics.find((t) => t.topic_name === existingTopic);
        if (matched) {
          const uKey = matched.unit_title || (matched.unit_number ? `Unit ${matched.unit_number}` : "");
          if (uKey) setSelectedUnit(uKey);
        }
      }
    } else {
      setQuestionText("");
      setTotalMarks(defaultMarks || 10);
      setBloomLevel("K3");
      setTopicName("");
      setSelectedUnit("");
    }
    setQuestionPreview(false);
    setErrorBanner(null);
  }, [questionToEdit, isOpen, defaultMarks, syllabusTopics]);

  const handleOpenFormula = (target: string, label: string) => {
    const currentText = questionText;
    const match = currentText.match(/(\$\$[\s\S]*?\$\$|\$[^$\n]+?\$)/g);
    const lastFormula = match ? match[match.length - 1] : "";

    setFormulaModalState({
      open: true,
      target,
      targetLabel: label,
      initialFormula: lastFormula,
    });
  };

  const appendFormulaToHtml = (html: string, formula: string): string => {
    if (!html) return `<p>${formula}</p>`;
    const trimmed = html.trim();
    if (trimmed.endsWith("</p>")) {
      return trimmed.replace(/<\/p>$/, ` ${formula}</p>`);
    }
    return `${trimmed}<p>${formula}</p>`;
  };

  const handleFormulaInserted = (latexFormula: string) => {
    setQuestionText((prev) => appendFormulaToHtml(prev, latexFormula));
    setQuestionPreview(true);
  };

  if (!isOpen) return null;

  // Validation
  const validateForm = (): boolean => {
    setErrorBanner(null);

    if (totalMarks <= 0) {
      setErrorBanner("Total marks must be greater than zero.");
      return false;
    }

    if (isHtmlEmpty(questionText)) {
      setErrorBanner("Please enter the question text.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const payload: any = {
        question_text: questionText,
        max_marks: Number(totalMarks),
        bloom_level: bloomLevel,
        knowledge_level: bloomLevel,
        primary_topic_name: topicName.trim() || undefined,
        topic_names: topicName.trim() ? [topicName.trim()] : [],
        question_type: "direct",
      };

      const success = await onSave(payload);
      if (success) {
        onClose();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-800">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-700">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              {questionToEdit ? "Edit Candidate Question" : "Author New Question"}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Formulate a direct candidate question aligned with syllabus topics and Bloom&apos;s Taxonomy.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Error Alert */}
        {errorBanner && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
            <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-600" />
            <span>{errorBanner}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Syllabus Topic Selector (Hierarchical: Unit -> Topic) */}
          <div className="space-y-2 rounded-2xl border border-gray-200 bg-gray-50/70 p-3.5 dark:border-gray-700 dark:bg-gray-900/40">
            <div className="flex items-center justify-between">
              <label className="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5 text-xs">
                <BookOpen className="h-3.5 w-3.5 text-purple-600" />
                <span>Syllabus Topic (Optional)</span>
              </label>
              {topicName && (
                <button
                  type="button"
                  onClick={() => setTopicName("")}
                  className="text-[11px] font-semibold text-red-500 hover:text-red-700 dark:text-red-400"
                >
                  Clear Selection
                </button>
              )}
            </div>

            {/* Currently Selected Topic Banner */}
            {topicName ? (
              <div className="flex items-center justify-between rounded-xl border border-purple-200 bg-purple-50 px-3 py-2 text-xs font-bold text-purple-800 dark:border-purple-800 dark:bg-purple-950/60 dark:text-purple-300">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  <span>
                    {selectedUnit ? <span className="font-medium text-purple-600/80 mr-1">{selectedUnit} →</span> : null}
                    {topicName}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setTopicName("")}
                  className="rounded-lg p-1 text-purple-500 hover:bg-purple-100 hover:text-purple-700 dark:hover:bg-purple-900/50"
                  title="Remove topic"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Click a unit below to view and select from its specific syllabus topics.
              </p>
            )}

            {/* Step 1: Unit List */}
            {Object.keys(unitsMap).length > 0 ? (
              <div className="space-y-1.5 pt-1">
                <span className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-400">
                  Step 1: Choose Unit
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(unitsMap).map(([unitKey, topics]) => {
                    const isUnitActive = selectedUnit === unitKey;
                    const hasSelectedTopic = topics.some((t) => t.topic_name === topicName);
                    return (
                      <button
                        type="button"
                        key={unitKey}
                        onClick={() => setSelectedUnit(isUnitActive ? "" : unitKey)}
                        className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                          isUnitActive
                            ? "bg-purple-600 text-white shadow-sm ring-2 ring-purple-400/40"
                            : hasSelectedTopic
                            ? "bg-purple-100 text-purple-800 border border-purple-300 dark:bg-purple-950/50 dark:text-purple-300"
                            : "bg-white text-gray-700 border border-gray-200 hover:border-purple-300 hover:bg-purple-50/50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
                        }`}
                      >
                        <span>{unitKey}</span>
                        <span
                          className={`rounded-full px-1.5 py-0.2 text-[10px] font-semibold ${
                            isUnitActive
                              ? "bg-purple-700 text-purple-100"
                              : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                          }`}
                        >
                          {topics.length}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {/* Step 2: Topics of the Clicked Unit */}
            {selectedUnit && unitsMap[selectedUnit] && (
              <div className="pt-2 border-t border-gray-200/80 dark:border-gray-700/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-500">
                    Step 2: Select Topic from {selectedUnit}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {unitsMap[selectedUnit].length} Topics Available
                  </span>
                </div>
                <div className="max-h-44 overflow-y-auto space-y-1 pr-1">
                  {unitsMap[selectedUnit].map((t) => {
                    const isSelected = topicName === t.topic_name;
                    return (
                      <button
                        type="button"
                        key={t.id}
                        onClick={() => setTopicName(isSelected ? "" : t.topic_name)}
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs transition-all text-left ${
                          isSelected
                            ? "bg-purple-600 text-white shadow-xs font-bold"
                            : "bg-white text-gray-800 border border-gray-100 hover:border-purple-200 hover:bg-purple-50/40 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 font-medium"
                        }`}
                      >
                        <span>{t.topic_name}</span>
                        {isSelected && <Check className="h-3.5 w-3.5 flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Marks and Bloom's Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                Total Marks *
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={totalMarks}
                onChange={(e) => setTotalMarks(Number(e.target.value))}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 font-bold text-purple-700 focus:border-purple-500 focus:bg-white focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-purple-300"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                Bloom&apos;s Level *
              </label>
              <select
                value={bloomLevel}
                onChange={(e) => setBloomLevel(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 font-semibold text-gray-800 focus:border-purple-500 focus:bg-white focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
              >
                <option value="K1">K1 - Remember</option>
                <option value="K2">K2 - Understand</option>
                <option value="K3">K3 - Apply</option>
                <option value="K4">K4 - Analyze</option>
                <option value="K5">K5 - Evaluate</option>
                <option value="K6">K6 - Create</option>
              </select>
            </div>
          </div>

          {/* Question Text Field with CKEditor */}
          <div>
            <CKEditorField
              title="Question Text *"
              placeholder="Enter complete question statement..."
              value={questionText}
              onChange={(val) => setQuestionText(val)}
              required
              minHeight="140px"
              badgeLabel="CKEditor"
              showImageUploadButton={true}
              showMathFormulaButton={true}
              onFormulaClick={() => handleOpenFormula("questionText", "Question Text")}
              showPreviewButton={true}
              isPreviewOpen={questionPreview}
              onTogglePreview={() => setQuestionPreview((prev) => !prev)}
              previewHtml={renderMathInHtml(questionText)}
              helperText="Supports rich text formatting, bullet points, numbered lists, blockquotes, tables, images, and LaTeX math formulas ($...$ or $$...$$)."
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-200 px-4 py-2 font-bold text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2 font-bold text-white shadow hover:bg-purple-700 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{questionToEdit ? "Update Question" : "Add to Candidate Pool"}</span>
              )}
            </button>
          </div>
        </form>

        <LatexFormulaModal
          open={formulaModalState.open}
          onClose={() => setFormulaModalState((prev) => ({ ...prev, open: false }))}
          onInsert={handleFormulaInserted}
          initialFormula={formulaModalState.initialFormula}
          targetLabel={formulaModalState.targetLabel}
        />
      </div>
    </div>
  );
};

export default ManualQuestionModal;
