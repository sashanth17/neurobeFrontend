/**
 * Mark Extraction Service
 * All requests targeting course-management-service are routed through Kong via `course/api/v1/`
 * using `commonInstance()` (baseURL = BACKEND_URL).
 *
 * Backend routes (Course Management Service):
 *   GET  course/api/v1/courses/{course_id}/instances/extraction-summary
 *   GET  course/api/v1/course-instances/{instance_id}/cia-tests/count
 *   GET  course/api/v1/course-instances/{instance_id}/cia-tests/extraction-status
 *   POST course/api/v1/cia-tests/{cia_test_id}/answer-sheet-batches
 *   POST course/api/v1/answer-sheet-batches/{batch_id}/extract
 *   GET  course/api/v1/extraction-jobs/{job_id}/status
 *   GET  course/api/v1/cia-tests/{cia_test_id}/latest-extraction-results
 *   PATCH course/api/v1/student-marks/{student_marks_id}
 *   POST  course/api/v1/student-marks/{student_marks_id}/verify
 *   GET  course/api/v1/cia-tests/{cia_test_id}/verified-marks
 */

import instance, { commonInstance } from "@/utils/axios.utils";
import { BACKEND_URL } from "@/utils/constant.utils";

const COURSE_API_BASE = "course/api/v1";

export interface ExtractionSummary {
  instance_id:                  number;
  instance_name:                string;
  total_enrolled_students:      number;
  total_cia_tests:              number;
  overall_extraction_status:    string; // PENDING | IN_PROGRESS | COMPLETED
  completion_rate: {
    completed: number;
    total:     number;
  };
}

export interface CiaTestStatus {
  cia_test_id:           number;
  test_name:             string;
  latest_job_id:         number | null;
  job_status:            string; // PENDING | PROCESSING | COMPLETED | FAILED | NONE | null
  progress_pct:          number | null;
  last_run_completed_at: string | null;
}

export interface LatestExtractionResults {
  image_base_url:     string;
  template_questions: any[];
  students:           any[];
  unmapped:           any[];
  duplicates:         any[][];
}

export const MarkExtractionService = {

  // ── 1. Course Instances with Extraction Stats ──────────────────────────────
  getCourseInstancesSummary: async (
    courseId: number | string
  ): Promise<ExtractionSummary[]> => {
    // Try the extraction-summary endpoint on course-management-service first
    try {
      const res = await commonInstance().get(
        `${COURSE_API_BASE}/courses/${courseId}/instances/extraction-summary`
      );
      return res.data;
    } catch (primaryErr: any) {
      if (primaryErr?.response?.status !== 404) throw primaryErr;

      // Fallback: query course-instances from organization-service if unavailable
      let raw: any[] = [];
      try {
        const res = await instance().get(
          `course-instances/?course_id=${courseId}&is_archived=false`
        );
        raw = Array.isArray(res.data) ? res.data : (res.data?.results ?? res.data?.data ?? []);
      } catch {
        const res = await instance().get(
          `courses/${courseId}/course-instances?is_archived=false`
        );
        raw = Array.isArray(res.data) ? res.data : (res.data?.results ?? res.data?.data ?? []);
      }

      // Normalize to ExtractionSummary shape
      return raw.map((inst: any): ExtractionSummary => ({
        instance_id:               inst.id ?? inst.instance_id,
        instance_name:             inst.name ?? inst.course_instance_name ?? inst.instance_name ?? `Section ${inst.id}`,
        total_enrolled_students:   inst.total_students ?? inst.enrolled_count ?? 0,
        total_cia_tests:           inst.total_cia_tests ?? 0,
        overall_extraction_status: inst.overall_extraction_status ?? "PENDING",
        completion_rate: inst.completion_rate ?? {
          completed: inst.extracted_count ?? 0,
          total:     inst.total_students ?? inst.enrolled_count ?? 0,
        },
      }));
    }
  },

  // ── 2. CIA Tests Count for an instance ─────────────────────────────────────
  getInstanceCiaTestsCount: async (
    instanceId: number | string
  ): Promise<{ instance_id: number; total_cia_tests: number }> => {
    try {
      const res = await commonInstance().get(
        `${COURSE_API_BASE}/course-instances/${instanceId}/cia-tests/count`
      );
      return res.data;
    } catch (err) {
      // Fallback: compute count from extraction-status list
      const tests = await MarkExtractionService.getCiaTestsStatus(instanceId);
      return {
        instance_id: Number(instanceId),
        total_cia_tests: tests ? tests.length : 0,
      };
    }
  },

  // ── 3. CIA Tests + Job Statuses for an instance ───────────────────────────
  getCiaTestsStatus: async (
    instanceId: number | string
  ): Promise<CiaTestStatus[]> => {
    const res = await commonInstance().get(
      `${COURSE_API_BASE}/course-instances/${instanceId}/cia-tests/extraction-status`
    );
    return res.data;
  },

  // ── 4. Upload answer-sheet PDF batch ─────────────────────────────────────
  uploadAnswerSheetBatch: async (
    ciaTestId: number,
    file:      File
  ): Promise<{ batch_id: number }> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await commonInstance().post(
      `${COURSE_API_BASE}/cia-tests/${ciaTestId}/answer-sheet-batches`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return res.data;
  },

  // ── 5. Trigger extraction job ─────────────────────────────────────────────
  triggerExtraction: async (
    batchId: number
  ): Promise<{ job_id: number }> => {
    const res = await commonInstance().post(
      `${COURSE_API_BASE}/answer-sheet-batches/${batchId}/extract`
    );
    return res.data;
  },

  // ── 6. Poll extraction job status ────────────────────────────────────────
  pollExtractionStatus: async (jobId: number) => {
    const res = await commonInstance().get(
      `${COURSE_API_BASE}/extraction-jobs/${jobId}/status`
    );
    return res.data;
  },

  // ── 7. Fetch latest extraction results ───────────────────────────────────
  getLatestExtractionResults: async (
    ciaTestId: number
  ): Promise<LatestExtractionResults> => {
    const res = await commonInstance().get(
      `${COURSE_API_BASE}/cia-tests/${ciaTestId}/latest-extraction-results`
    );
    return res.data;
  },

  // ── 8. Build image URL for answer-sheet page ─────────────────────────────
  buildImageUrl: (batchId: number, pageNumber: number): string => {
    return `${BACKEND_URL}${COURSE_API_BASE}/answer-sheet-batches/${batchId}/pages/${pageNumber}/image`;
  },

  // ── 9. Update student marks ───────────────────────────────────────────────
  updateStudentMarks: async (
    studentMarksId: number,
    payload:        any
  ) => {
    const res = await commonInstance().patch(
      `${COURSE_API_BASE}/student-marks/${studentMarksId}`,
      payload
    );
    return res.data;
  },

  // ── 10. Verify & lock student marks ───────────────────────────────────────
  verifyStudentMarks: async (studentMarksId: number) => {
    const res = await commonInstance().post(
      `${COURSE_API_BASE}/student-marks/${studentMarksId}/verify`,
      { is_verified: true }
    );
    return res.data;
  },

  // ── 11. Verified marks for result export ─────────────────────────────────
  getVerifiedMarks: async (ciaTestId: number) => {
    const res = await commonInstance().get(
      `${COURSE_API_BASE}/cia-tests/${ciaTestId}/verified-marks`
    );
    return res.data;
  },
};

