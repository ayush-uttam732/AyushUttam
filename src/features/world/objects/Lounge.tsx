import { useMemo } from "react";

import { bookCoverTexture, glow } from "../../../lib/three-helpers";
import { Plant } from "./Plant";

const moonColor = glow("#ffb23a", 2.6);

export function BeanBag() {
  return (
    <group position={[4.55, 0, 1.2]} rotation={[0, -0.5, 0]}>
      <mesh position={[0, 0.42, 0]} scale={[0.95, 0.5, 0.9]} castShadow receiveShadow>
        <sphereGeometry args={[1, 28, 20]} />
        <meshStandardMaterial color="#2b2733" roughness={0.95} />
      </mesh>
      <mesh position={[0.55, 0.85, -0.15]} scale={[0.6, 0.7, 0.75]} castShadow>
        <sphereGeometry args={[1, 28, 20]} />
        <meshStandardMaterial color="#302b39" roughness={0.95} />
      </mesh>
    </group>
  );
}

function MoonLamp() {
  return (
    <group position={[4.0, 0.57, 3.0]}>
      <mesh position={[0, 0.3, 0]}>
        <sphereGeometry args={[0.3, 32, 24]} />
        <meshStandardMaterial
          color="#ffc566"
          emissive={moonColor}
          emissiveIntensity={1.4}
          roughness={0.6}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.16, 0.18, 0.05, 20]} />
        <meshStandardMaterial color="#2a2522" roughness={0.6} />
      </mesh>
      <pointLight position={[0, 0.4, 0]} color="#ffae4a" intensity={9} distance={7} decay={2} />
    </group>
  );
}

function CoffeeTable() {
  const cover = useMemo(() => bookCoverTexture(), []);

  return (
    <group position={[3.3, 0, 3.0]}>
      {/* top */}
      <mesh position={[0, 0.52, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.8, 0.07, 0.95]} />
        <meshStandardMaterial color="#4a3022" roughness={0.55} />
      </mesh>

      {/* legs */}
      {[-0.82, 0.82].flatMap((x) =>
        [-0.4, 0.4].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 0.25, z]}>
            <boxGeometry args={[0.07, 0.5, 0.07]} />
            <meshStandardMaterial color="#2c1d15" roughness={0.7} />
          </mesh>
        )),
      )}

      {/* book */}
      <group position={[0.15, 0.605, 0.05]} rotation={[0, 0.25, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.78, 0.12, 0.56]} />
          <meshStandardMaterial color="#26243a" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.061, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.74, 0.52]} />
          <meshStandardMaterial map={cover} roughness={0.7} />
        </mesh>
      </group>

      <Plant position={[-0.6, 0.555, 0]} scale={0.55} pot="#4a3a33" />
    </group>
  );
}

export function Lounge() {
  return (
    <group>
      <BeanBag />
      <CoffeeTable />
      <MoonLamp />
    </group>
  );
}