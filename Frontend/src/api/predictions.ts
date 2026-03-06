import apiClient from '../lib/api-client';
import type {
  Prediction,
  PredictionListResponse,
} from './types';

// Get all lapse predictions sorted by risk
export const getPredictions = async (limit: number = 10): Promise<PredictionListResponse> => {
  const response = await apiClient.get<any>('/lapse/', { params: { limit } });
  const data = response.data;
  
  const predictions = (data.lapse_predictions || []).map((p: any) => ({
    id: p.department_id?.toString() || '0',
    dept_id: p.department_id?.toString() || '0',
    dept_name: `Department ${p.department_id}`,
    district_name: 'District',
    predicted_lapse: p.days_until_lapse || 0,
    risk_level: (p.risk_level || 'none') as any,
    confidence_score: p.r2_score || 0,
    generated_at: new Date().toISOString(),
  }));
  
  return {
    predictions,
    total: data.total_predictions || predictions.length,
  };
};

// Get prediction/lapse status for specific department
export const getDepartmentPrediction = async (deptId: string): Promise<Prediction> => {
  const response = await apiClient.get<any>(`/lapse/department/${deptId}`);
  const data = response.data;
  
  return {
    id: deptId,
    dept_id: deptId,
    dept_name: data.department_name || `Department ${deptId}`,
    district_name: 'District',
    predicted_lapse: data.days_until_lapse || 0,
    risk_level: data.risk_level || 'medium',
    confidence_score: data.r2_score || 0,
    generated_at: new Date().toISOString(),
  };
};
