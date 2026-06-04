import { useState } from 'react';
import MapboxGlobe from '../components/Globe/MapboxGlobe';

import StatsCounter from '../components/UI/StatsCounter';
import FilterBar from '../components/UI/FilterBar';
import LoadingScreen from '../components/UI/LoadingScreen';
import FloatingStatsPanel from '../components/UI/FloatingStatsPanel'; // <-- IMPORT ADICIONADO
import { useAlunos } from '../hooks/useAlunos';
import { useAlunoCard } from '../hooks/useAlunoCard';
import { useStats } from '../hooks/useStats';

export default function GlobePage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeArea, setActiveArea] = useState<string | null>(null);

  const { data: alunos, isLoading: loadingGlobe } = useAlunos();
  const { data: card, isFetching: loadingCard } = useAlunoCard(selectedId);
  const { data: stats } = useStats();

  if (loadingGlobe) return <LoadingScreen />;

  return (
    <div style={{
      width: '100vw', height: '100vh', overflow: 'hidden',
      position: 'relative',
    }}>
      <MapboxGlobe
        alunos={alunos || []}
        activeArea={activeArea}
        onMarkerClick={setSelectedId}
        selectedId={selectedId}
        card={card || null}
        loadingCard={loadingCard}
        onClose={() => setSelectedId(null)}
      />

      {/* PAINEL FLUTUANTE ADICIONADO AQUI */}
      <FloatingStatsPanel />

      <StatsCounter stats={stats} />

      <FilterBar
        activeArea={activeArea}
        onChange={setActiveArea}
      />
    </div>
  );
}