import { commonInstance } from "@/utils/axios.utils";

export interface COPOCellUpdatePayload {
  co_code: string;
  target_code: string;
  correlation_level: number;
  justification?: string;
  version_number?: number;
  status?: string;
}

export interface COPODraftSavePayload {
  matrix: Record<string, Record<string, number | { correlation_level: number; justification?: string }>>;
  justifications?: Record<string, Record<string, string>>;
  unmapped_justifications?: Record<string, string>;
  version_number?: number;
}

export interface COPOGeneratePayload {
  parent_extraction_id?: number;
  extraction_version?: number;
  version_number?: number;
  model?: string;
}

const COPOMap = {
  get_versions: (courseId: string | number) => {
    return new Promise((resolve, reject) => {
      commonInstance()
        .get(`course/syllabi/${courseId}/copo-versions`)
        .then((res) => resolve(res.data))
        .catch((error) => {
          reject(error.response?.data?.detail || error.response?.data?.message || error.message || error);
        });
    });
  },

  copo_map: (courseId: string | number, version_number?: number | null) => {
    return new Promise((resolve, reject) => {
      let url = `course/syllabi/${courseId}/copo-matrix`;
      if (version_number !== undefined && version_number !== null) {
        url += `?version_number=${version_number}`;
      }
      commonInstance()
        .get(url)
        .then((res) => resolve(res.data))
        .catch((error) => {
          reject(error.response?.data?.detail || error.response?.data?.message || error.message || error);
        });
    });
  },

  generate_copo: (courseId: string | number, body?: COPOGeneratePayload) => {
    return new Promise((resolve, reject) => {
      commonInstance()
        .post(`course/syllabi/${courseId}/generate-copo`, body || {})
        .then((res) => resolve(res.data))
        .catch((error) => {
          reject(error.response?.data?.detail || error.response?.data?.message || error.message || error);
        });
    });
  },

  copo_update: (courseId: string | number, body: COPOCellUpdatePayload, version_number?: number | null) => {
    return new Promise((resolve, reject) => {
      let url = `course/syllabi/${courseId}/copo-matrix/cell`;
      if (version_number !== undefined && version_number !== null) {
        url += `?version_number=${version_number}`;
      }
      commonInstance()
        .put(url, body)
        .then((res) => resolve(res.data))
        .catch((error) => {
          reject(error.response?.data?.detail || error.response?.data?.message || error.message || error);
        });
    });
  },

  accept_map: (courseId: string | number, body: { co_code: string; target_code: string; version_number?: number }, version_number?: number | null) => {
    return new Promise((resolve, reject) => {
      let url = `course/syllabi/${courseId}/copo-matrix/cell/accept`;
      if (version_number !== undefined && version_number !== null) {
        url += `?version_number=${version_number}`;
      }
      commonInstance()
        .post(url, body)
        .then((res) => resolve(res.data))
        .catch((error) => {
          reject(error.response?.data?.detail || error.response?.data?.message || error.message || error);
        });
    });
  },

  save_draft: (courseId: string | number, body: COPODraftSavePayload, version_number?: number | null) => {
    return new Promise((resolve, reject) => {
      let url = `course/syllabi/${courseId}/copo-matrix/draft`;
      if (version_number !== undefined && version_number !== null) {
        url += `?version_number=${version_number}`;
      }
      commonInstance()
        .put(url, body)
        .then((res) => resolve(res.data))
        .catch((error) => {
          reject(error.response?.data?.detail || error.response?.data?.message || error.message || error);
        });
    });
  },

  approve_map: (courseId: string | number, body?: { version_number?: number; version?: number; comments?: string }) => {
    return new Promise((resolve, reject) => {
      commonInstance()
        .post(`course/syllabi/${courseId}/copo-matrix/approve`, body || {})
        .then((res) => resolve(res.data))
        .catch((error) => {
          reject(error.response?.data?.detail || error.response?.data?.message || error.message || error);
        });
    });
  },

  reject_map: (courseId: string | number, body?: { version_number?: number; version?: number }) => {
    return new Promise((resolve, reject) => {
      commonInstance()
        .post(`course/syllabi/${courseId}/copo-matrix/reject`, body || {})
        .then((res) => resolve(res.data))
        .catch((error) => {
          reject(error.response?.data?.detail || error.response?.data?.message || error.message || error);
        });
    });
  },

  activate_version: (courseId: string | number, version_number: number) => {
    return new Promise((resolve, reject) => {
      commonInstance()
        .post(`course/syllabi/${courseId}/copo-matrix/${version_number}/activate`)
        .then((res) => resolve(res.data))
        .catch((error) => {
          reject(error.response?.data?.detail || error.response?.data?.message || error.message || error);
        });
    });
  },

  delete_version: (courseId: string | number, version_number: number) => {
    return new Promise((resolve, reject) => {
      commonInstance()
        .delete(`course/syllabi/${courseId}/copo-matrix/${version_number}`)
        .then((res) => resolve(res.data))
        .catch((error) => {
          reject(error.response?.data?.detail || error.response?.data?.message || error.message || error);
        });
    });
  },

  get_job_status: (jobId: string) => {
    return new Promise((resolve, reject) => {
      commonInstance()
        .get(`course/syllabi/jobs/${jobId}`)
        .then((res) => resolve(res.data))
        .catch((error) => {
          reject(error.response?.data?.detail || error.response?.data?.message || error.message || error);
        });
    });
  },
};

export default COPOMap;