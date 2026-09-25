import React, { useState, useEffect } from "react";
import {
  X,
  Plus,
  Trash2,
  Upload,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
  Loader2,
  Layers,
  Compass,
} from "lucide-react";
import { CandidateQuestion, SubQuestionItem } from "@/types/cia-test.types";
import DiagramStudioModal from "@/components/cia-tests/assembly/DiagramStudioModal";
import QuestionDiagramPreview from "@/components/cia-tests/assembly/QuestionDiagramPreview";

interface ManualQuestionModalProps {
  isOpen: boolean;
  questionToEdit?: CandidateQuestion | null;
  defaultMarks?: number | null;
  onClose: () => void;
  onSave: (payload: any) => Promise<boolean>;
  onUploadDiagram: (file: File) => Promise<{ diagram_url: string; filename?: string }>;
}

export const ManualQuestionModal: React.FC<ManualQuestionModalProps> = ({
  isOpen,
  questionToEdit,
  defaultMarks,
  onClose,
  onSave,
  onUploadDiagram,
}) => {
  const [questionType, setQuestionType] = useState<"DIRECT" | "SUB_QUESTIONS" | "EITHER_OR">("DIRECT");
  const [totalMarks, setTotalMarks] = useState<number>(defaultMarks || 10);
  const [courseOutcome, setCourseOutcome] = useState<string>("CO1");
  const [bloomLevel, setBloomLevel] = useState<string>("K3");
  const [questionText, setQuestionText] = useState<string>("");

  // Sub questions
  const [subQuestions, setSubQuestions] = useState<SubQuestionItem[]>([
    { sub_label: "a", text: "", marks: 5 },
    { sub_label: "b", text: "", marks: 5 },
  ]);

  // Either / Or
  const [optionAText, setOptionAText] = useState<string>("");
  const [optionBText, setOptionBText] = useState<string>("");

  // Diagram
  const [diagramUrl, setDiagramUrl] = useState<string | null>(null);
  const [diagramSpec, setDiagramSpec] = useState<Record<string, any> | null>(null);
  const [isDiagramStudioOpen, setIsDiagramStudioOpen] = useState<boolean>(false);
  const [uploadingDiagram, setUploadingDiagram] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  // Sync state if editing
  useEffect(() => {
    if (questionToEdit) {
      setQuestionText(questionToEdit.question_text || "");
      setTotalMarks(questionToEdit.max_marks || 10);
      setCourseOutcome(questionToEdit.course_outcome || "CO1");
      setBloomLevel(questionToEdit.bloom_level || "K3");
      setDiagramUrl(questionToEdit.diagram_url || null);
      setDiagramSpec(questionToEdit.diagram_spec || null);

      if (questionToEdit.option_a && questionToEdit.option_b) {
        setQuestionType("EITHER_OR");
        setOptionAText(questionToEdit.option_a.text || "");
        setOptionBText(questionToEdit.option_b.text || "");
      } else if (questionToEdit.sub_questions && questionToEdit.sub_questions.length > 0) {
        setQuestionType("SUB_QUESTIONS");
        setSubQuestions(questionToEdit.sub_questions);
      } else {
        setQuestionType("DIRECT");
      }
    } else {
      setQuestionText("");
      setTotalMarks(defaultMarks || 10);
      setCourseOutcome("CO1");
      setBloomLevel("K3");
      setDiagramUrl(null);
      setDiagramSpec(null);
      setQuestionType("DIRECT");
      setSubQuestions([
        { sub_label: "a", text: "", marks: 5 },
        { sub_label: "b", text: "", marks: 5 },
      ]);
      setOptionAText("");
      setOptionBText("");
    }
    setErrorBanner(null);
  }, [questionToEdit, isOpen, defaultMarks]);

  if (!isOpen) return null;

  // Validation
  const validateForm = (): boolean => {
    setErrorBanner(null);

    if (totalMarks <= 0) {
      setErrorBanner("Total marks must be greater than zero.");
      return false;
    }

    if (questionType === "DIRECT") {
      if (!questionText.trim()) {
        setErrorBanner("Please enter the question text.");
        return false;
      }
    } else if (questionType === "SUB_QUESTIONS") {
      if (!questionText.trim()) {
        setErrorBanner("Please enter the main question stem / problem description.");
        return false;
      }
      const sum = subQuestions.reduce((s, sq) => s + (Number(sq.marks) || 0), 0);
      if (sum !== totalMarks) {
        setErrorBanner(
          `Sub-question marks sum (${sum} Marks) must exactly equal total marks (${totalMarks} Marks).`
        );
        return false;
      }
      for (const sq of subQuestions) {
        if (!sq.text.trim()) {
          setErrorBanner("All sub-questions must have valid descriptive text.");
          return false;
        }
      }
    } else if (questionType === "EITHER_OR") {
      if (!optionAText.trim() || !optionBText.trim()) {
        setErrorBanner("Both Option A and Option B must be populated for an Either/Or question.");
        return false;
      }
    }

    return true;
  };

  const handleDiagramUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDiagram(true);
    try {
      const res = await onUploadDiagram(file);
      setDiagramUrl(res.diagram_url);
    } catch (err) {
      // Handled
    } finally {
      setUploadingDiagram(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const payload: any = {
        question_text:
          questionType === "EITHER_OR"
            ? `[Option A]: ${optionAText}\n\n(OR)\n\n[Option B]: ${optionBText}`
            : questionText,
        max_marks: Number(totalMarks),
        course_outcome: courseOutcome,
        bloom_level: bloomLevel,
        question_type: questionType,
        diagram_url: diagramUrl,
        diagram_spec: diagramSpec,
      };

      if (questionType === "SUB_QUESTIONS") {
        payload.sub_questions = subQuestions.map((sq) => ({
          sub_label: sq.sub_label,
          text: sq.text,
          marks: Number(sq.marks),
        }));
      } else if (questionType === "EITHER_OR") {
        payload.option_a = { text: optionAText, marks: Number(totalMarks) };
        payload.option_b = { text: optionBText, marks: Number(totalMarks) };
      }

      const success = await onSave(payload);
      if (success) {
        onClose();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const addSubQuestion = () => {
    const nextLabel = String.fromCharCode(97 + subQuestions.length);
    setSubQuestions([...subQuestions, { sub_label: nextLabel, text: "", marks: 2 }]);
  };

  const removeSubQuestion = (idx: number) => {
    if (subQuestions.length <= 1) return;
    setSubQuestions(subQuestions.filter((_, i) => i !== idx));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-800">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-700">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              {questionToEdit ? "Edit Candidate Question" : "Author New Question"}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Formulate a structured exam question with sub-parts, choice, and MinIO diagrams.
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
          {/* Question Type Selector */}
          <div>
            <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1.5">
              Question Structure Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setQuestionType("DIRECT")}
                className={`rounded-xl border p-2.5 font-bold transition-all text-center ${
                  questionType === "DIRECT"
                    ? "border-purple-600 bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300"
                }`}
              >
                Direct Single
              </button>
              <button
                type="button"
                onClick={() => setQuestionType("SUB_QUESTIONS")}
                className={`rounded-xl border p-2.5 font-bold transition-all text-center ${
                  questionType === "SUB_QUESTIONS"
                    ? "border-purple-600 bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300"
                }`}
              >
                Sub-Questions (a, b)
              </button>
              <button
                type="button"
                onClick={() => setQuestionType("EITHER_OR")}
                className={`rounded-xl border p-2.5 font-bold transition-all text-center ${
                  questionType === "EITHER_OR"
                    ? "border-purple-600 bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300"
                }`}
              >
                Either / Or Choice
              </button>
            </div>
          </div>

          {/* Marks, CO, and Bloom's Row */}
          <div className="grid grid-cols-3 gap-3">
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
                Course Outcome (CO) *
              </label>
              <select
                value={courseOutcome}
                onChange={(e) => setCourseOutcome(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 font-semibold text-gray-800 focus:border-purple-500 focus:bg-white focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
              >
                <option value="CO1">CO1</option>
                <option value="CO2">CO2</option>
                <option value="CO3">CO3</option>
                <option value="CO4">CO4</option>
                <option value="CO5">CO5</option>
              </select>
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

          {/* Question Text Fields based on Type */}
          {questionType === "DIRECT" && (
            <div>
              <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                Question Text *
              </label>
              <textarea
                rows={4}
                placeholder="Enter complete question statement..."
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 font-medium text-gray-800 focus:border-purple-500 focus:bg-white focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
              />
            </div>
          )}

          {questionType === "SUB_QUESTIONS" && (
            <div className="space-y-3">
              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Main Problem Description / Stem *
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Consider a binary search tree with keys [15, 20, 25, 30]..."
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 font-medium text-gray-800 focus:border-purple-500 focus:bg-white focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-gray-700 dark:text-gray-300">
                    Sub-Questions Breakdown (Sum must equal {totalMarks}M)
                  </span>
                  <button
                    type="button"
                    onClick={addSubQuestion}
                    className="inline-flex items-center gap-1 text-xs font-bold text-purple-600 hover:text-purple-700"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Sub-part
                  </button>
                </div>

                <div className="space-y-2">
                  {subQuestions.map((sq, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 p-2.5 dark:border-gray-700 dark:bg-gray-900"
                    >
                      <input
                        type="text"
                        value={sq.sub_label}
                        onChange={(e) => {
                          const updated = [...subQuestions];
                          updated[idx].sub_label = e.target.value;
                          setSubQuestions(updated);
                        }}
                        className="w-10 rounded-lg border border-gray-300 bg-white p-1.5 text-center font-bold dark:border-gray-600 dark:bg-gray-800"
                      />
                      <input
                        type="text"
                        placeholder="Sub-question description..."
                        value={sq.text}
                        onChange={(e) => {
                          const updated = [...subQuestions];
                          updated[idx].text = e.target.value;
                          setSubQuestions(updated);
                        }}
                        className="flex-1 rounded-lg border border-gray-300 bg-white p-1.5 font-medium dark:border-gray-600 dark:bg-gray-800"
                      />
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="1"
                          value={sq.marks}
                          onChange={(e) => {
                            const updated = [...subQuestions];
                            updated[idx].marks = Number(e.target.value);
                            setSubQuestions(updated);
                          }}
                          className="w-16 rounded-lg border border-gray-300 bg-white p-1.5 text-center font-bold text-purple-700 dark:border-gray-600 dark:bg-gray-800 dark:text-purple-300"
                        />
                        <span className="font-bold text-gray-500">M</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeSubQuestion(idx)}
                        disabled={subQuestions.length <= 1}
                        className="p-1 text-gray-400 hover:text-red-600 disabled:opacity-30"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {questionType === "EITHER_OR" && (
            <div className="space-y-3">
              <div>
                <label className="block font-bold text-purple-700 dark:text-purple-300 mb-1">
                  Option A Statement ({totalMarks} Marks) *
                </label>
                <textarea
                  rows={3}
                  placeholder="Enter complete Option A problem..."
                  value={optionAText}
                  onChange={(e) => setOptionAText(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 font-medium text-gray-800 focus:border-purple-500 focus:bg-white focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                />
              </div>

              <div className="text-center font-black text-purple-600 dark:text-purple-400">
                — OR —
              </div>

              <div>
                <label className="block font-bold text-purple-700 dark:text-purple-300 mb-1">
                  Option B Statement ({totalMarks} Marks) *
                </label>
                <textarea
                  rows={3}
                  placeholder="Enter complete Option B problem..."
                  value={optionBText}
                  onChange={(e) => setOptionBText(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 font-medium text-gray-800 focus:border-purple-500 focus:bg-white focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                />
              </div>
            </div>
          )}

          {/* Diagram Upload Section */}
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-3.5 dark:border-gray-700 dark:bg-gray-900">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <ImageIcon className="h-4 w-4 text-purple-600" />
                Attach Diagram or Circuit Image (MinIO Object Storage)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsDiagramStudioOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-bold text-purple-700 hover:bg-purple-100 dark:border-purple-800 dark:bg-purple-950/40 dark:text-purple-300 transition-colors"
                >
                  <Compass className="h-3.5 w-3.5" />
                  <span>Vector Diagram Studio</span>
                </button>
                {diagramUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setDiagramUrl(null);
                      setDiagramSpec(null);
                    }}
                    className="text-xs font-semibold text-red-600 hover:underline"
                  >
                    Remove Image
                  </button>
                )}
              </div>
            </div>

            {diagramUrl || diagramSpec ? (
              <div className="flex items-center gap-3">
                <QuestionDiagramPreview
                  diagramUrl={diagramUrl}
                  diagramSpec={diagramSpec}
                  thumbnail={true}
                  onOpenStudio={() => setIsDiagramStudioOpen(true)}
                />
                <span className="text-xs text-green-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" /> Vector diagram attached & ready
                </span>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 py-4 cursor-pointer hover:border-purple-500 dark:border-gray-600">
                {uploadingDiagram ? (
                  <div className="flex items-center gap-2 text-purple-600 font-semibold">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Uploading image to MinIO...</span>
                  </div>
                ) : (
                  <>
                    <Upload className="h-5 w-5 text-gray-400 mb-1" />
                    <span className="font-semibold text-gray-600 dark:text-gray-300">
                      Click to upload diagram image (PNG, JPG, SVG)
                    </span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleDiagramUpload}
                  disabled={uploadingDiagram}
                  className="hidden"
                />
              </label>
            )}
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
              disabled={submitting || uploadingDiagram}
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
      </div>

      <DiagramStudioModal
        isOpen={isDiagramStudioOpen}
        onClose={() => setIsDiagramStudioOpen(false)}
        initialSpec={diagramSpec}
        onSaveSpec={(spec, renderedUrl) => {
          setDiagramSpec(spec);
          setDiagramUrl(renderedUrl);
        }}
      />
    </div>
  );
};

export default ManualQuestionModal;
