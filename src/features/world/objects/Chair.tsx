import type { Vec3 } from "../../../types";

export function GamingChair({
  position,
  rotationY = 0,
}: {
  position: Vec3;
  rotationY?: number;
}) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* backrest */}
      <mesh position={[0, 1.23, -0.25]} castShadow>
        <boxGeometry args={[0.82, 1.14, 0.19]} />
        <meshStandardMaterial color="#1b1f26" roughness={0.78} />
      </mesh>
      <mesh position={[0, 1.23, -0.147]}>
        <boxGeometry args={[0.64, 0.9, 0.025]} />
        <meshStandardMaterial color="#2b303c" roughness={0.9} />
      </mesh>

      {/* headrest */}
      <mesh position={[0, 1.95, -0.25]} castShadow>
        <boxGeometry args={[0.4, 0.26, 0.12]} />
        <meshStandardMaterial color="#1b1f26" roughness={0.8} />
      </mesh>

      {/* seat */}
      <mesh position={[0, 0.64, 0.03]} castShadow>
        <boxGeometry args={[0.88, 0.19, 0.74]} />
        <meshStandardMaterial color="#222630" roughness={0.85} />
      </mesh>

      {/* armrests */}
      {[-0.49, 0.49].map((x) => (
        <group key={x} position={[x, 0.82, 0.03]}>
          <mesh>
            <boxGeometry args={[0.07, 0.31, 0.08]} />
            <meshStandardMaterial color="#353a45" metalness={0.35} />
          </mesh>
          <mesh position={[0, 0.16, 0]}>
            <boxGeometry args={[0.17, 0.055, 0.4]} />
            <meshStandardMaterial color="#171a20" roughness={0.6} />
          </mesh>
        </group>
      ))}

      {/* column + base */}
      <mesh position={[0, 0.32, 0]}>
        <cylinderGeometry args={[0.04, 0.055, 0.5, 12]} />
        <meshStandardMaterial color="#686d77" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.075, 0]}>
        <cylinderGeometry args={[0.1, 0.12, 0.055, 20]} />
        <meshStandardMaterial color="#20232b" metalness={0.65} roughness={0.35} />
      </mesh>

      {Array.from({ length: 5 }, (_, i) => (
        <group key={i} rotation={[0, (i / 5) * Math.PI * 2, 0]}>
          <mesh position={[0.26, 0.05, 0]}>
            <boxGeometry args={[0.46, 0.04, 0.055]} />
            <meshStandardMaterial color="#444954" metalness={0.65} />
          </mesh>
          <mesh position={[0.5, 0.04, 0]}>
            <sphereGeometry args={[0.065, 12, 12]} />
            <meshStandardMaterial color="#171a20" roughness={0.65} />
          </mesh>
        </group>
      ))}
    </group>
  );
}