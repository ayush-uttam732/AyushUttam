
import { useState } from "react";
import { Html } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";

type NotebookProps = {
  onClick?: () => void;
  position?: [number, number, number];
};

export function Notebook({
  onClick,
  position = [0, 0, 0],
}: NotebookProps) {
  const [hovered, setHovered] = useState(false);

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    onClick?.();
  };

  return (
    <group position={position} rotation={[-Math.PI / 2, 0, -0.12]}>
      {/* Notebook cover */}
      <mesh
        onClick={handleClick}
        onPointerOver={(event) => {
          event.stopPropagation();
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = "auto";
        }}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[0.72, 0.95, 0.07]} />
        <meshStandardMaterial
          color={hovered ? "#5445a0" : "#30265f"}
          roughness={0.65}
          metalness={0.12}
          emissive="#4935a5"
          emissiveIntensity={hovered ? 0.45 : 0.12}
        />
      </mesh>

      {/* Pages */}
      <mesh position={[0, 0, 0.04]} receiveShadow>
        <boxGeometry args={[0.66, 0.89, 0.025]} />
        <meshStandardMaterial color="#e9e5dc" roughness={0.9} />
      </mesh>

      {/* Notebook title */}
      <mesh position={[0, 0.17, 0.055]}>
        <planeGeometry args={[0.48, 0.22]} />
        <meshBasicMaterial color="#e9e5dc" />
      </mesh>

      <Html
        position={[0, 0.18, 0.065]}
        transform
        distanceFactor={4}
        style={{
          width: "90px",
          textAlign: "center",
          color: "#30265f",
          fontFamily: "monospace",
          fontSize: "10px",
          fontWeight: 700,
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        <div>AYUSH UTTAM</div>
        <div style={{ fontSize: "8px", marginTop: "3px" }}>
          DEVELOPER NOTES
        </div>
      </Html>

      {/* Page lines */}
      {[0, 1, 2, 3].map((line) => (
        <mesh key={line} position={[-0.02, -0.02 - line * 0.12, 0.056]}>
          <boxGeometry args={[0.42, 0.008, 0.003]} />
          <meshBasicMaterial color="#9c9ab5" />
        </mesh>
      ))}

      {/* Hover label */}
      {hovered && (
        <Html
          position={[0, 0.68, 0.1]}
          center
          distanceFactor={4}
          style={{ pointerEvents: "none", whiteSpace: "nowrap" }}
        >
          <div
            style={{
              background: "#101827",
              color: "#c4b5fd",
              border: "1px solid #a18aff",
              borderRadius: "5px",
              padding: "6px 10px",
              fontSize: "11px",
              fontFamily: "monospace",
            }}
          >
            ABOUT ME ↗
          </div>
        </Html>
      )}
    </group>
  );
}

export default Notebook;
