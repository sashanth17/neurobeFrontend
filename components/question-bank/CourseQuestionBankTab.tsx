import React, { useState, useEffect, useMemo } from "react";
import {
  Layers,
  Plus,
  BookOpen,
  Calendar,
  Search,
  Filter,
  CheckCircle2,
  Trash2,
  ChevronDown,
  Sparkles,
  FileCheck2,
  Check,
  Edit3,
  Eye,
  Archive,
  Zap,
  Target,
} from "lucide-react";
import Models from "@/imports/models.import";
import { Success, Failure } from "@/utils/function.utils";
import { useRouter } from "next/router";
import QuestionSetsList, { QuestionSetItem } from "./QuestionSetsList";
import QuestionSetDetailView from "./QuestionSetDetailView";
import CreateQuestionSetModal from "./CreateQuestionSetModal";
import EditQuestionSetModal from "./EditQuestionSetModal";
import AddQuestionsToSetModal from "./AddQuestionsToSetModal";
import { EditQuestionModal } from "./EditQuestionModal";
import ViewQuestionModal from "./ViewQuestionModal";

interface CourseQuestionBankTabProps {
  courseKey: string;
  courseTitle: string;
  courseQuestions: any[];
  courseUnits: any[];
  onRefreshQuestions?: () => void;
}

