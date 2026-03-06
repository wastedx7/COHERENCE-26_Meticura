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
  const response = await apiClient.get<any>('/budget/overview');
  const data = response.data;
  return {
    total_allocated: data.summary?.total_allocated_budget || 0,
    total_spent: data.summary?.total_spent || 0,
    total_remaining: data.summary?.total_remaining || 0,
    utilization_pct: data.summary?.average_utilization_percentage || 0,
    high_risk_count: data.departments_by_status?.['at-risk'] || 0,
    pending_reallocations: 0,
    critical_anomalies: data.departments_by_status?.['exceeded'] || 0,
    last_updated: data.timestamp || new Date().toISOString(),
  };
};

// Get all budgets and group by district (simulated - returns departments)
export const getDistricts = async (): Promise<DistrictSummary[]> => {
  const response = await apiClient.get<any>('/budget/');
  const budgets = response.data.budgets || [];
  
  // Group by district_name or use archetype as fallback
  const grouped = budgets.reduce((acc: any, budget: any) => {
    const districtKey = 'General';
    if (!acc[districtKey]) {
      acc[districtKey] = [];
    }
    acc[districtKey].push(budget);
    return acc;
  }, {});
  
  return Object.entries(grouped).map(([districtName, depts]: any) => ({
    district_id: districtName.toLowerCase().replace(/\s+/g, '-'),
    district_name: districtName,
    department_count: depts.length,
    total_allocated: depts.reduce((sum: number, d: any) => sum + (d.allocated_budget || 0), 0),
    total_spent: depts.reduce((sum: number, d: any) => sum + (d.spent_amount || 0), 0),
    total_remaining: depts.reduce((sum: number, d: any) => sum + (d.remaining_budget || 0), 0),
    utilization_pct: depts.reduce((sum: number, d: any) => sum + (d.utilization_percentage || 0), 0) / depts.length,
    anomaly_count: 0,
    high_risk_count: depts.filter((d: any) => d.status === 'at-risk' || d.status === 'exceeded').length,
  }));
};

// Get specific district detail - simulates with budget list filtered
export const getDistrictById = async (districtId: string): Promise<DistrictDetail> => {
  const response = await apiClient.get<any>('/budget/');
  const budgets = response.data.budgets || [];
  
  const districtName = districtId.replace(/-/g, ' ').toUpperCase();
  const departments = budgets; // In real implementation, filter by district
  
  return {
    district: {
      id: districtId,
      name: districtName,
      department_count: departments.length,
    },
    departments: departments.map((d: any) => ({
      dept_id: d.department_id.toString(),
      dept_name: d.department_name,
      district_name: districtName,
      allocated: d.allocated_budget,
      spent: d.spent_amount,
      remaining: d.remaining_budget,
      utilization_pct: d.utilization_percentage,
      has_anomaly: false,
      anomaly_severity: undefined,
      risk_level: d.status === 'exceeded' ? 'critical' : d.status === 'at-risk' ? 'high' : 'low',
    })),
    summary: {
      total_allocated: departments.reduce((sum: number, d: any) => sum + d.allocated_budget, 0),
      total_spent: departments.reduce((sum: number, d: any) => sum + d.spent_amount, 0),
      total_remaining: departments.reduce((sum: number, d: any) => sum + d.remaining_budget, 0),
      utilization_pct: departments.reduce((sum: number, d: any) => sum + d.utilization_percentage, 0) / departments.length,
    },
  };
};

// Get specific department detail
export const getDepartmentById = async (deptId: string): Promise<DepartmentDetail> => {
  const response = await apiClient.get<any>(`/budget/department/${deptId}`);
  const data = response.data;
  
  return {
    department: {
      id: deptId,
      name: data.department_name,
      district_id: 'general',
      district_name: 'District',
      created_at: new Date().toISOString(),
    },
    budget: {
      allocated: data.allocated_budget,
      spent: data.spent_amount,
      remaining: data.remaining_budget,
      utilization_pct: data.utilization_percentage,
    },
    metrics: {
      transaction_count: 0,
      days_since_last_transaction: 0,
      spend_velocity: 0,
      avg_transaction_amount: 0,
    },
    recent_transactions: [],
    active_anomalies: [],
    latest_prediction: undefined,
    spending_trend: [],
  };
};

// Add transaction to department (placeholder)
export const addTransaction = async (
  deptId: string,
  data: AddTransactionRequest
): Promise<AddTransactionResponse> => {
  // Placeholder - would need backend endpoint
  return {
    transaction: {
      id: '0',
      dept_id: deptId,
      amount: data.amount,
      date: data.date,
      category: data.category,
      description: data.description,
      created_at: new Date().toISOString(),
    },
    budget_updated: {
      spent: 0,
      remaining: 0,
      utilization_pct: 0,
    },
  };
};
