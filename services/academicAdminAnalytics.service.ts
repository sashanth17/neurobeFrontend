/**
 * Isolated Academic Administrator Analytics Service
 * 
 * Strictly decoupled from existing repositories and services.
 * Communicates directly with backend endpoints via Kong API Gateway:
 * - course/api/v1/academic-admin
 * - org/api/v1/academic-admin
 * 
 * Mock data has been completely eliminated. All data is fetched live from backend.
 */

import { commonInstance } from "@/utils/axios.utils";

export const COURSE_API_BASE = "course/api/v1/academic-admin";
export const ORG_API_BASE = "org/api/v1/academic-admin";

// ==========================================
// Level 1: Contracts
// ==========================================

export interface AcademicKpiSummary {
  organization_id: number;
  organization_name: string;
  academic_year: string;
  total_college_enrollment: number;
  total_active_departments: number;
  total_courses_running: number;
  overall_internal_pass_pct: number;
  overall_external_pass_pct: number;
  dominant_bloom_level: string;
}

export interface BloomLevelItem {
  level: "K1" | "K2" | "K3" | "K4" | "K5" | "K6";
  name: string;
  student_count: number;
  percentage: number;
  description: string;
}

export interface BloomDistributionResponse {
  organization_id: number;
  academic_year: string;
  total_students_evaluated: number;
  bloom_levels: BloomLevelItem[];
}

export interface DepartmentPassSummary {
  department_id: number;
  department_name: string;
  department_code: string;
  internal_pass_percentage: number;
  external_pass_percentage: number;
  total_students: number;
}

export interface PassPercentagesResponse {
  organization_id: number;
  academic_year: string;
  overall: {
    internal_pass_percentage: number;
    external_pass_percentage: number;
  };
  department_summary: DepartmentPassSummary[];
}

// ==========================================
// Level 2: Contracts
// ==========================================

export interface DepartmentBloomData {
  department_id: number;
  department_code: string;
  department_name: string;
  counts: Record<"K1" | "K2" | "K3" | "K4" | "K5" | "K6", number>;
  percentages: Record<"K1" | "K2" | "K3" | "K4" | "K5" | "K6", number>;
  average_attainment_score: number;
}

export interface DepartmentBloomComparisonResponse {
  academic_year: string;
  exam_scope: string;
  categories: ("K1" | "K2" | "K3" | "K4" | "K5" | "K6")[];
  departments_data: DepartmentBloomData[];
}

export interface FilterAcademicYear {
  year: string;
  is_latest: boolean;
}

export interface FilterDepartment {
  id: number;
  code: string;
  name: string;
  student_count: number;
}

export interface FilterExamScope {
  id: string;
  label: string;
}

export interface FilterBatchItem {
  id: number;
  name: string;
  start_year: number;
  end_year: number;
}

export interface AcademicFiltersResponse {
  academic_years: FilterAcademicYear[];
  departments: FilterDepartment[];
  exam_scopes: FilterExamScope[];
  batches?: FilterBatchItem[];
}

// ==========================================
// Level 3: Contracts
// ==========================================

export interface CourseFaculty {
  name: string;
  role: string;
}

export interface CourseMatrixItem {
  course_id: number;
  course_code: string;
  course_title: string;
  semester: number;
  assigned_faculty: CourseFaculty[];
  total_enrolled_students: number;
  internal_pass_pct: number;
  external_pass_pct: number;
  bloom_distribution: Record<"K1" | "K2" | "K3" | "K4" | "K5" | "K6", number>;
}

export interface CoursesMatrixResponse {
  department_id: number;
  department_name: string;
  department_code: string;
  academic_year: string;
  courses: CourseMatrixItem[];
}

export interface McqSummary {
  total_mcq_tests_conducted: number;
  student_participation_rate: number;
  average_mcq_score_pct: number;
  average_descriptive_score_pct: number;
  pass_percentage: number;
}

export interface CognitiveRigorDistribution {
  foundational_k1_k2_pct: number;
  analytical_k3_k4_pct: number;
  total_questions_analyzed: number;
}

export interface PerformanceTiers {
  excellent_above_80: number;
  good_60_to_80: number;
  average_40_to_60: number;
  needs_improvement_below_40: number;
}

export interface McqAnalyticsResponse {
  department_id: number;
  academic_year: string;
  summary: McqSummary;
  cognitive_rigor_distribution: CognitiveRigorDistribution;
  performance_tiers: PerformanceTiers;
}

