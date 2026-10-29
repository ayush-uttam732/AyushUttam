import { useEffect, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import type { Group } from "three";

import { BG } from "./types";
import type { GameProps } from "./types";

const ROUND_SECONDS = 30;
const COLS = [-2.1, 0, 2.1];
const ROWS = [-1.5, 0.3, 2.1];

type Kind = "bug" | "gold" | "bomb";
type Slot = { kind: Kind | null; t: number; dur: number; hit: boolean; hitT: number };

const palette: Record<Kind, { body: string; glow: string }> = {
  bug: { body: "#59e1d2", glow: "#59e1d2" },
  gold: { body: "#ffcf4a", glow: "#ffb020" },
  bomb: { body: "#ff4d6d", glow: "#ff2050" },
};

function Critter({ kind }: { kind: Kind }) {
  const { body, glow } = palette[kind];
  return (
    <group>
      <mesh position={[0, 0.34, 0]} scale={[1, 0.8, 1.2]}>
        <sphereGeometry args={[0.42, 24, 18]} />
        <meshStandardMaterial color={body} emissive={glow} emissiveIntensity={0.28} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.5, 0.42]}>
        <sphereGeometry args={[0.24, 20, 16]} />
        <meshStandardMaterial color={body} emissive={glow} emissiveIntensity={0.28} roughness={0.35} />
      </mesh>
      {[-0.09, 0.09].map((x) => (
        <group key={x}>
          <mesh position={[x * 1.6, 0.58, 0.6]}>
            <sphereGeometry args={[0.06, 10, 10]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          <mesh position={[x * 1.6, 0.58, 0.64]}>
            <sphereGeometry args={[0.028, 8, 8]} />
            <meshBasicMaterial color="#05060c" />
          </mesh>
          <mesh position={[x * 2.6, 0.82, 0.5]} rotation={[0.5, 0, x > 0 ? -0.5 : 0.5]}>
            <cylinderGeometry args={[0.015, 0.015, 0.34, 6]} />
            <meshBasicMaterial color={body} />
          </mesh>
        </group>
      ))}
      {[-0.2, 0, 0.2].map((z) =>
        [-1, 1].map((side) => (
          <mesh key={`${z}${side}`} position={[side * 0.46, 0.18, z]} rotation={[0, 0, side * 0.9]}>
            <cylinderGeometry args={[0.02, 0.02, 0.36, 6]} />
            <meshBasicMaterial color={body} />
          </mesh>
        )),
      )}
      {kind === "bomb" && (
        <mesh position={[0, 0.9, 0]}>
          <sphereGeometry args={[0.08, 10, 10]} />
          <meshBasicMaterial color="#ffe36a" />
        </mesh>
      )}
      {kind === "gold" && (
        <mesh position={[0, 0.95, 0]} rotation={[0.3, 0, 0]}>
          <torusGeometry args={[0.22, 0.03, 8, 24]} />
          <meshBasicMaterial color="#fff2a8" />
        </mesh>
      )}
    </group>
  );
}

