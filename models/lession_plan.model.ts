import { commonInstance } from '@/utils/axios.utils';

const lession_plan = {

    generate_teating_timeline: (syllabus_id) => {
        let promise = new Promise((resolve, reject) => {
            let url = `course/syllabi/${syllabus_id}/schedules/generate`;
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
    detail: (syllabus_id: string | number, unit: string | number, version_number?: any) => {
        let promise = new Promise((resolve, reject) => {
            let url = `course/syllabi/${syllabus_id}/lesson-plan-workspace?unit_number=${unit}`;
            if (version_number !== undefined && version_number !== null) {
                url += `&version_number=${version_number}`;
            }
            
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

    draft: (syllabus_id: string | number) => {
        let promise = new Promise((resolve, reject) => {
            let url = `course/syllabi/${syllabus_id}/lesson-plan/draft`;
            
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

     approve: (syllabus_id: string | number) => {
        let promise = new Promise((resolve, reject) => {
            let url = `course/syllabi/${syllabus_id}/lesson-plan/approve`;
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

    update_topics: (topic_id: string | number, data: any, version_number?: any) => {
        let promise = new Promise((resolve, reject) => {
            let url = `course/topics/${topic_id}/lesson-plan-item`;
            if (version_number !== undefined && version_number !== null) {
                url += `?version_number=${version_number}`;
            }
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

    get_schedules: (id: string | number) => {
        return new Promise((resolve, reject) => {
            let url = `course/syllabi/${id}/schedules`;
            commonInstance()
                .get(url)
                .then((res) => resolve(res.data))
                .catch((error) => reject(error.response?.data?.message || error.response?.data || error));
        });
    },

    generate_timeline: (id: string | number, body?: any) => {
        return new Promise((resolve, reject) => {
            let url = `course/syllabi/${id}/schedules/generate-timeline`;
            commonInstance()
                .post(url, body || {})
                .then((res) => resolve(res.data))
                .catch((error) => reject(error.response?.data?.message || error.response?.data || error));
        });
    },

    approve_schedule: (id: string | number) => {
        return new Promise((resolve, reject) => {
            let url = `course/syllabi/${id}/approve-schedule`;
            commonInstance()
                .post(url)
                .then((res) => resolve(res.data))
                .catch((error) => reject(error.response?.data?.message || error.response?.data || error));
        });
    }

};

export default lession_plan;
