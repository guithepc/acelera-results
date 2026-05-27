import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { latLngToVector3 } from '../../lib/geoUtils';
import { AREA_COLORS } from '../../lib/colors';
import type { AlunoGlobe } from '../../types';

interface Props {
  aluno: AlunoGlobe;
  onClick: () => void;
}

export default function AlunoMarker({ aluno, onClick }: Props) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const position = latLngToVector3(aluno.lat, aluno.lng, 1.01);
  const color    = new THREE.Color(AREA_COLORS[aluno.area] || '#ffffff');

  useFrame(({ clock }) => {
    if (!meshRef.current || !glowRef.current) return;
    const t = clock.getElapsedTime();
    const pulse = Math.sin(t * 2 + aluno.lat) * 0.15 + 0.85;
    meshRef.current.scale.setScalar(hovered ? 2.2 : pulse);
    glowRef.current.scale.setScalar(hovered ? 3.5 : pulse * 2.2);
    (glowRef.current.material as THREE.MeshBasicMaterial).opacity =
      hovered ? 0.5 : (Math.sin(t * 2 + aluno.lat) * 0.15 + 0.25);
  });

  return (
    <group position={position}>
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.012, 8, 8]} />
        <meshBasicMaterial color={color} transparent opacity={0.3} />
      </mesh>

      <mesh
        ref={meshRef}
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        onPointerEnter={() => { setHovered(true); document.body.style.cursor = 'pointer'; }}
        onPointerLeave={() => { setHovered(false); document.body.style.cursor = 'auto'; }}
      >
        <sphereGeometry args={[0.007, 8, 8]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  );
}