function Scene({ onScore, onInfo, onOver }: GameProps) {
  const slots = useRef<Slot[]>(
    Array.from({ length: 9 }, () => ({ kind: null, t: 0, dur: 1, hit: false, hitT: 0 })),
  );
  const groups = useRef<(Group | null)[]>([]);
  const kinds = useRef<Record<Kind, (Group | null)[]>>({ bug: [], gold: [], bomb: [] });
  const score = useRef(0);
  const clock = useRef(0);
  const nextSpawn = useRef(0.6);
  const finished = useRef(false);
  const lastInfo = useRef("");

  const spawn = () => {
    const free = slots.current.map((s, i) => (s.kind ? -1 : i)).filter((i) => i >= 0);
    if (!free.length) return;
    const index = free[Math.floor(Math.random() * free.length)];
    const roll = Math.random();
    const late = clock.current > 6;
    const kind: Kind = roll < 0.12 ? "gold" : late && roll < 0.27 ? "bomb" : "bug";
    const speedUp = Math.min(1, clock.current / ROUND_SECONDS);
    slots.current[index] = {
      kind,
      t: 0,
      dur: (kind === "gold" ? 0.85 : 1.35) - speedUp * 0.45,
      hit: false,
      hitT: 0,
    };
  };

  const smash = (index: number) => (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    const slot = slots.current[index];
    if (!slot.kind || slot.hit || finished.current) return;
    slot.hit = true;
    slot.hitT = 0;
    const gain = slot.kind === "gold" ? 3 : slot.kind === "bomb" ? -3 : 1;
    score.current = Math.max(0, score.current + gain);
    onScore(score.current);
  };

  useFrame((_, delta) => {
    if (finished.current) return;
    clock.current += delta;
    const left = Math.max(0, ROUND_SECONDS - clock.current);

    const text = `${Math.ceil(left)}s left`;
    if (text !== lastInfo.current) {
      lastInfo.current = text;
      onInfo(text);
    }

    if (left <= 0) {
      finished.current = true;
      onOver(score.current);
      return;
    }

    nextSpawn.current -= delta;
    if (nextSpawn.current <= 0) {
      spawn();
      nextSpawn.current = 0.85 - Math.min(0.45, clock.current / 60);
    }

    slots.current.forEach((slot, i) => {
      const g = groups.current[i];
      if (!g) return;

      (Object.keys(kinds.current) as Kind[]).forEach((k) => {
        const holder = kinds.current[k][i];
        if (holder) holder.visible = slot.kind === k;
      });

      if (!slot.kind) {
        g.position.y = -1.6;
        return;
      }

      slot.t += delta;
      let rise: number;
      if (slot.hit) {
        slot.hitT += delta;
        rise = Math.max(0, 1 - slot.hitT * 5);
        g.scale.set(1 + slot.hitT * 3, Math.max(0.05, 1 - slot.hitT * 5), 1 + slot.hitT * 3);
        if (slot.hitT > 0.25) slot.kind = null;
      } else {
        const p = slot.t / slot.dur;
        rise = p < 0.18 ? p / 0.18 : p > 0.8 ? Math.max(0, (1 - p) / 0.2) : 1;
        g.scale.set(1, 1, 1);
        g.rotation.y = Math.sin(slot.t * 9) * 0.25;
        if (p >= 1) slot.kind = null;
      }
      g.position.y = -1.0 + rise * 1.05;
    });
  });

  return (
    <>
      <color attach="background" args={[BG]} />
      <fog attach="fog" args={[BG, 12, 28]} />
      <ambientLight intensity={0.9} />
      <directionalLight position={[3, 8, 5]} intensity={1.6} />
      <pointLight position={[0, 3, 0]} intensity={8} color="#59e1d2" />
      <Sparkles count={30} scale={[10, 5, 8]} size={3} speed={0.3} color="#a78bfa" />

      {/* table */}
      <mesh position={[0, -1.05, 0.3]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[9, 7]} />
        <meshStandardMaterial color="#10152a" roughness={0.6} metalness={0.3} />
      </mesh>

      {ROWS.map((z, r) =>
        COLS.map((x, c) => {
          const i = r * 3 + c;
          return (
            <group key={i} position={[x, 0, z]}>
              {/* hole */}
              <mesh position={[0, -1.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[0.78, 36]} />
                <meshBasicMaterial color="#02030a" />
              </mesh>
              <mesh position={[0, -1.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.78, 0.9, 36]} />
                <meshBasicMaterial color="#2c3a66" />
              </mesh>
              <group
                ref={(el) => {
                  groups.current[i] = el;
                }}
                position={[0, -1.6, 0]}
                onPointerDown={smash(i)}
              >
                {(["bug", "gold", "bomb"] as Kind[]).map((k) => (
                  <group
                    key={k}
                    ref={(el) => {
                      kinds.current[k][i] = el;
                    }}
                    visible={false}
                  >
                    <Critter kind={k} />
                  </group>
                ))}
              </group>
            </group>
          );
        }),
      )}
    </>
  );
}

export function BugGame(props: GameProps) {
  useEffect(() => {
    props.onScore(0);
    props.onInfo(`${ROUND_SECONDS}s left`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Canvas dpr={[1, 2]} camera={{ fov: 40, near: 0.1, far: 60, position: [0, 6.2, 7.4] }} onCreated={({ camera }) => camera.lookAt(0, -0.4, 0.4)}>
      <Scene {...props} />
    </Canvas>
  );
}