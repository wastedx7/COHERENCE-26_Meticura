import axios from 'axios';
import { API_BASE_URL } from './apiConfig';

/**
 * Centralized Axios instance.
 * baseURL = http://localhost:8000/api  (includes the /api prefix)
 * All paths passed to api.get / api.post should be relative, e.g. '/budget/overview'.
 */
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: Number(import.meta.env.VITE_API_TIMEOUT) || 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request interceptor: attach JWT token ──
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('meticura_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: handle 401 (expired / invalid token) ──
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token invalid / expired — clear local session
      localStorage.removeItem('meticura_token');
      localStorage.removeItem('meticura_user');
      // Redirect to login unless already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export type ApiListResponse<T> = {
  success?: boolean;
  count?: number;
  data?: T[];
};
