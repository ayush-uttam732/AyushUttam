import { useEffect, useMemo, useRef } from "react";
import type { RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { RoundedBox, Sparkles } from "@react-three/drei";
import { AdditiveBlending, CanvasTexture, MathUtils, Vector3 } from "three";
import type { Group, PerspectiveCamera } from "three";

const PHONE_W = 1.5;
const PHONE_H = 3.1;

/** Size (CSS px) of the HTML screen that is pinned onto the glass. Same ratio as the glass. */
export const SCREEN_PX_W = 310;
export const SCREEN_PX_H = 673;

const GLASS_HALF_W = (PHONE_W - 0.16) / 2;
const GLASS_HALF_H = (PHONE_H - 0.19) / 2;
const GLASS_Z = 0.115;

const glassCorners = [
  new Vector3(-GLASS_HALF_W, GLASS_HALF_H, GLASS_Z),
  new Vector3(GLASS_HALF_W, GLASS_HALF_H, GLASS_Z),
  new Vector3(GLASS_HALF_W, -GLASS_HALF_H, GLASS_Z),
  new Vector3(-GLASS_HALF_W, -GLASS_HALF_H, GLASS_Z),
];

/** CSS matrix3d that maps the flat HTML screen onto the 4 projected glass corners. */
function screenMatrix(p: { x: number; y: number }[]) {
  const [p0, p1, p2, p3] = p;
  const dx1 = p1.x - p2.x;
  const dx2 = p3.x - p2.x;
  const dx3 = p0.x - p1.x + p2.x - p3.x;
  const dy1 = p1.y - p2.y;
  const dy2 = p3.y - p2.y;
  const dy3 = p0.y - p1.y + p2.y - p3.y;
  const den = dx1 * dy2 - dy1 * dx2 || 1e-9;
  const g = (dx3 * dy2 - dy3 * dx2) / den;
  const h = (dx1 * dy3 - dy1 * dx3) / den;
  const a = p1.x - p0.x + g * p1.x;
  const b = p3.x - p0.x + h * p3.x;
  const d = p1.y - p0.y + g * p1.y;
  const e = p3.y - p0.y + h * p3.y;
  const w = SCREEN_PX_W;
  const ht = SCREEN_PX_H;

  return `matrix3d(${a / w},${d / w},0,${g / w},${b / ht},${e / ht},0,${h / ht},0,0,1,0,${p0.x},${p0.y},0,1)`;
}

/** soft green/violet glow behind the phone */
function makeGlow() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
  const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  gr.addColorStop(0, "rgba(37,211,102,0.38)");
  gr.addColorStop(0.45, "rgba(139,108,255,0.18)");
  gr.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = gr;
  g.fillRect(0, 0, 256, 256);
  return new CanvasTexture(c);
}

type Phone3DProps = {
  awake: boolean;
  /** The HTML screen element (it gets stuck onto the phone's glass every frame). */
  screenRef: RefObject<HTMLDivElement | null>;
};

