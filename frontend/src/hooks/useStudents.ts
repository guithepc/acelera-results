import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { StudentGlobe } from '../types';

export function useStudents() {
  return useQuery<StudentGlobe[]>({
    queryKey: ['students'],
    queryFn:  () => api.get('/api/students').then(r => r.data),
    staleTime: 5 * 60 * 1000,
  });
}
