import { commonInstance } from '@/utils/axios.utils';

const learning_material = {

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
    detail: (syllabus_id: string | number,unit: string | number,) => {
        let promise = new Promise((resolve, reject) => {
            let url = `course/syllabi/${syllabus_id}/learning-materials-workspace?unit_number=${unit}`;
            
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

    generate: (topic_id: string | number,data) => {
        let promise = new Promise((resolve, reject) => {
            let url = `course/topics/${topic_id}/learning-materials/generate`;
            
            commonInstance()
                .post(url,data)
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

     get_topics: (topic_id: string | number) => {
        let promise = new Promise((resolve, reject) => {
            let url = `course/topics/${topic_id}/learning-materials`;
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

    update_topics: (topic_id: string | number,data) => {
        let promise = new Promise((resolve, reject) => {
            let url = `course/topics/${topic_id}/lesson-plan-item`;
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

     update_material: (topic_id: string | number,data) => {
        let promise = new Promise((resolve, reject) => {
            let url = `course/topics/${topic_id}/learning-materials`;
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

      approve_material: (topic_id: string | number) => {
        let promise = new Promise((resolve, reject) => {
            let url = `course/topics/${topic_id}/learning-materials/approve`;
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



    

   


    
};

export default learning_material;
