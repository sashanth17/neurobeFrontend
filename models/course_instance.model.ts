import instance from '@/utils/axios.utils';
import { getOrganizationId } from '@/utils/function.utils';

const course_instance = {
    list: (body?: any, page?: any) => {
        let promise = new Promise((resolve, reject) => {
            let url = `course-instances/`;
            const params = new URLSearchParams();

            const orgId = body?.organization_id || getOrganizationId();
            if (orgId) {
                params.append("organization_id", String(orgId));
            }

            if (body?.search) {
                params.append("search", body.search);
            }
            if (body?.status && body.status !== "All Statuses" && body.status !== "all_status") {
                params.append("status", body.status);
            }
            if (body?.department_id) {
                params.append("department_id", String(body.department_id));
            }
            if (body?.created_by_id !== undefined && body?.created_by_id !== null && body?.created_by_id !== "") {
                params.append("created_by_id", String(body.created_by_id));
            }
            if (body?.created_by_register_number) {
                params.append("created_by_register_number", String(body.created_by_register_number));
            }
            if (body?.course_id) {
                params.append("course_id", String(body.course_id));
            }
            if (body?.programme_id) {
                params.append("programme_id", String(body.programme_id));
            }
            if (body?.batch_id) {
                params.append("batch_id", String(body.batch_id));
            }
            if (body?.semester) {
                params.append("semester", String(body.semester));
            }
            if (body?.is_active !== undefined) {
                params.append("is_active", String(body.is_active));
            }
            if (body?.is_archived !== undefined) {
                params.append("is_archived", String(body.is_archived));
            }
            if (body?.term_visibility !== undefined) {
                params.append("term_visibility", String(body.term_visibility));
            }
            if (body?.limit) {
                params.append("limit", String(body.limit));
            }
            if (page) {
                params.append("page", page);
            }

            if (params.toString()) {
                url += `?${params.toString()}`;
            }

            instance()
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

    create: (data: any) => {
        let promise = new Promise((resolve, reject) => {
                     let url = `course-instances/`;

            instance()
                .post(url, data, {
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

    detail: (id: any) => {
        let promise = new Promise((resolve, reject) => {
            let url = `course-instances/${id}`;
            
            instance()
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

    update: (id: any, data: any) => {
        let promise = new Promise((resolve, reject) => {
            let url = `course-instances/${id}`;
            const config = typeof FormData !== "undefined" && data instanceof FormData ? { headers: { "Content-Type": "multipart/form-data" } } : {};
            instance()
                .patch(url, data, config)
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

    delete: (id: any) => {
        let promise = new Promise((resolve, reject) => {
            let url = `course-instances/${id}`;
            instance()
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

    

    
};

export default course_instance;