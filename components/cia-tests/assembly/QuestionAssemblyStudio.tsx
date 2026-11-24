import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Models from "@/imports/models.import";
import useQuestionAssembly from "@/hook/useQuestionAssembly";
import AssemblyHeader from "@/components/cia-tests/assembly/AssemblyHeader";
import BlueprintSlotsPane from "@/components/cia-tests/assembly/BlueprintSlotsPane";
import CandidatePoolPane from "@/components/cia-tests/assembly/CandidatePoolPane";
import AiGeneratorDrawer from "@/components/cia-tests/assembly/AiGeneratorDrawer";
import ManualQuestionModal from "@/components/cia-tests/assembly/ManualQuestionModal";
import ExamPaperPreviewModal from "@/components/cia-tests/assembly/ExamPaperPreviewModal";
import UploadPdfModal from "@/components/cia-tests/assembly/UploadPdfModal";
import { CandidateQuestion } from "@/types/cia-test.types";
import { Loader2, Sparkles, XCircle, AlertCircle, ArrowRight, ArrowLeft } from "lucide-react";

import { useCourseOutcomes } from "@/hook/useCourseOutcomes";
import ciaAssessmentService from "@/services/ciaAssessment.service";
import { getOrganizationId } from "@/utils/function.utils";
import instance from "@/utils/axios.utils";

export interface QuestionAssemblyStudioProps {
  courseId: string | number;
  templateId: string | number;
  courseCode?: string;
  courseTitle?: string;
  onBackToTemplates?: () => void;
  onProceedToSchedule?: () => void;
  onEditTemplateBlueprint?: () => void;
}

