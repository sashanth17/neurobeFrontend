import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import ciaAssessmentService from "@/services/ciaAssessment.service";
import {
  QuestionPaperTemplate,
  CandidateQuestion,
  AiGenerationJobPayload,
  ExamPaperPreviewData,
} from "@/types/cia-test.types";
import { toast } from "react-toastify";

export interface CandidateFilters {
  marks: number | null;
  course_outcome: string;
  bloom_level: string;
  unassigned_only: boolean;
  search: string;
}

export const useQuestionAssembly = (courseId: string | number, templateId: string | number) => {
  const validCourseId = Number(courseId);
  const validTemplateId = Number(templateId);

  // Core Data
  const [template, setTemplate] = useState<QuestionPaperTemplate | null>(null);
  const [candidates, setCandidates] = useState<CandidateQuestion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [candidatesLoading, setCandidatesLoading] = useState<boolean>(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | string | null>(null);

  // Active Slot for Assignment
  const [activeSlotId, setActiveSlotId] = useState<number | null>(null);

  // Filter States
  const [filters, setFilters] = useState<CandidateFilters>({
    marks: null,
    course_outcome: "",
    bloom_level: "",
    unassigned_only: false,
    search: "",
  });

  // AI Generation State
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [jobProgress, setJobProgress] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [cancellingJob, setCancellingJob] = useState<boolean>(false);
  const cancelledJobsRef = useRef<Set<string>>(new Set());

  // Syllabus Topics State
  const [syllabusTopics, setSyllabusTopics] = useState<any[]>([]);
  const [topicsLoading, setTopicsLoading] = useState<boolean>(false);

  // Preview State
  const [previewData, setPreviewData] = useState<ExamPaperPreviewData | null>(null);
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);

  // Final PDF upload state
  const [uploadingPdf, setUploadingPdf] = useState<boolean>(false);

  // =========================================================================
  // DATA FETCHING
  // =========================================================================

  const fetchTemplate = useCallback(async () => {
    if (!validTemplateId) return;
    try {
      const data = await ciaAssessmentService.getQuestionPaperTemplate(validTemplateId);
      setTemplate(data);
    } catch (err: any) {
      console.error("Failed to load blueprint template:", err);
      toast.error(err.response?.data?.detail || "Failed to load blueprint template");
    }
  }, [validTemplateId]);

  const fetchCandidates = useCallback(async () => {
    if (!validCourseId || !validTemplateId) return;
    setCandidatesLoading(true);
    try {
      const data = await ciaAssessmentService.getCandidateQuestions(
        validCourseId,
        validTemplateId
      );
      setCandidates(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Failed to fetch candidate questions:", err);
    } finally {
      setCandidatesLoading(false);
    }
  }, [validCourseId, validTemplateId]);

  const fetchTopics = useCallback(async () => {
    if (!validCourseId) return;
    setTopicsLoading(true);
    try {
      const data = await ciaAssessmentService.getCourseSyllabusTopics(validCourseId);
      setSyllabusTopics(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn("Could not load syllabus topics:", err);
    } finally {
      setTopicsLoading(false);
    }
  }, [validCourseId]);

  // =========================================================================
  // AI GENERATION BACKGROUND POLLING & ACTIVE JOB RESTORATION
  // =========================================================================

  const pollActiveJob = useCallback(
    async (jobId: string, expectedCount?: number) => {
      setActiveJobId(jobId);
      setIsGenerating(true);
      setGenerationError(null);
      try {
        const result = await ciaAssessmentService.pollQuestionGenerationJob(
          jobId,
          (state) => {
            if (typeof state.progress === "number") setJobProgress(state.progress);
            if (state.message) setStatusMessage(state.message);
          }
        );

        if (result?.cancelled || cancelledJobsRef.current.has(jobId)) {
          setStatusMessage("Question generation was cancelled.");
          return;
        }

        setJobProgress(100);
        setStatusMessage("Questions generated successfully!");
        toast.success(
          `Generated ${result.total_generated || expectedCount || "new"} candidate questions!`
        );

        // Refresh candidate pool to show newly created questions
        await fetchCandidates();
        return result;
      } catch (err: any) {
        if (cancelledJobsRef.current.has(jobId)) {
          return;
        }
        console.error("AI Generation error:", err);
        const errMsg = err.message || err.response?.data?.detail || "Question generation failed";
        setGenerationError(errMsg);
        toast.error(`Question generation failed: ${errMsg}`);
      } finally {
        setIsGenerating(false);
        setActiveJobId(null);
        setTimeout(() => {
          setJobProgress(0);
          setStatusMessage("");
        }, 4000);
      }
    },
    [fetchCandidates]
  );

  const checkActiveJob = useCallback(async () => {
    if (!validCourseId || !validTemplateId) return;
    try {
      const activeJob = await ciaAssessmentService.getActiveGenerationJob(
        validCourseId,
        validTemplateId
      );
      if (activeJob?.is_generating && activeJob?.job_id) {
        setIsGenerating(true);
        setActiveJobId(activeJob.job_id);
        setJobProgress(activeJob.progress || 15);
        setStatusMessage(activeJob.message || "AI is synthesizing questions in the background...");
        setGenerationError(null);
        // Resume polling active job
        pollActiveJob(activeJob.job_id);
      }
    } catch (err) {
      console.warn("Could not check active generation job:", err);
    }
  }, [validCourseId, validTemplateId, pollActiveJob]);

  const handleCancelGeneration = useCallback(
    async (jobId?: string) => {
      const targetJobId = jobId || activeJobId;
      if (!validCourseId || !validTemplateId) return;
      setCancellingJob(true);
      if (targetJobId) {
        cancelledJobsRef.current.add(targetJobId);
      }
      try {
        const res = await ciaAssessmentService.cancelQuestionGeneration(
          validCourseId,
          validTemplateId,
          targetJobId
        );
        if (res.cancelled) {
          toast.info(res.message || "Question generation cancelled successfully.");
        } else {
          toast.info(res.message || "No active generation job running.");
        }
        setIsGenerating(false);
        setActiveJobId(null);
        setJobProgress(0);
        setStatusMessage("");
        return res;
      } catch (err: any) {
        console.error("Failed to cancel generation job:", err);
        const errMsg = err.response?.data?.detail || err.message || "Failed to cancel generation";
        toast.error(errMsg);
      } finally {
        setCancellingJob(false);
      }
    },
    [validCourseId, validTemplateId, activeJobId]
  );

  // Initial Load
  useEffect(() => {
    if (!validTemplateId) return;
    setLoading(true);
    Promise.all([fetchTemplate(), fetchCandidates(), fetchTopics(), checkActiveJob()]).finally(() => {
      setLoading(false);
    });
  }, [validTemplateId, fetchTemplate, fetchCandidates, fetchTopics, checkActiveJob]);

  // Derive flat list of all slots from template sections
  const allSlots = useMemo(() => {
    if (!template?.sections) return [];
    return template.sections.flatMap((sec) =>
      (sec.questions || []).map((q) => ({
        ...q,
        section_id: sec.id,
        section_order: sec.section_order,
        section_name: sec.section_name,
        section_title: sec.section_title,
      }))
    );
  }, [template]);

  // Find active slot object
  const activeSlot = useMemo(() => {
    if (!activeSlotId) return null;
    return allSlots.find((s) => s.id === activeSlotId) || null;
  }, [activeSlotId, allSlots]);

  // Active slot tracking without hiding other questions in candidate pool
  useEffect(() => {
    // Keep candidate questions visible so faculty can review and assign across slots
  }, [activeSlot]);

  // Calculate Assembly Completion Progress
  const assemblyStats = useMemo(() => {
    const totalSlots = allSlots.length;
    const assignedSlots = allSlots.filter((s) => s.actual_question_id).length;
    const percentage = totalSlots > 0 ? Math.round((assignedSlots / totalSlots) * 100) : 0;
    return { totalSlots, assignedSlots, percentage };
  }, [allSlots]);

  // Filtered Candidates
  const filteredCandidates = useMemo(() => {
    return candidates.filter((item) => {
      if (filters.marks !== null && item.max_marks !== filters.marks) return false;
      if (filters.course_outcome && item.course_outcome !== filters.course_outcome) return false;
      if (filters.bloom_level && item.bloom_level !== filters.bloom_level) return false;
      if (filters.unassigned_only && item.is_assigned) return false;
      if (filters.search) {
        const query = filters.search.toLowerCase();
        const textMatch = item.question_text?.toLowerCase().includes(query);
        const subMatch = item.sub_questions?.some((sq) =>
          sq.text?.toLowerCase().includes(query)
        );
        if (!textMatch && !subMatch) return false;
      }
      return true;
    });
  }, [candidates, filters]);

  // =========================================================================
  // AI GENERATION DISPATCH & POLLING (HTTP 202)
  // =========================================================================

  const triggerAiGeneration = async (payload: AiGenerationJobPayload) => {
    if (payload.num_questions > 20) {
      toast.warning("AI generation is capped at a maximum of 20 questions per request.");
      return;
    }

    setIsGenerating(true);
    setJobProgress(10);
    setStatusMessage("Queueing question generation with AI Worker...");
    setGenerationError(null);

    try {
      // 1. Returns 202 immediately with job_id
      const res = await ciaAssessmentService.generateQuestionsWithAI(
        validCourseId,
        validTemplateId,
        payload
      );

      setStatusMessage("AI is drafting and synthesizing questions...");
      setJobProgress(25);
      toast.info(
        "Question generation started! You can continue using the studio while questions generate in the background."
      );

      // 2. Poll in background without blocking UI navigation or screen access
      pollActiveJob(res.job_id, payload.num_questions);
      return res;
    } catch (err: any) {
      console.error("AI Generation error:", err);
      const errMsg = err.message || err.response?.data?.detail || "Question generation failed";
      setGenerationError(errMsg);
      toast.error(`Question generation failed: ${errMsg}`);
      setIsGenerating(false);
      throw err;
    }
  };

  // =========================================================================
  // SLOT ASSIGNMENT & UNASSIGNMENT
  // =========================================================================

  const handleAssignSlot = async (slotId: number, questionId: number) => {
    setActionLoadingId(`slot-assign-${slotId}`);
    try {
      await ciaAssessmentService.assignQuestionToSlot(validTemplateId, slotId, questionId);
      toast.success("Question assigned to slot!");
      // Refresh both template slots and candidates
      await Promise.all([fetchTemplate(), fetchCandidates()]);
      setActiveSlotId(null);
    } catch (err: any) {
      console.error("Failed to assign slot:", err);
      toast.error(err.response?.data?.detail || "Failed to assign question to slot");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleUnassignSlot = async (slotId: number) => {
    setActionLoadingId(`slot-unassign-${slotId}`);
    try {
      await ciaAssessmentService.unassignSlot(validTemplateId, slotId);
      toast.info("Question unassigned from slot");
      await Promise.all([fetchTemplate(), fetchCandidates()]);
    } catch (err: any) {
      console.error("Failed to unassign slot:", err);
      toast.error(err.response?.data?.detail || "Failed to unassign slot");
    } finally {
      setActionLoadingId(null);
    }
  };

  // =========================================================================
  // MANUAL QUESTION AUTHORING & DIAGRAM UPLOAD
  // =========================================================================

  const handleCreateManualQuestion = async (payload: any) => {
    setActionLoadingId("create-question");
    try {
      await ciaAssessmentService.createQuestionManually(
        validCourseId,
        validTemplateId,
        payload
      );
      toast.success("Question added to candidate pool!");
      await fetchCandidates();
      return true;
    } catch (err: any) {
      console.error("Failed to create question:", err);
      toast.error(err.response?.data?.detail || "Failed to create question");
      return false;
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleUpdateCandidateQuestion = async (questionId: number, payload: any) => {
    setActionLoadingId(`edit-question-${questionId}`);
    try {
      await ciaAssessmentService.updateQuestion(questionId, payload);
      toast.success("Question updated!");
      await fetchCandidates();
      return true;
    } catch (err: any) {
      console.error("Failed to update question:", err);
      toast.error(err.response?.data?.detail || "Failed to update question");
      return false;
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteCandidateQuestion = useCallback(
    async (questionId: number) => {
      setActionLoadingId(`delete-question-${questionId}`);
      try {
        await ciaAssessmentService.deleteQuestion(questionId);
        toast.success("Question removed from candidate pool");
        await fetchCandidates();
        return true;
      } catch (err: any) {
        if (err.response?.status === 404) {
          await fetchCandidates();
          return true;
        }
        console.error("Failed to delete question:", err);
        toast.error(
          err.response?.data?.detail || "Cannot delete question (it may be assigned to a slot)"
        );
        return false;
      } finally {
        setActionLoadingId(null);
      }
    },
    [fetchCandidates]
  );

  const handleUploadDiagram = async (file: File) => {
    try {
      const res = await ciaAssessmentService.uploadQuestionDiagram(
        validCourseId,
        validTemplateId,
        file
      );
      return res; // { diagram_url, object_path, filename }
    } catch (err: any) {
      console.error("Diagram upload failed:", err);
      toast.error(err.response?.data?.detail || "Failed to upload diagram image");
      throw err;
    }
  };

  // =========================================================================
  // LIVE EXAM PAPER PREVIEW & PDF UPLOAD
  // =========================================================================

  const fetchExamPreview = async () => {
    setPreviewLoading(true);
    try {
      const data = await ciaAssessmentService.getExamPaperPreview(validTemplateId);
      setPreviewData(data);
      return data;
    } catch (err: any) {
      console.error("Failed to fetch exam paper preview:", err);
      toast.error(err.response?.data?.detail || "Failed to load exam paper preview");
      return null;
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleUploadFinalPdf = async (file: File) => {
    setUploadingPdf(true);
    try {
      const res = await ciaAssessmentService.uploadFinalPaperPdf(validTemplateId, file);
      toast.success("Final question paper PDF stored successfully in MinIO!");
      return res;
    } catch (err: any) {
      console.error("Final PDF upload failed:", err);
      toast.error(err.response?.data?.detail || "Failed to upload finalized paper PDF");
      throw err;
    } finally {
      setUploadingPdf(false);
    }
  };

  return {
    template,
    candidates,
    filteredCandidates,
    loading,
    candidatesLoading,
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
    activeJobId,
    cancellingJob,
    triggerAiGeneration,
    handleCancelGeneration,
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
    // Refresh
    refreshTemplate: fetchTemplate,
    refreshCandidates: fetchCandidates,
    syllabusTopics,
    topicsLoading,
    refreshTopics: fetchTopics,
  };
};

export default useQuestionAssembly;
