import { useMemo } from "react";

import { cityTexture, glow } from "../../../lib/three-helpers";

const cityTint = glow("#ffffff", 1.2);

export function CityWindow() {
  const map = useMemo(() => cityTexture(), []);

  return (
    <group position={[5.78, 3.05, 1.25]}>
      {/* night city */}
      <mesh rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[4.9, 4.65]} />
        <meshBasicMaterial map={map} color={cityTint} toneMapped={false} />
      </mesh>

      {/* mullions */}
      {[-2.45, 0, 2.45].map((z) => (
        <mesh key={z} position={[0.04, 0, z]}>
          <boxGeometry args={[0.1, 4.75, 0.09]} />
          <meshStandardMaterial color="#1c202b" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}
      {[-2.33, 0.3, 2.33].map((y) => (
        <mesh key={y} position={[0.04, y, 0]}>
          <boxGeometry args={[0.1, 0.08, 4.95]} />
          <meshStandardMaterial color="#1c202b" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}

      {/* city light spill into the room */}
      <pointLight position={[-0.6, 0.4, 0]} color="#5a8dff" intensity={7} distance={9} decay={2} />
      <pointLight position={[-0.6, -1.2, 1.2]} color="#c070ff" intensity={4} distance={7} decay={2} />
    </group>
  );
}