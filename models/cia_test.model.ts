import instance, { commonInstance } from '@/utils/axios.utils';
import { CreateCIATestPayload, UpdateCIATestPayload } from '@/types/cia-test.types';

const cia_test = {
  // 1. List CIA Tests under a Course (handles active vs archived filter)
  listByCourse: (courseId: number | string, params?: { is_archived?: boolean; semester?: number; academic_year?: string; status?: string }) => {
    return new Promise((resolve, reject) => {
      let url = `courses/${courseId}/cia-tests`;
      const searchParams = new URLSearchParams();

      if (params?.is_archived !== undefined) {
        searchParams.append('is_archived', String(params.is_archived));
      }
      if (params?.semester) {
        searchParams.append('semester', String(params.semester));
      }
      if (params?.academic_year) {
        searchParams.append('academic_year', String(params.academic_year));
      }
      if (params?.status) {
        searchParams.append('status', String(params.status));
      }

      if (searchParams.toString()) {
        url += `?${searchParams.toString()}`;
      }

      instance()
        .get(url)
        .then((res) => resolve(res.data))
        .catch((error) => {
          if (error?.response?.data) {
            reject(error.response.data);
          } else {
            reject(error);
          }
        });
    });
  },

  // 2. Create CIA Test at Course level
  create: (courseId: number | string, payload: CreateCIATestPayload) => {
    return new Promise((resolve, reject) => {
      const url = `courses/${courseId}/cia-tests`;
      instance()
        .post(url, payload)
        .then((res) => resolve(res.data))
        .catch((error) => {
          if (error?.response?.data) {
            reject(error.response.data);
          } else {
            reject(error);
          }
        });
    });
  },

  // 3. Get full details of a CIA test
  details: (testId: number | string) => {
    return new Promise((resolve, reject) => {
      const url = `cia-tests/${testId}`;
      instance()
        .get(url)
        .then((res) => resolve(res.data))
        .catch((error) => {
          if (error?.response?.data) {
            reject(error.response.data);
          } else {
            reject(error);
          }
        });
    });
  },

  // 4. Update CIA Test metadata
  update: (testId: number | string, payload: UpdateCIATestPayload) => {
    return new Promise((resolve, reject) => {
      const url = `cia-tests/${testId}`;
      instance()
        .patch(url, payload)
        .then((res) => resolve(res.data))
        .catch((error) => {
          if (error?.response?.data) {
            reject(error.response.data);
          } else {
            reject(error);
          }
        });
    });
  },

  // 5. Assign / Sync course instances (sections)
  assignInstances: (testId: number | string, courseInstanceIds: number[]) => {
    return new Promise((resolve, reject) => {
      const url = `cia-tests/${testId}/course-instances`;
      instance()
        .put(url, { course_instance_ids: courseInstanceIds })
        .then((res) => resolve(res.data))
        .catch((error) => {
          if (error?.response?.data) {
            reject(error.response.data);
          } else {
            reject(error);
          }
        });
    });
  },

  // 6. Assign / Update Question paper & template
  assignQuestionPaper: (
    testId: number | string,
    payload: {
      question_paper_template_id?: number | null;
      question_paper_id?: number | null;
      question_paper_file_url?: string | null;
    }
  ) => {
    return new Promise((resolve, reject) => {
      const url = `cia-tests/${testId}/question-paper-assignment`;
      instance()
        .put(url, payload)
        .then((res) => resolve(res.data))
        .catch((error) => {
          if (error?.response?.data) {
            reject(error.response.data);
          } else {
            reject(error);
          }
        });
    });
  },

  // 7. Archive CIA Test
  archive: (testId: number | string) => {
    return new Promise((resolve, reject) => {
      const url = `cia-tests/${testId}/archive`;
      instance()
        .post(url)
        .then((res) => resolve(res.data))
        .catch((error) => {
          if (error?.response?.data) {
            reject(error.response.data);
          } else {
            reject(error);
          }
        });
    });
  },

  // 8. Unarchive / Restore CIA Test
  unarchive: (testId: number | string) => {
    return new Promise((resolve, reject) => {
      const url = `cia-tests/${testId}/unarchive`;
      instance()
        .post(url)
        .then((res) => resolve(res.data))
        .catch((error) => {
          if (error?.response?.data) {
            reject(error.response.data);
          } else {
            reject(error);
          }
        });
    });
  },

  // 9. Delete Draft CIA Test
  delete: (testId: number | string) => {
    return new Promise((resolve, reject) => {
      const url = `cia-tests/${testId}`;
      instance()
        .delete(url)
        .then((res) => resolve(res.data))
        .catch((error) => {
          if (error?.response?.data) {
            reject(error.response.data);
          } else {
            reject(error);
          }
        });
    });
  },

  // 10. Fetch available course instances (sections) for a course
  getCourseInstances: (courseId: number | string) => {
    return new Promise((resolve, reject) => {
      // Primary route from integration guide: /api/v1/course-instances/?course_id={courseId}&is_archived=false
      const url = `course-instances/?course_id=${courseId}&is_archived=false`;
      instance()
        .get(url)
        .then((res) => resolve(res.data))
        .catch(() => {
          // Fallback to courses/{id}/course-instances
          instance()
            .get(`courses/${courseId}/course-instances?is_archived=false`)
            .then((res) => resolve(res.data))
            .catch((err) => {
              if (err?.response?.data) reject(err.response.data);
              else reject(err);
            });
        });
    });
  },

  // 11. Fetch extraction / blueprint templates
  // GET /course/organization/cia-templates
  getTemplates: () => {
    return new Promise((resolve) => {
      commonInstance()
        .get("course/organization/cia-templates")
        .then((res) => resolve(res.data))
        .catch(() => resolve([]));
    });
  },

  // 12. Fetch question papers for syllabus
  // GET /course/syllabi/{syllabusId}/cia-papers
  getQuestionPapers: (syllabusId: number | string) => {
    return new Promise((resolve) => {
      if (!syllabusId) return resolve([]);
      commonInstance()
        .get(`course/syllabi/${syllabusId}/cia-papers`)
        .then((res) => resolve(res.data))
        .catch(() => resolve([]));
    });
  },

  // 13. Section-Partitioned Student Marksheets
  // GET /api/v1/cia-tests/{ciaTestId}/instances/{instanceId}/students
  getInstanceStudents: (testId: number | string, instanceId: number | string) => {
    return new Promise((resolve, reject) => {
      const url = `cia-tests/${testId}/instances/${instanceId}/students`;
      instance()
        .get(url)
        .then((res) => resolve(res.data))
        .catch((error) => reject(error?.response?.data || error));
    });
  },

  // 14. Filter Marks by Section
  // GET /api/v1/cia-tests/{ciaTestId}/marks?course_instance_id={instanceId}
  getInstanceMarks: (testId: number | string, instanceId?: number | string) => {
    return new Promise((resolve, reject) => {
      let url = `cia-tests/${testId}/marks`;
      if (instanceId) url += `?course_instance_id=${instanceId}`;
      instance()
        .get(url)
        .then((res) => resolve(res.data))
        .catch((error) => reject(error?.response?.data || error));
    });
  },

  // =========================================================================
  // QUESTION PAPER TEMPLATES (COURSE-LEVEL BLUEPRINTS)
  // =========================================================================

  // 15. List templates for a course
  // GET /api/v1/courses/{course_id}/question-paper-templates?status={status}
  listCourseTemplates: (courseId: number | string, status?: string) => {
    return new Promise((resolve, reject) => {
      let url = `courses/${courseId}/question-paper-templates`;
      if (status) url += `?status=${status}`;
      instance()
        .get(url)
        .then((res) => resolve(res.data))
        .catch((error) => reject(error?.response?.data || error));
    });
  },

  // 16. Create a new question paper template for a course
  // POST /api/v1/courses/{course_id}/question-paper-templates
  createTemplate: (courseId: number | string, payload: any) => {
    return new Promise((resolve, reject) => {
      const url = `courses/${courseId}/question-paper-templates`;
      instance()
        .post(url, payload)
        .then((res) => resolve(res.data))
        .catch((error) => reject(error?.response?.data || error));
    });
  },

  // 17. Get question paper template details
  // GET /api/v1/question-paper-templates/{template_id}
  getTemplateDetails: (templateId: number | string) => {
    return new Promise((resolve, reject) => {
      const url = `question-paper-templates/${templateId}`;
      instance()
        .get(url)
        .then((res) => resolve(res.data))
        .catch((error) => reject(error?.response?.data || error));
    });
  },

  // 18. Update question paper template
  // PATCH /api/v1/question-paper-templates/{template_id}
  updateTemplate: (templateId: number | string, payload: any) => {
    return new Promise((resolve, reject) => {
      const url = `question-paper-templates/${templateId}`;
      instance()
        .patch(url, payload)
        .then((res) => resolve(res.data))
        .catch((error) => reject(error?.response?.data || error));
    });
  },

  // 19. Delete question paper template
  // DELETE /api/v1/question-paper-templates/{template_id}
  deleteTemplate: (templateId: number | string) => {
    return new Promise((resolve, reject) => {
      const url = `question-paper-templates/${templateId}`;
      instance()
        .delete(url)
        .then((res) => resolve(res.data))
        .catch((error) => reject(error?.response?.data || error));
    });
  },

  // 20. Check assigned CIA tests for template
  // GET /api/v1/question-paper-templates/{template_id}/assigned-tests
  getTemplateAssignedTests: (templateId: number | string) => {
    return new Promise((resolve, reject) => {
      const url = `question-paper-templates/${templateId}/assigned-tests`;
      instance()
        .get(url)
        .then((res) => resolve(res.data))
        .catch((error) => reject(error?.response?.data || error));
    });
  },
};

export default cia_test;

