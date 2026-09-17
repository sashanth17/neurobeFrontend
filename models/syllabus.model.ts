import { commonInstance } from '@/utils/axios.utils';

const syllabus = {

    create: (data: any) => {
        let promise = new Promise((resolve, reject) => {
            let url = `course/syllabi/extract-document`;
            commonInstance()
                .post(url, data, {
                    headers: { "Content-Type": "multipart/form-data" },
                })
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

    

   


   

    

};

export default syllabus;
