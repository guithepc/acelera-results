import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { Suspense } from 'react';
import EarthMesh from './EarthMesh';
import StudentMarker from './StudentMarker';
import AtmosphereGlow from './AtmosphereGlow';
import type { StudentGlobe } from '../../types';

interface Props {
  students: StudentGlobe[];
  activeArea: string | null;
  onMarkerClick: (id: string) => void;
}

export default function GlobeScene({ students, activeArea, onMarkerClick }: Props) {
  return (
    <Canvas
      camera={{ position: [0, 0, 2.8], fov: 45 }}
      style={{ background: 'transparent' }}
      dpr={[1, 2]}
    >
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 3, 5]} intensity={1.2} color="#ffffff" />
      <pointLight position={[-5, -3, -5]} intensity={0.3} color="#1a3a8f" />

      <Stars
        radius={100}
        depth={50}
        count={6000}
        factor={4}
        saturation={0.3}
        fade
        speed={0.3}
      />

      <Suspense fallback={null}>
        <EarthMesh />
        <AtmosphereGlow />

        {students
          .filter(s => !activeArea || s.area === activeArea)
          .map(student => (
            <StudentMarker
              key={student.id}
              student={student}
              onClick={() => onMarkerClick(student.id)}
            />
          ))}
      </Suspense>

      <OrbitControls
        enableZoom={true}
        enablePan={false}
        minDistance={1.8}
        maxDistance={5}
        autoRotate
        autoRotateSpeed={0.4}
        rotateSpeed={0.5}
      />
    </Canvas>
  );
}
