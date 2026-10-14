import React, { useState, useEffect, useMemo } from "react";
import { Check, Plus, Lock, HelpCircle, PenTool, Sparkles, BookOpen, Target, Zap, Image as ImageIcon, Sigma, Eye, EyeOff } from "lucide-react";
import { ModalShell } from "@/components/academic-setup/AddModals";
import TextInput from "@/components/FormFields/TextInput.component";
import TextArea from "@/components/FormFields/TextArea.component";
import CustomSelect from "@/components/FormFields/CustomSelect.component";
import CKEditorField from "@/components/FormFields/CKEditorField.component";
import LatexFormulaModal from "@/components/common-components/LatexFormulaModal";
import { renderMathInHtml } from "@/components/common-components/katexLoader";
import { useCourseOutcomes } from "@/hook/useCourseOutcomes";
import { HierarchyUnitItem } from "./SimplifiedMCQGenerator";
import { Failure } from "@/utils/function.utils";

const DEFAULT_UNIT_OPTIONS = [
  { value: "1", label: "Unit 1 — Foundational Concepts & Architecture" },
  { value: "2", label: "Unit 2 — Core Protocols & Algorithms" },
  { value: "3", label: "Unit 3 — Design Principles & Analysis" },
  { value: "4", label: "Unit 4 — Implementation & Systems" },
  { value: "5", label: "Unit 5 — Advanced Topics & Applications" },
];

const DEFAULT_TOPIC_OPTIONS = [
  { value: "Core Concept", label: "Core Concept" },
  { value: "Design & Implementation", label: "Design & Implementation" },
  { value: "Protocol Architecture", label: "Protocol Architecture" },
  { value: "Problem Solving", label: "Problem Solving" },
];

const CO_OPTIONS = [
  { value: "CO1", label: "CO1" },
  { value: "CO2", label: "CO2" },
  { value: "CO3", label: "CO3" },
  { value: "CO4", label: "CO4" },
  { value: "CO5", label: "CO5" },
  { value: "CO6", label: "CO6" },
];

const KNOWLEDGE_OPTIONS = [
  { value: "K1", label: "K1 (Remember)" },
  { value: "K2", label: "K2 (Understand)" },
  { value: "K3", label: "K3 (Apply)" },
  { value: "K4", label: "K4 (Analyze)" },
  { value: "K5", label: "K5 (Evaluate)" },
  { value: "K6", label: "K6 (Create)" },
];

const DIFFICULTY_OPTIONS = [
  { value: "Easy", label: "Easy" },
  { value: "Medium", label: "Medium" },
  { value: "Hard", label: "Hard" },
];

const STATUS_OPTIONS = [
  { value: "Draft", label: "Draft" },
  { value: "Approved", label: "Approved" },
];

const MARKS_OPTIONS = [
  { value: "1", label: "1 Mark" },
  { value: "2", label: "2 Marks" },
  { value: "4", label: "4 Marks" },
  { value: "5", label: "5 Marks" },
];

export interface AuthorManualQuestionModalProps {
  open: boolean;
  onClose: () => void;
  courseId?: string | number;
  courseCode?: string;
  courseTitle?: string;
  hierarchyUnits?: HierarchyUnitItem[];
  coOptions?: any[];
  nextQuestionIndex?: number;
  onSave: (newQuestion: any) => Promise<void> | void;
}

