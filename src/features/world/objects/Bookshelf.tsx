import { glow } from "../../../lib/three-helpers";
import { Plant } from "./Plant";

const bookColors = [
  "#635044", "#8a6247", "#3f5b62", "#8d7553",
  "#514654", "#6b4a3c", "#56644e", "#a17a52",
];

const warmStrip = glow("#ffb868", 3);

function Owl() {
  return (
    <group position={[0.42, 1.54, 0.3]}>
      <mesh position={[0, 0.13, 0]} scale={[0.1, 0.14, 0.09]}>
        <sphereGeometry args={[1, 16, 14]} />
        <meshStandardMaterial color="#5a4fcf" emissive="#3a30a0" emissiveIntensity={0.6} roughness={0.5} />
      </mesh>
      {[-0.04, 0.04].map((x) => (
        <mesh key={x} position={[x, 0.17, 0.08]}>
          <sphereGeometry args={[0.025, 10, 10]} />
          <meshBasicMaterial color={glow("#ffd48a", 3)} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

function ShelfLamp() {
  return (
    <group position={[-0.45, 2.49, 0.3]}>
      <mesh position={[0, 0.1, 0]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshBasicMaterial color={glow("#ffc27a", 3)} toneMapped={false} />
      </mesh>
      <pointLight position={[0, 0.15, 0.1]} color="#ffbd78" intensity={2} distance={3} decay={2} />
    </group>
  );
}

export function Bookshelf() {
  return (
    <group position={[-4.85, 0, -2.25]}>
      {/* frame */}
      <mesh position={[0, 1.65, 0]} castShadow>
        <boxGeometry args={[1.55, 3.3, 0.34]} />
        <meshStandardMaterial color="#2e221b" roughness={0.9} />
      </mesh>

      {[0.55, 1.5, 2.45, 3.25].map((y) => (
        <mesh key={y} position={[0, y, 0.24]} castShadow>
          <boxGeometry args={[1.72, 0.075, 0.58]} />
          <meshStandardMaterial color="#79533a" roughness={0.76} />
        </mesh>
      ))}

      {/* books */}
      {Array.from({ length: 26 }, (_, i) => {
        const shelf = Math.floor(i / 7);
        const col = i % 7;
        const height = 0.32 + ((i * 7) % 4) * 0.09;

        return (
          <mesh
            key={i}
            position={[-0.62 + col * 0.2, 0.64 + shelf * 0.91 + height / 2, 0.28]}
            rotation={[0, 0, i % 9 === 0 ? 0.12 : 0]}
            castShadow
          >
            <boxGeometry args={[0.14, height, 0.24]} />
            <meshStandardMaterial color={bookColors[i % bookColors.length]} roughness={0.86} />
          </mesh>
        );
      })}

      {/* warm LED strips */}
      {[0.8, 1.75, 2.7].map((y) => (
        <group key={y}>
          <mesh position={[0, y, 0.5]}>
            <boxGeometry args={[1.5, 0.018, 0.02]} />
            <meshBasicMaterial color={warmStrip} toneMapped={false} />
          </mesh>
          <pointLight position={[0, y - 0.1, 0.6]} color="#ffbd78" intensity={1.4} distance={2.2} decay={2} />
        </group>
      ))}

      <Owl />
      <ShelfLamp />

      <Plant position={[-0.45, 3.29, 0.25]} scale={0.6} />
      <Plant position={[0.4, 3.29, 0.2]} scale={0.5} />
    </group>
  );
}