export function Phone3D({ awake, screenRef }: Phone3DProps) {
  const phoneRef = useRef<Group>(null);
  const startTime = useRef<number | null>(null);

  const size = useThree((state) => state.size);
  const rings = useRef<Group>(null);
  const mouse = useRef({ x: 0, y: 0 });
  const glowTex = useMemo(makeGlow, []);
  useEffect(() => () => glowTex.dispose(), [glowTex]);

  // canvas par pointer events band hain (overlay click-through hai), isliye mouse window se lete hain
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useFrame((state) => {
    if (startTime.current === null) {
      startTime.current = state.clock.elapsedTime;
    }

    const age = state.clock.elapsedTime - startTime.current;
    const intro = 1 - Math.pow(1 - Math.min(1, age / 1.2), 3);

    const camera = state.camera as PerspectiveCamera;
    const aspect = Math.max(size.width / Math.max(size.height, 1), 0.1);
    const tan = Math.tan(MathUtils.degToRad(camera.fov / 2));

    const distance = Math.max(
      (PHONE_H + 0.8) / (2 * tan),
      (PHONE_W + 0.8) / (2 * tan * aspect),
    );

    camera.position.set(0, 0, distance);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();

    const phone = phoneRef.current;
    if (!phone) return;

    const t = state.clock.elapsedTime;

    if (rings.current) {
      rings.current.rotation.z = t * 0.3;
      rings.current.scale.setScalar(0.6 + 0.4 * intro);
    }

    phone.position.y = -2.5 * (1 - intro) + Math.sin(t * 1.1) * 0.035;
    phone.scale.setScalar(0.6 + 0.4 * intro);

    // Gentle tilt keeps the front of the phone readable.
    phone.rotation.x = MathUtils.lerp(phone.rotation.x, -mouse.current.y * 0.06, 0.06);
    phone.rotation.y = MathUtils.lerp(phone.rotation.y, mouse.current.x * 0.12, 0.06);
    phone.rotation.z = Math.sin(t * 0.65) * 0.008;

    // pin the HTML screen onto the 3D glass (follows float / scale / tilt)
    const el = screenRef.current;
    if (el) {
      phone.updateMatrixWorld(true);
      const points = glassCorners.map((corner) => {
        const v = corner.clone().applyMatrix4(phone.matrixWorld).project(camera);
        return {
          x: ((v.x + 1) / 2) * state.size.width,
          y: ((1 - v.y) / 2) * state.size.height,
        };
      });
      el.style.transform = screenMatrix(points);
      el.style.visibility = "visible";
    }
  });

  return (
    <>
      <ambientLight intensity={1.15} />
      <directionalLight position={[3, 4, 5]} intensity={2.1} />
      <pointLight
        position={[-2, 0.5, 2]}
        intensity={awake ? 8 : 3}
        color="#25d366"
        distance={5}
      />
      <pointLight
        position={[2, -1, 2]}
        intensity={6}
        color="#9b8cff"
        distance={5}
      />

      <Sparkles
        count={42}
        scale={[4, 5, 2]}
        size={2.2}
        speed={0.3}
        opacity={0.65}
        color="#59e1d2"
      />

      {/* glow + orbit rings behind the phone (depth) */}
      <mesh position={[0, 0, -0.9]}>
        <planeGeometry args={[7, 7]} />
        <meshBasicMaterial map={glowTex} transparent blending={AdditiveBlending} depthWrite={false} />
      </mesh>
      <group position={[0, 0, -0.3]}>
        <group ref={rings}>
          {[1.75, 2.1].map((r, i) => (
            <group key={r} rotation={[0, 0, i * 2.2]}>
              <mesh>
                <torusGeometry args={[r, 0.008, 8, 160]} />
                <meshBasicMaterial color={i ? "#8b6cff" : "#2dd4bf"} transparent opacity={0.5} />
              </mesh>
              <mesh position={[r, 0, 0]}>
                <sphereGeometry args={[0.05, 12, 12]} />
                <meshBasicMaterial color={i ? "#c4b5fd" : "#7ef0ca"} />
              </mesh>
            </group>
          ))}
        </group>
      </group>

      <group ref={phoneRef}>
        {/* Main metal body */}
        <RoundedBox
          args={[PHONE_W, PHONE_H, 0.17]}
          radius={0.17}
          smoothness={6}
        >
          <meshStandardMaterial
            color="#171923"
            metalness={0.85}
            roughness={0.25}
          />
        </RoundedBox>

        {/* Front bezel */}
        <RoundedBox
          args={[PHONE_W - 0.055, PHONE_H - 0.055, 0.025]}
          radius={0.145}
          smoothness={5}
          position={[0, 0, 0.09]}
        >
          <meshStandardMaterial
            color="#05070d"
            metalness={0.2}
            roughness={0.22}
          />
        </RoundedBox>

        {/* Screen base */}
        <RoundedBox
          args={[PHONE_W - 0.16, PHONE_H - 0.19, 0.012]}
          radius={0.105}
          smoothness={5}
          position={[0, 0, 0.107]}
        >
          <meshStandardMaterial
            color="#07121a"
            emissive="#06231c"
            emissiveIntensity={awake ? 0.32 : 0.12}
            roughness={0.25}
          />
        </RoundedBox>

        {/* Earpiece */}
        <RoundedBox
          args={[0.28, 0.035, 0.014]}
          radius={0.017}
          smoothness={4}
          position={[0, PHONE_H / 2 - 0.13, 0.119]}
        >
          <meshStandardMaterial color="#292d39" metalness={0.5} />
        </RoundedBox>

        {/* Front camera */}
        <mesh position={[0.24, PHONE_H / 2 - 0.13, 0.12]}>
          <circleGeometry args={[0.027, 24]} />
          <meshStandardMaterial
            color="#172b49"
            metalness={0.5}
            roughness={0.2}
          />
        </mesh>

        {/* Side buttons */}
        <mesh position={[PHONE_W / 2 + 0.008, 0.55, 0]}>
          <boxGeometry args={[0.025, 0.42, 0.06]} />
          <meshStandardMaterial color="#454959" metalness={0.8} />
        </mesh>

        <mesh position={[-PHONE_W / 2 - 0.008, 0.65, 0]}>
          <boxGeometry args={[0.025, 0.25, 0.06]} />
          <meshStandardMaterial color="#454959" metalness={0.8} />
        </mesh>

        {/* Bottom charging port */}
        <RoundedBox
          args={[0.2, 0.025, 0.012]}
          radius={0.01}
          smoothness={3}
          position={[0, -PHONE_H / 2 - 0.002, 0]}
        >
          <meshStandardMaterial color="#303443" metalness={0.7} />
        </RoundedBox>
      </group>
    </>
  );
}