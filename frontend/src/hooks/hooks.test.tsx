import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useStudents } from './useStudents';
import { useStudentCard } from './useStudentCard';
import { useStats } from './useStats';

vi.mock('../lib/api', () => ({
  api: { get: vi.fn() },
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    {children}
  </QueryClientProvider>
);

describe('hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('useStudents fetches /api/students', async () => {
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [{ id: '1' }] });

    const { result } = renderHook(() => useStudents(), { wrapper });

    await waitFor(() => expect(result.current.data).toEqual([{ id: '1' }]));
    expect(api.get).toHaveBeenCalledWith('/api/students');
  });

  it('useStudentCard fetches /api/students/{id} only when id is set', async () => {
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { id: '42' } });

    const { result, rerender } = renderHook(({ id }: { id: string | null }) => useStudentCard(id), {
      initialProps: { id: null as string | null },
      wrapper,
    });

    expect(api.get).not.toHaveBeenCalled();

    rerender({ id: '42' });

    await waitFor(() => expect(result.current.data).toEqual({ id: '42' }));
    expect(api.get).toHaveBeenCalledWith('/api/students/42');
  });

  it('useStats fetches /api/students/stats', async () => {
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { total: 5, states: 3 } });

    const { result } = renderHook(() => useStats(), { wrapper });

    await waitFor(() => expect(result.current.data).toEqual({ total: 5, states: 3 }));
    expect(api.get).toHaveBeenCalledWith('/api/students/stats');
  });
});
