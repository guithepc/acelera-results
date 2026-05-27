import { useState } from 'react';
import GlobeScene from '../components/Globe/GlobeScene';
import AlunoCard from '../components/UI/AlunoCard';
import StatsCounter from '../components/UI/StatsCounter';
import FilterBar from '../components/UI/FilterBar';
import LoadingScreen from '../components/UI/LoadingScreen';
import { useAlunos } from '../hooks/useAlunos';
import { useAlunoCard } from '../hooks/useAlunoCard';
import { useStats } from '../hooks/useStats';

export default function GlobePage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeArea, setActiveArea] = useState<string | null>(null);

  const { data: alunos, isLoading: loadingGlobe } = useAlunos();
  const { data: card,   isFetching: loadingCard } = useAlunoCard(selectedId);
  const { data: stats } = useStats();

  if (loadingGlobe) return <LoadingScreen />;

  return (
    <div style={{
      width: '100vw', height: '100vh', overflow: 'hidden',
      background: 'radial-gradient(ellipse at center, #0a0f1e 0%, #020408 100%)',
      position: 'relative',
    }}>
      <StatsCounter stats={stats} />

      <GlobeScene
        alunos={alunos || []}
        activeArea={activeArea}
        onMarkerClick={setSelectedId}
      />

      <AlunoCard
        aluno={card || null}
        loading={loadingCard}
        onClose={() => setSelectedId(null)}
      />

      <FilterBar
        activeArea={activeArea}
        onChange={setActiveArea}
      />
    </div>
  );
}
