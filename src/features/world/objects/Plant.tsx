import type { Vec3 } from "../../../types";

type PlantProps = {
  position: Vec3;
  scale?: number;
  pot?: string;
};

export function Plant({ position, scale = 1, pot = "#55403a" }: PlantProps) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.23, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.2, 0.15, 0.46, 20]} />
        <meshStandardMaterial color={pot} roughness={0.82} />
      </mesh>

      <mesh position={[0, 0.46, 0]}>
        <cylinderGeometry args={[0.18, 0.18, 0.035, 20]} />
        <meshStandardMaterial color="#292522" roughness={0.9} />
      </mesh>

      {Array.from({ length: 12 }, (_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        const height = 0.6 + (i % 4) * 0.12;

        return (
          <group
            key={i}
            position={[
              Math.cos(angle) * 0.1,
              0.47 + height * 0.42,
              Math.sin(angle) * 0.1,
            ]}
            rotation={[0.25, angle, Math.cos(angle) * 0.4]}
          >
            <mesh scale={[0.17, height * 0.62, 0.045]}>
              <sphereGeometry args={[1, 12, 10]} />
              <meshStandardMaterial
                color={i % 3 === 0 ? "#5a8a55" : "#2f6a47"}
                roughness={0.85}
                side={2}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}