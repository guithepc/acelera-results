import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { AlunoGlobe } from '../types';

export function useAlunos() {
  return useQuery<AlunoGlobe[]>({
    queryKey: ['alunos'],
    queryFn:  () => api.get('/api/alunos').then(r => r.data),
    staleTime: 5 * 60 * 1000,
  });
}
