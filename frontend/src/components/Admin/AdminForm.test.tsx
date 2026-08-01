import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminForm from './AdminForm';
import { adminApi } from '../../lib/api';

vi.mock('../../lib/api', () => ({
  adminApi: { post: vi.fn(), put: vi.fn() },
}));

describe('AdminForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a student sending stacks and courseTime', async () => {
    (adminApi.post as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { id: 'x' } });

    render(<AdminForm onSaved={() => {}} onCancel={() => {}} />);

    fireEvent.change(screen.getByLabelText(/cidade/i), { target: { value: 'São Paulo' } });
    fireEvent.change(screen.getByLabelText(/UF/i), { target: { value: 'SP' } });
    fireEvent.change(screen.getByLabelText(/salário/i), { target: { value: 'R$ 5.000' } });
    fireEvent.change(screen.getByLabelText(/insight/i), { target: { value: 'Vaga conquistada' } });
    fireEvent.change(screen.getByLabelText(/stacks/i), { target: { value: 'Java, Quarkus' } });
    fireEvent.change(screen.getByLabelText(/tempo no curso/i), { target: { value: '6 meses' } });

    fireEvent.click(screen.getByRole('button', { name: /criar/i }));

    await waitFor(() => {
      expect(adminApi.post).toHaveBeenCalledWith('/api/admin/students', expect.objectContaining({
        city: 'São Paulo',
        state: 'SP',
        stacks: 'Java, Quarkus',
        courseTime: '6 meses',
      }));
    });
  });

  it('editing preserves stacks and courseTime from initial data', () => {
    render(
      <AdminForm
        initial={{
          id: '1',
          anonymousName: 'stellar-falcon',
          avatarUrl: 'https://x',
          area: 'BACKEND',
          gender: 'MALE',
          seniority: 'JUNIOR',
          city: 'São Paulo',
          state: 'SP',
          salary: 'R$ 5.000',
          firstJobInIt: true,
          keyInsight: 'Vaga',
          stacks: 'Java, Quarkus',
          courseTime: '6 meses',
          lat: 1,
          lng: 2,
          createdAt: '2026-01-01',
        }}
        onSaved={() => {}}
        onCancel={() => {}}
      />
    );

    expect(screen.getByLabelText(/stacks/i)).toHaveValue('Java, Quarkus');
    expect(screen.getByLabelText(/tempo no curso/i)).toHaveValue('6 meses');
  });
});
