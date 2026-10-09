/**
 * Course Analytics Service
 * Connects to course-management-service endpoints for:
 * - Role-scoped course instances (Admin, Coordinator, Instructor)
 * - Analytics filters & score distributions (with attendance exclusions)
 * - MCQ Student roster & student performance dashboard
 */

import { commonInstance } from "@/utils/axios.utils";

const COURSE_API_BASE = "course/api/v1";

export interface AnalyticsInstance {
  id: number;
  course_id?: number;
  course_code?: string;
  course_title?: string;
  name?: string;
  course_instance_name?: string;
  semester?: number;
  department_name?: string;
  programme_name?: string;
  student_count: number;
}

export interface AnalyticsFilterTest {
  id: string;
  name: string;
  test_type?: string;
  max_marks: number;
  have_viva?: boolean;
  duration_minutes?: number;
  course_instance_id?: number | null;
}

export interface AnalyticsFiltersResponse {
  role: string;
  instances: {
    id: number;
    name: string;
    semester?: number;
    student_count: number;
  }[];
  tests: AnalyticsFilterTest[];
}

export interface ScoreSeriesItem {
  instance_id: number;
  instance_name: string;
  student_percent: number[];
  student_raw: number[];
  attended_count: number;
  total_enrolled: number;
}

export interface ExcludedStudentInfo {
  student_id: string;
  student_name: string;
  instance_id: number;
  instance_name: string;
  missed_tests: string[];
  reason: string;
}

export interface AnalyticsScoresResponse {
  series: ScoreSeriesItem[];
  test_max_marks: Record<string, number>;
  can_use_raw_marks: boolean;
  excluded_summary: {
    total_excluded: number;
    students: ExcludedStudentInfo[];
  };
}

export interface McqStudentSummary {
  register_no: string;
  student_name: string;
  email: string;
  instance_id: number;
  instance_name: string;
  mcq_tests_attended: number;
  total_mcq_tests: number;
  avg_score_pct: number | null;
  viva_score: number | null;
  flags_count: number;
}

export interface StudentDashboardCia {
  cia_test_id: number;
  test_name: string;
  test_type?: string;
  final_total_mark: number;
  actual_max_mark: number;
  marks_obtained_percentage: number;
  questions: any[];
  co_marks: Record<string, any>;
  paper_links: string[];
}

export interface StudentDashboardMcq {
  test_id: string;
  test_code?: string;
  title: string;
  score_pct: number;
  total_questions: number;
  correct_count: number;
  unanswered_count: number;
  passed: boolean;
  tab_switches: number;
}

export interface StudentDashboardProfile {
  register_number: string;
  student_name: string;
  email: string;
  instance_id: number;
  instance_name: string;
  semester?: number;
  department?: string;
  programme?: string;
}

export interface StudentDashboardViva {
  test_title?: string;
  viva_score: number | null;
  evaluation_summary: string;
  viva_report?: any;
}

export interface StudentDashboardResponse {
  profile: StudentDashboardProfile;
  cia_assessments: StudentDashboardCia[];
  co_attainment: {
    co_code: string;
    total_obtained: number;
    total_max: number;
    percentage: number;
  }[];
  mcq_assessments: StudentDashboardMcq[];
  viva: StudentDashboardViva | null;
}

export const CourseAnalyticsService = {
  // ── 1. Role-Specific Discovery Endpoints ─────────────────────────────────────

  getAdminInstances: async (courseId?: number): Promise<AnalyticsInstance[]> => {
    const q = courseId ? `?course_id=${courseId}` : "";
    const res = await commonInstance().get(`${COURSE_API_BASE}/analytics/admin/instances${q}`);
    return res.data;
  },

  getCoordinatorInstances: async (courseId?: number): Promise<AnalyticsInstance[]> => {
    const q = courseId ? `?course_id=${courseId}` : "";
    const res = await commonInstance().get(`${COURSE_API_BASE}/analytics/coordinator/instances${q}`);
    return res.data;
  },

  getInstructorInstances: async (courseId?: number): Promise<AnalyticsInstance[]> => {
    const q = courseId ? `?course_id=${courseId}` : "";
    const res = await commonInstance().get(`${COURSE_API_BASE}/analytics/instructor/instances${q}`);
    return res.data;
  },

  // ── 2. Filters & Scores ──────────────────────────────────────────────────────

  getFilters: async (courseId: number, kind: "CIA" | "MCQ"): Promise<AnalyticsFiltersResponse> => {
    const res = await commonInstance().get(
      `${COURSE_API_BASE}/courses/${courseId}/analytics/filters?kind=${kind}`
    );
    return res.data;
  },

  getScores: async (
    courseId: number,
    kind: "CIA" | "MCQ",
    instanceIds: number[],
    testIds: string[]
  ): Promise<AnalyticsScoresResponse> => {
    const iParam = encodeURIComponent(instanceIds.join(","));
    const tParam = encodeURIComponent(testIds.join(","));
    const res = await commonInstance().get(
      `${COURSE_API_BASE}/courses/${courseId}/analytics/scores?kind=${kind}&instance_ids=${iParam}&test_ids=${tParam}`
    );
    return res.data;
  },

  // ── 3. Tab 8 MCQ Roster & Student Dashboard ──────────────────────────────────

  getMcqStudents: async (
    courseId: number,
    instanceIds?: number[]
  ): Promise<McqStudentSummary[]> => {
    const q = instanceIds && instanceIds.length > 0 ? `?instance_ids=${encodeURIComponent(instanceIds.join(","))}` : "";
    const res = await commonInstance().get(
      `${COURSE_API_BASE}/courses/${courseId}/analytics/mcq-students${q}`
    );
    return res.data;
  },

  getStudentDashboard: async (
    courseId: number,
    registerNumber: string
  ): Promise<StudentDashboardResponse> => {
    const res = await commonInstance().get(
      `${COURSE_API_BASE}/courses/${courseId}/analytics/students/${encodeURIComponent(
        registerNumber
      )}/dashboard`
    );
    return res.data;
  },
};

export default CourseAnalyticsService;
