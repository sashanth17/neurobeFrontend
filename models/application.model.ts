import instance from '@/utils/axios.utils';

const application = {
    list: (page?: any, body?: any) => {
        return new Promise((resolve, reject) => {
            let url = `application/list?page=${page || 1}`;
            instance()
                .post(url, body || {})
                .then((res) => resolve(res.data))
                .catch((error) => reject(error.response?.data?.message || error));
        });
    },

    application_counts: (body?: any) => {
        return new Promise((resolve, reject) => {
            let url = `application/counts`;
            instance()
                .post(url, body || {})
                .then((res) => resolve(res.data))
                .catch((error) => reject(error.response?.data?.message || error));
        });
    },

    create: (data: any) => {
        return new Promise((resolve, reject) => {
            let url = `application/create`;
            instance()
                .post(url, data)
                .then((res) => resolve(res.data))
                .catch((error) => reject(error.response?.data?.message || error));
        });
    },

    update: (data: any, id: any) => {
        return new Promise((resolve, reject) => {
            let url = `application/update/${id}`;
            instance()
                .put(url, data)
                .then((res) => resolve(res.data))
                .catch((error) => reject(error.response?.data?.message || error));
        });
    },

    delete: (id: any) => {
        return new Promise((resolve, reject) => {
            let url = `application/delete/${id}`;
            instance()
                .delete(url)
                .then((res) => resolve(res.data))
                .catch((error) => reject(error.response?.data?.message || error));
        });
    },

    details: (id: any) => {
        return new Promise((resolve, reject) => {
            let url = `application/details/${id}`;
            instance()
                .get(url)
                .then((res) => resolve(res.data))
                .catch((error) => reject(error.response?.data?.message || error));
        });
    }
};

export default application;
