import axios from "axios";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://to-do-app-blue-kappa.vercel.app/api";

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Request interceptor to automatically attach authorization header if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