export const QuestionAssemblyStudio: React.FC<QuestionAssemblyStudioProps> = ({
  courseId,
  templateId,
  courseCode: initialCode,
  courseTitle: initialTitle,
  onBackToTemplates,
  onProceedToSchedule,
  onEditTemplateBlueprint,
}) => {
  const router = useRouter();
  const validCourseId = Array.isArray(courseId) ? courseId[0] : courseId || "";
  const validTemplateId = Array.isArray(templateId) ? templateId[0] : templateId || "";

  const { coCodes } = useCourseOutcomes(validCourseId);

  const [testName, setTestName] = useState<string>("");
  const [organizationName, setOrganizationName] = useState<string>("");

  const [courseInfo, setCourseInfo] = useState<{
    code: string;
    title: string;
  }>({
    code: initialCode || "COURSE",
    title: initialTitle || "Academic Course",
  });

  // Modal Visibility States
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isUploadPdfModalOpen, setIsUploadPdfModalOpen] = useState(false);

  // Question being edited
  const [questionToEdit, setQuestionToEdit] = useState<CandidateQuestion | null>(null);

  // Main Assembly Hook
  const {
    template,
    candidates,
    filteredCandidates,
    loading,
    actionLoadingId,
    activeSlotId,
    setActiveSlotId,
    activeSubId,
    setActiveSubId,
    activeSlot,
    allSlots,
    assemblyStats,
    filters,
    setFilters,
    // AI Generation
    isGenerating,
    jobProgress,
    statusMessage,
    generationError,
    triggerAiGeneration,
    handleCancelGeneration,
    cancellingJob,
    // Slot Actions
    handleAssignSlot,
    handleUnassignSlot,
    handleUpdateSlotStructure,
    // Candidate Actions
    handleCreateManualQuestion,
    handleUpdateCandidateQuestion,
    handleDeleteCandidateQuestion,
    handleUploadDiagram,
    // Preview & PDF
    previewData,
    previewLoading,
    fetchExamPreview,
    uploadingPdf,
    handleUploadFinalPdf,
    syllabusTopics,
    topicsLoading,
    refreshCandidates,
  } = useQuestionAssembly(validCourseId, validTemplateId);

  // Load Course & Organization Details
  useEffect(() => {
    if (!validCourseId) return;
    const fetchCourseDetails = async () => {
      try {
        const fetchFn = Models.course?.detail || Models.course?.details;
        const res: any = fetchFn ? await fetchFn(validCourseId).catch(() => null) : null;
        if (res) {
          setCourseInfo((prev) => ({
            ...prev,
            code: res.course_code || res.code || prev.code,
            title: res.course_title || res.title || res.name || prev.title,
          }));
          if (res.organization_name || res.organization?.name || res.institution_name) {
            setOrganizationName(res.organization_name || res.organization?.name || res.institution_name);
          }
        }
      } catch (e) {
        console.error("Failed to load course details:", e);
      }
    };
    fetchCourseDetails();

    try {
      const uStr = typeof window !== "undefined" ? localStorage.getItem("user") : null;
      if (uStr) {
        const u = JSON.parse(uStr);
        const name = u?.organization_name || u?.organization?.organization_name || u?.organization?.name || u?.institution_name;
        if (name) setOrganizationName((prev) => prev || name);
      }
    } catch {}

    const orgId = getOrganizationId();
    if (orgId) {
      instance()
        .get(`organizations/${orgId}`)
        .then((res) => {
          const name = res.data?.organization_name || res.data?.name;
          if (name) setOrganizationName((prev) => prev || name);
        })
        .catch(() => {});
    }
  }, [validCourseId]);

  // Load Assigned Test Name if not already set
  useEffect(() => {
    if (!validTemplateId || testName) return;
    const fetchAssigned = async () => {
      try {
        const tests: any = await ciaAssessmentService.getTemplateAssignedCiaTests(validTemplateId);
        if (Array.isArray(tests) && tests.length > 0 && tests[0]?.test_name) {
          setTestName(tests[0].test_name);
        }
      } catch (e) {
        console.warn("Could not fetch assigned test for template:", e);
      }
    };
    fetchAssigned();
  }, [validTemplateId, testName]);

  const handleOpenPreviewModal = async () => {
    setIsPreviewModalOpen(true);
    await fetchExamPreview();
  };

  const handleOpenEditModal = (question: CandidateQuestion) => {
    setQuestionToEdit(question);
    setIsManualModalOpen(true);
  };

  const handleSaveManualQuestion = async (payload: any) => {
    if (questionToEdit) {
      return await handleUpdateCandidateQuestion(questionToEdit.id, payload);
    } else {
      return await handleCreateManualQuestion(payload);
    }
  };

  const isCoFinalized = React.useMemo(() => {
    if (!template?.sections || template.sections.length === 0) return true;
    return template.sections.every(
      (sec) =>
        sec.questions &&
        sec.questions.length > 0 &&
        sec.questions.every((q) => Boolean(q.target_co && q.target_co.trim()))
    );
  }, [template]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        <p className="text-xs font-semibold text-gray-500">
          Loading Question Assembly Studio & Blueprint...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Linear Stepper Action Bar (When embedded) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xs">
        <div className="flex items-center gap-2">
          {onBackToTemplates && (
            <button
              type="button"
              onClick={onBackToTemplates}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-700 dark:text-gray-300 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-650 rounded-xl transition cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>← Change Template</span>
            </button>
          )}
          <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
            Current Blueprint: <strong className="text-purple-600 dark:text-purple-400">{template?.template_name || `Template #${validTemplateId}`}</strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onProceedToSchedule && (
            <button
              type="button"
              onClick={onProceedToSchedule}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 active:scale-[0.98] rounded-xl transition shadow-xs cursor-pointer"
            >
              <span>Schedule CIA Test with this Paper</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Assembly Studio Header & Progress */}
      <AssemblyHeader
        courseId={validCourseId}
        courseCode={courseInfo.code}
        courseTitle={courseInfo.title}
        template={template}
        assemblyStats={assemblyStats}
        onOpenPreview={handleOpenPreviewModal}
        onOpenUploadPdf={() => setIsUploadPdfModalOpen(true)}
        onBack={onBackToTemplates}
      />

      {/* CO Finalization Guard Banner */}
      {!isCoFinalized && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900 shadow-sm dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-200/80 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-amber-900 dark:text-amber-100">
                Course Outcome (CO) Finalization Required
              </div>
              <p className="mt-0.5 text-xs text-amber-800 dark:text-amber-300">
                You must finalize the Course Outcome (CO) of each question in the question paper template before assembling questions.
              </p>
            </div>
          </div>
          {onEditTemplateBlueprint ? (
            <button
              type="button"
              onClick={onEditTemplateBlueprint}
              className="shrink-0 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-amber-700 transition-all cursor-pointer"
            >
              Edit Template Blueprint
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onBackToTemplates?.()}
              className="shrink-0 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-amber-700 transition-all cursor-pointer"
            >
              Go to Template Blueprint
            </button>
          )}
        </div>
      )}

      {/* Live AI Question Generation Banner */}
      {isGenerating && (
        <div className="overflow-hidden rounded-2xl border border-purple-200 bg-gradient-to-r from-purple-50/90 via-indigo-50/70 to-purple-50/90 p-4 shadow-sm dark:border-purple-800 dark:bg-purple-950/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-600 text-white shadow-md shadow-purple-600/20">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
                    AI Question Synthesis in Progress
                  </span>
                  <span className="rounded-full bg-purple-200 px-2 py-0.5 text-[10px] font-bold text-purple-800 dark:bg-purple-800 dark:text-purple-200">
                    {jobProgress}%
                  </span>
                </div>
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  {statusMessage || "AI is synthesizing candidate questions strictly focused on selected topics..."}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                type="button"
                onClick={() => setIsAiDrawerOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-purple-300 bg-white px-3 py-1.5 text-xs font-bold text-purple-700 shadow-sm hover:bg-purple-50 dark:border-purple-700 dark:bg-gray-800 dark:text-purple-300 transition-all cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                <span>View Details</span>
              </button>
              <button
                type="button"
                onClick={() => handleCancelGeneration()}
                disabled={cancellingJob}
                className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 shadow-sm hover:bg-red-100 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300 transition-all disabled:opacity-60 cursor-pointer"
              >
                {cancellingJob ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <XCircle className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                )}
                <span>{cancellingJob ? "Cancelling..." : "Cancel Generation"}</span>
              </button>
            </div>
          </div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-purple-200 dark:bg-purple-900">
            <div
              className="h-full bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 transition-all duration-300"
              style={{ width: `${Math.max(5, jobProgress)}%` }}
            />
          </div>
        </div>
      )}

      {/* Main Dual-Pane Assembly Workspace */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        {/* LEFT PANE: Blueprint Slots */}
        <div className="lg:col-span-5">
          <BlueprintSlotsPane
            courseId={validCourseId}
            templateId={validTemplateId}
            template={template}
            candidates={candidates}
            coCodes={coCodes}
            activeSlotId={activeSlotId}
            activeSubId={activeSubId}
            actionLoadingId={actionLoadingId}
            onSelectSlot={(slotId, subId) => {
              setActiveSlotId(slotId);
              setActiveSubId(subId || null);
            }}
            onUnassignSlot={handleUnassignSlot}
            onAssignSlot={handleAssignSlot}
            onEditQuestion={handleOpenEditModal}
            onUpdateSlotStructure={handleUpdateSlotStructure}
          />
        </div>

        {/* RIGHT PANE: Question Studio & Candidate Pool */}
        <div className="lg:col-span-7">
          <CandidatePoolPane
            courseId={validCourseId}
            templateId={validTemplateId}
            courseCode={courseInfo.code}
            candidates={candidates}
            filteredCandidates={filteredCandidates}
            coCodes={coCodes}
            allSlots={allSlots}
            activeSlot={activeSlot}
            filters={filters}
            actionLoadingId={actionLoadingId}
            onFilterChange={setFilters}
            onClearActiveSlot={() => {
              setActiveSlotId(null);
              setActiveSubId(null);
            }}
            onOpenAiGenerator={() => setIsAiDrawerOpen(true)}
            onOpenManualAuthor={() => {
              setQuestionToEdit(null);
              setIsManualModalOpen(true);
            }}
            onAssignToSlot={handleAssignSlot}
            onEditQuestion={handleOpenEditModal}
            onDeleteQuestion={handleDeleteCandidateQuestion}
            onRefreshCandidates={refreshCandidates}
          />
        </div>
      </div>

      {/* AI Question Generation Drawer */}
      <AiGeneratorDrawer
        isOpen={isAiDrawerOpen}
        isGenerating={isGenerating}
        jobProgress={jobProgress}
        statusMessage={statusMessage}
        generationError={generationError}
        defaultMarks={activeSlot?.max_marks || null}
        syllabusTopics={syllabusTopics}
        topicsLoading={topicsLoading}
        onClose={() => setIsAiDrawerOpen(false)}
        onGenerate={triggerAiGeneration}
        onCancelGeneration={handleCancelGeneration}
        cancellingJob={cancellingJob}
      />

      {/* Manual Author / Edit Modal */}
      <ManualQuestionModal
        isOpen={isManualModalOpen}
        questionToEdit={questionToEdit}
        defaultMarks={activeSlot?.max_marks || null}
        availableCos={coCodes}
        syllabusTopics={syllabusTopics}
        onClose={() => {
          setIsManualModalOpen(false);
          setQuestionToEdit(null);
        }}
        onSave={handleSaveManualQuestion}
      />

      {/* Live University Exam Paper Preview Modal */}
      <ExamPaperPreviewModal
        isOpen={isPreviewModalOpen}
        previewData={previewData}
        template={template}
        courseCode={courseInfo.code}
        courseTitle={courseInfo.title}
        organizationName={organizationName}
        testName={testName}
        loading={previewLoading}
        onClose={() => setIsPreviewModalOpen(false)}
      />

      {/* Upload Finalized Question Paper PDF Modal */}
      <UploadPdfModal
        isOpen={isUploadPdfModalOpen}
        uploading={uploadingPdf}
        onClose={() => setIsUploadPdfModalOpen(false)}
        onUpload={handleUploadFinalPdf}
      />
    </div>
  );
};

export default QuestionAssemblyStudio;

