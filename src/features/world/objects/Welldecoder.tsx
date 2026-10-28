import { useMemo } from "react";

import type { Vec3 } from "../../../types";
import {
  glow,
  mountainTexture,
  photoWallTexture,
} from "../../../lib/three-helpers";
import { Plant } from "./Plant";

const paintingTint = glow("#ffffff", 1.15);
const amberStrip = glow("#ffa850", 3);

/** Big sunset-volcano painting above the monitors. */
export function Painting({ position }: { position: Vec3 }) {
  const map = useMemo(() => mountainTexture(), []);

  return (
    <group position={position}>
      <mesh position={[0, 0, -0.02]} castShadow>
        <boxGeometry args={[2.85, 1.95, 0.08]} />
        <meshStandardMaterial color="#14131a" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0, 0.025]}>
        <planeGeometry args={[2.7, 1.8]} />
        <meshBasicMaterial map={map} color={paintingTint} toneMapped={false} />
      </mesh>
    </group>
  );
}

/** Pegboard with pinned photos. */
export function Pegboard({ position }: { position: Vec3 }) {
  const map = useMemo(() => photoWallTexture(), []);

  return (
    <group position={position}>
      <mesh position={[0, 0, -0.01]}>
        <boxGeometry args={[2.5, 1.9, 0.05]} />
        <meshStandardMaterial color="#121118" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0, 0.02]}>
        <planeGeometry args={[2.4, 1.8]} />
        <meshBasicMaterial map={map} toneMapped={false} />
      </mesh>
    </group>
  );
}

/** Floating plant shelf with warm LED strip. */
export function WallShelf({ position }: { position: Vec3 }) {
  return (
    <group position={position}>
      <mesh castShadow>
        <boxGeometry args={[3.3, 0.07, 0.45]} />
        <meshStandardMaterial color="#6e4a33" roughness={0.7} />
      </mesh>

      <mesh position={[0, 0.05, -0.17]}>
        <boxGeometry args={[3.2, 0.018, 0.02]} />
        <meshBasicMaterial color={amberStrip} toneMapped={false} />
      </mesh>

      <pointLight position={[0, 0.3, 0.1]} color="#ffae5c" intensity={3} distance={4} decay={2} />

      <Plant position={[-1.2, 0.03, 0]} scale={0.55} />
      <Plant position={[-0.2, 0.03, 0]} scale={0.7} pot="#3d3a45" />
      <Plant position={[0.9, 0.03, 0]} scale={0.5} />
      <Plant position={[1.45, 0.03, 0.02]} scale={0.6} pot="#4a3a33" />
    </group>
  );
}