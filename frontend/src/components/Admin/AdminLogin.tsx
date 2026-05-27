import { useState } from 'react';
import { adminApi } from '../../lib/api';

interface Props { onLogin: () => void; }

export default function AdminLogin({ onLogin }: Props) {
  const [token, setToken] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!token) return;
    setLoading(true);
    try {
      sessionStorage.setItem('admin-token', token);
      await adminApi.get('/api/admin/alunos');
      onLogin();
    } catch {
      setError(true);
      sessionStorage.removeItem('admin-token');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at center, #0a0f1e 0%, #020408 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: 'rgba(8,10,20,0.9)', backdropFilter: 'blur(20px)',
        border: '1px solid rgba(52,211,153,0.2)', borderRadius: 16,
        padding: 40, width: 340, textAlign: 'center',
      }}>
        <h1 style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 12, color: '#34d399', marginBottom: 24,
          textShadow: '0 0 10px #34d39988',
        }}>
          ADMIN
        </h1>
        <input
          type="password"
          placeholder="Token de acesso"
          value={token}
          onChange={e => { setToken(e.target.value); setError(false); }}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          style={{
            width: '100%', padding: '10px 14px', borderRadius: 8,
            background: 'rgba(255,255,255,0.05)',
            border: `1px solid ${error ? '#ef4444' : 'rgba(255,255,255,0.1)'}`,
            color: '#ffffff', fontSize: 14, marginBottom: 12, outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        {error && <p style={{ color: '#ef4444', fontSize: 12, marginBottom: 12 }}>Token inválido</p>}
        <button
          onClick={handleSubmit}
          disabled={loading || !token}
          style={{
            width: '100%', padding: '10px', borderRadius: 8,
            background: loading || !token ? '#1f3a30' : '#34d399',
            border: 'none', color: '#000',
            fontWeight: 700, fontSize: 14,
            cursor: loading || !token ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </div>
    </div>
  );
}
