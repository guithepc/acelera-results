import { motion, AnimatePresence } from 'framer-motion';
import type { AlunoCard as AlunoCardType } from '../../types';
import { AREA_COLORS, AREA_LABELS } from '../../lib/colors';

interface Props {
  aluno: AlunoCardType | null;
  onClose: () => void;
  loading: boolean;
}

export default function AlunoCard({ aluno, onClose, loading }: Props) {
  const areaColor = aluno ? AREA_COLORS[aluno.area] : '#ffffff';

  return (
    <AnimatePresence>
      {(aluno || loading) && (
        <motion.div
          key="card"
          initial={{ opacity: 0, x: 60, scale: 0.95 }}
          animate={{ opacity: 1, x: 0,  scale: 1 }}
          exit={{   opacity: 0, x: 60,  scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="absolute right-6 top-1/2 -translate-y-1/2 z-10"
          style={{ width: '320px' }}
        >
          <div style={{
            position: 'relative',
            background: 'rgba(8, 10, 20, 0.92)',
            backdropFilter: 'blur(20px)',
            border: `1px solid ${areaColor}33`,
            borderRadius: '16px',
            padding: '24px',
            boxShadow: `0 0 40px ${areaColor}22, 0 20px 60px rgba(0,0,0,0.6)`,
          }}>

            {loading ? (
              <div className="space-y-3 animate-pulse">
                <div style={{ height: 80, width: 80, borderRadius: '50%', background: '#1a2030', margin: '0 auto 16px' }} />
                <div style={{ height: 20, background: '#1a2030', borderRadius: 6, marginBottom: 8 }} />
                <div style={{ height: 14, background: '#1a2030', borderRadius: 6, width: '60%', margin: '0 auto 16px' }} />
                <div style={{ height: 60, background: '#1a2030', borderRadius: 6 }} />
              </div>
            ) : aluno && (
              <>
                <button
                  onClick={onClose}
                  style={{
                    position: 'absolute', top: 14, right: 14,
                    background: 'rgba(255,255,255,0.08)',
                    border: 'none', borderRadius: '50%',
                    width: 28, height: 28, cursor: 'pointer',
                    color: '#94a3b8', fontSize: 16, lineHeight: '28px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                >×</button>

                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                  <img
                    src={aluno.avatarUrl}
                    alt={aluno.anonymousName}
                    style={{
                      width: 80, height: 80, borderRadius: '50%',
                      display: 'inline-block',
                      border: `2px solid ${areaColor}66`,
                      boxShadow: `0 0 20px ${areaColor}44`,
                    }}
                  />
                </div>

                <h3 style={{
                  fontFamily: "'Press Start 2P', monospace",
                  fontSize: '11px',
                  color: '#ffffff',
                  textAlign: 'center',
                  marginBottom: 6,
                  marginTop: 0,
                  lineHeight: 1.6,
                }}>
                  {aluno.anonymousName}
                </h3>

                <p style={{
                  textAlign: 'center', color: '#64748b',
                  fontSize: 12, marginBottom: 16, marginTop: 0,
                }}>
                  {aluno.city}, {aluno.state}
                </p>

                <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
                  <span style={{
                    background: `${areaColor}22`,
                    color: areaColor,
                    border: `1px solid ${areaColor}44`,
                    padding: '3px 10px', borderRadius: 20,
                    fontSize: 11, fontWeight: 600,
                  }}>
                    {AREA_LABELS[aluno.area]}
                  </span>
                  {aluno.firstJobInIt && (
                    <span style={{
                      background: 'rgba(251,191,36,0.15)',
                      color: '#fbbf24',
                      border: '1px solid rgba(251,191,36,0.3)',
                      padding: '3px 10px', borderRadius: 20,
                      fontSize: 11, fontWeight: 600,
                    }}>
                      1ª vaga em TI ⭐
                    </span>
                  )}
                </div>

                <div style={{
                  background: 'rgba(255,255,255,0.04)',
                  borderRadius: 8, padding: '8px 12px',
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', marginBottom: 16,
                }}>
                  <span style={{ color: '#64748b', fontSize: 12 }}>Salário</span>
                  <span style={{ color: '#ffffff', fontSize: 13, fontWeight: 600 }}>
                    {aluno.salary}
                  </span>
                </div>

                <div style={{
                  background: 'rgba(255,255,255,0.04)',
                  borderRadius: 8, padding: '12px',
                  borderLeft: `3px solid ${areaColor}`,
                }}>
                  <p style={{ color: '#94a3b8', fontSize: 11, lineHeight: 1.7, margin: 0, fontStyle: 'italic' }}>
                    "{aluno.keyInsight}"
                  </p>
                </div>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
