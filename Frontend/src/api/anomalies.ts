import apiClient from '../lib/api-client';
import type {
  Anomaly,
  AnomalyListResponse,
  AnomalyFilters,
  ResolveAnomalyRequest,
} from './types';

// Get anomalies with optional filters
export const getAnomalies = async (filters?: AnomalyFilters): Promise<AnomalyListResponse> => {
  const params = new URLSearchParams();
  
  if (filters?.severity && filters.severity.length > 0) {
    filters.severity.forEach(s => params.append('severity', s));
  }
  if (filters?.status && filters.status !== 'all') {
    params.append('status', filters.status);
  }
  if (filters?.district_id) {
    params.append('district_id', filters.district_id);
  }
  if (filters?.dept_id) {
    params.append('dept_id', filters.dept_id);
  }
  if (filters?.start_date) {
    params.append('start_date', filters.start_date);
  }
  if (filters?.end_date) {
    params.append('end_date', filters.end_date);
  }
  if (filters?.limit) {
    params.append('limit', filters.limit.toString());
  }
  if (filters?.offset) {
    params.append('offset', filters.offset.toString());
  }

  const response = await apiClient.get<AnomalyListResponse>('/api/anomalies', { params });
  return response.data;
};

// Get anomalies for specific department
export const getDepartmentAnomalies = async (deptId: string): Promise<Anomaly[]> => {
  const response = await apiClient.get<Anomaly[]>(`/api/anomalies/department/${deptId}`);
  return response.data;
};

// Resolve an anomaly
export const resolveAnomaly = async (
  anomalyId: string,
  data?: ResolveAnomalyRequest
): Promise<Anomaly> => {
  const response = await apiClient.post<Anomaly>(
    `/api/anomalies/${anomalyId}/resolve`,
    data || {}
  );
  return response.data;
};
