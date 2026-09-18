import instance from '@/utils/axios.utils';

const notification = {
    notification_view: (body?: any) => {
        return new Promise((resolve, reject) => {
            let url = `notification/view`;
            instance()
                .post(url, body || {})
                .then((res) => resolve(res.data))
                .catch((error) => reject(error.response?.data?.message || error));
        });
    }
};

export default notification;
