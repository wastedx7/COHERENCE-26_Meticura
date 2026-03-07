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

// ── Lightweight GET request cache + deduplication ──
const GET_CACHE = new Map<string, { ts: number; data: any }>();
const INFLIGHT = new Map<string, Promise<any>>();
const CACHE_TTL = 15_000; // 15 seconds

function cacheKey(url: string, params?: Record<string, any>): string {
  const p = params ? JSON.stringify(params, Object.keys(params).sort()) : '';
  return `${url}::${p}`;
}

/**
 * Cached GET request: deduplicates identical in-flight requests and
 * returns cached responses within TTL. Use `cachedGet.invalidate()`
 * to clear the cache after mutations.
 */
export function cachedGet<T = any>(url: string, params?: Record<string, any>): Promise<T> {
  const key = cacheKey(url, params);

  // Return from cache if fresh
  const hit = GET_CACHE.get(key);
  if (hit && Date.now() - hit.ts < CACHE_TTL) {
    return Promise.resolve(hit.data as T);
  }

  // Deduplicate in-flight
  const inflight = INFLIGHT.get(key);
  if (inflight) return inflight;

  const promise = api.get(url, { params })
    .then(res => {
      GET_CACHE.set(key, { ts: Date.now(), data: res.data });
      INFLIGHT.delete(key);
      return res.data as T;
    })
    .catch(err => {
      INFLIGHT.delete(key);
      throw err;
    });

  INFLIGHT.set(key, promise);
  return promise;
}

/** Clear cached GET responses. Pass a URL prefix to selectively invalidate. */
cachedGet.invalidate = (prefix?: string) => {
  if (!prefix) { GET_CACHE.clear(); return; }
  for (const k of GET_CACHE.keys()) {
    if (k.startsWith(prefix)) GET_CACHE.delete(k);
  }
};
