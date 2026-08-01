import { useState } from 'react';
import MapboxGlobe from '../components/Globe/MapboxGlobe';
import StatsCounter from '../components/UI/StatsCounter';
import FilterBar from '../components/UI/FilterBar';
import LoadingScreen from '../components/UI/LoadingScreen';
import { useStudents } from '../hooks/useStudents';
import { useStudentCard } from '../hooks/useStudentCard';
import { useStats } from '../hooks/useStats';

export default function GlobePage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeArea, setActiveArea] = useState<string | null>(null);

  const { data: students, isLoading: loadingGlobe, error, refetch } = useStudents();
  const { data: card, isFetching: loadingCard } = useStudentCard(selectedId);
  const { data: stats } = useStats();

  if (loadingGlobe) return <LoadingScreen />;

  if (error) {
    return (
      <div style={{
        width: '100vw', height: '100vh',
        display: 'flex', flexDirection: 'column', gap: 16,
        alignItems: 'center', justifyContent: 'center',
        background: 'radial-gradient(ellipse at center, #0a0f1e 0%, #020408 100%)',
      }}>
        <p style={{ color: '#94a3b8', fontSize: 15, margin: 0 }}>
          Não foi possível carregar os dados
        </p>
        <button
          onClick={() => refetch()}
          style={{
            background: '#34d399', color: '#000', border: 'none',
            padding: '10px 24px', borderRadius: 8,
            fontWeight: 700, fontSize: 14, cursor: 'pointer',
          }}
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div style={{
      width: '100vw', height: '100vh', overflow: 'hidden',
      position: 'relative',
    }}>
      <MapboxGlobe
        students={students || []}
        activeArea={activeArea}
        onMarkerClick={setSelectedId}
        selectedId={selectedId}
        card={card || null}
        loadingCard={loadingCard}
        onClose={() => setSelectedId(null)}
      />

      <StatsCounter stats={stats} />

      <FilterBar
        activeArea={activeArea}
        onChange={setActiveArea}
      />
    </div>
  );
}
