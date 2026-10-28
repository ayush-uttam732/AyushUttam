import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { MeshBasicMaterial } from "three";

import type { Vec3 } from "../../../types";
import { drawNeon, glow, neonTexture } from "../../../lib/three-helpers";

const neonTint = glow("#ffffff", 2.4);

export function NeonSign({ position }: { position: Vec3 }) {
  const map = useMemo(() => neonTexture(), []);
  const material = useRef<MeshBasicMaterial>(null);

  // redraw once the handwriting font has actually loaded
  useEffect(() => {
    let alive = true;
    document.fonts
      ?.load("600 150px Caveat")
      .then(() => {
        if (!alive) return;
        drawNeon(map.image as HTMLCanvasElement);
        map.needsUpdate = true;
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [map]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (material.current) {
      // gentle neon flicker
      const flicker = Math.sin(t * 38) > 0.985 ? 0.6 : 1;
      material.current.opacity = (0.94 + Math.sin(t * 2) * 0.04) * flicker;
    }
  });

  return (
    <group position={position}>
      <mesh position={[0, 0, -0.03]}>
        <boxGeometry args={[1.45, 2.15, 0.05]} />
        <meshStandardMaterial color="#17161c" roughness={0.8} />
      </mesh>

      <mesh position={[0, 0, 0.0]}>
        <planeGeometry args={[1.3, 1.95]} />
        <meshBasicMaterial
          ref={material}
          map={map}
          color={neonTint}
          transparent
          toneMapped={false}
        />
      </mesh>

      <pointLight position={[0, 0, 0.8]} color="#ff9a45" intensity={4} distance={4} decay={2} />
    </group>
  );
}