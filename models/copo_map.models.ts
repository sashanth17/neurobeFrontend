import { commonInstance } from "@/utils/axios.utils";

export interface COPOCellUpdatePayload {
  matrix_value?: number;
  justification?: string;
}

export interface COPOGeneratePayload {
  extractions_id: number;
}

const COPOMap = {
  generate: (payload: { extractions_id: number }) => {
    return new Promise((resolve, reject) => {
      commonInstance()
        .post(`course/copo/generate`, payload)
        .then((res) => resolve(res.data))
        .catch((error) => {
          reject(error.response?.data?.detail || error.response?.data?.message || error.message || error);
        });
    });
  },

  get: (copo_id: number | string) => {
    return new Promise((resolve, reject) => {
      commonInstance()
        .get(`course/copo/${copo_id}`)
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
        .get(`course/copo?${q.toString()}`)
        .then((res) => resolve(res.data))
        .catch((error) => {
          reject(error.response?.data?.detail || error.response?.data?.message || error.message || error);
        });
    });
  },

  approve: (copo_id: number | string) => {
    return new Promise((resolve, reject) => {
      commonInstance()
        .patch(`course/copo/${copo_id}/approve`)
        .then((res) => resolve(res.data))
        .catch((error) => {
          reject(error.response?.data?.detail || error.response?.data?.message || error.message || error);
        });
    });
  },

  activate: (copo_id: number | string) => {
    return new Promise((resolve, reject) => {
      commonInstance()
        .patch(`course/copo/${copo_id}/activate`)
        .then((res) => resolve(res.data))
        .catch((error) => {
          reject(error.response?.data?.detail || error.response?.data?.message || error.message || error);
        });
    });
  },

  update_matrix_cell: (copo_id: number | string, cell_id: number | string, data: COPOCellUpdatePayload) => {
    return new Promise((resolve, reject) => {
      commonInstance()
        .patch(`course/copo/${copo_id}/matrix/${cell_id}`, data)
        .then((res) => resolve(res.data))
        .catch((error) => {
          reject(error.response?.data?.detail || error.response?.data?.message || error.message || error);
        });
    });
  },

  delete_version: (copo_id: number | string) => {
    return new Promise((resolve, reject) => {
      commonInstance()
        .delete(`course/copo/${copo_id}`)
        .then((res) => resolve(res.data))
        .catch((error) => {
          reject(error.response?.data?.detail || error.response?.data?.message || error.message || error);
        });
    });
  },

  // Legacy compatibility helpers
  generate_copo: (courseId: string | number, body?: any) => {
    const extractionsId = body?.extractions_id || body?.parent_extraction_id || body?.extraction_id;
    return COPOMap.generate({ extractions_id: Number(extractionsId) });
  },

  copo_map: (courseId: string | number, version_number?: number | null) => {
    return COPOMap.list({ course_id: courseId });
  },

  approve_map: (copo_id: string | number) => {
    return COPOMap.approve(copo_id);
  },

  activate_version: (copo_id: string | number) => {
    return COPOMap.activate(copo_id);
  },
};

export default COPOMap;