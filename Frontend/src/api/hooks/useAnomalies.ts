import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAnomalies,
  getDepartmentAnomalies,
  resolveAnomaly,
} from '../anomalies';
import type { AnomalyFilters, ResolveAnomalyRequest } from '../types';
import toast from 'react-hot-toast';

const REFETCH_INTERVAL = parseInt(import.meta.env.VITE_REFETCH_INTERVAL || '30000');

// Query Keys
export const anomalyKeys = {
  all: ['anomalies'] as const,
  lists: () => [...anomalyKeys.all, 'list'] as const,
  list: (filters?: AnomalyFilters) => [...anomalyKeys.lists(), filters] as const,
  department: (deptId: string) => [...anomalyKeys.all, 'department', deptId] as const,
};

// Get anomalies with filters
export const useAnomalies = (filters?: AnomalyFilters) => {
  return useQuery({
    queryKey: anomalyKeys.list(filters),
    queryFn: () => getAnomalies(filters),
    refetchInterval: REFETCH_INTERVAL,
    staleTime: 25000,
    retry: 3,
  });
};

// Get department anomalies
export const useDepartmentAnomalies = (deptId: string) => {
  return useQuery({
    queryKey: anomalyKeys.department(deptId),
    queryFn: () => getDepartmentAnomalies(deptId),
    enabled: !!deptId,
    refetchInterval: REFETCH_INTERVAL,
    staleTime: 25000,
    retry: 3,
  });
};

// Resolve anomaly mutation
export const useResolveAnomaly = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ anomalyId, data }: { anomalyId: string; data?: ResolveAnomalyRequest }) =>
      resolveAnomaly(anomalyId, data),
    onSuccess: () => {
      // Invalidate all anomaly queries
      queryClient.invalidateQueries({ queryKey: anomalyKeys.all });
      queryClient.invalidateQueries({ queryKey: ['budget'] });
      
      toast.success('Anomaly resolved successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to resolve anomaly');
    },
  });
};
