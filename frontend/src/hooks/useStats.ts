import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Stats } from '../types';

export function useStats() {
  return useQuery<Stats>({
    queryKey: ['stats'],
    queryFn:  () => api.get('/api/alunos/stats').then(r => r.data),
    staleTime: 60 * 1000,
  });
}
