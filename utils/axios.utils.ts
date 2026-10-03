import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";
import { BACKEND_URL } from "./constant.utils";

let api: AxiosInstance | null = null;
let courseApi: AxiosInstance | null = null;

// ── Session-expired guard (fire once, then redirect) ─────────────────────────
let isSessionExpiredHandled = false;

/**
 * Clear all local state and redirect to login.
 * Idempotent — only runs once per page lifecycle.
 */
const handleSessionExpired = (): void => {
  if (isSessionExpiredHandled) return;
  isSessionExpiredHandled = true;

  // Wipe everything before redirecting so the login page gets a clean slate
  try {
    localStorage.clear();
    sessionStorage.clear();
  } catch {
    // ignore SSR / private-browsing edge-cases
  }

  if (typeof window !== "undefined") {
    window.location.href = "/auth/signin";
  }
};

// ── Helper: check if a 401 response is a token-expiry ───────────────────────
const isTokenExpired = (responseData: any): boolean => {
  if (!responseData) return false;

  // Backend now sends: { detail: { detail: "Access token has expired", code: "TOKEN_EXPIRED" } }
  // or flat:           { detail: "Access token has expired" }
  const detail = responseData?.detail;
  if (typeof detail === "object" && detail !== null) {
    return (
      detail?.code === "TOKEN_EXPIRED" ||
      detail?.detail === "Access token has expired"
    );
  }
  if (typeof detail === "string") {
    return (
      detail === "Access token has expired" ||
      (detail.toLowerCase().includes("token") &&
        detail.toLowerCase().includes("expired"))
    );
  }
  // Legacy error field (old format)
  const err = responseData?.error;
  if (typeof err === "string") {
    return (
      err === "invalid or expired token" ||
      err.toLowerCase().includes("expired")
    );
  }
  return false;
};

// ── Shared interceptor setup ─────────────────────────────────────────────────
const attachInterceptors = (axiosInstance: AxiosInstance): void => {
  // Request: attach Bearer token
  axiosInstance.interceptors.request.use(
    (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
      const accessToken =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (accessToken && config.headers) {
        config.headers["Authorization"] = `Bearer ${accessToken}`;
      }
      return config;
    },
    (error: AxiosError) => Promise.reject(error),
  );

  // Response: detect 401 / token-expired and redirect immediately
  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError | any) => {
      const status: number | undefined = error.response?.status;
      const data: any = error.response?.data;

      if (status === 401) {
        // Any 401 from the backend means the session is invalid.
        // If the payload explicitly says token expired, or there is any other
        // 401 (missing/invalid), we clear state and go to login.
        handleSessionExpired();
        return Promise.reject(error);
      }

      return Promise.reject(error);
    },
  );
};

// Reset the guard when the module is re-loaded (e.g. hot-reload in dev)
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    isSessionExpiredHandled = false;
  });
}

// ─── Main instance → /org/api/v1/ ────────────────────────────────────────────
export const instance = (): AxiosInstance => {
  const targetBaseUrl = `${BACKEND_URL}org/api/v1/`;
  if (!api) {
    api = axios.create({
      baseURL: targetBaseUrl,
      timeout: 30000,
    });
    attachInterceptors(api);
  } else if (api.defaults.baseURL !== targetBaseUrl) {
    api.defaults.baseURL = targetBaseUrl;
  }
  return api;
};

// ─── Course instance → base BACKEND_URL ──────────────────────────────────────
export const commonInstance = (): AxiosInstance => {
  const targetBaseUrl = `${BACKEND_URL}`;
  if (!courseApi) {
    courseApi = axios.create({
      baseURL: targetBaseUrl,
      timeout: 30000,
    });
    attachInterceptors(courseApi);
  } else if (courseApi.defaults.baseURL !== targetBaseUrl) {
    courseApi.defaults.baseURL = targetBaseUrl;
  }
  return courseApi;
};

export default instance;

