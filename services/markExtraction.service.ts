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

export interface QuestionMark {
  question_key:        string;
  section_name?:       string;
  max_marks_assigned:  number;
  system_read?:        number;
  final_mark:          number;
  confidence?:         number;
  status:              'VERIFIED' | 'NEEDS_REVIEW' | 'NEEDS_CORRECTION' | 'CORRECTED' | string;
  target_co?:          string;
}

export interface StudentMarks {
  student_marks_id:             number;
  student_id?:                  string | null;
  register_number?:             string;
  system_detected_reg_no?:      string;
  actual_reg_number?:           string;
  student_name?:                string;
  verification_status:          'READY_TO_VERIFY' | 'NEEDS_REVIEW' | 'VERIFIED' | string;
  mapping_status:               'AUTO_MAPPED' | 'NEEDS_REVIEW' | 'UNMAPPED' | 'NO_STUDENT_FOUND' | string;
  paper_total_entered?:         number;
  total_marks_system_detected?: number;
  final_total_mark:             number;
  actual_max_mark:              number;
  total_mismatch_flag?:         boolean;
  total_selection_option?:      string;
  is_locked?:                   boolean;
  source_pages:                 number[];
  marks:                        QuestionMark[];
  co_marks?:                    Record<string, { obtained: number; max_mark: number; percentage: number }>;
}

export interface ExtractionVerificationSummary {
  total_students:        number;
  verified_count:        number;
  ready_to_verify_count: number;
  needs_review_count:    number;
  remaining_count:       number;
}

export interface VerifiedMarkQuestion {
  q_no: string;
  mark: number;
  section?: string;
  max_mark?: number;
  target_co?: string;
}

export interface VerifiedMarkStudent {
  register_number: string;
  student_name: string;
  question_marks: VerifiedMarkQuestion[];
  total_mark: number;
  max_mark?: number;
  student_marks_id?: number;
  student_id?: string;
  job_id?: number;
  batch_id?: number;
  source_pages?: number[];
  image_base_url?: string;
  section_totals?: Record<string, number>;
  percentage?: number;
  co_marks?: Record<string, { obtained: number; max_mark: number; percentage: number }>;
}

export interface VerifiedMarksResponse {
  cia_test_id: number;
  total_enrolled: number;
  total_verified: number;
  image_base_url?: string;
  verified_students: VerifiedMarkStudent[];
  template_co_distribution?: Record<string, number>;
  expected_questions?: string[];
}

export interface CIATestJobItem {
  id: number;
  cia_test_id: number;
  batch_id?: number;
  status: string;
  total_pages: number;
  processed_pages?: number;
  total_batches: number;
  student_count: number;
  created_at?: string;
  completed_at?: string;
  error_message?: string | null;
}

