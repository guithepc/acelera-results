import { useEffect, useRef } from 'react';
import type { Stats } from '../../types';

interface Props {
  stats: Stats | undefined;
}

function AnimatedNumber({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const duration = 1500;
    const step = (timestamp: number, startTime: number) => {
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      if (ref.current) ref.current.textContent = Math.floor(eased * value).toString();
      if (progress < 1) requestAnimationFrame(t => step(t, startTime));
    };
    requestAnimationFrame(t => step(t, t));
  }, [value]);
  return <span ref={ref}>0</span>;
}

export default function StatsCounter({ stats }: Props) {
  if (!stats) return null;

  return (
    <div style={{
      position: 'absolute', top: 24, left: '50%', transform: 'translateX(-50%)',
      zIndex: 10, pointerEvents: 'none',
    }}>
      <p style={{
        fontFamily: "'Press Start 2P', monospace",
        fontSize: '9px',
        color: '#34d399',
        textAlign: 'center',
        marginBottom: 10,
        letterSpacing: '0.05em',
        textShadow: '0 0 10px #34d39988',
      }}>
        AceleraDev conquistando o mundo
      </p>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        {[
          { label: 'DEVS', value: stats.total },
          { label: 'ESTADOS', value: stats.states },
        ].map(({ label, value }) => (
          <div key={label} style={{
            background: 'rgba(8,10,20,0.85)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(52,211,153,0.3)',
            borderRadius: 8,
            padding: '6px 14px',
            textAlign: 'center',
            boxShadow: '0 0 15px rgba(52,211,153,0.1)',
          }}>
            <div style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: '14px',
              color: '#34d399',
              textShadow: '0 0 8px #34d39966',
            }}>
              <AnimatedNumber value={value} />
            </div>
            <div style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: '6px',
              color: '#475569',
              marginTop: 4,
              letterSpacing: '0.1em',
            }}>
              {label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
