import React from "react";
import {
  Layers,
  Award,
  CheckCircle2,
  PlusCircle,
  XCircle,
  HelpCircle,
  Image as ImageIcon,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { QuestionPaperTemplate, CandidateQuestion } from "@/types/cia-test.types";
import FormattedMathText from "@/components/common-components/FormattedMathText";
import QuestionDiagramPreview from "@/components/cia-tests/assembly/QuestionDiagramPreview";
import { toast } from "react-toastify";

interface BlueprintSlotsPaneProps {
  template: QuestionPaperTemplate | null;
  candidates: CandidateQuestion[];
  activeSlotId: number | null;
  actionLoadingId: number | string | null;
  onSelectSlot: (slotId: number) => void;
  onUnassignSlot: (slotId: number) => void;
  onAssignSlot?: (slotId: number, questionId: number) => void;
}

export const BlueprintSlotsPane: React.FC<BlueprintSlotsPaneProps> = ({
  template,
  candidates,
  activeSlotId,
  actionLoadingId,
  onSelectSlot,
  onUnassignSlot,
  onAssignSlot,
}) => {
  const [dragOverSlotId, setDragOverSlotId] = React.useState<number | null>(null);
  const sections = template?.sections || [];

  return (
    <div className="flex flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      {/* Pane Header */}
      <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            Question Paper Blueprint Slots
          </h2>
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Click an empty slot to map candidates
        </span>
      </div>

      {sections.length === 0 ? (
        <div className="py-12 text-center text-xs text-gray-400">
          No sections defined for this template blueprint.
        </div>
      ) : (
        <div className="space-y-6 overflow-y-auto pr-1">
          {sections.map((sec, secIdx) => {
            const questions = sec.questions || [];
            const assignedCount = questions.filter((q) => q.actual_question_id).length;

            return (
              <div
                key={sec.id || secIdx}
                className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 dark:border-gray-700/60 dark:bg-gray-900/40"
              >
                {/* Section Header */}
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-gray-200/60 pb-2 dark:border-gray-700">
                  <div>
                    <span className="text-xs font-extrabold uppercase tracking-wider text-purple-700 dark:text-purple-400">
                      {sec.section_name}
                    </span>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                      {sec.section_title || `Part ${secIdx + 1}`}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="rounded-lg bg-purple-100 px-2.5 py-0.5 font-bold text-purple-800 dark:bg-purple-900/50 dark:text-purple-300">
                      {sec.allocated_marks} Marks Total
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                      ({assignedCount}/{questions.length} Assigned)
                    </span>
                  </div>
                </div>

                {/* Slots List */}
                <div className="space-y-2.5">
                  {questions.map((slot) => {
                    const isSelected = activeSlotId === slot.id;
                    const assignedCandidate =
                      (slot as any).assigned_question ||
                      (slot.actual_question_id
                        ? candidates.find((c) => c.id === slot.actual_question_id)
                        : null);
                    const isAssigned = !!slot.actual_question_id || !!(slot as any).assigned_question;
                    const isDragOver = dragOverSlotId === slot.id;

                    return (
                      <div
                        key={slot.id}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = "move";
                        }}
                        onDragEnter={(e) => {
                          e.preventDefault();
                          setDragOverSlotId(slot.id);
                        }}
                        onDragLeave={(e) => {
                          if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                          setDragOverSlotId(null);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          setDragOverSlotId(null);
                          try {
                            const raw = e.dataTransfer.getData("application/json");
                            if (!raw) return;
                            const data = JSON.parse(raw);
                            const qId = Number(data.questionId);
                            const qMarks = Number(data.maxMarks);
                            const slotMarks = Number(slot.max_marks);

                            if (qMarks !== slotMarks) {
                              toast.error(
                                `Marks Mismatch: Question carries ${qMarks}M, but Slot Q${slot.question_number} requires ${slotMarks}M.`
                              );
                              return;
                            }

                            if (onAssignSlot) {
                              onAssignSlot(slot.id, qId);
                            }
                          } catch (err) {
                            console.error("Drop handling failed", err);
                          }
                        }}
                        className={`group relative rounded-xl border p-3.5 transition-all duration-150 ${
                          isDragOver
                            ? "border-purple-600 bg-purple-100/70 ring-4 ring-purple-500/30 scale-[1.01] shadow-lg dark:border-purple-400 dark:bg-purple-950/60"
                            : isSelected
                            ? "border-purple-600 bg-purple-50/50 ring-2 ring-purple-500/30 dark:border-purple-500 dark:bg-purple-950/30"
                            : isAssigned
                            ? "border-green-200 bg-white hover:border-green-300 dark:border-green-900/40 dark:bg-gray-800"
                            : "border-dashed border-gray-300 bg-white hover:border-purple-400 hover:bg-purple-50/20 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-purple-500"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          {/* Left: Slot Number & Status */}
                          <div className="flex items-center gap-2">
                            <span
                              className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-black ${
                                isAssigned
                                  ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300"
                                  : isSelected
                                  ? "bg-purple-600 text-white"
                                  : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                              }`}
                            >
                              Q{slot.question_number}
                            </span>

                            <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                              {slot.max_marks} Marks
                            </span>

                            {isAssigned && (
                              <span className="inline-flex items-center gap-1 rounded-md bg-green-50 px-2 py-0.5 text-[11px] font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-300">
                                <CheckCircle2 className="h-3 w-3" />
                                Assigned
                              </span>
                            )}
                          </div>

                          {/* Right: Actions */}
                          <div>
                            {isAssigned ? (
                              <button
                                onClick={() => slot.id && onUnassignSlot(slot.id)}
                                disabled={actionLoadingId === `slot-unassign-${slot.id}`}
                                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                              >
                                <XCircle className="h-3.5 w-3.5" />
                                <span>Unassign</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => slot.id && onSelectSlot(slot.id)}
                                className={`inline-flex items-center gap-1 rounded-lg px-3 py-1 text-xs font-bold transition-all ${
                                  isSelected
                                    ? "bg-purple-600 text-white shadow-sm"
                                    : "bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-900/40 dark:text-purple-300"
                                }`}
                              >
                                <PlusCircle className="h-3.5 w-3.5" />
                                <span>{isSelected ? "Active Target" : "Select Slot"}</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Drag Over Active Overlay Feedback */}
                        {isDragOver && (
                          <div className="mt-2.5 flex items-center justify-center gap-2 rounded-xl border border-dashed border-purple-500 bg-purple-200/80 p-2.5 text-xs font-bold text-purple-900 dark:bg-purple-900/80 dark:text-purple-100 animate-pulse">
                            <Sparkles className="h-4 w-4 animate-spin text-purple-700 dark:text-purple-300" />
                            <span>Drop question to assign to Slot Q{slot.question_number} ({slot.max_marks}M)</span>
                          </div>
                        )}

                        {/* Slot Content Preview */}
                        <div className="mt-2.5">
                          {isAssigned && assignedCandidate ? (
                            <div className="rounded-lg bg-gray-50 p-2.5 text-xs text-gray-800 dark:bg-gray-900/60 dark:text-gray-200">
                              {/* Metadata Badges */}
                              <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
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

                              {/* Question Text */}
                              <FormattedMathText
                                text={assignedCandidate.question_text}
                                className="line-clamp-2 text-xs font-medium block"
                              />

                              {/* Vector or MinIO Diagram rendering if present */}
                              {(assignedCandidate.diagram_url || assignedCandidate.diagram_spec) && (
                                <div className="mt-2">
                                  <QuestionDiagramPreview
                                    diagramUrl={assignedCandidate.diagram_url}
                                    diagramSpec={assignedCandidate.diagram_spec}
                                    thumbnail={true}
                                  />
                                </div>
                              )}

                              {/* Sub questions breakdown if any */}
                              {assignedCandidate.sub_questions &&
                                assignedCandidate.sub_questions.length > 0 && (
                                  <div className="mt-2 space-y-1 border-t border-gray-200/50 pt-1.5 dark:border-gray-700/50">
                                    {assignedCandidate.sub_questions.map((sq: any, sqIdx: number) => (
                                      <div
                                        key={sqIdx}
                                        className="flex items-center justify-between text-[11px] text-gray-600 dark:text-gray-400"
                                      >
                                        <span className="line-clamp-1">
                                          ({sq.sub_label || String.fromCharCode(97 + sqIdx)}){" "}
                                          <FormattedMathText text={sq.text || sq.sub_text} />
                                        </span>
                                        <span className="font-bold text-purple-600 dark:text-purple-400 flex-shrink-0 ml-2">
                                          {sq.marks}M
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                            </div>
                          ) : isAssigned ? (
                            <div className="rounded-lg bg-gray-50 p-2 text-xs text-gray-600 dark:bg-gray-900/50 dark:text-gray-400">
                              Question #{slot.actual_question_id} linked.
                            </div>
                          ) : isSelected ? (
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-700 dark:text-purple-300 animate-pulse">
                              <Sparkles className="h-3.5 w-3.5" />
                              <span>Select or Drag a matching {slot.max_marks}M question here</span>
                            </div>
                          ) : (
                            <div className="text-xs text-gray-400 dark:text-gray-500 italic">
                              Empty Slot — Drag question here or click &quot;Select Slot&quot;
                            </div>
                          )}
                        </div>
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
