import React, { useState, useEffect, useMemo } from "react";
import {
  Check,
  X,
  Search,
  Layers,
  Filter,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Target,
  Zap,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/router";
import Models from "@/imports/models.import";
import { Success, Failure } from "@/utils/function.utils";

interface CreateQuestionSetModalProps {
  open: boolean;
  onClose: () => void;
  courseId?: string | number;
  courseTitle?: string;
  availableQuestions: any[];
  preSelectedQuestionIds?: string[];
  units?: any[];
  onCreated?: (newSet: any) => void;
}

export const CreateQuestionSetModal: React.FC<CreateQuestionSetModalProps> = ({
  open,
  onClose,
  courseId,
  courseTitle = "Course",
  availableQuestions = [],
  preSelectedQuestionIds = [],
  units = [],
  onCreated,
}) => {
  const router = useRouter();
  const [setName, setSetName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedUnit, setSelectedUnit] = useState<string>("all");
  const [selectedKLevel, setSelectedKLevel] = useState<string>("all");
  const [selectedCO, setSelectedCO] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "approved">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [expandedPreviewIds, setExpandedPreviewIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 5;
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize only when modal opens
  useEffect(() => {
    if (open) {
      setSetName(`Set ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })} - Practice`);
      setDescription("");
      setSelectedIds(preSelectedQuestionIds && preSelectedQuestionIds.length > 0 ? [...preSelectedQuestionIds] : []);
      setSearchTerm("");
      setSelectedUnit("all");
      setSelectedKLevel("all");
      setSelectedCO("all");
      setStatusFilter("all");
      setCurrentPage(1);
      setExpandedPreviewIds([]);
    }
  }, [open]);

  // Handlers that update filters and reset page to 1
  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setCurrentPage(1);
  };

  const handleUnitChange = (val: string) => {
    setSelectedUnit(val);
    setCurrentPage(1);
  };

  const handleKLevelChange = (val: string) => {
    setSelectedKLevel(val);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (val: "all" | "approved") => {
    setStatusFilter(val);
    setCurrentPage(1);
  };

  // Filter pool inside modal
  const filteredQuestions = useMemo(() => {
    return availableQuestions.filter((q) => {
      // Status
      if (statusFilter === "approved" && (q.status || "").toLowerCase() !== "approved") return false;

      // Unit
      if (selectedUnit !== "all") {
        const uNum = String(q.unit_number || q.unit || "");
        if (!uNum.toLowerCase().includes(selectedUnit.toLowerCase())) return false;
      }

      // K-Level
      if (selectedKLevel !== "all") {
        const k = (q.level || q.knowledge_level || "").toUpperCase();
        if (k !== selectedKLevel.toUpperCase()) return false;
      }

      // Course Outcome (CO)
      if (selectedCO !== "all") {
        const c = (q.co || q.course_outcome || "").toUpperCase();
        if (!c.includes(selectedCO.toUpperCase())) return false;
      }

      // Search
      if (searchTerm) {
        const text = (q.text || q.question || "").toLowerCase();
        const code = (q.code || q.question_code || "").toLowerCase();
        const term = searchTerm.toLowerCase();
        if (!text.includes(term) && !code.includes(term)) return false;
      }

      return true;
    });
  }, [availableQuestions, statusFilter, selectedUnit, selectedKLevel, selectedCO, searchTerm]);

  // Total pages and safe active page
  const totalPages = Math.max(1, Math.ceil(filteredQuestions.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedQuestions = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredQuestions.slice(start, start + pageSize);
  }, [filteredQuestions, safeCurrentPage, pageSize]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const togglePreview = (id: string) => {
    setExpandedPreviewIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectAllCurrentPage = () => {
    const pageIds = paginatedQuestions.map((q) => q.id);
    const allSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const totalMarks = useMemo(() => {
    return availableQuestions
      .filter((q) => selectedIds.includes(q.id))
      .reduce((sum, q) => sum + (Number(q.marks) || 2), 0);
  }, [availableQuestions, selectedIds]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setName.trim()) {
      Failure("Please enter a name for the Question Set.");
      return;
    }
    if (selectedIds.length === 0) {
      Failure("Please select at least one question for the set.");
      return;
    }

    setIsSubmitting(true);
    try {
      const userStr = typeof window !== "undefined" ? localStorage.getItem("user") : null;
      const user = userStr ? JSON.parse(userStr) : null;

      const foundSyllabusId = availableQuestions.find(
        (q) => selectedIds.includes(q.id) && (q.syllabus_id || q.syllabusId)
      )?.syllabus_id || availableQuestions.find((q) => q.syllabus_id || q.syllabusId)?.syllabus_id;

      const payload = {
        name: setName.trim(),
        description: description.trim() || undefined,
        course_id: courseId ? String(courseId) : undefined,
        syllabus_id: foundSyllabusId ? Number(foundSyllabusId) : undefined,
        unit_number: selectedUnit !== "all" ? Number(selectedUnit.replace(/[^0-9]/g, "")) || undefined : undefined,
        question_ids: selectedIds,
        user_id: user?.id || 1,
        user_role: "faculty",
      };

      const res: any = await Models.mcq.create_set(payload);
      Success("Question Set created successfully!");
      if (onCreated) onCreated(res);
      onClose();
    } catch (err: any) {
      console.error("Create Question Set error:", err);
      Failure(typeof err === "string" ? err : "Failed to create Question Set.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col rounded-3xl bg-white shadow-2xl border border-slate-100 dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4.5 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-sm">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                Create New Question Set
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {courseTitle} • Select questions with dynamic filters and pagination
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Redirect to MCQ Generation Page */}
            <button
              type="button"
              onClick={() => {
                onClose();
                router.push(courseId ? `/neurobe/mcq-generation?course_id=${courseId}` : "/neurobe/mcq-generation");
              }}
              className="flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition shadow-xs dark:bg-indigo-950/40 dark:border-indigo-800 dark:text-indigo-300 cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
              <span>Generate MCQs with AI</span>
            </button>

            {/* Live Selected Counter Badge */}
            <div className="flex items-center gap-2 rounded-xl bg-indigo-50 border border-indigo-200/80 px-3 py-1.5 text-xs font-black text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-800 dark:text-indigo-300">
              <span className="flex h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
              <span>{selectedIds.length} Questions Selected</span>
              <span className="text-indigo-400">•</span>
              <span>{totalMarks} Marks</span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Row 1: Name and Description */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1.5">
                Question Set Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={setName}
                onChange={(e) => setSetName(e.target.value)}
                placeholder="e.g. CIA-1 Question Paper, Unit 1 Practice"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1.5">
                Description / Scope (Optional)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. 15 Questions for Semester Midterm Test"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          {/* Row 2: Comprehensive Filters */}
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-850/40">
            <div className="flex items-center justify-between mb-3">
              <span className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                <Filter className="h-3.5 w-3.5 text-indigo-600" />
                Filter Available Course Questions ({filteredQuestions.length} Matches)
              </span>

              {/* Select All on Current Page button */}
              <button
                type="button"
                onClick={selectAllCurrentPage}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                {paginatedQuestions.length > 0 && paginatedQuestions.every((q) => selectedIds.includes(q.id))
                  ? "Deselect Current Page"
                  : "Select Current Page"}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5">
              {/* Search */}
              <div className="relative sm:col-span-2">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Search question statement or code..."
                  className="w-full rounded-xl border border-slate-200 bg-white pl-8 pr-3 py-2 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              {/* Unit Filter */}
              <div>
                <select
                  value={selectedUnit}
                  onChange={(e) => handleUnitChange(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="all">All Units</option>
                  {(units.length > 0 ? units : [1, 2, 3, 4, 5]).map((u: any, idx: number) => {
                    const val = typeof u === "object" ? String(u.unitId || idx + 1) : String(u);
                    const label = typeof u === "object" ? u.label || `Unit ${val}` : `Unit ${val}`;
                    return (
                      <option key={val} value={val}>
                        {label}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Bloom's Level Filter */}
              <div>
                <select
                  value={selectedKLevel}
                  onChange={(e) => handleKLevelChange(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="all">All Bloom's (K1-K6)</option>
                  <option value="K1">K1 - Remember</option>
                  <option value="K2">K2 - Understand</option>
                  <option value="K3">K3 - Apply</option>
                  <option value="K4">K4 - Analyze</option>
                  <option value="K5">K5 - Evaluate</option>
                  <option value="K6">K6 - Create</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => handleStatusFilterChange(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="all">All Statuses</option>
                  <option value="approved">Approved Only</option>
                </select>
              </div>
            </div>
          </div>

          {/* Row 3: Questions List with Select Checkboxes */}
          <div className="space-y-3">
            {paginatedQuestions.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 py-10 text-center dark:border-slate-800 dark:bg-slate-800/20">
                <Search className="h-7 w-7 text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  No questions match your current filters.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedUnit("all");
                    setSelectedKLevel("all");
                    setSelectedCO("all");
                    setStatusFilter("all");
                    setCurrentPage(1);
                  }}
                  className="mt-2 text-xs font-bold text-indigo-600 hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              paginatedQuestions.map((q, idx) => {
                const isSelected = selectedIds.includes(q.id);
                const isExpanded = expandedPreviewIds.includes(q.id);
                const globalIdx = (safeCurrentPage - 1) * pageSize + idx + 1;

                return (
                  <div
                    key={q.id}
                    className={`rounded-2xl border transition-all duration-150 bg-white p-4 dark:bg-slate-850 ${
                      isSelected
                        ? "border-indigo-500 ring-2 ring-indigo-500/10 shadow-xs dark:border-indigo-500"
                        : "border-slate-200 hover:border-slate-300 dark:border-slate-800"
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      {/* Checkbox */}
                      <button
                        type="button"
                        onClick={() => toggleSelect(q.id)}
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border transition-colors cursor-pointer ${
                          isSelected
                            ? "border-indigo-600 bg-indigo-600 text-white"
                            : "border-slate-300 bg-white hover:border-indigo-400 dark:border-slate-700 dark:bg-slate-800"
                        }`}
                      >
                        {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                      </button>

                      <div className="flex-1 min-w-0">
                        {/* Header Badges */}
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-slate-900 text-[10px] font-black text-white dark:bg-slate-100 dark:text-slate-900">
                            #{globalIdx}
                          </span>
                          <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-300 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                            {q.code || q.question_code}
                          </span>
                          {q.level && (
                            <span className="inline-flex items-center gap-1 rounded bg-purple-50 px-2 py-0.5 text-[11px] font-bold text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                              <Zap className="h-2.5 w-2.5" />
                              {q.level}
                            </span>
                          )}
                          {q.co && (
                            <span className="inline-flex items-center gap-1 rounded bg-indigo-50 px-2 py-0.5 text-[11px] font-bold text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
                              <Target className="h-2.5 w-2.5" />
                              {q.co}
                            </span>
                          )}
                          {q.unit && (
                            <span className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                              <BookOpen className="h-2.5 w-2.5" />
                              {q.unit}
                            </span>
                          )}
                          <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            {q.marks || 2} M
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              (q.status || "").toLowerCase() === "approved"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}
                          >
                            {(q.status || "").toLowerCase() === "approved" ? "Approved" : "Draft"}
                          </span>
                        </div>

                        {/* Question Text */}
                        <p
                          onClick={() => toggleSelect(q.id)}
                          className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white cursor-pointer hover:text-indigo-600 transition-colors leading-relaxed"
                        >
                          {q.question || q.text}
                        </p>

                        {/* Collapsible preview toggle */}
                        <div className="mt-2 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => togglePreview(q.id)}
                            className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 cursor-pointer"
                          >
                            <span>{isExpanded ? "Hide Preview" : "Preview Options & Rationale"}</span>
                            <ChevronDown
                              className={`h-3 w-3 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                            />
                          </button>

                          <button
                            type="button"
                            onClick={() => toggleSelect(q.id)}
                            className={`text-xs font-bold cursor-pointer ${isSelected ? "text-rose-600 hover:underline" : "text-indigo-600 hover:underline"}`}
                          >
                            {isSelected ? "Remove from Set" : "+ Select"}
                          </button>
                        </div>

                        {/* Expanded Preview Details */}
                        {isExpanded && (
                          <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 text-xs dark:border-slate-800 dark:bg-slate-900/60 space-y-2.5">
                            {/* Options */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {(q.options || []).map((opt: any, oIdx: number) => {
                                const isCorrect = opt.isCorrect === true || opt.is_correct === true;
                                const key = opt.key || (oIdx === 0 ? "A" : oIdx === 1 ? "B" : oIdx === 2 ? "C" : "D");
                                return (
                                  <div
                                    key={oIdx}
                                    className={`flex items-center gap-2 rounded-lg p-2 text-xs ${
                                      isCorrect
                                        ? "border border-emerald-400 bg-emerald-50 font-bold text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
                                        : "border border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300"
                                    }`}
                                  >
                                    <span
                                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-black ${
                                        isCorrect ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-700"
                                      }`}
                                    >
                                      {key}
                                    </span>
                                    <span className="flex-1 leading-snug">{opt.text || opt.option}</span>
                                    {isCorrect && <Check className="h-3 w-3 text-emerald-600 shrink-0" />}
                                  </div>
                                );
                              })}
                            </div>

                            {/* Rationale */}
                            {q.explanation && (
                              <div className="flex items-start gap-2 rounded-lg bg-indigo-50/50 p-2 text-[11px] text-indigo-950 dark:bg-indigo-950/20 dark:text-indigo-200">
                                <Sparkles className="h-3.5 w-3.5 text-indigo-600 shrink-0 mt-0.5" />
                                <p>
                                  <strong>Rationale: </strong>
                                  {q.explanation}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Row 4: Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 dark:border-slate-800">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Showing {(safeCurrentPage - 1) * pageSize + 1}–
                {Math.min(safeCurrentPage * pageSize, filteredQuestions.length)} of {filteredQuestions.length} questions
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={safeCurrentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                {Array.from({ length: totalPages }).map((_, i) => {
                  const pNum = i + 1;
                  if (
                    pNum === 1 ||
                    pNum === totalPages ||
                    (pNum >= safeCurrentPage - 1 && pNum <= safeCurrentPage + 1)
                  ) {
                    return (
                      <button
                        key={pNum}
                        type="button"
                        onClick={() => setCurrentPage(pNum)}
                        className={`h-8 min-w-[32px] px-2 rounded-lg text-xs font-bold transition ${
                          safeCurrentPage === pNum
                            ? "bg-indigo-600 text-white shadow-xs"
                            : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        }`}
                      >
                        {pNum}
                      </button>
                    );
                  }
                  if (pNum === safeCurrentPage - 2 || pNum === safeCurrentPage + 2) {
                    return (
                      <span key={pNum} className="text-xs text-slate-400 px-1">
                        ...
                      </span>
                    );
                  }
                  return null;
                })}

                <button
                  type="button"
                  disabled={safeCurrentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
            {selectedIds.length > 0 ? (
              <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                ✓ Ready to create set with {selectedIds.length} questions ({totalMarks} marks)
              </span>
            ) : (
              <span>Select at least 1 question to enable creation</span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={isSubmitting || selectedIds.length === 0 || !setName.trim()}
              onClick={handleCreate}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 transition active:scale-98 cursor-pointer"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{isSubmitting ? "Creating Set..." : `Create Question Set (${selectedIds.length})`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateQuestionSetModal;
