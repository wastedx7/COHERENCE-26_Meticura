import { useQuery } from '@tanstack/react-query';
import {
  getPredictions,
  getDepartmentPrediction,
} from '../predictions';

const REFETCH_INTERVAL = parseInt(import.meta.env.VITE_REFETCH_INTERVAL || '30000');

// Query Keys
export const predictionKeys = {
  all: ['predictions'] as const,
  lists: () => [...predictionKeys.all, 'list'] as const,
  department: (deptId: string) => [...predictionKeys.all, 'department', deptId] as const,
};

// Get all predictions
export const usePredictions = () => {
  return useQuery({
    queryKey: predictionKeys.lists(),
    queryFn: getPredictions,
    refetchInterval: REFETCH_INTERVAL,
    staleTime: 25000,
    retry: 3,
  });
};

// Get department prediction
export const useDepartmentPrediction = (deptId: string) => {
  return useQuery({
    queryKey: predictionKeys.department(deptId),
    queryFn: () => getDepartmentPrediction(deptId),
    enabled: !!deptId,
    refetchInterval: REFETCH_INTERVAL,
    staleTime: 25000,
    retry: 3,
  });
};
