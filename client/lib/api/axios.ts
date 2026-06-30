import axios from "axios";
import Cookies from "js-cookie";

const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// Attach access token and CSRF token
api.interceptors.request.use((config) => {
  const token = Cookies.get("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Skip CSRF for refresh endpoint
  if (config.url !== "/auth/refresh") {
    const csrfToken = Cookies.get("csrf_token");
    if (csrfToken) {
      config.headers["x-csrf-token"] = csrfToken;
    }
  }

  return config;
});

// Auto-refresh on 401
let refreshing = false;
let failedQueue: Array<{
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
  config: any;
}> = [];

const processQueue = (error: any | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.config.headers.Authorization = `Bearer ${token}`;
      prom.resolve(api(prom.config));
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If not 401 or already retried, reject
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // If refreshing is already in progress, queue this request
    if (refreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject, config: originalRequest });
      });
    }

    originalRequest._retry = true;
    refreshing = true;

    try {
      // Try to refresh the token
      const { data } = await axios.post(
        "/api/auth/refresh",
        {},
        { withCredentials: true },
      );

      const newToken = data.accessToken;

      if (newToken) {
        // Store the new token
        Cookies.set("access_token", newToken, {
          expires: 1 / 96, // 15 minutes
          sameSite: "strict",
          secure: process.env.NODE_ENV === "production",
        });

        // Update the original request with new token
        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        // Process any queued requests
        processQueue(null, newToken);

        // Retry the original request
        return api(originalRequest);
      } else {
        throw new Error("No token received");
      }
    } catch (refreshError) {
      // Refresh failed - clear tokens and redirect to login
      Cookies.remove("access_token");
      Cookies.remove("user");

      // Reject all queued requests
      processQueue(refreshError, null);

      // Redirect to login if not already there
      if (
        typeof window !== "undefined" &&
        !window.location.pathname.includes("/login")
      ) {
        window.location.href = "/login";
      }

      return Promise.reject(refreshError);
    } finally {
      refreshing = false;
    }
  },
);

export default api;
