import React, { useState, useEffect, useMemo } from "react";
import {
  Sparkles,
  Layers,
  BookOpen,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  FileCheck2,
} from "lucide-react";
import Models from "@/imports/models.import";
import {
  Success,
  Failure,
  isLimitExhaustion,
  showLimitExhaustedModal,
  LIMIT_EXHAUSTED_MESSAGE,
  getErrorMessage,
} from "@/utils/function.utils";
import {
  SimplifiedMCQGenerator,
  HierarchyUnitItem,
} from "@/components/mcq-generation/SimplifiedMCQGenerator";
import {
  MCQQuestion,
  normalizeMCQ,
  MCQStatsBanner,
  QuestionReviewPool,
} from "@/components/mcq-generation";
import { EditQuestionModal } from "@/components/question-bank/EditQuestionModal";
import ViewQuestionModal from "@/components/question-bank/ViewQuestionModal";
import { CreateQuestionSetModal } from "@/components/question-bank/CreateQuestionSetModal";

interface CourseMCQGenerationTabProps {
  courseId: string | number;
  course: any;
  currentExt: any;
  isCoord: boolean;
}

export const CourseMCQGenerationTab: React.FC<CourseMCQGenerationTabProps> = ({
  courseId,
  course,
  currentExt,
  isCoord,
}) => {
  const [subTab, setSubTab] = useState<"generator" | "review">("generator");
  const [questions, setQuestions] = useState<MCQQuestion[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState<boolean>(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState<boolean>(false);
  const [recentQuestionIds, setRecentQuestionIds] = useState<string[]>([]);
  const [selectedBannerFilter, setSelectedBannerFilter] = useState<
    "recent" | "all" | "approved" | "archived" | "review" | "drafted"
  >("recent");
  const [expandedQuestionIds, setExpandedQuestionIds] = useState<string[]>([]);

  // Modals
  const [editingQuestion, setEditingQuestion] = useState<MCQQuestion | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [viewQuestion, setViewQuestion] = useState<MCQQuestion | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState<boolean>(false);
  const [isSetModalOpen, setIsSetModalOpen] = useState<boolean>(false);

  // Convert current extraction units to HierarchyUnitItem[]
  const hierarchyUnits = useMemo<HierarchyUnitItem[]>(() => {
    const units = currentExt?.units || [];
    if (!units || units.length === 0) {
      return [1, 2, 3, 4, 5].map((u) => ({
        unit_number: u,
        unit_title: `Unit ${u}`,
        topics: [],
      }));
    }
    return units.map((u: any, idx: number) => ({
      unit_number: Number(u.unit_number) || idx + 1,
      unit_title: u.unit_title || u.title || `Unit ${idx + 1}`,
      topics: (u.topics || []).map((t: any) => ({
        id: String(t.id || t.topic_id || ""),
        code: t.topic_code || "",
        title: t.topic_name || t.title || "Topic",
        subtopics: (t.subtopics || []).map((st: any) => ({
          id: String(st.id || st.subtopic_id || ""),
          code: st.subtopic_code || "",
          title: st.subtopic_name || st.title || "Subtopic",
        })),
      })),
    }));
  }, [currentExt]);

  const courseCode = course?.course_code || course?.code || `COURSE-${courseId}`;
  const courseTitle = course?.course_title || course?.title || "Course";

  const fetchCourseQuestions = async () => {
    if (!courseId) return;
    setLoadingQuestions(true);
    try {
      const res: any = await Models.mcq.get_questions_by_course(courseId).catch(() => []);
      let rawList: any[] = [];
      if (Array.isArray(res)) rawList = res;
      else if (res?.items && Array.isArray(res.items)) rawList = res.items;
      else if (res?.questions && Array.isArray(res.questions)) rawList = res.questions;
      else if (res?.data && Array.isArray(res.data)) rawList = res.data;

      const normalized = rawList.map(normalizeMCQ);
      setQuestions(normalized);
    } catch (err) {
      console.error("Failed to fetch questions:", err);
    } finally {
      setLoadingQuestions(false);
    }
  };

  useEffect(() => {
    fetchCourseQuestions();
  }, [courseId]);

  // Polling helper for AI MCQ generation job
  const pollJobStatus = (jobId: string, count: number) => {
    let attempts = 0;
    const maxAttempts = 60;
    const interval = setInterval(async () => {
      attempts++;
      try {
        const statusRes: any = await Models.mcq.get_job_status(jobId);
        const st = statusRes?.status || statusRes?.state;
        if (st === "completed" || st === "SUCCESS") {
          clearInterval(interval);
          setIsGeneratingAI(false);
          Success(`AI Generated ${count} new MCQs successfully!`);
          await fetchCourseQuestions();
          setSubTab("review");
          setSelectedBannerFilter("recent");
          if (statusRes?.question_ids && Array.isArray(statusRes.question_ids)) {
            setRecentQuestionIds(statusRes.question_ids);
          }
        } else if (st === "failed" || st === "FAILURE") {
          clearInterval(interval);
          setIsGeneratingAI(false);
          Failure(`Generation failed: ${statusRes?.error || "Unknown error"}`);
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
          setIsGeneratingAI(false);
          Failure("Generation job timed out. Please refresh in a moment.");
        }
      } catch (err) {
        if (attempts >= maxAttempts) {
          clearInterval(interval);
          setIsGeneratingAI(false);
        }
      }
    }, 2500);
  };

  const handleGenerate = async (genData: {
    selectedUnits: HierarchyUnitItem[];
    bloomCounts: Record<string, number>;
    totalQuestions: number;
    activePresetId: string | null;
    activePresetDescription: string;
    includeExplanation: boolean;
    shuffleOptions: boolean;
    enableBreakdown?: boolean;
    difficultyBreakdown?: Record<string, { easy: number; medium: number; hard: number }>;
  }) => {
    if (!isCoord) {
      Failure("Permission Denied: Only Course Coordinators can generate new MCQ questions.");
      return;
    }
    try {
      setIsGeneratingAI(true);
      const unitsPayload = genData.selectedUnits.map((u) => ({
        unit_number: u.unit_number,
        unit_title: u.unit_title,
        topics: u.topics.map((t) => ({
          title: t.title,
          subtopics: (t.subtopics || []).map((st) => ({ title: st.title })),
        })),
      }));

      const payload: any = {
        course_id: String(courseId),
        syllabus_id: currentExt?.syllabus_id || currentExt?.extractions_id || undefined,
        units: unitsPayload,
        total_questions: genData.totalQuestions,
        include_explanation: genData.includeExplanation,
        shuffle_options: genData.shuffleOptions,
      };

      if (genData.enableBreakdown && genData.difficultyBreakdown) {
        payload.distribution_mode = "difficulty_level";
        const diffBreakdown: Record<string, { easy: number; medium: number; hard: number }> = {};
        Object.keys(genData.bloomCounts).forEach((k) => {
          const bd = genData.difficultyBreakdown![k] || { easy: 0, medium: 0, hard: 0 };
          diffBreakdown[k] = {
            easy: Number(bd.easy) || 0,
            medium: Number(bd.medium) || 0,
            hard: Number(bd.hard) || 0,
          };
        });
        payload.knowledge_difficulty_breakdown = diffBreakdown;
      } else {
        payload.distribution_mode = "knowledge_level";
        payload.knowledge_level_breakdown = genData.bloomCounts;
      }

      if (genData.activePresetDescription) {
        payload.description = genData.activePresetDescription;
      }

      const res: any = await Models.mcq.generate(payload).catch((err) => {
        if (isLimitExhaustion(err)) {
          showLimitExhaustedModal(getErrorMessage(err));
          Failure(LIMIT_EXHAUSTED_MESSAGE);
        } else {
          Failure(`Error: ${getErrorMessage(err, "Failed to start generation job")}`);
        }
        return null;
      });

      const jobId = res?.job_id || res?.data?.job_id || res?.id;
      if (jobId) {
        pollJobStatus(jobId, genData.totalQuestions);
      } else {
        setIsGeneratingAI(false);
        Failure("Failed to queue generation job.");
      }
    } catch (err: any) {
      setIsGeneratingAI(false);
      Failure(getErrorMessage(err, "Unexpected error during generation"));
    }
  };

  const displayedQuestions = useMemo(() => {
    let list = questions;
    if (selectedBannerFilter === "recent") {
      if (recentQuestionIds && recentQuestionIds.length > 0) {
        list = questions.filter((q) => recentQuestionIds.includes(q.id));
      } else {
        list = questions.slice(0, 15);
      }
    } else if (selectedBannerFilter === "approved") {
      list = questions.filter((q) => (q.status || "").toLowerCase() === "approved");
    } else if (selectedBannerFilter === "archived") {
      list = questions.filter((q) => (q.status || "").toLowerCase() === "archived");
    } else if (selectedBannerFilter === "review") {
      list = questions.filter((q) => {
        const s = (q.status || "").toLowerCase();
        return s === "need review" || s === "review";
      });
    } else if (selectedBannerFilter === "drafted") {
      list = questions.filter((q) => {
        const s = (q.status || "").toLowerCase();
        return s === "drafted" || s === "draft";
      });
    }
    return list;
  }, [questions, selectedBannerFilter, recentQuestionIds]);

  const handleToggleExpandOne = (id: string) => {
    setExpandedQuestionIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleToggleExpandAll = () => {
    if (expandedQuestionIds.length === displayedQuestions.length) {
      setExpandedQuestionIds([]);
    } else {
      setExpandedQuestionIds(displayedQuestions.map((q) => q.id));
    }
  };

  const handleToggleApprove = async (questionId: string) => {
    const question = questions.find((q) => q.id === questionId);
    if (!question) return;
    const newStatus = (question.status || "").toLowerCase() === "approved" ? "Draft" : "Approved";
    try {
      await Models.mcq.update_question(questionId, { status: newStatus });
      setQuestions((prev) =>
        prev.map((q) => (q.id === questionId ? { ...q, status: newStatus as any } : q))
      );
      Success(`Question marked as ${newStatus}.`);
    } catch {
      Failure("Failed to update question status.");
    }
  };

  const handleToggleArchive = async (questionId: string) => {
    const question = questions.find((q) => q.id === questionId);
    if (!question) return;
    const newStatus = (question.status || "").toLowerCase() === "archived" ? "Draft" : "Archived";
    try {
      await Models.mcq.update_question(questionId, { status: newStatus });
      setQuestions((prev) =>
        prev.map((q) => (q.id === questionId ? { ...q, status: newStatus as any } : q))
      );
      Success(`Question ${newStatus === "Archived" ? "archived" : "unarchived"}.`);
    } catch {
      Failure("Failed to update archive status.");
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm("Are you sure you want to delete this question?")) return;
    try {
      await Models.mcq.delete_question(questionId);
      setQuestions((prev) => prev.filter((q) => q.id !== questionId));
      Success("Question deleted successfully.");
    } catch {
      Failure("Failed to delete question.");
    }
  };

  const handleApproveAll = async () => {
    const unapproved = displayedQuestions.filter((q) => (q.status || "").toLowerCase() !== "approved");
    if (unapproved.length === 0) {
      Success("All currently displayed questions are already approved.");
      return;
    }
    try {
      await Promise.all(
        unapproved.map((q) => Models.mcq.update_question(q.id, { status: "Approved" }))
      );
      setQuestions((prev) =>
        prev.map((q) =>
          unapproved.some((u) => u.id === q.id) ? { ...q, status: "Approved" } : q
        )
      );
      Success(`Approved ${unapproved.length} questions.`);
    } catch {
      Failure("Failed to approve questions in batch.");
    }
  };

  if (!isCoord) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
        <AlertCircle className="h-10 w-10 text-amber-500 mb-3" />
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
          Coordinator Access Required
        </h3>
        <p className="mt-1 text-xs text-slate-500 max-w-md">
          MCQ Generation and Question Pool management is reserved for Course Coordinators.
          Instructors can view approved questions and create question sets in the Question Bank.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              MCQ Question Generation & Pool
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Generate AI-powered questions from approved syllabus units and review question pool.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setSubTab("generator")}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                subTab === "generator"
                  ? "bg-white text-indigo-600 shadow-xs dark:bg-slate-700 dark:text-white"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>1. AI Generator</span>
            </button>
            <button
              type="button"
              onClick={() => setSubTab("review")}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                subTab === "review"
                  ? "bg-white text-indigo-600 shadow-xs dark:bg-slate-700 dark:text-white"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <FileCheck2 className="h-3.5 w-3.5" />
              <span>2. Review Pool ({questions.length})</span>
            </button>
          </div>

          <button
            type="button"
            onClick={fetchCourseQuestions}
            disabled={loadingQuestions}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loadingQuestions ? "animate-spin text-indigo-500" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Subtab 1: AI Generator */}
      {subTab === "generator" && (
        <SimplifiedMCQGenerator
          courseCode={courseCode}
          courseTitle={courseTitle}
          hierarchyUnits={hierarchyUnits}
          loadingHierarchy={false}
          onGenerate={handleGenerate}
          isGeneratingAI={isGeneratingAI}
        />
      )}

      {/* Subtab 2: Review Pool */}
      {subTab === "review" && (
        <div className="space-y-6">
          <MCQStatsBanner
            questions={questions}
            selectedFilter={selectedBannerFilter}
            onSelectFilter={(filter) => setSelectedBannerFilter(filter)}
          />

          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <QuestionReviewPool
              currentQuestions={questions}
              displayedQuestions={displayedQuestions}
              selectedBannerFilter={selectedBannerFilter}
              onSelectBannerFilter={(filter) => setSelectedBannerFilter(filter)}
              recentQuestionIds={recentQuestionIds}
              expandedQuestionIds={expandedQuestionIds}
              onToggleExpandOne={handleToggleExpandOne}
              onToggleExpandAll={handleToggleExpandAll}
              onToggleApprove={handleToggleApprove}
              onToggleArchive={handleToggleArchive}
              onEditQuestion={(q) => {
                setEditingQuestion(q);
                setIsEditModalOpen(true);
              }}
              onViewQuestion={(q) => {
                setViewQuestion(q);
                setIsViewModalOpen(true);
              }}
              onDeleteQuestion={handleDeleteQuestion}
              onApproveAll={handleApproveAll}
              onCreateQuestionSet={() => setIsSetModalOpen(true)}
              isGeneratingAI={isGeneratingAI}
            />
          </div>
        </div>
      )}

      {/* Edit Question Modal */}
      {editingQuestion && (
        <EditQuestionModal
          open={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingQuestion(null);
          }}
          initialData={editingQuestion}
          onSave={async (updatedData) => {
            try {
              await Models.mcq.update_question(editingQuestion.id, updatedData);
              Success("Question updated successfully.");
              setIsEditModalOpen(false);
              setEditingQuestion(null);
              fetchCourseQuestions();
            } catch {
              Failure("Failed to update question.");
            }
          }}
        />
      )}

      {/* View Question Modal */}
      {viewQuestion && (
        <ViewQuestionModal
          open={isViewModalOpen}
          onClose={() => {
            setIsViewModalOpen(false);
            setViewQuestion(null);
          }}
          question={viewQuestion as any}
        />
      )}

      {/* Create Question Set Modal */}
      <CreateQuestionSetModal
        open={isSetModalOpen}
        onClose={() => setIsSetModalOpen(false)}
        courseId={String(courseId)}
        availableQuestions={questions}
        onCreated={() => {
          Success("Question Set created successfully.");
          setIsSetModalOpen(false);
        }}
      />
    </div>
  );
};

export default CourseMCQGenerationTab;
