import instance from '@/utils/axios.utils';
import { getOrganizationId } from '@/utils/function.utils';

const batches = {
    list: (body?: any, page?: any) => {
        let promise = new Promise((resolve, reject) => {
            let url = `batches/`;
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
            if (body?.programme_id) {
                params.append("programme_id", body.programme_id);
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
            let url = `batches/`;
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
            let url = `batches/${id}`;
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
            let url = `batches/${id}`;
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
            let url = `batches/${id}`;
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

export default batches;