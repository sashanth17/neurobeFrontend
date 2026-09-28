import React, { useState, useEffect } from "react";
import { X, Plus, Trash2, AlertCircle, CheckCircle2, Award, Sparkles, Layers } from "lucide-react";
import { CreateTemplatePayload, QuestionPaperTemplate } from "@/types/cia-test.types";

interface CreateTemplateModalProps {
  isOpen: boolean;
  courseCode: string;
  initialData?: QuestionPaperTemplate | null;
  onClose: () => void;
  onSubmit: (payload: CreateTemplatePayload, editId?: number) => Promise<boolean>;
}

export const CreateTemplateModal: React.FC<CreateTemplateModalProps> = ({
  isOpen,
  courseCode,
  initialData,
  onClose,
  onSubmit,
}) => {
  const isEditing = Boolean(initialData);
  const [submitting, setSubmitting] = useState(false);
  const [templateName, setTemplateName] = useState("CIA-1 Standard Blueprint");
  const [totalMarks, setTotalMarks] = useState<number>(50);
  const [status, setStatus] = useState("drafted");
  const [description, setDescription] = useState(
    "Standard CIA question paper blueprint with short and analytical sections."
  );

  // Default Sections (Standard 50M: 10x2 = 20M + 2x15 = 30M)
  const defaultSections = [
    {
      section_order: 1,
      section_name: "Section A",
      section_title: "Part A - Short Answer Questions",
      allocated_marks: 20,
      questions: [
        { question_number: 1, max_marks: 2 },
        { question_number: 2, max_marks: 2 },
        { question_number: 3, max_marks: 2 },
        { question_number: 4, max_marks: 2 },
        { question_number: 5, max_marks: 2 },
        { question_number: 6, max_marks: 2 },
        { question_number: 7, max_marks: 2 },
        { question_number: 8, max_marks: 2 },
        { question_number: 9, max_marks: 2 },
        { question_number: 10, max_marks: 2 },
      ],
    },
    {
      section_order: 2,
      section_name: "Section B",
      section_title: "Part B - Analytical Problems",
      allocated_marks: 30,
      questions: [
        { question_number: 1, max_marks: 15 },
        { question_number: 2, max_marks: 15 },
      ],
    },
  ];

  const [sections, setSections] = useState(defaultSections);

  useEffect(() => {
    if (initialData) {
      // Strip course code suffix if already present for cleaner editing
      const cleanName = initialData.template_name
        .replace(new RegExp(` - ${courseCode}$`, "i"), "")
        .replace(new RegExp(` - ${initialData.course_code}$`, "i"), "");

      setTemplateName(cleanName || initialData.template_name);
      setTotalMarks(Number(initialData.total_maximum_marks) || 50);
      setStatus(initialData.status || "drafted");
      setDescription(initialData.description || "");

      if (initialData.sections && initialData.sections.length > 0) {
        setSections(
          initialData.sections.map((sec, idx) => ({
            section_order: sec.section_order || idx + 1,
            section_name: sec.section_name || `Section ${String.fromCharCode(65 + idx)}`,
            section_title: sec.section_title || `Part ${String.fromCharCode(65 + idx)}`,
            allocated_marks: Number(sec.allocated_marks) || 0,
            questions: (sec.questions || []).map((q, qIdx) => ({
              question_number: q.question_number || qIdx + 1,
              max_marks: Number(q.max_marks) || 1,
            })),
          }))
        );
      } else {
        setSections(defaultSections);
      }
    } else {
      setTemplateName("CIA-1 Standard Blueprint");
      setTotalMarks(50);
      setStatus("drafted");
      setDescription("Standard CIA question paper blueprint with short and analytical sections.");
      setSections(defaultSections);
    }
  }, [initialData, isOpen, courseCode]);

  if (!isOpen) return null;

  // Mathematical Validations
  const sectionsSum = sections.reduce((sum, s) => sum + (Number(s.allocated_marks) || 0), 0);
  const isTemplateMarksValid = sectionsSum === Number(totalMarks);

  const isSectionValid = (section: (typeof sections)[0]) => {
    const qSum = section.questions.reduce((sum, q) => sum + (Number(q.max_marks) || 0), 0);
    return qSum === Number(section.allocated_marks);
  };

  const allSectionsValid = sections.every((s) => isSectionValid(s));
  const isFormValid = isTemplateMarksValid && allSectionsValid && templateName.trim() !== "";

  // Handlers for Sections
  const handleAddSection = () => {
    const nextOrder = sections.length + 1;
    const letter = String.fromCharCode(65 + sections.length);
    setSections([
      ...sections,
      {
        section_order: nextOrder,
        section_name: `Section ${letter}`,
        section_title: `Part ${letter} Questions`,
        allocated_marks: 10,
        questions: [{ question_number: 1, max_marks: 10 }],
      },
    ]);
  };

  const handleRemoveSection = (idx: number) => {
    if (sections.length <= 1) return;
    setSections(sections.filter((_, i) => i !== idx));
  };

  const handleUpdateSection = (idx: number, field: string, value: any) => {
    setSections(
      sections.map((s, i) => (i === idx ? { ...s, [field]: value } : s))
    );
  };

  // Handlers for Questions inside Section
  const handleAddQuestion = (secIdx: number) => {
    setSections(
      sections.map((sec, i) => {
        if (i !== secIdx) return sec;
        const nextQNo = sec.questions.length + 1;
        return {
          ...sec,
          questions: [...sec.questions, { question_number: nextQNo, max_marks: 2 }],
        };
      })
    );
  };

  const handleRemoveQuestion = (secIdx: number, qIdx: number) => {
    setSections(
      sections.map((sec, i) => {
        if (i !== secIdx) return sec;
        if (sec.questions.length <= 1) return sec;
        return {
          ...sec,
          questions: sec.questions.filter((_, qi) => qi !== qIdx),
        };
      })
    );
  };

  const handleUpdateQuestion = (secIdx: number, qIdx: number, maxMarks: number) => {
    setSections(
      sections.map((sec, i) => {
        if (i !== secIdx) return sec;
        return {
          ...sec,
          questions: sec.questions.map((q, qi) =>
            qi === qIdx ? { ...q, max_marks: maxMarks } : q
          ),
        };
      })
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setSubmitting(true);
    const payload: CreateTemplatePayload = {
      template_name: templateName.trim(),
      total_maximum_marks: Number(totalMarks),
      status,
      description: description.trim(),
      sections: sections.map((s, sIdx) => ({
        section_order: sIdx + 1,
        section_name: s.section_name,
        section_title: s.section_title,
        allocated_marks: Number(s.allocated_marks),
        questions: s.questions.map((q, qIdx) => ({
          question_number: qIdx + 1,
          max_marks: Number(q.max_marks),
        })),
      })),
    };

    const success = await onSubmit(payload, initialData?.id);
    setSubmitting(false);
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={onClose} />

      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-850 z-10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700 bg-gradient-to-r from-purple-50/60 to-white dark:from-purple-950/20 dark:to-gray-850">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-purple-600 px-2 py-0.5 text-[11px] font-bold text-white uppercase">
                {courseCode}
              </span>
              <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                {isEditing ? "Edit Question Paper Blueprint Template" : "Create Question Paper Blueprint Template"}
              </h3>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {isEditing
                ? "Modify section distributions and question marks. Only available before assignment to CIA tests."
                : "Define question distribution, section marks, and scoring schema."}
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Template Name & Auto-suffix preview */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Template Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="e.g. CIA-1 Standard Blueprint"
                className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs text-gray-800 transition-colors focus:border-purple-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
              />
              <p className="mt-1 text-[11px] text-gray-400 flex items-center gap-1">
                <span>Stored name preview:</span>
                <strong className="text-purple-600 dark:text-purple-400">
                  {templateName.trim() || "Template"} - {courseCode}
                </strong>
              </p>
            </div>

            {/* Total Maximum Marks */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Total Maximum Marks <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={10}
                  max={300}
                  value={totalMarks}
                  onChange={(e) => setTotalMarks(Number(e.target.value))}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs font-bold text-purple-700 transition-colors focus:border-purple-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-purple-300"
                />
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Lifecycle Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-800 transition-colors focus:border-purple-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
              >
                <option value="drafted">Drafted</option>
                <option value="build">Build</option>
                <option value="underreview">Under Review</option>
                <option value="verified">Verified</option>
              </select>
            </div>

            {/* Description */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Description / Exam Notes
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief summary of pattern..."
                className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs text-gray-800 transition-colors focus:border-purple-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
              />
            </div>
          </div>

          {/* Mathematical Validation Balance Banner */}
          <div
            className={`flex items-center justify-between rounded-2xl p-4 text-xs font-semibold transition-colors ${
              isTemplateMarksValid
                ? "bg-green-50 text-green-800 border border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800"
                : "bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800"
            }`}
          >
            <div className="flex items-center gap-2">
              {isTemplateMarksValid ? (
                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
              )}
              <span>
                {isTemplateMarksValid
                  ? "Marks Balance Valid: Sum of all sections equals Total Maximum Marks."
                  : `Marks Mismatch: Sum of sections (${sectionsSum}M) does not equal Total Maximum Marks (${totalMarks}M).`}
              </span>
            </div>
            <span className="font-extrabold text-sm">
              {sectionsSum} / {totalMarks} M
            </span>
          </div>

          {/* Sections Builder */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                Blueprint Sections & Question Allocations
              </h4>

              <button
                type="button"
                onClick={handleAddSection}
                className="flex items-center gap-1 text-xs font-bold text-purple-600 hover:text-purple-700 dark:text-purple-400"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Section</span>
              </button>
            </div>

            {sections.map((sec, secIdx) => {
              const secQSum = sec.questions.reduce((sum, q) => sum + (Number(q.max_marks) || 0), 0);
              const valid = secQSum === Number(sec.allocated_marks);

              return (
                <div
                  key={secIdx}
                  className="rounded-2xl border border-gray-200 bg-gray-50/50 p-4 dark:border-gray-700 dark:bg-gray-800/40 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 dark:border-gray-700 pb-3">
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="text"
                        value={sec.section_name}
                        onChange={(e) => handleUpdateSection(secIdx, "section_name", e.target.value)}
                        placeholder="Section A"
                        className="w-28 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-bold text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                      />
                      <input
                        type="text"
                        value={sec.section_title}
                        onChange={(e) => handleUpdateSection(secIdx, "section_title", e.target.value)}
                        placeholder="Part A - Short Answer Questions"
                        className="flex-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="font-semibold text-gray-500">Allocated:</span>
                        <input
                          type="number"
                          value={sec.allocated_marks}
                          onChange={(e) =>
                            handleUpdateSection(secIdx, "allocated_marks", Number(e.target.value))
                          }
                          className="w-16 rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs font-bold text-center text-purple-700 dark:border-gray-700 dark:bg-gray-800 dark:text-purple-300"
                        />
                        <span>M</span>
                      </div>

                      {sections.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSection(secIdx)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Section Question Sum Checker */}
                  <div className="flex items-center justify-between text-[11px]">
                    <span
                      className={`font-semibold ${
                        valid ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"
                      }`}
                    >
                      {valid
                        ? `✓ Questions sum matches section allocated marks (${secQSum}M).`
                        : `⚠ Question marks sum (${secQSum}M) != Section allocated marks (${sec.allocated_marks}M).`}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleAddQuestion(secIdx)}
                      className="text-purple-600 hover:text-purple-700 font-bold flex items-center gap-1"
                    >
                      <Plus className="h-3 w-3" /> Add Question
                    </button>
                  </div>

                  {/* Questions Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    {sec.questions.map((q, qIdx) => (
                      <div
                        key={qIdx}
                        className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-2 text-xs dark:border-gray-700 dark:bg-gray-800"
                      >
                        <span className="font-bold text-gray-500">Q{qIdx + 1}</span>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min={0.5}
                            step={0.5}
                            value={q.max_marks}
                            onChange={(e) =>
                              handleUpdateQuestion(secIdx, qIdx, Number(e.target.value))
                            }
                            className="w-12 rounded border border-gray-200 px-1 py-0.5 text-center text-xs font-bold text-gray-800 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                          />
                          <span className="text-[10px] text-gray-400">M</span>
                          {sec.questions.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveQuestion(secIdx, qIdx)}
                              className="text-gray-400 hover:text-red-500 ml-1"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <p className="text-[11px] text-gray-500">
            * All section and template mark totals must match before saving.
          </p>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || !isFormValid}
              className="flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-purple-500/20 hover:bg-purple-700 active:scale-95 disabled:opacity-50 transition-all"
            >
              <Sparkles className="h-4 w-4" />
              <span>
                {submitting
                  ? isEditing
                    ? "Updating..."
                    : "Saving..."
                  : isEditing
                  ? "Update Blueprint Template"
                  : "Create Blueprint Template"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateTemplateModal;
