import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Layers,
  Award,
  CheckCircle2,
  PlusCircle,
  XCircle,
  HelpCircle,
  ChevronRight,
  Sparkles,
  Edit,
  Settings2,
  Split,
  Plus,
  Trash2,
  Check,
  X,
  ShieldAlert,
  ArrowRightLeft,
  Bookmark,
} from "lucide-react";
import { QuestionPaperTemplate, CandidateQuestion, BlueprintSlot, COSummaryItem } from "@/types/cia-test.types";
import FormattedMathText from "@/components/common-components/FormattedMathText";
import QuestionPaperStudioService from "@/services/questionPaperStudioService";
import { toast } from "react-toastify";
import { useCourseOutcomes } from "@/hook/useCourseOutcomes";

interface BlueprintSlotsPaneProps {
  courseId?: string | number;
  templateId?: string | number;
  template: QuestionPaperTemplate | null;
  candidates: CandidateQuestion[];
  activeSlotId: number | null;
  actionLoadingId: number | string | null;
  onSelectSlot: (slotId: number) => void;
  onUnassignSlot: (slotId: number, subId?: string | null) => void;
  onAssignSlot?: (slotId: number, questionId: number, subId?: string | null) => void;
  onEditQuestion?: (question: CandidateQuestion) => void;
  onUpdateSlotStructure?: (slotId: number, payload: any) => Promise<boolean>;
}

interface SubQuestionDraft {
  sub_id: string;
  label: string;
  marks: number;
  co_level?: string;
}

