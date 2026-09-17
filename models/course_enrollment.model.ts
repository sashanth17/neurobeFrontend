import instance from '@/utils/axios.utils';

export interface CourseEnrollmentPayload {
  course_instance_id?: number;
  course_id?: number;
  student_ids?: string[];
  student_id?: string;
  enrollment_status?: 'Active' | 'Dropped';
}

const course_enrollment = {
  list: (params?: { course_instance_id?: number; course_id?: number; page?: number }) => {
    return new Promise((resolve, reject) => {
      let url = `course-enrollments/`;
      const queryParams = new URLSearchParams();

      if (params?.course_instance_id) {
        queryParams.append("course_instance_id", String(params.course_instance_id));
      }
      if (params?.course_id) {
        queryParams.append("course_id", String(params.course_id));
      }
      if (params?.page) {
        queryParams.append("page", String(params.page));
      }

      if (queryParams.toString()) {
        url += `?${queryParams.toString()}`;
      }

      instance()
        .get(url)
        .then((res) => resolve(res.data))
        .catch((error) => {
          if (error.response) {
            reject(error.response.data?.message || error.response.data?.detail || error.response.data);
          } else {
            reject(error);
          }
        });
    });
  },

  getAvailableStudents: (params?: { department_id?: number | string; batch_id?: number | string }) => {
    return new Promise((resolve, reject) => {
      let url = `students/`;
      const queryParams = new URLSearchParams();

      if (params?.department_id && params.department_id !== "all") {
        queryParams.append("department_id", String(params.department_id));
      }
      if (params?.batch_id && params.batch_id !== "all") {
        queryParams.append("batch_id", String(params.batch_id));
      }

      if (queryParams.toString()) {
        url += `?${queryParams.toString()}`;
      }

      instance()
        .get(url)
        .then((res) => resolve(res.data))
        .catch((error) => {
          if (error.response) {
            reject(error.response.data?.message || error.response.data?.detail || error.response.data);
          } else {
            reject(error);
          }
        });
    });
  },

  enroll: (data: CourseEnrollmentPayload) => {
    return new Promise((resolve, reject) => {
      const url = `course-enrollments/`;
      instance()
        .post(url, data)
        .then((res) => resolve(res.data))
        .catch((error) => {
          if (error.response) {
            reject(error.response.data?.message || error.response.data?.detail || error.response.data);
          } else {
            reject(error);
          }
        });
    });
  },

  bulkUpload: (formData: FormData) => {
    return new Promise((resolve, reject) => {
      const url = `course-enrollments/bulk-upload`;
      instance()
        .post(url, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        })
        .then((res) => resolve(res.data))
        .catch((error) => {
          if (error.response) {
            reject(error.response.data?.message || error.response.data?.detail || error.response.data);
          } else {
            reject(error);
          }
        });
    });
  },

  updateStatus: (id: number | string, enrollment_status: 'Active' | 'Dropped') => {
    return new Promise((resolve, reject) => {
      const url = `course-enrollments/${id}`;
      instance()
        .patch(url, { enrollment_status })
        .then((res) => resolve(res.data))
        .catch((error) => {
          if (error.response) {
            reject(error.response.data?.message || error.response.data?.detail || error.response.data);
          } else {
            reject(error);
          }
        });
    });
  },

  delete: (id: number | string) => {
    return new Promise((resolve, reject) => {
      const url = `course-enrollments/${id}`;
      instance()
        .delete(url)
        .then((res) => resolve(res.data))
        .catch((error) => {
          if (error.response) {
            reject(error.response.data?.message || error.response.data?.detail || error.response.data);
          } else {
            reject(error);
          }
        });
    });
  },
};

export default course_enrollment;
