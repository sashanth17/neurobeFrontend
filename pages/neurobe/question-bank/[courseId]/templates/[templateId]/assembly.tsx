import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useDispatch } from "react-redux";
import { setPageTitle } from "@/store/themeConfigSlice";
import PrivateRouter from "@/hook/privateRouter";
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
import { Loader2, Sparkles, XCircle } from "lucide-react";

const QuestionAssemblyStudioPage = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { courseId, templateId, code, title } = router.query;

  const validCourseId = Array.isArray(courseId) ? courseId[0] : courseId || "";
  const validTemplateId = Array.isArray(templateId) ? templateId[0] : templateId || "";

  // Course Details State
  const [courseInfo, setCourseInfo] = useState<{
    code: string;
    title: string;
  }>({
    code: (Array.isArray(code) ? code[0] : code) || "CS301",
    title: (Array.isArray(title) ? title[0] : title) || "Course Assessments & Question Bank",
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

  // Load Course Details if needed
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
        }
      } catch (e) {
        console.error("Failed to load course details:", e);
      }
    };
    fetchCourseDetails();
  }, [validCourseId]);

  useEffect(() => {
    const tmplName = template?.template_name || "Assembly Studio";
    dispatch(setPageTitle(`${courseInfo.code} — ${tmplName}`));
  }, [dispatch, courseInfo.code, template?.template_name]);

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

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        <p className="text-xs font-semibold text-gray-500">
          Loading Question Assembly Studio & Blueprint...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16">
      {/* Assembly Studio Header & Progress */}
      <AssemblyHeader
        courseId={validCourseId}
        courseCode={courseInfo.code}
        courseTitle={courseInfo.title}
        template={template}
        assemblyStats={assemblyStats}
        onOpenPreview={handleOpenPreviewModal}
        onOpenUploadPdf={() => setIsUploadPdfModalOpen(true)}
      />

      {/* Live AI Question Generation Banner (Non-blocking & Persistent) */}
      {isGenerating && (
        <div className="mb-6 overflow-hidden rounded-2xl border border-purple-200 bg-gradient-to-r from-purple-50/90 via-indigo-50/70 to-purple-50/90 p-4 shadow-sm dark:border-purple-800 dark:bg-purple-950/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-purple-600 text-white shadow-md shadow-purple-600/20">
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
                className="inline-flex items-center gap-1.5 rounded-xl border border-purple-300 bg-white px-3 py-1.5 text-xs font-bold text-purple-700 shadow-sm hover:bg-purple-50 dark:border-purple-700 dark:bg-gray-800 dark:text-purple-300 transition-all"
              >
                <Sparkles className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                <span>View Details</span>
              </button>
              <button
                type="button"
                onClick={() => handleCancelGeneration()}
                disabled={cancellingJob}
                className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 shadow-sm hover:bg-red-100 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300 transition-all disabled:opacity-60"
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
          {/* Progress bar */}
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
        {/* LEFT PANE: Blueprint Slots (5 Columns on Desktop) */}
        <div className="lg:col-span-5">
          <BlueprintSlotsPane
            template={template}
            candidates={candidates}
            activeSlotId={activeSlotId}
            actionLoadingId={actionLoadingId}
            onSelectSlot={(slotId) => setActiveSlotId(slotId)}
            onUnassignSlot={handleUnassignSlot}
            onAssignSlot={handleAssignSlot}
          />
        </div>

        {/* RIGHT PANE: Question Studio & Candidate Pool (7 Columns on Desktop) */}
        <div className="lg:col-span-7">
          <CandidatePoolPane
            courseId={validCourseId}
            templateId={validTemplateId}
            courseCode={courseInfo.code}
            candidates={candidates}
            filteredCandidates={filteredCandidates}
            allSlots={allSlots}
            activeSlot={activeSlot}
            filters={filters}
            actionLoadingId={actionLoadingId}
            onFilterChange={setFilters}
            onClearActiveSlot={() => setActiveSlotId(null)}
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

      {/* Manual Author / Edit Modal with Diagram Upload */}
      <ManualQuestionModal
        isOpen={isManualModalOpen}
        questionToEdit={questionToEdit}
        defaultMarks={activeSlot?.max_marks || null}
        onClose={() => {
          setIsManualModalOpen(false);
          setQuestionToEdit(null);
        }}
        onSave={handleSaveManualQuestion}
        onUploadDiagram={handleUploadDiagram}
      />

      {/* Live University Exam Paper Preview Modal */}
      <ExamPaperPreviewModal
        isOpen={isPreviewModalOpen}
        previewData={previewData}
        template={template}
        courseCode={courseInfo.code}
        courseTitle={courseInfo.title}
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

export default PrivateRouter(QuestionAssemblyStudioPage);
