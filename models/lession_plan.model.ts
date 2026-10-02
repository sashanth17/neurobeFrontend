import { commonInstance } from '@/utils/axios.utils';

const lession_plan = {
  generate: (payload: { extractions_id: number; target_total_hours?: number }) => {
    return new Promise((resolve, reject) => {
      commonInstance()
        .post(`course/lesson-plans/generate`, payload)
        .then((res) => resolve(res.data))
        .catch((error) => {
          reject(error.response?.data?.detail || error.response?.data?.message || error.message || error);
        });
    });
  },

  get: (lesson_plan_id: number | string) => {
    return new Promise((resolve, reject) => {
      commonInstance()
        .get(`course/lesson-plans/${lesson_plan_id}`)
        .then((res) => resolve(res.data))
        .catch((error) => {
          reject(error.response?.data?.detail || error.response?.data?.message || error.message || error);
        });
    });
  },

  list: (params?: { course_id?: number | string; extractions_id?: number | string }) => {
    return new Promise((resolve, reject) => {
      const q = new URLSearchParams();
      if (params?.course_id) q.append("course_id", String(params.course_id));
      if (params?.extractions_id) q.append("extractions_id", String(params.extractions_id));
      commonInstance()
        .get(`course/lesson-plans?${q.toString()}`)
        .then((res) => resolve(res.data))
        .catch((error) => {
          reject(error.response?.data?.detail || error.response?.data?.message || error.message || error);
        });
    });
  },

  approve: (lesson_plan_id: number | string) => {
    return new Promise((resolve, reject) => {
      commonInstance()
        .patch(`course/lesson-plans/${lesson_plan_id}/approve`)
        .then((res) => resolve(res.data))
        .catch((error) => {
          reject(error.response?.data?.detail || error.response?.data?.message || error.message || error);
        });
    });
  },

  activate: (lesson_plan_id: number | string) => {
    return new Promise((resolve, reject) => {
      commonInstance()
        .patch(`course/lesson-plans/${lesson_plan_id}/activate`)
        .then((res) => resolve(res.data))
        .catch((error) => {
          reject(error.response?.data?.detail || error.response?.data?.message || error.message || error);
        });
    });
  },

  update_hours: (lesson_plan_id: number | string, data: { target_total_hours?: number; total_theory_hours?: number; total_lab_hours?: number }) => {
    return new Promise((resolve, reject) => {
      commonInstance()
        .patch(`course/lesson-plans/${lesson_plan_id}`, data)
        .then((res) => resolve(res.data))
        .catch((error) => {
          reject(error.response?.data?.detail || error.response?.data?.message || error.message || error);
        });
    });
  },

  update_topic_slot: (lesson_plan_id: number | string, slot_id: number | string, data: any) => {
    return new Promise((resolve, reject) => {
      commonInstance()
        .patch(`course/lesson-plans/${lesson_plan_id}/topic-slots/${slot_id}`, data)
        .then((res) => resolve(res.data))
        .catch((error) => {
          reject(error.response?.data?.detail || error.response?.data?.message || error.message || error);
        });
    });
  },

  update_subtopic_slot: (lesson_plan_id: number | string, slot_id: number | string, data: any) => {
    return new Promise((resolve, reject) => {
      commonInstance()
        .patch(`course/lesson-plans/${lesson_plan_id}/subtopic-slots/${slot_id}`, data)
        .then((res) => resolve(res.data))
        .catch((error) => {
          reject(error.response?.data?.detail || error.response?.data?.message || error.message || error);
        });
    });
  },

  delete: (lesson_plan_id: number | string) => {
    return new Promise((resolve, reject) => {
      commonInstance()
        .delete(`course/lesson-plans/${lesson_plan_id}`)
        .then((res) => resolve(res.data))
        .catch((error) => {
          reject(error.response?.data?.detail || error.response?.data?.message || error.message || error);
        });
    });
  },

  // Legacy fallback
  generate_teating_timeline: (extractions_id: any) => {
    return lession_plan.generate({ extractions_id: Number(extractions_id) });
  },
};

export default lession_plan;
