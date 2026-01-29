// src/api/client.js
import axios from "axios";

/**
 * Resolve API base URL from Vite env vars.
 * - In Render: set VITE_API_BASE_URL=https://<your-backend>.onrender.com
 * - Locally: you can set VITE_API_URL=http://127.0.0.1:8000 (or similar)
 *
 * IMPORTANT:
 * If this ends up empty in production, requests will hit the frontend domain (bad)
 * and you'll see /login 404 like in your screenshot.
 */
function resolveApiBaseUrl() {
  const raw =
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_URL ||
    "";

  // Normalize: remove trailing slash
  const normalized = (raw || "").trim().replace(/\/+$/, "");

  // In production, fail loudly if missing to avoid silently calling the frontend domain.
  if (!normalized && import.meta.env.PROD) {
    // This makes the problem obvious in Render logs + browser console.
    // Do NOT fallback to window.location.origin in PROD (that would be the frontend).
    // eslint-disable-next-line no-console
    console.error(
      "[API] Missing API base URL. Set VITE_API_BASE_URL in Render (frontend service) to your backend origin."
    );
  }

  return normalized;
}

const API_BASE_URL = resolveApiBaseUrl();

// Log API URL for debugging (dev only)
if (import.meta.env.DEV) {
  // eslint-disable-next-line no-console
  console.log("[API] Base URL:", API_BASE_URL);
}

export const api = axios.create({
  baseURL: API_BASE_URL, // must be backend origin, not empty in PROD
  headers: {
    "Content-Type": "application/json",
  },
});

// -----------------------
// Request interceptor
// -----------------------
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// -----------------------
// Response interceptor (refresh on 401)
// -----------------------
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

const AUTH_ENDPOINTS_NO_REFRESH = [
  "/api/auth/login",
  "/api/auth/token/",
  "/api/auth/token/refresh/",
];

function isAuthEndpoint(url = "") {
  return AUTH_ENDPOINTS_NO_REFRESH.some((p) => url.includes(p));
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error?.config;

    // If we don't have a config, just reject
    if (!originalRequest) return Promise.reject(error);

    // Only handle real 401 responses
    const status = error?.response?.status;
    if (status !== 401) return Promise.reject(error);

    // Avoid infinite loops / don't refresh for auth endpoints
    if (originalRequest._retry || isAuthEndpoint(originalRequest.url)) {
      return Promise.reject(error);
    }

    // If another refresh is already running, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    const refreshToken = localStorage.getItem("refresh_token");

    if (!refreshToken) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      window.location.href = "/login";
      isRefreshing = false;
      return Promise.reject(error);
    }

    try {
      // Use the SAME api instance so baseURL is applied correctly.
      // If API_BASE_URL is empty in PROD, this will still hit frontend — which is why
      // you must ensure VITE_API_BASE_URL is set in Render and redeploy.
      const resp = await api.post("/api/auth/token/refresh/", {
        refresh: refreshToken,
      });

      const newAccessToken = resp?.data?.access;

      if (!newAccessToken) {
        throw new Error("No access token returned by refresh endpoint.");
      }

      localStorage.setItem("access_token", newAccessToken);

      api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

      processQueue(null, newAccessToken);
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      window.location.href = "/login";
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);
