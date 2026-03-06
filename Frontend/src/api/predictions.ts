import apiClient from '../lib/api-client';
import type {
  Prediction,
  PredictionListResponse,
} from './types';

// Get all predictions sorted by risk
export const getPredictions = async (): Promise<PredictionListResponse> => {
  const response = await apiClient.get<PredictionListResponse>('/api/predictions');
  return response.data;
};

// Get prediction for specific department
export const getDepartmentPrediction = async (deptId: string): Promise<Prediction> => {
  const response = await apiClient.get<Prediction>(`/api/predictions/department/${deptId}`);
  return response.data;
};
