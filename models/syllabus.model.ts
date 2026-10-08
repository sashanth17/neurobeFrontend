import { commonInstance } from '@/utils/axios.utils';

const syllabus = {

    upload: (formData: any) => {
        return new Promise((resolve, reject) => {
            let url = `course/syllabi/upload`;
            commonInstance()
                .post(url, formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                })
                .then((res) => resolve(res.data))
                .catch((error) => {
                    reject(error?.response?.data?.detail || error?.response?.data?.message || error?.message || error);
                });
        });
    },

    create: (data: any) => {
        let promise = new Promise((resolve, reject) => {
            let url = `course/syllabi/upload`;
            commonInstance()
                .post(url, data, {
                    headers: { "Content-Type": "multipart/form-data" },
                })
                .then((res) => {
                    resolve(res.data);
                })
                .catch((error) => {
                    if (error.response) {
                        reject(error.response.data?.detail || error.response.data?.message || error.response.data);
                    } else {
                        reject(error);
                    }
                });
        });
        return promise;
    },

    approve: (syllabusId: number | string) => {
        return new Promise((resolve, reject) => {
            commonInstance()
                .patch(`course/syllabi/${syllabusId}/approve`)
                .then((res) => resolve(res.data))
                .catch((error) => {
                    reject(error?.response?.data?.detail || error?.response?.data?.message || error?.message || error);
                });
        });
    },

    activate: (syllabusId: number | string) => {
        return new Promise((resolve, reject) => {
            commonInstance()
                .patch(`course/syllabi/${syllabusId}/activate`)
                .then((res) => resolve(res.data))
                .catch((error) => {
                    reject(error?.response?.data?.detail || error?.response?.data?.message || error?.message || error);
                });
        });
    },

    list_syllabi: (params?: { course_id?: number | string }) => {
        return new Promise((resolve, reject) => {
            const q = new URLSearchParams();
            if (params?.course_id) q.append("course_id", String(params.course_id));
            commonInstance()
                .get(`course/syllabi?${q.toString()}`)
                .then((res) => resolve(res.data))
                .catch((error) => {
                    reject(error?.response?.data?.detail || error?.response?.data?.message || error?.message || error);
                });
        });
    },

    list_extractions: (params?: { course_id?: number | string; course_syllabus_id?: number | string }) => {
        return new Promise((resolve, reject) => {
            const q = new URLSearchParams();
            if (params?.course_id) q.append("course_id", String(params.course_id));
            if (params?.course_syllabus_id) q.append("course_syllabus_id", String(params.course_syllabus_id));
            commonInstance()
                .get(`course/extractions?${q.toString()}`)
                .then((res) => resolve(res.data))
                .catch((error) => {
                    reject(error?.response?.data?.detail || error?.response?.data?.message || error?.message || error);
                });
        });
    },

    extraction_approve: (extractionsId: number | string) => {
        return new Promise((resolve, reject) => {
            commonInstance()
                .patch(`course/extractions/${extractionsId}/approve`)
                .then((res) => resolve(res.data))
                .catch((error) => {
                    reject(error?.response?.data?.detail || error?.response?.data?.message || error?.message || error);
                });
        });
    },

    extraction_activate: (extractionsId: number | string) => {
        return new Promise((resolve, reject) => {
            commonInstance()
                .patch(`course/extractions/${extractionsId}/activate`)
                .then((res) => resolve(res.data))
                .catch((error) => {
                    reject(error?.response?.data?.detail || error?.response?.data?.message || error?.message || error);
                });
        });
    },

    get_active_extraction: (courseId: number | string) => {
        return new Promise((resolve, reject) => {
            commonInstance()
                .get(`course/extractions/courses/${courseId}/active`)
                .then((res) => resolve(res.data))
                .catch((error) => {
                    reject(error?.response?.data?.detail || error?.response?.data?.message || error?.message || error);
                });
        });
    },

    get_active_cos: (courseId: number | string) => {
        return new Promise((resolve, reject) => {
            commonInstance()
                .get(`course/extractions/courses/${courseId}/active-cos`)
                .then((res) => resolve(res.data))
                .catch((error) => {
                    reject(error?.response?.data?.detail || error?.response?.data?.message || error?.message || error);
                });
        });
    },


    get_extraction: (extractionsId: number | string) => {
        return new Promise((resolve, reject) => {
            commonInstance()
                .get(`course/extractions/${extractionsId}`)
                .then((res) => resolve(res.data))
                .catch((error) => {
                    reject(error?.response?.data?.detail || error?.response?.data?.message || error?.message || error);
                });
        });
    },

    getFileBlob: (courseSyllabusId: number | string) => {
        return new Promise((resolve, reject) => {
            commonInstance()
                .get(`course/syllabi/${courseSyllabusId}/file`, { responseType: "blob" })
                .then((res) => resolve(res.data))
                .catch((error) => {
                    reject(error?.response?.data?.detail || error?.response?.data?.message || error?.message || error);
                });
        });
    },

    getActiveCourseFileBlob: (courseId: number | string) => {
        return new Promise((resolve, reject) => {
            commonInstance()
                .get(`course/syllabi/courses/${courseId}/active-file`, { responseType: "blob" })
                .then((res) => resolve(res.data))
                .catch((error) => {
                    reject(error?.response?.data?.detail || error?.response?.data?.message || error?.message || error);
                });
        });
    },

    update_hours: (extractionsId: number | string, data: any) => {
        return new Promise((resolve, reject) => {
            commonInstance()
                .patch(`course/extractions/${extractionsId}/hours`, data)
                .then((res) => resolve(res.data))
                .catch((error) => {
                    reject(error?.response?.data?.detail || error?.response?.data?.message || error?.message || error);
                });
        });
    },

    detail: (id: string | number) => {
        let promise = new Promise((resolve, reject) => {
            let url = `course/syllabi/${id}`;
            commonInstance()
                .get(url)
                .then((res) => {
                    resolve(res.data);
                })
                .catch((error) => {
                    if (error.response) {
                        reject(error.response.data?.message || error.response.data);
                    } else {
                        reject(error);
                    }
                });
        });
        return promise;
    },


      update_syllabus: (syllabus_id: string | number,data) => {
        let promise = new Promise((resolve, reject) => {
            let url = `course/syllabi/${syllabus_id}`;
            commonInstance()
                .put(url,data)
                .then((res) => {
                    resolve(res.data);
                })
                .catch((error) => {
                    if (error.response) {
                        reject(error.response.data?.message || error.response.data);
                    } else {
                        reject(error);
                    }
                });
        });
        return promise;
    },

    patch_syllabus: (syllabus_id: string | number, data: any) => {
        let promise = new Promise((resolve, reject) => {
            let url = `course/syllabi/${syllabus_id}`;
            commonInstance()
                .patch(url, data)
                .then((res) => {
                    resolve(res.data);
                })
                .catch((error) => {
                    if (error.response) {
                        reject(error.response.data?.message || error.response.data);
                    } else {
                        reject(error);
                    }
                });
        });
        return promise;
    },

    

    uploded_file: (syllabus_id: string | number) => {
        let promise = new Promise((resolve, reject) => {
            let url = `course/syllabi/${syllabus_id}/source-document`;
            commonInstance()
                .get(url, { 
                    responseType: 'blob',
                    transformResponse: [(data) => data] // Don't transform blob
                })
                .then((res) => {
                    console.log('uploded_file raw response:', res);
                    console.log('uploded_file res.data type:', typeof res.data, res.data instanceof Blob);
                    resolve(res.data);
                })
                .catch((error) => {
                    console.log('uploded_file error response:', error.response);
                    if (error.response) {
                        reject(error.response.data?.message || error.response.data);
                    } else {
                        reject(error);
                    }
                });
        });
        return promise;
    },

    
    

    status: (syllabus_id: string | number,data) => {
        let promise = new Promise((resolve, reject) => {
            let url = `course/syllabi/${syllabus_id}/status`;
           
            commonInstance()
                .patch(url,data)
                .then((res) => {
                    resolve(res.data);
                })
                .catch((error) => {
                    if (error.response) {
                        reject(error.response.data?.message || error.response.data);
                    } else {
                        reject(error);
                    }
                });
        });
        return promise;
    },

    create_unit_topic: (unit_id: string | number, data: any) => {
        let promise = new Promise((resolve, reject) => {
            let url = `course/units/${unit_id}/topics`;
            commonInstance()
                .post(url, data)
                .then((res) => {
                    resolve(res.data);
                })
                .catch((error) => {
                    if (error.response) {
                        reject(error.response.data?.message || error.response.data);
                    } else {
                        reject(error);
                    }
                });
        });
        return promise;
    },

      delete_unit_topic: (topic_id: string | number) => {
        let promise = new Promise((resolve, reject) => {
            let url = `course/topics/${topic_id}`;
            commonInstance()
                .delete(url)
                .then((res) => {
                    resolve(res.data);
                })
                .catch((error) => {
                    if (error.response) {
                        reject(error.response.data?.message || error.response.data);
                    } else {
                        reject(error);
                    }
                });
        });
        return promise;
    },

    create_unit_textbook: (syllabus_id: string | number, data: any) => {
        let promise = new Promise((resolve, reject) => {
            let url = `course/syllabi/${syllabus_id}/textbooks`;
            commonInstance()
                .post(url, data)
                .then((res) => {
                    resolve(res.data);
                })
                .catch((error) => {
                    if (error.response) {
                        reject(error.response.data?.message || error.response.data);
                    } else {
                        reject(error);
                    }
                });
        });
        return promise;
    },

    create_unit_reference_book: (syllabus_id: string | number, data: any) => {
        let promise = new Promise((resolve, reject) => {
            let url = `course/syllabi/${syllabus_id}/reference-books`;
            commonInstance()
                .post(url, data)
                .then((res) => {
                    resolve(res.data);
                })
                .catch((error) => {
                    if (error.response) {
                        reject(error.response.data?.message || error.response.data);
                    } else {
                        reject(error);
                    }
                });
        });
        return promise;
    },

      delete_unit_textbook: (book_id: string | number) => {
        let promise = new Promise((resolve, reject) => {
            let url = `course/textbooks/${book_id}`;
            commonInstance()
                .delete(url)
                .then((res) => {
                    resolve(res.data);
                })
                .catch((error) => {
                    if (error.response) {
                        reject(error.response.data?.message || error.response.data);
                    } else {
                        reject(error);
                    }
                });
        });
        return promise;
    },

    delete_unit_reference_book: (book_id: string | number) => {
        let promise = new Promise((resolve, reject) => {
            let url = `course/reference-books/${book_id}`;
            commonInstance()
                .delete(url)
                .then((res) => {
                    resolve(res.data);
                })
                .catch((error) => {
                    if (error.response) {
                        reject(error.response.data?.message || error.response.data);
                    } else {
                        reject(error);
                    }
                });
        });
        return promise;
    },

    update_unit: (unit_id: string | number, data: any) => {
        let promise = new Promise((resolve, reject) => {
            let url = `course/units/${unit_id}`;
            commonInstance()
                .put(url, data)
                .then((res) => {
                    resolve(res.data);
                })
                .catch((error) => {
                    if (error.response) {
                        reject(error.response.data?.message || error.response.data);
                    } else {
                        reject(error);
                    }
                });
        });
        return promise;
    },

    create_unit_outcome: (syllabus_id: string | number, data: any) => {
        let promise = new Promise((resolve, reject) => {
            let url = `course/syllabi/${syllabus_id}/outcomes`;
            commonInstance()
                .post(url, data)
                .then((res) => {
                    resolve(res.data);
                })
                .catch((error) => {
                    if (error.response) {
                        reject(error.response.data?.message || error.response.data);
                    } else {
                        reject(error);
                    }
                });
        });
        return promise;
    },

      edit_unit_outcome: (outcome_id: string | number, data: any) => {
        let promise = new Promise((resolve, reject) => {
            let url = `course/outcomes/${outcome_id}`;
            commonInstance()
                .put(url, data)
                .then((res) => {
                    resolve(res.data);
                })
                .catch((error) => {
                    if (error.response) {
                        reject(error.response.data?.message || error.response.data);
                    } else {
                        reject(error);
                    }
                });
        });
        return promise;
    },

    accept_outcome: (outcome_id: string | number) => {
        let promise = new Promise((resolve, reject) => {
            let url = `course/outcomes/${outcome_id}/accept`;
            commonInstance()
                .post(url)
                .then((res) => {
                    resolve(res.data);
                })
                .catch((error) => {
                    if (error.response) {
                        reject(error.response.data?.message || error.response.data);
                    } else {
                        reject(error);
                    }
                });
        });
        return promise;
    },

     update_knw_level_outcome: (outcome_id: string | number,body) => {
        let promise = new Promise((resolve, reject) => {
            let url = `course/outcomes/${outcome_id}/knowledge-level`;
            commonInstance()
                .put(url,body)
                .then((res) => {
                    resolve(res.data);
                })
                .catch((error) => {
                    if (error.response) {
                        reject(error.response.data?.message || error.response.data);
                    } else {
                        reject(error);
                    }
                });
        });
        return promise;
    },

    get_full_tree: (id: string | number) => {
        return new Promise((resolve, reject) => {
            let url = `course/syllabi/${id}/full-tree`;
            commonInstance()
                .get(url)
                .then((res) => resolve(res.data))
                .catch((error) => {
                    reject(error.response?.data?.message || error.response?.data || error);
                });
        });
    },

    get_file: (id: string | number) => {
        return new Promise((resolve, reject) => {
            let url = `course/syllabi/${id}/file`;
            commonInstance()
                .get(url, {
                    responseType: 'blob',
                    transformResponse: [(data) => data]
                })
                .then((res) => resolve(res.data))
                .catch((error) => {
                    reject(error.response?.data?.message || error.response?.data || error);
                });
        });
    },

    get_units: (syllabus_id: string | number, params?: any) => {
        return new Promise((resolve, reject) => {
            let url = `course/syllabi/${syllabus_id}/units`;
            commonInstance()
                .get(url, { params })
                .then((res) => resolve(res.data))
                .catch((error) => {
                    reject(error.response?.data?.message || error.response?.data || error);
                });
        });
    },

    get_workflow_status: (id: string | number) => {
        return new Promise((resolve, reject) => {
            let url = `course/courses/${id}/workflow-status`;
            commonInstance()
                .get(url)
                .then((res) => resolve(res.data))
                .catch((error) => {
                    reject(error.response?.data?.message || error.response?.data || error);
                });
        });
    },

    get_versions: (id: string | number, stage: string) => {
        return new Promise((resolve, reject) => {
            let url = `course/courses/${id}/versions/${stage}`;
            commonInstance()
                .get(url)
                .then((res) => resolve(res.data))
                .catch((error) => {
                    reject(error.response?.data?.message || error.response?.data || error);
                });
        });
    },

    get_specific_version: (id: string | number, stage: string, ver: number) => {
        return new Promise((resolve, reject) => {
            let url = `course/courses/${id}/versions/${stage}/${ver}`;
            commonInstance()
                .get(url)
                .then((res) => resolve(res.data))
                .catch((error) => {
                    reject(error.response?.data?.message || error.response?.data || error);
                });
        });
    },

    activate_version: (id: string | number, stage: string, ver: number) => {
        return new Promise((resolve, reject) => {
            let url = `course/courses/${id}/versions/${stage}/${ver}/activate`;
            commonInstance()
                .post(url)
                .then((res) => resolve(res.data))
                .catch((error) => {
                    reject(error.response?.data?.message || error.response?.data || error);
                });
        });
    },

    delete_version: (id: string | number, stage: string, ver: number) => {
        return new Promise((resolve, reject) => {
            let url = `course/courses/${id}/versions/${stage}/${ver}`;
            commonInstance()
                .delete(url)
                .then((res) => resolve(res.data))
                .catch((error) => {
                    reject(error.response?.data?.message || error.response?.data || error);
                });
        });
    },

    update_version: (id: string | number, stage: string, ver: number, body: any) => {
        return new Promise((resolve, reject) => {
            let url = `course/courses/${id}/versions/${stage}/${ver}`;
            commonInstance()
                .patch(url, body)
                .then((res) => resolve(res.data))
                .catch((error) => {
                    reject(error.response?.data?.message || error.response?.data || error);
                });
        });
    },

    approve_stage: (id: string | number, stage: string, ver?: number) => {
        return new Promise((resolve, reject) => {
            let url = `course/courses/${id}/stages/${stage}/approve`;
            if (ver !== undefined && ver !== null) {
                url += `?version=${ver}`;
            }
            commonInstance()
                .post(url)
                .then((res) => resolve(res.data))
                .catch((error) => {
                    reject(error.response?.data?.message || error.response?.data || error);
                });
        });
    },

    reject_stage: (id: string | number, stage: string, ver?: number) => {
        return new Promise((resolve, reject) => {
            let url = `course/courses/${id}/stages/${stage}/reject`;
            if (ver !== undefined && ver !== null) {
                url += `?version=${ver}`;
            }
            commonInstance()
                .post(url)
                .then((res) => resolve(res.data))
                .catch((error) => {
                    reject(error.response?.data?.message || error.response?.data || error);
                });
        });
    },

    cancel_stage: (id: string | number, stage: string) => {
        return new Promise((resolve, reject) => {
            let url = `course/courses/${id}/stages/${stage}/cancel?cancelled_by=user`;
            commonInstance()
                .post(url)
                .then((res) => resolve(res.data))
                .catch((error) => {
                    reject(error.response?.data?.message || error.response?.data || error);
                });
        });
    },

    // ─────────────────────────────────────────────────────────────────────────
    // Versioned Syllabus File Upload APIs
    // ─────────────────────────────────────────────────────────────────────────

    /** List all versioned file uploads for a course */
    listFileVersions: (courseId: string | number) => {
        return new Promise((resolve, reject) => {
            commonInstance()
                .get(`course/syllabi/courses/${courseId}/file-versions`)
                .then((res) => resolve(res.data))
                .catch((error) => reject(error.response?.data?.message || error.response?.data || error));
        });
    },

    /** Upload a new versioned syllabus file for a course (does NOT trigger extraction) */
    uploadFileVersion: (courseId: string | number, formData: FormData) => {
        return new Promise((resolve, reject) => {
            commonInstance()
                .post(`course/syllabi/courses/${courseId}/file-versions`, formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                })
                .then((res) => resolve(res.data))
                .catch((error) => reject(error.response?.data?.message || error.response?.data || error));
        });
    },

    /** Trigger AI extraction from a specific file version */
    extractFromFileVersion: (courseId: string | number, fileVersionId: string | number) => {
        return new Promise((resolve, reject) => {
            commonInstance()
                .post(`course/syllabi/courses/${courseId}/extract-from-file/${fileVersionId}`)
                .then((res) => resolve(res.data))
                .catch((error) => reject(error.response?.data?.message || error.response?.data || error));
        });
    },

    /** Activate a specific syllabus file version */
    activateFileVersion: (courseId: string | number, versionNumber: number) => {
        return new Promise((resolve, reject) => {
            commonInstance()
                .post(`course/syllabi/courses/${courseId}/file-versions/${versionNumber}/activate`)
                .then((res) => resolve(res.data))
                .catch((error) => reject(error.response?.data?.message || error.response?.data || error));
        });
    },

    /** Serve the PDF file for a specific versioned file upload */
    getFileVersionFile: (courseId: string | number, versionNumber: number) => {
        return new Promise((resolve, reject) => {
            commonInstance()
                .get(`course/syllabi/courses/${courseId}/file-versions/${versionNumber}/file`, {
                    responseType: 'blob',
                    transformResponse: [(data) => data],
                })
                .then((res) => resolve(res.data))
                .catch((error) => reject(error.response?.data?.message || error.response?.data || error));
        });
    },

    /** Get the extraction snapshot (data_ai_gave + status) for a specific file version */
    getFileVersionExtraction: (courseId: string | number, versionNumber: number) => {
        return new Promise((resolve, reject) => {
            commonInstance()
                .get(`course/syllabi/courses/${courseId}/file-versions/${versionNumber}/extraction`)
                .then((res) => resolve(res.data))
                .catch((error) => reject(error.response?.data?.message || error.response?.data || error));
        });
    },

    /** Update the extraction snapshot (data_ai_gave) for a specific file version */
    updateFileVersionExtraction: (courseId: string | number, versionNumber: number, data: any) => {
        return new Promise((resolve, reject) => {
            commonInstance()
                .put(`course/syllabi/courses/${courseId}/file-versions/${versionNumber}/extraction`, data)
                .then((res) => resolve(res.data))
                .catch((error) => reject(error.response?.data?.message || error.response?.data || error));
        });
    },

    // ─────────────────────────────────────────────────────────
    // Extraction Relational Sub-Resource CRUD Methods
    // ─────────────────────────────────────────────────────────
    addOutcome: (extractionId: number | string, data: any) => {
        return commonInstance().post(`course/extractions/${extractionId}/outcomes`, data).then(r => r.data);
    },
    updateOutcome: (extractionId: number | string, id: number | string, data: any) => {
        return commonInstance().patch(`course/extractions/${extractionId}/outcomes/${id}`, data).then(r => r.data);
    },
    deleteOutcome: (extractionId: number | string, id: number | string) => {
        return commonInstance().delete(`course/extractions/${extractionId}/outcomes/${id}`).then(r => r.data);
    },

    addUnit: (extractionId: number | string, data: any) => {
        return commonInstance().post(`course/extractions/${extractionId}/units`, data).then(r => r.data);
    },
    updateUnit: (extractionId: number | string, id: number | string, data: any) => {
        return commonInstance().patch(`course/extractions/${extractionId}/units/${id}`, data).then(r => r.data);
    },
    deleteUnit: (extractionId: number | string, id: number | string) => {
        return commonInstance().delete(`course/extractions/${extractionId}/units/${id}`).then(r => r.data);
    },

    addTopic: (extractionId: number | string, unitId: number | string, data: any) => {
        return commonInstance().post(`course/extractions/${extractionId}/units/${unitId}/topics`, data).then(r => r.data);
    },
    updateTopic: (extractionId: number | string, id: number | string, data: any) => {
        return commonInstance().patch(`course/extractions/${extractionId}/topics/${id}`, data).then(r => r.data);
    },
    deleteTopic: (extractionId: number | string, id: number | string) => {
        return commonInstance().delete(`course/extractions/${extractionId}/topics/${id}`).then(r => r.data);
    },

    addSubtopic: (extractionId: number | string, topicId: number | string, data: any) => {
        return commonInstance().post(`course/extractions/${extractionId}/topics/${topicId}/subtopics`, data).then(r => r.data);
    },
    updateSubtopic: (extractionId: number | string, id: number | string, data: any) => {
        return commonInstance().patch(`course/extractions/${extractionId}/subtopics/${id}`, data).then(r => r.data);
    },
    deleteSubtopic: (extractionId: number | string, id: number | string) => {
        return commonInstance().delete(`course/extractions/${extractionId}/subtopics/${id}`).then(r => r.data);
    },

    addObjective: (extractionId: number | string, data: any) => {
        return commonInstance().post(`course/extractions/${extractionId}/objectives`, data).then(r => r.data);
    },
    updateObjective: (extractionId: number | string, id: number | string, data: any) => {
        return commonInstance().patch(`course/extractions/${extractionId}/objectives/${id}`, data).then(r => r.data);
    },
    deleteObjective: (extractionId: number | string, id: number | string) => {
        return commonInstance().delete(`course/extractions/${extractionId}/objectives/${id}`).then(r => r.data);
    },

    addTextbook: (extractionId: number | string, data: any) => {
        return commonInstance().post(`course/extractions/${extractionId}/textbooks`, data).then(r => r.data);
    },
    updateTextbook: (extractionId: number | string, id: number | string, data: any) => {
        return commonInstance().patch(`course/extractions/${extractionId}/textbooks/${id}`, data).then(r => r.data);
    },
    deleteTextbook: (extractionId: number | string, id: number | string) => {
        return commonInstance().delete(`course/extractions/${extractionId}/textbooks/${id}`).then(r => r.data);
    },

    addReferenceBook: (extractionId: number | string, data: any) => {
        return commonInstance().post(`course/extractions/${extractionId}/reference-books`, data).then(r => r.data);
    },
    updateReferenceBook: (extractionId: number | string, id: number | string, data: any) => {
        return commonInstance().patch(`course/extractions/${extractionId}/reference-books/${id}`, data).then(r => r.data);
    },
    deleteReferenceBook: (extractionId: number | string, id: number | string) => {
        return commonInstance().delete(`course/extractions/${extractionId}/reference-books/${id}`).then(r => r.data);
    },

    addDigitalResource: (extractionId: number | string, data: any) => {
        return commonInstance().post(`course/extractions/${extractionId}/digital-resources`, data).then(r => r.data);
    },
    updateDigitalResource: (extractionId: number | string, id: number | string, data: any) => {
        return commonInstance().patch(`course/extractions/${extractionId}/digital-resources/${id}`, data).then(r => r.data);
    },
    deleteDigitalResource: (extractionId: number | string, id: number | string) => {
        return commonInstance().delete(`course/extractions/${extractionId}/digital-resources/${id}`).then(r => r.data);
    },
}

export default syllabus;
