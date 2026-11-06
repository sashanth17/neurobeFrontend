import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Layers,
  Award,
  CheckCircle2,
  PlusCircle,
  XCircle,
  HelpCircle,
  Edit,
  Plus,
  Trash2,
  ArrowRightLeft,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import {
  QuestionPaperTemplate,
  CandidateQuestion,
  COSummaryItem,
} from "@/types/cia-test.types";
import FormattedMathText from "@/components/common-components/FormattedMathText";
import QuestionPaperStudioService from "@/services/questionPaperStudioService";
import { toast } from "react-toastify";
import { useCourseOutcomes } from "@/hook/useCourseOutcomes";

interface BlueprintSlotsPaneProps {
  courseId?: string | number;
  templateId?: string | number;
  template: QuestionPaperTemplate | null;
  candidates: CandidateQuestion[];
  coCodes?: string[];
  activeSlotId: number | null;
  activeSubId?: string | null;
  actionLoadingId: number | string | null;
  onSelectSlot: (slotId: number, subId?: string | null) => void;
  onUnassignSlot: (slotId: number, subId?: string | null) => void;
  onAssignSlot?: (slotId: number, questionId: number, subId?: string | null) => void;
  onEditQuestion?: (question: CandidateQuestion) => void;
  onUpdateSlotStructure?: (slotId: number, payload: any) => Promise<boolean>;
}

const toRoman = (num: number): string => {
  const romans = ["i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x"];
  return romans[num - 1] || `${num}`;
};

