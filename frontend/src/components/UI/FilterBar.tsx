import { AREA_COLORS, AREA_LABELS } from '../../lib/colors';
import type { AlunoArea } from '../../types';

interface Props {
  activeArea: string | null;
  onChange: (area: string | null) => void;
}

export default function FilterBar({ activeArea, onChange }: Props) {
  const areas = Object.keys(AREA_LABELS) as AlunoArea[];

  return (
    <div style={{
      position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)',
      zIndex: 10, display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center',
    }}>
      <button
        onClick={() => onChange(null)}
        style={{
          background: !activeArea ? 'rgba(255,255,255,0.15)' : 'rgba(8,10,20,0.7)',
          backdropFilter: 'blur(10px)',
          border: `1px solid ${!activeArea ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.1)'}`,
          borderRadius: 20, padding: '6px 14px', cursor: 'pointer',
          color: !activeArea ? '#ffffff' : '#64748b',
          fontSize: 12, fontWeight: 600, transition: 'all 0.2s',
        }}
      >
        Todos
      </button>

      {areas.map(area => {
        const color  = AREA_COLORS[area];
        const active = activeArea === area;
        return (
          <button
            key={area}
            onClick={() => onChange(active ? null : area)}
            style={{
              background: active ? `${color}22` : 'rgba(8,10,20,0.7)',
              backdropFilter: 'blur(10px)',
              border: `1px solid ${active ? `${color}66` : 'rgba(255,255,255,0.1)'}`,
              borderRadius: 20, padding: '6px 14px', cursor: 'pointer',
              color: active ? color : '#64748b',
              fontSize: 12, fontWeight: 600, transition: 'all 0.2s',
              boxShadow: active ? `0 0 12px ${color}44` : 'none',
            }}
          >
            {AREA_LABELS[area]}
          </button>
        );
      })}
    </div>
  );
}
