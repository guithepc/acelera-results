import { useState } from 'react';
import type { AlunoAdmin, AlunoArea, AlunoGender, CreateAlunoRequest } from '../../types';
import { AREA_LABELS } from '../../lib/colors';
import { adminApi } from '../../lib/api';

interface Props {
  initial?: AlunoAdmin | null;
  onSaved: (a: AlunoAdmin) => void;
  onCancel: () => void;
}

const EMPTY: CreateAlunoRequest = {
  area: 'BACKEND',
  gender: 'MALE',
  city: '',
  state: '',
  salary: '',
  firstJobInIt: false,
  keyInsight: '',
};

const GENDER_LABELS: Record<AlunoGender, string> = {
  MALE: 'Masculino',
  FEMALE: 'Feminino',
  OTHER: 'Outro',
};

export default function AdminForm({ initial, onSaved, onCancel }: Props) {
  const [form, setForm] = useState<CreateAlunoRequest>(
    initial
      ? {
          area: initial.area,
          gender: initial.gender,
          city: initial.city,
          state: initial.state,
          salary: initial.salary,
          firstJobInIt: initial.firstJobInIt,
          keyInsight: initial.keyInsight,
        }
      : EMPTY
  );
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  const isEdit = !!initial;

  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      const resp = isEdit
        ? await adminApi.put<AlunoAdmin>(`/api/admin/alunos/${initial!.id}`, form)
        : await adminApi.post<AlunoAdmin>('/api/admin/alunos', form);
      onSaved(resp.data);
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const field = (label: string, child: React.ReactNode) => (
    <label style={{ display: 'block', marginBottom: 12 }}>
      <span style={{ display: 'block', fontSize: 11, color: '#94a3b8', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </span>
      {child}
    </label>
  );

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px', borderRadius: 8,
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#ffffff', fontSize: 14, outline: 'none', boxSizing: 'border-box',
  };

  const areas = Object.keys(AREA_LABELS) as AlunoArea[];

  return (
    <div style={{
      background: 'rgba(8,10,20,0.95)',
      border: '1px solid rgba(52,211,153,0.2)',
      borderRadius: 12, padding: 24, maxWidth: 480,
    }}>
      <h2 style={{ marginTop: 0, marginBottom: 20, color: '#fff', fontSize: 18 }}>
        {isEdit ? 'Editar aluno' : 'Novo aluno'}
      </h2>

      {field('Área', (
        <select
          value={form.area}
          onChange={e => setForm({ ...form, area: e.target.value as AlunoArea })}
          style={inputStyle}
        >
          {areas.map(a => <option key={a} value={a}>{AREA_LABELS[a]}</option>)}
        </select>
      ))}

      {field('Gênero', (
        <select
          value={form.gender}
          onChange={e => setForm({ ...form, gender: e.target.value as AlunoGender })}
          style={inputStyle}
        >
          {(Object.keys(GENDER_LABELS) as AlunoGender[]).map(g => (
            <option key={g} value={g}>{GENDER_LABELS[g]}</option>
          ))}
        </select>
      ))}

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
        {field('Cidade', (
          <input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} style={inputStyle} />
        ))}
        {field('UF', (
          <input value={form.state} maxLength={2} onChange={e => setForm({ ...form, state: e.target.value.toUpperCase() })} style={inputStyle} />
        ))}
      </div>

      {field('Salário (texto livre)', (
        <input value={form.salary} placeholder="R$ 5.000 / € 2.800" onChange={e => setForm({ ...form, salary: e.target.value })} style={inputStyle} />
      ))}

      <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, fontSize: 13, color: '#cbd5e1' }}>
        <input
          type="checkbox"
          checked={form.firstJobInIt}
          onChange={e => setForm({ ...form, firstJobInIt: e.target.checked })}
        />
        Primeira vaga em TI
      </label>

      {field('Insight', (
        <textarea
          value={form.keyInsight}
          onChange={e => setForm({ ...form, keyInsight: e.target.value })}
          rows={3}
          style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
        />
      ))}

      {error && (
        <p style={{ color: '#ef4444', fontSize: 12, marginBottom: 12 }}>{error}</p>
      )}

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button
          onClick={onCancel}
          disabled={saving}
          style={{
            padding: '8px 16px', borderRadius: 8,
            background: 'rgba(255,255,255,0.08)', border: 'none',
            color: '#cbd5e1', fontSize: 13, cursor: 'pointer',
          }}
        >
          Cancelar
        </button>
        <button
          onClick={submit}
          disabled={saving}
          style={{
            padding: '8px 16px', borderRadius: 8,
            background: saving ? '#1f3a30' : '#34d399', border: 'none',
            color: '#000', fontWeight: 700, fontSize: 13,
            cursor: saving ? 'not-allowed' : 'pointer',
          }}
        >
          {saving ? 'Salvando...' : isEdit ? 'Salvar' : 'Criar (~5-10s)'}
        </button>
      </div>
    </div>
  );
}
