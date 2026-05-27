import { useRef } from 'react';
import { useLoader } from '@react-three/fiber';
import { TextureLoader } from 'three';
import * as THREE from 'three';

export default function EarthMesh() {
  const meshRef = useRef<THREE.Mesh>(null);
  const texture = useLoader(TextureLoader, `${import.meta.env.BASE_URL}earth-texture.jpg`);

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1, 64, 64]} />
      <meshPhongMaterial
        map={texture}
        shininess={15}
        specular={new THREE.Color(0x1a3a8f)}
      />
    </mesh>
  );
}
