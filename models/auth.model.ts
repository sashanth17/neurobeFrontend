import instance from '@/utils/axios.utils';

const auth = {
    login: (data: any) => {
        let promise = new Promise((resolve, reject) => {
            let url = `auth/login`;
            instance()
                .post(url, data)
                .then((res) => {
                    resolve(res.data);
                })
                .catch((error) => {
                    if (error.response) {
                        reject(error.response.data.message || error.response.data.error || error.response.data);
                    } else {
                        reject(error);
                    }
                });
        });
        return promise;
    },

    logout: (data?: any) => {
        let promise = new Promise((resolve, reject) => {
            let url = `auth/logout`;
            instance()
                .post(url, data || {})
                .then((res) => {
                    resolve(res.data);
                })
                .catch((error) => {
                    if (error.response) {
                        reject(error.response.data?.message || error.response.data?.error || error.response.data);
                    } else {
                        reject(error);
                    }
                });
        });
        return promise;
    },
};
export default auth;