export const BlueprintSlotsPane: React.FC<BlueprintSlotsPaneProps> = ({
  courseId,
  templateId,
  template,
  candidates,
  coCodes: propCoCodes,
  activeSlotId,
  activeSubId,
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
  const [, setApiIsBalanced] = useState<boolean>(false);
  const [, setCoLoading] = useState<boolean>(false);

  // Local draft marks to support smooth numerical inputs
  const [editingMarks, setEditingMarks] = useState<Record<string, number>>({});

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

  // Fallback Live Calculation if API summary is still loading
  const liveCoSummary = useMemo(() => {
    if (apiCoSummary.length > 0) return apiCoSummary;

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

  const { coCodes: fetchedCoCodes } = useCourseOutcomes(courseId);
  const activeCourseCoCodes = propCoCodes && propCoCodes.length > 0 ? propCoCodes : fetchedCoCodes;

  // ── Helper: Resolve Slot Structure (Defaults Either/Or to 11.a and 11.b) ──
  const getResolvedStructure = useCallback((slot: any) => {
    const isEitherOr =
      slot.question_type === "either_or" ||
      slot.sub_question_structure?.type === "either_or";

    if (isEitherOr) {
      const existing = slot.sub_question_structure;
      if (existing && existing.type === "either_or") {
        const optASubs = (existing.option_a?.sub_questions || []).length > 0
          ? existing.option_a.sub_questions
          : [
              {
                sub_id: "a",
                label: `${slot.question_number}.a`,
                marks: Number(slot.max_marks),
                co_level: existing.target_co || slot.target_co,
                assigned_question_id: slot.actual_question_id || null,
              },
            ];
        const optBSubs = (existing.option_b?.sub_questions || []).length > 0
          ? existing.option_b.sub_questions
          : [
              {
                sub_id: "b",
                label: `${slot.question_number}.b`,
                marks: Number(slot.max_marks),
                co_level: existing.target_co || slot.target_co,
                assigned_question_id: null,
              },
            ];

        return {
          type: "either_or",
          target_co: existing.target_co || slot.target_co,
          option_a: {
            label: "a",
            sub_questions: optASubs,
          },
          option_b: {
            label: "b",
            sub_questions: optBSubs,
          },
        };
      }

      // By default: Option A (11.a) and Option B (11.b)
      return {
        type: "either_or",
        target_co: slot.target_co,
        option_a: {
          label: "a",
          sub_questions: [
            {
              sub_id: "a",
              label: `${slot.question_number}.a`,
              marks: Number(slot.max_marks),
              co_level: slot.target_co,
              assigned_question_id: slot.actual_question_id || null,
            },
          ],
        },
        option_b: {
          label: "b",
          sub_questions: [
            {
              sub_id: "b",
              label: `${slot.question_number}.b`,
              marks: Number(slot.max_marks),
              co_level: slot.target_co,
              assigned_question_id: null,
            },
          ],
        },
      };
    }

    if (slot.sub_question_structure && slot.sub_question_structure.type === "direct") {
      return slot.sub_question_structure;
    }

    return null;
  }, []);

  // ── Helper: Distribute Total Marks Evenly Across Sub-Questions ──
  const distributeMarks = (totalMarks: number, count: number): number[] => {
    if (count <= 0) return [];
    const base = Math.floor(totalMarks / count);
    const remainder = totalMarks % count;
    return Array.from({ length: count }, (_, i) => base + (i >= count - remainder ? 1 : 0));
  };

  // ── Action: Add Sub-Question in-place ──
  const handleAddSubQuestion = async (slot: any, branch: "option_a" | "option_b" | "direct") => {
    if (!onUpdateSlotStructure) return;
    const currentStruct = getResolvedStructure(slot);
    const slotMarks = Number(slot.max_marks);
    const targetCo = slot.target_co || activeCourseCoCodes[0] || "CO1";

    if (branch === "option_a" || branch === "option_b") {
      const isBranchA = branch === "option_a";
      const branchKey = isBranchA ? "option_a" : "option_b";
      const prefix = isBranchA ? "a" : "b";
      const currentSubs = [...(currentStruct?.[branchKey]?.sub_questions || [])];

      const newCount =
        currentSubs.length <= 1 && (currentSubs.length === 0 || currentSubs[0].sub_id === prefix)
          ? 2
          : currentSubs.length + 1;

      // Mathematically guaranteed to sum to slotMarks exactly
      const marksList = distributeMarks(slotMarks, newCount);

      const newSubs = marksList.map((m, idx) => {
        const subId = `${prefix}.${idx + 1}`;
        const existingSub = currentSubs[idx];
        return {
          sub_id: subId,
          label: `${slot.question_number}.${prefix} (${toRoman(idx + 1)})`,
          marks: m,
          co_level: existingSub?.co_level || targetCo,
          assigned_question_id: existingSub?.assigned_question_id || null,
        };
      });

      const updatedPayload = {
        question_type: "either_or",
        target_co: currentStruct?.target_co || targetCo,
        sub_question_structure: {
          type: "either_or",
          target_co: currentStruct?.target_co || targetCo,
          option_a: {
            label: "a",
            sub_questions: isBranchA
              ? newSubs
              : (currentStruct?.option_a?.sub_questions || []),
          },
          option_b: {
            label: "b",
            sub_questions: !isBranchA
              ? newSubs
              : (currentStruct?.option_b?.sub_questions || []),
          },
        },
      };

      const ok = await onUpdateSlotStructure(slot.id, updatedPayload);
      if (ok) fetchCoSummary();
    } else {
      // Direct compulsory question with subparts
      const currentSubs = [...(currentStruct?.sub_questions || [])];
      const newCount = currentSubs.length === 0 ? 2 : currentSubs.length + 1;
      const marksList = distributeMarks(slotMarks, newCount);

      const newSubs = marksList.map((m, idx) => {
        const char = String.fromCharCode(97 + idx); // a, b, c...
        const existingSub = currentSubs[idx];
        return {
          sub_id: char,
          label: `${slot.question_number}.${char}`,
          marks: m,
          co_level: existingSub?.co_level || targetCo,
          assigned_question_id: existingSub?.assigned_question_id || null,
        };
      });

      const updatedPayload = {
        question_type: "direct",
        target_co: targetCo,
        sub_question_structure: {
          type: "direct",
          target_co: targetCo,
          sub_questions: newSubs,
        },
      };

      const ok = await onUpdateSlotStructure(slot.id, updatedPayload);
      if (ok) fetchCoSummary();
    }
  };

  // ── Action: Delete Sub-Question in-place ──
  const handleDeleteSubQuestion = async (
    slot: any,
    branch: "option_a" | "option_b" | "direct",
    subId: string
  ) => {
    if (!onUpdateSlotStructure) return;
    const currentStruct = getResolvedStructure(slot);
    const slotMarks = Number(slot.max_marks);
    const targetCo = slot.target_co || activeCourseCoCodes[0] || "CO1";

    if (branch === "option_a" || branch === "option_b") {
      const isBranchA = branch === "option_a";
      const branchKey = isBranchA ? "option_a" : "option_b";
      const prefix = isBranchA ? "a" : "b";
      const remaining = (currentStruct?.[branchKey]?.sub_questions || []).filter(
        (sq: any) => sq.sub_id !== subId
      );

      let updatedSubs: any[] = [];
      if (remaining.length <= 1) {
        // Revert back to single default option (e.g. 11.a) with full slot marks
        const remainingSub = remaining[0];
        // If remaining subquestion had a question assigned, verify marks match the new full slotMarks
        const canKeepAssigned =
          remainingSub?.assigned_question_id &&
          Number(remainingSub.marks) === slotMarks;

        updatedSubs = [
          {
            sub_id: prefix,
            label: `${slot.question_number}.${prefix}`,
            marks: slotMarks,
            co_level: targetCo,
            assigned_question_id: canKeepAssigned ? remainingSub.assigned_question_id : null,
            assigned_question: canKeepAssigned ? remainingSub.assigned_question : null,
          },
        ];
      } else {
        const marksList = distributeMarks(slotMarks, remaining.length);
        updatedSubs = remaining.map((sq: any, idx: number) => {
          const newMarks = marksList[idx];
          const canKeep =
            sq.assigned_question_id && Number(sq.marks) === newMarks;
          return {
            ...sq,
            sub_id: `${prefix}.${idx + 1}`,
            label: `${slot.question_number}.${prefix} (${toRoman(idx + 1)})`,
            marks: newMarks,
            assigned_question_id: canKeep ? sq.assigned_question_id : null,
            assigned_question: canKeep ? sq.assigned_question : null,
          };
        });
      }

      const updatedPayload = {
        question_type: "either_or",
        target_co: currentStruct?.target_co || targetCo,
        sub_question_structure: {
          type: "either_or",
          target_co: currentStruct?.target_co || targetCo,
          option_a: {
            label: "a",
            sub_questions: isBranchA
              ? updatedSubs
              : (currentStruct?.option_a?.sub_questions || []),
          },
          option_b: {
            label: "b",
            sub_questions: !isBranchA
              ? updatedSubs
              : (currentStruct?.option_b?.sub_questions || []),
          },
        },
      };

      const ok = await onUpdateSlotStructure(slot.id, updatedPayload);
      if (ok) fetchCoSummary();
    } else {
      // Direct slot deletion
      const remaining = (currentStruct?.sub_questions || []).filter(
        (sq: any) => sq.sub_id !== subId
      );
      if (remaining.length <= 1) {
        const ok = await onUpdateSlotStructure(slot.id, {
          question_type: "direct",
          target_co: targetCo,
          sub_question_structure: null,
        });
        if (ok) fetchCoSummary();
      } else {
        const marksList = distributeMarks(slotMarks, remaining.length);
        const updatedSubs = remaining.map((sq: any, idx: number) => {
          const char = String.fromCharCode(97 + idx);
          const newMarks = marksList[idx];
          const canKeep =
            sq.assigned_question_id && Number(sq.marks) === newMarks;
          return {
            ...sq,
            sub_id: char,
            label: `${slot.question_number}.${char}`,
            marks: newMarks,
            assigned_question_id: canKeep ? sq.assigned_question_id : null,
            assigned_question: canKeep ? sq.assigned_question : null,
          };
        });
        const ok = await onUpdateSlotStructure(slot.id, {
          question_type: "direct",
          target_co: targetCo,
          sub_question_structure: {
            type: "direct",
            target_co: targetCo,
            sub_questions: updatedSubs,
          },
        });
        if (ok) fetchCoSummary();
      }
    }
  };

  // ── Action: Update Sub-Question Marks in-place ──
  const handleUpdateSubMarks = async (
    slot: any,
    branch: "option_a" | "option_b" | "direct",
    subId: string,
    newMarks: number
  ) => {
    if (!onUpdateSlotStructure) return;
    const currentStruct = getResolvedStructure(slot);
    const slotMarks = Number(slot.max_marks);
    const targetCo = slot.target_co || activeCourseCoCodes[0] || "CO1";

    if (branch === "option_a" || branch === "option_b") {
      const isBranchA = branch === "option_a";
      const branchKey = isBranchA ? "option_a" : "option_b";
      const subs = currentStruct?.[branchKey]?.sub_questions || [];

      let updatedSubs = subs.map((sq: any) => {
        if (sq.sub_id === subId) {
          return { ...sq, marks: Math.max(1, newMarks) };
        }
        return sq;
      });

      // If exactly 2 subparts, auto-balance the other subpart to guarantee exact sum
      if (subs.length === 2) {
        const clampedNew = Math.min(Math.max(1, newMarks), slotMarks - 1);
        const otherMarks = slotMarks - clampedNew;
        updatedSubs = subs.map((sq: any) => {
          if (sq.sub_id === subId) {
            return { ...sq, marks: clampedNew };
          }
          return { ...sq, marks: otherMarks };
        });
        setEditingMarks((prev) => {
          const next = { ...prev };
          subs.forEach((sq: any) => delete next[`${slot.id}-${sq.sub_id}`]);
          return next;
        });
      }

      const sum = updatedSubs.reduce((acc: number, sq: any) => acc + Number(sq.marks || 0), 0);
      if (Math.abs(sum - slotMarks) > 0.01) {
        toast.warning(
          `Sub-questions sum (${sum}M) must equal slot marks (${slotMarks}M). Please balance the marks.`
        );
        return;
      }

      const updatedPayload = {
        question_type: "either_or",
        target_co: currentStruct?.target_co || targetCo,
        sub_question_structure: {
          type: "either_or",
          target_co: currentStruct?.target_co || targetCo,
          option_a: {
            label: "a",
            sub_questions: isBranchA
              ? updatedSubs
              : (currentStruct?.option_a?.sub_questions || []),
          },
          option_b: {
            label: "b",
            sub_questions: !isBranchA
              ? updatedSubs
              : (currentStruct?.option_b?.sub_questions || []),
          },
        },
      };

      const ok = await onUpdateSlotStructure(slot.id, updatedPayload);
      if (ok) fetchCoSummary();
    } else {
      const subs = currentStruct?.sub_questions || [];
      let updatedSubs = subs.map((sq: any) => {
        if (sq.sub_id === subId) {
          return { ...sq, marks: Math.max(1, newMarks) };
        }
        return sq;
      });

      if (subs.length === 2) {
        const clampedNew = Math.min(Math.max(1, newMarks), slotMarks - 1);
        const otherMarks = slotMarks - clampedNew;
        updatedSubs = subs.map((sq: any) => {
          if (sq.sub_id === subId) {
            return { ...sq, marks: clampedNew };
          }
          return { ...sq, marks: otherMarks };
        });
        setEditingMarks((prev) => {
          const next = { ...prev };
          subs.forEach((sq: any) => delete next[`${slot.id}-${sq.sub_id}`]);
          return next;
        });
      }

      const sum = updatedSubs.reduce((acc: number, sq: any) => acc + Number(sq.marks || 0), 0);
      if (Math.abs(sum - slotMarks) > 0.01) {
        toast.warning(
          `Sub-questions sum (${sum}M) must equal slot marks (${slotMarks}M). Please balance the marks.`
        );
        return;
      }

      const ok = await onUpdateSlotStructure(slot.id, {
        question_type: "direct",
        target_co: targetCo,
        sub_question_structure: {
          type: "direct",
          target_co: targetCo,
          sub_questions: updatedSubs,
        },
      });
      if (ok) fetchCoSummary();
    }
  };

  // ── Drop Guard & Assignment Validation ──
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

      // 2. CO Match Guard
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

  // ── Render Mark Validation Badge ──
  const renderMarkValidationBadge = (currentSum: number, slotMaxMarks: number) => {
    const diff = slotMaxMarks - currentSum;
    if (Math.abs(diff) < 0.01) {
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-green-50 px-2 py-0.5 text-[11px] font-bold text-green-700 border border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-800">
          <CheckCircle2 className="h-3 w-3" />
          <span>{currentSum}/{slotMaxMarks}M (Balanced)</span>
        </span>
      );
    }
    if (diff > 0) {
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
          <HelpCircle className="h-3 w-3" />
          <span>{currentSum}/{slotMaxMarks}M ({diff}M remaining)</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800">
        <ShieldAlert className="h-3 w-3" />
        <span>{currentSum}/{slotMaxMarks}M (Exceeds by {Math.abs(diff)}M)</span>
      </span>
    );
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
          <span className="text-[11px] font-semibold text-purple-800 dark:text-purple-300">
            {liveCoSummary.filter((c) => c.is_fulfilled).length}/{liveCoSummary.length} COs Balanced
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {liveCoSummary.map((item) => {
            const isFulfilled = item.is_fulfilled;
            const diff = item.allocated_marks - item.assigned_marks;
            const isExceeded = diff < -0.01;

            return (
              <div
                key={item.co_code}
                className={`rounded-xl border p-2 text-xs transition-all ${
                  isFulfilled
                    ? "border-green-300 bg-green-50/80 text-green-950 dark:border-green-800 dark:bg-green-950/30 dark:text-green-200"
                    : isExceeded
                    ? "border-red-300 bg-red-50/80 text-red-950 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200"
                    : "border-purple-200 bg-white/80 text-gray-800 dark:border-purple-900/50 dark:bg-gray-800/80 dark:text-gray-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-[11px] uppercase tracking-wide">
                    {item.co_code}
                  </span>
                  {isFulfilled ? (
                    <span className="flex items-center text-[10px] font-bold text-green-700 dark:text-green-400">
                      <CheckCircle2 className="mr-0.5 h-3 w-3" /> OK
                    </span>
                  ) : isExceeded ? (
                    <span className="text-[10px] font-bold text-red-600">+{Math.abs(diff)}M</span>
                  ) : (
                    <span className="text-[10px] font-bold text-amber-600">-{diff}M</span>
                  )}
                </div>
                <div className="mt-1 flex items-baseline justify-between text-[11px]">
                  <span className="font-bold text-gray-900 dark:text-white">
                    {item.assigned_marks}M
                  </span>
                  <span className="text-[10px] text-gray-500">/ {item.allocated_marks}M</span>
                </div>
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
                  </div>
                </div>

                {/* Slots List */}
                <div className="space-y-4">
                  {questions.map((slot: any) => {
                    const isEitherOrSlot =
                      slot.question_type === "either_or" ||
                      slot.sub_question_structure?.type === "either_or";
                    const resolvedStruct = getResolvedStructure(slot);
                    const targetCo = slot.target_co || resolvedStruct?.target_co;

                    // Direct whole slot assignment check
                    const isWholeSlotAssigned = Boolean(
                      slot.actual_question_id || (slot as any).assigned_question
                    );
                    const assignedCandidateWhole =
                      (slot as any).assigned_question ||
                      (slot.actual_question_id
                        ? candidates.find((c) => c.id === slot.actual_question_id)
                        : null);

                    const slotKey = `slot-${slot.id}`;

                    return (
                      <div
                        key={slot.id}
                        className="group relative rounded-2xl border border-gray-200/90 bg-white p-4 shadow-2xs dark:border-gray-700/80 dark:bg-gray-800 transition-all"
                      >
                        {/* Slot Header: Question Number, Marks, Target CO, Type */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-gray-100 dark:border-gray-750">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="flex h-7 w-7 items-center justify-center rounded-xl text-xs font-black bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300">
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

                            {isEitherOrSlot ? (
                              <span className="rounded-lg bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800">
                                Either / Or
                              </span>
                            ) : (
                              <span className="rounded-lg bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800">
                                Direct
                              </span>
                            )}
                          </div>

                          {/* Direct Question (Non-Either-Or) Slot Header Controls */}
                          {!isEitherOrSlot && !resolvedStruct?.sub_questions && (
                            <div className="flex items-center gap-2">
                              {onUpdateSlotStructure && (
                                <button
                                  type="button"
                                  onClick={() => handleAddSubQuestion(slot, "direct")}
                                  className="inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-bold text-gray-700 hover:bg-purple-50 hover:text-purple-700 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-200 transition-colors"
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                  <span>+ Sub-Question</span>
                                </button>
                              )}

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
                                  onClick={() => slot.id && onSelectSlot(slot.id, null)}
                                  className={`inline-flex items-center gap-1 rounded-xl px-3 py-1 text-xs font-bold transition-all ${
                                    activeSlotId === slot.id && !activeSubId
                                      ? "bg-purple-600 text-white shadow-sm"
                                      : "bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-900/40 dark:text-purple-300"
                                  }`}
                                >
                                  <PlusCircle className="h-3.5 w-3.5" />
                                  <span>{activeSlotId === slot.id && !activeSubId ? "Active Target" : "Select Slot"}</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        {/* ── Slot Body ── */}
                        {isEitherOrSlot ? (
                          /* ─────────────────────────────────────────────────────────────
                             EITHER / OR QUESTION VIEW:
                             11.a 1 [Assign Question] OR 11.b 2 [Assign Question] by default
                             ───────────────────────────────────────────────────────────── */
                          <div className="mt-3.5 space-y-3.5">
                            {/* ─── OPTION A CONTAINER ─── */}
                            {(() => {
                              const optASubs = resolvedStruct?.option_a?.sub_questions || [];
                              const isSingleChoice =
                                optASubs.length === 1 &&
                                (optASubs[0].sub_id === "a" || optASubs[0].sub_id === "a.1");
                              const sumMarksA = optASubs.reduce(
                                (acc: number, sq: any) =>
                                  acc + (editingMarks[`${slot.id}-${sq.sub_id}`] ?? Number(sq.marks || 0)),
                                0
                              );

                              return (
                                <div className="rounded-2xl border border-purple-200/90 bg-purple-50/25 p-3.5 dark:border-purple-900/50 dark:bg-purple-950/15">
                                  {/* Option A Sub-Header */}
                                  <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                      <span className="font-black text-xs uppercase tracking-wider text-purple-900 dark:text-purple-200">
                                        Option A
                                      </span>
                                      {/* Real-time Comprehensive Mark Validation Badge */}
                                      {renderMarkValidationBadge(sumMarksA, slot.max_marks)}
                                    </div>

                                    {/* Add Sub-Question Button */}
                                    {onUpdateSlotStructure && (
                                      <button
                                        type="button"
                                        onClick={() => handleAddSubQuestion(slot, "option_a")}
                                        className="inline-flex items-center gap-1 rounded-xl border border-purple-200 bg-white px-2.5 py-1 text-xs font-bold text-purple-700 shadow-2xs hover:bg-purple-100 hover:text-purple-900 dark:border-purple-800 dark:bg-gray-800 dark:text-purple-300 dark:hover:bg-purple-900/50 transition-all"
                                      >
                                        <Plus className="h-3.5 w-3.5" />
                                        <span>+ Sub-Question</span>
                                      </button>
                                    )}
                                  </div>

                                  {/* Sub-Questions inside Option A */}
                                  <div className="space-y-2.5">
                                    {optASubs.map((sub: any) => {
                                      const subKey = `slot-${slot.id}-${sub.sub_id}`;
                                      const isTargetActive =
                                        activeSlotId === slot.id && activeSubId === sub.sub_id;
                                      const assignedQ =
                                        candidates.find((c) => c.id === sub.assigned_question_id) ||
                                        (sub.sub_id === "a" && slot.actual_question_id
                                          ? candidates.find((c) => c.id === slot.actual_question_id)
                                          : null);
                                      const isSubAssigned = Boolean(
                                        sub.assigned_question_id ||
                                          (sub.sub_id === "a" && slot.actual_question_id)
                                      );
                                      const isOverThisSub = dragOverSlotKey === subKey;
                                      const currentSubMarks =
                                        editingMarks[`${slot.id}-${sub.sub_id}`] ?? Number(sub.marks || 0);

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
                                            handleDropQuestion(
                                              e,
                                              slot,
                                              currentSubMarks,
                                              sub.co_level || targetCo,
                                              sub.sub_id
                                            )
                                          }
                                          className={`rounded-xl border p-3 transition-all duration-150 ${
                                            isOverThisSub
                                              ? "border-purple-600 bg-purple-100/70 ring-2 ring-purple-500"
                                              : isTargetActive
                                              ? "border-purple-600 bg-purple-50/50 ring-2 ring-purple-500/30 dark:border-purple-500 dark:bg-purple-950/20"
                                              : isSubAssigned
                                              ? "border-green-200 bg-white dark:border-green-900/40 dark:bg-gray-800"
                                              : "border-dashed border-gray-300 bg-white hover:border-purple-400 dark:border-gray-700 dark:bg-gray-800"
                                          }`}
                                        >
                                          {/* Sub-question Header Row */}
                                          <div className="flex flex-wrap items-center justify-between gap-2 pb-1.5">
                                            <div className="flex items-center gap-2">
                                              <span className="flex items-center justify-center rounded-lg bg-purple-100 px-2 py-0.5 text-xs font-black text-purple-900 dark:bg-purple-900/60 dark:text-purple-200">
                                                {sub.label || `${slot.question_number}.a`}
                                              </span>

                                              {/* Marks input: show numerical input if multiple subquestions, otherwise static label */}
                                              {!isSingleChoice ? (
                                                <div className="flex items-center gap-1">
                                                  <input
                                                    type="number"
                                                    min="1"
                                                    max={slot.max_marks}
                                                    value={currentSubMarks}
                                                    onChange={(e) => {
                                                      const val = Number(e.target.value) || 0;
                                                      setEditingMarks((prev) => ({
                                                        ...prev,
                                                        [`${slot.id}-${sub.sub_id}`]: val,
                                                      }));
                                                    }}
                                                    onBlur={() => {
                                                      const val =
                                                        editingMarks[`${slot.id}-${sub.sub_id}`] ??
                                                        Number(sub.marks || 0);
                                                      handleUpdateSubMarks(slot, "option_a", sub.sub_id, val);
                                                    }}
                                                    className="w-14 rounded-lg border border-gray-300 bg-white px-1.5 py-0.5 text-xs font-bold text-center text-gray-800 focus:outline-none focus:ring-1 focus:ring-purple-500 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-200"
                                                  />
                                                  <span className="text-[11px] font-bold text-gray-500">M</span>
                                                </div>
                                              ) : (
                                                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                                  {sub.marks} Marks
                                                </span>
                                              )}

                                              <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                                                {sub.co_level || targetCo}
                                              </span>
                                            </div>

                                            <div className="flex items-center gap-1.5">
                                              {/* Delete Sub-question option */}
                                              {!isSingleChoice && onUpdateSlotStructure && (
                                                <button
                                                  type="button"
                                                  onClick={() =>
                                                    handleDeleteSubQuestion(slot, "option_a", sub.sub_id)
                                                  }
                                                  title="Delete this sub-question"
                                                  className="inline-flex items-center gap-1 rounded-lg p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 transition-colors"
                                                >
                                                  <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                              )}

                                              {/* Sub-Slot Unassign or Select Target Button */}
                                              {isSubAssigned ? (
                                                <button
                                                  type="button"
                                                  onClick={() => onUnassignSlot(slot.id, sub.sub_id)}
                                                  className="inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                                                >
                                                  <XCircle className="h-3.5 w-3.5" />
                                                  <span>Unassign</span>
                                                </button>
                                              ) : (
                                                <button
                                                  type="button"
                                                  onClick={() => onSelectSlot(slot.id, sub.sub_id)}
                                                  className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                                                    isTargetActive
                                                      ? "bg-purple-600 text-white shadow-2xs"
                                                      : "bg-purple-100 text-purple-800 hover:bg-purple-200 dark:bg-purple-900/40 dark:text-purple-300"
                                                  }`}
                                                >
                                                  <PlusCircle className="h-3.5 w-3.5" />
                                                  <span>{isTargetActive ? "Active Target" : "Assign Question"}</span>
                                                </button>
                                              )}
                                            </div>
                                          </div>

                                          {/* Sub-Question Body: Assigned Question Preview OR Drop Zone */}
                                          {isSubAssigned && assignedQ ? (
                                            <div className="mt-2 rounded-xl bg-gray-50 p-2.5 text-xs text-gray-800 dark:bg-gray-900/60 dark:text-gray-200">
                                              <div className="mb-1.5 flex flex-wrap items-center justify-between gap-1.5">
                                                <div className="flex items-center gap-1.5">
                                                  {(assignedQ.course_outcome || assignedQ.co_level) && (
                                                    <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-bold text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300">
                                                      {assignedQ.course_outcome || assignedQ.co_level}
                                                    </span>
                                                  )}
                                                  {(assignedQ.bloom_level || assignedQ.knowledge_level) && (
                                                    <span className="rounded bg-pink-100 px-1.5 py-0.5 text-[10px] font-bold text-pink-800 dark:bg-pink-900/40 dark:text-pink-300">
                                                      {assignedQ.bloom_level || assignedQ.knowledge_level}
                                                    </span>
                                                  )}
                                                </div>
                                                {onEditQuestion && (
                                                  <button
                                                    type="button"
                                                    onClick={() => onEditQuestion(assignedQ)}
                                                    className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-500 hover:text-purple-600"
                                                  >
                                                    <Edit className="h-3 w-3" />
                                                    <span>Edit</span>
                                                  </button>
                                                )}
                                              </div>
                                              <FormattedMathText
                                                text={assignedQ.question_text}
                                                className="line-clamp-2 block text-xs font-medium"
                                              />
                                            </div>
                                          ) : isTargetActive ? (
                                            <div className="mt-2 flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-purple-400 bg-purple-50/70 p-2.5 text-xs font-semibold text-purple-700 dark:bg-purple-950/30 dark:text-purple-300 animate-pulse">
                                              <Sparkles className="h-4 w-4" />
                                              <span>Active Target — Drop {currentSubMarks}M question or click Assign in candidate pool</span>
                                            </div>
                                          ) : (
                                            <div className="mt-2 rounded-xl border border-dashed border-gray-200 bg-gray-50/40 p-2 text-center text-xs text-gray-400 dark:border-gray-700/60 dark:bg-gray-850/40">
                                              Drop {currentSubMarks}M ({sub.co_level || targetCo}) question here
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })()}

                            {/* ─── CENTRAL OR DIVIDER ─── */}
                            <div className="relative flex items-center justify-center my-2">
                              <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-purple-200 dark:border-purple-800" />
                              </div>
                              <div className="relative rounded-full bg-white px-3.5 py-1 text-xs font-black text-purple-700 dark:bg-gray-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800 shadow-2xs flex items-center gap-1.5">
                                <ArrowRightLeft className="h-3.5 w-3.5 text-purple-600" />
                                <span>OR (Student chooses Option A or Option B • {slot.max_marks}M towards {targetCo})</span>
                              </div>
                            </div>

                            {/* ─── OPTION B CONTAINER ─── */}
                            {(() => {
                              const optBSubs = resolvedStruct?.option_b?.sub_questions || [];
                              const isSingleChoice =
                                optBSubs.length === 1 &&
                                (optBSubs[0].sub_id === "b" || optBSubs[0].sub_id === "b.1");
                              const sumMarksB = optBSubs.reduce(
                                (acc: number, sq: any) =>
                                  acc + (editingMarks[`${slot.id}-${sq.sub_id}`] ?? Number(sq.marks || 0)),
                                0
                              );

                              return (
                                <div className="rounded-2xl border border-indigo-200/90 bg-indigo-50/25 p-3.5 dark:border-indigo-900/50 dark:bg-indigo-950/15">
                                  {/* Option B Sub-Header */}
                                  <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                      <span className="font-black text-xs uppercase tracking-wider text-indigo-900 dark:text-indigo-200">
                                        Option B
                                      </span>
                                      {/* Real-time Comprehensive Mark Validation Badge */}
                                      {renderMarkValidationBadge(sumMarksB, slot.max_marks)}
                                    </div>

                                    {/* Add Sub-Question Button */}
                                    {onUpdateSlotStructure && (
                                      <button
                                        type="button"
                                        onClick={() => handleAddSubQuestion(slot, "option_b")}
                                        className="inline-flex items-center gap-1 rounded-xl border border-indigo-200 bg-white px-2.5 py-1 text-xs font-bold text-indigo-700 shadow-2xs hover:bg-indigo-100 hover:text-indigo-900 dark:border-indigo-800 dark:bg-gray-800 dark:text-indigo-300 dark:hover:bg-indigo-900/50 transition-all"
                                      >
                                        <Plus className="h-3.5 w-3.5" />
                                        <span>+ Sub-Question</span>
                                      </button>
                                    )}
                                  </div>

                                  {/* Sub-Questions inside Option B */}
                                  <div className="space-y-2.5">
                                    {optBSubs.map((sub: any) => {
                                      const subKey = `slot-${slot.id}-${sub.sub_id}`;
                                      const isTargetActive =
                                        activeSlotId === slot.id && activeSubId === sub.sub_id;
                                      const assignedQ = candidates.find((c) => c.id === sub.assigned_question_id);
                                      const isSubAssigned = Boolean(sub.assigned_question_id);
                                      const isOverThisSub = dragOverSlotKey === subKey;
                                      const currentSubMarks =
                                        editingMarks[`${slot.id}-${sub.sub_id}`] ?? Number(sub.marks || 0);

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
                                            handleDropQuestion(
                                              e,
                                              slot,
                                              currentSubMarks,
                                              sub.co_level || targetCo,
                                              sub.sub_id
                                            )
                                          }
                                          className={`rounded-xl border p-3 transition-all duration-150 ${
                                            isOverThisSub
                                              ? "border-indigo-600 bg-indigo-100/70 ring-2 ring-indigo-500"
                                              : isTargetActive
                                              ? "border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/30 dark:border-indigo-500 dark:bg-indigo-950/20"
                                              : isSubAssigned
                                              ? "border-green-200 bg-white dark:border-green-900/40 dark:bg-gray-800"
                                              : "border-dashed border-gray-300 bg-white hover:border-indigo-400 dark:border-gray-700 dark:bg-gray-800"
                                          }`}
                                        >
                                          {/* Sub-question Header Row */}
                                          <div className="flex flex-wrap items-center justify-between gap-2 pb-1.5">
                                            <div className="flex items-center gap-2">
                                              <span className="flex items-center justify-center rounded-lg bg-indigo-100 px-2 py-0.5 text-xs font-black text-indigo-900 dark:bg-indigo-900/60 dark:text-indigo-200">
                                                {sub.label || `${slot.question_number}.b`}
                                              </span>

                                              {/* Marks numerical input */}
                                              {!isSingleChoice ? (
                                                <div className="flex items-center gap-1">
                                                  <input
                                                    type="number"
                                                    min="1"
                                                    max={slot.max_marks}
                                                    value={currentSubMarks}
                                                    onChange={(e) => {
                                                      const val = Number(e.target.value) || 0;
                                                      setEditingMarks((prev) => ({
                                                        ...prev,
                                                        [`${slot.id}-${sub.sub_id}`]: val,
                                                      }));
                                                    }}
                                                    onBlur={() => {
                                                      const val =
                                                        editingMarks[`${slot.id}-${sub.sub_id}`] ??
                                                        Number(sub.marks || 0);
                                                      handleUpdateSubMarks(slot, "option_b", sub.sub_id, val);
                                                    }}
                                                    className="w-14 rounded-lg border border-gray-300 bg-white px-1.5 py-0.5 text-xs font-bold text-center text-gray-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-200"
                                                  />
                                                  <span className="text-[11px] font-bold text-gray-500">M</span>
                                                </div>
                                              ) : (
                                                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                                  {sub.marks} Marks
                                                </span>
                                              )}

                                              <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                                                {sub.co_level || targetCo}
                                              </span>
                                            </div>

                                            <div className="flex items-center gap-1.5">
                                              {/* Delete Sub-question option */}
                                              {!isSingleChoice && onUpdateSlotStructure && (
                                                <button
                                                  type="button"
                                                  onClick={() =>
                                                    handleDeleteSubQuestion(slot, "option_b", sub.sub_id)
                                                  }
                                                  title="Delete this sub-question"
                                                  className="inline-flex items-center gap-1 rounded-lg p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 transition-colors"
                                                >
                                                  <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                              )}

                                              {/* Sub-Slot Unassign or Select Target Button */}
                                              {isSubAssigned ? (
                                                <button
                                                  type="button"
                                                  onClick={() => onUnassignSlot(slot.id, sub.sub_id)}
                                                  className="inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                                                >
                                                  <XCircle className="h-3.5 w-3.5" />
                                                  <span>Unassign</span>
                                                </button>
                                              ) : (
                                                <button
                                                  type="button"
                                                  onClick={() => onSelectSlot(slot.id, sub.sub_id)}
                                                  className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                                                    isTargetActive
                                                      ? "bg-indigo-600 text-white shadow-2xs"
                                                      : "bg-indigo-100 text-indigo-800 hover:bg-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-300"
                                                  }`}
                                                >
                                                  <PlusCircle className="h-3.5 w-3.5" />
                                                  <span>{isTargetActive ? "Active Target" : "Assign Question"}</span>
                                                </button>
                                              )}
                                            </div>
                                          </div>

                                          {/* Sub-Question Body: Assigned Question Preview OR Drop Zone */}
                                          {isSubAssigned && assignedQ ? (
                                            <div className="mt-2 rounded-xl bg-gray-50 p-2.5 text-xs text-gray-800 dark:bg-gray-900/60 dark:text-gray-200">
                                              <div className="mb-1.5 flex flex-wrap items-center justify-between gap-1.5">
                                                <div className="flex items-center gap-1.5">
                                                  {(assignedQ.course_outcome || assignedQ.co_level) && (
                                                    <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-bold text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300">
                                                      {assignedQ.course_outcome || assignedQ.co_level}
                                                    </span>
                                                  )}
                                                  {(assignedQ.bloom_level || assignedQ.knowledge_level) && (
                                                    <span className="rounded bg-pink-100 px-1.5 py-0.5 text-[10px] font-bold text-pink-800 dark:bg-pink-900/40 dark:text-pink-300">
                                                      {assignedQ.bloom_level || assignedQ.knowledge_level}
                                                    </span>
                                                  )}
                                                </div>
                                                {onEditQuestion && (
                                                  <button
                                                    type="button"
                                                    onClick={() => onEditQuestion(assignedQ)}
                                                    className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-500 hover:text-indigo-600"
                                                  >
                                                    <Edit className="h-3 w-3" />
                                                    <span>Edit</span>
                                                  </button>
                                                )}
                                              </div>
                                              <FormattedMathText
                                                text={assignedQ.question_text}
                                                className="line-clamp-2 block text-xs font-medium"
                                              />
                                            </div>
                                          ) : isTargetActive ? (
                                            <div className="mt-2 flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-indigo-400 bg-indigo-50/70 p-2.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300 animate-pulse">
                                              <Sparkles className="h-4 w-4" />
                                              <span>Active Target — Drop {currentSubMarks}M question or click Assign in candidate pool</span>
                                            </div>
                                          ) : (
                                            <div className="mt-2 rounded-xl border border-dashed border-gray-200 bg-gray-50/40 p-2 text-center text-xs text-gray-400 dark:border-gray-700/60 dark:bg-gray-850/40">
                                              Drop {currentSubMarks}M ({sub.co_level || targetCo}) question here
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        ) : resolvedStruct?.sub_questions ? (
                          /* ─────────────────────────────────────────────────────────────
                             DIRECT SUB-QUESTIONS VIEW
                             ───────────────────────────────────────────────────────────── */
                          <div className="mt-3.5 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                Sub-Questions
                              </span>
                              {onUpdateSlotStructure && (
                                <button
                                  type="button"
                                  onClick={() => handleAddSubQuestion(slot, "direct")}
                                  className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 hover:text-purple-900"
                                >
                                  <Plus className="h-3 w-3" />
                                  <span>+ Sub-Question</span>
                                </button>
                              )}
                            </div>

                            <div className="space-y-2">
                              {resolvedStruct.sub_questions.map((sub: any) => {
                                const subKey = `slot-${slot.id}-${sub.sub_id}`;
                                const isTargetActive =
                                  activeSlotId === slot.id && activeSubId === sub.sub_id;
                                const assignedQ = candidates.find((c) => c.id === sub.assigned_question_id);
                                const isSubAssigned = Boolean(sub.assigned_question_id);
                                const isOverThisSub = dragOverSlotKey === subKey;
                                const currentSubMarks =
                                  editingMarks[`${slot.id}-${sub.sub_id}`] ?? Number(sub.marks || 0);

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
                                      handleDropQuestion(
                                        e,
                                        slot,
                                        currentSubMarks,
                                        sub.co_level || targetCo,
                                        sub.sub_id
                                      )
                                    }
                                    className={`rounded-xl border p-2.5 transition-all text-xs ${
                                      isOverThisSub
                                        ? "border-purple-600 bg-purple-100 ring-2 ring-purple-500"
                                        : isTargetActive
                                        ? "border-purple-600 bg-purple-50 ring-2 ring-purple-500/30"
                                        : isSubAssigned
                                        ? "border-green-200 bg-white dark:border-green-900/40 dark:bg-gray-800"
                                        : "border-dashed border-gray-300 bg-white hover:border-purple-400 dark:border-gray-700 dark:bg-gray-800"
                                    }`}
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="flex items-center gap-2 font-bold">
                                        <span className="rounded bg-purple-100 px-1.5 py-0.5 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300">
                                          {sub.label}
                                        </span>
                                        <div className="flex items-center gap-1">
                                          <input
                                            type="number"
                                            min="1"
                                            max={slot.max_marks}
                                            value={currentSubMarks}
                                            onChange={(e) => {
                                              const val = Number(e.target.value) || 0;
                                              setEditingMarks((prev) => ({
                                                ...prev,
                                                [`${slot.id}-${sub.sub_id}`]: val,
                                              }));
                                            }}
                                            onBlur={() => {
                                              const val =
                                                editingMarks[`${slot.id}-${sub.sub_id}`] ??
                                                Number(sub.marks || 0);
                                              handleUpdateSubMarks(slot, "direct", sub.sub_id, val);
                                            }}
                                            className="w-12 rounded border border-gray-300 p-0.5 text-center text-xs font-bold dark:border-gray-700 dark:bg-gray-700"
                                          />
                                          <span className="text-[11px] text-gray-500">M</span>
                                        </div>
                                        <span className="rounded bg-indigo-50 px-1 py-0.5 text-[10px] text-indigo-700">
                                          {sub.co_level || targetCo}
                                        </span>
                                      </div>

                                      <div className="flex items-center gap-1.5">
                                        {onUpdateSlotStructure && (
                                          <button
                                            type="button"
                                            onClick={() =>
                                              handleDeleteSubQuestion(slot, "direct", sub.sub_id)
                                            }
                                            className="p-1 text-gray-400 hover:text-red-600"
                                          >
                                            <Trash2 className="h-3.5 w-3.5" />
                                          </button>
                                        )}

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
                                          <button
                                            type="button"
                                            onClick={() => onSelectSlot(slot.id, sub.sub_id)}
                                            className={`rounded-lg px-2 py-0.5 text-xs font-bold ${
                                              isTargetActive
                                                ? "bg-purple-600 text-white"
                                                : "bg-purple-100 text-purple-700"
                                            }`}
                                          >
                                            {isTargetActive ? "Active" : "Assign"}
                                          </button>
                                        )}
                                      </div>
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
                          </div>
                        ) : (
                          /* ─────────────────────────────────────────────────────────────
                             STANDARD SINGLE DIRECT SLOT DROP ZONE
                             ───────────────────────────────────────────────────────────── */
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
                              dragOverSlotKey === slotKey
                                ? "border border-purple-500 bg-purple-100/70 p-3 ring-2 ring-purple-500"
                                : ""
                            }`}
                          >
                            {isWholeSlotAssigned && assignedCandidateWhole ? (
                              <div className="rounded-xl bg-gray-50 p-3 text-xs text-gray-800 dark:bg-gray-900/60 dark:text-gray-200">
                                <div className="mb-1.5 flex flex-wrap items-center justify-between gap-1.5">
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    {(assignedCandidateWhole.course_outcome ||
                                      assignedCandidateWhole.co_level) && (
                                      <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-bold text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300">
                                        {assignedCandidateWhole.course_outcome ||
                                          assignedCandidateWhole.co_level}
                                      </span>
                                    )}
                                    {(assignedCandidateWhole.bloom_level ||
                                      assignedCandidateWhole.knowledge_level) && (
                                      <span className="rounded bg-pink-100 px-1.5 py-0.5 text-[10px] font-bold text-pink-800 dark:bg-pink-900/40 dark:text-pink-300">
                                        {assignedCandidateWhole.bloom_level ||
                                          assignedCandidateWhole.knowledge_level}
                                      </span>
                                    )}
                                  </div>
                                  {onEditQuestion && (
                                    <button
                                      type="button"
                                      onClick={() => onEditQuestion(assignedCandidateWhole)}
                                      className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-500 hover:text-purple-600 transition-colors"
                                    >
                                      <Edit className="h-3 w-3" />
                                      <span>Edit</span>
                                    </button>
                                  )}
                                </div>

                                <FormattedMathText
                                  text={assignedCandidateWhole.question_text}
                                  className="line-clamp-2 text-xs font-medium block"
                                />
                              </div>
                            ) : activeSlotId === slot.id && !activeSubId ? (
                              <div className="flex items-center gap-1.5 rounded-xl border border-dashed border-purple-400 bg-purple-50/50 p-3 text-xs font-semibold text-purple-700 dark:text-purple-300 animate-pulse">
                                <Sparkles className="h-4 w-4" />
                                <span>
                                  Active Target — Drop matching {slot.max_marks}M {targetCo ? `(${targetCo})` : ""} question here
                                </span>
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
    </div>
  );
};

export default BlueprintSlotsPane;