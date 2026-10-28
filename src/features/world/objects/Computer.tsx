import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group, MeshBasicMaterial, Texture } from "three";

import type { Vec3 } from "../../../types";
import { CYAN, PURPLE } from "../../../utils/constants";
import {
  codeTexture,
  glow,
  wallpaperTexture,
} from "../../../lib/three-helpers";

const screenTint = glow("#ffffff", 1.25);
const purpleLed = glow(PURPLE, 3);
const cyanLed = glow(CYAN, 3);

/* --------------------------------------------------------------- monitor */

function Monitor({
  position,
  map,
  accent,
}: {
  position: Vec3;
  map: Texture;
  accent: string;
}) {
  return (
    <group position={position}>
      <mesh position={[0, 0.78, 0]} castShadow>
        <boxGeometry args={[1.66, 1.12, 0.105]} />
        <meshStandardMaterial color="#12151c" metalness={0.4} roughness={0.3} />
      </mesh>

      <mesh position={[0, 0.78, 0.057]}>
        <planeGeometry args={[1.56, 1.02]} />
        <meshBasicMaterial map={map} color={screenTint} toneMapped={false} />
      </mesh>

      <mesh position={[0, 0.78, 0.06]}>
        <planeGeometry args={[1.56, 1.02]} />
        <meshBasicMaterial color={accent} transparent opacity={0.04} toneMapped={false} />
      </mesh>

      <mesh position={[0, 0.17, -0.005]}>
        <boxGeometry args={[0.11, 0.25, 0.13]} />
        <meshStandardMaterial color="#454955" metalness={0.7} roughness={0.3} />
      </mesh>

      <mesh position={[0, 0.045, 0.035]}>
        <boxGeometry args={[0.53, 0.045, 0.3]} />
        <meshStandardMaterial color="#292d36" metalness={0.5} roughness={0.4} />
      </mesh>

      <pointLight position={[0, 0.8, 0.8]} color={accent} intensity={1.6} distance={3} decay={2} />
    </group>
  );
}

/* ---------------------------------------------------------------- gaming pc */

function Fan({ position, hue }: { position: Vec3; hue: number }) {
  const blades = useRef<Group>(null);
  const ring = useRef<MeshBasicMaterial>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (blades.current) blades.current.rotation.z = -t * 3.2;
    if (ring.current) {
      ring.current.color
        .setHSL((hue + Math.sin(t * 0.5) * 0.05 + 1) % 1, 0.95, 0.6)
        .multiplyScalar(3);
    }
  });

  return (
    <group position={position}>
      <mesh>
        <torusGeometry args={[0.13, 0.014, 8, 40]} />
        <meshBasicMaterial ref={ring} color={purpleLed} toneMapped={false} />
      </mesh>

      <group ref={blades}>
        {Array.from({ length: 7 }, (_, i) => (
          <mesh key={i} rotation={[0, 0, (i / 7) * Math.PI * 2]} position={[0, 0, 0]}>
            <boxGeometry args={[0.2, 0.035, 0.006]} />
            <meshBasicMaterial color="#1b2740" toneMapped={false} />
          </mesh>
        ))}
      </group>

      <mesh>
        <circleGeometry args={[0.03, 16]} />
        <meshBasicMaterial color={cyanLed} toneMapped={false} />
      </mesh>
    </group>
  );
}

function GamingPC({ position }: { position: Vec3 }) {
  return (
    <group position={position} scale={0.92}>
      <mesh position={[0, 0.49, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.58, 0.98, 0.72]} />
        <meshStandardMaterial color="#14161c" metalness={0.45} roughness={0.33} />
      </mesh>

      <mesh position={[0, 0.49, 0.365]}>
        <planeGeometry args={[0.5, 0.88]} />
        <meshStandardMaterial
          color="#0c1424"
          metalness={0.5}
          roughness={0.15}
          emissive="#1b1a5a"
          emissiveIntensity={0.6}
        />
      </mesh>

      <Fan position={[0, 0.76, 0.375]} hue={0.72} />
      <Fan position={[0, 0.49, 0.375]} hue={0.62} />
      <Fan position={[0, 0.22, 0.375]} hue={0.8} />

      <pointLight position={[0, 0.5, 0.9]} color="#7a5cff" intensity={4} distance={3.5} decay={2} />
    </group>
  );
}

/* ----------------------------------------------------------------- small */

function Keyboard({ position }: { position: Vec3 }) {
  return (
    <group position={position}>
      <mesh castShadow>
        <boxGeometry args={[1.15, 0.055, 0.34]} />
        <meshStandardMaterial color="#14171e" roughness={0.4} />
      </mesh>

      <mesh position={[0, -0.02, 0]}>
        <boxGeometry args={[1.19, 0.02, 0.38]} />
        <meshBasicMaterial color={purpleLed} toneMapped={false} />
      </mesh>

      {Array.from({ length: 4 }, (_, row) =>
        Array.from({ length: 13 }, (_, col) => (
          <mesh
            key={`${row}-${col}`}
            position={[-0.52 + col * 0.086, 0.033, -0.115 + row * 0.073]}
          >
            <boxGeometry args={[0.055, 0.014, 0.044]} />
            <meshStandardMaterial
              color={(row + col) % 7 === 0 ? "#648c9d" : "#2a303c"}
              roughness={0.65}
            />
          </mesh>
        )),
      )}
    </group>
  );
}