export const CourseQuestionBankTab: React.FC<CourseQuestionBankTabProps> = ({
  courseKey,
  courseTitle = "Course",
  courseQuestions = [],
  courseUnits = [],
  onRefreshQuestions,
}) => {
  const router = useRouter();
  const [activeSubView, setActiveSubView] = useState<"sets" | "detail" | "all-questions">("sets");
  const [questionSets, setQuestionSets] = useState<QuestionSetItem[]>([]);
  const [loadingSets, setLoadingSets] = useState(false);
  const [selectedSet, setSelectedSet] = useState<QuestionSetItem | null>(null);
  const [isCreateSetModalOpen, setIsCreateSetModalOpen] = useState(false);
  const [editingSet, setEditingSet] = useState<QuestionSetItem | null>(null);
  const [isEditSetModalOpen, setIsEditSetModalOpen] = useState(false);
  const [isAddQuestionsModalOpen, setIsAddQuestionsModalOpen] = useState(false);

  // Modals state
  const [editingQuestion, setEditingQuestion] = useState<any | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [viewQuestion, setViewQuestion] = useState<any | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // All questions view filter & search
  const [searchAll, setSearchAll] = useState("");
  const [statusFilterAll, setStatusFilterAll] = useState<"all" | "approved" | "draft" | "archived">("all");
  const [expandedAllIds, setExpandedAllIds] = useState<string[]>([]);

  const fetchSets = async () => {
    if (!courseKey) return;
    setLoadingSets(true);
    try {
      const res: any = await Models.mcq.list_sets({ course_id: courseKey }).catch(() => null);
      let list: any[] = [];
      if (res) {
        if (Array.isArray(res)) list = res;
        else if (res.items && Array.isArray(res.items)) list = res.items;
        else if (res.sets && Array.isArray(res.sets)) list = res.sets;
        else if (res.data && Array.isArray(res.data)) list = res.data;
      }
      setQuestionSets(list);
    } catch (err) {
      console.error("Failed to fetch question sets:", err);
    } finally {
      setLoadingSets(false);
    }
  };

  useEffect(() => {
    fetchSets();
  }, [courseKey]);

  const handleOpenSet = (set: QuestionSetItem) => {
    setSelectedSet(set);
    setActiveSubView("detail");
  };

  const handleBackToSets = () => {
    setSelectedSet(null);
    setActiveSubView("sets");
  };

  const handleDeleteSet = async (setId: string) => {
    try {
      await Models.mcq.delete_set(setId);
      Success("Question Set deleted successfully.");
      setQuestionSets((prev) => prev.filter((s) => s.id !== setId));
      if (selectedSet?.id === setId) {
        handleBackToSets();
      }
    } catch {
      Failure("Failed to delete Question Set.");
    }
  };

  const handleEditSetName = async (setId: string, newName: string) => {
    try {
      await Models.mcq.update_set(setId, { name: newName });
      Success("Question Set name updated successfully.");
      setQuestionSets((prev) =>
        prev.map((s) => (s.id === setId ? { ...s, name: newName, title: newName } : s))
      );
      if (selectedSet?.id === setId) {
        setSelectedSet((prev) => (prev ? { ...prev, name: newName, title: newName } : null));
      }
    } catch (err: any) {
      Failure(err?.message || "Failed to update Question Set name.");
      throw err;
    }
  };

  const handleAddQuestionsToSet = async (setId: string, questionIds: string[]) => {
    try {
      await Models.mcq.add_questions_to_set(setId, questionIds);
      Success(`${questionIds.length} ${questionIds.length === 1 ? "question" : "questions"} added to set.`);
      const currentQIds = Array.isArray(selectedSet?.question_ids)
        ? selectedSet.question_ids
        : Array.isArray(selectedSet?.questions)
        ? selectedSet.questions.map((q: any) => q.id || q)
        : [];
      const updatedQIds = Array.from(new Set([...currentQIds, ...questionIds]));
      const updatedSet = selectedSet ? { ...selectedSet, question_ids: updatedQIds } : null;
      if (updatedSet) {
        setSelectedSet(updatedSet);
        setQuestionSets((prev) => prev.map((s) => (s.id === setId ? updatedSet : s)));
      }
      fetchSets();
    } catch (err: any) {
      Failure(err?.message || "Failed to add questions to set.");
      throw err;
    }
  };

  const handleRemoveQuestionFromSet = async (questionId: string) => {
    if (!selectedSet) return;
    try {
      await Models.mcq.remove_question_from_set(selectedSet.id, questionId);
      Success("Question removed from set.");
      // Update local state
      const updatedQIds = (selectedSet.question_ids || []).filter((id) => id !== questionId);
      const updatedSet = { ...selectedSet, question_ids: updatedQIds };
      setSelectedSet(updatedSet);
      setQuestionSets((prev) => prev.map((s) => (s.id === selectedSet.id ? updatedSet : s)));
    } catch {
      Failure("Failed to remove question from set.");
    }
  };

  const handleSetCreated = (newSet: any) => {
    fetchSets();
    if (newSet && newSet.id) {
      setSelectedSet(newSet);
      setActiveSubView("detail");
    }
  };

  // Questions resolved for the currently selected set
  const selectedSetQuestions = useMemo(() => {
    if (!selectedSet) return [];
    const qIds = Array.isArray(selectedSet.question_ids)
      ? selectedSet.question_ids
      : Array.isArray(selectedSet.questions)
      ? selectedSet.questions.map((q: any) => q.id || q)
      : [];

    return courseQuestions.filter((q) => qIds.includes(q.id));
  }, [selectedSet, courseQuestions]);

  // Questions filtered in "all-questions" view
  const filteredAllQuestions = useMemo(() => {
    return courseQuestions.filter((q) => {
      if (statusFilterAll === "approved" && (q.status || "").toLowerCase() !== "approved") return false;
      if (statusFilterAll === "draft" && (q.status || "").toLowerCase() !== "draft" && (q.status || "").toLowerCase() !== "drafted") return false;
      if (statusFilterAll === "archived" && (q.status || "").toLowerCase() !== "archived") return false;
      if (searchAll) {
        const text = (q.text || q.question || "").toLowerCase();
        const code = (q.code || q.question_code || "").toLowerCase();
        const term = searchAll.toLowerCase();
        if (!text.includes(term) && !code.includes(term)) return false;
      }
      return true;
    });
  }, [courseQuestions, statusFilterAll, searchAll]);

  return (
    <div className="space-y-6">
      {/* Sub-navigation bar inside Course Question Bank tab */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                Course Question Sets & Question Bank
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Manage curriculum question sets for CIA papers, quizzes, and final exams.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* View Toggles */}
          <div className="flex rounded-2xl border border-slate-200 bg-slate-100/60 p-1 text-xs dark:border-slate-700 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => {
                setActiveSubView("sets");
                setSelectedSet(null);
              }}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-bold transition-all ${
                activeSubView === "sets" || activeSubView === "detail"
                  ? "bg-white text-indigo-600 shadow-xs dark:bg-slate-700 dark:text-white"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Question Sets ({questionSets.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubView("all-questions")}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-bold transition-all ${
                activeSubView === "all-questions"
                  ? "bg-white text-indigo-600 shadow-xs dark:bg-slate-700 dark:text-white"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>All Questions ({courseQuestions.length})</span>
            </button>
          </div>

          {/* Generate MCQs with AI */}
          <button
            type="button"
            onClick={() => router.push(courseKey ? `/neurobe/mcq-generation?course_id=${courseKey}` : "/neurobe/mcq-generation")}
            className="flex items-center gap-1.5 rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-xs font-bold text-indigo-700 shadow-xs hover:bg-indigo-100 transition active:scale-98 dark:bg-indigo-950/40 dark:border-indigo-800 dark:text-indigo-300 cursor-pointer"
          >
            <Sparkles className="h-4 w-4 text-indigo-600" />
            <span>Generate MCQs</span>
          </button>

          {/* Primary Create Button */}
          <button
            type="button"
            onClick={() => setIsCreateSetModalOpen(true)}
            className="flex items-center gap-1.5 rounded-2xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700 transition active:scale-98"
          >
            <Plus className="h-4 w-4" />
            <span>Create Question Set</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: Question Sets List */}
      {activeSubView === "sets" && (
        <QuestionSetsList
          sets={questionSets}
          loading={loadingSets}
          onOpenSet={handleOpenSet}
          onCreateNew={() => setIsCreateSetModalOpen(true)}
          onDeleteSet={handleDeleteSet}
          onEditSet={(set) => {
            setEditingSet(set);
            setIsEditSetModalOpen(true);
          }}
        />
      )}

      {/* VIEW 2: Question Set Detail View */}
      {activeSubView === "detail" && selectedSet && (
        <QuestionSetDetailView
          set={selectedSet}
          questions={selectedSetQuestions}
          onBack={handleBackToSets}
          onEditQuestion={(q) => {
            setEditingQuestion(q);
            setIsEditModalOpen(true);
          }}
          onViewQuestion={(q) => {
            setViewQuestion(q);
            setIsViewModalOpen(true);
          }}
          onRemoveQuestionFromSet={handleRemoveQuestionFromSet}
          onEditSetName={(set) => {
            setEditingSet(set);
            setIsEditSetModalOpen(true);
          }}
          onOpenAddQuestions={() => setIsAddQuestionsModalOpen(true)}
          onDeleteSet={handleDeleteSet}
        />
      )}

      {/* VIEW 3: All Course Questions Repository */}
      {activeSubView === "all-questions" && (
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchAll}
                onChange={(e) => setSearchAll(e.target.value)}
                placeholder="Search questions by keyword or code..."
                className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3.5 py-2 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={statusFilterAll}
                onChange={(e) => setStatusFilterAll(e.target.value as any)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="all">All Statuses ({courseQuestions.length})</option>
                <option value="approved">Approved Only</option>
                <option value="draft">Drafts Only</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          {/* Questions List */}
          {filteredAllQuestions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileCheck2 className="h-8 w-8 text-slate-300 mb-2" />
              <p className="text-xs font-bold text-slate-500">No questions found matching criteria.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAllQuestions.map((q, idx) => {
                const isExpanded = expandedAllIds.includes(q.id);
                const isApproved = (q.status || "").toLowerCase() === "approved";
                const isArchived = (q.status || "").toLowerCase() === "archived";

                const toggleExpand = () => {
                  setExpandedAllIds((prev) =>
                    prev.includes(q.id) ? prev.filter((i) => i !== q.id) : [...prev, q.id]
                  );
                };

                return (
                  <div
                    key={q.id}
                    className="rounded-2xl border border-slate-200/90 bg-white p-4.5 shadow-2xs hover:shadow-xs transition dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-slate-100 pb-2.5 dark:border-slate-800">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-900 text-xs font-black text-white dark:bg-slate-100 dark:text-slate-900">
                          #{idx + 1}
                        </span>
                        <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                          {q.code || q.question_code}
                        </span>
                        {q.level && (
                          <span className="inline-flex items-center gap-1 rounded bg-purple-50 px-2 py-0.5 text-xs font-bold text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                            <Zap className="h-3 w-3" />
                            {q.level}
                          </span>
                        )}
                        {q.co && (
                          <span className="inline-flex items-center gap-1 rounded bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
                            <Target className="h-3 w-3" />
                            {q.co}
                          </span>
                        )}
                        {q.unit && (
                          <span className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                            <BookOpen className="h-3 w-3" />
                            {q.unit}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                            isApproved
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : isArchived
                              ? "bg-purple-100 text-purple-800 border border-purple-300"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {isApproved ? "Approved" : isArchived ? "Archived" : "Draft"}
                        </span>

                        <button
                          type="button"
                          onClick={toggleExpand}
                          className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        >
                          <span>{isExpanded ? "Hide" : "Details"}</span>
                          <ChevronDown className={`h-3 w-3 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                        </button>
                      </div>
                    </div>

                    <p className="mt-3 text-sm font-bold text-slate-900 dark:text-white cursor-pointer" onClick={toggleExpand}>
                      {q.question || q.text}
                    </p>

                    {isExpanded && (
                      <div className="mt-4 border-t border-slate-100 pt-3.5 dark:border-slate-800 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {(q.options || []).map((opt: any, oIdx: number) => {
                            const isCorrect = opt.isCorrect === true || opt.is_correct === true;
                            const key = opt.key || (oIdx === 0 ? "A" : oIdx === 1 ? "B" : oIdx === 2 ? "C" : "D");
                            return (
                              <div
                                key={oIdx}
                                className={`flex items-center gap-2 rounded-xl p-2.5 text-xs ${
                                  isCorrect
                                    ? "border-2 border-emerald-500 bg-emerald-50 font-bold text-emerald-950 dark:bg-emerald-950/40 dark:text-emerald-200"
                                    : "border border-slate-200 bg-slate-50/50 text-slate-700 dark:border-slate-800 dark:bg-slate-800"
                                }`}
                              >
                                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-black ${isCorrect ? "bg-emerald-600 text-white" : "bg-white text-slate-700"}`}>
                                  {key}
                                </span>
                                <span className="flex-1">{opt.text || opt.option}</span>
                                {isCorrect && <Check className="h-3.5 w-3.5 text-emerald-600" />}
                              </div>
                            );
                          })}
                        </div>

                        {q.explanation && (
                          <div className="rounded-xl bg-indigo-50/60 p-3 text-xs text-indigo-950 dark:bg-indigo-950/20 dark:text-indigo-200">
                            <strong>Rationale: </strong>{q.explanation}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Create Question Set Modal */}
      {isCreateSetModalOpen && (
        <CreateQuestionSetModal
          open={isCreateSetModalOpen}
          onClose={() => setIsCreateSetModalOpen(false)}
          courseId={courseKey}
          courseTitle={courseTitle}
          availableQuestions={courseQuestions}
          units={courseUnits}
          onCreated={handleSetCreated}
        />
      )}

      {/* Edit Question Modal */}
      {isEditModalOpen && editingQuestion && (
        <EditQuestionModal
          open={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingQuestion(null);
          }}
          topicLabel={courseTitle}
          code={editingQuestion?.code || editingQuestion?.question_code || "Q-MCQ-01"}
          initialData={{
            id: editingQuestion.id,
            question: editingQuestion.question || editingQuestion.text || "",
            optionA: editingQuestion.options?.[0]?.text || "",
            optionB: editingQuestion.options?.[1]?.text || "",
            optionC: editingQuestion.options?.[2]?.text || "",
            optionD: editingQuestion.options?.[3]?.text || "",
            correctAnswer: (() => {
              const opts = editingQuestion.options || [];
              const foundIdx = opts.findIndex((o: any) => o.isCorrect === true || o.is_correct === true);
              if (foundIdx === 0) return "A";
              if (foundIdx === 1) return "B";
              if (foundIdx === 2) return "C";
              if (foundIdx === 3) return "D";
              return "A";
            })(),
            explanation: editingQuestion.explanation || "",
            unit: { value: editingQuestion.unit_number || "", label: editingQuestion.unit || "Unit" },
            topic: { value: editingQuestion.topic || "", label: editingQuestion.topic || "Topic" },
            subtopic: { value: editingQuestion.subtopic || "", label: editingQuestion.subtopic || "Subtopic" },
            co: { value: editingQuestion.co || "", label: editingQuestion.co || "CO" },
            knowledge: { value: editingQuestion.level || "", label: editingQuestion.level || "Knowledge Level" },
            questionType: { value: "MCQ", label: "MCQ" },
            marks: editingQuestion.marks || "2",
            difficulty: { value: editingQuestion.difficulty || "Medium", label: editingQuestion.difficulty || "Medium" },
            blooms: { value: editingQuestion.level || "K2", label: editingQuestion.level || "K2" },
          }}
          onSave={() => {
            if (onRefreshQuestions) onRefreshQuestions();
            fetchSets();
          }}
        />
      )}

      {/* View Question Modal */}
      {isViewModalOpen && viewQuestion && (
        <ViewQuestionModal
          open={isViewModalOpen}
          onClose={() => {
            setIsViewModalOpen(false);
            setViewQuestion(null);
          }}
          question={viewQuestion}
        />
      )}

      {/* Edit Question Set Name Modal */}
      {isEditSetModalOpen && editingSet && (
        <EditQuestionSetModal
          open={isEditSetModalOpen}
          onClose={() => {
            setIsEditSetModalOpen(false);
            setEditingSet(null);
          }}
          set={editingSet}
          onSave={handleEditSetName}
        />
      )}

      {/* Add Questions to Existing Set Modal */}
      {isAddQuestionsModalOpen && selectedSet && (
        <AddQuestionsToSetModal
          open={isAddQuestionsModalOpen}
          onClose={() => setIsAddQuestionsModalOpen(false)}
          set={selectedSet}
          availableQuestions={courseQuestions}
          onAddQuestions={handleAddQuestionsToSet}
        />
      )}
    </div>
  );
};

export default CourseQuestionBankTab;
