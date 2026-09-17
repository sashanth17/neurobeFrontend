import instance from '@/utils/axios.utils';
import { getOrganizationId } from '@/utils/function.utils';

const users = {
    list: (body?: any, page?: any) => {
        let promise = new Promise((resolve, reject) => {
            let url = `users/`;
            const params = new URLSearchParams();

            const orgId = body?.organization_id || getOrganizationId();
            if (orgId) {
                params.append("organization_id", String(orgId));
            }

            if (body?.search) {
                params.append("search", body.search);
            }
            if (body?.status && body.status !== "All Statuses" && body.status !== "all_status" && body.status !== "All Status") {
                params.append("status", body.status);
            }
            if (body?.role && body.role !== "All Roles" && body.role !== "all_roles") {
                params.append("role", body.role);
            }
            if (body?.department_id && body.department_id !== "All Departments" && body.department_id !== "all_depts") {
                params.append("department_id", body.department_id);
            }
            if (body?.programme_id && body.programme_id !== "All Programmes" && body.programme_id !== "all_progs") {
                params.append("programme_id", body.programme_id);
            }
            if (body?.batch_id && body.batch_id !== "All Batches" && body.batch_id !== "all_batches") {
                params.append("batch_id", body.batch_id);
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
            let url = `users/`;
            instance()
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

    detail: (id: any) => {
        let promise = new Promise((resolve, reject) => {
            let url = `users/${id}`;
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
            let url = `users/${id}`;
            instance()
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

    delete: (id: any) => {
        let promise = new Promise((resolve, reject) => {
            let url = `users/${id}`;
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

export default users;