export const AuthorManualQuestionModal: React.FC<AuthorManualQuestionModalProps> = ({
  open,
  onClose,
  courseId,
  courseCode = "MCQ",
  courseTitle = "Course",
  hierarchyUnits = [],
  coOptions: customCoOptions,
  nextQuestionIndex = 1,
  onSave,
}) => {
  const { coOptions: fetchedCoOptions } = useCourseOutcomes(courseId);
  const activeCoOptions = customCoOptions || (fetchedCoOptions.length > 0 ? fetchedCoOptions : CO_OPTIONS);

  const [isSaving, setIsSaving] = useState(false);

  // Computed Unit Options from hierarchy if available
  const unitOptions = useMemo(() => {
    if (hierarchyUnits && hierarchyUnits.length > 0) {
      return hierarchyUnits.map((u) => ({
        value: String(u.unit_number),
        label: `Unit ${u.unit_number} — ${u.unit_title || `Unit ${u.unit_number}`}`,
      }));
    }
    return DEFAULT_UNIT_OPTIONS;
  }, [hierarchyUnits]);

  // Form State
  const [form, setForm] = useState({
    unit: unitOptions[0] || DEFAULT_UNIT_OPTIONS[0],
    topic: null as any,
    customTopic: "",
    subtopic: "",
    co: activeCoOptions[0] || CO_OPTIONS[0],
    knowledge: KNOWLEDGE_OPTIONS[1] || KNOWLEDGE_OPTIONS[0], // default K2
    marks: MARKS_OPTIONS[1], // default 2 Marks
    difficulty: DIFFICULTY_OPTIONS[1], // default Medium
    status: STATUS_OPTIONS[1], // default Approved so it goes straight to the active question pool!
    question: "",
    optionA: "",
    optionB: "",
    optionC: "",
    optionD: "",
    correctAnswer: "A" as "A" | "B" | "C" | "D",
    explanation: "",
  });

  // Dynamic Topic Options based on selected unit
  const topicOptions = useMemo(() => {
    const selectedUnitNum = Number(form.unit?.value || 1);
    const foundUnit = hierarchyUnits.find((u) => Number(u.unit_number) === selectedUnitNum);
    if (foundUnit && foundUnit.topics && foundUnit.topics.length > 0) {
      return foundUnit.topics.map((t) => ({
        value: t.title,
        label: t.title,
      }));
    }
    return DEFAULT_TOPIC_OPTIONS;
  }, [form.unit, hierarchyUnits]);

  // Update default topic when unit changes
  useEffect(() => {
    if (topicOptions && topicOptions.length > 0) {
      setForm((prev) => ({
        ...prev,
        topic: topicOptions[0],
        customTopic: "",
      }));
    }
  }, [form.unit, topicOptions]);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      const initialUnit = unitOptions[0] || DEFAULT_UNIT_OPTIONS[0];
      const initialUnitNum = Number(initialUnit?.value || 1);
      const foundUnit = hierarchyUnits.find((u) => Number(u.unit_number) === initialUnitNum);
      const initialTopics =
        foundUnit && foundUnit.topics?.length > 0
          ? foundUnit.topics.map((t) => ({ value: t.title, label: t.title }))
          : DEFAULT_TOPIC_OPTIONS;

      setForm({
        unit: initialUnit,
        topic: initialTopics[0] || null,
        customTopic: "",
        subtopic: "",
        co: activeCoOptions[0] || CO_OPTIONS[0],
        knowledge: KNOWLEDGE_OPTIONS[1],
        marks: MARKS_OPTIONS[1],
        difficulty: DIFFICULTY_OPTIONS[1],
        status: STATUS_OPTIONS[1],
        question: "",
        optionA: "",
        optionB: "",
        optionC: "",
        optionD: "",
        correctAnswer: "A",
        explanation: "",
      });
      setIsSaving(false);
    }
  }, [open, unitOptions, hierarchyUnits, activeCoOptions]);

  const set = (key: string, val: any) => setForm((p) => ({ ...p, [key]: val }));

  // LaTeX Formula Modal State
  const [formulaModalState, setFormulaModalState] = useState<{
    open: boolean;
    target: "question" | "optionA" | "optionB" | "optionC" | "optionD";
    targetLabel: string;
    initialFormula?: string;
  }>({
    open: false,
    target: "question",
    targetLabel: "Question Statement",
    initialFormula: "",
  });

  const [optionPreviews, setOptionPreviews] = useState<Record<string, boolean>>({
    A: false,
    B: false,
    C: false,
    D: false,
  });
  const [questionPreview, setQuestionPreview] = useState(false);

  const toggleOptionPreview = (key: string) => {
    setOptionPreviews((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleOpenFormula = (
    target: "question" | "optionA" | "optionB" | "optionC" | "optionD",
    label: string
  ) => {
    let currentText = "";
    if (target === "question") {
      currentText = form.question;
    } else {
      currentText = (form as any)[target] || "";
    }
    const match = currentText.match(/(\$\$[\s\S]*?\$\$|\$[^$\n]+?\$)/g);
    const lastFormula = match ? match[match.length - 1] : "";

    setFormulaModalState({
      open: true,
      target,
      targetLabel: label,
      initialFormula: lastFormula,
    });
  };

  const handleFormulaInserted = (latexFormula: string) => {
    const { target } = formulaModalState;
    if (target === "question") {
      const cur = form.question || "";
      set("question", cur ? `${cur} ${latexFormula}` : `<p>${latexFormula}</p>`);
      setQuestionPreview(true);
    } else {
      const cur = (form as any)[target] || "";
      set(target, cur ? `${cur} ${latexFormula}` : latexFormula);
      const key = target.replace("option", "");
      setOptionPreviews((prev) => ({ ...prev, [key]: true }));
    }
  };

  // Check if any field contains LaTeX delimiters
  const hasMathContent = useMemo(() => {
    const fullContent = `${form.question} ${form.optionA} ${form.optionB} ${form.optionC} ${form.optionD}`;
    return /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\$[^$\n]+?\$|\\\([\s\S]*?\\\))/g.test(fullContent);
  }, [form.question, form.optionA, form.optionB, form.optionC, form.optionD]);

  const generatedCode = `Q-${courseCode.replace(/[^a-zA-Z0-9]/g, "")}-${String(nextQuestionIndex).padStart(2, "0")}`;

  const isHtmlEmpty = (html: string) => {
    if (!html) return true;
    const stripped = html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
    return stripped.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isHtmlEmpty(form.question)) {
      Failure("Please enter the question statement.");
      return;
    }

    if (
      isHtmlEmpty(form.optionA) ||
      isHtmlEmpty(form.optionB) ||
      isHtmlEmpty(form.optionC) ||
      isHtmlEmpty(form.optionD)
    ) {
      Failure("Please fill in all 4 options (A, B, C, and D).");
      return;
    }

    const selectedTopicTitle = form.customTopic.trim() || form.topic?.value || form.topic?.label || "General Topic";

    setIsSaving(true);
    try {
      const formattedOptions = [
        {
          key: "A" as const,
          text: form.optionA.trim(),
          is_correct: form.correctAnswer === "A",
          isCorrect: form.correctAnswer === "A",
        },
        {
          key: "B" as const,
          text: form.optionB.trim(),
          is_correct: form.correctAnswer === "B",
          isCorrect: form.correctAnswer === "B",
        },
        {
          key: "C" as const,
          text: form.optionC.trim(),
          is_correct: form.correctAnswer === "C",
          isCorrect: form.correctAnswer === "C",
        },
        {
          key: "D" as const,
          text: form.optionD.trim(),
          is_correct: form.correctAnswer === "D",
          isCorrect: form.correctAnswer === "D",
        },
      ];

      const unitNum = Number(form.unit?.value || 1);
      const unitLabel = form.unit?.label || `Unit ${unitNum}`;
      const cleanQuestion = form.question.trim();
      const newQuestionPayload = {
        question_code: generatedCode,
        code: generatedCode,
        text: cleanQuestion,
        question: cleanQuestion,
        options: formattedOptions,
        explanation: undefined,
        unit_number: unitNum,
        unit: unitLabel,
        topic: selectedTopicTitle,
        subtopic: form.subtopic.trim() || undefined,
        course_outcome: form.co?.value || "CO1",
        co: form.co?.value || "CO1",
        knowledge_level: form.knowledge?.value || "K2",
        level: form.knowledge?.value || "K2",
        difficulty: form.difficulty?.value || "Medium",
        marks: String(form.marks?.value || "2"),
        status: form.status?.value || "Approved",
      };

      await onSave(newQuestionPayload);
      onClose();
    } catch (err: any) {
      console.error("[AuthorManualQuestionModal] Error:", err);
      Failure(typeof err === "string" ? err : "Failed to save question. Please check details.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ModalShell
      title="Author Question Manually"
      subtitle={`${courseCode} — ${courseTitle}`}
      icon={<PenTool className="h-4 w-4 text-purple-600" />}
      open={open}
      onClose={onClose}
      code={generatedCode}
      maxWidth="max-w-4xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Banner */}
        <div className="flex items-center gap-2 rounded-xl border border-purple-200 bg-purple-50/70 px-3.5 py-2.5 text-xs text-purple-900 dark:border-purple-800 dark:bg-purple-950/30 dark:text-purple-200">
          <Sparkles className="h-4 w-4 shrink-0 text-purple-600 dark:text-purple-400" />
          <span>
            Define custom question text, answer options, and align with syllabus units, Bloom's level, and Course Outcomes.
          </span>
        </div>

        {/* Section 1: Academic Alignment (Unit, Topic, Subtopic) */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/40 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
            <BookOpen className="h-3.5 w-3.5 text-indigo-600" />
            <span>Academic Alignment</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <CustomSelect
              title="Unit"
              options={unitOptions}
              value={form.unit}
              onChange={(v) => set("unit", v)}
              isSearchable={false}
              isClearable={false}
              required
            />
            <CustomSelect
              title="Topic"
              options={topicOptions}
              value={form.topic}
              onChange={(v) => set("topic", v)}
              isSearchable={true}
              isClearable={false}
              placeholder="Select topic..."
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <TextInput
              title="Custom Topic (Optional Override)"
              placeholder="Or type custom topic name..."
              value={form.customTopic}
              onChange={(e) => set("customTopic", e.target.value)}
            />
            <TextInput
              title="Subtopic (Optional)"
              placeholder="e.g. Subnet Masking Design"
              value={form.subtopic}
              onChange={(e) => set("subtopic", e.target.value)}
            />
          </div>
        </div>

        {/* Section 2: Metadata (CO, Knowledge, Marks, Difficulty, Status) */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <CustomSelect
            title="Course Outcome"
            options={activeCoOptions}
            value={form.co}
            onChange={(v) => set("co", v)}
            isSearchable={false}
            isClearable={false}
          />
          <CustomSelect
            title="Knowledge Level"
            options={KNOWLEDGE_OPTIONS}
            value={form.knowledge}
            onChange={(v) => set("knowledge", v)}
            isSearchable={false}
            isClearable={false}
          />
          <CustomSelect
            title="Difficulty"
            options={DIFFICULTY_OPTIONS}
            value={form.difficulty}
            onChange={(v) => set("difficulty", v)}
            isSearchable={false}
            isClearable={false}
          />
          <CustomSelect
            title="Marks"
            options={MARKS_OPTIONS}
            value={form.marks}
            onChange={(v) => set("marks", v)}
            isSearchable={false}
            isClearable={false}
          />
          <CustomSelect
            title="Initial Status"
            options={STATUS_OPTIONS}
            value={form.status}
            onChange={(v) => set("status", v)}
            isSearchable={false}
            isClearable={false}
          />
        </div>

        {/* Section 3: Question Statement */}
        <div>
          <CKEditorField
            title="Question Statement"
            placeholder="Type your question statement here..."
            value={form.question}
            onChange={(val) => set("question", val)}
            required
            minHeight="140px"
            badgeLabel="CKEditor"
            showMathFormulaButton={true}
            onFormulaClick={() => handleOpenFormula("question", "Question Statement")}
            showPreviewButton={true}
            isPreviewOpen={questionPreview}
            onTogglePreview={() => setQuestionPreview((prev) => !prev)}
            previewHtml={renderMathInHtml(form.question)}
            helperText="Supports rich text formatting, bullet points, numbered lists, blockquotes, tables, and LaTeX math formulas ($...$ or $$...$$)."
          />
        </div>

        {/* Section 4: Options and Correct Option Selection */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/40">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Answer Options & Correct Key *
            </span>
            <span className="text-[11px] text-slate-500">
              Click the radio badge next to an option to designate it as the correct answer.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {[
              { key: "A" as const, val: form.optionA, setter: "optionA", color: "blue" },
              { key: "B" as const, val: form.optionB, setter: "optionB", color: "amber" },
              { key: "C" as const, val: form.optionC, setter: "optionC", color: "emerald" },
              { key: "D" as const, val: form.optionD, setter: "optionD", color: "purple" },
            ].map(({ key, val, setter }) => {
              const isSelected = form.correctAnswer === key;
              return (
                <div
                  key={key}
                  className={`relative rounded-xl border p-3 transition-all ${
                    isSelected
                      ? "border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500/30 dark:bg-emerald-950/20"
                      : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5 mb-2.5">
                    {/* Left: Option Identifier Badge */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="flex h-5 w-5 items-center justify-center rounded-md bg-slate-900 text-[11px] font-bold text-white shadow-2xs dark:bg-slate-100 dark:text-slate-900">
                        {key}
                      </span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Option {key}
                      </span>
                    </div>

                    {/* Right: Quick Toolbar + Correct Answer Selector */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Compact Option Quick Actions (Image, Math, Preview) */}
                      <div className="flex items-center rounded-md border border-slate-200 bg-slate-50/90 p-0.5 dark:border-slate-700 dark:bg-slate-800/90 shadow-2xs">
                        {/* Direct Option Image Attachment */}
                        <label
                          className="flex h-6 w-6 items-center justify-center rounded text-slate-500 hover:bg-white hover:text-purple-600 hover:shadow-2xs dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-purple-300 transition cursor-pointer active:scale-95"
                          title={`Attach image or diagram to Option ${key}`}
                        >
                          <ImageIcon className="h-3.5 w-3.5" />
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const reader = new FileReader();
                              reader.onload = () => {
                                const base64 = reader.result as string;
                                const currentVal = (form as any)[setter] || "";
                                const imgHtml = `<p><img src="${base64}" alt="Option ${key}" /></p>`;
                                set(setter, currentVal ? `${currentVal}${imgHtml}` : imgHtml);
                              };
                              reader.readAsDataURL(file);
                              e.target.value = "";
                            }}
                          />
                        </label>

                        {/* Direct Option LaTeX Formula Attachment */}
                        <button
                          type="button"
                          onClick={() => handleOpenFormula(setter as any, `Option ${key}`)}
                          className="flex h-6 w-6 items-center justify-center rounded text-slate-500 hover:bg-white hover:text-indigo-600 hover:shadow-2xs dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-indigo-300 transition cursor-pointer active:scale-95"
                          title={`Insert LaTeX math formula into Option ${key}`}
                        >
                          <Sigma className="h-3.5 w-3.5" />
                        </button>

                        {/* Direct Option Preview Toggle (Eye Icon) */}
                        <button
                          type="button"
                          onClick={() => toggleOptionPreview(key)}
                          className={`flex h-6 w-6 items-center justify-center rounded transition cursor-pointer active:scale-95 ${
                            optionPreviews[key]
                              ? "bg-purple-600 text-white shadow-2xs font-bold"
                              : "text-slate-500 hover:bg-white hover:text-purple-600 hover:shadow-2xs dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-purple-300"
                          }`}
                          title={
                            optionPreviews[key]
                              ? `Hide rendered preview for Option ${key}`
                              : `Preview rendered math & formatting for Option ${key}`
                          }
                        >
                          {optionPreviews[key] ? (
                            <EyeOff className="h-3.5 w-3.5" />
                          ) : (
                            <Eye className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>

                      {/* Correct / Mark Correct Button */}
                      <button
                        type="button"
                        onClick={() => set("correctAnswer", key)}
                        className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-semibold transition-all cursor-pointer shadow-2xs ${
                          isSelected
                            ? "bg-emerald-600 text-white font-bold ring-1 ring-emerald-500/50"
                            : "border border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:bg-emerald-50/60 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-emerald-950/30"
                        }`}
                        title={isSelected ? `Option ${key} is the designated correct answer` : `Mark Option ${key} as correct`}
                      >
                        {isSelected ? (
                          <>
                            <Check className="h-3 w-3 stroke-[2.5]" />
                            <span>Correct</span>
                          </>
                        ) : (
                          <span>Mark Correct</span>
                        )}
                      </button>
                    </div>
                  </div>

                  <CKEditorField
                    placeholder={`Enter text or formula for Option ${key}...`}
                    value={val}
                    onChange={(newVal) => set(setter, newVal)}
                    required
                    minHeight="70px"
                    compactToolbar
                    hideBadge
                    showImageUploadButton={false}
                  />

                  {/* Live Rendered Preview for this Option */}
                  {optionPreviews[key] && (
                    <div className="mt-2 rounded-xl border border-purple-200 bg-gradient-to-r from-purple-50/90 via-indigo-50/50 to-white p-2.5 text-xs text-slate-900 shadow-2xs dark:border-purple-900/60 dark:bg-slate-900 dark:text-slate-100">
                      <div className="flex items-center justify-between mb-1 text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
                        <span className="flex items-center gap-1 font-bold">
                          <Sigma className="h-3 w-3 text-purple-600" />
                          <span>Option {key} Live Rendered Preview:</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleOptionPreview(key)}
                          className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-semibold cursor-pointer"
                        >
                          ✕ Close
                        </button>
                      </div>
                      <div className="min-h-[28px] flex items-center py-1">
                        {val ? (
                          <div
                            className="rich-text-content katex-rendered text-sm font-semibold text-slate-900 dark:text-white leading-relaxed max-w-full overflow-x-auto"
                            dangerouslySetInnerHTML={{ __html: renderMathInHtml(val) }}
                          />
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">No text or formula entered yet</span>
                        )}
                      </div>
                    </div>
                  )}

                  {val && val.includes("<img") && (
                    <div className="mt-2 flex items-center justify-between gap-1 rounded-md border border-purple-200/60 bg-purple-50/60 px-2 py-1 text-[11px] text-purple-700 dark:border-purple-800/40 dark:bg-purple-950/30 dark:text-purple-300">
                      <span className="flex items-center gap-1.5 font-medium truncate">
                        <ImageIcon className="h-3 w-3 shrink-0 text-purple-600 dark:text-purple-400" />
                        <span className="truncate">Image Attached</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const withoutImg = val
                            .replace(/<figure[^>]*>.*?<\/figure>/gis, "")
                            .replace(/<p>\s*<img[^>]*>\s*<\/p>/gis, "")
                            .replace(/<img[^>]*>/gis, "");
                          set(setter, withoutImg);
                        }}
                        className="text-[11px] font-bold text-rose-500 hover:text-rose-700 hover:underline cursor-pointer shrink-0 whitespace-nowrap ml-1.5"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className={`inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-purple-500/20 transition hover:from-purple-700 hover:to-indigo-700 active:scale-98 ${
              isSaving ? "opacity-60 cursor-not-allowed" : ""
            }`}
          >
            {isSaving ? (
              <>
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Saving Question...</span>
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                <span>Save Question</span>
              </>
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
    </ModalShell>
  );
};

export default AuthorManualQuestionModal;
