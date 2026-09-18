import {commonInstance} from '@/utils/axios.utils';

const job = {
    
    detail: (id: any) => {
        let promise = new Promise((resolve, reject) => {
            let url = `course/jobs/${id}`;
            commonInstance()
                .get(url)
                .then((res) => {
                    resolve(res.data);
                })
                .catch((error) => {
                    // Fallback to course/syllabi/jobs/{id} if 404
                    if (error.response?.status === 404) {
                        commonInstance()
                            .get(`course/syllabi/jobs/${id}`)
                            .then((res) => resolve(res.data))
                            .catch((err) => {
                                reject(err.response?.data?.message || err.response?.data || err);
                            });
                    } else if (error.response) {
                        reject(error.response.data?.message || error.response.data);
                    } else {
                        reject(error);
                    }
                });
        });
        return promise;
    },

   





};

export default job;