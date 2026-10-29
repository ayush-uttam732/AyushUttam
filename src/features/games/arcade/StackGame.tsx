import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import { MathUtils } from "three";
import type { Mesh } from "three";

import { BG } from "./types";
import type { GameProps } from "./types";

const H = 0.4;
const RANGE = 3.3;

type Layer = { x: number; z: number; w: number; d: number; y: number; color: string };
type Debris = Layer & { id: number };

const colorFor = (i: number) => `hsl(${(i * 13 + 165) % 360}, 85%, 58%)`;

function Scene({ onScore, onInfo, onOver }: GameProps) {
  const [layers, setLayers] = useState<Layer[]>([
    { x: 0, z: 0, w: 2.2, d: 2.2, y: 0, color: colorFor(0) },
  ]);
  const [debris, setDebris] = useState<Debris[]>([]);
  const layersRef = useRef(layers);
  const mover = useRef({ axis: "x" as "x" | "z", pos: -RANGE, dir: 1, speed: 2.4 });
  const over = useRef(false);
  const block = useRef<Mesh>(null);
  const camY = useRef(1);
  const gl = useThree((s) => s.gl);

  const place = () => {
    if (over.current) return;
    const stack = layersRef.current;
    const top = stack[stack.length - 1];
    const mv = mover.current;
    const isX = mv.axis === "x";
    const center = isX ? top.x : top.z;
    const size = isX ? top.w : top.d;
    const delta = mv.pos - center;
    const overlap = size - Math.abs(delta);
    const y = stack.length * H;
    const color = colorFor(stack.length);

    // totally missed -> the block falls, round over
    if (overlap <= 0.04) {
      over.current = true;
      setDebris((list) => [
        ...list,
        {
          id: Date.now(),
          x: isX ? mv.pos : top.x,
          z: isX ? top.z : mv.pos,
          w: top.w,
          d: top.d,
          y,
          color,
        },
      ]);
      onInfo("MISSED!");
      window.setTimeout(() => onOver(stack.length - 1), 900);
      return;
    }

    const perfect = Math.abs(delta) < 0.1;
    let { w, d, x, z } = top;

    if (!perfect) {
      const sign = Math.sign(delta);
      const cut = Math.abs(delta);
      const cutCenter = mv.pos + sign * (size / 2 - cut / 2);
      if (isX) {
        w = overlap;
        x = center + delta / 2;
        setDebris((list) => [...list, { id: Date.now(), x: cutCenter, z: top.z, w: cut, d: top.d, y, color }]);
      } else {
        d = overlap;
        z = center + delta / 2;
        setDebris((list) => [...list, { id: Date.now(), x: top.x, z: cutCenter, w: top.w, d: cut, y, color }]);
      }
    }

    const next = [...stack, { x, z, w, d, y, color }];
    layersRef.current = next;
    setLayers(next);

    const score = next.length - 1;
    onScore(score);
    onInfo(perfect ? "PERFECT!" : "");

    mv.axis = isX ? "z" : "x";
    mv.pos = -RANGE;
    mv.dir = 1;
    mv.speed = Math.min(6.2, 2.4 + score * 0.13);
  };

  useEffect(() => {
    const canvas = gl.domElement;
    const onKey = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        event.preventDefault();
        place();
      }
    };
    canvas.addEventListener("pointerdown", place);
    window.addEventListener("keydown", onKey);
    return () => {
      canvas.removeEventListener("pointerdown", place);
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl]);

  useFrame((state, delta) => {
    const stack = layersRef.current;
    const top = stack[stack.length - 1];
    const mv = mover.current;

    if (!over.current) {
      mv.pos += mv.dir * mv.speed * delta;
      if (mv.pos > RANGE) {
        mv.pos = RANGE;
        mv.dir = -1;
      } else if (mv.pos < -RANGE) {
        mv.pos = -RANGE;
        mv.dir = 1;
      }
    }

    if (block.current) {
      const isX = mv.axis === "x";
      block.current.position.set(isX ? mv.pos : top.x, stack.length * H + H / 2, isX ? top.z : mv.pos);
      block.current.scale.set(top.w, 1, top.d);
      block.current.visible = !over.current;
    }

    // camera climbs with the tower
    const targetY = stack.length * H;
    camY.current = MathUtils.lerp(camY.current, targetY, 0.06);
    state.camera.position.set(6.2, camY.current + 5.2, 6.2);
    state.camera.lookAt(0, camY.current + 0.4, 0);
  });

  const nextColor = colorFor(layers.length);

  return (
    <>
      <color attach="background" args={[BG]} />
      <fog attach="fog" args={[BG, 14, 34]} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 10, 4]} intensity={1.1} />
      <pointLight position={[-4, 3, -3]} intensity={12} color="#a78bfa" />
      <Sparkles count={40} scale={[12, 14, 12]} size={3} speed={0.3} color="#59e1d2" />

      {/* base plate */}
      <mesh position={[0, -0.22, 0]}>
        <cylinderGeometry args={[2.9, 3.1, 0.3, 48]} />
        <meshStandardMaterial color="#1b2142" metalness={0.6} roughness={0.35} />
      </mesh>

      {layers.map((layer, i) => (
        <mesh key={i} position={[layer.x, layer.y + H / 2, layer.z]}>
          <boxGeometry args={[layer.w, H, layer.d]} />
          <meshStandardMaterial color={layer.color} emissive={layer.color} emissiveIntensity={0.12} roughness={0.35} />
        </mesh>
      ))}

      <mesh ref={block}>
        <boxGeometry args={[1, H, 1]} />
        <meshStandardMaterial color={nextColor} emissive={nextColor} emissiveIntensity={0.3} roughness={0.3} />
      </mesh>

      {debris.map((piece) => (
        <FallingPiece key={piece.id} piece={piece} />
      ))}
    </>
  );
}

function FallingPiece({ piece }: { piece: Layer }) {
  const mesh = useRef<Mesh>(null);
  const vy = useRef(0);

  useFrame((_, delta) => {
    const m = mesh.current;
    if (!m) return;
    vy.current += 18 * delta;
    m.position.y -= vy.current * delta;
    m.rotation.x += delta * 1.2;
    m.visible = m.position.y > -12;
  });

  return (
    <mesh ref={mesh} position={[piece.x, piece.y + H / 2, piece.z]}>
      <boxGeometry args={[piece.w, H, piece.d]} />
      <meshStandardMaterial color={piece.color} emissive={piece.color} emissiveIntensity={0.25} />
    </mesh>
  );
}

export function StackGame(props: GameProps) {
  useEffect(() => {
    props.onScore(0);
    props.onInfo("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Canvas dpr={[1, 2]} camera={{ fov: 38, near: 0.1, far: 80, position: [6, 6, 6] }}>
      <Scene {...props} />
    </Canvas>
  );
}