import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";

import { glow } from "../../../lib/three-helpers";
import {
  collectibles,
  gameActions,
  useExperience,
} from "../../../store/experienceStore";
import type { CollectibleDef } from "../../../store/experienceStore";

function Orb({ item }: { item: CollectibleDef }) {
  const group = useRef<Group>(null);
  const [hovered, setHovered] = useState(false);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (!group.current) return;

    group.current.position.y =
      item.position[1] + Math.sin(t * 2 + item.position[0]) * 0.04;
    group.current.scale.setScalar(hovered ? 1.4 : 1 + Math.sin(t * 3) * 0.08);
  });

  return (
    <group
      ref={group}
      position={item.position}
      onClick={(event) => {
        event.stopPropagation();
        document.body.style.cursor = "auto";
        gameActions.collect(item.id);
      }}
      onPointerOver={(event) => {
        event.stopPropagation();
        setHovered(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = "auto";
      }}
    >
      {/* core */}
      <mesh>
        <sphereGeometry args={[0.09, 20, 20]} />
        <meshBasicMaterial color={glow(item.color, 4)} toneMapped={false} />
      </mesh>

      {/* soft halo (also makes it easier to click) */}
      <mesh>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshBasicMaterial
          color={item.color}
          transparent
          opacity={0.14}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      <pointLight color={item.color} intensity={1.6} distance={1.6} decay={2} />
    </group>
  );
}

/** Lives inside the <Canvas>. Renders the orbs that are still uncollected. */
export function CollectiblesGame() {
  const playing = useExperience((s) => s.playing);
  const collected = useExperience((s) => s.collected);

  if (!playing) return null;

  return (
    <group>
      {collectibles
        .filter((item) => !collected.includes(item.id))
        .map((item) => (
          <Orb key={item.id} item={item} />
        ))}
    </group>
  );
}