import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import { CanvasTexture, MathUtils, RepeatWrapping } from "three";
import type { Group, Mesh } from "three";

import { BG } from "./types";
import type { GameProps } from "./types";

const LANES = [-1.6, 0, 1.6];
const SPAWN_Z = -62;
const POOL = 22;
const COIN_POOL = 14;

type Item = { active: boolean; lane: number; z: number };

function gridTexture() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#0a0e1d";
  ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = "#59e1d2";
  ctx.lineWidth = 4;
  ctx.strokeRect(0, 0, 256, 256);
  ctx.strokeStyle = "rgba(167,139,250,0.55)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(128, 0);
  ctx.lineTo(128, 256);
  ctx.stroke();
  const t = new CanvasTexture(c);
  t.wrapS = t.wrapT = RepeatWrapping;
  t.repeat.set(2, 26);
  t.anisotropy = 8;
  return t;
}

function Scene({ onScore, onInfo, onOver }: GameProps) {
  const ship = useRef<Group>(null);
  const floor = useRef<Mesh>(null);
  const obstacleMeshes = useRef<(Mesh | null)[]>([]);
  const coinMeshes = useRef<(Mesh | null)[]>([]);
  const obstacles = useRef<Item[]>(Array.from({ length: POOL }, () => ({ active: false, lane: 1, z: 0 })));
  const coins = useRef<Item[]>(Array.from({ length: COIN_POOL }, () => ({ active: false, lane: 1, z: 0 })));

  const lane = useRef(1);
  const shipX = useRef(0);
  const dist = useRef(0);
  const sinceRow = useRef(0);
  const coinCount = useRef(0);
  const lastScore = useRef(-1);
  const over = useRef(false);
  const shake = useRef(0);
  const gl = useThree((s) => s.gl);
  const texture = useMemo(gridTexture, []);

  const move = (dir: number) => {
    if (over.current) return;
    lane.current = Math.max(0, Math.min(2, lane.current + dir));
  };

  useEffect(() => {
    const canvas = gl.domElement;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft" || event.key === "a" || event.key === "A") move(-1);
      if (event.key === "ArrowRight" || event.key === "d" || event.key === "D") move(1);
    };
    const onPointer = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      move(event.clientX - rect.left < rect.width / 2 ? -1 : 1);
    };
    window.addEventListener("keydown", onKey);
    canvas.addEventListener("pointerdown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      canvas.removeEventListener("pointerdown", onPointer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl]);

  const take = (pool: Item[]) => pool.find((item) => !item.active);

  const spawnRow = () => {
    const blocked = Math.floor(Math.random() * 3);
    const extra = dist.current > 350 && Math.random() < 0.5 ? (blocked + 1 + Math.floor(Math.random() * 2)) % 3 : -1;
    [blocked, extra].forEach((l) => {
      if (l < 0) return;
      const o = take(obstacles.current);
      if (o) Object.assign(o, { active: true, lane: l, z: SPAWN_Z });
    });
    const free = [0, 1, 2].filter((l) => l !== blocked && l !== extra);
    if (Math.random() < 0.65) {
      const c = take(coins.current);
      if (c) Object.assign(c, { active: true, lane: free[Math.floor(Math.random() * free.length)], z: SPAWN_Z - 4 });
    }
  };

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const speed = over.current ? 0 : 15 + Math.min(18, dist.current / 40);

    if (!over.current) {
      dist.current += speed * dt;
      sinceRow.current += speed * dt;
      const gap = Math.max(7, 14 - dist.current / 120);
      if (sinceRow.current >= gap) {
        sinceRow.current = 0;
        spawnRow();
      }
    }

    // floor scroll
    texture.offset.y -= (speed * dt) / 2.4;

    // ship
    const targetX = LANES[lane.current];
    shipX.current = MathUtils.lerp(shipX.current, targetX, 0.22);
    if (ship.current) {
      ship.current.position.x = shipX.current;
      ship.current.rotation.z = (shipX.current - targetX) * 0.5;
      ship.current.position.y = 0.35 + Math.sin(state.clock.elapsedTime * 6) * 0.03;
      ship.current.visible = !(over.current && shake.current > 0.25);
    }

    // obstacles
    obstacles.current.forEach((o, i) => {
      const m = obstacleMeshes.current[i];
      if (!m) return;
      if (o.active) {
        o.z += speed * dt;
        if (!over.current && o.z > -0.8 && o.z < 0.8 && Math.abs(LANES[o.lane] - shipX.current) < 1.0) {
          over.current = true;
          shake.current = 0;
          onInfo("CRASH!");
          window.setTimeout(() => onOver(lastScore.current), 800);
        }
        if (o.z > 6) o.active = false;
      }
      m.visible = o.active;
      m.position.set(LANES[o.lane], 0.55, o.z);
    });

    // coins
    coins.current.forEach((c, i) => {
      const m = coinMeshes.current[i];
      if (!m) return;
      if (c.active) {
        c.z += speed * dt;
        if (!over.current && c.z > -0.9 && c.z < 0.9 && Math.abs(LANES[c.lane] - shipX.current) < 1.0) {
          c.active = false;
          coinCount.current += 1;
        }
        if (c.z > 6) c.active = false;
      }
      m.visible = c.active;
      m.position.set(LANES[c.lane], 0.7, c.z);
      m.rotation.y += dt * 4;
    });

    const score = Math.floor(dist.current / 4) + coinCount.current * 10;
    if (score !== lastScore.current) {
      lastScore.current = score;
      onScore(score);
    }
    if (!over.current) onInfo(`${coinCount.current} coins`);

    if (over.current) shake.current += dt;
    state.camera.position.set(
      Math.sin(state.clock.elapsedTime * 60) * (over.current && shake.current < 0.4 ? 0.12 : 0),
      3.6,
      6.4,
    );
    state.camera.lookAt(0, 0.3, -8);
  });

  return (
    <>
      <color attach="background" args={[BG]} />
      <fog attach="fog" args={[BG, 16, 58]} />
      <ambientLight intensity={0.9} />
      <directionalLight position={[2, 6, 4]} intensity={1.6} />
      <pointLight position={[0, 2, 1]} intensity={10} color="#59e1d2" />
      <Sparkles count={50} scale={[14, 7, 50]} position={[0, 2, -20]} size={3} speed={0.4} color="#a78bfa" />

      <mesh ref={floor} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -30]}>
        <planeGeometry args={[5.4, 120]} />
        <meshStandardMaterial map={texture} roughness={0.7} />
      </mesh>
      {[-2.75, 2.75].map((x) => (
        <mesh key={x} position={[x, 0.15, -30]}>
          <boxGeometry args={[0.07, 0.14, 120]} />
          <meshBasicMaterial color="#59e1d2" />
        </mesh>
      ))}

      <group ref={ship} position={[0, 0.35, 0]} scale={0.7}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.45, 1.3, 4]} />
          <meshStandardMaterial color="#59e1d2" emissive="#59e1d2" emissiveIntensity={0.5} metalness={0.5} roughness={0.3} />
        </mesh>
        <mesh position={[0, -0.05, 0.35]}>
          <boxGeometry args={[1.1, 0.08, 0.45]} />
          <meshStandardMaterial color="#a78bfa" emissive="#a78bfa" emissiveIntensity={0.5} />
        </mesh>
        <mesh position={[0, 0, 0.7]}>
          <sphereGeometry args={[0.14, 10, 10]} />
          <meshBasicMaterial color="#ffb86e" />
        </mesh>
      </group>

      {Array.from({ length: POOL }, (_, i) => (
        <mesh
          key={`o${i}`}
          ref={(el) => {
            obstacleMeshes.current[i] = el;
          }}
          visible={false}
        >
          <boxGeometry args={[1.35, 1.1, 1.35]} />
          <meshStandardMaterial color="#ff4d6d" emissive="#ff2050" emissiveIntensity={0.6} roughness={0.35} />
        </mesh>
      ))}

      {Array.from({ length: COIN_POOL }, (_, i) => (
        <mesh
          key={`c${i}`}
          ref={(el) => {
            coinMeshes.current[i] = el;
          }}
          visible={false}
        >
          <octahedronGeometry args={[0.38]} />
          <meshStandardMaterial color="#ffd34d" emissive="#ffb020" emissiveIntensity={0.9} />
        </mesh>
      ))}
    </>
  );
}

export function DodgeGame(props: GameProps) {
  useEffect(() => {
    props.onScore(0);
    props.onInfo("0 coins");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Canvas dpr={[1, 2]} camera={{ fov: 55, near: 0.1, far: 120, position: [0, 3.3, 5.6] }}>
      <Scene {...props} />
    </Canvas>
  );
}