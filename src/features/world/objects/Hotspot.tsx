import { useRef, useState } from "react";
import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import type { Group, Mesh } from "three";

import type { Vec3 } from "../../../types";
import { CYAN } from "../../../utils/constants";

type HotspotProps = {
  position: Vec3;
  label: string;
  onClick: () => void;
  accent?: string;
};

export function Hotspot({ position, label, onClick, accent = CYAN }: HotspotProps) {
  const [hovered, setHovered] = useState(false);
  const marker = useRef<Group>(null);
  const ring = useRef<Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    if (marker.current) {
      marker.current.scale.setScalar(
        hovered ? 1.18 : 1 + Math.sin(t * 1.8) * 0.05,
      );
    }
    if (ring.current) {
      ring.current.rotation.z = t * 0.4;
    }
  });

  return (
    <group position={position}>
      <group
        ref={marker}
        onClick={(event) => {
          event.stopPropagation();
          onClick();
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
        <mesh>
          <sphereGeometry args={[0.075, 20, 20]} />
          <meshStandardMaterial
            color={hovered ? "#ffffff" : accent}
            emissive={accent}
            emissiveIntensity={hovered ? 3 : 1.8}
            toneMapped={false}
          />
        </mesh>

        <mesh ref={ring}>
          <torusGeometry args={[0.14, 0.008, 8, 36]} />
          <meshBasicMaterial color={accent} transparent opacity={0.75} toneMapped={false} />
        </mesh>
      </group>

      <Html
        position={[0, 0.3, 0]}
        center
        distanceFactor={8}
        style={{ pointerEvents: "none" }}
        zIndexRange={[10, 0]}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 14px",
            border: `1px solid ${hovered ? "#ffffff" : `${accent}bb`}`,
            borderRadius: 999,
            background: "rgba(9, 13, 22, 0.94)",
            boxShadow: hovered ? `0 0 22px ${accent}55` : `0 0 14px ${accent}22`,
            color: "#f7f8fc",
            fontFamily: "Inter, Arial, sans-serif",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: 1.7,
            whiteSpace: "nowrap",
            transition: "border-color 180ms ease, box-shadow 180ms ease",
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: accent,
              boxShadow: `0 0 8px ${accent}`,
            }}
          />
          {label}
        </div>
      </Html>
    </group>
  );
}