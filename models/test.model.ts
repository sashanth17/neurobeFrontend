import instance from '@/utils/axios.utils';

const test = {
    list: (body) => {
        let promise = new Promise((resolve, reject) => {
            let url = 'filter/leads';
            if (body?.search) {
                url += `&search=${encodeURIComponent(body.search)}`;
              }
            instance()
                .get(url)
                .then((res) => {
                    resolve(res.data);
                })
                .catch((error) => {
                    if (error.response) {
                        reject(error.response.message);
                    } else {
                        reject(error);
                    }
                });
        });
        return promise;
    },

    create: (data: any) => {
        let promise = new Promise((resolve, reject) => {
            let url = `lead/create/`;
            instance()
                .post(url, data)
                .then((res) => {
                    resolve(res.data);
                })
                .catch((error) => {
                    if (error.response) {
                        reject(error.response.data.message);
                    } else {
                        reject(error);
                    }
                });
        });
        return promise;
    },

    update: (data: any, id: any) => {
        let promise = new Promise((resolve, reject) => {
            let url = `lead/update/${id}`;

            instance()
                .post(url, data)
                .then((res) => {
                    resolve(res.data);
                })
                .catch((error) => {
                    if (error.response) {
                        reject(error.response.data.message);
                    } else {
                        reject(error);
                    }
                });
        });
        return promise;
    },

    delete: (id: any) => {
        let promise = new Promise((resolve, reject) => {
            let url = `lead/delete/${id}`;

            instance()
                .post(url)
                .then((res) => {
                    resolve(res.data);
                })
                .catch((error) => {
                    if (error.response) {
                        reject(error.response.data.message);
                    } else {
                        reject(error);
                    }
                });
        });
        return promise;
    },

    details: (id: any) => {
        let promise = new Promise((resolve, reject) => {
            let url = `auth/view_user/${id}`;
            instance()
                .post(url)
                .then((res) => {
                    resolve(res.data);
                })
                .catch((error) => {
                    if (error.response) {
                        reject(error.response.data.message);
                    } else {
                        reject(error);
                    }
                });
        });
        return promise;
    },

    uploadFile: (file: any) => {
        let promise = new Promise((resolve, reject) => {
            const formData = new FormData();
            formData.append('file', file);
            let url = '/hdd/upload_file';
            const config = {
                headers: {
                    'Content-Type': 'multipart/form-data; charset=utf-8;',
                },
            };
            instance()
                .post(url, formData, config)
                .then((res) => {
                    resolve(res.data);
                })
                .catch((error) => {
                    if (error.response) {
                        reject(error.response.data.message);
                    } else {
                        reject(error);
                    }
                });
        });
        return promise;
    },
};

export default test;
