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

  const { data: students, isLoading: loadingGlobe } = useStudents();
  const { data: card, isFetching: loadingCard } = useStudentCard(selectedId);
  const { data: stats } = useStats();

  if (loadingGlobe) return <LoadingScreen />;

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
