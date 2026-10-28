import type { Vec3 } from "../../../types";
import { glow } from "../../../lib/three-helpers";

const edge = glow("#ffb050", 2.2);

export function Guitar({
  position,
  rotation = [0, 0, 0],
}: {
  position: Vec3;
  rotation?: Vec3;
}) {
  const body = <meshStandardMaterial color="#14151a" roughness={0.28} metalness={0.35} />;

  return (
    <group position={position} rotation={rotation} scale={0.85}>
      {/* lower + upper bout, waist */}
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.29, 0.29, 0.13, 36]} />
        {body}
      </mesh>
      <mesh position={[0, 0.36, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.21, 0.21, 0.13, 36]} />
        {body}
      </mesh>
      <mesh position={[0, 0.2, 0]} castShadow>
        <boxGeometry args={[0.34, 0.22, 0.13]} />
        {body}
      </mesh>

      {/* rim light-catch */}
      <mesh position={[0, 0, 0.067]}>
        <torusGeometry args={[0.29, 0.006, 8, 56]} />
        <meshBasicMaterial color={edge} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.36, 0.067]}>
        <torusGeometry args={[0.21, 0.006, 8, 56]} />
        <meshBasicMaterial color={edge} toneMapped={false} />
      </mesh>

      {/* sound hole + bridge */}
      <mesh position={[0, 0.14, 0.067]}>
        <circleGeometry args={[0.075, 32]} />
        <meshBasicMaterial color="#000" />
      </mesh>
      <mesh position={[0, -0.12, 0.068]}>
        <boxGeometry args={[0.2, 0.025, 0.012]} />
        <meshStandardMaterial color="#2a1a12" />
      </mesh>

      {/* neck + headstock */}
      <mesh position={[0, 1.0, 0]}>
        <boxGeometry args={[0.075, 1.0, 0.05]} />
        <meshStandardMaterial color="#2a1a12" roughness={0.6} />
      </mesh>
      <mesh position={[0, 1.64, 0]}>
        <boxGeometry args={[0.12, 0.26, 0.04]} />
        <meshStandardMaterial color="#14151a" roughness={0.4} />
      </mesh>

      {/* strings */}
      {[-0.025, -0.015, -0.005, 0.005, 0.015, 0.025].map((x) => (
        <mesh key={x} position={[x, 0.75, 0.04]}>
          <boxGeometry args={[0.002, 1.7, 0.002]} />
          <meshStandardMaterial color="#cfd6e4" metalness={0.8} roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
}