// ==========================================
// Teaching Learning Effectiveness Types
// ==========================================

export type KLevelKey = "K1" | "K2" | "K3" | "K4" | "K5" | "K6";

export interface ClassroomPushPullItem {
  id: number | string;
  name: string;
  department_code: string;
  course_code: string;
  attainment_pct: number;
  student_count: number;
  faculty_name: string;
}

export interface CoursePushPullItem {
  course_code: string;
  course_name: string;
  department_code: string;
  attainment_pct: number;
  semester: number;
}

export interface DeptBreakdownRow {
  department_code: string;
  department_name: string;
  k_levels: Record<KLevelKey, number>;
  total_pct: number;
  student_count: number;
}

export interface YearBreakdownRow {
  year_label: string;
  k_levels: Record<KLevelKey, number>;
  total_pct: number;
  student_count: number;
}

export interface TeachingLearningEffectivenessData {
  type: "cia" | "mcq";
  title: string;
  department: string;
  batch: string;
  test_filter: string;
  target_pct: number;
  target_benchmark_pct?: number;
  k_level_performance: Record<KLevelKey, number>;
  total_attainment_pct: number;
  participation: {
    attended_count: number;
    absent_count: number;
    total_enrolled: number;
    participation_pct: number;
  };
  classrooms_pushing_up: ClassroomPushPullItem[];
  classrooms_pulling_down: ClassroomPushPullItem[];
  department_breakdown: DeptBreakdownRow[];
  year_breakdown: YearBreakdownRow[];
  courses_pushing_up: CoursePushPullItem[];
  courses_pulling_down: CoursePushPullItem[];
}

// ==========================================
// Department Attainment Summary Types
// ==========================================

export interface ClassInstanceAttainmentItem {
  instance_id: number | string;
  instance_name: string;
  instructor_name: string;
  student_count: number;
  average_attainment_pct: number;
}

export interface CourseAttainmentSummaryItem {
  course_id: number;
  course_code: string;
  course_title: string;
  semester: number;
  total_enrolled_students: number;
  average_copo_attainment_pct: number;
  attainment_level: number;
  po_averages?: Record<string, number>;
  pso_averages?: Record<string, number>;
  instances: ClassInstanceAttainmentItem[];
}

export interface DepartmentAttainmentSummary {
  department_id: number;
  department_code: string;
  department_name: string;
  academic_year: string;
  courses: CourseAttainmentSummaryItem[];
}

// ==========================================
// Pure Live Service API Methods (Zero Mock Data)
// ==========================================

