import { useRef, useState } from "react";
import { OrbitControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";

import {
  CAMERA_END,
  CAMERA_START,
  CAMERA_TARGET,
} from "../../../utils/constants";

const INTRO_SECONDS = 2.8;
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/** Cinematic dolly-in on load, then free (limited) orbit. */
export function WorldControls() {
  const camera = useThree((state) => state.camera);
  const [ready, setReady] = useState(false);
  const start = useRef<number | null>(null);

  useFrame(({ clock }) => {
    if (ready) return;

    if (start.current === null) start.current = clock.elapsedTime;
    const progress = Math.min(
      (clock.elapsedTime - start.current) / INTRO_SECONDS,
      1,
    );
    const k = easeOutCubic(progress);

    camera.position.set(
      CAMERA_START[0] + (CAMERA_END[0] - CAMERA_START[0]) * k,
      CAMERA_START[1] + (CAMERA_END[1] - CAMERA_START[1]) * k,
      CAMERA_START[2] + (CAMERA_END[2] - CAMERA_START[2]) * k,
    );
    camera.lookAt(...CAMERA_TARGET);

    if (progress >= 1) setReady(true);
  });

  return (
    <OrbitControls
      makeDefault
      enabled={ready}
      target={CAMERA_TARGET}
      enablePan={false}
      minDistance={6}
      maxDistance={13}
      minPolarAngle={0.65}
      maxPolarAngle={1.35}
      minAzimuthAngle={-1.05}
      maxAzimuthAngle={1.05}
      enableDamping
      dampingFactor={0.06}
    />
  );
}