import React, { useState, useEffect } from "react";
import { X, Plus, Trash2, AlertCircle, CheckCircle2, Award, Sparkles, Layers, Sliders, Check } from "lucide-react";
import { CreateTemplatePayload, QuestionPaperTemplate } from "@/types/cia-test.types";

interface CreateTemplateModalProps {
  isOpen: boolean;
  courseCode: string;
  initialData?: QuestionPaperTemplate | null;
  onClose: () => void;
  onSubmit: (payload: CreateTemplatePayload, editId?: number) => Promise<boolean>;
}

const ALL_COS = ["CO1", "CO2", "CO3", "CO4", "CO5", "CO6", "CO7"];

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
  const [totalMarks, setTotalMarks] = useState<number>(100);
  const [status, setStatus] = useState("drafted");
  const [description, setDescription] = useState(
    "Standard CIA question paper blueprint with short and analytical sections."
  );

  // Course Outcome Mark Distribution State: CO1 to CO7
  const [coDistribution, setCoDistribution] = useState<Record<string, number>>({
    CO1: 20,
    CO2: 30,
    CO3: 20,
    CO4: 30,
  });

  // Default Sections (Standard 100M: Section A Direct 10x2 = 20M, Section B Either/Or 5x16 = 80M)
  const defaultSections = [
    {
      section_order: 1,
      section_name: "Section A",
      section_title: "Part A - Short Answer Questions",
      section_type: "direct",
      allocated_marks: 20,
      questions: [
        { question_number: 1, max_marks: 2, question_type: "direct", target_co: "CO1" },
        { question_number: 2, max_marks: 2, question_type: "direct", target_co: "CO1" },
        { question_number: 3, max_marks: 2, question_type: "direct", target_co: "CO1" },
        { question_number: 4, max_marks: 2, question_type: "direct", target_co: "CO1" },
        { question_number: 5, max_marks: 2, question_type: "direct", target_co: "CO1" },
        { question_number: 6, max_marks: 2, question_type: "direct", target_co: "CO2" },
        { question_number: 7, max_marks: 2, question_type: "direct", target_co: "CO2" },
        { question_number: 8, max_marks: 2, question_type: "direct", target_co: "CO2" },
        { question_number: 9, max_marks: 2, question_type: "direct", target_co: "CO2" },
        { question_number: 10, max_marks: 2, question_type: "direct", target_co: "CO2" },
      ],
    },
    {
      section_order: 2,
      section_name: "Section B",
      section_title: "Part B - Either/Or Analytical Problems",
      section_type: "either_or",
      allocated_marks: 80,
      questions: [
        { question_number: 1, max_marks: 16, question_type: "either_or", target_co: "CO3" },
        { question_number: 2, max_marks: 16, question_type: "either_or", target_co: "CO3" },
        { question_number: 3, max_marks: 16, question_type: "either_or", target_co: "CO4" },
        { question_number: 4, max_marks: 16, question_type: "either_or", target_co: "CO4" },
        { question_number: 5, max_marks: 16, question_type: "either_or", target_co: "CO4" },
      ],
    },
  ];

  const [sections, setSections] = useState(defaultSections);

  useEffect(() => {
    if (initialData) {
      const cleanName = initialData.template_name
        .replace(new RegExp(` - ${courseCode}$`, "i"), "")
        .replace(new RegExp(` - ${initialData.course_code}$`, "i"), "");

      setTemplateName(cleanName || initialData.template_name);
      const parsedMarks = Number(initialData.total_maximum_marks) || 100;
      setTotalMarks(parsedMarks);
      setStatus(initialData.status || "drafted");
      setDescription(initialData.description || "");

      // Load CO Distribution
      if (initialData.co_distribution && Object.keys(initialData.co_distribution).length > 0) {
        setCoDistribution(initialData.co_distribution);
      } else {
        setCoDistribution({
          CO1: Math.round(parsedMarks * 0.25),
          CO2: Math.round(parsedMarks * 0.25),
          CO3: Math.round(parsedMarks * 0.25),
          CO4: parsedMarks - 3 * Math.round(parsedMarks * 0.25),
        });
      }

      // Load Sections
      if (initialData.sections && initialData.sections.length > 0) {
        setSections(
          initialData.sections.map((sec, idx) => {
            const secType = sec.section_type || "direct";
            return {
              section_order: sec.section_order || idx + 1,
              section_name: sec.section_name || `Section ${String.fromCharCode(65 + idx)}`,
              section_title: sec.section_title || `Part ${String.fromCharCode(65 + idx)}`,
              section_type: secType,
              allocated_marks: Number(sec.allocated_marks) || 0,
              questions: (sec.questions || []).map((q, qIdx) => ({
                question_number: q.question_number || qIdx + 1,
                max_marks: Number(q.max_marks) || 1,
                question_type: q.question_type || (secType === "either_or" ? "either_or" : "direct"),
                target_co: q.target_co || null,
              })),
            };
          })
        );
      } else {
        setSections(defaultSections);
      }
    } else {
      setTemplateName("CIA-1 Standard Blueprint");
      setTotalMarks(100);
      setStatus("drafted");
      setDescription("Standard CIA question paper blueprint with short and analytical sections.");
      setCoDistribution({
        CO1: 20,
        CO2: 30,
        CO3: 20,
        CO4: 30,
      });
      setSections(defaultSections);
    }
  }, [initialData, isOpen, courseCode]);

  if (!isOpen) return null;

  // Mathematical Validations
  const sectionsSum = sections.reduce((sum, s) => sum + (Number(s.allocated_marks) || 0), 0);
  const isTemplateMarksValid = Math.abs(sectionsSum - Number(totalMarks)) < 0.01;

  const isSectionValid = (section: (typeof sections)[0]) => {
    const qSum = section.questions.reduce((sum, q) => sum + (Number(q.max_marks) || 0), 0);
    return Math.abs(qSum - Number(section.allocated_marks)) < 0.01;
  };

  const allSectionsValid = sections.every((s) => isSectionValid(s));

  // CO Marks Sum Validation
  const coSum = Object.values(coDistribution).reduce((sum, val) => sum + (Number(val) || 0), 0);
  const hasCoConfig = Object.keys(coDistribution).length > 0;
  const isCoDistributionValid = !hasCoConfig || Math.abs(coSum - Number(totalMarks)) < 0.01;

  const isFormValid = isTemplateMarksValid && allSectionsValid && isCoDistributionValid && templateName.trim() !== "";

  // CO Distribution Handlers
  const handleUpdateCoMark = (coKey: string, marks: number) => {
    const cleanMarks = Math.max(0, marks);
    setCoDistribution((prev) => ({
      ...prev,
      [coKey]: cleanMarks,
    }));
  };

  const handleToggleCo = (coKey: string) => {
    setCoDistribution((prev) => {
      const copy = { ...prev };
      if (coKey in copy) {
        delete copy[coKey];
      } else {
        copy[coKey] = 10;
      }
      return copy;
    });
  };

  const handleAutoDistributeCo = () => {
    const activeKeys = Object.keys(coDistribution).length > 0 ? Object.keys(coDistribution) : ["CO1", "CO2", "CO3", "CO4"];
    if (activeKeys.length === 0) return;
    const base = Math.floor(Number(totalMarks) / activeKeys.length);
    const rem = Number(totalMarks) - base * activeKeys.length;
    const nextDist: Record<string, number> = {};
    activeKeys.forEach((key, idx) => {
      nextDist[key] = idx === activeKeys.length - 1 ? base + rem : base;
    });
    setCoDistribution(nextDist);
  };

  // Section Handlers
  const handleAddSection = () => {
    const nextOrder = sections.length + 1;
    const letter = String.fromCharCode(65 + sections.length);
    setSections([
      ...sections,
      {
        section_order: nextOrder,
        section_name: `Section ${letter}`,
        section_title: `Part ${letter} Questions`,
        section_type: "direct",
        allocated_marks: 10,
        questions: [{ question_number: 1, max_marks: 10, question_type: "direct", target_co: null }],
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

  const handleUpdateSectionType = (idx: number, newType: "direct" | "either_or") => {
    setSections(
      sections.map((s, i) => {
        if (i !== idx) return s;
        return {
          ...s,
          section_type: newType,
          questions: s.questions.map((q) => ({
            ...q,
            question_type: newType,
          })),
        };
      })
    );
  };

  // Question Handlers
  const handleAddQuestion = (secIdx: number) => {
    setSections(
      sections.map((sec, i) => {
        if (i !== secIdx) return sec;
        const nextQNo = sec.questions.length + 1;
        return {
          ...sec,
          questions: [
            ...sec.questions,
            {
              question_number: nextQNo,
              max_marks: sec.section_type === "either_or" ? 16 : 2,
              question_type: sec.section_type,
              target_co: null,
            },
          ],
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

  const handleUpdateQuestion = (secIdx: number, qIdx: number, field: string, val: any) => {
    setSections(
      sections.map((sec, i) => {
        if (i !== secIdx) return sec;
        return {
          ...sec,
          questions: sec.questions.map((q, qi) =>
            qi === qIdx ? { ...q, [field]: val } : q
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
      co_distribution: coDistribution,
      sections: sections.map((s, sIdx) => {
        const prevCount = sections.slice(0, sIdx).reduce((acc, prevSec) => acc + prevSec.questions.length, 0);
        return {
          section_order: sIdx + 1,
          section_name: s.section_name,
          section_title: s.section_title,
          section_type: s.section_type,
          allocated_marks: Number(s.allocated_marks),
          questions: s.questions.map((q, qIdx) => ({
            question_number: prevCount + qIdx + 1,
            max_marks: Number(q.max_marks),
            question_type: s.section_type === "either_or" ? "either_or" : (q.question_type || "direct"),
            target_co: q.target_co || null,
          })),
        };
      }),
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
                ? "Modify section distributions, question marks, and Course Outcome budgets."
                : "Configure blueprint sections, either/or choices, and Course Outcome marks distribution."}
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

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Total Maximum Marks <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={10}
                max={300}
                value={totalMarks}
                onChange={(e) => setTotalMarks(Number(e.target.value))}
                className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs font-bold text-purple-700 transition-colors focus:border-purple-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-purple-300"
              />
            </div>

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

          {/* Mathematical Marks Validation Banner */}
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
                  ? "Section Marks Valid: Sum of section allocations equals Total Maximum Marks."
                  : `Section Marks Mismatch: Sum of sections (${sectionsSum}M) does not equal Total Maximum Marks (${totalMarks}M).`}
              </span>
            </div>
            <span className="font-extrabold text-sm">
              {sectionsSum} / {totalMarks} M
            </span>
          </div>

          {/* COURSE OUTCOME (CO) MARK DISTRIBUTION BUILDER */}
          <div className="rounded-2xl border border-purple-200/80 bg-purple-50/40 p-4 dark:border-purple-900/40 dark:bg-purple-950/20 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-purple-100 dark:border-purple-900/50 pb-2.5">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-purple-900 dark:text-purple-200">
                  Course Outcome (CO) Marks Distribution
                </h4>
              </div>

              <button
                type="button"
                onClick={handleAutoDistributeCo}
                className="text-[11px] font-bold text-purple-700 hover:text-purple-900 dark:text-purple-300 flex items-center gap-1 hover:underline"
              >
                <Sliders className="h-3 w-3" /> Auto-Balance Across Active COs
              </button>
            </div>

            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              Allocate maximum mark budgets for each Course Outcome. The sum of all active CO marks must strictly equal Total Maximum Marks ({totalMarks}M).
            </p>

            {/* CO Chips and Inputs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
              {ALL_COS.map((co) => {
                const isActive = co in coDistribution;
                const markVal = coDistribution[co] || 0;

                return (
                  <div
                    key={co}
                    className={`rounded-xl border p-2 text-xs transition-all ${
                      isActive
                        ? "border-purple-300 bg-white shadow-xs dark:border-purple-700 dark:bg-gray-800"
                        : "border-gray-200/60 bg-gray-50/50 opacity-60 dark:border-gray-800 dark:bg-gray-900/40"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <button
                        type="button"
                        onClick={() => handleToggleCo(co)}
                        className={`text-[11px] font-bold px-1.5 py-0.5 rounded transition-colors ${
                          isActive
                            ? "bg-purple-600 text-white"
                            : "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                        }`}
                      >
                        {co}
                      </button>
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={() => handleToggleCo(co)}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 h-3.5 w-3.5 cursor-pointer"
                      />
                    </div>

                    {isActive ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min={0}
                          max={totalMarks}
                          value={markVal}
                          onChange={(e) => handleUpdateCoMark(co, Number(e.target.value))}
                          className="w-full rounded border border-purple-200 px-1.5 py-0.5 text-center text-xs font-bold text-purple-800 dark:border-purple-700 dark:bg-gray-700 dark:text-purple-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
                        />
                        <span className="text-[10px] text-gray-400">M</span>
                      </div>
                    ) : (
                      <div className="text-[10px] text-gray-400 text-center py-0.5">Inactive</div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* CO Balance Status */}
            <div
              className={`flex items-center justify-between rounded-xl px-3 py-2 text-[11px] font-semibold transition-colors ${
                isCoDistributionValid
                  ? "bg-green-50 text-green-700 border border-green-200 dark:bg-green-950/30 dark:text-green-300 dark:border-green-800"
                  : "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800"
              }`}
            >
              <div className="flex items-center gap-1.5">
                {isCoDistributionValid ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                ) : (
                  <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                )}
                <span>
                  {isCoDistributionValid
                    ? `✓ CO Marks Allocation (${coSum}M) matches Total Maximum Marks (${totalMarks}M).`
                    : `⚠ CO Marks Allocation (${coSum}M) != Total Maximum Marks (${totalMarks}M). Difference: ${Number(totalMarks) - coSum}M.`}
                </span>
              </div>
              <span className="font-bold">{coSum} / {totalMarks} M</span>
            </div>
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
              const valid = Math.abs(secQSum - Number(sec.allocated_marks)) < 0.01;
              const isEitherOr = sec.section_type === "either_or";

              return (
                <div
                  key={secIdx}
                  className="rounded-2xl border border-gray-200 bg-gray-50/50 p-4 dark:border-gray-700 dark:bg-gray-800/40 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 dark:border-gray-700 pb-3">
                    <div className="flex items-center gap-2 flex-1 min-w-[280px]">
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

                    <div className="flex items-center gap-3">
                      {/* Section Type Toggle: Direct vs Either / Or */}
                      <div className="flex items-center gap-1 bg-gray-200/70 dark:bg-gray-700 p-0.5 rounded-lg text-[11px]">
                        <button
                          type="button"
                          onClick={() => handleUpdateSectionType(secIdx, "direct")}
                          className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                            !isEitherOr
                              ? "bg-white text-purple-700 shadow-xs dark:bg-gray-800 dark:text-purple-300"
                              : "text-gray-500 hover:text-gray-800 dark:text-gray-400"
                          }`}
                        >
                          Direct
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateSectionType(secIdx, "either_or")}
                          className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                            isEitherOr
                              ? "bg-purple-600 text-white shadow-xs"
                              : "text-gray-500 hover:text-gray-800 dark:text-gray-400"
                          }`}
                        >
                          Either / Or
                        </button>
                      </div>

                      {/* Allocated Marks */}
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

                  {/* Section Question Sum Checker & Type Badge */}
                  <div className="flex flex-wrap items-center justify-between text-[11px] gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-semibold ${
                          valid ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        {valid
                          ? `✓ Questions sum matches section allocated marks (${secQSum}M).`
                          : `⚠ Question marks sum (${secQSum}M) != Section allocated marks (${sec.allocated_marks}M).`}
                      </span>

                      {isEitherOr && (
                        <span className="rounded-full bg-purple-100 text-purple-700 px-2 py-0.5 text-[10px] font-bold dark:bg-purple-900/40 dark:text-purple-300">
                          Either/Or Choices Inherited
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddQuestion(secIdx)}
                      className="text-purple-600 hover:text-purple-700 font-bold flex items-center gap-1"
                    >
                      <Plus className="h-3 w-3" /> Add Question
                    </button>
                  </div>

                  {/* Questions Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                    {sec.questions.map((q, qIdx) => {
                      const prevCount = sections.slice(0, secIdx).reduce((acc, prevSec) => acc + prevSec.questions.length, 0);
                      const qNumber = prevCount + qIdx + 1;

                      return (
                        <div
                          key={qIdx}
                          className="rounded-xl border border-gray-200 bg-white p-2.5 text-xs dark:border-gray-700 dark:bg-gray-800 space-y-1.5 shadow-xs"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-gray-800 dark:text-gray-100">Q{qNumber}</span>
                              {isEitherOr && (
                                <span className="rounded bg-purple-50 text-purple-600 text-[10px] font-bold px-1 py-0.2 dark:bg-purple-950/40 dark:text-purple-300">
                                  a OR b
                                </span>
                              )}
                            </div>

                            {sec.questions.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveQuestion(secIdx, qIdx)}
                                className="text-gray-400 hover:text-red-500 text-sm font-bold leading-none"
                              >
                                ×
                              </button>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Question Marks */}
                            <div className="flex items-center gap-1 flex-1">
                              <span className="text-[10px] text-gray-400">Marks:</span>
                              <input
                                type="number"
                                min={1}
                                step={1}
                                value={q.max_marks}
                                onChange={(e) =>
                                  handleUpdateQuestion(secIdx, qIdx, "max_marks", Number(e.target.value))
                                }
                                className="w-12 rounded border border-gray-200 px-1 py-0.5 text-center text-xs font-bold text-gray-800 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                              />
                              <span className="text-[10px] text-gray-400">M</span>
                            </div>

                            {/* Target CO Selector */}
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-gray-400">CO:</span>
                              <select
                                value={q.target_co || ""}
                                onChange={(e) =>
                                  handleUpdateQuestion(secIdx, qIdx, "target_co", e.target.value || null)
                                }
                                className="rounded border border-gray-200 bg-white px-1 py-0.5 text-[11px] font-bold text-purple-700 dark:border-gray-600 dark:bg-gray-700 dark:text-purple-300"
                              >
                                <option value="">Auto</option>
                                {ALL_COS.map((c) => (
                                  <option key={c} value={c}>{c}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <p className="text-[11px] text-gray-500">
            * All section and Course Outcome totals must match before saving.
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
              className="flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-purple-500/20 hover:bg-purple-700 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
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
