import { commonInstance } from "@/utils/axios.utils";

export interface COPSOCellUpdatePayload {
  matrix_value?: number;
  justification?: string;
}

export interface COPSOGeneratePayload {
  extractions_id: number;
  department_id: number;
}

export interface DepartmentCoPsoOverview {
  department_id: number;
  department_code: string;
  department_name: string;
  pso_count: number;
  total_versions: number;
  active_version_id?: number | null;
  active_copso_id?: number | null;
  latest_version_id?: number | null;
  latest_status?: string | null;
  is_approved: boolean;
  is_active: boolean;
}

const COPSOMap = {
  get_departments_overview: (courseId: number | string): Promise<DepartmentCoPsoOverview[]> => {
    return new Promise((resolve, reject) => {
      commonInstance()
        .get(`course/copso/courses/${courseId}/departments-overview`)
        .then((res) => resolve(res.data))
        .catch((error) => {
          reject(error.response?.data?.detail || error.response?.data?.message || error.message || error);
        });
    });
  },

  generate: (payload: COPSOGeneratePayload): Promise<any> => {
    return new Promise((resolve, reject) => {
      commonInstance()
        .post(`course/copso/generate`, payload)
        .then((res) => resolve(res.data))
        .catch((error) => {
          reject(error.response?.data?.detail || error.response?.data?.message || error.message || error);
        });
    });
  },

  get_active: (courseId: number | string, departmentId: number | string): Promise<any> => {
    return new Promise((resolve, reject) => {
      commonInstance()
        .get(`course/copso/courses/${courseId}/departments/${departmentId}/active`)
        .then((res) => resolve(res.data))
        .catch((error) => {
          reject(error.response?.data?.detail || error.response?.data?.message || error.message || error);
        });
    });
  },

  get: (copso_id: number | string): Promise<any> => {
    return new Promise((resolve, reject) => {
      commonInstance()
        .get(`course/copso/${copso_id}`)
        .then((res) => resolve(res.data))
        .catch((error) => {
          reject(error.response?.data?.detail || error.response?.data?.message || error.message || error);
        });
    });
  },

  list: (params?: {
    course_id?: number | string;
    department_id?: number | string;
    extractions_id?: number | string;
  }): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const q = new URLSearchParams();
      if (params?.course_id) q.append("course_id", String(params.course_id));
      if (params?.department_id) q.append("department_id", String(params.department_id));
      if (params?.extractions_id) q.append("extractions_id", String(params.extractions_id));
      commonInstance()
        .get(`course/copso?${q.toString()}`)
        .then((res) => resolve(res.data))
        .catch((error) => {
          reject(error.response?.data?.detail || error.response?.data?.message || error.message || error);
        });
    });
  },

  approve: (copso_id: number | string): Promise<any> => {
    return new Promise((resolve, reject) => {
      commonInstance()
        .patch(`course/copso/${copso_id}/approve`)
        .then((res) => resolve(res.data))
        .catch((error) => {
          reject(error.response?.data?.detail || error.response?.data?.message || error.message || error);
        });
    });
  },

  activate: (copso_id: number | string): Promise<any> => {
    return new Promise((resolve, reject) => {
      commonInstance()
        .patch(`course/copso/${copso_id}/activate`)
        .then((res) => resolve(res.data))
        .catch((error) => {
          reject(error.response?.data?.detail || error.response?.data?.message || error.message || error);
        });
    });
  },

  deactivate: (copso_id: number | string): Promise<any> => {
    return new Promise((resolve, reject) => {
      commonInstance()
        .patch(`course/copso/${copso_id}/deactivate`)
        .then((res) => resolve(res.data))
        .catch((error) => {
          reject(error.response?.data?.detail || error.response?.data?.message || error.message || error);
        });
    });
  },

  delete: (copso_id: number | string): Promise<any> => {
    return new Promise((resolve, reject) => {
      commonInstance()
        .delete(`course/copso/${copso_id}`)
        .then((res) => resolve(res.data))
        .catch((error) => {
          reject(error.response?.data?.detail || error.response?.data?.message || error.message || error);
        });
    });
  },

  get_matrix: (copso_id: number | string): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      commonInstance()
        .get(`course/copso/${copso_id}/matrix`)
        .then((res) => resolve(res.data))
        .catch((error) => {
          reject(error.response?.data?.detail || error.response?.data?.message || error.message || error);
        });
    });
  },

  update_matrix_cell: (
    copso_id: number | string,
    matrix_id: number | string,
    payload: COPSOCellUpdatePayload
  ): Promise<any> => {
    return new Promise((resolve, reject) => {
      commonInstance()
        .patch(`course/copso/${copso_id}/matrix/${matrix_id}`, payload)
        .then((res) => resolve(res.data))
        .catch((error) => {
          reject(error.response?.data?.detail || error.response?.data?.message || error.message || error);
        });
    });
  },
};

export default COPSOMap;
