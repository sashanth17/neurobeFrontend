import instance from '@/utils/axios.utils';
import { getOrganizationId } from '@/utils/function.utils';

const course_import = {
    downloadTemplate: () => {
        let promise = new Promise((resolve, reject) => {
            let url = `bulk-import/courses/template`;
            instance()
                .get(url, { responseType: 'blob' })
                .then((res) => {
                    resolve(res);
                })
                .catch(async (error) => {
                    if (error.response?.data instanceof Blob) {
                        try {
                            const text = await error.response.data.text();
                            const json = JSON.parse(text);
                            reject(json.message || json.error || text);
                            return;
                        } catch {
                            // Non-JSON blob error
                        }
                    }
                    if (error.response) {
                        reject(error.response.data?.message || error.response.data?.error || error.response.data);
                    } else {
                        reject(error?.message || error);
                    }
                });
        });
        return promise;
    },

      validate: (data: any, orgId?: any, default_password?: any) => {
            let promise = new Promise((resolve, reject) => {
                const organizationId = orgId || getOrganizationId();
                const params = new URLSearchParams();
                if (organizationId) {
                    params.append("organization_id", String(organizationId));
                }
                if (default_password) {
                    params.append("default_password", String(default_password));
                }
                let url = `bulk-import/courses/validate?${params.toString()}`;
                const payload = data instanceof File ? (() => { const fd = new FormData(); fd.append("file", data); return fd; })() : data;
                if (default_password && payload instanceof FormData) {
                    payload.append("default_password", default_password);
                }
                instance()
                    .post(url, payload)
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

    import: (data: any, orgId?: any, default_password?: any) => {
        let promise = new Promise((resolve, reject) => {
            const organizationId = orgId || getOrganizationId();
            const params = new URLSearchParams();
            if (organizationId) {
                params.append("organization_id", String(organizationId));
            }
            if (default_password) {
                params.append("default_password", String(default_password));
            }
            let url = `bulk-import/courses?${params.toString()}`;
            const payload = data instanceof File ? (() => { const fd = new FormData(); fd.append("file", data); return fd; })() : data;
            if (default_password && payload instanceof FormData) {
                payload.append("default_password", default_password);
            }
            instance()
                .post(url, payload)
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

export default course_import;