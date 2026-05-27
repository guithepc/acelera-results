import * as THREE from 'three';

export default function AtmosphereGlow() {
  return (
    <mesh>
      <sphereGeometry args={[1.06, 64, 64]} />
      <meshBasicMaterial
        color={new THREE.Color(0x1a6fff)}
        side={THREE.BackSide}
        transparent
        opacity={0.08}
      />
    </mesh>
  );
}
