import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";
import { BACKEND_URL } from "./constant.utils";

let api: AxiosInstance | null = null;
let courseApi: AxiosInstance | null = null;

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

let isSessionExpiredHandled = false;

const showTokenExpiredAlert = () => {
  if (isSessionExpiredHandled) return;
  isSessionExpiredHandled = true;

  const userConfirmed = window.confirm(
    "Your token has expired. Click OK to log in again.",
  );

  localStorage.clear();
  sessionStorage.clear();

  if (userConfirmed) {
    window.location.href = "/auth/signin";
  } else {
    setTimeout(() => {
      window.location.href = "/auth/signin";
    }, 1000);
  }
};

// ─── Shared interceptor setup ─────────────────────────────────────────────────
const attachInterceptors = (axiosInstance: AxiosInstance) => {
  // Request: attach bearer token
  axiosInstance.interceptors.request.use(
    (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
      const accessToken = localStorage.getItem("token");
      if (accessToken && config.headers) {
        config.headers["Authorization"] = `Bearer ${accessToken}`;
      }
      return config;
    },
    (error: AxiosError) => Promise.reject(error),
  );

  // Response: handle 401 with refresh token logic
  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError | any) => {
      const originalRequest: any = error.config;

      if (
        (error.response?.data?.error === "authorization header missing" ||
          error.response?.data?.error === "invalid or expired token") &&
        !originalRequest._retry
      ) {
        originalRequest._retry = true;

        const refreshToken = localStorage.getItem("refresh");
        if (!refreshToken) {
          showTokenExpiredAlert();
          return Promise.reject(error);
        }

        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({
              resolve: (token: string) => {
                originalRequest.headers["Authorization"] = "Bearer " + token;
                resolve(axiosInstance(originalRequest));
              },
              reject: (err: any) => reject(err),
            });
          });
        }

        isRefreshing = true;

        return new Promise(async (resolve, reject) => {
          try {
            const response = await axios.post(
              `${BACKEND_URL}auth/jwt/token/refresh/`,
              { refresh: refreshToken },
            );

            const { access, refresh } = response.data;
            localStorage.setItem("token", access);
            localStorage.setItem("refresh", refresh);

            axiosInstance.defaults.headers.common["Authorization"] =
              "Bearer " + access;
            originalRequest.headers["Authorization"] = "Bearer " + access;

            processQueue(null, access);
            resolve(axiosInstance(originalRequest));
          } catch (err: any) {
            if (
              err.response?.data?.error === "authorization header missing" ||
              err.response?.data?.error === "invalid or expired token"
            ) {
              showTokenExpiredAlert();
            } else {
              processQueue(err, null);
              localStorage.clear();
              sessionStorage.clear();
              window.location.href = "/auth/signin";
            }
            reject(err);
          } finally {
            isRefreshing = false;
          }
        });
      }

      return Promise.reject(error);
    },
  );
};

// ─── Main instance → /org/api/v1/ ────────────────────────────────────────────
export const instance = (): AxiosInstance => {
  if (api) return api;

  api = axios.create({
    baseURL: `${BACKEND_URL}org/api/v1/`,
  });

  attachInterceptors(api);
  return api;
};

// ─── Course instance → /course/ ──────────────────────────────────────────────
export const commonInstance = (): AxiosInstance => {
  if (courseApi) return courseApi;

  courseApi = axios.create({
    baseURL: `${BACKEND_URL}`,
  });

  attachInterceptors(courseApi);
  return courseApi;
};

export default instance;
