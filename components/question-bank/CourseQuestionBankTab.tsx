import React, { useState, useEffect, useMemo } from "react";
import {
  Layers,
  Plus,
  BookOpen,
  Sparkles,
} from "lucide-react";
import Models from "@/imports/models.import";
import { Success, Failure, getAuthUser } from "@/utils/function.utils";
import { useRouter } from "next/router";
import QuestionSetsList, { QuestionSetItem } from "./QuestionSetsList";
import QuestionSetDetailView from "./QuestionSetDetailView";
import CreateQuestionSetModal from "./CreateQuestionSetModal";
import EditQuestionSetModal from "./EditQuestionSetModal";
import AddQuestionsToSetModal from "./AddQuestionsToSetModal";
import { EditQuestionModal } from "./EditQuestionModal";
import ViewQuestionModal from "./ViewQuestionModal";
import {
  MCQQuestion,
  normalizeMCQ,
  MCQStatsBanner,
  QuestionReviewPool,
} from "@/components/mcq-generation";

interface CourseQuestionBankTabProps {
  courseKey: string;
  courseTitle: string;
  courseQuestions?: any[];
  courseUnits?: any[];
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

  // Questions state & Review Pool props
  const [questions, setQuestions] = useState<MCQQuestion[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [selectedBannerFilter, setSelectedBannerFilter] = useState<
    "recent" | "all" | "approved" | "archived" | "review" | "drafted"
  >("all");
  const [recentQuestionIds, setRecentQuestionIds] = useState<string[]>([]);
  const [expandedQuestionIds, setExpandedQuestionIds] = useState<string[]>([]);

  // Modals state
  const [editingQuestion, setEditingQuestion] = useState<any | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [viewQuestion, setViewQuestion] = useState<any | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Coordinator toggle state: "Created by me" (default) vs "Others"
  const [ownershipFilter, setOwnershipFilter] = useState<"me" | "others">("me");
  const authUser = getAuthUser();
  const isCoordOrAdmin = Boolean(
    authUser?.is_admin ||
    (authUser as any)?.role_name === "Course Coordinator" ||
    (authUser as any)?.role === "Course Coordinator" ||
    (authUser as any)?.role_name === "Admin" ||
    (authUser as any)?.role_name === "Super Admin"
  );

  const displayedSets = useMemo(() => {
    if (!authUser?.id) return questionSets;
    if (isCoordOrAdmin) {
      if (ownershipFilter === "me") {
        return questionSets.filter(
          (s: any) => String(s.user_id) === String(authUser.id) || !s.user_id
        );
      } else {
        return questionSets.filter(
          (s: any) => String(s.user_id) !== String(authUser.id) && Boolean(s.user_id)
        );
      }
    }
    return questionSets.filter(
      (s: any) => String(s.user_id) === String(authUser.id) || !s.user_id
    );
  }, [questionSets, ownershipFilter, authUser, isCoordOrAdmin]);

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

  const fetchQuestions = async () => {
    if (!courseKey) return;
    setLoadingQuestions(true);
    try {
      const res: any = await Models.mcq.get_questions_by_course(courseKey).catch(() => null);
      let rawList: any[] = [];
      if (res) {
        if (Array.isArray(res)) rawList = res;
        else if (res.items && Array.isArray(res.items)) rawList = res.items;
        else if (res.questions && Array.isArray(res.questions)) rawList = res.questions;
        else if (res.data && Array.isArray(res.data)) rawList = res.data;
      }
      const normalized = rawList.map((item, idx) => normalizeMCQ(item, idx));
      setQuestions(normalized);
    } catch (err) {
      console.error("Failed to fetch questions in CourseQuestionBankTab:", err);
    } finally {
      setLoadingQuestions(false);
    }
  };

  useEffect(() => {
    fetchSets();
  }, [courseKey]);

  useEffect(() => {
    if (courseQuestions && courseQuestions.length > 0) {
      setQuestions(courseQuestions.map((q, idx) => normalizeMCQ(q, idx)));
    } else {
      fetchQuestions();
    }
  }, [courseKey, courseQuestions]);

  // Filter questions for QuestionReviewPool
  const displayedQuestions = useMemo(() => {
    return questions.filter((q) => {
      const st = (q.status || "").toLowerCase();
      if (selectedBannerFilter === "approved" && st !== "approved") return false;
      if (selectedBannerFilter === "archived" && st !== "archived") return false;
      if (selectedBannerFilter === "review" && st !== "need review" && st !== "review") return false;
      if (selectedBannerFilter === "drafted" && st !== "drafted" && st !== "draft") return false;
      if (selectedBannerFilter === "recent") {
        if (recentQuestionIds.length > 0) {
          return recentQuestionIds.includes(q.id);
        }
        return questions.slice(0, 10).some((x) => x.id === q.id);
      }
      return true;
    });
  }, [questions, selectedBannerFilter, recentQuestionIds]);

  // Review Pool Handlers
  const handleToggleExpandOne = (id: string) => {
    setExpandedQuestionIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleExpandAll = () => {
    if (expandedQuestionIds.length === displayedQuestions.length && displayedQuestions.length > 0) {
      setExpandedQuestionIds([]);
    } else {
      setExpandedQuestionIds(displayedQuestions.map((q) => q.id));
    }
  };

  const handleToggleApprove = async (id: string) => {
    const target = questions.find((q) => q.id === id);
    if (!target) return;
    const isCurrentlyApproved = (target.status || "").toLowerCase() === "approved";
    const newStatus = isCurrentlyApproved ? "need review" : "approved";
    try {
      await Models.mcq.update_question(id, { status: newStatus });
      setQuestions((prev) =>
        prev.map((q) => (q.id === id ? { ...q, status: newStatus as any } : q))
      );
      Success(`Question ${isCurrentlyApproved ? "moved to review" : "approved successfully"}.`);
      if (onRefreshQuestions) onRefreshQuestions();
    } catch (err: any) {
      Failure(err?.message || "Failed to update question status.");
    }
  };

  const handleToggleArchive = async (id: string) => {
    const target = questions.find((q) => q.id === id);
    if (!target) return;
    const isCurrentlyArchived = (target.status || "").toLowerCase() === "archived";
    const newStatus = isCurrentlyArchived ? "need review" : "archived";
    try {
      await Models.mcq.update_question(id, { status: newStatus });
      setQuestions((prev) =>
        prev.map((q) => (q.id === id ? { ...q, status: newStatus as any } : q))
      );
      Success(`Question ${isCurrentlyArchived ? "restored from archive" : "archived successfully"}.`);
      if (onRefreshQuestions) onRefreshQuestions();
    } catch (err: any) {
      Failure(err?.message || "Failed to archive question.");
    }
  };

  const handleEditQuestion = (q: MCQQuestion) => {
    setEditingQuestion(q);
    setIsEditModalOpen(true);
  };

  const handleViewQuestion = (q: MCQQuestion) => {
    const optA = q.options?.find((o) => o.key === "A")?.text || q.options?.[0]?.text || "";
    const optB = q.options?.find((o) => o.key === "B")?.text || q.options?.[1]?.text || "";
    const optC = q.options?.find((o) => o.key === "C")?.text || q.options?.[2]?.text || "";
    const optD = q.options?.find((o) => o.key === "D")?.text || q.options?.[3]?.text || "";
    const correctOpt = q.options?.find((o) => o.isCorrect)?.key || "A";

    setViewQuestion({
      id: q.id,
      status: q.status as any,
      unit: q.unit,
      topic: q.topic,
      subtopic: q.subtopic,
      co: q.co,
      level: q.level,
      marks: q.marks,
      difficulty: q.difficulty,
      question: q.question || q.text || "",
      optionA: optA,
      optionB: optB,
      optionC: optC,
      optionD: optD,
      correctAnswer: correctOpt,
      explanation: q.explanation,
    });
    setIsViewModalOpen(true);
  };

  const handleDeleteQuestion = async (id: string) => {
    try {
      await Models.mcq.delete_question(id);
      setQuestions((prev) => prev.filter((q) => q.id !== id));
      Success("Question deleted successfully.");
      if (onRefreshQuestions) onRefreshQuestions();
    } catch (err: any) {
      Failure(err?.message || "Failed to delete question.");
    }
  };

  const handleApproveAll = async () => {
    const toApprove = displayedQuestions.filter(
      (q) => (q.status || "").toLowerCase() !== "approved"
    );
    if (toApprove.length === 0) {
      Success("All displayed questions are already approved.");
      return;
    }
    try {
      await Promise.all(
        toApprove.map((q) => Models.mcq.update_question(q.id, { status: "approved" }))
      );
      setQuestions((prev) =>
        prev.map((q) => {
          const match = toApprove.find((item) => item.id === q.id);
          return match ? { ...q, status: "approved" as any } : q;
        })
      );
      Success(`Successfully approved ${toApprove.length} questions.`);
      if (onRefreshQuestions) onRefreshQuestions();
    } catch (err: any) {
      Failure(err?.message || "Failed to approve all questions.");
    }
  };

  const handleCreateQuestionSet = () => {
    setIsCreateSetModalOpen(true);
  };

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

    return questions.filter((q) => qIds.includes(q.id));
  }, [selectedSet, questions]);

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
              <span>Question Sets ({displayedSets.length})</span>
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
              <span>All Questions ({questions.length})</span>
            </button>
          </div>

