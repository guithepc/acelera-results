import { useMemo, useState } from 'react';
import type { AlunoAdmin, AlunoArea } from '../../types';
import { AREA_COLORS, AREA_LABELS } from '../../lib/colors';
import { adminApi } from '../../lib/api';

interface Props {
  alunos: AlunoAdmin[];
  onEdit: (a: AlunoAdmin) => void;
  onChanged: () => void;
}

export default function AdminTable({ alunos, onEdit, onChanged }: Props) {
  const [search, setSearch] = useState('');
  const [areaFilter, setAreaFilter] = useState<AlunoArea | ''>('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return alunos.filter(a => {
      if (areaFilter && a.area !== areaFilter) return false;
      if (search && !a.anonymousName.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [alunos, search, areaFilter]);

  const handleDelete = async (id: string) => {
    if (!confirm('Deletar esse aluno?')) return;
    setBusyId(id);
    try {
      await adminApi.delete(`/api/admin/alunos/${id}`);
      onChanged();
    } finally {
      setBusyId(null);
    }
  };

  const handleRegenerate = async (id: string) => {
    setBusyId(id);
    try {
      await adminApi.patch(`/api/admin/alunos/${id}/regenerate`);
      onChanged();
    } finally {
      setBusyId(null);
    }
  };

  const inputStyle: React.CSSProperties = {
    padding: '8px 12px', borderRadius: 8,
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#ffffff', fontSize: 14, outline: 'none',
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input
          placeholder="Buscar por nome..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...inputStyle, flex: 1 }}
        />
        <select
          value={areaFilter}
          onChange={e => setAreaFilter(e.target.value as AlunoArea | '')}
          style={inputStyle}
        >
          <option value="">Todas áreas</option>
          {(Object.keys(AREA_LABELS) as AlunoArea[]).map(a => (
            <option key={a} value={a}>{AREA_LABELS[a]}</option>
          ))}
        </select>
      </div>

      <div style={{
        background: 'rgba(8,10,20,0.6)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 12, overflow: 'hidden',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
              {['Avatar', 'Nome', 'Área', 'Localização', 'Salário', '1ª vaga', 'Ações'].map(h => (
                <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#94a3b8', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={7} style={{ padding: 24, textAlign: 'center', color: '#64748b' }}>Nenhum aluno</td></tr>
            )}
            {filtered.map(a => {
              const color = AREA_COLORS[a.area];
              const busy = busyId === a.id;
              return (
                <tr key={a.id} style={{ borderTop: '1px solid rgba(255,255,255,0.04)', opacity: busy ? 0.5 : 1 }}>
                  <td style={{ padding: '8px 12px' }}>
                    <img src={a.avatarUrl} alt="" style={{ width: 32, height: 32, borderRadius: '50%', border: `1px solid ${color}66` }} />
                  </td>
                  <td style={{ padding: '8px 12px', color: '#ffffff', fontFamily: "'Press Start 2P', monospace", fontSize: 9 }}>
                    {a.anonymousName}
                  </td>
                  <td style={{ padding: '8px 12px' }}>
                    <span style={{ background: `${color}22`, color, padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600 }}>
                      {AREA_LABELS[a.area]}
                    </span>
                  </td>
                  <td style={{ padding: '8px 12px', color: '#cbd5e1' }}>{a.city}, {a.state}</td>
                  <td style={{ padding: '8px 12px', color: '#cbd5e1' }}>{a.salary}</td>
                  <td style={{ padding: '8px 12px', color: '#cbd5e1' }}>{a.firstJobInIt ? '⭐' : ''}</td>
                  <td style={{ padding: '8px 12px', display: 'flex', gap: 6 }}>
                    <button onClick={() => onEdit(a)} disabled={busy} style={btn('#60A5FA')}>Editar</button>
                    <button onClick={() => handleRegenerate(a.id)} disabled={busy} style={btn('#FBBF24')} title="Regerar nome+avatar via IA">↻ IA</button>
                    <button onClick={() => handleDelete(a.id)} disabled={busy} style={btn('#ef4444')}>Del</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function btn(color: string): React.CSSProperties {
  return {
    background: `${color}22`,
    color, border: `1px solid ${color}44`,
    padding: '4px 10px', borderRadius: 6,
    fontSize: 11, fontWeight: 600, cursor: 'pointer',
  };
}
