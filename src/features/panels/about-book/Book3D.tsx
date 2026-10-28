import { useMemo, useRef } from "react";
import type { MutableRefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import { BackSide, FrontSide, MathUtils, PlaneGeometry } from "three";
import type { BufferAttribute, Group, Texture } from "three";

import { COVER_H, COVER_W, PAGE_H, PAGE_W } from "./bookTextures.ts";
import type { BookTextures } from "./bookTextures.ts";

const SEGMENTS = 28;
const ease = (t: number) => t * t * (3 - 2 * t);

type LeafProps = {
  index: number;
  width: number;
  height: number;
  front: Texture;
  back: Texture;
  progress: MutableRefObject<number[]>;
  lag: number;
  zRight: number;
  zLeft: number;
};

/** One bendable sheet: front on the right, back once it has flipped to the left. */
function Leaf({ index, width, height, front, back, progress, lag, zRight, zLeft }: LeafProps) {
  const geometry = useMemo(() => {
    const g = new PlaneGeometry(width, height, SEGMENTS, 1);
    g.translate(width / 2, 0, 0);
    return g;
  }, [width, height]);

  useFrame(() => {
    const e = ease(progress.current[index]);
    const angle = e * Math.PI;
    const lagAmount = lag * Math.sin(2 * angle);
    const step = width / SEGMENTS;
    const position = geometry.attributes.position as BufferAttribute;

    let x = 0;
    let z = MathUtils.lerp(zRight, zLeft, e);

    for (let i = 0; i <= SEGMENTS; i++) {
      if (i > 0) {
        const a = angle - lagAmount * ((i - 0.5) / SEGMENTS);
        x += step * Math.cos(a);
        z += step * Math.sin(a);
      }
      position.setXYZ(i, x, height / 2, z);
      position.setXYZ(i + SEGMENTS + 1, x, -height / 2, z);
    }

    position.needsUpdate = true;
    geometry.computeVertexNormals();
  });

  return (
    <group>
      <mesh geometry={geometry} frustumCulled={false}>
        <meshStandardMaterial map={front} side={FrontSide} roughness={0.82} metalness={0.02} />
      </mesh>
      <mesh geometry={geometry} frustumCulled={false}>
        <meshStandardMaterial map={back} side={BackSide} roughness={0.82} metalness={0.02} />
      </mesh>
    </group>
  );
}

type BookProps = {
  textures: BookTextures;
  /** 0 = closed, 1..3 = spreads. */
  step: number;
};

export function Book3D({ textures, step }: BookProps) {
  const root = useRef<Group>(null);
  const leftSide = useRef<Group>(null);
  const progress = useRef<number[]>([0, 0, 0]);
  const stepRef = useRef(step);
  stepRef.current = step;
  const start = useRef<number | null>(null);
  const size = useThree((state) => state.size);

  useFrame((state, delta) => {
    if (start.current === null) start.current = state.clock.elapsedTime;
    const age = state.clock.elapsedTime - start.current;

    // flip each leaf toward its target (constant speed, eased when drawn)
    progress.current = progress.current.map((value, i) => {
      const target = stepRef.current > i ? 1 : 0;
      const speed = (i === 0 ? 0.62 : 0.85) * delta;
      return value < target ? Math.min(target, value + speed) : Math.max(target, value - speed);
    });

    const open = ease(progress.current[0]);
    const intro = 1 - Math.pow(1 - Math.min(1, age / 1.5), 3);

    // keep the whole book inside the view on any screen shape
    const aspect = size.width / size.height;
    const tan = Math.tan(MathUtils.degToRad(35 / 2));
    const distance = Math.max((COVER_H + 0.7) / (2 * tan), (PAGE_W * 2 + 0.9) / (2 * tan * aspect));
    state.camera.position.set(0, 0, distance * 1.02);
    state.camera.lookAt(0, 0, 0);

    const group = root.current;
    if (group) {
      // closed: centre the cover. open: centre the spine.
      const closedX = -COVER_W / 2;
      group.position.x = MathUtils.lerp(closedX, 0, open);
      group.position.y = -1.1 * (1 - intro) + Math.sin(state.clock.elapsedTime * 0.9) * 0.035;
      group.scale.setScalar(0.55 + 0.45 * intro);

      const targetY = MathUtils.lerp(-0.42, 0, open) + state.pointer.x * 0.1;
      const targetX = MathUtils.lerp(0.16, 0.03, open) - state.pointer.y * 0.07;
      group.rotation.y += (targetY - group.rotation.y) * 0.06;
      group.rotation.x += (targetX - group.rotation.x) * 0.06;
      group.rotation.z = (1 - intro) * -0.25;
    }

    if (leftSide.current) leftSide.current.scale.x = Math.max(0.0001, open);
  });

  const paper = "#efe4cc";

  return (
    <>
      <ambientLight intensity={0.95} />
      <directionalLight position={[2.5, 3, 5]} intensity={1.7} />
      <pointLight position={[-4.5, 1.2, 2.5]} intensity={14} color="#59e1d2" />
      <pointLight position={[4.5, -1, 3]} intensity={10} color="#a78bfa" />

      <Sparkles count={46} scale={[9, 6, 3]} size={3} speed={0.35} opacity={0.7} color="#59e1d2" />

      <group ref={root}>
        {/* right-hand stack */}
        <mesh position={[COVER_W / 2, 0, -0.145]}>
          <boxGeometry args={[COVER_W, COVER_H, 0.07]} />
          <meshStandardMaterial color="#14122b" roughness={0.6} />
        </mesh>
        <mesh position={[PAGE_W / 2, 0, -0.065]}>
          <boxGeometry args={[PAGE_W - 0.03, PAGE_H - 0.03, 0.09]} />
          <meshStandardMaterial color={paper} roughness={0.9} />
        </mesh>
        <mesh position={[PAGE_W / 2, 0, 0.002]}>
          <planeGeometry args={[PAGE_W, PAGE_H]} />
          <meshStandardMaterial map={textures.s3R} roughness={0.85} />
        </mesh>

        {/* left-hand stack (grows as the cover opens) */}
        <group ref={leftSide}>
          <mesh position={[-COVER_W / 2, 0, -0.145]}>
            <boxGeometry args={[COVER_W, COVER_H, 0.07]} />
            <meshStandardMaterial color="#14122b" roughness={0.6} />
          </mesh>
          <mesh position={[-PAGE_W / 2, 0, -0.065]}>
            <boxGeometry args={[PAGE_W - 0.03, PAGE_H - 0.03, 0.09]} />
            <meshStandardMaterial color={paper} roughness={0.9} />
          </mesh>
        </group>

        {/* spine */}
        <mesh position={[0, 0, -0.13]}>
          <boxGeometry args={[0.1, COVER_H, 0.1]} />
          <meshStandardMaterial color="#0d0b20" roughness={0.5} />
        </mesh>

        {/* sheets: cover, page 1, page 2 */}
        <Leaf
          index={2}
          width={PAGE_W}
          height={PAGE_H}
          front={textures.s2R}
          back={textures.s3L}
          progress={progress}
          lag={0.55}
          zRight={0.02}
          zLeft={0.06}
        />
        <Leaf
          index={1}
          width={PAGE_W}
          height={PAGE_H}
          front={textures.s1R}
          back={textures.s2L}
          progress={progress}
          lag={0.55}
          zRight={0.04}
          zLeft={0.04}
        />
        <Leaf
          index={0}
          width={COVER_W}
          height={COVER_H}
          front={textures.coverFront}
          back={textures.s1L}
          progress={progress}
          lag={0.25}
          zRight={0.06}
          zLeft={0.02}
        />
      </group>
    </>
  );
}