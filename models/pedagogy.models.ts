import { commonInstance } from '@/utils/axios.utils';

const pedagogy = {
  generate: (payload: { extractions_id: number }) => {
    return new Promise((resolve, reject) => {
      commonInstance()
        .post(`course/pedagogies/generate`, payload)
        .then((res) => resolve(res.data))
        .catch((error) => {
          reject(error.response?.data?.detail || error.response?.data?.message || error.message || error);
        });
    });
  },

  get: (pedagogy_id: number | string) => {
    return new Promise((resolve, reject) => {
      commonInstance()
        .get(`course/pedagogies/${pedagogy_id}`)
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
        .get(`course/pedagogies?${q.toString()}`)
        .then((res) => resolve(res.data))
        .catch((error) => {
          reject(error.response?.data?.detail || error.response?.data?.message || error.message || error);
        });
    });
  },

  approve: (pedagogy_id: number | string) => {
    return new Promise((resolve, reject) => {
      commonInstance()
        .patch(`course/pedagogies/${pedagogy_id}/approve`)
        .then((res) => resolve(res.data))
        .catch((error) => {
          reject(error.response?.data?.detail || error.response?.data?.message || error.message || error);
        });
    });
  },

  activate: (pedagogy_id: number | string) => {
    return new Promise((resolve, reject) => {
      commonInstance()
        .patch(`course/pedagogies/${pedagogy_id}/activate`)
        .then((res) => resolve(res.data))
        .catch((error) => {
          reject(error.response?.data?.detail || error.response?.data?.message || error.message || error);
        });
    });
  },

  update_topic_suggestion: (pedagogy_id: number | string, suggestion_id: number | string, data: any) => {
    return new Promise((resolve, reject) => {
      commonInstance()
        .patch(`course/pedagogies/${pedagogy_id}/topic-suggestions/${suggestion_id}`, data)
        .then((res) => resolve(res.data))
        .catch((error) => {
          reject(error.response?.data?.detail || error.response?.data?.message || error.message || error);
        });
    });
  },

  update_subtopic_suggestion: (pedagogy_id: number | string, suggestion_id: number | string, data: any) => {
    return new Promise((resolve, reject) => {
      commonInstance()
        .patch(`course/pedagogies/${pedagogy_id}/subtopic-suggestions/${suggestion_id}`, data)
        .then((res) => resolve(res.data))
        .catch((error) => {
          reject(error.response?.data?.detail || error.response?.data?.message || error.message || error);
        });
    });
  },

  delete: (pedagogy_id: number | string) => {
    return new Promise((resolve, reject) => {
      commonInstance()
        .delete(`course/pedagogies/${pedagogy_id}`)
        .then((res) => resolve(res.data))
        .catch((error) => {
          reject(error.response?.data?.detail || error.response?.data?.message || error.message || error);
        });
    });
  },
};

export default pedagogy;