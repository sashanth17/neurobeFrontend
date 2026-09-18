import instance from '@/utils/axios.utils';
import { getOrganizationId } from '@/utils/function.utils';

export interface CourseAssignmentsResponse {
  course_id: number;
  course_code: string;
  course_title: string;
  coordinator: {
    id: number;
    faculty_id: number;
    name: string;
    email: string;
    register_number?: string;
    role: string;
    is_active?: boolean;
    assigned_on?: string;
    assigned_by_id?: number | null;
  } | null;
  instructors: Array<{
    id: number;
    faculty_id: number;
    name: string;
    email: string;
    register_number?: string;
    role: string;
    is_active?: boolean;
    assigned_on?: string;
    assigned_by_id?: number | null;
  }>;
  total_instructors: number;
}

const faculty = {
  dropdown: (body?: any) => {
    return new Promise<any[]>((resolve, reject) => {
      let url = `faculties/dropdown`;
      const params = new URLSearchParams();

      const orgId = body?.organization_id || getOrganizationId();
      if (orgId) {
        params.append("organization_id", String(orgId));
      }
      if (body?.department_id) {
        params.append("department_id", String(body.department_id));
      }
      if (body?.search) {
        params.append("search", String(body.search));
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      instance()
        .get(url)
        .then((res) => {
          const data = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
          resolve(data);
        })
        .catch((error) => {
          reject(error.response?.data?.message || error.response?.data || error);
        });
    });
  },

  list: (body?: any) => {
    return new Promise<any[]>((resolve, reject) => {
      let url = `faculties/`;
      const params = new URLSearchParams();

      const orgId = body?.organization_id || getOrganizationId();
      if (orgId) {
        params.append("organization_id", String(orgId));
      }
      if (body?.department_id) {
        params.append("department_id", String(body.department_id));
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      instance()
        .get(url)
        .then((res) => {
          const data = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
          resolve(data);
        })
        .catch((error) => {
          reject(error.response?.data?.message || error.response?.data || error);
        });
    });
  },

  getCourseAssignments: (courseId: number | string) => {
    return new Promise<CourseAssignmentsResponse>((resolve, reject) => {
      const url = `faculties/course-assignments/${courseId}`;
      instance()
        .get(url)
        .then((res) => resolve(res.data))
        .catch((error) => {
          reject(error.response?.data?.message || error.response?.data || error);
        });
    });
  },

  patchCourseAssignments: (
    courseId: number | string,
    data: {
      coordinator_id?: number | null;
      remove_coordinator?: boolean;
      add_instructor_ids?: number[];
      remove_instructor_ids?: number[];
      set_instructor_ids?: number[];
    }
  ) => {
    return new Promise<CourseAssignmentsResponse>((resolve, reject) => {
      const url = `faculties/course-assignments/${courseId}`;
      instance()
        .patch(url, data)
        .then((res) => resolve(res.data))
        .catch((error) => {
          reject(error.response?.data?.message || error.response?.data || error);
        });
    });
  },

  assignCoordinator: (data: { course_id: number; faculty_id: number }) => {
    return new Promise<any>((resolve, reject) => {
      const url = `faculties/course-coordinator`;
      instance()
        .post(url, data)
        .then((res) => resolve(res.data))
        .catch((error) => {
          reject(error.response?.data?.message || error.response?.data || error);
        });
    });
  },

  replaceCoordinator: (courseId: number | string, data: { faculty_id: number }) => {
    return new Promise<any>((resolve, reject) => {
      const url = `faculties/course-coordinator/${courseId}`;
      instance()
        .put(url, data)
        .then((res) => resolve(res.data))
        .catch((error) => {
          reject(error.response?.data?.message || error.response?.data || error);
        });
    });
  },

  removeCoordinator: (courseId: number | string) => {
    return new Promise<any>((resolve, reject) => {
      const url = `faculties/course-coordinator/${courseId}`;
      instance()
        .delete(url)
        .then((res) => resolve(res.data))
        .catch((error) => {
          reject(error.response?.data?.message || error.response?.data || error);
        });
    });
  },

  assignInstructors: (data: { course_id: number; faculty_ids: number[] }) => {
    return new Promise<any>((resolve, reject) => {
      const url = `faculties/course-instructors`;
      instance()
        .post(url, data)
        .then((res) => resolve(res.data))
        .catch((error) => {
          reject(error.response?.data?.message || error.response?.data || error);
        });
    });
  },

  setInstructors: (courseId: number | string, data: { faculty_ids: number[] }) => {
    return new Promise<any>((resolve, reject) => {
      const url = `faculties/course-instructors/${courseId}`;
      instance()
        .put(url, data)
        .then((res) => resolve(res.data))
        .catch((error) => {
          reject(error.response?.data?.message || error.response?.data || error);
        });
    });
  },

  removeInstructor: (courseId: number | string, facultyId: number) => {
    return new Promise<any>((resolve, reject) => {
      const url = `faculties/course-instructors/${courseId}?faculty_id=${facultyId}`;
      instance()
        .delete(url)
        .then((res) => resolve(res.data))
        .catch((error) => {
          reject(error.response?.data?.message || error.response?.data || error);
        });
    });
  },

  downloadInstructorTemplate: (format: string = 'xlsx') => {
    return new Promise<any>((resolve, reject) => {
      const url = `faculties/excel-instructors/template?format=${format}`;
      instance()
        .get(url, { responseType: 'blob' })
        .then((res) => resolve(res))
        .catch(async (error) => {
          if (error.response?.data instanceof Blob) {
            try {
              const text = await error.response.data.text();
              const json = JSON.parse(text);
              reject(json.message || json.error || text);
              return;
            } catch {
              // Non-JSON blob error
            }
          }
          reject(error.response?.data?.message || error.response?.data || error);
        });
    });
  },

  validateInstructorImport: (file: File, courseId: number | string) => {
    return new Promise<any>((resolve, reject) => {
      const url = `faculties/excel-instructors/validate`;
      const fd = new FormData();
      fd.append('file', file);
      fd.append('course_id', String(courseId));
      instance()
        .post(url, fd)
        .then((res) => resolve(res.data))
        .catch((error) => {
          reject(error.response?.data?.message || error.response?.data || error);
        });
    });
  },

  importInstructors: (file: File, courseId: number | string) => {
    return new Promise<any>((resolve, reject) => {
      const url = `faculties/excel-instructors/import`;
      const fd = new FormData();
      fd.append('file', file);
      fd.append('course_id', String(courseId));
      instance()
        .post(url, fd)
        .then((res) => resolve(res.data))
        .catch((error) => {
          reject(error.response?.data?.message || error.response?.data || error);
        });
    });
  },
};

export default faculty;