          {/* Coordinator Sliding Toggle: Created by me | Others */}
          {isCoordOrAdmin && activeSubView === "sets" && (
            <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setOwnershipFilter("me")}
                className={`rounded-lg px-3 py-1.5 transition cursor-pointer ${
                  ownershipFilter === "me"
                    ? "bg-white text-indigo-600 shadow-xs dark:bg-slate-700 dark:text-white"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                }`}
              >
                Created by me
              </button>
              <button
                type="button"
                onClick={() => setOwnershipFilter("others")}
                className={`rounded-lg px-3 py-1.5 transition cursor-pointer ${
                  ownershipFilter === "others"
                    ? "bg-white text-indigo-600 shadow-xs dark:bg-slate-700 dark:text-white"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                }`}
              >
                Others
              </button>
            </div>
          )}

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
          sets={displayedSets}
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
            handleViewQuestion(q);
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

      {/* VIEW 3: All Course Questions Repository (Review Pool) */}
      {activeSubView === "all-questions" && (
        <div className="space-y-6">
          <MCQStatsBanner
            questions={questions}
            selectedFilter={selectedBannerFilter}
            onSelectFilter={(f) => setSelectedBannerFilter(f)}
          />

          {loadingQuestions ? (
            <div className="flex h-48 items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                <span className="text-sm font-bold">Loading questions pool...</span>
              </div>
            </div>
          ) : (
            <QuestionReviewPool
              currentQuestions={questions}
              displayedQuestions={displayedQuestions}
              selectedBannerFilter={selectedBannerFilter}
              onSelectBannerFilter={setSelectedBannerFilter}
              recentQuestionIds={recentQuestionIds}
              expandedQuestionIds={expandedQuestionIds}
              onToggleExpandOne={handleToggleExpandOne}
              onToggleExpandAll={handleToggleExpandAll}
              onToggleApprove={handleToggleApprove}
              onToggleArchive={handleToggleArchive}
              onEditQuestion={handleEditQuestion}
              onViewQuestion={handleViewQuestion}
              onDeleteQuestion={handleDeleteQuestion}
              onApproveAll={handleApproveAll}
              onCreateQuestionSet={handleCreateQuestionSet}
              isGeneratingAI={false}
            />
          )}
        </div>
      )}

      {/* Edit Question Modal */}
      {isEditModalOpen && editingQuestion && (
        <EditQuestionModal
          open={isEditModalOpen}
          courseId={courseKey}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingQuestion(null);
          }}
          code={editingQuestion.code || editingQuestion.question_code}
          initialData={{
            id: editingQuestion.id,
            questionText: editingQuestion.question || editingQuestion.text || "",
            options: (editingQuestion.options || []).map((o: any) => ({
              key: o.key,
              text: o.text || o.option || "",
              is_correct: o.isCorrect || o.is_correct || false,
            })),
            explanation: editingQuestion.explanation || "",
            unit: { value: editingQuestion.unit || "", label: editingQuestion.unit || "Unit" },
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
            fetchQuestions();
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

      {/* Create Question Set Modal */}
      {isCreateSetModalOpen && (
        <CreateQuestionSetModal
          open={isCreateSetModalOpen}
          courseId={courseKey}
          courseTitle={courseTitle}
          availableQuestions={questions}
          units={courseUnits}
          onClose={() => setIsCreateSetModalOpen(false)}
          onCreated={handleSetCreated}
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
          availableQuestions={questions}
          onAddQuestions={handleAddQuestionsToSet}
        />
      )}
    </div>
  );
};

export default CourseQuestionBankTab;
