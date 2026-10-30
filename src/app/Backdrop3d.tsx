import { useEffect, useMemo, useRef, useState } from "react";
import type { MutableRefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, PointsMaterial } from "three";
import type { Group, Points } from "three";

const STAR_COUNT = 2200;

/** the camera flies forward through this range while the page scrolls */
const PATH_START = 8;
const PATH_LENGTH = 82;

function Stars() {
  const ref = useRef<Points>(null);

  const { geo, mat } = useMemo(() => {
    const pos = new Float32Array(STAR_COUNT * 3);
    const col = new Float32Array(STAR_COUNT * 3);
    const palette = [new Color("#59e1d2"), new Color("#a78bfa"), new Color("#e78cdb")];
    const white = new Color("#ffffff");
    const tmp = new Color();

    for (let i = 0; i < STAR_COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 64;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 42;
      pos[i * 3 + 2] = 12 - Math.random() * 120;
      const r = Math.random();
      tmp.copy(palette[r < 0.5 ? 0 : r < 0.85 ? 1 : 2]).lerp(white, Math.random() * 0.55);
      col[i * 3] = tmp.r;
      col[i * 3 + 1] = tmp.g;
      col[i * 3 + 2] = tmp.b;
    }

    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(pos, 3));
    g.setAttribute("color", new BufferAttribute(col, 3));

    const m = new PointsMaterial({
      size: 0.13,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      blending: AdditiveBlending,
      sizeAttenuation: true,
    });
    return { geo: g, mat: m };
  }, []);

  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.z += dt * 0.012;
  });

  return <points ref={ref} geometry={geo} material={mat} />;
}

type ShapeKind = "ico" | "knot" | "oct" | "torus" | "dode";

const shapes: { k: ShapeKind; p: [number, number, number]; s: number; c: string; v: number }[] = [
  { k: "ico", p: [-6.5, 2, -6], s: 1.8, c: "#59e1d2", v: 0.25 },
  { k: "knot", p: [7, -2, -20], s: 1.2, c: "#a78bfa", v: 0.3 },
  { k: "oct", p: [-7.5, -3, -34], s: 2, c: "#e78cdb", v: 0.22 },
  { k: "torus", p: [6.5, 3, -48], s: 2.1, c: "#59e1d2", v: 0.28 },
  { k: "dode", p: [-5.5, 1, -62], s: 1.9, c: "#ffb86e", v: 0.2 },
  { k: "ico", p: [6.5, -2, -76], s: 2.4, c: "#a78bfa", v: 0.26 },
];

function Shape({ k, p, s, c, v }: (typeof shapes)[number]) {
  const ref = useRef<Group>(null);

  useFrame(({ clock }, dt) => {
    const g = ref.current;
    if (!g) return;
    g.rotation.x += dt * v;
    g.rotation.y += dt * v * 1.4;
    g.position.y = p[1] + Math.sin(clock.elapsedTime * 0.6 + p[2]) * 0.4;
  });

  return (
    <group ref={ref} position={p} scale={s}>
      <mesh>
        {k === "ico" && <icosahedronGeometry args={[1, 1]} />}
        {k === "knot" && <torusKnotGeometry args={[0.7, 0.22, 120, 14]} />}
        {k === "oct" && <octahedronGeometry args={[1, 0]} />}
        {k === "torus" && <torusGeometry args={[0.9, 0.3, 14, 40]} />}
        {k === "dode" && <dodecahedronGeometry args={[1, 0]} />}
        <meshBasicMaterial color={c} wireframe transparent opacity={0.55} />
      </mesh>
    </group>
  );
}

/** moves the camera with the page scroll + a little with the mouse */
function Rig({ progress }: { progress: MutableRefObject<number> }) {
  const camera = useThree((s) => s.camera);
  const mouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useFrame(() => {
    const targetZ = PATH_START - progress.current * PATH_LENGTH;
    camera.position.z += (targetZ - camera.position.z) * 0.06;
    camera.position.x += (mouse.current.x * 1.4 - camera.position.x) * 0.04;
    camera.position.y += (-mouse.current.y * 0.9 - camera.position.y) * 0.04;
    camera.lookAt(0, 0, camera.position.z - 12);
  });

  return null;
}

/** one 3D world behind every section: stars + wireframe shapes the camera flies through as you scroll */
export default function Backdrop3D({ progress }: { progress: MutableRefObject<number> }) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const check = () => {
      const on = window.scrollY > window.innerHeight * 0.2;
      setActive((prev) => (prev === on ? prev : on));
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    return () => window.removeEventListener("scroll", check);
  }, []);

  return (
    <div className="backdrop" aria-hidden="true">
      <i className="blob b1" />
      <i className="blob b2" />
      <i className="blob b3" />
      <Canvas
        className="backdrop-canvas"
        frameloop={active ? "always" : "never"}
        dpr={[1, 1.5]}
        flat
        camera={{ fov: 60, position: [0, 0, PATH_START], near: 0.1, far: 200 }}
        gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
      >
        <fog attach="fog" args={["#070a13", 14, 52]} />
        <Stars />
        {shapes.map((shape, i) => (
          <Shape key={i} {...shape} />
        ))}
        <Rig progress={progress} />
      </Canvas>
    </div>
  );
}