export const BlueprintSlotsPane: React.FC<BlueprintSlotsPaneProps> = ({
  courseId,
  templateId,
  template,
  candidates,
  activeSlotId,
  actionLoadingId,
  onSelectSlot,
  onUnassignSlot,
  onAssignSlot,
  onEditQuestion,
  onUpdateSlotStructure,
}) => {
  const [dragOverSlotKey, setDragOverSlotKey] = useState<string | null>(null);

  // Real-time CO Summary State
  const [apiCoSummary, setApiCoSummary] = useState<COSummaryItem[]>([]);
  const [apiIsBalanced, setApiIsBalanced] = useState<boolean>(false);
  const [coLoading, setCoLoading] = useState<boolean>(false);

  // Sub-Question Structure Configuration Modal State
  const [configuringSlot, setConfiguringSlot] = useState<any | null>(null);
  const [configQuestionType, setConfigQuestionType] = useState<"direct" | "either_or">("either_or");
  const [configTargetCo, setConfigTargetCo] = useState<string>("CO1");
  const [optionASubs, setOptionASubs] = useState<SubQuestionDraft[]>([]);
  const [optionBSubs, setOptionBSubs] = useState<SubQuestionDraft[]>([]);
  const [directSubs, setDirectSubs] = useState<SubQuestionDraft[]>([]);
  const [savingStructure, setSavingStructure] = useState<boolean>(false);

  const sections = template?.sections || [];

  // Fetch Real-time CO Attainment and Budget Summary
  const fetchCoSummary = useCallback(async () => {
    if (!courseId || !templateId) return;
    try {
      setCoLoading(true);
      const res = await QuestionPaperStudioService.getTemplateCOSummary(courseId, templateId);
      if (res && res.co_summary) {
        setApiCoSummary(res.co_summary);
        setApiIsBalanced(res.is_co_fully_balanced);
      }
    } catch (err) {
      console.warn("Could not fetch remote CO summary:", err);
    } finally {
      setCoLoading(false);
    }
  }, [courseId, templateId]);

  useEffect(() => {
    fetchCoSummary();
  }, [fetchCoSummary, template, candidates]);

  // Fallback Live Calculation if API is loading
  const liveCoSummary = useMemo(() => {
    if (apiCoSummary.length > 0) return apiCoSummary;

    // Parse template co_distribution
    const rawDist = template?.co_distribution || {};
    const budgetMap: Record<string, number> = {};
    if (Array.isArray(rawDist)) {
      rawDist.forEach((item: any) => {
        if (item && item.co_code) {
          budgetMap[String(item.co_code).toUpperCase()] = Number(item.max_marks || 0);
        }
      });
    } else if (typeof rawDist === "object" && rawDist !== null) {
      Object.entries(rawDist).forEach(([k, v]) => {
        budgetMap[k.toUpperCase()] = Number(v || 0);
      });
    }

    const assignedMarksMap: Record<string, number> = {};

    sections.forEach((sec) => {
      (sec.questions || []).forEach((slot: any) => {
        if (slot.actual_question_id) {
          const matchedQ = candidates.find((c) => c.id === slot.actual_question_id);
          const co = (matchedQ?.co_level || matchedQ?.course_outcome || slot.target_co || "UNASSIGNED").toUpperCase();
          assignedMarksMap[co] = (assignedMarksMap[co] || 0) + Number(slot.max_marks || 0);
        } else if (slot.sub_question_structure) {
          const struct = slot.sub_question_structure;
          const targetCo = (struct.target_co || slot.target_co || "UNASSIGNED").toUpperCase();
          if (struct.type === "either_or") {
            const optASum = (struct.option_a?.sub_questions || [])
              .filter((sq: any) => sq.assigned_question_id)
              .reduce((sum: number, sq: any) => sum + Number(sq.marks || 0), 0);
            const optBSum = (struct.option_b?.sub_questions || [])
              .filter((sq: any) => sq.assigned_question_id)
              .reduce((sum: number, sq: any) => sum + Number(sq.marks || 0), 0);
            const eff = Math.min(Number(slot.max_marks || 0), Math.max(optASum, optBSum));
            if (eff > 0) {
              assignedMarksMap[targetCo] = (assignedMarksMap[targetCo] || 0) + eff;
            }
          } else {
            (struct.sub_questions || []).forEach((sq: any) => {
              if (sq.assigned_question_id) {
                const sqCo = (sq.co_level || targetCo).toUpperCase();
                assignedMarksMap[sqCo] = (assignedMarksMap[sqCo] || 0) + Number(sq.marks || 0);
              }
            });
          }
        }
      });
    });

    const allCos = Array.from(new Set([...Object.keys(budgetMap), ...Object.keys(assignedMarksMap)])).sort();
    return allCos.map((co) => {
      const allocated = budgetMap[co] || 0;
      const assigned = assignedMarksMap[co] || 0;
      return {
        co_code: co,
        allocated_marks: allocated,
        assigned_marks: assigned,
        remaining_marks: Math.max(0, allocated - assigned),
        is_fulfilled: allocated > 0 ? Math.abs(assigned - allocated) < 0.01 : assigned === 0,
      };
    });
  }, [apiCoSummary, template, candidates, sections]);

  const { coCodes: activeCourseCoCodes } = useCourseOutcomes(courseId);

  // Open Sub-Question Configurator Modal
  const handleOpenConfigModal = (slot: any) => {
    setConfiguringSlot(slot);
    const existing = slot.sub_question_structure;
    const slotMarks = Number(slot.max_marks);
    const defaultCo = activeCourseCoCodes[0] || liveCoSummary[0]?.co_code || "CO1";
    const targetCo = slot.target_co || defaultCo;
    setConfigTargetCo(targetCo);

    if (existing) {
      setConfigQuestionType(existing.type || slot.question_type || "either_or");
      if (existing.type === "either_or") {
        setOptionASubs(
          (existing.option_a?.sub_questions || []).map((sq: any) => ({
            sub_id: sq.sub_id,
            label: sq.label,
            marks: Number(sq.marks),
            co_level: sq.co_level || targetCo,
          }))
        );
        setOptionBSubs(
          (existing.option_b?.sub_questions || []).map((sq: any) => ({
            sub_id: sq.sub_id,
            label: sq.label,
            marks: Number(sq.marks),
            co_level: sq.co_level || targetCo,
          }))
        );
      } else {
        setDirectSubs(
          (existing.sub_questions || []).map((sq: any) => ({
            sub_id: sq.sub_id,
            label: sq.label,
            marks: Number(sq.marks),
            co_level: sq.co_level || targetCo,
          }))
        );
      }
    } else {
      // Default Either/Or configuration matching slot marks
      const isEitherOr = slot.question_type === "either_or" || slotMarks >= 12;
      setConfigQuestionType(isEitherOr ? "either_or" : "direct");

      if (isEitherOr) {
        const half = Math.floor(slotMarks / 2);
        const rem = slotMarks - half;
        setOptionASubs([
          { sub_id: "a.i", label: "a) i)", marks: half, co_level: targetCo },
          { sub_id: "a.ii", label: "a) ii)", marks: rem, co_level: targetCo },
        ]);
        setOptionBSubs([
          { sub_id: "b.i", label: "b) i)", marks: slotMarks, co_level: targetCo },
        ]);
      } else {
        setDirectSubs([
          { sub_id: "a", label: "a)", marks: Math.floor(slotMarks / 2), co_level: targetCo },
          { sub_id: "b", label: "b)", marks: slotMarks - Math.floor(slotMarks / 2), co_level: targetCo },
        ]);
      }
    }
  };

  // Save Sub-Question Structure
  const handleSaveStructure = async () => {
    if (!configuringSlot || !onUpdateSlotStructure) return;
    const slotMarks = Number(configuringSlot.max_marks);

    if (configQuestionType === "either_or") {
      const sumA = optionASubs.reduce((acc, curr) => acc + curr.marks, 0);
      const sumB = optionBSubs.reduce((acc, curr) => acc + curr.marks, 0);

      if (Math.abs(sumA - slotMarks) > 0.01) {
        toast.error(`Option A sub-questions sum (${sumA}M) must equal Slot Marks (${slotMarks}M).`);
        return;
      }
      if (Math.abs(sumB - slotMarks) > 0.01) {
        toast.error(`Option B sub-questions sum (${sumB}M) must equal Slot Marks (${slotMarks}M).`);
        return;
      }

      setSavingStructure(true);
      const payload = {
        question_type: "either_or",
        target_co: configTargetCo,
        sub_question_structure: {
          type: "either_or",
          target_co: configTargetCo,
          option_a: {
            label: "a",
            sub_questions: optionASubs.map((sq) => ({
              sub_id: sq.sub_id,
              label: sq.label,
              marks: sq.marks,
              co_level: configTargetCo,
            })),
          },
          option_b: {
            label: "b",
            sub_questions: optionBSubs.map((sq) => ({
              sub_id: sq.sub_id,
              label: sq.label,
              marks: sq.marks,
              co_level: configTargetCo,
            })),
          },
        },
      };

      const ok = await onUpdateSlotStructure(configuringSlot.id, payload);
      setSavingStructure(false);
      if (ok) {
        setConfiguringSlot(null);
        fetchCoSummary();
      }
    } else {
      const sumDirect = directSubs.reduce((acc, curr) => acc + curr.marks, 0);
      if (Math.abs(sumDirect - slotMarks) > 0.01) {
        toast.error(`Direct sub-questions sum (${sumDirect}M) must equal Slot Marks (${slotMarks}M).`);
        return;
      }

      setSavingStructure(true);
      const payload = {
        question_type: "direct",
        target_co: configTargetCo,
        sub_question_structure: {
          type: "direct",
          target_co: configTargetCo,
          sub_questions: directSubs.map((sq) => ({
            sub_id: sq.sub_id,
            label: sq.label,
            marks: sq.marks,
            co_level: sq.co_level || configTargetCo,
          })),
        },
      };

      const ok = await onUpdateSlotStructure(configuringSlot.id, payload);
      setSavingStructure(false);
      if (ok) {
        setConfiguringSlot(null);
        fetchCoSummary();
      }
    }
  };

  // Reset Sub-Questions to Single Compulsory Slot
  const handleClearStructure = async () => {
    if (!configuringSlot || !onUpdateSlotStructure) return;
    setSavingStructure(true);
    const ok = await onUpdateSlotStructure(configuringSlot.id, {
      question_type: "direct",
      target_co: configTargetCo,
      sub_question_structure: null,
    });
    setSavingStructure(false);
    if (ok) {
      setConfiguringSlot(null);
      fetchCoSummary();
    }
  };

  // Drop Guard & Assignment Validation
  const handleDropQuestion = (
    e: React.DragEvent,
    slot: any,
    targetMarks: number,
    targetCo?: string | null,
    subId?: string | null
  ) => {
    e.preventDefault();
    setDragOverSlotKey(null);
    try {
      const raw = e.dataTransfer.getData("application/json");
      if (!raw) return;
      const data = JSON.parse(raw);
      const qId = Number(data.questionId);
      const qMarks = Number(data.maxMarks);
      const qCo = data.courseOutcome;

      // 1. Marks Check
      if (qMarks !== targetMarks) {
        toast.error(
          `Marks Mismatch: Question carries ${qMarks}M, but target requires ${targetMarks}M.`
        );
        return;
      }

      // 2. Strict CO Match Guard
      if (targetCo && qCo && qCo.toUpperCase() !== targetCo.toUpperCase()) {
        toast.error(
          `CO Mismatch: Slot requires ${targetCo}, but question is tagged with ${qCo}.`
        );
        return;
      }

      if (onAssignSlot) {
        onAssignSlot(slot.id, qId, subId);
      }
    } catch (err) {
      console.error("Drop handling failed:", err);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] rounded-3xl border border-gray-200/80 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 transition-all">
      {/* ── 1. Pane Header ────────────────────────────────────────────────────── */}
      <div className="mb-3 flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            Question Paper Blueprint Slots
          </h2>
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Enforce CO Mark Attainment & Either/Or Invariants
        </span>
      </div>

      {/* ── 2. Live CO Budget Tracker Header ─────────────────────────────────── */}
      <div className="mb-4 rounded-2xl border border-purple-100 bg-gradient-to-r from-purple-50/70 via-indigo-50/40 to-purple-50/70 p-3.5 dark:border-purple-900/40 dark:from-purple-950/30 dark:via-indigo-950/20 dark:to-purple-950/30 shadow-xs">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-purple-700 dark:text-purple-400" />
            <span className="text-xs font-bold text-purple-950 dark:text-purple-200 uppercase tracking-wider">
              Course Outcome (CO) Marks Budget
            </span>
          </div>

          <div className="flex items-center gap-2">
            {apiIsBalanced ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-extrabold text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
                <Check className="h-3 w-3" />
                Budget Balanced
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
                <ShieldAlert className="h-3 w-3" />
                Attainment in Progress
              </span>
            )}
          </div>
        </div>

        {/* CO Badge Pills Row */}
        <div className="flex flex-wrap items-center gap-2">
          {liveCoSummary.map((item) => {
            const isFull = item.is_fulfilled;
            const isOver = item.assigned_marks > item.allocated_marks;
            const isZero = item.assigned_marks === 0;

            return (
              <div
                key={item.co_code}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-bold transition-all ${
                  isFull
                    ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 shadow-xs"
                    : isOver
                    ? "border-red-300 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300"
                    : isZero
                    ? "border-gray-200 bg-white text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                    : "border-indigo-200 bg-indigo-50/80 text-indigo-800 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300"
                }`}
                title={`Allocated: ${item.allocated_marks}M | Assigned: ${item.assigned_marks}M | Remaining: ${item.remaining_marks}M`}
              >
                <span>{item.co_code}:</span>
                <span className="font-extrabold">
                  {item.assigned_marks}/{item.allocated_marks}M
                </span>
                {isFull ? (
                  <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                ) : isOver ? (
                  <span className="text-[10px] text-red-600 font-black">+{item.assigned_marks - item.allocated_marks}M</span>
                ) : (
                  <span className="text-[10px] opacity-75">({item.remaining_marks}M left)</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 3. Sections & Blueprint Slots List ──────────────────────────────── */}
      {sections.length === 0 ? (
        <div className="py-12 text-center text-xs text-gray-400 flex-1">
          No sections defined for this template blueprint.
        </div>
      ) : (
        <div className="space-y-6 overflow-y-auto flex-1 pr-1">
          {sections.map((sec, secIdx) => {
            const questions = sec.questions || [];
            const isSectionEitherOr = sec.section_type === "either_or";
            const assignedCount = questions.filter((q: any) => {
              if (q.actual_question_id) return true;
              if (q.sub_question_structure) {
                const st = q.sub_question_structure;
                const hasA = (st.option_a?.sub_questions || []).some((sq: any) => sq.assigned_question_id);
                const hasB = (st.option_b?.sub_questions || []).some((sq: any) => sq.assigned_question_id);
                const hasDirect = (st.sub_questions || []).some((sq: any) => sq.assigned_question_id);
                return hasA || hasB || hasDirect;
              }
              return false;
            }).length;

            return (
              <div
                key={sec.id || secIdx}
                className="rounded-2xl border border-gray-200/80 bg-gray-50/50 p-4 dark:border-gray-800 dark:bg-gray-850/50 transition-all"
              >
                {/* Section Header */}
                <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2 border-b border-gray-200/70 pb-2.5 dark:border-gray-800">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-purple-700 dark:text-purple-400">
                      {sec.section_name}
                    </span>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                      {sec.section_title || `Part ${secIdx + 1}`}
                    </h3>

                    {/* Section Type Badge */}
                    {isSectionEitherOr ? (
                      <span className="rounded-lg bg-amber-100 px-2 py-0.5 text-[10px] font-extrabold text-amber-800 border border-amber-300 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-800 flex items-center gap-1">
                        <ArrowRightLeft className="h-3 w-3" />
                        Either / Or Choice
                      </span>
                    ) : (
                      <span className="rounded-lg bg-blue-100 px-2 py-0.5 text-[10px] font-extrabold text-blue-800 border border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-800">
                        Direct Compulsory
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="rounded-lg bg-purple-100 px-2.5 py-0.5 font-bold text-purple-800 dark:bg-purple-900/50 dark:text-purple-300">
                      {sec.allocated_marks} Marks Total
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 text-xs">
                      ({assignedCount}/{questions.length} Assigned)
                    </span>
                  </div>
                </div>

                {/* Slots List */}
                <div className="space-y-3.5">
                  {questions.map((slot: any) => {
                    const isSelected = activeSlotId === slot.id;
                    const subStructure = slot.sub_question_structure;
                    const hasSubStructure = Boolean(subStructure);
                    const isEitherOrSlot = slot.question_type === "either_or" || subStructure?.type === "either_or";
                    const targetCo = slot.target_co || subStructure?.target_co;

                    const assignedCandidate =
                      (slot as any).assigned_question ||
                      (slot.actual_question_id
                        ? candidates.find((c) => c.id === slot.actual_question_id)
                        : null);
                    const isWholeSlotAssigned = !!slot.actual_question_id || !!(slot as any).assigned_question;
                    const slotKey = `slot-${slot.id}`;
                    const isDragOverSlot = dragOverSlotKey === slotKey;

                    return (
                      <div
                        key={slot.id}
                        className={`group relative rounded-2xl border p-4 transition-all duration-150 ${
                          isSelected
                            ? "border-purple-600 bg-purple-50/30 ring-2 ring-purple-500/30 dark:border-purple-500 dark:bg-purple-950/20"
                            : isWholeSlotAssigned
                            ? "border-green-200 bg-white dark:border-green-900/40 dark:bg-gray-800"
                            : "border-gray-200/90 bg-white dark:border-gray-700/80 dark:bg-gray-800"
                        }`}
                      >
                        {/* Slot Header: Question Number, Marks, Target CO, Actions */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-gray-100 dark:border-gray-750">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`flex h-7 w-7 items-center justify-center rounded-xl text-xs font-black ${
                                isWholeSlotAssigned
                                  ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300"
                                  : isSelected
                                  ? "bg-purple-600 text-white"
                                  : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                              }`}
                            >
                              Q{slot.question_number}
                            </span>

                            <span className="rounded-lg bg-gray-100 px-2 py-0.5 text-xs font-extrabold text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                              {slot.max_marks} Marks
                            </span>

                            {targetCo && (
                              <span className="rounded-lg bg-indigo-100 px-2 py-0.5 text-[11px] font-bold text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300">
                                Target: {targetCo}
                              </span>
                            )}

                            {isEitherOrSlot && (
                              <span className="rounded-lg bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800">
                                Either / Or
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            {/* Configure Sub-Questions Button */}
                            {onUpdateSlotStructure && (
                              <button
                                type="button"
                                onClick={() => handleOpenConfigModal(slot)}
                                title="Configure Modular Sub-Questions and Either/Or Choices"
                                className="inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-bold text-gray-700 hover:bg-purple-50 hover:text-purple-700 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-purple-950/40 transition-colors"
                              >
                                <Settings2 className="h-3.5 w-3.5" />
                                <span>{hasSubStructure ? "Edit Sub-Parts" : "+ Sub-Questions"}</span>
                              </button>
                            )}

                            {/* Standard Whole Slot Actions */}
                            {!hasSubStructure && (
                              <>
                                {isWholeSlotAssigned ? (
                                  <button
                                    type="button"
                                    onClick={() => slot.id && onUnassignSlot(slot.id)}
                                    disabled={actionLoadingId === `slot-unassign-${slot.id}`}
                                    className="inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                                  >
                                    <XCircle className="h-3.5 w-3.5" />
                                    <span>Unassign</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => slot.id && onSelectSlot(slot.id)}
                                    className={`inline-flex items-center gap-1 rounded-xl px-3 py-1 text-xs font-bold transition-all ${
                                      isSelected
                                        ? "bg-purple-600 text-white shadow-sm"
                                        : "bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-900/40 dark:text-purple-300"
                                    }`}
                                  >
                                    <PlusCircle className="h-3.5 w-3.5" />
                                    <span>{isSelected ? "Active Target" : "Select Slot"}</span>
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </div>

                        {/* ── Slot Body Content ── */}
                        {hasSubStructure ? (
                          <div className="mt-3 space-y-3">
                            {/* Either/Or Modular Sub-Questions Layout */}
                            {subStructure.type === "either_or" ? (
                              <div className="space-y-2.5">
                                {/* Option A Container */}
                                <div className="rounded-xl border border-purple-200 bg-purple-50/20 p-3 dark:border-purple-900/40 dark:bg-purple-950/10">
                                  <div className="mb-2 flex items-center justify-between text-xs">
                                    <span className="font-extrabold uppercase tracking-wider text-purple-900 dark:text-purple-200 flex items-center gap-1">
                                      <span>Option A</span>
                                      <span className="text-[11px] font-normal text-gray-500">
                                        ({slot.max_marks}M • Target: {targetCo || "CO"})
                                      </span>
                                    </span>
                                  </div>

                                  <div className="space-y-2">
                                    {(subStructure.option_a?.sub_questions || []).map((sub: any) => {
                                      const assignedQ = candidates.find((c) => c.id === sub.assigned_question_id);
                                      const isSubAssigned = Boolean(sub.assigned_question_id);
                                      const subKey = `slot-${slot.id}-${sub.sub_id}`;
                                      const isOverThisSub = dragOverSlotKey === subKey;

                                      return (
                                        <div
                                          key={sub.sub_id}
                                          onDragOver={(e) => {
                                            e.preventDefault();
                                            e.dataTransfer.dropEffect = "move";
                                          }}
                                          onDragEnter={(e) => {
                                            e.preventDefault();
                                            setDragOverSlotKey(subKey);
                                          }}
                                          onDragLeave={(e) => {
                                            if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                                            setDragOverSlotKey(null);
                                          }}
                                          onDrop={(e) =>
                                            handleDropQuestion(e, slot, Number(sub.marks), sub.co_level || targetCo, sub.sub_id)
                                          }
                                          className={`rounded-xl border p-2.5 transition-all text-xs ${
                                            isOverThisSub
                                              ? "border-purple-600 bg-purple-100 ring-2 ring-purple-500"
                                              : isSubAssigned
                                              ? "border-green-200 bg-white dark:border-green-900/40 dark:bg-gray-800"
                                              : "border-dashed border-gray-300 bg-white hover:border-purple-400 dark:border-gray-700 dark:bg-gray-800"
                                          }`}
                                        >
                                          <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-1.5 font-bold">
                                              <span className="rounded bg-purple-100 px-1.5 py-0.5 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300">
                                                {sub.label}
                                              </span>
                                              <span className="text-gray-600 dark:text-gray-300">
                                                {sub.marks} Marks
                                              </span>
                                              <span className="rounded bg-indigo-50 px-1 py-0.5 text-[10px] text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                                                {sub.co_level || targetCo}
                                              </span>
                                            </div>

                                            {isSubAssigned ? (
                                              <button
                                                type="button"
                                                onClick={() => onUnassignSlot(slot.id, sub.sub_id)}
                                                className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 hover:text-red-700"
                                              >
                                                <XCircle className="h-3 w-3" />
                                                <span>Unassign</span>
                                              </button>
                                            ) : (
                                              <span className="text-[10px] italic text-purple-600 dark:text-purple-400">
                                                Drop {sub.marks}M ({sub.co_level || targetCo}) question here
                                              </span>
                                            )}
                                          </div>

                                          {/* Sub-question Preview Text */}
                                          {isSubAssigned && assignedQ && (
                                            <div className="mt-1.5 text-xs text-gray-800 dark:text-gray-200">
                                              <FormattedMathText
                                                text={assignedQ.question_text}
                                                className="line-clamp-2 block"
                                              />
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* Real-World Either / Or Divider */}
                                <div className="relative flex items-center justify-center my-1">
                                  <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-purple-200 dark:border-purple-800" />
                                  </div>
                                  <div className="relative rounded-full bg-white px-3 py-1 text-xs font-black text-purple-700 dark:bg-gray-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800 shadow-xs flex items-center gap-1.5">
                                    <ArrowRightLeft className="h-3.5 w-3.5" />
                                    <span>— OR (Student chooses Option A or Option B • Slot counts {slot.max_marks}M towards {targetCo || "CO"}) —</span>
                                  </div>
                                </div>

                                {/* Option B Container */}
                                <div className="rounded-xl border border-indigo-200 bg-indigo-50/20 p-3 dark:border-indigo-900/40 dark:bg-indigo-950/10">
                                  <div className="mb-2 flex items-center justify-between text-xs">
                                    <span className="font-extrabold uppercase tracking-wider text-indigo-900 dark:text-indigo-200 flex items-center gap-1">
                                      <span>Option B</span>
                                      <span className="text-[11px] font-normal text-gray-500">
                                        ({slot.max_marks}M • Target: {targetCo || "CO"})
                                      </span>
                                    </span>
                                  </div>

                                  <div className="space-y-2">
                                    {(subStructure.option_b?.sub_questions || []).map((sub: any) => {
                                      const assignedQ = candidates.find((c) => c.id === sub.assigned_question_id);
                                      const isSubAssigned = Boolean(sub.assigned_question_id);
                                      const subKey = `slot-${slot.id}-${sub.sub_id}`;
                                      const isOverThisSub = dragOverSlotKey === subKey;

                                      return (
                                        <div
                                          key={sub.sub_id}
                                          onDragOver={(e) => {
                                            e.preventDefault();
                                            e.dataTransfer.dropEffect = "move";
                                          }}
                                          onDragEnter={(e) => {
                                            e.preventDefault();
                                            setDragOverSlotKey(subKey);
                                          }}
                                          onDragLeave={(e) => {
                                            if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                                            setDragOverSlotKey(null);
                                          }}
                                          onDrop={(e) =>
                                            handleDropQuestion(e, slot, Number(sub.marks), sub.co_level || targetCo, sub.sub_id)
                                          }
                                          className={`rounded-xl border p-2.5 transition-all text-xs ${
                                            isOverThisSub
                                              ? "border-indigo-600 bg-indigo-100 ring-2 ring-indigo-500"
                                              : isSubAssigned
                                              ? "border-green-200 bg-white dark:border-green-900/40 dark:bg-gray-800"
                                              : "border-dashed border-gray-300 bg-white hover:border-indigo-400 dark:border-gray-700 dark:bg-gray-800"
                                          }`}
                                        >
                                          <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-1.5 font-bold">
                                              <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300">
                                                {sub.label}
                                              </span>
                                              <span className="text-gray-600 dark:text-gray-300">
                                                {sub.marks} Marks
                                              </span>
                                              <span className="rounded bg-indigo-50 px-1 py-0.5 text-[10px] text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                                                {sub.co_level || targetCo}
                                              </span>
                                            </div>

                                            {isSubAssigned ? (
                                              <button
                                                type="button"
                                                onClick={() => onUnassignSlot(slot.id, sub.sub_id)}
                                                className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 hover:text-red-700"
                                              >
                                                <XCircle className="h-3 w-3" />
                                                <span>Unassign</span>
                                              </button>
                                            ) : (
                                              <span className="text-[10px] italic text-indigo-600 dark:text-indigo-400">
                                                Drop {sub.marks}M ({sub.co_level || targetCo}) question here
                                              </span>
                                            )}
                                          </div>

                                          {/* Sub-question Preview Text */}
                                          {isSubAssigned && assignedQ && (
                                            <div className="mt-1.5 text-xs text-gray-800 dark:text-gray-200">
                                              <FormattedMathText
                                                text={assignedQ.question_text}
                                                className="line-clamp-2 block"
                                              />
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              /* Direct Sub-Questions Layout */
                              <div className="space-y-2">
                                {(subStructure.sub_questions || []).map((sub: any) => {
                                  const assignedQ = candidates.find((c) => c.id === sub.assigned_question_id);
                                  const isSubAssigned = Boolean(sub.assigned_question_id);
                                  const subKey = `slot-${slot.id}-${sub.sub_id}`;
                                  const isOverThisSub = dragOverSlotKey === subKey;

                                  return (
                                    <div
                                      key={sub.sub_id}
                                      onDragOver={(e) => {
                                        e.preventDefault();
                                        e.dataTransfer.dropEffect = "move";
                                      }}
                                      onDragEnter={(e) => {
                                        e.preventDefault();
                                        setDragOverSlotKey(subKey);
                                      }}
                                      onDragLeave={(e) => {
                                        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                                        setDragOverSlotKey(null);
                                      }}
                                      onDrop={(e) =>
                                        handleDropQuestion(e, slot, Number(sub.marks), sub.co_level || targetCo, sub.sub_id)
                                      }
                                      className={`rounded-xl border p-2.5 transition-all text-xs ${
                                        isOverThisSub
                                          ? "border-purple-600 bg-purple-100 ring-2 ring-purple-500"
                                          : isSubAssigned
                                          ? "border-green-200 bg-white dark:border-green-900/40 dark:bg-gray-800"
                                          : "border-dashed border-gray-300 bg-white hover:border-purple-400 dark:border-gray-700 dark:bg-gray-800"
                                      }`}
                                    >
                                      <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-1.5 font-bold">
                                          <span className="rounded bg-purple-100 px-1.5 py-0.5 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300">
                                            {sub.label}
                                          </span>
                                          <span>{sub.marks} Marks</span>
                                          <span className="rounded bg-indigo-50 px-1 py-0.5 text-[10px] text-indigo-700">
                                            {sub.co_level || targetCo}
                                          </span>
                                        </div>

                                        {isSubAssigned ? (
                                          <button
                                            type="button"
                                            onClick={() => onUnassignSlot(slot.id, sub.sub_id)}
                                            className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600"
                                          >
                                            <XCircle className="h-3 w-3" />
                                            <span>Unassign</span>
                                          </button>
                                        ) : (
                                          <span className="text-[10px] italic text-purple-600">
                                            Drop {sub.marks}M question here
                                          </span>
                                        )}
                                      </div>

                                      {isSubAssigned && assignedQ && (
                                        <div className="mt-1.5 text-xs text-gray-800 dark:text-gray-200">
                                          <FormattedMathText
                                            text={assignedQ.question_text}
                                            className="line-clamp-2 block"
                                          />
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        ) : (
                          /* Standard Single Slot Drop Zone */
                          <div
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.dataTransfer.dropEffect = "move";
                            }}
                            onDragEnter={(e) => {
                              e.preventDefault();
                              setDragOverSlotKey(slotKey);
                            }}
                            onDragLeave={(e) => {
                              if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                              setDragOverSlotKey(null);
                            }}
                            onDrop={(e) =>
                              handleDropQuestion(e, slot, Number(slot.max_marks), targetCo, null)
                            }
                            className={`mt-2 rounded-xl transition-all ${
                              isDragOverSlot
                                ? "border border-purple-500 bg-purple-100/70 p-3 ring-2 ring-purple-500"
                                : ""
                            }`}
                          >
                            {isWholeSlotAssigned && assignedCandidate ? (
                              <div className="rounded-xl bg-gray-50 p-3 text-xs text-gray-800 dark:bg-gray-900/60 dark:text-gray-200">
                                <div className="mb-1.5 flex flex-wrap items-center justify-between gap-1.5">
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    {(assignedCandidate.course_outcome || assignedCandidate.co_level) && (
                                      <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-bold text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300">
                                        {assignedCandidate.course_outcome || assignedCandidate.co_level}
                                      </span>
                                    )}
                                    {(assignedCandidate.bloom_level || assignedCandidate.knowledge_level) && (
                                      <span className="rounded bg-pink-100 px-1.5 py-0.5 text-[10px] font-bold text-pink-800 dark:bg-pink-900/40 dark:text-pink-300">
                                        {assignedCandidate.bloom_level || assignedCandidate.knowledge_level}
                                      </span>
                                    )}
                                  </div>
                                  {onEditQuestion && (
                                    <button
                                      type="button"
                                      onClick={() => onEditQuestion(assignedCandidate)}
                                      className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-500 hover:text-purple-600 transition-colors"
                                    >
                                      <Edit className="h-3 w-3" />
                                      <span>Edit</span>
                                    </button>
                                  )}
                                </div>

                                <FormattedMathText
                                  text={assignedCandidate.question_text}
                                  className="line-clamp-2 text-xs font-medium block"
                                />
                              </div>
                            ) : isWholeSlotAssigned ? (
                              <div className="rounded-xl bg-gray-50 p-2 text-xs text-gray-600 dark:bg-gray-900/50 dark:text-gray-400">
                                Question #{slot.actual_question_id} assigned.
                              </div>
                            ) : isSelected ? (
                              <div className="flex items-center gap-1.5 rounded-xl border border-dashed border-purple-400 bg-purple-50/50 p-3 text-xs font-semibold text-purple-700 dark:text-purple-300 animate-pulse">
                                <Sparkles className="h-4 w-4" />
                                <span>Drop a matching {slot.max_marks}M {targetCo ? `(${targetCo})` : ""} question here</span>
                              </div>
                            ) : (
                              <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/50 p-3 text-center text-xs text-gray-400 dark:border-gray-700 dark:bg-gray-800/40">
                                Empty Slot — Drag question here or click &quot;Select Slot&quot;
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── 4. Sub-Question Configuration Modal ─────────────────────────────── */}
      {configuringSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <Settings2 className="h-5 w-5 text-purple-600" />
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Configure Slot Q{configuringSlot.question_number} ({configuringSlot.max_marks} Marks)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setConfiguringSlot(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
              {/* Target CO Selector */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Target Course Outcome (CO)
                </label>
                <select
                  value={configTargetCo}
                  onChange={(e) => setConfigTargetCo(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 p-2 text-xs font-bold text-purple-700 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-purple-300"
                >
                  {(activeCourseCoCodes.length > 0
                    ? activeCourseCoCodes
                    : liveCoSummary.map((c) => c.co_code).filter(Boolean)
                  ).map((co) => (
                    <option key={co} value={co}>
                      {co}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-gray-400 mt-1">
                  In university examinations, alternative pathways (Option A vs Option B) assess the same CO so student attainment remains unbiased.
                </p>
              </div>

              {/* Choice Model Selector */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Slot Choice Model
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setConfigQuestionType("either_or")}
                    className={`rounded-xl border p-2.5 text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      configQuestionType === "either_or"
                        ? "border-purple-600 bg-purple-50 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300"
                        : "border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-300"
                    }`}
                  >
                    <ArrowRightLeft className="h-4 w-4" />
                    <span>Either / Or Choice</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setConfigQuestionType("direct")}
                    className={`rounded-xl border p-2.5 text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      configQuestionType === "direct"
                        ? "border-purple-600 bg-purple-50 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300"
                        : "border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-300"
                    }`}
                  >
                    <Layers className="h-4 w-4" />
                    <span>Direct Sub-parts</span>
                  </button>
                </div>
              </div>

              {/* Either/Or Sub-parts Builders */}
              {configQuestionType === "either_or" ? (
                <div className="space-y-4">
                  {/* Option A Sub-parts */}
                  <div className="rounded-2xl border border-purple-200 bg-purple-50/30 p-3.5 dark:border-purple-900/40 dark:bg-purple-950/20">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-black uppercase text-purple-900 dark:text-purple-200">
                        Option A Sub-parts (Sum: {optionASubs.reduce((a, b) => a + b.marks, 0)}/{configuringSlot.max_marks}M)
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setOptionASubs([
                            ...optionASubs,
                            {
                              sub_id: `a.${optionASubs.length + 1}`,
                              label: `a) ${String.fromCharCode(105 + optionASubs.length)})`,
                              marks: 4,
                              co_level: configTargetCo,
                            },
                          ])
                        }
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 hover:text-purple-900"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Add Sub-part</span>
                      </button>
                    </div>

                    <div className="space-y-2">
                      {optionASubs.map((sub, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={sub.label}
                            onChange={(e) => {
                              const copy = [...optionASubs];
                              copy[idx].label = e.target.value;
                              setOptionASubs(copy);
                            }}
                            className="w-24 rounded-lg border border-gray-300 p-1.5 text-xs font-bold dark:border-gray-700 dark:bg-gray-800"
                          />
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="1"
                              max={configuringSlot.max_marks}
                              value={sub.marks}
                              onChange={(e) => {
                                const copy = [...optionASubs];
                                copy[idx].marks = Number(e.target.value) || 0;
                                setOptionASubs(copy);
                              }}
                              className="w-20 rounded-lg border border-gray-300 p-1.5 text-xs font-bold dark:border-gray-700 dark:bg-gray-800"
                            />
                            <span className="text-xs text-gray-500">Marks</span>
                          </div>
                          {optionASubs.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setOptionASubs(optionASubs.filter((_, i) => i !== idx))}
                              className="text-red-500 hover:text-red-700 p-1"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Option B Sub-parts */}
                  <div className="rounded-2xl border border-indigo-200 bg-indigo-50/30 p-3.5 dark:border-indigo-900/40 dark:bg-indigo-950/20">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-black uppercase text-indigo-900 dark:text-indigo-200">
                        Option B Sub-parts (Sum: {optionBSubs.reduce((a, b) => a + b.marks, 0)}/{configuringSlot.max_marks}M)
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setOptionBSubs([
                            ...optionBSubs,
                            {
                              sub_id: `b.${optionBSubs.length + 1}`,
                              label: `b) ${String.fromCharCode(105 + optionBSubs.length)})`,
                              marks: 4,
                              co_level: configTargetCo,
                            },
                          ])
                        }
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 hover:text-indigo-900"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Add Sub-part</span>
                      </button>
                    </div>

                    <div className="space-y-2">
                      {optionBSubs.map((sub, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={sub.label}
                            onChange={(e) => {
                              const copy = [...optionBSubs];
                              copy[idx].label = e.target.value;
                              setOptionBSubs(copy);
                            }}
                            className="w-24 rounded-lg border border-gray-300 p-1.5 text-xs font-bold dark:border-gray-700 dark:bg-gray-800"
                          />
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="1"
                              max={configuringSlot.max_marks}
                              value={sub.marks}
                              onChange={(e) => {
                                const copy = [...optionBSubs];
                                copy[idx].marks = Number(e.target.value) || 0;
                                setOptionBSubs(copy);
                              }}
                              className="w-20 rounded-lg border border-gray-300 p-1.5 text-xs font-bold dark:border-gray-700 dark:bg-gray-800"
                            />
                            <span className="text-xs text-gray-500">Marks</span>
                          </div>
                          {optionBSubs.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setOptionBSubs(optionBSubs.filter((_, i) => i !== idx))}
                              className="text-red-500 hover:text-red-700 p-1"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* Direct Sub-parts Builder */
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3.5 dark:border-gray-750 dark:bg-gray-800">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                      Sub-parts (Sum: {directSubs.reduce((a, b) => a + b.marks, 0)}/{configuringSlot.max_marks}M)
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setDirectSubs([
                          ...directSubs,
                          {
                            sub_id: `sub_${directSubs.length + 1}`,
                            label: `${String.fromCharCode(97 + directSubs.length)})`,
                            marks: 2,
                            co_level: configTargetCo,
                          },
                        ])
                      }
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Add Sub-part</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {directSubs.map((sub, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={sub.label}
                          onChange={(e) => {
                            const copy = [...directSubs];
                            copy[idx].label = e.target.value;
                            setDirectSubs(copy);
                          }}
                          className="w-20 rounded-lg border border-gray-300 p-1.5 text-xs font-bold dark:border-gray-700 dark:bg-gray-800"
                        />
                        <input
                          type="number"
                          min="1"
                          max={configuringSlot.max_marks}
                          value={sub.marks}
                          onChange={(e) => {
                            const copy = [...directSubs];
                            copy[idx].marks = Number(e.target.value) || 0;
                            setDirectSubs(copy);
                          }}
                          className="w-20 rounded-lg border border-gray-300 p-1.5 text-xs font-bold dark:border-gray-700 dark:bg-gray-800"
                        />
                        <span className="text-xs text-gray-500">Marks</span>
                        <select
                          value={sub.co_level || configTargetCo}
                          onChange={(e) => {
                            const copy = [...directSubs];
                            copy[idx].co_level = e.target.value;
                            setDirectSubs(copy);
                          }}
                          className="rounded-lg border border-gray-300 p-1.5 text-xs font-bold dark:border-gray-700 dark:bg-gray-800"
                        >
                          {(activeCourseCoCodes.length > 0
                            ? activeCourseCoCodes
                            : liveCoSummary.map((c) => c.co_code).filter(Boolean)
                          ).map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                        {directSubs.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setDirectSubs(directSubs.filter((_, i) => i !== idx))}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="flex items-center justify-between border-t border-gray-100 pt-3 dark:border-gray-800">
              <button
                type="button"
                onClick={handleClearStructure}
                disabled={savingStructure}
                className="text-xs font-bold text-gray-500 hover:text-red-600 transition-colors"
              >
                Reset to Compulsory Single Slot
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setConfiguringSlot(null)}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveStructure}
                  disabled={savingStructure}
                  className="rounded-xl bg-purple-600 px-5 py-2 text-xs font-bold text-white shadow hover:bg-purple-700 disabled:opacity-50"
                >
                  {savingStructure ? "Saving..." : "Save Structure"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlueprintSlotsPane;
