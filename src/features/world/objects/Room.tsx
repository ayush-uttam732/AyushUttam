import { useMemo } from "react";

import { glow, rugTexture, woodFloorTexture } from "../../../lib/three-helpers";

const topStrip = glow("#7a5cff", 3);
const topStripBlue = glow("#4f86ff", 3);

export function Room() {
  const floor = useMemo(() => woodFloorTexture(), []);
  const rug = useMemo(() => rugTexture(), []);

  return (
    <group>
      {/* floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.08, 0]} receiveShadow>
        <planeGeometry args={[24, 24]} />
        <meshStandardMaterial map={floor} roughness={0.55} metalness={0.06} />
      </mesh>

      {/* walls */}
      <mesh position={[0, 3, -4]} receiveShadow>
        <boxGeometry args={[12, 6, 0.25]} />
        <meshStandardMaterial color="#24222b" roughness={0.95} />
      </mesh>
      <mesh position={[-6, 3, 0]} receiveShadow>
        <boxGeometry args={[0.25, 6, 8]} />
        <meshStandardMaterial color="#1a1c24" roughness={0.92} />
      </mesh>
      <mesh position={[6, 3, 0]} receiveShadow>
        <boxGeometry args={[0.25, 6, 8]} />
        <meshStandardMaterial color="#25232a" roughness={0.92} />
      </mesh>

      {/* baseboards */}
      <mesh position={[0, 0.09, -3.85]}>
        <boxGeometry args={[11.8, 0.18, 0.06]} />
        <meshStandardMaterial color="#13121a" roughness={0.8} />
      </mesh>
      <mesh position={[-5.85, 0.09, 0]}>
        <boxGeometry args={[0.06, 0.18, 7.8]} />
        <meshStandardMaterial color="#13121a" roughness={0.8} />
      </mesh>

      {/* ceiling-line colour strips */}
      <mesh position={[-1.2, 5.55, -3.83]}>
        <boxGeometry args={[6, 0.04, 0.03]} />
        <meshBasicMaterial color={topStrip} toneMapped={false} />
      </mesh>
      <mesh position={[3.6, 5.55, -3.83]}>
        <boxGeometry args={[3.6, 0.04, 0.03]} />
        <meshBasicMaterial color={topStripBlue} toneMapped={false} />
      </mesh>
      <pointLight position={[0.5, 5.2, -3.4]} color="#6b5cff" intensity={10} distance={8} decay={2} />

      {/* rug */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.3, -0.05, 1.65]} receiveShadow>
        <planeGeometry args={[5.4, 3.8]} />
        <meshStandardMaterial map={rug} roughness={1} />
      </mesh>
    </group>
  );
}