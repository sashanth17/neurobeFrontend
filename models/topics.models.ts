import { commonInstance } from '@/utils/axios.utils';

const topics = {
    units: (syllabus_id?: any) => {
        let promise = new Promise((resolve, reject) => {
            let url = `course/syllabi/${ syllabus_id}/units`;

            commonInstance()
                .get(url)
                .then((res) => {
                    resolve(res.data);
                })
                .catch((error) => {
                    if (error.response) {
                        reject(error.response.data?.message || error.response.data?.detail || error.response.data);
                    } else {
                        reject(error?.message || error);
                    }
                });
        });
        return promise;
    },

     unit_detail : (syllabus_id?: any,unit_number?: any) => {
        let promise = new Promise((resolve, reject) => {
            let url = `course/syllabi/${ syllabus_id}/topics-workspace?unit_number=${unit_number}`;

            commonInstance()
                .get(url)
                .then((res) => {
                    resolve(res.data);
                })
                .catch((error) => {
                    if (error.response) {
                        reject(error.response.data?.message || error.response.data?.detail || error.response.data);
                    } else {
                        reject(error?.message || error);
                    }
                });
        });
        return promise;
    },

    create : (unit_id?: any, body?: any) => { 
        let promise = new Promise((resolve, reject) => {
            let url = `course/units/${unit_id}/topics`;

            const config: any = {};
            if (body instanceof FormData) {
                config.headers = { "Content-Type": "multipart/form-data" };
            }

            commonInstance()
                 .post(url, body || {}, config)
                .then((res) => {
                    resolve(res.data);
                })
                .catch((error) => {
                    if (error.response) {
                        reject(error.response.data?.message || error.response.data?.detail || error.response.data);
                    } else {
                        reject(error?.message || error);
                    }
                });
        });
        return promise;
    },


    generate : (syllabus_id?: any, body?: any) => { 
        let promise = new Promise((resolve, reject) => {
            let url = `course/syllabi/${syllabus_id}/generate-hierarchy`;

            const config: any = {};
            if (body instanceof FormData) {
                config.headers = { "Content-Type": "multipart/form-data" };
            }

            commonInstance()
                 .post(url, body || {}, config)
                .then((res) => {
                    resolve(res.data);
                })
                .catch((error) => {
                    if (error.response) {
                        reject(error.response.data?.message || error.response.data?.detail || error.response.data);
                    } else {
                        reject(error?.message || error);
                    }
                });
        });
        return promise;
    },

    update: (topic_id?: any, body?: any) => { 
        let promise = new Promise((resolve, reject) => {
            let url = `course/topics/${topic_id}`;

            commonInstance()
                .put(url, body)
                .then((res) => {
                    resolve(res.data);
                })
                .catch((error) => {
                    if (error.response) {
                        reject(error.response.data?.message || error.response.data?.detail || error.response.data);
                    } else {
                        reject(error?.message || error);
                    }
                });
        });
        return promise;
    },

    subTopics_update: (topic_id?: any, body?: any) => { 
        let promise = new Promise((resolve, reject) => {
            let url = `course/topics/${topic_id}/subtopics`;

            commonInstance()
                .post(url, body)
                .then((res) => {
                    resolve(res.data);
                })
                .catch((error) => {
                    if (error.response) {
                        reject(error.response.data?.message || error.response.data?.detail || error.response.data);
                    } else {
                        reject(error?.message || error);
                    }
                });
        });
        return promise;
    },

    save_draft: (syllabus_id?: any, body?: any) => { 
        let promise = new Promise((resolve, reject) => {
            let url = `course/syllabi/${syllabus_id}/topics/draft`;

            commonInstance()
                .post(url, body)
                .then((res) => {
                    resolve(res.data);
                })
                .catch((error) => {
                    if (error.response) {
                        reject(error.response.data?.message || error.response.data?.detail || error.response.data);
                    } else {
                        reject(error?.message || error);
                    }
                });
        });
        return promise;
    },

    approve_topics: (syllabus_id?: any, body?: any) => { 
        let promise = new Promise((resolve, reject) => {
            let url = `course/syllabi/${syllabus_id}/topics/approve`;

            commonInstance()
                .post(url, body)
                .then((res) => {
                    resolve(res.data);
                })
                .catch((error) => {
                    if (error.response) {
                        reject(error.response.data?.message || error.response.data?.detail || error.response.data);
                    } else {
                        reject(error?.message || error);
                    }
                });
        });
        return promise;
    },

    jobStatus: (job_id?: any) => {
        let promise = new Promise((resolve, reject) => {
            let url = `course/syllabi/jobs/${job_id}`;

            commonInstance()
                .get(url)
                .then((res) => {
                    resolve(res.data);
                })
                .catch((error) => {
                    if (error.response) {
                        reject(error.response.data?.message || error.response.data?.detail || error.response.data);
                    } else {
                        reject(error?.message || error);
                    }
                });
        });
        return promise;
    },


}

export default topics;