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
    // Direct Table CRUD Methods (Strict relational table endpoints)
    // ─────────────────────────────────────────────────────────
    createUnit: (courseId: string | number, extractionId: number, data: any) => {
        return new Promise((resolve, reject) => {
            commonInstance()
                .post(`course/syllabi/courses/${courseId}/extractions/${extractionId}/units`, data)
                .then((res) => resolve(res.data))
                .catch((error) => reject(error.response?.data?.message || error.response?.data || error));
        });
    },
    updateUnit: (courseId: string | number, unitId: number, data: any) => {
        return new Promise((resolve, reject) => {
            commonInstance()
                .put(`course/syllabi/courses/${courseId}/units/${unitId}`, data)
                .then((res) => resolve(res.data))
                .catch((error) => reject(error.response?.data?.message || error.response?.data || error));
        });
    },
    deleteUnit: (courseId: string | number, unitId: number) => {
        return new Promise((resolve, reject) => {
            commonInstance()
                .delete(`course/syllabi/courses/${courseId}/units/${unitId}`)
                .then((res) => resolve(res.data))
                .catch((error) => reject(error.response?.data?.message || error.response?.data || error));
        });
    },

    createTopic: (courseId: string | number, unitId: number, data: any) => {
        return new Promise((resolve, reject) => {
            commonInstance()
                .post(`course/syllabi/courses/${courseId}/units/${unitId}/topics`, data)
                .then((res) => resolve(res.data))
                .catch((error) => reject(error.response?.data?.message || error.response?.data || error));
        });
    },
    updateTopic: (courseId: string | number, topicId: number, data: any) => {
        return new Promise((resolve, reject) => {
            commonInstance()
                .put(`course/syllabi/courses/${courseId}/topics/${topicId}`, data)
                .then((res) => resolve(res.data))
                .catch((error) => reject(error.response?.data?.message || error.response?.data || error));
        });
    },
    deleteTopic: (courseId: string | number, topicId: number) => {
        return new Promise((resolve, reject) => {
            commonInstance()
                .delete(`course/syllabi/courses/${courseId}/topics/${topicId}`)
                .then((res) => resolve(res.data))
                .catch((error) => reject(error.response?.data?.message || error.response?.data || error));
        });
    },

    createSubtopic: (courseId: string | number, topicId: number, data: any) => {
        return new Promise((resolve, reject) => {
            commonInstance()
                .post(`course/syllabi/courses/${courseId}/topics/${topicId}/subtopics`, data)
                .then((res) => resolve(res.data))
                .catch((error) => reject(error.response?.data?.message || error.response?.data || error));
        });
    },
    updateSubtopic: (courseId: string | number, subtopicId: number, data: any) => {
        return new Promise((resolve, reject) => {
            commonInstance()
                .put(`course/syllabi/courses/${courseId}/subtopics/${subtopicId}`, data)
                .then((res) => resolve(res.data))
                .catch((error) => reject(error.response?.data?.message || error.response?.data || error));
        });
    },
    deleteSubtopic: (courseId: string | number, subtopicId: number) => {
        return new Promise((resolve, reject) => {
            commonInstance()
                .delete(`course/syllabi/courses/${courseId}/subtopics/${subtopicId}`)
                .then((res) => resolve(res.data))
                .catch((error) => reject(error.response?.data?.message || error.response?.data || error));
        });
    },

    createOutcome: (courseId: string | number, extractionId: number, data: any) => {
        return new Promise((resolve, reject) => {
            commonInstance()
                .post(`course/syllabi/courses/${courseId}/extractions/${extractionId}/outcomes`, data)
                .then((res) => resolve(res.data))
                .catch((error) => reject(error.response?.data?.message || error.response?.data || error));
        });
    },
    updateOutcome: (courseId: string | number, outcomeId: number, data: any) => {
        return new Promise((resolve, reject) => {
            commonInstance()
                .put(`course/syllabi/courses/${courseId}/outcomes/${outcomeId}`, data)
                .then((res) => resolve(res.data))
                .catch((error) => reject(error.response?.data?.message || error.response?.data || error));
        });
    },
    deleteOutcome: (courseId: string | number, outcomeId: number) => {
        return new Promise((resolve, reject) => {
            commonInstance()
                .delete(`course/syllabi/courses/${courseId}/outcomes/${outcomeId}`)
                .then((res) => resolve(res.data))
                .catch((error) => reject(error.response?.data?.message || error.response?.data || error));
        });
    },

    createTextbook: (courseId: string | number, extractionId: number, data: any) => {
        return new Promise((resolve, reject) => {
            commonInstance()
                .post(`course/syllabi/courses/${courseId}/extractions/${extractionId}/textbooks`, data)
                .then((res) => resolve(res.data))
                .catch((error) => reject(error.response?.data?.message || error.response?.data || error));
        });
    },
    updateTextbook: (courseId: string | number, textbookId: number, data: any) => {
        return new Promise((resolve, reject) => {
            commonInstance()
                .put(`course/syllabi/courses/${courseId}/textbooks/${textbookId}`, data)
                .then((res) => resolve(res.data))
                .catch((error) => reject(error.response?.data?.message || error.response?.data || error));
        });
    },
    deleteTextbook: (courseId: string | number, textbookId: number) => {
        return new Promise((resolve, reject) => {
            commonInstance()
                .delete(`course/syllabi/courses/${courseId}/textbooks/${textbookId}`)
                .then((res) => resolve(res.data))
                .catch((error) => reject(error.response?.data?.message || error.response?.data || error));
        });
    },

    createReferenceBook: (courseId: string | number, extractionId: number, data: any) => {
        return new Promise((resolve, reject) => {
            commonInstance()
                .post(`course/syllabi/courses/${courseId}/extractions/${extractionId}/reference-books`, data)
                .then((res) => resolve(res.data))
                .catch((error) => reject(error.response?.data?.message || error.response?.data || error));
        });
    },
    updateReferenceBook: (courseId: string | number, referenceId: number, data: any) => {
        return new Promise((resolve, reject) => {
            commonInstance()
                .put(`course/syllabi/courses/${courseId}/reference-books/${referenceId}`, data)
                .then((res) => resolve(res.data))
                .catch((error) => reject(error.response?.data?.message || error.response?.data || error));
        });
    },
    deleteReferenceBook: (courseId: string | number, referenceId: number) => {
        return new Promise((resolve, reject) => {
            commonInstance()
                .delete(`course/syllabi/courses/${courseId}/reference-books/${referenceId}`)
                .then((res) => resolve(res.data))
                .catch((error) => reject(error.response?.data?.message || error.response?.data || error));
        });
    },

    createExperiment: (courseId: string | number, extractionId: number, data: any) => {
        return new Promise((resolve, reject) => {
            commonInstance()
                .post(`course/syllabi/courses/${courseId}/extractions/${extractionId}/experiments`, data)
                .then((res) => resolve(res.data))
                .catch((error) => reject(error.response?.data?.message || error.response?.data || error));
        });
    },
    updateExperiment: (courseId: string | number, experimentId: number, data: any) => {
        return new Promise((resolve, reject) => {
            commonInstance()
                .put(`course/syllabi/courses/${courseId}/experiments/${experimentId}`, data)
                .then((res) => resolve(res.data))
                .catch((error) => reject(error.response?.data?.message || error.response?.data || error));
        });
    },
    deleteExperiment: (courseId: string | number, experimentId: number) => {
        return new Promise((resolve, reject) => {
            commonInstance()
                .delete(`course/syllabi/courses/${courseId}/experiments/${experimentId}`)
                .then((res) => resolve(res.data))
                .catch((error) => reject(error.response?.data?.message || error.response?.data || error));
        });
    },
}

export default syllabus;
