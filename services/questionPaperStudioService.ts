import { instance } from "@/utils/axios.utils";
import {
  DiagramRenderRequest,
  DiagramRenderResponse,
  QuestionFilterParams,
  QuestionPoolFilterResponse,
  CandidateQuestion,
  SingleTagRequest,
  BulkTagRequest,
  AIQuestionGenerateRequest,
} from "@/types/cia-test.types";

export const QuestionPaperStudioService = {
  /**
   * 1. Synchronous Multi-Domain Diagram Rendering (<15ms)
   * POST /diagrams/render
   */
  async renderDiagram(payload: DiagramRenderRequest): Promise<DiagramRenderResponse> {
    const res = await instance().post<DiagramRenderResponse>("diagrams/render", payload);
    return res.data;
  },

  /**
   * Scoped Diagram Render with course-level MinIO pathing
   * POST /courses/{courseId}/diagrams/render
   */
  async renderCourseDiagram(
    courseId: string | number,
    payload: DiagramRenderRequest
  ): Promise<DiagramRenderResponse> {
    const res = await instance().post<DiagramRenderResponse>(
      `courses/${courseId}/diagrams/render`,
      payload
    );
    return res.data;
  },

  /**
   * 2. Unified Filter & Dynamic Grouping API
   * GET /courses/{courseId}/templates/{templateId}/questions/filter
   */
  async filterAndGroupPool(
    courseId: string | number,
    templateId: string | number,
    params: QuestionFilterParams = {}
  ): Promise<QuestionPoolFilterResponse> {
    const res = await instance().get<QuestionPoolFilterResponse>(
      `courses/${courseId}/templates/${templateId}/questions/filter`,
      { params }
    );
    return res.data;
  },

  /**
   * 3. Single Question Tag Update
   * PATCH /courses/{courseId}/templates/{templateId}/questions/{questionId}/tags
   */
  async updateQuestionTags(
    courseId: string | number,
    templateId: string | number,
    questionId: number,
    payload: SingleTagRequest
  ): Promise<CandidateQuestion> {
    const res = await instance().patch<CandidateQuestion>(
      `courses/${courseId}/templates/${templateId}/questions/${questionId}/tags`,
      payload
    );
    return res.data;
  },

  /**
   * 4. Bulk Question Tagging
   * POST /courses/{courseId}/templates/{templateId}/questions/bulk-tag
   */
  async bulkTagQuestions(
    courseId: string | number,
    templateId: string | number,
    payload: BulkTagRequest
  ): Promise<{ status: string; updated_count: number }> {
    const res = await instance().post(
      `courses/${courseId}/templates/${templateId}/questions/bulk-tag`,
      payload
    );
    return res.data;
  },

  /**
   * 5. Trigger Async AI Question Generation
   * POST /courses/{courseId}/templates/{templateId}/generate-questions
   */
  async triggerAsyncGeneration(
    courseId: string | number,
    templateId: string | number,
    payload: AIQuestionGenerateRequest
  ): Promise<{ job_id: string; status: string; enqueued_at?: string }> {
    const res = await instance().post(
      `courses/${courseId}/templates/${templateId}/generate-questions`,
      payload
    );
    return res.data;
  },

  /**
   * Check Active Generation Job (for page load / refresh / resume)
   * GET /courses/{courseId}/templates/{templateId}/active-generation-job
   */
  async getActiveGenerationJob(
    courseId: string | number,
    templateId: string | number
  ): Promise<{
    is_generating: boolean;
    job_id?: string;
    status?: string;
    progress?: number;
    message?: string;
    error?: string | null;
    total_generated?: number;
    question_ids?: number[];
  }> {
    try {
      const res = await instance().get(
        `courses/${courseId}/templates/${templateId}/active-generation-job`
      );
      return res.data;
    } catch (err) {
      return { is_generating: false };
    }
  },

  /**
   * Cancel ongoing AI question generation job
   * POST /courses/{courseId}/templates/{templateId}/cancel-generation-job
   */
  async cancelGenerationJob(
    courseId: string | number,
    templateId: string | number,
    jobId?: string
  ): Promise<{
    status: string;
    job_id?: string;
    cancelled: boolean;
    cancelled_in_redis?: boolean;
    message: string;
    template_id?: number;
    course_id?: number;
  }> {
    const params = jobId ? { job_id: jobId } : {};
    const res = await instance().post(
      `courses/${courseId}/templates/${templateId}/cancel-generation-job`,
      {},
      { params }
    );
    return res.data;
  },

  /**
   * 6. Poll AI Job State
   * GET /jobs/{jobId}
   */
  async getJobState(jobId: string): Promise<{
    job_id: string;
    status: "queued" | "in_progress" | "completed" | "complete" | "failed" | string;
    progress?: number;
    message?: string;
    total_generated?: number;
    question_ids?: number[];
    result?: any;
    error?: string;
  }> {
    const res = await instance().get(`jobs/${jobId}`);
    const data = res.data;
    if (data.state) {
      return {
        job_id: data.job_id || jobId,
        status: data.state.status,
        progress: data.state.progress,
        message: data.state.message,
        total_generated: data.state.total_generated,
        question_ids: data.state.question_ids,
      };
    }
    return data;
  },

  /**
   * Update question Course Outcome (CO1 to CO7 or null)
   * PATCH /courses/{courseId}/templates/{templateId}/questions/{questionId}/co
   */
  async updateQuestionCO(
    courseId: string | number,
    templateId: string | number,
    questionId: number,
    coLevel: string | null
  ): Promise<CandidateQuestion> {
    const res = await instance().patch<CandidateQuestion>(
      `courses/${courseId}/templates/${templateId}/questions/${questionId}/co`,
      { co_level: coLevel }
    );
    return res.data;
  },

  /**
   * Fetch Real-time CO Attainment and Budget Summary
   * GET /courses/{courseId}/templates/{templateId}/co-summary
   */
  async getTemplateCOSummary(
    courseId: string | number,
    templateId: string | number
  ): Promise<{
    template_id: number;
    total_marks: number;
    co_summary: Array<{
      co_code: string;
      allocated_marks: number;
      assigned_marks: number;
      remaining_marks: number;
      is_fulfilled: boolean;
    }>;
    is_co_fully_balanced: boolean;
  }> {
    const res = await instance().get(
      `courses/${courseId}/templates/${templateId}/co-summary`
    );
    return res.data;
  },

  /**
   * Configure slot question_type, target_co, and modular sub_question_structure
   * PUT /courses/{courseId}/templates/{templateId}/slots/{slotId}/structure
   */
  async updateSlotStructure(
    courseId: string | number,
    templateId: string | number,
    slotId: number,
    payload: { question_type: string; target_co?: string | null; sub_question_structure?: any }
  ): Promise<any> {
    const res = await instance().put(
      `courses/${courseId}/templates/${templateId}/slots/${slotId}/structure`,
      payload
    );
    return res.data;
  },

  /**
   * Assign candidate question into slot or sub-slot
   * POST /question-paper-templates/{templateId}/slots/{slotId}/assign
   */
  async assignQuestionToSlot(
    templateId: string | number,
    slotId: number,
    generatedQuestionId: number,
    subId?: string | null
  ): Promise<any> {
    const payload: any = { generated_question_id: generatedQuestionId };
    if (subId) payload.sub_id = subId;
    const res = await instance().post(
      `question-paper-templates/${templateId}/slots/${slotId}/assign`,
      payload
    );
    return res.data;
  },

  /**
   * Unassign question from slot or sub-slot
   * POST /question-paper-templates/{templateId}/slots/{slotId}/unassign
   */
  async unassignSlot(
    templateId: string | number,
    slotId: number,
    subId?: string | null
  ): Promise<any> {
    const params = subId ? { sub_id: subId } : {};
    const res = await instance().post(
      `question-paper-templates/${templateId}/slots/${slotId}/unassign`,
      {},
      { params }
    );
    return res.data;
  },
};

export default QuestionPaperStudioService;
