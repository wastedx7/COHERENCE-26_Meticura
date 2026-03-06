// API Type Definitions

// ============= Core Domain Types =============

export interface Department {
  id: string;
  name: string;
  district_id: string;
  district_name?: string;
  created_at: string;
}

export interface BudgetAllocation {
  id: string;
  dept_id: string;
  fiscal_year: number;
  allocated: number;
  created_at: string;
}

export interface Transaction {
  id: string;
  dept_id: string;
  amount: number;
  date: string;
  category: string;
  description: string;
  created_at: string;
}

export interface Anomaly {
  id: string;
  dept_id: string;
  dept_name?: string;
  district_name?: string;
  anomaly_type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  detected_at: string;
  details: Record<string, any>;
  resolved_at?: string;
  resolution_note?: string;
}

export interface Prediction {
  id: string;
  dept_id: string;
  dept_name?: string;
  district_name?: string;
  predicted_lapse: number;
  risk_level: 'critical' | 'high' | 'medium' | 'low' | 'none';
  confidence_score: number;
  generated_at: string;
  features?: Record<string, any>;
}

export interface ReallocationSuggestion {
  id: string;
  donor_dept_id: string;
  donor_dept_name?: string;
  recipient_dept_id: string;
  recipient_dept_name?: string;
  amount: number;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'approved' | 'rejected';
  generated_at: string;
  processed_at?: string;
  processed_by?: string;
  rejection_reason?: string;
}

export interface District {
  id: string;
  name: string;
  department_count: number;
}

// ============= Request Types =============

export interface AddTransactionRequest {
  amount: number;
  date: string;
  category: string;
  description: string;
}

export interface ResolveAnomalyRequest {
  resolution_note?: string;
}

export interface RejectSuggestionRequest {
  rejection_reason?: string;
}

export interface AnomalyFilters {
  severity?: string[];
  status?: 'active' | 'resolved' | 'all';
  district_id?: string;
  dept_id?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}

// ============= Response Types =============

export interface NationalOverview {
  total_allocated: number;
  total_spent: number;
  total_remaining: number;
  utilization_pct: number;
  high_risk_count: number;
  pending_reallocations: number;
  critical_anomalies: number;
  last_updated: string;
}

export interface DistrictSummary {
  district_id: string;
  district_name: string;
  department_count: number;
  total_allocated: number;
  total_spent: number;
  total_remaining: number;
  utilization_pct: number;
  anomaly_count: number;
  high_risk_count: number;
}

export interface DistrictDetail {
  district: District;
  departments: DepartmentSummary[];
  summary: {
    total_allocated: number;
    total_spent: number;
    total_remaining: number;
    utilization_pct: number;
  };
}

export interface DepartmentSummary {
  dept_id: string;
  dept_name: string;
  district_name: string;
  allocated: number;
  spent: number;
  remaining: number;
  utilization_pct: number;
  has_anomaly: boolean;
  anomaly_severity?: 'critical' | 'high' | 'medium' | 'low';
  risk_level?: 'critical' | 'high' | 'medium' | 'low' | 'none';
  last_transaction_date?: string;
}

export interface DepartmentDetail {
  department: Department;
  budget: {
    allocated: number;
    spent: number;
    remaining: number;
    utilization_pct: number;
  };
  metrics: {
    transaction_count: number;
    days_since_last_transaction: number;
    spend_velocity: number;
    avg_transaction_amount: number;
  };
  recent_transactions: Transaction[];
  active_anomalies: Anomaly[];
  latest_prediction?: Prediction;
  spending_trend?: SpendingDataPoint[];
}

export interface SpendingDataPoint {
  date: string;
  cumulative_spent: number;
  is_predicted?: boolean;
}

export interface AnomalyListResponse {
  anomalies: Anomaly[];
  total: number;
  limit: number;
  offset: number;
}

export interface PredictionListResponse {
  predictions: Prediction[];
  total: number;
}

export interface ReallocationListResponse {
  suggestions: ReallocationSuggestion[];
  total: number;
  grouped_by_district?: Record<string, ReallocationSuggestion[]>;
}

export interface AddTransactionResponse {
  transaction: Transaction;
  new_anomalies?: Anomaly[];
  budget_updated: {
    spent: number;
    remaining: number;
    utilization_pct: number;
  };
}

// ============= API Error Types =============

export interface APIError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// ============= Utility Types =============

export type RiskLevel = 'critical' | 'high' | 'medium' | 'low' | 'none';
export type AnomalySeverity = 'critical' | 'high' | 'medium' | 'low';
export type SuggestionStatus = 'pending' | 'approved' | 'rejected';
export type SuggestionPriority = 'high' | 'medium' | 'low';
