import  { commonInstance } from '@/utils/axios.utils';

const COPOMap = {
copo_map: (syllabus_id?: any) => {
        let promise = new Promise((resolve, reject) => {
            let url = `course/syllabi/${syllabus_id}/copo-matrix`;

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
    copo_update: (syllabus_id?: any, body?: any) => { 
        let promise = new Promise((resolve, reject) => {
            let url = `course/syllabi/${syllabus_id}/copo-matrix/cell`;

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

    get_cell_detail : (syllabus_id?: any, body?: any) => { 
        let promise = new Promise((resolve, reject) => {
            let url = `course/syllabi/${syllabus_id}/copo-matrix/cell`;

            commonInstance()
                .get(url, { params: body })
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

    accept_map : (syllabus_id?: any, body?: any) => { 
        let promise = new Promise((resolve, reject) => {
            let url = `course/syllabi/${syllabus_id}/copo-matrix/cell/accept`;

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

    save_draft: (syllabus_id?: any, body?: any) => { 
        let promise = new Promise((resolve, reject) => {
            let url = `course/syllabi/${syllabus_id}/copo-matrix/draft`;

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

    approve_map : (syllabus_id?: any, body?: any) => { 
        let promise = new Promise((resolve, reject) => {
            let url = `course/syllabi/${syllabus_id}/copo-matrix/approve`;

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

    get_matrix: (id: string | number) => {
        return new Promise((resolve, reject) => {
            let url = `course/syllabi/${id}/matrix`;
            commonInstance()
                .get(url)
                .then((res) => resolve(res.data))
                .catch((error) => reject(error.response?.data?.message || error.response?.data || error));
        });
    },

    generate_copo: (id: string | number, body?: any) => {
        return new Promise((resolve, reject) => {
            let url = `course/syllabi/${id}/copo-mapping`;
            commonInstance()
                .post(url, body || {})
                .then((res) => resolve(res.data))
                .catch((error) => reject(error.response?.data?.message || error.response?.data || error));
        });
    },

    approve_copo: (id: string | number) => {
        return new Promise((resolve, reject) => {
            let url = `course/syllabi/${id}/approve-copo`;
            commonInstance()
                .post(url)
                .then((res) => resolve(res.data))
                .catch((error) => reject(error.response?.data?.message || error.response?.data || error));
        });
    }

}

export default COPOMap;