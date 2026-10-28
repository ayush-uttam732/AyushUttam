import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import {
  Bloom,
  DepthOfField,
  EffectComposer,
  N8AO,
  Noise,
  ToneMapping,
  Vignette,
} from "@react-three/postprocessing";
import { BlendFunction, ToneMappingMode } from "postprocessing";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";

import type { PanelName } from "../../types";
import { CAMERA_START } from "../../utils/constants";
import { WorldScene } from "./WorldScene";
import { WorldControls } from "./controls/WorldControls";

// RectAreaLight ke liye ek baar init zaroori hai
RectAreaLightUniformsLib.init();

export function WorldCanvas({ onSelect }: { onSelect: (panel: PanelName) => void }) {
  return (
    <Canvas
      camera={{ position: CAMERA_START, fov: 38, near: 0.1, far: 100 }}
      dpr={[1, 2]}
      shadows="soft"
      flat // tone mapping sirf EffectComposer me hoga, double nahi
      gl={{ antialias: false, alpha: false, powerPreference: "high-performance" }}
    >
      <color attach="background" args={["#07080f"]} />
      <fog attach="fog" args={["#07080f", 18, 40]} />

      {/* Image-based lighting: reflections + soft ambient, sabse bada realism boost */}
      <Environment preset="night" environmentIntensity={0.35} />
      {/* Local HDRI use karna ho to: <Environment files="/textures/night-city.hdr" environmentIntensity={0.35} /> */}

      <ambientLight intensity={0.12} />
      <hemisphereLight args={["#8fa6e8", "#3a2a24", 0.35]} />

      {/* Window se aati moonlight / city light */}
      <directionalLight
        position={[6, 7, 3]}
        intensity={0.9}
        color="#7f9bff"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0003}
        shadow-normalBias={0.03}
        shadow-camera-left={-9}
        shadow-camera-right={9}
        shadow-camera-top={9}
        shadow-camera-bottom={-9}
      />

      {/* Desk lamp (warm) */}
      <spotLight
        position={[-2.2, 2.6, -1.3]}
        color="#ffb36b"
        intensity={60}
        angle={0.7}
        penumbra={0.9}
        distance={9}
        decay={2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.0004}
      />

      {/* Shelf LED strip glow (amber) */}
      <pointLight position={[-3.4, 2.2, -2]} color="#ff9a3c" intensity={8} distance={6} decay={2} />

      {/* Monitors / PC ka purple-blue glow */}
      <pointLight position={[0.8, 1.4, -1.6]} color="#7a5cff" intensity={7} distance={6} decay={2} />
      <pointLight position={[3, 2.8, -2]} color="#658bff" intensity={5} distance={8} decay={2} />

      {/* Neon sign "Good Code Good Life" (positions apne scene ke hisaab se adjust karo) */}
      <rectAreaLight position={[-4.2, 2.4, -2.4]} rotation={[0, Math.PI / 2.5, 0]} width={1} height={2} color="#ffb070" intensity={4} />

      <Suspense fallback={null}>
        <WorldScene onSelect={onSelect} />
      </Suspense>

      <WorldControls />

      <EffectComposer multisampling={0} enableNormalPass>
        {/* Contact shadows / corners me depth */}
        <N8AO aoRadius={0.6} intensity={2.2} distanceFalloff={1} quality="medium" />

        <Bloom
          intensity={0.9}
          luminanceThreshold={0.75}
          luminanceSmoothing={0.25}
          mipmapBlur
        />

        {/* Halka camera-lens focus effect */}
        <DepthOfField focusDistance={0.02} focalLength={0.04} bokehScale={1.6} />

        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        <Noise premultiply blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.35} />
        <Vignette eskil={false} offset={0.25} darkness={0.75} />
      </EffectComposer>
    </Canvas>
  );
}