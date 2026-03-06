import apiClient from '../lib/api-client';
import type {
  ReallocationSuggestion,
  ReallocationListResponse,
  RejectSuggestionRequest,
} from './types';

// Get all reallocation suggestions
export const getSuggestions = async (): Promise<ReallocationListResponse> => {
  const response = await apiClient.get<ReallocationListResponse>('/api/reallocation/suggestions');
  return response.data;
};

// Approve a reallocation suggestion
export const approveSuggestion = async (suggestionId: string): Promise<ReallocationSuggestion> => {
  const response = await apiClient.post<ReallocationSuggestion>(
    `/api/reallocation/${suggestionId}/approve`
  );
  return response.data;
};

// Reject a reallocation suggestion
export const rejectSuggestion = async (
  suggestionId: string,
  data?: RejectSuggestionRequest
): Promise<ReallocationSuggestion> => {
  const response = await apiClient.post<ReallocationSuggestion>(
    `/api/reallocation/${suggestionId}/reject`,
    data || {}
  );
  return response.data;
};
