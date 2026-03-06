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
    params.append('verdict', filters.status);
  }
  if (filters?.limit) {
    params.append('limit', filters.limit.toString());
  }
  if (filters?.offset) {
    params.append('offset', filters.offset.toString());
  }

  const response = await apiClient.get<any>('/anomalies/', { params });
  const data = response.data;
  
  return {
    anomalies: (Array.isArray(data) ? data : data.anomalies || []).map((a: any) => ({
      id: a.department_id?.toString() || '0',
      dept_id: a.department_id?.toString() || '0',
      dept_name: `Department ${a.department_id}`,
      district_name: 'District',
      anomaly_type: a.combined?.verdict || 'unknown',
      severity: getSeverityFromRuleViolations(a.rule_detection?.violations || []),
      detected_at: a.timestamp || new Date().toISOString(),
      details: {
        ml_score: a.ml_detection?.score || 0,
        rule_violations: a.rule_detection?.violations || [],
        combined_score: a.combined?.score || 0,
      },
    })),
    total: Array.isArray(data) ? data.length : data.total || 0,
    limit: filters?.limit || 10,
    offset: filters?.offset || 0,
  };
};

// Get anomalies for specific department
export const getDepartmentAnomalies = async (deptId: string): Promise<Anomaly[]> => {
  const response = await apiClient.get<any>(`/anomalies/department/${deptId}`);
  const data = response.data;
  
  if (!data) return [];
  
  return [{
    id: deptId,
    dept_id: deptId,
    dept_name: `Department ${deptId}`,
    district_name: 'District',
    anomaly_type: data.combined?.verdict || 'normal',
    severity: getSeverityFromRuleViolations(data.rule_detection?.violations || []),
    detected_at: data.timestamp || new Date().toISOString(),
    details: {
      ml_score: data.ml_detection?.score || 0,
      rule_violations: data.rule_detection?.violations || [],
      combined_score: data.combined?.score || 0,
    },
  }];
};

// Helper function to determine severity
function getSeverityFromRuleViolations(violations: any[]): 'critical' | 'high' | 'medium' | 'low' {
  if (!violations || violations.length === 0) return 'low';
  const maxSeverity = violations.reduce((max: any, v: any) => {
    const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    return (severityOrder[v.severity] || 0) > (severityOrder[max.severity] || 0) ? v : max;
  });
  return maxSeverity?.severity || 'low';
}

// Resolve an anomaly
export const resolveAnomaly = async (
  anomalyId: string,
  data?: ResolveAnomalyRequest
): Promise<void> => {
  // Would be implemented if backend supports it
  return Promise.resolve();
};
