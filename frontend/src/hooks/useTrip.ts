import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../utils/api';
import { Trip } from '../types';

// Fetch all trips for search/filters
export function useTrips(search = '', budget = '') {
  return useQuery<Trip[]>({
    queryKey: ['trips', search, budget],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (budget) params.append('budget', budget);
      return apiRequest(`/api/trips?${params.toString()}`);
    }
  });
}

// Fetch single trip by ID
export function useTrip(id: string) {
  return useQuery<Trip>({
    queryKey: ['trip', id],
    queryFn: () => apiRequest(`/api/trips/${id}`),
    enabled: !!id
  });
}

// Create new trip mutation
export function useCreateTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData: {
      originCity: string;
      destination: string;
      country: string;
      durationDays: number;
      travelers: number;
      budgetTier: 'Low' | 'Medium' | 'High';
      interests: string[];
      startDate: string;
      endDate: string;
    }) => apiRequest('/api/trips', {
      method: 'POST',
      body: formData
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
    }
  });
}

// Update trip mutation
export function useUpdateTrip(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (updates: Partial<Trip>) => apiRequest(`/api/trips/${id}`, {
      method: 'PUT',
      body: updates
    }),
    onSuccess: (data) => {
      queryClient.setQueryData(['trip', id], data);
      queryClient.invalidateQueries({ queryKey: ['trips'] });
    }
  });
}

// Regenerate single day mutation
export function useRegenerateDay(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { dayNumber: number; promptText: string }) => apiRequest(`/api/trips/${id}/regenerate-day`, {
      method: 'POST',
      body: payload
    }),
    onSuccess: (data) => {
      queryClient.setQueryData(['trip', id], data);
      queryClient.invalidateQueries({ queryKey: ['trips'] });
    }
  });
}

// Delete trip mutation
export function useDeleteTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiRequest(`/api/trips/${id}`, {
      method: 'DELETE'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
    }
  });
}
