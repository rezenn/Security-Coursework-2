import axios from "axios";
import Cookies from "js-cookie";

const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// Attach access token
api.interceptors.request.use((config) => {
  const token = Cookies.get("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401
let refreshing = false;
let queue: Array<(token: string) => void> = [];

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const orig = error.config;
    if (error.response?.status !== 401 || orig._retry) return Promise.reject(error);

    if (refreshing) {
      return new Promise((resolve) => {
        queue.push((token) => {
          orig.headers.Authorization = `Bearer ${token}`;
          resolve(api(orig));
        });
      });
    }

    orig._retry = true;
    refreshing = true;

    try {
      const { data } = await axios.post("/api/auth/refresh", {}, { withCredentials: true });
      const newToken = data.accessToken;
      Cookies.set("access_token", newToken, { expires: 1 / 96 }); // 15 min
      queue.forEach((cb) => cb(newToken));
      queue = [];
      orig.headers.Authorization = `Bearer ${newToken}`;
      return api(orig);
    } catch {
      Cookies.remove("access_token");
      Cookies.remove("user");
      window.location.href = "/login";
      return Promise.reject(error);
    } finally {
      refreshing = false;
    }
  },
);

export default api;
