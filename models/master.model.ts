import instance from '@/utils/axios.utils';

const master = {
    application_status_list: (body?: any) => {
        return new Promise((resolve, reject) => {
            let url = `master/application-status/list`;
            instance()
                .post(url, body || {})
                .then((res) => resolve(res.data))
                .catch((error) => reject(error.response?.data?.message || error));
        });
    },

    panel_list: (body?: any, page?: any) => {
        return new Promise((resolve, reject) => {
            let url = `master/panel/list?page=${page || 1}`;
            instance()
                .post(url, body || {})
                .then((res) => resolve(res.data))
                .catch((error) => reject(error.response?.data?.message || error));
        });
    }
};

export default master;
