
import { useState } from "react";
import { Html } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";

type ContactPhoneProps = {
  onClick?: () => void;
  position?: [number, number, number];
};

export function ContactPhone({
  onClick,
  position = [0, 0, 0],
}: ContactPhoneProps) {
  const [hovered, setHovered] = useState(false);

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    onClick?.();
  };

  return (
    <group position={position} rotation={[-0.12, 0.2, 0]}>
      {/* Phone body */}
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
      >
        <boxGeometry args={[0.42, 0.78, 0.09]} />
        <meshStandardMaterial
          color={hovered ? "#34415b" : "#151b29"}
          metalness={0.65}
          roughness={0.28}
          emissive="#087fba"
          emissiveIntensity={hovered ? 0.65 : 0.08}
        />
      </mesh>

      {/* Screen */}
      <mesh position={[0, 0, 0.047]} onClick={handleClick}>
        <planeGeometry args={[0.35, 0.68]} />
        <meshBasicMaterial color="#071522" />
      </mesh>

      {/* Screen content */}
      <Html
        position={[0, 0.03, 0.055]}
        transform
        distanceFactor={4}
        style={{
          width: "70px",
          color: "#59e1d2",
          fontFamily: "monospace",
          fontSize: "9px",
          textAlign: "center",
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        <div>
          <div style={{ fontSize: "18px", marginBottom: "4px" }}>✉</div>
          <div style={{ fontWeight: 700 }}>LET'S TALK</div>
          <div style={{ fontSize: "7px", marginTop: "5px" }}>
            AVAILABLE
          </div>
        </div>
      </Html>

      {/* Home button */}
      <mesh position={[0, -0.35, 0.05]}>
        <circleGeometry args={[0.025, 20]} />
        <meshBasicMaterial color="#59e1d2" />
      </mesh>

      {/* Hover label */}
      {hovered && (
        <Html
          position={[0, 0.58, 0]}
          center
          distanceFactor={4}
          style={{ pointerEvents: "none", whiteSpace: "nowrap" }}
        >
          <div
            style={{
              background: "#101827",
              color: "#59e1d2",
              border: "1px solid #59e1d2",
              borderRadius: "5px",
              padding: "6px 10px",
              fontSize: "11px",
              fontFamily: "monospace",
            }}
          >
            CONTACT ME ↗
          </div>
        </Html>
      )}
    </group>
  );
}

export default ContactPhone;
