// Centralized API configuration
export const API_ORIGIN = (import.meta.env.VITE_API_URL ?? 'http://localhost:8000').replace(/\/$/, '');
export const API_BASE_URL = `${API_ORIGIN}/api`;

/**
 * Build a full API URL from a path
 * @param path - API path (e.g., '/auth/login' or 'auth/login')
 * @returns Full API URL
 */
export const buildApiUrl = (path: string): string => {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${API_BASE_URL}${normalizedPath}`;
};
