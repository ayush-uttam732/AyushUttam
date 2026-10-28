import { useEffect, useMemo, useRef, useState } from "react";
import type { MutableRefObject } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  DataTexture,
  LinearFilter,
  RGBAFormat,
  ShaderMaterial,
  TextureLoader,
  Vector2,
} from "three";
import type { Texture } from "three";

import roomUrl from "../../assets/room.jpg";
import depthUrl from "../../assets/room-depth.jpg";

import { STRENGTH_X, STRENGTH_Y, ZOOM } from "./Stage";

export type PointerState = { x: number; y: number };

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform sampler2D uMap;
  uniform sampler2D uDepth;
  uniform vec2 uMouse;
  uniform vec2 uStrength;
  uniform float uZoom;
  varying vec2 vUv;

  void main() {
    vec2 uv = (vUv - 0.5) / uZoom + 0.5;
    vec2 off = uMouse * uStrength;

    // two-step parallax lookup (less stretching at depth edges)
    float d = texture2D(uDepth, uv).r;
    vec2 uv1 = uv + off * (d - 0.5);
    d = texture2D(uDepth, uv1).r;
    vec2 uv2 = uv + off * (d - 0.5);

    gl_FragColor = vec4(texture2D(uMap, uv2).rgb, 1.0);
  }
`;

function useTexture(url: string, fallback: () => Texture): Texture | null {
  const [texture, setTexture] = useState<Texture | null>(null);

  useEffect(() => {
    let alive = true;
    new TextureLoader().load(
      url,
      (loaded) => {
        loaded.minFilter = LinearFilter;
        loaded.magFilter = LinearFilter;
        loaded.generateMipmaps = false;
        loaded.anisotropy = 8;
        if (alive) setTexture(loaded);
      },
      undefined,
      () => {
        if (alive) setTexture(fallback());
      },
    );
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  return texture;
}

function flatTexture(r: number, g: number, b: number) {
  const data = new Uint8Array([r, g, b, 255]);
  const t = new DataTexture(data, 1, 1, RGBAFormat);
  t.needsUpdate = true;
  return t;
}

function Plane({ pointer, onReady }: { pointer: MutableRefObject<PointerState>; onReady: () => void }) {
const map = useTexture(roomUrl, () => flatTexture(12, 14, 24));
  // no depth map? use flat grey -> the whole image just slides a little
const depth = useTexture(depthUrl, () => flatTexture(128, 128, 128));

  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          uMap: { value: null },
          uDepth: { value: null },
          uMouse: { value: new Vector2() },
          uStrength: { value: new Vector2(STRENGTH_X, STRENGTH_Y) },
          uZoom: { value: ZOOM },
        },
        depthTest: false,
        depthWrite: false,
      }),
    [],
  );

  const ready = useRef(false);

  useFrame(() => {
    if (!map || !depth) return;
    material.uniforms.uMap.value = map;
    material.uniforms.uDepth.value = depth;
    material.uniforms.uMouse.value.set(pointer.current.x, pointer.current.y);

    if (!ready.current) {
      ready.current = true;
      onReady();
    }
  });

  return (
    <mesh frustumCulled={false} material={material}>
      <planeGeometry args={[2, 2]} />
    </mesh>
  );
}

export function DepthCanvas({
  pointer,
  onReady,
}: {
  pointer: MutableRefObject<PointerState>;
  onReady: () => void;
}) {
  return (
    <Canvas
      className="depth-canvas"
      dpr={[1, 1.75]}
      flat
      gl={{ antialias: false, alpha: false, powerPreference: "high-performance" }}
    >
      <Plane pointer={pointer} onReady={onReady} />
    </Canvas>
  );
}