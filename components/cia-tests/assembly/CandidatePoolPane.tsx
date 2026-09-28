import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import {
  Sparkles,
  Edit,
  Trash2,
  Lock,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Image as ImageIcon,
  Check,
  X,
  HelpCircle,
  Tag,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Layers,
  RotateCcw,
  CheckSquare,
  Square,
  Bookmark,
  Cpu,
  Compass,
  SlidersHorizontal,
  GripVertical,
} from "lucide-react";
import { CandidateQuestion, BlueprintSlot, QuestionGroupItem } from "@/types/cia-test.types";
import { CandidateFilters } from "@/hook/useQuestionAssembly";
import FormattedMathText from "@/components/common-components/FormattedMathText";
import DiagramStudioModal from "@/components/cia-tests/assembly/DiagramStudioModal";
import QuestionDiagramPreview from "@/components/cia-tests/assembly/QuestionDiagramPreview";
import QuestionPaperStudioService from "@/services/questionPaperStudioService";
import { toast } from "react-toastify";

interface CandidatePoolPaneProps {
  courseId?: string | number;
  templateId?: string | number;
  courseCode?: string;
  candidates: CandidateQuestion[];
  filteredCandidates: CandidateQuestion[];
  allSlots?: BlueprintSlot[];
  activeSlot: {
    id?: number;
    question_number?: number;
    max_marks?: number;
    section_name?: string;
  } | null;
  filters: CandidateFilters;
  actionLoadingId: number | string | null;
  onFilterChange: (filters: CandidateFilters) => void;
  onClearActiveSlot: () => void;
  onOpenAiGenerator: () => void;
  onOpenManualAuthor: () => void;
  onAssignToSlot: (slotId: number, questionId: number) => void;
  onEditQuestion: (question: CandidateQuestion) => void;
  onDeleteQuestion: (questionId: number) => void;
  onRefreshCandidates?: () => void;
}

