import instance from '@/utils/axios.utils';
import { getOrganizationId } from '@/utils/function.utils';

const course = {
    list: (body?: any, page?: any) => {
        let promise = new Promise((resolve, reject) => {
            let url = `courses/`;
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
            if (body?.department_id) {
                params.append("department_id", String(body.department_id));
            }
            if (body?.coordinator_id) {
                params.append("coordinator_id", String(body.coordinator_id));
            }
            if (body?.instructor_id) {
                params.append("instructor_id", String(body.instructor_id));
            }
            if (body?.created_by_id !== undefined && body?.created_by_id !== null && body?.created_by_id !== "") {
                params.append("created_by_id", String(body.created_by_id));
            }
            if (body?.created_by_register_number) {
                params.append("created_by_register_number", String(body.created_by_register_number));
            }
            if (body?.course_instance_id) {
                params.append("course_instance_id", String(body.course_instance_id));
            }
            if (body?.programme_id) {
                params.append("programme_id", String(body.programme_id));
            }
            if (body?.batch_id) {
                params.append("batch_id", String(body.batch_id));
            }
            if (body?.limit) {
                params.append("limit", String(body.limit));
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
            let url = `courses/`;
            const config = typeof FormData !== "undefined" && data instanceof FormData ? { headers: { "Content-Type": "multipart/form-data" } } : {};
            instance()
                .post(url, data, config)
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
            let url = `courses/${id}`;
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
            let url = `courses/${id}`;
            const config = typeof FormData !== "undefined" && data instanceof FormData ? { headers: { "Content-Type": "multipart/form-data" } } : {};
            instance()
                .patch(url, data, config)
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
            let url = `courses/${id}`;
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

    create_course_coordinators: (data: any) => {
        let promise = new Promise((resolve, reject) => {
            let url = `course-coordinators/`;
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


    create_course_instructors: (data: any) => {
        let promise = new Promise((resolve, reject) => {
            let url = `course-instructors/`;
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

    coordinator_dashboard_overview: (data: any) => {
        let promise = new Promise((resolve, reject) => {
            let url = `course-coordinators/dashboard-overview`;
            if (data.coordinator_id) {
                url += `?coordinator_id=${encodeURIComponent(data.coordinator_id)}`;
            }
             if (data.semester) {
                url += `&semester=${encodeURIComponent(data.semester)}`;
            }

              if (data.search) {
                url += `&search=${encodeURIComponent(data.search)}`;
            }

            instance()
                .get(url, data)
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

    faculty_dashboard_overview: (data: any) => {
        let promise = new Promise((resolve, reject) => {
            let url = `faculties/dashboard-overview`;
            const params = new URLSearchParams();
            const facultyId = data.faculty_id || data.coordinator_id;
            if (facultyId) {
                params.append("faculty_id", String(facultyId));
            }
            if (data.semester) {
                params.append("semester", String(data.semester));
            }
            if (data.search) {
                params.append("search", String(data.search));
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






};

export default course;