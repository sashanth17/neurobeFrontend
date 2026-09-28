import instance from '@/utils/axios.utils';
import { getOrganizationId } from '@/utils/function.utils';

export interface StudentDashboardResponse {
  status: string;
  student: {
    id: string;
    enrollment_number: string;
    register_number: string;
    user_id: number;
    first_name: string;
    last_name: string;
    full_name: string;
    email: string;
    department_id?: number;
    department_name?: string;
    programme_id?: number;
    programme_name?: string;
    batch_id?: number;
    batch_name?: string;
    semester?: number;
  } | null;
  stats: {
    total_tests: number;
    upcoming_tests: number;
    live_tests: number;
    completed_tests: number;
    enrolled_courses_count: number;
  };
  enrolled_courses: Array<{
    course_id: number;
    course_instance_id?: number;
    course_code: string;
    course_name: string;
    instance_name?: string;
    semester?: number;
    credits?: number;
    enrollment_status?: string;
    enrolled_on?: string;
  }>;
  scheduled_tests: Array<{
    id: string;
    raw_id: string;
    source: string;
    title: string;
    test_code: string;
    test_type: string;
    description: string;
    course_id: number;
    course_code: string;
    course_name: string;
    course_instance_id?: number;
    course_instance_name?: string;
    test_date?: string;
    start_time?: string;
    end_time?: string;
    duration_minutes: number;
    total_marks: number;
    status: 'Upcoming' | 'Live' | 'Completed' | 'Draft' | 'Cancelled';
    raw_status?: string;
    have_viva?: boolean;
    question_count?: number;
    topics?: string[];
    can_start?: boolean;
  }>;
}

const student = {
  getDashboard: (params?: { student_id?: string }) => {
    return new Promise<StudentDashboardResponse>((resolve, reject) => {
      let url = 'students/me/dashboard';
      const searchParams = new URLSearchParams();
      if (params?.student_id) {
        searchParams.append('student_id', params.student_id);
      }
      const query = searchParams.toString();
      if (query) {
        url += `?${query}`;
      }

      instance()
        .get(url)
        .then((res) => {
          resolve(res.data);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },

  getScheduledTests: (params?: {
    student_id?: string;
    status?: string;
    course_id?: number;
  }) => {
    return new Promise<any>((resolve, reject) => {
      let url = 'students/me/scheduled-tests';
      const searchParams = new URLSearchParams();
      if (params?.student_id) searchParams.append('student_id', params.student_id);
      if (params?.status) searchParams.append('status', params.status);
      if (params?.course_id) searchParams.append('course_id', String(params.course_id));

      const query = searchParams.toString();
      if (query) {
        url += `?${query}`;
      }

      instance()
        .get(url)
        .then((res) => {
          resolve(res.data);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },

  list: (params?: any) => {
    return new Promise<any[]>((resolve, reject) => {
      let url = 'students/';
      const searchParams = new URLSearchParams();
      const orgId = params?.organization_id || getOrganizationId();
      if (orgId) searchParams.append('organization_id', String(orgId));
      if (params?.skip !== undefined) searchParams.append('skip', String(params.skip));
      if (params?.limit !== undefined) searchParams.append('limit', String(params.limit));
      if (params?.search) searchParams.append('search', params.search);

      const query = searchParams.toString();
      if (query) url += `?${query}`;

      instance()
        .get(url)
        .then((res) => resolve(res.data))
        .catch((err) => reject(err));
    });
  },

  getById: (id: string) => {
    return new Promise<any>((resolve, reject) => {
      instance()
        .get(`students/${id}`)
        .then((res) => resolve(res.data))
        .catch((err) => reject(err));
    });
  },
};

export default student;
