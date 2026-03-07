import axios from 'axios';
import { API_ORIGIN } from './apiConfig';

export const api = axios.create({
  baseURL: API_ORIGIN,
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('meticura_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export type ApiListResponse<T> = {
  success?: boolean;
  count?: number;
  data?: T[];
};