function DeskLamp({ position }: { position: Vec3 }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.04, 0]}>
        <cylinderGeometry args={[0.13, 0.16, 0.055, 20]} />
        <meshStandardMaterial color="#343238" metalness={0.65} roughness={0.4} />
      </mesh>

      <mesh position={[0, 0.35, 0]}>
        <cylinderGeometry args={[0.03, 0.04, 0.62, 12]} />
        <meshStandardMaterial color="#4a4542" metalness={0.7} roughness={0.35} />
      </mesh>

      <mesh position={[0.07, 0.68, 0]} rotation={[0, 0, -0.5]}>
        <coneGeometry args={[0.17, 0.26, 20, 1, true]} />
        <meshStandardMaterial color="#cfae82" side={2} emissive="#ffb65f" emissiveIntensity={0.9} />
      </mesh>

      <mesh position={[0.1, 0.6, 0]}>
        <sphereGeometry args={[0.06, 12, 12]} />
        <meshBasicMaterial color={glow("#ffd9a0", 3)} toneMapped={false} />
      </mesh>

      <pointLight position={[0.1, 0.55, 0.05]} color="#ffbd80" intensity={5} distance={4} decay={2} />
    </group>
  );
}

function Headphones({ position }: { position: Vec3 }) {
  return (
    <group position={position}>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.14, 0.026, 10, 24, Math.PI]} />
        <meshStandardMaterial color="#20242d" metalness={0.35} roughness={0.4} />
      </mesh>
      {[-0.13, 0.13].map((x) => (
        <mesh key={x} position={[x, -0.05, 0]}>
          <boxGeometry args={[0.075, 0.14, 0.1]} />
          <meshStandardMaterial color="#303541" roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

function Mug({ position }: { position: Vec3 }) {
  return (
    <group position={position}>
      <mesh castShadow>
        <cylinderGeometry args={[0.055, 0.05, 0.1, 18]} />
        <meshStandardMaterial color="#d8d2c4" roughness={0.5} />
      </mesh>
      <mesh position={[0.065, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.03, 0.009, 8, 16]} />
        <meshStandardMaterial color="#d8d2c4" roughness={0.5} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ desk */

export function Desk() {
  const code = useMemo(() => codeTexture(), []);
  const wallpaper = useMemo(() => wallpaperTexture(), []);

  return (
    <group position={[0.55, 0, -1.6]}>
      {/* top */}
      <mesh position={[0, 1.05, 0]} castShadow receiveShadow>
        <boxGeometry args={[4.15, 0.14, 1.55]} />
        <meshStandardMaterial color="#6a4630" roughness={0.5} metalness={0.03} />
      </mesh>

      <mesh position={[0, 0.97, 0.76]}>
        <boxGeometry args={[4.1, 0.025, 0.025]} />
        <meshStandardMaterial color="#a57a52" roughness={0.65} />
      </mesh>

      {/* under-desk RGB strip */}
      <mesh position={[0, 0.965, 0.7]}>
        <boxGeometry args={[4.0, 0.02, 0.02]} />
        <meshBasicMaterial color={purpleLed} toneMapped={false} />
      </mesh>
      <pointLight position={[0, 0.7, 0.3]} color="#7a4bff" intensity={5} distance={4.5} decay={2} />

      {/* cabinets */}
      {[-1.65, 1.65].map((x) => (
        <group key={x} position={[x, 0.49, 0]}>
          <mesh position={[0, 0.04, 0]} castShadow>
            <boxGeometry args={[0.67, 0.82, 1.12]} />
            <meshStandardMaterial color="#2a211c" roughness={0.78} />
          </mesh>
          {[0.22, -0.03, -0.28].map((y) => (
            <mesh key={y} position={[0, y, 0.57]}>
              <boxGeometry args={[0.48, 0.018, 0.018]} />
              <meshStandardMaterial color="#5c4b40" metalness={0.4} />
            </mesh>
          ))}
        </group>
      ))}

      <Monitor position={[-1.0, 1.12, -0.4]} map={code} accent={CYAN} />
      <Monitor position={[0.72, 1.12, -0.4]} map={wallpaper} accent={PURPLE} />

      <Keyboard position={[-0.14, 1.15, 0.35]} />

      {/* mouse */}
      <mesh position={[0.78, 1.17, 0.38]} rotation={[0, -0.2, 0]}>
        <capsuleGeometry args={[0.06, 0.12, 4, 10]} />
        <meshStandardMaterial color="#242832" roughness={0.4} />
      </mesh>

      <Headphones position={[-1.3, 1.22, 0.4]} />
      <Mug position={[1.25, 1.17, 0.35]} />
      <DeskLamp position={[-1.85, 1.12, 0.05]} />

      <GamingPC position={[1.83, 1.12, -0.3]} />
    </group>
  );
}