import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { StudentCard } from '../types';

export function useStudentCard(id: string | null) {
  return useQuery<StudentCard>({
    queryKey: ['student-card', id],
    queryFn:  () => api.get(`/api/students/${id}`).then(r => r.data),
    enabled:  !!id,
  });
}
