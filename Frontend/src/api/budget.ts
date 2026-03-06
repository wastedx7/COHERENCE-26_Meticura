import apiClient from '../lib/api-client';
import type {
  NationalOverview,
  DistrictSummary,
  DistrictDetail,
  DepartmentDetail,
  AddTransactionRequest,
  AddTransactionResponse,
} from './types';

// Get national overview with all KPIs
export const getNationalOverview = async (): Promise<NationalOverview> => {
  const response = await apiClient.get<NationalOverview>('/api/budget/overview');
  return response.data;
};

// Get all districts summary
export const getDistricts = async (): Promise<DistrictSummary[]> => {
  const response = await apiClient.get<DistrictSummary[]>('/api/budget/districts');
  return response.data;
};

// Get specific district detail with departments
export const getDistrictById = async (districtId: string): Promise<DistrictDetail> => {
  const response = await apiClient.get<DistrictDetail>(`/api/budget/districts/${districtId}`);
  return response.data;
};

// Get specific department detail
export const getDepartmentById = async (deptId: string): Promise<DepartmentDetail> => {
  const response = await apiClient.get<DepartmentDetail>(`/api/budget/departments/${deptId}`);
  return response.data;
};

// Add transaction to department
export const addTransaction = async (
  deptId: string,
  data: AddTransactionRequest
): Promise<AddTransactionResponse> => {
  const response = await apiClient.post<AddTransactionResponse>(
    `/api/budget/departments/${deptId}/transactions`,
    data
  );
  return response.data;
};