export interface LatestExtractionResults {
  job_id?:              number;
  cia_test_id?:         number;
  course_code?:         string;
  course_name?:         string;
  image_base_url:       string;
  job_status?:          string;
  total_pages?:         number;
  processed_pages?:     number;
  error_message?:       string | null;
  summary:              ExtractionVerificationSummary;
  students:             StudentMarks[];
  template_questions?:  any[];
  unmapped?:            any[];
  duplicates?:          any[][];
  template_co_distribution?: Record<string, number>;
  expected_questions?: string[];
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
      const status = primaryErr?.response?.status;
      const isNetworkError = !primaryErr?.response;
      if (!isNetworkError && status !== 404 && status !== 502) throw primaryErr;

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
  ): Promise<{ id: number; batch_id: number; [key: string]: any }> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await commonInstance().post(
      `${COURSE_API_BASE}/cia-tests/${ciaTestId}/answer-sheet-batches`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    const resolvedBatchId = res.data?.batch_id ?? res.data?.id;
    return {
      ...res.data,
      batch_id: resolvedBatchId,
      id: resolvedBatchId,
    };
  },

  // ── 5. Trigger extraction job ─────────────────────────────────────────────
  triggerExtraction: async (
    batchId: number
  ): Promise<{ job_id: number }> => {
    if (!batchId || isNaN(Number(batchId))) {
      throw new Error(`Invalid batchId (${batchId}) provided for extraction.`);
    }
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

  // ── 6b. Get current or latest job for CIA test ───────────────────────────
  getCurrentCiaJob: async (ciaTestId: number) => {
    try {
      const res = await commonInstance().get(
        `${COURSE_API_BASE}/cia-tests/${ciaTestId}/current-job`
      );
      return res.data;
    } catch (err) {
      return null;
    }
  },

  // ── 6c. Cancel running extraction job ─────────────────────────────────────
  cancelExtractionJob: async (jobId: number) => {
    const res = await commonInstance().post(
      `${COURSE_API_BASE}/extraction-jobs/${jobId}/cancel`
    );
    return res.data;
  },

  // ── 6d. Delete extraction job & all related files ─────────────────────────
  deleteExtractionJob: async (jobId: number) => {
    const res = await commonInstance().delete(
      `${COURSE_API_BASE}/extraction-jobs/${jobId}`
    );
    return res.data;
  },

  // ── 6e. Get all extraction jobs for CIA test ─────────────────────────────
  getCiaJobs: async (ciaTestId: number): Promise<CIATestJobItem[]> => {
    if (!ciaTestId || isNaN(Number(ciaTestId))) {
      return [];
    }
    try {
      const res = await commonInstance().get(
        `${COURSE_API_BASE}/cia-tests/${ciaTestId}/jobs`
      );
      return Array.isArray(res.data) ? res.data : [];
    } catch (err) {
      console.error("Failed to load CIA jobs", err);
      return [];
    }
  },

  // ── 7. Fetch extraction results (latest or specific job) ─────────────────
  getLatestExtractionResults: async (
    ciaTestId: number,
    jobId?: number
  ): Promise<LatestExtractionResults | null> => {
    if (!ciaTestId || isNaN(Number(ciaTestId))) {
      return null;
    }
    try {
      const url = jobId
        ? `${COURSE_API_BASE}/cia-tests/${ciaTestId}/latest-extraction-results?job_id=${jobId}`
        : `${COURSE_API_BASE}/cia-tests/${ciaTestId}/latest-extraction-results`;
      const res = await commonInstance().get(url);
      return res.data;
    } catch (err: any) {
      if (err?.response?.status === 404 || err?.message?.includes("404")) {
        return null;
      }
      throw err;
    }
  },

  // ── 8. Build image URL for answer-sheet page ─────────────────────────────
  buildImageUrl: (batchId: number, pageNumber: number): string => {
    const base = BACKEND_URL.endsWith('/') ? BACKEND_URL : `${BACKEND_URL}/`;
    return `${base}${COURSE_API_BASE}/answer-sheet-batches/${batchId}/pages/${pageNumber}/image`;
  },

  resolvePageImageUrl: (imageBaseUrl?: string, pageNumber?: number): string => {
    if (!imageBaseUrl || !pageNumber) return "";
    let base = imageBaseUrl.trim();
    if (base.includes(":8002")) {
      base = base.replace(/^https?:\/\/[^/]+/, "");
    }
    if (base.startsWith("http://") || base.startsWith("https://")) {
      const trimmed = base.endsWith("/") ? base : `${base}/`;
      return trimmed.endsWith("/image") ? `${trimmed}${pageNumber}` : `${trimmed}${pageNumber}/image`;
    }
    const host = BACKEND_URL.endsWith("/") ? BACKEND_URL : `${BACKEND_URL}/`;
    const cleanPath = base.replace(/^\/?(course\/)?/, "").replace(/\/$/, "");
    return `${host}course/${cleanPath}/${pageNumber}/image`;
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

  verifyAndLockStudentMarks: async (studentMarksId: number) => {
    return MarkExtractionService.verifyStudentMarks(studentMarksId);
  },

  // ── 10b. Unlock student marks to allow editing & remove from verified list ─
  unlockStudentMarks: async (studentMarksId: number) => {
    const res = await commonInstance().post(
      `${COURSE_API_BASE}/student-marks/${studentMarksId}/unlock`
    );
    return res.data;
  },

  // ── 11. Verified marks for result export ─────────────────────────────────
  getVerifiedMarks: async (ciaTestId: number): Promise<VerifiedMarksResponse> => {
    const res = await commonInstance().get(
      `${COURSE_API_BASE}/cia-tests/${ciaTestId}/verified-marks`
    );
    return res.data;
  },

  // ── 12. Unlock confirmed marks from result page (without full reload) ────
  unlockConfirmedMarks: async (ciaTestId: number, regNo: string) => {
    const res = await commonInstance().post(
      `${COURSE_API_BASE}/cia-tests/${ciaTestId}/students/${encodeURIComponent(regNo)}/unlock-result`
    );
    return res.data;
  },

  // ── 13. Update & re-lock confirmed marks from result page ───────────────
  updateConfirmedMarks: async (
    ciaTestId: number,
    regNo: string,
    payload: { marks: any[]; final_total_mark?: number; co_marks?: Record<string, { obtained: number; max_mark: number; percentage: number }> }
  ) => {
    const res = await commonInstance().post(
      `${COURSE_API_BASE}/cia-tests/${ciaTestId}/students/${encodeURIComponent(regNo)}/update-confirmed-marks`,
      payload
    );
    return res.data;
  },
};

