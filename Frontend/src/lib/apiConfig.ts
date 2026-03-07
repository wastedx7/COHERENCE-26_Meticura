// Centralized API configuration
//
// In development the Vite proxy forwards /api → http://localhost:8000/api,
// so we can use a relative path (empty origin). In production builds or
// when VITE_API_URL is explicitly set we use the full origin.
const envOrigin = import.meta.env.VITE_API_URL as string | undefined;

// When running under Vite dev-server with the proxy, use '' (relative) so
// that requests go through the proxy and avoid CORS issues.
// In production (or if explicitly overridden) use the full origin.
export const API_ORIGIN = import.meta.env.DEV && !envOrigin
  ? ''
  : (envOrigin ?? 'http://localhost:8000').replace(/\/$/, '');

export const API_BASE_URL = `${API_ORIGIN}/api`;

/**
 * Build a full API URL from a path.
 * @param path - API path relative to /api  (e.g. '/auth/login' or 'auth/login')
 * @returns Full API URL  (e.g. '/api/auth/login' or 'http://host:8000/api/auth/login')
 */
export const buildApiUrl = (path: string): string => {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${API_BASE_URL}${normalizedPath}`;
};
