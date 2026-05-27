import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { AlunoCard } from '../types';

export function useAlunoCard(id: string | null) {
  return useQuery<AlunoCard>({
    queryKey: ['aluno-card', id],
    queryFn:  () => api.get(`/api/alunos/${id}`).then(r => r.data),
    enabled:  !!id,
  });
}
