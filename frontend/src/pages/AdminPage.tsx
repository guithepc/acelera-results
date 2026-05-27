import { useEffect, useState } from 'react';
import AdminLogin from '../components/Admin/AdminLogin';
import AdminTable from '../components/Admin/AdminTable';
import AdminForm  from '../components/Admin/AdminForm';
import { adminApi } from '../lib/api';
import type { AlunoAdmin } from '../types';

export default function AdminPage() {
  const [authed, setAuthed] = useState(!!sessionStorage.getItem('admin-token'));
  const [alunos, setAlunos] = useState<AlunoAdmin[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<AlunoAdmin | null>(null);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await adminApi.get<AlunoAdmin[]>('/api/admin/alunos');
      setAlunos(r.data);
    } catch {
      setAuthed(false);
      sessionStorage.removeItem('admin-token');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (authed) load(); }, [authed]);

  if (!authed) return <AdminLogin onLogin={() => setAuthed(true)} />;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at center, #0a0f1e 0%, #020408 100%)',
      padding: 32, overflowY: 'auto',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h1 style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 14, color: '#34d399', margin: 0,
            textShadow: '0 0 10px #34d39988',
          }}>
            ADMIN — ALUNOS
          </h1>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => { setCreating(true); setEditing(null); }}
              style={{
                background: '#34d399', color: '#000', border: 'none',
                padding: '8px 16px', borderRadius: 8, fontWeight: 700, cursor: 'pointer',
              }}
            >
              + Novo aluno
            </button>
            <button
              onClick={() => { sessionStorage.removeItem('admin-token'); setAuthed(false); }}
              style={{
                background: 'rgba(255,255,255,0.08)', color: '#cbd5e1',
                border: '1px solid rgba(255,255,255,0.1)',
                padding: '8px 16px', borderRadius: 8, cursor: 'pointer',
              }}
            >
              Sair
            </button>
          </div>
        </div>

        {(creating || editing) && (
          <div style={{ marginBottom: 24 }}>
            <AdminForm
              initial={editing}
              onSaved={() => { setCreating(false); setEditing(null); load(); }}
              onCancel={() => { setCreating(false); setEditing(null); }}
            />
          </div>
        )}

        {loading ? (
          <p style={{ color: '#94a3b8' }}>carregando...</p>
        ) : (
          <AdminTable
            alunos={alunos}
            onEdit={a => { setEditing(a); setCreating(false); }}
            onChanged={load}
          />
        )}
      </div>
    </div>
  );
}