export const CandidatePoolPane: React.FC<CandidatePoolPaneProps> = ({
  courseId,
  templateId,
  courseCode = "CS301",
  candidates,
  filteredCandidates,
  allSlots = [],
  activeSlot,
  filters,
  actionLoadingId,
  onFilterChange,
  onClearActiveSlot,
  onOpenAiGenerator,
  onOpenManualAuthor,
  onAssignToSlot,
  onEditQuestion,
  onDeleteQuestion,
  onRefreshCandidates,
}) => {
  // Modal & Studio States
  const [zoomImageUrl, setZoomImageUrl] = useState<string | null>(null);
  const [openSlotMenuId, setOpenSlotMenuId] = useState<number | null>(null);
  const [isDiagramStudioOpen, setIsDiagramStudioOpen] = useState(false);
  const [activeQuestionForDiagram, setActiveQuestionForDiagram] = useState<CandidateQuestion | null>(null);
  const [draggedQuestionId, setDraggedQuestionId] = useState<number | null>(null);

  // Grouping Mode
  const [groupBy, setGroupBy] = useState<"none" | "group_tag" | "knowledge_level" | "topic" | "marks" | "question_type">("group_tag");
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  // Multi-Selection for Bulk Tagging
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<number[]>([]);
  const [isBulkTagModalOpen, setIsBulkTagModalOpen] = useState(false);
  const [bulkTagInput, setBulkTagInput] = useState("");
  const [bulkTagLoading, setBulkTagLoading] = useState(false);

  // Single Question Tag Editor Inline Popover
  const [editingTagQuestionId, setEditingTagQuestionId] = useState<number | null>(null);
  const [singleTagInput, setSingleTagInput] = useState("");

  // Pending Deletion & 5-Second Undo State (Only for non-assigned questions)
  const [pendingDelete, setPendingDelete] = useState<{
    id: number;
    question: CandidateQuestion;
    secondsLeft: number;
  } | null>(null);
  const [hiddenQuestionIds, setHiddenQuestionIds] = useState<number[]>([]);

  const deleteTimerRef = useRef<{
    timeoutId: any;
    intervalId: any;
    currentId: number | null;
  }>({
    timeoutId: null,
    intervalId: null,
    currentId: null,
  });

  const committedDeletionsRef = useRef<Set<number>>(new Set());
  const onDeleteQuestionRef = useRef(onDeleteQuestion);
  useEffect(() => {
    onDeleteQuestionRef.current = onDeleteQuestion;
  });

  const clearDeleteTimers = useCallback(() => {
    if (deleteTimerRef.current.timeoutId) {
      clearTimeout(deleteTimerRef.current.timeoutId);
      deleteTimerRef.current.timeoutId = null;
    }
    if (deleteTimerRef.current.intervalId) {
      clearInterval(deleteTimerRef.current.intervalId);
      deleteTimerRef.current.intervalId = null;
    }
  }, []);

  const commitDeletion = useCallback(
    (questionId: number) => {
      clearDeleteTimers();
      setPendingDelete(null);
      deleteTimerRef.current.currentId = null;

      if (committedDeletionsRef.current.has(questionId)) {
        return;
      }
      committedDeletionsRef.current.add(questionId);
      onDeleteQuestionRef.current?.(questionId);
    },
    [clearDeleteTimers]
  );

  // Commit any pending deletion ONLY on component unmount
  useEffect(() => {
    return () => {
      const pendingId = deleteTimerRef.current.currentId;
      if (pendingId && !committedDeletionsRef.current.has(pendingId)) {
        committedDeletionsRef.current.add(pendingId);
        onDeleteQuestionRef.current?.(pendingId);
      }
      if (deleteTimerRef.current.timeoutId) {
        clearTimeout(deleteTimerRef.current.timeoutId);
      }
      if (deleteTimerRef.current.intervalId) {
        clearInterval(deleteTimerRef.current.intervalId);
      }
    };
  }, []);

  // Sync hidden question IDs if candidates refresh
  useEffect(() => {
    setHiddenQuestionIds((prev) =>
      prev.filter((id) => candidates.some((c) => c.id === id))
    );
  }, [candidates]);

  // Delete without confirmation modal; show 5-second Undo option
  const handleDeleteClick = (q: CandidateQuestion) => {
    if (q.is_assigned) return;

    if (deleteTimerRef.current.currentId && deleteTimerRef.current.currentId !== q.id) {
      commitDeletion(deleteTimerRef.current.currentId);
    }

    clearDeleteTimers();
    setHiddenQuestionIds((prev) => (prev.includes(q.id) ? prev : [...prev, q.id]));
    deleteTimerRef.current.currentId = q.id;

    let seconds = 5;
    setPendingDelete({
      id: q.id,
      question: q,
      secondsLeft: seconds,
    });

    deleteTimerRef.current.intervalId = setInterval(() => {
      seconds -= 1;
      if (seconds <= 0) {
        commitDeletion(q.id);
      } else {
        setPendingDelete((prev) => (prev ? { ...prev, secondsLeft: seconds } : null));
      }
    }, 1000);
  };

  const handleUndoDelete = () => {
    if (pendingDelete) {
      clearDeleteTimers();
      const restoredId = pendingDelete.id;
      setHiddenQuestionIds((prev) => prev.filter((id) => id !== restoredId));
      setPendingDelete(null);
      deleteTimerRef.current.currentId = null;
      committedDeletionsRef.current.delete(restoredId);
    }
  };

  // Filter out pending deleted questions
  const displayedCandidates = useMemo(() => {
    return filteredCandidates.filter((q) => !hiddenQuestionIds.includes(q.id));
  }, [filteredCandidates, hiddenQuestionIds]);

  // Available unique tags for quick selection
  const availableGroupTags = useMemo(() => {
    const set = new Set<string>();
    candidates.forEach((c) => {
      if (c.group_tag) set.add(c.group_tag);
    });
    return Array.from(set);
  }, [candidates]);

  // Dynamic Grouping of questions
  const groupedQuestions = useMemo(() => {
    if (groupBy === "none") {
      return [{ key: "all", label: "All Questions", count: displayedCandidates.length, questions: displayedCandidates }];
    }

    const map = new Map<string, CandidateQuestion[]>();

    displayedCandidates.forEach((q) => {
      let key = "Untagged";
      if (groupBy === "group_tag") {
        key = q.group_tag || "General";
      } else if (groupBy === "knowledge_level") {
        key = q.bloom_level || q.knowledge_level || "K-Level Unspecified";
      } else if (groupBy === "topic") {
        key = (q.topics && q.topics[0]) || (q.topic_names && q.topic_names[0]) || "Core Syllabus";
      } else if (groupBy === "marks") {
        key = `${q.max_marks} Marks`;
      } else if (groupBy === "question_type") {
        key = (q.question_type || "Direct").replace(/_/g, " ").toUpperCase();
      }

      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(q);
    });

    const groups: QuestionGroupItem[] = [];
    map.forEach((questions, key) => {
      groups.push({
        key,
        label: key,
        count: questions.length,
        questions,
      });
    });

    return groups.sort((a, b) => a.label.localeCompare(b.label));
  }, [displayedCandidates, groupBy]);

  const toggleGroupCollapse = (groupKey: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  };

  // Bulk Selection Handlers
  const handleToggleSelectQuestion = (id: number) => {
    setSelectedQuestionIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllInGroup = (questions: CandidateQuestion[]) => {
    const ids = questions.map((q) => q.id);
    const allSelected = ids.every((id) => selectedQuestionIds.includes(id));
    if (allSelected) {
      setSelectedQuestionIds((prev) => prev.filter((id) => !ids.includes(id)));
    } else {
      setSelectedQuestionIds((prev) => Array.from(new Set([...prev, ...ids])));
    }
  };

  // Apply Bulk Tag
  const handleApplyBulkTag = async () => {
    if (!bulkTagInput.trim() || selectedQuestionIds.length === 0) return;
    if (!courseId || !templateId) {
      toast.info(`Tagged ${selectedQuestionIds.length} questions as "${bulkTagInput.trim()}"`);
      setIsBulkTagModalOpen(false);
      return;
    }

    setBulkTagLoading(true);
    try {
      await QuestionPaperStudioService.bulkTagQuestions(courseId, templateId, {
        question_ids: selectedQuestionIds,
        group_tag: bulkTagInput.trim(),
      });
      toast.success(`Categorized ${selectedQuestionIds.length} questions under "${bulkTagInput.trim()}"!`);
      setSelectedQuestionIds([]);
      setBulkTagInput("");
      setIsBulkTagModalOpen(false);
      if (onRefreshCandidates) onRefreshCandidates();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to bulk tag questions");
    } finally {
      setBulkTagLoading(false);
    }
  };

  // Apply Single Question Tag
  const handleApplySingleTag = async (questionId: number) => {
    if (!singleTagInput.trim()) return;
    if (!courseId || !templateId) {
      toast.success("Tag updated!");
      setEditingTagQuestionId(null);
      return;
    }

    try {
      await QuestionPaperStudioService.updateQuestionTags(courseId, templateId, questionId, {
        group_tag: singleTagInput.trim(),
      });
      toast.success(`Tagged as "${singleTagInput.trim()}"`);
      setEditingTagQuestionId(null);
      setSingleTagInput("");
      if (onRefreshCandidates) onRefreshCandidates();
    } catch (err: any) {
      toast.error("Failed to update question tag");
    }
  };

  // Open Diagram Studio for a question
  const handleOpenDiagramStudio = (question: CandidateQuestion) => {
    setActiveQuestionForDiagram(question);
    setIsDiagramStudioOpen(true);
  };

  // Save Diagram Spec back to question
  const handleSaveDiagramSpec = async (spec: Record<string, any>, renderedUrl: string) => {
    if (!activeQuestionForDiagram) return;
    try {
      // If parent has onEditQuestion or service, update diagram_spec and diagram_url
      const updated = {
        ...activeQuestionForDiagram,
        diagram_spec: spec,
        diagram_url: renderedUrl,
      };
      onEditQuestion(updated);
      toast.success("Vector diagram attached to question!");
      if (onRefreshCandidates) onRefreshCandidates();
    } catch (e) {
      toast.error("Failed to attach diagram to question");
    }
  };

  const coOptions = ["", "CO1", "CO2", "CO3", "CO4", "CO5"];
  const bloomOptions = [
    { value: "", label: "All Bloom's" },
    { value: "K1", label: "K1 - Remember" },
    { value: "K2", label: "K2 - Understand" },
    { value: "K3", label: "K3 - Apply" },
    { value: "K4", label: "K4 - Analyze" },
    { value: "K5", label: "K5 - Evaluate" },
    { value: "K6", label: "K6 - Create" },
  ];

  return (
    <div className="relative flex flex-col rounded-3xl border border-gray-200/80 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 transition-all">
      {/* ── 1. Pane Header & Creation Actions ───────────────────────────────── */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4 dark:border-gray-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Layers className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              Candidate Question Pool
            </h2>
            <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-extrabold text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
              {displayedCandidates.length} Items
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Group, tag, and match authored & AI-generated questions into university exam blueprint slots.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Open Vector Diagram Studio */}
          <button
            type="button"
            onClick={() => {
              setActiveQuestionForDiagram(null);
              setIsDiagramStudioOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50 px-3 py-2 text-xs font-bold text-purple-700 shadow-sm transition-all hover:bg-purple-100 dark:border-purple-800 dark:bg-purple-950/40 dark:text-purple-300"
          >
            <Compass className="h-4 w-4" />
            <span>Diagram Studio</span>
          </button>

          {/* AI Generator */}
          <button
            type="button"
            onClick={onOpenAiGenerator}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm shadow-purple-500/20 transition-all hover:from-purple-700 hover:to-indigo-700 hover:shadow"
          >
            <Sparkles className="h-4 w-4" />
            <span>Generate with AI</span>
          </button>

          {/* Manual Authoring */}
          <button
            type="button"
            onClick={onOpenManualAuthor}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-bold text-gray-700 shadow-sm transition-all hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            <Plus className="h-4 w-4" />
            <span>Author Manually</span>
          </button>
        </div>
      </div>

      {/* ── 2. Active Slot Target Banner ────────────────────────────────────── */}
      {activeSlot && (
        <div className="mb-4 flex items-center justify-between rounded-2xl border border-purple-200 bg-purple-50/80 px-4 py-2.5 dark:border-purple-800 dark:bg-purple-950/40">
          <div className="flex items-center gap-2 text-xs">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-purple-600 text-xs font-black text-white">
              Q{activeSlot.question_number}
            </span>
            <span className="font-bold text-purple-900 dark:text-purple-200">
              Target Slot: Q{activeSlot.question_number} ({activeSlot.section_name})
            </span>
            <span className="rounded-md bg-purple-200/80 px-2 py-0.5 font-extrabold text-purple-800 dark:bg-purple-900 dark:text-purple-300">
              Required: {activeSlot.max_marks} Marks
            </span>
          </div>

          <button
            type="button"
            onClick={onClearActiveSlot}
            className="inline-flex items-center gap-1 text-xs font-semibold text-purple-700 hover:text-purple-900 dark:text-purple-300 dark:hover:text-purple-100"
          >
            <X className="h-3.5 w-3.5" />
            <span>Clear Target</span>
          </button>
        </div>
      )}

      {/* ── 3. Search & Multi-Tag Grouping Toolbar ──────────────────────────── */}
      <div className="mb-4 space-y-2.5">
        <div className="flex flex-wrap items-center gap-2">
          {/* Keyword Search */}
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search concepts, equations, tags..."
              value={filters.search}
              onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-xs text-gray-800 focus:border-purple-500 focus:bg-white focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
            />
          </div>

          {/* Grouping Mode Selector */}
          <div className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs dark:border-gray-700 dark:bg-gray-900">
            <SlidersHorizontal className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
            <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400">Group By:</span>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as any)}
              className="bg-transparent font-bold text-purple-700 dark:text-purple-300 focus:outline-none cursor-pointer"
            >
              <option value="group_tag">Custom Group Tag</option>
              <option value="knowledge_level">Bloom's K-Level</option>
              <option value="topic">Syllabus Topic</option>
              <option value="marks">Marks Allocation</option>
              <option value="question_type">Question Type</option>
              <option value="none">Flat List (No Groups)</option>
            </select>
          </div>

          {/* Marks Filter */}
          <select
            value={filters.marks !== null ? String(filters.marks) : ""}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                marks: e.target.value ? Number(e.target.value) : null,
              })
            }
            className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-700 focus:border-purple-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
          >
            <option value="">All Marks</option>
            <option value="2">2 Marks</option>
            <option value="4">4 Marks</option>
            <option value="5">5 Marks</option>
            <option value="8">8 Marks</option>
            <option value="10">10 Marks</option>
            <option value="15">15 Marks</option>
            <option value="16">16 Marks</option>
            <option value="20">20 Marks</option>
          </select>

          {/* Bloom's K-Level */}
          <select
            value={filters.bloom_level}
            onChange={(e) => onFilterChange({ ...filters, bloom_level: e.target.value })}
            className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-700 focus:border-purple-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
          >
            {bloomOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Unassigned Only */}
          <label className="flex items-center gap-1.5 cursor-pointer rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200">
            <input
              type="checkbox"
              checked={filters.unassigned_only}
              onChange={(e) =>
                onFilterChange({ ...filters, unassigned_only: e.target.checked })
              }
              className="rounded text-purple-600 focus:ring-purple-500"
            />
            <span>Unassigned only</span>
          </label>
        </div>
      </div>

      {/* ── 4. Questions List Grouped by Facets ──────────────────────────────── */}
      {displayedCandidates.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 py-16 text-center dark:border-gray-700">
          <HelpCircle className="h-10 w-10 text-gray-400 mb-2" />
          <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">
            No Candidate Questions Found
          </h3>
          <p className="max-w-sm text-xs text-gray-400 mt-1 mb-4">
            Try adjusting filters or generate candidate questions with AI based on syllabus topics.
          </p>
          <div className="flex gap-2">
            <button
              onClick={onOpenAiGenerator}
              className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-3.5 py-1.5 text-xs font-bold text-white shadow hover:bg-purple-700"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Generate with AI</span>
            </button>
            <button
              onClick={onOpenManualAuthor}
              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-3.5 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Author Question</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-5 overflow-y-auto pr-1">
          {groupedQuestions.map((group) => {
            const isCollapsed = !!collapsedGroups[group.key];
            const allSelectedInGroup = group.questions.every((q) =>
              selectedQuestionIds.includes(q.id)
            );

            return (
              <div key={group.key} className="space-y-3">
                {/* Group Header Badge (Accordion Style) */}
                {groupBy !== "none" && (
                  <div className="flex items-center justify-between rounded-xl bg-gray-50/90 px-3.5 py-2 border border-gray-200/80 dark:border-gray-800 dark:bg-gray-800/60">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleGroupCollapse(group.key)}
                        className="text-gray-500 hover:text-purple-600"
                      >
                        {isCollapsed ? (
                          <ChevronRight className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSelectAllInGroup(group.questions)}
                        className="text-gray-400 hover:text-purple-600"
                        title={allSelectedInGroup ? "Deselect group" : "Select all in group"}
                      >
                        {allSelectedInGroup ? (
                          <CheckSquare className="h-4 w-4 text-purple-600" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </button>

                      <span className="text-xs font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-purple-600" />
                        {group.label}
                      </span>
                    </div>

                    <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-[11px] font-extrabold text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
                      {group.count}
                    </span>
                  </div>
                )}

                {/* Question Cards inside Group */}
                {!isCollapsed && (
                  <div className="space-y-3 pl-1">
                    {group.questions.map((q) => {
                      const isAssigned = !!q.is_assigned;
                      const marksMatch = activeSlot ? q.max_marks === activeSlot.max_marks : false;
                      const canAssign = activeSlot && !isAssigned && marksMatch;
                      const isSelected = selectedQuestionIds.includes(q.id);

                      return (
                        <div
                          key={q.id}
                          draggable={!isAssigned}
                          onDragStart={(e) => {
                            e.dataTransfer.setData(
                              "application/json",
                              JSON.stringify({
                                questionId: q.id,
                                maxMarks: q.max_marks,
                                questionText: q.question_text?.substring(0, 100),
                                courseOutcome: q.course_outcome || q.co_level,
                                bloomLevel: q.bloom_level || q.knowledge_level,
                              })
                            );
                            e.dataTransfer.effectAllowed = "copyMove";
                            setDraggedQuestionId(q.id);
                          }}
                          onDragEnd={() => {
                            setDraggedQuestionId(null);
                          }}
                          className={`relative rounded-2xl border p-4 transition-all duration-150 ${
                            draggedQuestionId === q.id
                              ? "opacity-50 ring-2 ring-purple-500 scale-[0.98]"
                              : isSelected
                              ? "border-purple-500 bg-purple-50/20 ring-1 ring-purple-500/30 dark:border-purple-600 dark:bg-purple-950/20"
                              : isAssigned
                              ? "border-gray-200 bg-gray-50/70 dark:border-gray-800 dark:bg-gray-900/40"
                              : canAssign
                              ? "border-purple-300 bg-purple-50/10 shadow-sm hover:border-purple-500 hover:shadow-md dark:border-purple-800 cursor-grab"
                              : "border-gray-200/90 bg-white hover:border-gray-300 dark:border-gray-800 dark:bg-gray-850 cursor-grab"
                          }`}
                        >
                          {/* Card Header row: Checkbox, Badges, and Action Popover */}
                          <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-1.5">
                              {/* Drag Handle */}
                              {!isAssigned && (
                                <div
                                  className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-purple-600 transition-colors mr-0.5"
                                  title="Drag and drop onto a blueprint slot to assign"
                                >
                                  <GripVertical className="h-4 w-4" />
                                </div>
                              )}

                              {/* Selection Checkbox */}
                              <button
                                type="button"
                                onClick={() => handleToggleSelectQuestion(q.id)}
                                className="mr-1 text-gray-400 hover:text-purple-600 transition-colors"
                              >
                                {isSelected ? (
                                  <CheckSquare className="h-4 w-4 text-purple-600" />
                                ) : (
                                  <Square className="h-4 w-4" />
                                )}
                              </button>

                              {/* Marks Badge */}
                              <span className="rounded-lg bg-purple-100 px-2 py-0.5 text-xs font-extrabold text-purple-800 dark:bg-purple-900/50 dark:text-purple-300">
                                {q.max_marks} Marks
                              </span>

                              {/* Bloom's Level Badge */}
                              {(q.bloom_level || q.knowledge_level) && (
                                <span className="rounded-lg bg-pink-50 px-2 py-0.5 text-[11px] font-bold text-pink-700 border border-pink-200 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-800">
                                  {q.bloom_level || q.knowledge_level}
                                </span>
                              )}

                              {/* CO Badge */}
                              {(q.course_outcome || q.co_level) && (
                                <span className="rounded-lg bg-indigo-50 px-2 py-0.5 text-[11px] font-bold text-indigo-700 border border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800">
                                  {q.course_outcome || q.co_level}
                                </span>
                              )}

                              {/* Group Tag Badge / Inline Tag Editor */}
                              {q.group_tag ? (
                                <span
                                  onClick={() => {
                                    setEditingTagQuestionId(q.id);
                                    setSingleTagInput(q.group_tag || "");
                                  }}
                                  title="Click to edit group tag"
                                  className="inline-flex items-center gap-1 cursor-pointer rounded-lg bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800"
                                >
                                  <Tag className="h-3 w-3" />
                                  <span>{q.group_tag}</span>
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingTagQuestionId(q.id);
                                    setSingleTagInput("");
                                  }}
                                  className="inline-flex items-center gap-0.5 rounded-lg border border-dashed border-gray-300 px-1.5 py-0.5 text-[10px] font-semibold text-gray-500 hover:border-purple-400 hover:text-purple-600 dark:border-gray-700"
                                >
                                  <Plus className="h-2.5 w-2.5" /> Tag
                                </button>
                              )}

                              {/* Question Type */}
                              {q.question_type && (
                                <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                                  {q.question_type.replace(/_/g, " ").toLowerCase()}
                                </span>
                              )}

                              {/* Assigned Lock Status */}
                              {isAssigned && (
                                <span
                                  title="Assigned to blueprint slot. Locked from editing and deletion."
                                  className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800"
                                >
                                  <Lock className="h-3 w-3" />
                                  <span>Assigned</span>
                                </span>
                              )}
                            </div>

                            {/* Slot Assignment Actions */}
                            {!isAssigned && (
                              <div className="relative">
                                <div className="flex items-center gap-1.5">
                                  {/* Quick 1-Click Assign if Active Slot Matches Marks */}
                                  {activeSlot && marksMatch && (
                                    <button
                                      type="button"
                                      onClick={() => activeSlot.id && onAssignToSlot(activeSlot.id, q.id)}
                                      disabled={actionLoadingId === `slot-assign-${activeSlot.id}`}
                                      className="inline-flex items-center gap-1 rounded-xl bg-purple-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-purple-700 transition-all active:scale-95"
                                    >
                                      <Check className="h-3.5 w-3.5" />
                                      <span>Assign to Q{activeSlot.question_number}</span>
                                    </button>
                                  )}

                                  {/* Assign to Any Slot Dropdown Trigger */}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setOpenSlotMenuId(openSlotMenuId === q.id ? null : q.id)
                                    }
                                    disabled={actionLoadingId !== null}
                                    className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-bold transition-all ${
                                      activeSlot && marksMatch
                                        ? "border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                                        : "bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-800"
                                    }`}
                                  >
                                    <Layers className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                                    <span>
                                      {activeSlot && marksMatch ? "Other Slots" : "Assign to Slot"}
                                    </span>
                                    <ChevronDown className="h-3 w-3" />
                                  </button>
                                </div>

                                {/* Slot Selection Dropdown Popover */}
                                {openSlotMenuId === q.id && (
                                  <>
                                    <div
                                      className="fixed inset-0 z-20"
                                      onClick={() => setOpenSlotMenuId(null)}
                                    />
                                    <div className="absolute right-0 top-full z-30 mt-1.5 w-72 rounded-2xl border border-gray-200 bg-white p-2 shadow-xl dark:border-gray-700 dark:bg-gray-800 animate-in fade-in zoom-in-95 duration-100">
                                      <div className="mb-2 border-b border-gray-100 px-2 py-1 dark:border-gray-700">
                                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">
                                          Select Blueprint Slot ({q.max_marks} Marks)
                                        </span>
                                      </div>

                                      {allSlots.length === 0 ? (
                                        <div className="p-3 text-center text-xs text-gray-400">
                                          No blueprint slots found in template.
                                        </div>
                                      ) : (
                                        <div className="max-h-56 overflow-y-auto space-y-1">
                                          {allSlots.map((slot) => {
                                            const slotMatches = slot.max_marks === q.max_marks;
                                            const isCurrentlyAssigned = !!slot.actual_question_id;

                                            if (!slotMatches) {
                                              return (
                                                <div
                                                  key={slot.id}
                                                  className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-gray-300 dark:text-gray-600 cursor-not-allowed"
                                                  title={`Slot requires ${slot.max_marks} marks.`}
                                                >
                                                  <div className="flex items-center gap-1.5">
                                                    <span className="font-bold">Q{slot.question_number}</span>
                                                    <span className="text-[10px]">({slot.section_name})</span>
                                                  </div>
                                                  <span className="text-[10px] italic">
                                                    Needs {slot.max_marks}M
                                                  </span>
                                                </div>
                                              );
                                            }

                                            return (
                                              <button
                                                key={slot.id}
                                                type="button"
                                                onClick={() => {
                                                  setOpenSlotMenuId(null);
                                                  slot.id && onAssignToSlot(slot.id, q.id);
                                                }}
                                                className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-purple-50 hover:text-purple-700 dark:text-gray-200 dark:hover:bg-purple-950/40 dark:hover:text-purple-300 transition-colors"
                                              >
                                                <div className="flex items-center gap-1.5">
                                                  <span className="flex h-5 w-5 items-center justify-center rounded bg-purple-100 text-[11px] font-bold text-purple-800 dark:bg-purple-900/60 dark:text-purple-300">
                                                    Q{slot.question_number}
                                                  </span>
                                                  <span>{slot.section_name || "Section"}</span>
                                                  <span className="rounded bg-gray-100 px-1 text-[10px] text-gray-500 dark:bg-gray-700 dark:text-gray-300">
                                                    {slot.max_marks}M
                                                  </span>
                                                </div>

                                                <span
                                                  className={`text-[10px] font-bold ${
                                                    isCurrentlyAssigned
                                                      ? "text-amber-600 dark:text-amber-400"
                                                      : "text-green-600 dark:text-green-400"
                                                  }`}
                                                >
                                                  {isCurrentlyAssigned ? "Replace" : "Empty"}
                                                </span>
                                              </button>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  </>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Inline Single Tag Quick Editor Popover */}
                          {editingTagQuestionId === q.id && (
                            <div className="mb-3 flex items-center gap-2 rounded-xl border border-purple-200 bg-purple-50/60 p-2 text-xs dark:border-purple-800 dark:bg-purple-950/30">
                              <Tag className="h-3.5 w-3.5 text-purple-600" />
                              <input
                                type="text"
                                placeholder="Enter group tag (e.g. Numerical, Derivation)..."
                                value={singleTagInput}
                                onChange={(e) => setSingleTagInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleApplySingleTag(q.id)}
                                className="flex-1 rounded-lg border border-purple-300 bg-white px-2 py-1 text-xs text-gray-800 focus:outline-none dark:bg-gray-900 dark:text-gray-200"
                              />
                              <button
                                type="button"
                                onClick={() => handleApplySingleTag(q.id)}
                                className="rounded-lg bg-purple-600 px-2.5 py-1 font-bold text-white hover:bg-purple-700"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingTagQuestionId(null)}
                                className="text-gray-400 hover:text-gray-600"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}

                          {/* Main Question Text with LaTeX & Math Formatting */}
                          <div className="text-xs font-medium text-gray-800 dark:text-gray-200">
                            <FormattedMathText
                              text={q.question_text}
                              className="leading-relaxed whitespace-pre-wrap block"
                            />
                          </div>

                          {/* Vector Diagram Spec or MinIO Image Preview */}
                          {(q.diagram_url || q.diagram_spec) && (
                            <div className="mt-2.5">
                              <QuestionDiagramPreview
                                diagramUrl={q.diagram_url}
                                diagramSpec={q.diagram_spec}
                                thumbnail={true}
                                onOpenStudio={() => handleOpenDiagramStudio(q)}
                                onZoom={(url) => setZoomImageUrl(url)}
                              />
                            </div>
                          )}

                          {/* Sub Questions List with Math Formatting */}
                          {q.sub_questions && q.sub_questions.length > 0 && (
                            <div className="mt-2.5 space-y-1.5 rounded-xl bg-gray-50 p-2.5 dark:bg-gray-900/60 border border-gray-100 dark:border-gray-800">
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">
                                Sub-Questions Breakdown:
                              </span>
                              {q.sub_questions.map((sub, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-start justify-between gap-2 text-xs text-gray-700 dark:text-gray-300"
                                >
                                  <span className="leading-tight">
                                    <strong>({sub.sub_label || String.fromCharCode(97 + idx)})</strong>{" "}
                                    <FormattedMathText text={sub.text || sub.sub_text} />
                                  </span>
                                  <span className="rounded bg-white px-1.5 py-0.5 font-bold text-purple-700 shadow-sm dark:bg-gray-800 dark:text-purple-300 flex-shrink-0 text-[11px]">
                                    {sub.marks} Marks
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Choice / Either-Or Preview with Math Formatting */}
                          {(q.option_a || q.either_or_content?.option_a) &&
                            (q.option_b || q.either_or_content?.option_b) && (
                              <div className="mt-2.5 space-y-2 rounded-xl bg-gray-50 p-2.5 dark:bg-gray-900/60 border border-gray-100 dark:border-gray-800 text-xs">
                                <div className="flex items-start justify-between gap-2">
                                  <span>
                                    <strong>Option A:</strong>{" "}
                                    <FormattedMathText
                                      text={q.option_a?.text || q.either_or_content?.option_a.text}
                                    />
                                  </span>
                                  <span className="font-bold text-purple-700 dark:text-purple-300">
                                    {q.option_a?.marks || q.either_or_content?.option_a.marks}M
                                  </span>
                                </div>
                                <div className="text-center font-bold text-purple-600 dark:text-purple-400 text-[11px]">
                                  — OR —
                                </div>
                                <div className="flex items-start justify-between gap-2">
                                  <span>
                                    <strong>Option B:</strong>{" "}
                                    <FormattedMathText
                                      text={q.option_b?.text || q.either_or_content?.option_b.text}
                                    />
                                  </span>
                                  <span className="font-bold text-purple-700 dark:text-purple-300">
                                    {q.option_b?.marks || q.either_or_content?.option_b.marks}M
                                  </span>
                                </div>
                              </div>
                            )}

                          {/* Card Footer: Metadata, Diagram Add, Edit & Delete */}
                          <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-2.5 dark:border-gray-800">
                            <div className="flex items-center gap-2 text-[11px] text-gray-400">
                              <span>ID #{q.id}</span>
                              {q.topics?.length ? <span>• {q.topics.join(", ")}</span> : null}
                              {q.origin && <span>• {q.origin}</span>}
                            </div>

                            <div className="flex items-center gap-1.5">
                              {/* Attach or edit vector diagram */}
                              {!q.diagram_url && !q.diagram_spec && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenDiagramStudio(q)}
                                  className="inline-flex items-center gap-1 rounded-lg p-1.5 text-xs text-gray-500 hover:bg-purple-50 hover:text-purple-600 dark:hover:bg-purple-950/40"
                                  title="Create or attach vector diagram"
                                >
                                  <Compass className="h-3.5 w-3.5" />
                                </button>
                              )}

                              {/* Edit Question */}
                              <button
                                type="button"
                                onClick={() => onEditQuestion(q)}
                                disabled={isAssigned || actionLoadingId === `edit-question-${q.id}`}
                                title={
                                  isAssigned
                                    ? "Cannot edit an assigned question. Unassign from slot first."
                                    : "Edit Question"
                                }
                                className={`inline-flex items-center gap-1 rounded-lg p-1.5 text-xs transition-colors ${
                                  isAssigned
                                    ? "text-gray-300 cursor-not-allowed dark:text-gray-600"
                                    : "text-gray-600 hover:bg-gray-100 hover:text-purple-600 dark:text-gray-300 dark:hover:bg-gray-700"
                                }`}
                              >
                                <Edit className="h-3.5 w-3.5" />
                                <span className="sr-only">Edit</span>
                              </button>

                              {/* Delete button (No confirm modal; 5-second Undo for unassigned questions) */}
                              <button
                                type="button"
                                onClick={() => handleDeleteClick(q)}
                                disabled={isAssigned || actionLoadingId === `delete-question-${q.id}`}
                                title={
                                  isAssigned
                                    ? "Cannot delete an assigned question. Unassign from slot first."
                                    : "Delete Question (Undo available for 5s)"
                                }
                                className={`inline-flex items-center gap-1 rounded-lg p-1.5 text-xs transition-colors ${
                                  isAssigned
                                    ? "text-gray-300 cursor-not-allowed dark:text-gray-600"
                                    : "text-red-500 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/30"
                                }`}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span className="sr-only">Delete</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── 5. Floating Action Dock for Multi-Selection ──────────────────────── */}
      {selectedQuestionIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-2xl border border-gray-700 bg-gray-900/95 px-5 py-3 text-white shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-5">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-purple-600 text-xs font-black text-white">
              {selectedQuestionIds.length}
            </span>
            <span className="text-xs font-bold text-gray-200">
              Questions Selected
            </span>
          </div>

          <div className="flex items-center gap-2 border-l border-gray-700 pl-3">
            <button
              type="button"
              onClick={() => setIsBulkTagModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-3.5 py-1.5 text-xs font-bold text-white shadow hover:bg-purple-700 transition-all"
            >
              <Tag className="h-3.5 w-3.5" />
              <span>Categorize / Assign Tag</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedQuestionIds([])}
              className="rounded-xl px-2.5 py-1.5 text-xs font-semibold text-gray-400 hover:bg-gray-800 hover:text-white"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* ── 6. Bulk Tag Modal ────────────────────────────────────────────────── */}
      {isBulkTagModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-gray-900 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Tag className="h-4 w-4 text-purple-600" />
                Categorize {selectedQuestionIds.length} Questions
              </h3>
              <button
                onClick={() => setIsBulkTagModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-gray-500">
              Apply a category tag to classify these questions in the pool (e.g. Numerical, Derivation, Case Study).
            </p>

            {/* Existing Tag Suggestions */}
            {availableGroupTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {availableGroupTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setBulkTagInput(tag)}
                    className="rounded-lg bg-gray-100 px-2 py-1 text-[11px] font-semibold text-gray-700 hover:bg-purple-100 hover:text-purple-700 dark:bg-gray-800 dark:text-gray-300"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}

            <input
              type="text"
              placeholder="e.g. Numerical Analysis"
              value={bulkTagInput}
              onChange={(e) => setBulkTagInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleApplyBulkTag()}
              className="w-full rounded-xl border border-gray-300 p-2.5 text-xs text-gray-800 focus:border-purple-500 focus:outline-none dark:border-gray-700 dark:bg-gray-950 dark:text-gray-200"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsBulkTagModalOpen(false)}
                className="rounded-xl border border-gray-200 px-3.5 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyBulkTag}
                disabled={bulkTagLoading || !bulkTagInput.trim()}
                className="rounded-xl bg-purple-600 px-4 py-1.5 text-xs font-bold text-white shadow hover:bg-purple-700 disabled:opacity-50"
              >
                {bulkTagLoading ? "Applying..." : "Apply Tag"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 7. 5-Second Undo Floating Notification ───────────────────────────── */}
      {pendingDelete && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-gray-700 bg-gray-900/95 backdrop-blur-md px-4 py-3 text-white shadow-2xl dark:border-gray-600 dark:bg-gray-800/95">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-500/20 text-red-400 flex-shrink-0">
            <Trash2 className="h-4 w-4" />
          </div>
          <div className="flex flex-col text-xs pr-1">
            <span className="font-bold text-white">
              Question #{pendingDelete.id} deleted
            </span>
            <span className="text-gray-400 line-clamp-1 max-w-[200px] text-[11px]">
              {pendingDelete.question.question_text}
            </span>
          </div>

          <div className="flex items-center gap-2 pl-2 border-l border-gray-700 dark:border-gray-600">
            <button
              type="button"
              onClick={handleUndoDelete}
              className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-purple-700 active:scale-95 transition-all"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Undo</span>
              <span className="rounded-md bg-purple-800/80 px-1.5 py-0.5 text-[10px] font-mono font-black">
                {pendingDelete.secondsLeft}s
              </span>
            </button>

            <button
              type="button"
              onClick={() => commitDeletion(pendingDelete.id)}
              title="Delete immediately without waiting"
              className="rounded-lg p-1 text-gray-400 hover:bg-gray-800 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ── 8. Diagram Studio Modal Integration ──────────────────────────────── */}
      <DiagramStudioModal
        isOpen={isDiagramStudioOpen}
        onClose={() => {
          setIsDiagramStudioOpen(false);
          setActiveQuestionForDiagram(null);
        }}
        initialSpec={activeQuestionForDiagram?.diagram_spec || null}
        courseCode={courseCode}
        courseId={courseId}
        questionId={activeQuestionForDiagram?.id || null}
        onSaveSpec={handleSaveDiagramSpec}
      />

      {/* ── 9. Diagram Zoom Lightbox Modal ───────────────────────────────────── */}
      {zoomImageUrl && (
        <div
          onClick={() => setZoomImageUrl(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
        >
          <div className="relative max-h-[90vh] max-w-[90vw] overflow-hidden rounded-3xl bg-white p-2 shadow-2xl dark:bg-gray-800">
            <button
              onClick={() => setZoomImageUrl(null)}
              className="absolute right-3 top-3 rounded-full bg-black/60 p-1.5 text-white hover:bg-black"
            >
              <X className="h-4 w-4" />
            </button>
            <img
              src={zoomImageUrl}
              alt="Diagram enlarged preview"
              className="max-h-[80vh] w-auto rounded-2xl object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidatePoolPane;
