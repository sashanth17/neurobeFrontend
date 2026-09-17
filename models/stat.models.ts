import instance from '@/utils/axios.utils';
import { getOrganizationId } from '@/utils/function.utils';

const stats = {
    academic_setup: (orgId?: any) => {
        let promise = new Promise((resolve, reject) => {
            const organizationId = orgId || getOrganizationId();
            let url = `stats/?organization_id=${organizationId}`;    
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
};

export default stats;