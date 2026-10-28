/**
 * Isolated Academic Administrator Analytics Service
 * 
 * Strictly decoupled from existing repositories and services.
 * Implements Level 1, Level 2, and Level 3 data contracts matching the backend plan:
 * - Level 1: College KPI summary, Bloom K1-K6 distribution, Internal/External pass percentages
 * - Level 2: Department-wise Bloom comparison (Line & Bar), organization filter lists
 * - Level 3: Department courses matrix, MCQ assessment analytics & cognitive rigor
 * 
 * Includes high-fidelity mock data and auto-fallback to mock when backend endpoints are pending.
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

export interface AcademicFiltersResponse {
  academic_years: FilterAcademicYear[];
  departments: FilterDepartment[];
  exam_scopes: FilterExamScope[];
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
// Mock Data Store (Realistic College Dataset)
// ==========================================

export const MOCK_FILTERS: AcademicFiltersResponse = {
  academic_years: [
    { year: "2025-2026", is_latest: true },
    { year: "2024-2025", is_latest: false },
    { year: "2023-2024", is_latest: false },
  ],
  departments: [
    { id: 1, code: "CSE", name: "Computer Science and Engineering", student_count: 420 },
    { id: 2, code: "IT", name: "Information Technology", student_count: 310 },
    { id: 3, code: "ECE", name: "Electronics & Communication Engg", student_count: 380 },
    { id: 4, code: "MECH", name: "Mechanical Engineering", student_count: 290 },
    { id: 5, code: "CIVIL", name: "Civil Engineering", student_count: 220 },
    { id: 6, code: "AIDS", name: "Artificial Intelligence & Data Science", student_count: 230 },
  ],
  exam_scopes: [
    { id: "COMBINED", label: "All Assessments (Combined)" },
    { id: "INTERNAL_CIA1", label: "Continuous Internal Assessment (CIA-1)" },
    { id: "INTERNAL_CIA2", label: "Continuous Internal Assessment (CIA-2)" },
    { id: "EXTERNAL", label: "Semester End External Exams" },
  ],
};

export const MOCK_KPI_SUMMARY: AcademicKpiSummary = {
  organization_id: 1,
  organization_name: "Neurobe Institute of Technology",
  academic_year: "2025-2026",
  total_college_enrollment: 1850,
  total_active_departments: 6,
  total_courses_running: 42,
  overall_internal_pass_pct: 88.45,
  overall_external_pass_pct: 82.10,
  dominant_bloom_level: "K3 - Apply",
};

export const MOCK_BLOOM_DISTRIBUTION: BloomDistributionResponse = {
  organization_id: 1,
  academic_year: "2025-2026",
  total_students_evaluated: 1850,
  bloom_levels: [
    {
      level: "K1",
      name: "Remember",
      student_count: 210,
      percentage: 11.35,
      description: "Recall facts, formulas, and basic academic concepts",
    },
    {
      level: "K2",
      name: "Understand",
      student_count: 480,
      percentage: 25.95,
      description: "Explain ideas, interpret problems, and classify principles",
    },
    {
      level: "K3",
      name: "Apply",
      student_count: 620,
      percentage: 33.51,
      description: "Use acquired knowledge to solve novel problems and scenarios",
    },
    {
      level: "K4",
      name: "Analyze",
      student_count: 340,
      percentage: 18.38,
      description: "Draw connections, dissect systems, and conduct error analysis",
    },
    {
      level: "K5",
      name: "Evaluate",
      student_count: 130,
      percentage: 7.03,
      description: "Critique architectures, justify solutions, and validate designs",
    },
    {
      level: "K6",
      name: "Create",
      student_count: 70,
      percentage: 3.78,
      description: "Design innovative software, original frameworks, and novel systems",
    },
  ],
};

export const MOCK_PASS_PERCENTAGES: PassPercentagesResponse = {
  organization_id: 1,
  academic_year: "2025-2026",
  overall: {
    internal_pass_percentage: 88.45,
    external_pass_percentage: 82.1,
  },
  department_summary: [
    {
      department_id: 1,
      department_name: "Computer Science and Engineering",
      department_code: "CSE",
      internal_pass_percentage: 92.4,
      external_pass_percentage: 86.8,
      total_students: 420,
    },
    {
      department_id: 2,
      department_name: "Information Technology",
      department_code: "IT",
      internal_pass_percentage: 89.1,
      external_pass_percentage: 83.5,
      total_students: 310,
    },
    {
      department_id: 3,
      department_name: "Electronics & Communication Engg",
      department_code: "ECE",
      internal_pass_percentage: 87.6,
      external_pass_percentage: 80.2,
      total_students: 380,
    },
    {
      department_id: 4,
      department_name: "Mechanical Engineering",
      department_code: "MECH",
      internal_pass_percentage: 84.2,
      external_pass_percentage: 77.8,
      total_students: 290,
    },
    {
      department_id: 5,
      department_name: "Civil Engineering",
      department_code: "CIVIL",
      internal_pass_percentage: 83.5,
      external_pass_percentage: 76.4,
      total_students: 220,
    },
    {
      department_id: 6,
      department_name: "Artificial Intelligence & Data Science",
      department_code: "AIDS",
      internal_pass_percentage: 93.8,
      external_pass_percentage: 88.2,
      total_students: 230,
    },
  ],
};

export const MOCK_DEPARTMENT_BLOOM_COMPARISON: DepartmentBloomComparisonResponse = {
  academic_year: "2025-2026",
  exam_scope: "COMBINED",
  categories: ["K1", "K2", "K3", "K4", "K5", "K6"],
  departments_data: [
    {
      department_id: 1,
      department_code: "CSE",
      department_name: "Computer Science and Engineering",
      counts: { K1: 35, K2: 95, K3: 160, K4: 90, K5: 30, K6: 10 },
      percentages: { K1: 8.33, K2: 22.62, K3: 38.1, K4: 21.43, K5: 7.14, K6: 2.38 },
      average_attainment_score: 76.4,
    },
    {
      department_id: 2,
      department_code: "IT",
      department_name: "Information Technology",
      counts: { K1: 40, K2: 80, K3: 110, K4: 55, K5: 18, K6: 7 },
      percentages: { K1: 12.9, K2: 25.81, K3: 35.48, K4: 17.74, K5: 5.81, K6: 2.26 },
      average_attainment_score: 73.1,
    },
    {
      department_id: 3,
      department_code: "ECE",
      department_name: "Electronics & Communication Engg",
      counts: { K1: 45, K2: 105, K3: 130, K4: 65, K5: 25, K6: 10 },
      percentages: { K1: 11.84, K2: 27.63, K3: 34.21, K4: 17.11, K5: 6.58, K6: 2.63 },
      average_attainment_score: 71.8,
    },
    {
      department_id: 4,
      department_code: "MECH",
      department_name: "Mechanical Engineering",
      counts: { K1: 42, K2: 92, K3: 98, K4: 42, K5: 12, K6: 4 },
      percentages: { K1: 14.48, K2: 31.72, K3: 33.79, K4: 14.48, K5: 4.14, K6: 1.38 },
      average_attainment_score: 68.5,
    },
    {
      department_id: 5,
      department_code: "CIVIL",
      department_name: "Civil Engineering",
      counts: { K1: 34, K2: 70, K3: 72, K4: 32, K5: 9, K6: 3 },
      percentages: { K1: 15.45, K2: 31.82, K3: 32.73, K4: 14.55, K5: 4.09, K6: 1.36 },
      average_attainment_score: 67.2,
    },
    {
      department_id: 6,
      department_code: "AIDS",
      department_name: "Artificial Intelligence & Data Science",
      counts: { K1: 14, K2: 38, K3: 90, K4: 56, K5: 22, K6: 10 },
      percentages: { K1: 6.09, K2: 16.52, K3: 39.13, K4: 24.35, K5: 9.57, K6: 4.35 },
      average_attainment_score: 79.2,
    },
  ],
};

export const MOCK_COURSES_BY_DEPT: Record<number, CoursesMatrixResponse> = {
  1: {
    department_id: 1,
    department_name: "Computer Science and Engineering",
    department_code: "CSE",
    academic_year: "2025-2026",
    courses: [
      {
        course_id: 101,
        course_code: "CS301",
        course_title: "Data Structures and Algorithms",
        semester: 3,
        assigned_faculty: [
          { name: "Dr. Rajesh Sharma", role: "Course Coordinator" },
          { name: "Prof. Priya Patel", role: "Course Instructor" },
        ],
        total_enrolled_students: 140,
        internal_pass_pct: 91.5,
        external_pass_pct: 85.0,
        bloom_distribution: { K1: 15, K2: 35, K3: 55, K4: 25, K5: 8, K6: 2 },
      },
      {
        course_id: 102,
        course_code: "CS402",
        course_title: "Operating Systems & Concurrency",
        semester: 4,
        assigned_faculty: [
          { name: "Dr. Anand Kumar", role: "Course Coordinator" },
          { name: "Prof. Sneha Verma", role: "Course Instructor" },
        ],
        total_enrolled_students: 140,
        internal_pass_pct: 88.0,
        external_pass_pct: 81.5,
        bloom_distribution: { K1: 18, K2: 42, K3: 48, K4: 22, K5: 7, K6: 3 },
      },
      {
        course_id: 103,
        course_code: "CS503",
        course_title: "Database Management & Distributed Storage",
        semester: 5,
        assigned_faculty: [
          { name: "Dr. Malini Iyer", role: "Course Coordinator" },
          { name: "Prof. Karthik S", role: "Course Instructor" },
        ],
        total_enrolled_students: 140,
        internal_pass_pct: 94.2,
        external_pass_pct: 89.0,
        bloom_distribution: { K1: 10, K2: 28, K3: 62, K4: 28, K5: 9, K6: 3 },
      },
      {
        course_id: 104,
        course_code: "CS604",
        course_title: "Compiler Design & Code Optimization",
        semester: 6,
        assigned_faculty: [
          { name: "Dr. Rajesh Sharma", role: "Course Coordinator" },
        ],
        total_enrolled_students: 140,
        internal_pass_pct: 86.4,
        external_pass_pct: 79.2,
        bloom_distribution: { K1: 12, K2: 30, K3: 50, K4: 32, K5: 12, K6: 4 },
      },
    ],
  },
  2: {
    department_id: 2,
    department_name: "Information Technology",
    department_code: "IT",
    academic_year: "2025-2026",
    courses: [
      {
        course_id: 201,
        course_code: "IT301",
        course_title: "Object-Oriented Software Engineering",
        semester: 3,
        assigned_faculty: [
          { name: "Dr. Meenakshi Sundaram", role: "Course Coordinator" },
        ],
        total_enrolled_students: 105,
        internal_pass_pct: 90.0,
        external_pass_pct: 84.5,
        bloom_distribution: { K1: 12, K2: 30, K3: 40, K4: 16, K5: 5, K6: 2 },
      },
      {
        course_id: 202,
        course_code: "IT402",
        course_title: "Web Technologies & Cloud Architecture",
        semester: 4,
        assigned_faculty: [
          { name: "Prof. Vignesh R", role: "Course Instructor" },
        ],
        total_enrolled_students: 105,
        internal_pass_pct: 88.5,
        external_pass_pct: 82.0,
        bloom_distribution: { K1: 15, K2: 25, K3: 38, K4: 20, K5: 5, K6: 2 },
      },
      {
        course_id: 203,
        course_code: "IT503",
        course_title: "Information Security & Cryptography",
        semester: 5,
        assigned_faculty: [
          { name: "Dr. Suresh Babu", role: "Course Coordinator" },
        ],
        total_enrolled_students: 100,
        internal_pass_pct: 86.0,
        external_pass_pct: 78.5,
        bloom_distribution: { K1: 13, K2: 25, K3: 32, K4: 19, K5: 8, K6: 3 },
      },
    ],
  },
  3: {
    department_id: 3,
    department_name: "Electronics & Communication Engg",
    department_code: "ECE",
    academic_year: "2025-2026",
    courses: [
      {
        course_id: 301,
        course_code: "EC301",
        course_title: "Signals and Linear Systems",
        semester: 3,
        assigned_faculty: [
          { name: "Dr. R. Venkataraman", role: "Course Coordinator" },
        ],
        total_enrolled_students: 130,
        internal_pass_pct: 84.5,
        external_pass_pct: 78.0,
        bloom_distribution: { K1: 18, K2: 38, K3: 45, K4: 20, K5: 7, K6: 2 },
      },
      {
        course_id: 302,
        course_code: "EC402",
        course_title: "Digital Signal Processing",
        semester: 4,
        assigned_faculty: [
          { name: "Prof. Deepa Nair", role: "Course Instructor" },
        ],
        total_enrolled_students: 125,
        internal_pass_pct: 87.2,
        external_pass_pct: 80.5,
        bloom_distribution: { K1: 14, K2: 34, K3: 44, K4: 22, K5: 8, K6: 3 },
      },
    ],
  },
  4: {
    department_id: 4,
    department_name: "Mechanical Engineering",
    department_code: "MECH",
    academic_year: "2025-2026",
    courses: [
      {
        course_id: 401,
        course_code: "ME301",
        course_title: "Thermodynamics and Heat Transfer",
        semester: 3,
        assigned_faculty: [
          { name: "Dr. K. Swaminathan", role: "Course Coordinator" },
        ],
        total_enrolled_students: 145,
        internal_pass_pct: 82.5,
        external_pass_pct: 76.0,
        bloom_distribution: { K1: 22, K2: 48, K3: 50, K4: 18, K5: 5, K6: 2 },
      },
      {
        course_id: 402,
        course_code: "ME402",
        course_title: "Fluid Mechanics and Machinery",
        semester: 4,
        assigned_faculty: [
          { name: "Prof. Arvind G", role: "Course Instructor" },
        ],
        total_enrolled_students: 145,
        internal_pass_pct: 85.0,
        external_pass_pct: 79.5,
        bloom_distribution: { K1: 20, K2: 44, K3: 48, K4: 24, K5: 7, K6: 2 },
      },
    ],
  },
  5: {
    department_id: 5,
    department_name: "Civil Engineering",
    department_code: "CIVIL",
    academic_year: "2025-2026",
    courses: [
      {
        course_id: 501,
        course_code: "CE301",
        course_title: "Structural Mechanics & Analysis",
        semester: 3,
        assigned_faculty: [
          { name: "Dr. S. Radhakrishnan", role: "Course Coordinator" },
        ],
        total_enrolled_students: 110,
        internal_pass_pct: 81.0,
        external_pass_pct: 74.5,
        bloom_distribution: { K1: 18, K2: 36, K3: 35, K4: 15, K5: 4, K6: 2 },
      },
    ],
  },
  6: {
    department_id: 6,
    department_name: "Artificial Intelligence & Data Science",
    department_code: "AIDS",
    academic_year: "2025-2026",
    courses: [
      {
        course_id: 601,
        course_code: "AI301",
        course_title: "Foundations of Machine Learning",
        semester: 3,
        assigned_faculty: [
          { name: "Dr. Arvind Chidambaram", role: "Course Coordinator" },
        ],
        total_enrolled_students: 115,
        internal_pass_pct: 94.0,
        external_pass_pct: 89.5,
        bloom_distribution: { K1: 8, K2: 18, K3: 45, K4: 28, K5: 11, K6: 5 },
      },
      {
        course_id: 602,
        course_code: "AI402",
        course_title: "Deep Learning & Neural Architectures",
        semester: 4,
        assigned_faculty: [
          { name: "Prof. Shilpa Rao", role: "Course Instructor" },
        ],
        total_enrolled_students: 115,
        internal_pass_pct: 93.5,
        external_pass_pct: 87.0,
        bloom_distribution: { K1: 6, K2: 20, K3: 45, K4: 28, K5: 11, K6: 5 },
      },
    ],
  },
};

export const MOCK_MCQ_ANALYTICS_BY_DEPT: Record<number, McqAnalyticsResponse> = {
  1: {
    department_id: 1,
    academic_year: "2025-2026",
    summary: {
      total_mcq_tests_conducted: 18,
      student_participation_rate: 96.2,
      average_mcq_score_pct: 78.4,
      average_descriptive_score_pct: 71.2,
      pass_percentage: 89.6,
    },
    cognitive_rigor_distribution: {
      foundational_k1_k2_pct: 42.5,
      analytical_k3_k4_pct: 57.5,
      total_questions_analyzed: 540,
    },
    performance_tiers: {
      excellent_above_80: 185,
      good_60_to_80: 145,
      average_40_to_60: 55,
      needs_improvement_below_40: 35,
    },
  },
  2: {
    department_id: 2,
    academic_year: "2025-2026",
    summary: {
      total_mcq_tests_conducted: 14,
      student_participation_rate: 94.8,
      average_mcq_score_pct: 75.1,
      average_descriptive_score_pct: 69.4,
      pass_percentage: 86.5,
    },
    cognitive_rigor_distribution: {
      foundational_k1_k2_pct: 48.0,
      analytical_k3_k4_pct: 52.0,
      total_questions_analyzed: 420,
    },
    performance_tiers: {
      excellent_above_80: 120,
      good_60_to_80: 115,
      average_40_to_60: 48,
      needs_improvement_below_40: 27,
    },
  },
  3: {
    department_id: 3,
    academic_year: "2025-2026",
    summary: {
      total_mcq_tests_conducted: 16,
      student_participation_rate: 93.5,
      average_mcq_score_pct: 74.0,
      average_descriptive_score_pct: 68.0,
      pass_percentage: 84.8,
    },
    cognitive_rigor_distribution: {
      foundational_k1_k2_pct: 51.2,
      analytical_k3_k4_pct: 48.8,
      total_questions_analyzed: 480,
    },
    performance_tiers: {
      excellent_above_80: 140,
      good_60_to_80: 135,
      average_40_to_60: 65,
      needs_improvement_below_40: 40,
    },
  },
  4: {
    department_id: 4,
    academic_year: "2025-2026",
    summary: {
      total_mcq_tests_conducted: 12,
      student_participation_rate: 91.2,
      average_mcq_score_pct: 70.8,
      average_descriptive_score_pct: 65.5,
      pass_percentage: 82.0,
    },
    cognitive_rigor_distribution: {
      foundational_k1_k2_pct: 56.4,
      analytical_k3_k4_pct: 43.6,
      total_questions_analyzed: 360,
    },
    performance_tiers: {
      excellent_above_80: 95,
      good_60_to_80: 110,
      average_40_to_60: 55,
      needs_improvement_below_40: 30,
    },
  },
  5: {
    department_id: 5,
    academic_year: "2025-2026",
    summary: {
      total_mcq_tests_conducted: 10,
      student_participation_rate: 90.0,
      average_mcq_score_pct: 69.5,
      average_descriptive_score_pct: 64.2,
      pass_percentage: 80.5,
    },
    cognitive_rigor_distribution: {
      foundational_k1_k2_pct: 58.0,
      analytical_k3_k4_pct: 42.0,
      total_questions_analyzed: 300,
    },
    performance_tiers: {
      excellent_above_80: 70,
      good_60_to_80: 85,
      average_40_to_60: 42,
      needs_improvement_below_40: 23,
    },
  },
  6: {
    department_id: 6,
    academic_year: "2025-2026",
    summary: {
      total_mcq_tests_conducted: 15,
      student_participation_rate: 97.4,
      average_mcq_score_pct: 82.5,
      average_descriptive_score_pct: 76.0,
      pass_percentage: 92.8,
    },
    cognitive_rigor_distribution: {
      foundational_k1_k2_pct: 36.0,
      analytical_k3_k4_pct: 64.0,
      total_questions_analyzed: 450,
    },
    performance_tiers: {
      excellent_above_80: 118,
      good_60_to_80: 82,
      average_40_to_60: 20,
      needs_improvement_below_40: 10,
    },
  },
};

// ==========================================
// Service API Methods with Graceful Fallback
// ==========================================

export const academicAdminService = {
  /**
   * Fetch filter options (Academic years, Departments, Exam scopes)
   */
  async getFilters(orgId = 1): Promise<AcademicFiltersResponse> {
    try {
      const response = await commonInstance().get(`${ORG_API_BASE}/filters`, {
        params: { organization_id: orgId },
        timeout: 2500,
      });
      if (response?.data) return response.data;
    } catch {
      // Fallback seamlessly to mock
    }
    return MOCK_FILTERS;
  },

  /**
   * Level 1: Fetch Executive KPI summary
   */
  async getKpiSummary(orgId = 1, academicYear?: string): Promise<AcademicKpiSummary> {
    try {
      const response = await commonInstance().get(`${COURSE_API_BASE}/dashboard/kpi-summary`, {
        params: { organization_id: orgId, academic_year: academicYear },
        timeout: 2500,
      });
      if (response?.data) return response.data;
    } catch {
      // Fallback
    }
    return {
      ...MOCK_KPI_SUMMARY,
      academic_year: academicYear || MOCK_KPI_SUMMARY.academic_year,
    };
  },

  /**
   * Level 1: Fetch College-Wide Bloom K1-K6 Distribution
   */
  async getBloomDistribution(orgId = 1, academicYear?: string): Promise<BloomDistributionResponse> {
    try {
      const response = await commonInstance().get(`${COURSE_API_BASE}/dashboard/bloom-distribution`, {
        params: { organization_id: orgId, academic_year: academicYear },
        timeout: 2500,
      });
      if (response?.data) return response.data;
    } catch {
      // Fallback
    }
    return {
      ...MOCK_BLOOM_DISTRIBUTION,
      academic_year: academicYear || MOCK_BLOOM_DISTRIBUTION.academic_year,
    };
  },

  /**
   * Level 1: Fetch Internal vs External Pass Percentages across departments
   */
  async getPassPercentages(orgId = 1, academicYear?: string): Promise<PassPercentagesResponse> {
    try {
      const response = await commonInstance().get(`${COURSE_API_BASE}/dashboard/pass-percentages`, {
        params: { organization_id: orgId, academic_year: academicYear },
        timeout: 2500,
      });
      if (response?.data) return response.data;
    } catch {
      // Fallback
    }
    return {
      ...MOCK_PASS_PERCENTAGES,
      academic_year: academicYear || MOCK_PASS_PERCENTAGES.academic_year,
    };
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
    try {
      const deptIdsParam = departmentIds && departmentIds.length > 0 ? departmentIds.join(",") : undefined;
      const response = await commonInstance().get(`${COURSE_API_BASE}/departments/bloom-comparison`, {
        params: {
          organization_id: orgId,
          academic_year: academicYear,
          department_ids: deptIdsParam,
          exam_scope: examScope,
        },
        timeout: 2500,
      });
      if (response?.data) return response.data;
    } catch {
      // Fallback
    }

    let filteredDepts = MOCK_DEPARTMENT_BLOOM_COMPARISON.departments_data;
    if (departmentIds && departmentIds.length > 0) {
      filteredDepts = filteredDepts.filter((d) => departmentIds.includes(d.department_id));
    }

    return {
      academic_year: academicYear || MOCK_DEPARTMENT_BLOOM_COMPARISON.academic_year,
      exam_scope: examScope,
      categories: ["K1", "K2", "K3", "K4", "K5", "K6"],
      departments_data: filteredDepts,
    };
  },

  /**
   * Level 3: Fetch Courses Matrix for a Department
   */
  async getCoursesMatrix(
    departmentId: number,
    academicYear?: string,
    semester?: number
  ): Promise<CoursesMatrixResponse> {
    try {
      const response = await commonInstance().get(
        `${COURSE_API_BASE}/departments/${departmentId}/courses-matrix`,
        {
          params: { academic_year: academicYear, semester },
          timeout: 2500,
        }
      );
      if (response?.data) return response.data;
    } catch {
      // Fallback
    }

    const fallbackData = MOCK_COURSES_BY_DEPT[departmentId] || MOCK_COURSES_BY_DEPT[1];
    let courses = fallbackData.courses;
    if (semester) {
      courses = courses.filter((c) => c.semester === semester);
    }

    return {
      ...fallbackData,
      department_id: departmentId,
      academic_year: academicYear || fallbackData.academic_year,
      courses,
    };
  },

  /**
   * Level 3: Fetch MCQ Assessment Analytics for a Department / Course
   */
  async getMcqAnalytics(
    departmentId: number,
    academicYear?: string,
    courseId?: number
  ): Promise<McqAnalyticsResponse> {
    try {
      const response = await commonInstance().get(
        `${COURSE_API_BASE}/departments/${departmentId}/mcq-analytics`,
        {
          params: { academic_year: academicYear, course_id: courseId },
          timeout: 2500,
        }
      );
      if (response?.data) return response.data;
    } catch {
      // Fallback
    }

    const fallback = MOCK_MCQ_ANALYTICS_BY_DEPT[departmentId] || MOCK_MCQ_ANALYTICS_BY_DEPT[1];
    return {
      ...fallback,
      department_id: departmentId,
      academic_year: academicYear || fallback.academic_year,
    };
  },
};
