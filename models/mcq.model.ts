import { commonInstance } from '@/utils/axios.utils';

const mcq = {
    generate: (data: any) => {
        let promise = new Promise((resolve, reject) => {
            let url = `course/mcq/generate`;
            commonInstance()
                .post(url, data)
                .then((res) => resolve(res.data))
                .catch((error) => reject(error.response?.data?.message || error.response?.data || error));
        });
        return promise;
    },

    status: (job_id: string) => {
        let promise = new Promise((resolve, reject) => {
            let url = `course/mcq/status/${job_id}`;
            commonInstance()
                .get(url)
                .then((res) => resolve(res.data))
                .catch((error) => reject(error.response?.data?.message || error.response?.data || error));
        });
        return promise;
    },

    history_questions: (params?: any) => {
        let promise = new Promise((resolve, reject) => {
            let url = `course/mcq/history/questions`;
            commonInstance()
                .get(url, { params })
                .then((res) => resolve(res.data))
                .catch((error) => reject(error.response?.data?.message || error.response?.data || error));
        });
        return promise;
    },

    get_question: (question_id: string) => {
        let promise = new Promise((resolve, reject) => {
            let url = `course/mcq/history/questions/${question_id}`;
            commonInstance()
                .get(url)
                .then((res) => resolve(res.data))
                .catch((error) => reject(error.response?.data?.message || error.response?.data || error));
        });
        return promise;
    },

    update_question: (question_id: string, data: any) => {
        let promise = new Promise((resolve, reject) => {
            let url = `course/mcq/history/questions/${question_id}`;
            commonInstance()
                .put(url, data)
                .then((res) => resolve(res.data))
                .catch((error) => reject(error.response?.data?.message || error.response?.data || error));
        });
        return promise;
    },

    delete_question: (question_id: string) => {
        let promise = new Promise((resolve, reject) => {
            let url = `course/mcq/history/questions/${question_id}`;
            commonInstance()
                .delete(url)
                .then((res) => resolve(res.data))
                .catch((error) => reject(error.response?.data?.message || error.response?.data || error));
        });
        return promise;
    },

    create_set: (data: any) => {
        let promise = new Promise((resolve, reject) => {
            let url = `course/mcq/sets`;
            commonInstance()
                .post(url, data)
                .then((res) => resolve(res.data))
                .catch((error) => reject(error.response?.data?.message || error.response?.data || error));
        });
        return promise;
    },

    list_sets: (params?: any) => {
        let promise = new Promise((resolve, reject) => {
            let url = `course/mcq/sets`;
            commonInstance()
                .get(url, { params })
                .then((res) => resolve(res.data))
                .catch((error) => reject(error.response?.data?.message || error.response?.data || error));
        });
        return promise;
    },

    get_set: (set_id: string, params?: any) => {
        let promise = new Promise((resolve, reject) => {
            let url = `course/mcq/sets/${set_id}`;
            commonInstance()
                .get(url, { params })
                .then((res) => resolve(res.data))
                .catch((error) => reject(error.response?.data?.message || error.response?.data || error));
        });
        return promise;
    },

    update_set: (set_id: string, data: any) => {
        let promise = new Promise((resolve, reject) => {
            let url = `course/mcq/sets/${set_id}`;
            commonInstance()
                .put(url, data)
                .then((res) => resolve(res.data))
                .catch((error) => reject(error.response?.data?.message || error.response?.data || error));
        });
        return promise;
    },

    delete_set: (set_id: string) => {
        let promise = new Promise((resolve, reject) => {
            let url = `course/mcq/sets/${set_id}`;
            commonInstance()
                .delete(url)
                .then((res) => resolve(res.data))
                .catch((error) => reject(error.response?.data?.message || error.response?.data || error));
        });
        return promise;
    },

    add_questions_to_set: (set_id: string, question_ids: string[]) => {
        let promise = new Promise((resolve, reject) => {
            let url = `course/mcq/sets/${set_id}/questions`;
            commonInstance()
                .post(url, question_ids)
                .then((res) => resolve(res.data))
                .catch((error) => reject(error.response?.data?.message || error.response?.data || error));
        });
        return promise;
    },

    remove_question_from_set: (set_id: string, question_id: string) => {
        let promise = new Promise((resolve, reject) => {
            let url = `course/mcq/sets/${set_id}/questions/${question_id}`;
            commonInstance()
                .delete(url)
                .then((res) => resolve(res.data))
                .catch((error) => reject(error.response?.data?.message || error.response?.data || error));
        });
        return promise;
    },

    bulk_remove_questions_from_set: (set_id: string, question_ids: string[]) => {
        let promise = new Promise((resolve, reject) => {
            let url = `course/mcq/sets/${set_id}/questions/remove`;
            commonInstance()
                .post(url, question_ids)
                .then((res) => resolve(res.data))
                .catch((error) => reject(error.response?.data?.message || error.response?.data || error));
        });
        return promise;
    },

    // ── Assessment / Test Schedule APIs ────────────────────────────────────

    list_tests: (params?: any) => {
        let promise = new Promise((resolve, reject) => {
            let url = `assessment/tests`;
            commonInstance()
                .get(url, { params })
                .then((res) => resolve(res.data))
                .catch((error) => reject(error.response?.data?.message || error.response?.data || error));
        });
        return promise;
    },

    create_test_schedule: (data: any) => {
        let promise = new Promise((resolve, reject) => {
            let url = `assessment/tests/schedule`;
            commonInstance()
                .post(url, data)
                .then((res) => resolve(res.data))
                .catch((error) => reject(error.response?.data?.message || error.response?.data || error));
        });
        return promise;
    },

    update_test_schedule: (test_id: string, data: any) => {
        let promise = new Promise((resolve, reject) => {
            let url = `assessment/tests/${test_id}/schedule`;
            commonInstance()
                .put(url, data)
                .then((res) => resolve(res.data))
                .catch((error) => reject(error.response?.data?.message || error.response?.data || error));
        });
        return promise;
    },

    cancel_test: (test_id: string) => {
        let promise = new Promise((resolve, reject) => {
            let url = `assessment/tests/${test_id}/cancel`;
            commonInstance()
                .patch(url)
                .then((res) => resolve(res.data))
                .catch((error) => reject(error.response?.data?.message || error.response?.data || error));
        });
        return promise;
    },

    complete_test: (test_id: string) => {
        let promise = new Promise((resolve, reject) => {
            let url = `assessment/tests/${test_id}/complete`;
            commonInstance()
                .patch(url)
                .then((res) => resolve(res.data))
                .catch((error) => reject(error.response?.data?.message || error.response?.data || error));
        });
        return promise;
    },

    submit_test: (test_id: string, data: any) => {
        let promise = new Promise((resolve, reject) => {
            let url = `assessment/tests/${test_id}/submit`;
            commonInstance()
                .post(url, data)
                .then((res) => resolve(res.data))
                .catch((error) => reject(error.response?.data?.message || error.response?.data || error));
        });
        return promise;
    },

    delete_test: (test_id: string) => {
        let promise = new Promise((resolve, reject) => {
            let url = `assessment/tests/${test_id}`;
            commonInstance()
                .delete(url)
                .then((res) => resolve(res.data))
                .catch((error) => reject(error.response?.data?.message || error.response?.data || error));
        });
        return promise;
    },

    get_live_stats: (test_id: string) => {
        let promise = new Promise((resolve, reject) => {
            let url = `assessment/tests/${test_id}/live-stats`;
            commonInstance()
                .get(url)
                .then((res) => resolve(res.data))
                .catch((error) => reject(error.response?.data?.message || error.response?.data || error));
        });
        return promise;
    },

    get_test_report: (test_id: string) => {
        let promise = new Promise((resolve, reject) => {
            let url = `assessment/tests/${test_id}/report`;
            commonInstance()
                .get(url)
                .then((res) => resolve(res.data))
                .catch((error) => reject(error.response?.data?.message || error.response?.data || error));
        });
        return promise;
    },

    verify_test_code: (data: { code: string; student_email?: string }) => {
        let promise = new Promise((resolve, reject) => {
            let url = `assessment/tests/verify-code`;
            commonInstance()
                .post(url, data)
                .then((res) => resolve(res.data))
                .catch((error) => reject(error.response?.data?.detail || error.response?.data?.message || error));
        });
        return promise;
    },
};

export default mcq;

