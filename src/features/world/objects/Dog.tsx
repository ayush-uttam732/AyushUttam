import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";

import type { Vec3 } from "../../../types";

const FUR = "#b9713a";
const FUR_DARK = "#8f5528";
const FUR_LIGHT = "#dba466";

function Fur({ color = FUR }: { color?: string }) {
  return <meshStandardMaterial color={color} roughness={1} />;
}

/** Sleeping golden retriever. Faces local +X. */
export function Dog({
  position,
  rotationY = 0,
}: {
  position: Vec3;
  rotationY?: number;
}) {
  const torso = useRef<Group>(null);
  const tail = useRef<Group>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (torso.current) torso.current.scale.set(1, 1 + Math.sin(t * 1.6) * 0.025, 1 + Math.sin(t * 1.6) * 0.015);
    if (tail.current) tail.current.rotation.y = Math.sin(t * 1.1) * 0.12;
  });

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* torso (breathing) */}
      <group ref={torso}>
        <mesh position={[0, 0.25, 0]} scale={[0.62, 0.25, 0.3]} castShadow>
          <sphereGeometry args={[1, 24, 18]} />
          <Fur />
        </mesh>

        {/* haunches */}
        {[-0.14, 0.14].map((z) => (
          <mesh key={z} position={[-0.4, 0.2, z]} scale={[0.28, 0.2, 0.2]} castShadow>
            <sphereGeometry args={[1, 18, 14]} />
            <Fur color={FUR_DARK} />
          </mesh>
        ))}

        {/* chest */}
        <mesh position={[0.42, 0.22, 0]} scale={[0.26, 0.21, 0.26]} castShadow>
          <sphereGeometry args={[1, 18, 14]} />
          <Fur color={FUR_LIGHT} />
        </mesh>
      </group>

      {/* head */}
      <group position={[0.74, 0.17, 0.02]} rotation={[0, 0, -0.12]}>
        <mesh scale={[0.2, 0.17, 0.17]} castShadow>
          <sphereGeometry args={[1, 20, 16]} />
          <Fur color={FUR_LIGHT} />
        </mesh>
        <mesh position={[0.17, -0.04, 0]} scale={[0.17, 0.09, 0.1]}>
          <sphereGeometry args={[1, 16, 12]} />
          <Fur color={FUR_LIGHT} />
        </mesh>
        <mesh position={[0.33, -0.015, 0]}>
          <sphereGeometry args={[0.035, 12, 12]} />
          <meshStandardMaterial color="#111" roughness={0.4} />
        </mesh>
        {/* closed eyes */}
        {[-0.075, 0.075].map((z) => (
          <mesh key={z} position={[0.1, 0.05, z * 1.9]} rotation={[0, 0, 0.15]}>
            <boxGeometry args={[0.05, 0.008, 0.02]} />
            <meshStandardMaterial color="#2a1608" />
          </mesh>
        ))}
        {/* ears */}
        {[-0.15, 0.15].map((z) => (
          <mesh
            key={z}
            position={[-0.04, -0.03, z]}
            rotation={[z > 0 ? 0.5 : -0.5, 0, 0.1]}
            scale={[0.08, 0.14, 0.04]}
          >
            <sphereGeometry args={[1, 12, 10]} />
            <Fur color={FUR_DARK} />
          </mesh>
        ))}
      </group>

      {/* front paws */}
      {[-0.13, 0.13].map((z) => (
        <mesh key={z} position={[0.72, 0.06, z * 1.2]} rotation={[0, 0, Math.PI / 2]}>
          <capsuleGeometry args={[0.055, 0.28, 4, 10]} />
          <Fur color={FUR_LIGHT} />
        </mesh>
      ))}

      {/* tail */}
      <group ref={tail} position={[-0.66, 0.12, -0.12]}>
        <mesh rotation={[0, 0.6, Math.PI / 2 - 0.2]} position={[-0.12, 0, -0.06]} scale={[1, 1, 1]}>
          <capsuleGeometry args={[0.05, 0.3, 4, 10]} />
          <Fur color={FUR_DARK} />
        </mesh>
      </group>
    </group>
  );
}