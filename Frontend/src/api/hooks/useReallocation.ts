import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getSuggestions,
  approveSuggestion,
  rejectSuggestion,
} from '../reallocation';
import type { RejectSuggestionRequest } from '../types';
import toast from 'react-hot-toast';

const REFETCH_INTERVAL = parseInt(import.meta.env.VITE_REFETCH_INTERVAL || '30000');

// Query Keys
export const reallocationKeys = {
  all: ['reallocation'] as const,
  suggestions: () => [...reallocationKeys.all, 'suggestions'] as const,
};

// Get all reallocation suggestions
export const useReallocationSuggestions = () => {
  return useQuery({
    queryKey: reallocationKeys.suggestions(),
    queryFn: getSuggestions,
    refetchInterval: REFETCH_INTERVAL,
    staleTime: 25000,
    retry: 3,
  });
};

// Approve suggestion mutation
export const useApproveSuggestion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (suggestionId: string) => approveSuggestion(suggestionId),
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: reallocationKeys.all });
      queryClient.invalidateQueries({ queryKey: ['budget'] });
      
      toast.success('Reallocation approved and executed');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to approve reallocation');
    },
  });
};

// Reject suggestion mutation
export const useRejectSuggestion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ suggestionId, data }: { suggestionId: string; data?: RejectSuggestionRequest }) =>
      rejectSuggestion(suggestionId, data),
    onSuccess: () => {
      // Invalidate reallocation queries
      queryClient.invalidateQueries({ queryKey: reallocationKeys.all });
      
      toast.success('Reallocation suggestion rejected');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to reject suggestion');
    },
  });
};