export const academicAdminService = {
  /**
   * Fetch filter options (Academic years, Departments, Exam scopes)
   */
  async getFilters(orgId = 1): Promise<AcademicFiltersResponse> {
    const response = await commonInstance().get(`${ORG_API_BASE}/filters`, {
      params: { organization_id: orgId },
    });
    return response?.data || { academic_years: [], departments: [], exam_scopes: [] };
  },

  /**
   * Level 1: Fetch Executive KPI summary
   */
  async getKpiSummary(orgId = 1, academicYear?: string): Promise<AcademicKpiSummary> {
    const response = await commonInstance().get(`${COURSE_API_BASE}/dashboard/kpi-summary`, {
      params: { organization_id: orgId, academic_year: academicYear },
    });
    return response.data;
  },

  /**
   * Level 1: Fetch College-Wide Bloom K1-K6 Distribution
   */
  async getBloomDistribution(orgId = 1, academicYear?: string): Promise<BloomDistributionResponse> {
    const response = await commonInstance().get(`${COURSE_API_BASE}/dashboard/bloom-distribution`, {
      params: { organization_id: orgId, academic_year: academicYear },
    });
    return response.data;
  },

  /**
   * Level 1: Fetch Internal vs External Pass Percentages across departments
   */
  async getPassPercentages(orgId = 1, academicYear?: string): Promise<PassPercentagesResponse> {
    const response = await commonInstance().get(`${COURSE_API_BASE}/dashboard/pass-percentages`, {
      params: { organization_id: orgId, academic_year: academicYear },
    });
    return response.data;
  },

  /**
   * Level 2: Fetch Department-Wise Bloom Comparison (for Line & Bar charts)
   */
  async getDepartmentBloomComparison(
    orgId = 1,
    academicYear?: string,
    departmentIds?: number[],
    examScope = "COMBINED"
  ): Promise<DepartmentBloomComparisonResponse> {
    const deptIdsParam = departmentIds && departmentIds.length > 0 ? departmentIds.join(",") : undefined;
    const response = await commonInstance().get(`${COURSE_API_BASE}/departments/bloom-comparison`, {
      params: {
        organization_id: orgId,
        academic_year: academicYear,
        department_ids: deptIdsParam,
        exam_scope: examScope,
      },
    });
    return response.data;
  },

  /**
   * Level 3: Fetch Courses Matrix for a Department
   */
  async getCoursesMatrix(
    departmentId: number,
    academicYear?: string,
    semester?: number
  ): Promise<CoursesMatrixResponse> {
    const response = await commonInstance().get(
      `${COURSE_API_BASE}/departments/${departmentId}/courses-matrix`,
      {
        params: { academic_year: academicYear, semester },
      }
    );
    return response.data;
  },

  /**
   * Level 3: Fetch MCQ Assessment Analytics for a Department / Course
   */
  async getMcqAnalytics(
    departmentId: number,
    academicYear?: string,
    courseId?: number
  ): Promise<McqAnalyticsResponse> {
    const response = await commonInstance().get(
      `${COURSE_API_BASE}/departments/${departmentId}/mcq-analytics`,
      {
        params: { academic_year: academicYear, course_id: courseId },
      }
    );
    return response.data;
  },

  /**
   * Fetch Teaching Learning Effectiveness data (for CIA or MCQ)
   * Supports filtering by Department Code, Batch, Test Filter, K-Levels, and Target Percentage.
   */
  async getTeachingLearningEffectiveness(
    type: "cia" | "mcq" = "cia",
    department = "ALL",
    batch = "ALL",
    testFilter = "ALL",
    activeKLevels: KLevelKey[] = ["K1", "K2", "K3"],
    targetPercentage = 50.0
  ): Promise<TeachingLearningEffectivenessData> {
    const kLevelsParam =
      activeKLevels && activeKLevels.length > 0 ? activeKLevels.join(",") : "K1,K2,K3";

    const response = await commonInstance().get(`${COURSE_API_BASE}/effectiveness`, {
      params: {
        mode: type.toUpperCase(),
        target_percentage: targetPercentage,
        department_code: department !== "ALL" ? department : undefined,
        academic_year: batch !== "ALL" ? batch : undefined,
        test_filter: testFilter !== "ALL" ? testFilter : undefined,
        k_levels: kLevelsParam,
      },
    });

    const d = response?.data || {};

    // Transform K-level performance map
    const kLevelPerformance: Record<KLevelKey, number> = {
      K1: 0,
      K2: 0,
      K3: 0,
      K4: 0,
      K5: 0,
      K6: 0,
    };
    if (d.bar_chart?.k_level_bars) {
      d.bar_chart.k_level_bars.forEach((b: any) => {
        if (b.k_level) {
          kLevelPerformance[b.k_level as KLevelKey] = Number(b.attainment_percentage) || 0;
        }
      });
    }

    // Transform participation metrics
    const part = d.participation || {};
    const participation = {
      attended_count: Number(part.attended_count ?? part.participated ?? 0),
      absent_count: Number(part.absent_count ?? part.absent ?? 0),
      total_enrolled: Number(part.total_enrolled ?? part.total ?? 0),
      participation_pct: Number(part.participation_pct ?? part.participation_rate ?? 0),
    };

    // Transform Classrooms push up / pull down
    const classrooms_pushing_up: ClassroomPushPullItem[] = (d.classrooms_pushing_up || []).map(
      (c: any) => ({
        id: c.id,
        name: c.name || "Classroom",
        department_code: c.department_code || c.dept || "",
        course_code: c.course_code || "",
        attainment_pct: Number(c.attainment_pct) || 0,
        student_count: Number(c.student_count) || 0,
        faculty_name: c.faculty_name || c.faculty || "Faculty Member",
      })
    );

    const classrooms_pulling_down: ClassroomPushPullItem[] = (d.classrooms_pulling_down || []).map(
      (c: any) => ({
        id: c.id,
        name: c.name || "Classroom",
        department_code: c.department_code || c.dept || "",
        course_code: c.course_code || "",
        attainment_pct: Number(c.attainment_pct) || 0,
        student_count: Number(c.student_count) || 0,
        faculty_name: c.faculty_name || c.faculty || "Faculty Member",
      })
    );

    // Transform Courses push up / pull down
    const courses_pushing_up: CoursePushPullItem[] = (d.courses_pushing_up || []).map((c: any) => ({
      course_code: c.course_code || "",
      course_name: c.course_title || c.course_name || "",
      department_code: c.department_code || c.dept || "",
      attainment_pct: Number(c.attainment_pct) || 0,
      semester: Number(c.semester) || 1,
    }));

    const courses_pulling_down: CoursePushPullItem[] = (d.courses_pulling_down || []).map((c: any) => ({
      course_code: c.course_code || "",
      course_name: c.course_title || c.course_name || "",
      department_code: c.department_code || c.dept || "",
      attainment_pct: Number(c.attainment_pct) || 0,
      semester: Number(c.semester) || 1,
    }));

    // Transform Department breakdown table
    const department_breakdown: DeptBreakdownRow[] = (d.department_breakdown || []).map((row: any) => ({
      department_code: row.department_code || "",
      department_name: row.department_name || row.department_code || "",
      k_levels: row.k_levels || {},
      total_pct: Number(row.total_pct ?? row.total_percentage ?? 0),
      student_count: Number(row.student_count) || 0,
    }));

    // Transform Year breakdown table
    const year_breakdown: YearBreakdownRow[] = (d.year_wise_breakdown || []).map((row: any) => ({
      year_label: row.year_label || row.year || "Year",
      k_levels: row.k_levels || {},
      total_pct: Number(row.total_pct ?? row.total_percentage ?? 0),
      student_count: Number(row.student_count) || 0,
    }));

    return {
      type,
      title: `${type.toUpperCase()} Teaching-Learning Effectiveness`,
      department: d.department_code || department,
      batch: d.academic_year || batch,
      test_filter: d.test_filter || testFilter,
      target_pct: Number(d.target_percentage ?? targetPercentage),
      target_benchmark_pct: Number(d.target_percentage ?? targetPercentage),
      total_attainment_pct: Number(d.bar_chart?.total_attainment_pct ?? 0),
      k_level_performance: kLevelPerformance,
      participation,
      classrooms_pushing_up,
      classrooms_pulling_down,
      department_breakdown,
      year_breakdown,
      courses_pushing_up,
      courses_pulling_down,
    };
  },

  /**
   * Fetch Department-level Course CO-PO Attainment summaries (with embedded classroom instances)
   */
  async getDepartmentCourseAttainment(
    departmentCode = "CSE",
    batch = "ALL"
  ): Promise<DepartmentAttainmentSummary> {
    const response = await commonInstance().get(`${COURSE_API_BASE}/attainment/department-courses`, {
      params: {
        department_code: departmentCode !== "ALL" ? departmentCode : undefined,
        academic_year: batch !== "ALL" ? batch : undefined,
      },
    });

    const d = response?.data || {};

    const courses: CourseAttainmentSummaryItem[] = (d.courses || []).map((c: any) => {
      const instances: ClassInstanceAttainmentItem[] = (c.instances || []).map((inst: any) => ({
        instance_id: inst.instance_id,
        instance_name: inst.instance_name || "Section",
        instructor_name: inst.instructor_name || "Faculty Member",
        student_count: Number(inst.student_count) || 0,
        average_attainment_pct: Math.round(((Number(inst.average_attainment) || 0) / 3.0) * 100),
      }));

      return {
        course_id: c.course_id,
        course_code: c.course_code || "",
        course_title: c.course_title || "",
        semester: Number(c.semester) || 1,
        total_enrolled_students: Number(c.total_students) || 0,
        average_copo_attainment_pct: Math.round(((Number(c.average_attainment) || 0) / 3.0) * 100),
        attainment_level: Number(c.average_attainment) || 0,
        po_averages: c.po_averages || {},
        pso_averages: c.pso_averages || {},
        instances,
      };
    });

    return {
      department_id: Number(d.department_id) || 1,
      department_code: d.department_code || departmentCode,
      department_name: d.department_name || departmentCode,
      academic_year: d.academic_year || batch,
      courses,
    };
  },

  /**
   * Fetch Course Instances directly for a course
   */
  async getCourseInstances(courseId: number): Promise<ClassInstanceAttainmentItem[]> {
    const response = await commonInstance().get(`${COURSE_API_BASE}/attainment/course-instances`, {
      params: { course_id: courseId },
    });

    return (response?.data || []).map((inst: any) => ({
      instance_id: inst.instance_id,
      instance_name: inst.instance_name || "Section",
      instructor_name: inst.instructor_name || "Faculty Member",
      student_count: Number(inst.student_count) || 0,
      average_attainment_pct: Math.round(((Number(inst.average_attainment) || 0) / 3.0) * 100),
    }));
  },
};
