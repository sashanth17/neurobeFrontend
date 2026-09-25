import instance, { commonInstance } from "@/utils/axios.utils";

/**
 * CIA Assessment & Question Paper Template API Service
 * Standardized client matching CIA_TEST_FRONTEND_INTEGRATION_GUIDE.md
 */
export const ciaAssessmentService = {
  // =========================================================================
  // CIA TEST MANAGEMENT
  // =========================================================================

  /**
   * List all CIA tests for a specific course (filtered by active vs archived)
   * GET /api/v1/courses/{courseId}/cia-tests?is_archived={isArchived}
   */
  async getCourseCiaTests(courseId, isArchived = false, filters = {}) {
    const params = new URLSearchParams({ is_archived: String(isArchived) });
    if (filters.semester) params.append("semester", String(filters.semester));
    if (filters.academic_year) params.append("academic_year", String(filters.academic_year));
    if (filters.status) params.append("status", String(filters.status));

    const res = await instance().get(`courses/${courseId}/cia-tests?${params.toString()}`);
    return res.data;
  },

  /**
   * Create a new course-centric CIA test (max_marks is auto-derived from template)
   * POST /api/v1/courses/{courseId}/cia-tests
   */
  async createCiaTest(courseId, payload) {
    const res = await instance().post(`courses/${courseId}/cia-tests`, payload);
    return res.data;
  },

  /**
   * Get single CIA test details including assigned instances
   * GET /api/v1/cia-tests/{ciaTestId}
   */
  async getCiaTestDetails(ciaTestId) {
    const res = await instance().get(`cia-tests/${ciaTestId}`);
    return res.data;
  },

  /**
   * Update CIA test metadata
   * PATCH /api/v1/cia-tests/{ciaTestId}
   */
  async updateCiaTest(ciaTestId, updatePayload) {
    const res = await instance().patch(`cia-tests/${ciaTestId}`, updatePayload);
    return res.data;
  },

  /**
   * Archive a CIA test
   * POST /api/v1/cia-tests/{ciaTestId}/archive
   */
  async archiveCiaTest(ciaTestId) {
    const res = await instance().post(`cia-tests/${ciaTestId}/archive`);
    return res.data;
  },

  /**
   * Restore / Unarchive a CIA test
   * POST /api/v1/cia-tests/{ciaTestId}/unarchive
   */
  async unarchiveCiaTest(ciaTestId) {
    const res = await instance().post(`cia-tests/${ciaTestId}/unarchive`);
    return res.data;
  },

  /**
   * Delete a draft CIA test
   * DELETE /api/v1/cia-tests/{ciaTestId}
   */
  async deleteCiaTest(ciaTestId) {
    const res = await instance().delete(`cia-tests/${ciaTestId}`);
    return res.data;
  },

  /**
   * Reassign course instances / sections
   * PUT /api/v1/cia-tests/{ciaTestId}/course-instances
   */
  async assignCourseInstances(ciaTestId, courseInstanceIds) {
    const res = await instance().put(`cia-tests/${ciaTestId}/course-instances`, {
      course_instance_ids: courseInstanceIds,
    });
    return res.data;
  },

  /**
   * Assign Question Paper Template and Question Paper
   * PUT /api/v1/cia-tests/{ciaTestId}/question-paper-assignment
   */
  async assignQuestionPaper(ciaTestId, { templateId, questionPaperId, fileUrl }) {
    const res = await instance().put(`cia-tests/${ciaTestId}/question-paper-assignment`, {
      question_paper_template_id: templateId,
      question_paper_id: questionPaperId,
      question_paper_file_url: fileUrl,
    });
    return res.data;
  },

  /**
   * Get Course Instances (Sections) for Checkbox Assignment
   * GET /api/v1/course-instances/?course_id={courseId}&is_archived=false
   */
  async getCourseInstances(courseId) {
    try {
      const res = await instance().get(`course-instances/?course_id=${courseId}&is_archived=false`);
      return res.data;
    } catch (err) {
      const fallback = await instance().get(`courses/${courseId}/course-instances?is_archived=false`);
      return fallback.data;
    }
  },

  /**
   * Fetch enrolled students in a specific section taking this CIA test
   * GET /api/v1/cia-tests/{ciaTestId}/instances/{instanceId}/students
   */
  async getInstanceStudents(ciaTestId, instanceId) {
    const res = await instance().get(`cia-tests/${ciaTestId}/instances/${instanceId}/students`);
    return res.data;
  },

  /**
   * Section-Filtered Marks
   * GET /api/v1/cia-tests/{ciaTestId}/marks?course_instance_id={instanceId}
   */
  async getInstanceMarks(ciaTestId, instanceId = null) {
    let url = `cia-tests/${ciaTestId}/marks`;
    if (instanceId) url += `?course_instance_id=${instanceId}`;
    const res = await instance().get(url);
    return res.data;
  },

  // =========================================================================
  // QUESTION PAPER TEMPLATE SYSTEM (/courses/:courseId/question-paper-templates)
  // =========================================================================

  /**
   * List templates for a course (includes is_deletable and assigned_tests_count)
   * GET /api/v1/courses/{courseId}/question-paper-templates?status={status}
   */
  async getCourseQuestionPaperTemplates(courseId, status = null) {
    let url = `courses/${courseId}/question-paper-templates`;
    if (status) url += `?status=${status}`;
    const res = await instance().get(url);
    return res.data;
  },

  /**
   * Create a new course-scoped question paper template
   * POST /api/v1/courses/{courseId}/question-paper-templates
   */
  async createQuestionPaperTemplate(courseId, payload) {
    const res = await instance().post(`courses/${courseId}/question-paper-templates`, payload);
    return res.data;
  },

  /**
   * Get template blueprint detail (sections & questions)
   * GET /api/v1/question-paper-templates/{templateId}
   */
  async getQuestionPaperTemplate(templateId) {
    const res = await instance().get(`question-paper-templates/${templateId}`);
    return res.data;
  },

  /**
   * Update template status or structure (cascades marks to assigned tests)
   * PATCH /api/v1/question-paper-templates/{templateId}
   */
  async updateQuestionPaperTemplate(templateId, payload) {
    const res = await instance().patch(`question-paper-templates/${templateId}`, payload);
    return res.data;
  },

  /**
   * Delete template (protected: returns 409 Conflict if assigned to CIA tests)
   * DELETE /api/v1/question-paper-templates/{templateId}
   */
  async deleteQuestionPaperTemplate(templateId) {
    const res = await instance().delete(`question-paper-templates/${templateId}`);
    return res.data;
  },

  /**
   * Check which CIA tests are currently using this template
   * GET /api/v1/question-paper-templates/{templateId}/assigned-tests
   */
  async getTemplateAssignedCiaTests(templateId) {
    const res = await instance().get(`question-paper-templates/${templateId}/assigned-tests`);
    return res.data;
  },

  /**
   * Get Question Papers for Syllabus
   * GET /course/syllabi/{syllabusId}/cia-papers
   */
  async getQuestionPapers(syllabusId) {
    if (!syllabusId) return [];
    try {
      const res = await commonInstance().get(`course/syllabi/${syllabusId}/cia-papers`);
      return res.data;
    } catch (err) {
      console.warn("Failed to fetch question papers from course service:", err);
      return [];
    }
  },

  /**
   * Get Course Syllabus Topics grouped by unit
   * GET /course/syllabi?course_id={courseId} -> GET /course/syllabi/{syllabusId}
   */
  async getCourseSyllabusTopics(courseId) {
    if (!courseId) return [];
    try {
      const sylRes = await commonInstance().get("course/syllabi", {
        params: { course_id: courseId },
      });
      const items = sylRes.data?.items || sylRes.data || [];
      if (!items.length) return [];
      const syllabusId = items[0].id;
      const fullRes = await commonInstance().get(`course/syllabi/${syllabusId}`);
      const units = fullRes.data?.units || [];
      const topics = [];
      units.forEach((u) => {
        (u.topics || []).forEach((t) => {
          topics.push({
            id: t.id,
            topic_name: t.topic_name,
            unit_id: u.id,
            unit_number: u.unit_number,
            unit_title: u.unit_title,
          });
        });
      });
      return topics;
    } catch (err) {
      console.warn("Failed to fetch syllabus topics:", err);
      return [];
    }
  },

  // =========================================================================
  // QUESTION GENERATION & ASSEMBLY STUDIO (ASYNC AI WORKER & POOL)
  // =========================================================================

  /**
   * AI Question Generation (Asynchronous via ai-worker, capped at <= 20 questions)
   * POST /courses/{courseId}/templates/{templateId}/generate-questions
   * Returns immediately with HTTP 202 Accepted and { job_id, status: 'queued' }.
   */
  async generateQuestionsWithAI(courseId, templateId, payload) {
    // Normalize payload to match backend AIQuestionGenerateRequest schema
    const topicIds = Array.isArray(payload.topic_ids) && payload.topic_ids.length > 0
      ? payload.topic_ids.map(Number)
      : [1];

    const normalizedPayload = {
      topic_ids: topicIds,
      subtopic_ids: payload.subtopic_ids || [],
      topic_names: payload.topic_names || [],
      knowledge_level: payload.knowledge_level || payload.bloom_level || "K2",
      max_marks: Number(payload.max_marks),
      num_questions: Math.min(20, Math.max(1, Number(payload.num_questions) || 5)),
      is_either_or: Boolean(payload.is_either_or),
      has_sub_questions: Boolean(payload.has_sub_questions),
      num_sub_questions: payload.has_sub_questions
        ? Number(payload.num_sub_questions || 2)
        : null,
      sub_question_marks:
        payload.has_sub_questions && Array.isArray(payload.sub_question_marks)
          ? payload.sub_question_marks.map(Number)
          : null,
      option_b_sub_question_marks:
        payload.has_sub_questions && Array.isArray(payload.option_b_sub_question_marks)
          ? payload.option_b_sub_question_marks.map(Number)
          : null,
      include_diagram: Boolean(payload.include_diagram),
      diagram_type: payload.include_diagram ? (payload.diagram_type || "auto") : null,
      difficulty: payload.difficulty || "medium",
      custom_instructions: payload.custom_instructions || payload.additional_instructions || null,
      question_type: payload.is_either_or
        ? "either_or"
        : payload.has_sub_questions
        ? "sub_questions"
        : "direct",
    };

    if (payload.co_level) {
      normalizedPayload.co_level = payload.co_level;
    }

    const res = await instance().post(
      `courses/${courseId}/templates/${templateId}/generate-questions`,
      normalizedPayload
    );
    return res.data; // { status: "queued", job_id: "qgen-xxx", template_id, course_id, message }
  },

  /**
   * Check Active Generation Job (for page load / refresh / resume)
   * GET /courses/{courseId}/templates/{templateId}/active-generation-job
   */
  async getActiveGenerationJob(courseId, templateId) {
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
   * Track AI Job Progress & Completion
   * GET /jobs/{jobId}
   * Returns: { job_id, state: { status: 'queued'|'in_progress'|'completed'|'failed', progress, total_generated, error } }
   */
  async getJobStatus(jobId) {
    const res = await instance().get(`jobs/${jobId}`);
    return res.data;
  },

  /**
   * Poll helper for AI Question Generation (5-minute maximum timeout)
   */
  async pollQuestionGenerationJob(jobId, onProgress, maxAttempts = 150, intervalMs = 2000) {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
      const jobData = await this.getJobStatus(jobId);
      const state = jobData?.state || jobData || {};

      if (onProgress) {
        onProgress(state);
      }

      const status = (state.status || "").toLowerCase().trim();
      if (status === "completed" || status === "complete" || status === "success") {
        return {
          success: true,
          total_generated: state.total_generated || 0,
          question_ids: state.question_ids || [],
        };
      }

      if (status === "cancelled" || status === "canceled") {
        return {
          cancelled: true,
          status: "cancelled",
          message: state.error || state.message || "Question generation cancelled by user request.",
        };
      }

      if (status === "failed" || status === "error") {
        throw new Error(state.error || state.message || "Question generation failed in ai-worker");
      }
    }
    throw new Error("Question generation timed out after 5 minutes. Please try again.");
  },

  /**
   * Cancel ongoing AI question generation job
   * POST /courses/{courseId}/templates/{templateId}/cancel-generation-job
   */
  async cancelQuestionGeneration(courseId, templateId, jobId = null) {
    const params = jobId ? { job_id: jobId } : {};
    const res = await instance().post(
      `courses/${courseId}/templates/${templateId}/cancel-generation-job`,
      {},
      { params }
    );
    return res.data;
  },

  /**
   * Manually author a question with Sub-questions / Either-Or support
   * POST /courses/{courseId}/templates/{templateId}/questions
   */
  async createQuestionManually(courseId, templateId, payload) {
    const res = await instance().post(
      `courses/${courseId}/templates/${templateId}/questions`,
      payload
    );
    return res.data;
  },

  /**
   * Upload diagram image to MinIO (returns public diagram_url)
   * POST /courses/{courseId}/templates/{templateId}/questions/upload-diagram
   */
  async uploadQuestionDiagram(courseId, templateId, file) {
    const formData = new FormData();
    formData.append("file", file);
    const res = await instance().post(
      `courses/${courseId}/templates/${templateId}/questions/upload-diagram`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return res.data; // { diagram_url, object_path, filename }
  },

  /**
   * Query Candidate Pool with filters (marks, status, CO, Bloom's)
   * GET /courses/{courseId}/templates/{templateId}/questions
   */
  async getCandidateQuestions(courseId, templateId, filters = {}) {
    try {
      const res = await instance().get(
        `courses/${courseId}/templates/${templateId}/questions`,
        { params: filters }
      );
      return res.data;
    } catch (err) {
      if (err.response?.status === 404) {
        return [];
      }
      throw err;
    }
  },

  /**
   * Edit candidate question (returns 409 Conflict if assigned to a slot)
   * PATCH /question-paper-templates/questions/{questionId}
   */
  async updateQuestion(questionId, payload) {
    const res = await instance().patch(
      `question-paper-templates/questions/${questionId}`,
      payload
    );
    return res.data;
  },

  /**
   * Delete candidate question (returns 409 Conflict if assigned to a slot)
   * DELETE /question-paper-templates/questions/{questionId}
   */
  async deleteQuestion(questionId) {
    try {
      const res = await instance().delete(
        `question-paper-templates/questions/${questionId}`
      );
      return res.data;
    } catch (err) {
      if (err.response?.status === 404) {
        // Question is already deleted on backend (idempotent delete)
        return { status: "success", message: `Question ${questionId} already deleted.` };
      }
      throw err;
    }
  },

  /**
   * Assign a question from the candidate pool into a blueprint slot (strict marks matching)
   * POST /question-paper-templates/{templateId}/slots/{slotId}/assign
   */
  async assignQuestionToSlot(templateId, slotId, generatedQuestionId) {
    const res = await instance().post(
      `question-paper-templates/${templateId}/slots/${slotId}/assign`,
      { generated_question_id: generatedQuestionId }
    );
    return res.data;
  },

  /**
   * Unassign a slot and unlock the question
   * POST /question-paper-templates/{templateId}/slots/{slotId}/unassign
   */
  async unassignSlot(templateId, slotId) {
    const res = await instance().post(
      `question-paper-templates/${templateId}/slots/${slotId}/unassign`
    );
    return res.data;
  },

  /**
   * Fetch Live University Exam Paper Preview
   * GET /question-paper-templates/{templateId}/preview
   */
  async getExamPaperPreview(templateId) {
    const res = await instance().get(
      `question-paper-templates/${templateId}/preview`
    );
    return res.data;
  },

  /**
   * Upload finalized exam paper PDF directly to MinIO
   * POST /question-paper-templates/{templateId}/upload-final-paper
   */
  async uploadFinalPaperPdf(templateId, file) {
    const formData = new FormData();
    formData.append("file", file);
    const res = await instance().post(
      `question-paper-templates/${templateId}/upload-final-paper`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return res.data; // { file_url, object_path, filename }
  },
};

export default ciaAssessmentService;
