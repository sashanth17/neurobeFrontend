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

    forget_password: (data?: any) => {
        let promise = new Promise((resolve, reject) => {
            let url = `auth/forgot-password`;
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

    signup: (data: any) => {
        let promise = new Promise((resolve, reject) => {
            let url = `auth/signup`;
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

    singup: (data: any) => {
        return auth.signup(data);
    },

    profile: () => {
        let promise = new Promise((resolve, reject) => {
            let url = `auth/profile`;
            instance()
                .get(url)
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