import axios, { AxiosError } from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import type { APIError } from '../api/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT || '30000');

// Create axios instance with default configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Global token setter (will be called by Clerk provider)
let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

export const getAuthToken = () => authToken;

// Request interceptor
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add authentication token if available
    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }
    
    // Add timestamp to prevent caching issues
    if (config.params) {
      config.params._t = Date.now();
    } else {
      config.params = { _t: Date.now() };
    }
    
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error: AxiosError) => {
    console.error('[API] Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log(`[API] ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
    return response;
  },
  (error: AxiosError<APIError>) => {
    console.error('[API] Response error:', error);

    // Format error for consistent handling
    const formattedError: APIError = {
      code: error.response?.data?.code || error.code || 'UNKNOWN_ERROR',
      message: error.response?.data?.message || error.message || 'An unexpected error occurred',
      details: error.response?.data?.details || {},
    };

    // Log specific error types
    if (error.response) {
      // Server responded with error status
      console.error(`[API] Server error ${error.response.status}:`, formattedError);
    } else if (error.request) {
      // Request made but no response
      console.error('[API] Network error - no response received');
      formattedError.message = 'Network error - please check your connection';
    } else {
      // Request setup error
      console.error('[API] Request setup error:', error.message);
    }

    return Promise.reject(formattedError);
  }
);

export default apiClient;
export { API_BASE_URL, API_TIMEOUT };
