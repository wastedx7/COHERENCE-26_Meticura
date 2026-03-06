import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import {
  getNationalOverview,
  getDistricts,
  getDistrictById,
  getDepartmentById,
  addTransaction,
} from '../budget';
import type { AddTransactionRequest } from '../types';
import toast from 'react-hot-toast';

const REFETCH_INTERVAL = parseInt(import.meta.env.VITE_REFETCH_INTERVAL || '30000');

// Query Keys
export const budgetKeys = {
  all: ['budget'] as const,
  overview: () => [...budgetKeys.all, 'overview'] as const,
  districts: () => [...budgetKeys.all, 'districts'] as const,
  district: (id: string) => [...budgetKeys.all, 'district', id] as const,
  department: (id: string) => [...budgetKeys.all, 'department', id] as const,
};

// Get national overview with 30s auto-refresh
export const useNationalOverview = () => {
  const { isLoaded, isSignedIn } = useAuth();
  return useQuery({
    queryKey: budgetKeys.overview(),
    queryFn: getNationalOverview,
    enabled: isLoaded && isSignedIn,
    refetchInterval: REFETCH_INTERVAL,
    staleTime: 25000, // Consider fresh for 25s
    retry: 3,
  });
};

// Get all districts
export const useDistricts = () => {
  const { isLoaded, isSignedIn } = useAuth();
  return useQuery({
    queryKey: budgetKeys.districts(),
    queryFn: getDistricts,
    enabled: isLoaded && isSignedIn,
    refetchInterval: REFETCH_INTERVAL,
    staleTime: 25000,
    retry: 3,
  });
};

// Get specific district detail
export const useDistrictDetail = (districtId: string) => {
  const { isLoaded, isSignedIn } = useAuth();
  return useQuery({
    queryKey: budgetKeys.district(districtId),
    queryFn: () => getDistrictById(districtId),
    enabled: isLoaded && isSignedIn && !!districtId,
    refetchInterval: REFETCH_INTERVAL,
    staleTime: 25000,
    retry: 3,
  });
};

// Get specific department detail
export const useDepartmentDetail = (deptId: string) => {
  const { isLoaded, isSignedIn } = useAuth();
  return useQuery({
    queryKey: budgetKeys.department(deptId),
    queryFn: () => getDepartmentById(deptId),
    enabled: isLoaded && isSignedIn && !!deptId,
    refetchInterval: REFETCH_INTERVAL,
    staleTime: 25000,
    retry: 3,
  });
};

// Add transaction mutation
export const useAddTransaction = (deptId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AddTransactionRequest) => addTransaction(deptId, data),
    onSuccess: (data) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: budgetKeys.department(deptId) });
      queryClient.invalidateQueries({ queryKey: budgetKeys.overview() });
      queryClient.invalidateQueries({ queryKey: ['anomalies'] });

      // Show success message
      const anomalyCount = data.new_anomalies?.length || 0;
      if (anomalyCount > 0) {
        toast.success(
          `Transaction added. ${anomalyCount} new anomaly detected.`,
          { duration: 5000 }
        );
      } else {
        toast.success('Transaction added successfully');
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to add transaction');
    },
  });
};
