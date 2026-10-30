import { memo, useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import type { Project } from '../../../types';
import {
  accentOf,
  CARD_SCALE,
  CARD_SIZES,
  drawCards,
  drawScreen,
  getCachedImage,
  loadProjectImage,
  SCREEN_H,
  SCREEN_W,
} from './laptopTextures';

const A_OPEN = -1.88; // lid kitna khulta hai (radians)
const LID = 2.1;
const BASEH = 0.12;
/** Timeline (seconds): booting, unlocking, screen online, loading, ready */
const STAGE_AT = [0.1, 1.9, 3.1, 3.9, 5.3];
const FLY = 1.7;
/** camera ka field of view (hum khud set karte hain taaki laptop ka size viewport se tay ho) */
const FOV = 36;
/** laptop is time tak aata hai, uske baad lid scene khulne par hi khulta hai */
const OPEN_AT = 1.9;

const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);
const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const easeBack = (x: number) => 1 + 2.4 * Math.pow(x - 1, 3) + 1.4 * Math.pow(x - 1, 2);
const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));

/** [width, height, screen-x, screen-y, normal-offset]: screen se kitna bahar nikalte hain */
const LAYERS: [number, number, number, number, number][] = [
  [1.35, 0.65, -2.3, -0.75, 0.95],
  [1.5, 0.85, 2.3, 0.75, 1.25],
  [1.7, 0.33, 0.1, 1.25, 0.7],
];

function makeCanvas(w: number, h: number) {
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 16;
  return { cv, tex };
}

function makeGlow() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d')!;
  const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  gr.addColorStop(0, 'rgba(45,212,191,.55)');
  gr.addColorStop(0.5, 'rgba(139,108,255,.25)');
  gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}

function makeLogo() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d')!;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.shadowColor = '#2dd4bf';
  g.shadowBlur = 24;
  g.fillStyle = '#e9fffa';
  g.font = '700 96px ui-sans-serif, system-ui, sans-serif';
  g.fillText('AU', 108, 128);
  g.fillStyle = '#2dd4bf';
  g.beginPath();
  g.arc(186, 150, 11, 0, 7);
  g.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function ArrowBtn({ dir, color, onClick }: { dir: 'prev' | 'next'; color: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={dir === 'prev' ? 'Previous project' : 'Next project'}
      style={{
        pointerEvents: 'auto',
        width: 48,
        height: 48,
        display: 'grid',
        placeItems: 'center',
        borderRadius: '50%',
        border: `1px solid ${color}`,
        background: 'rgba(10,12,24,0.7)',
        backdropFilter: 'blur(6px)',
        color: '#fff',
        cursor: 'pointer',
        boxShadow: `0 0 22px ${color}66`,
        transition: 'transform .2s, background .2s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.12)')}
      onMouseLeave={(e) => (e.currentTarget.style.transform = 'none')}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        {dir === 'prev' ? <path d="M15 5l-7 7 7 7" /> : <path d="M9 5l7 7-7 7" />}
      </svg>
    </button>
  );
}

interface Props {
  projects: Project[];
  active: number;
  reduced: boolean;
  onStage: (n: number) => void;
  /** laptop ke arrows tabhi dikhte hain jab deck ready ho */
  ready: boolean;
  onPrev: () => void;
  onNext: () => void;
}

export const LaptopScene = memo(function LaptopScene({ projects, active, reduced, onStage, ready, onPrev, onNext }: Props) {
  const size = useThree((s) => s.size);
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const compact = size.width < 820;

  const root = useRef<THREE.Group>(null);
  const lid = useRef<THREE.Group>(null);
  const keyLight = useRef<THREE.PointLight>(null);
  const layerRefs = useRef<(THREE.Mesh | null)[]>([]);
  const ringRefs = useRef<(THREE.Mesh | null)[]>([]);
  const glowRef = useRef<THREE.Mesh>(null);
  const stageRef = useRef(-1);
  const swap = useRef({ t: 1, flick: 0 });
  const mouse = useRef({ x: 0, y: 0 });
  const host = useRef<HTMLElement | null | undefined>(undefined);
  const startAt = useRef(-1);
  const startBase = useRef(0);

  // canvas transparent: peeche website ka 3D background dikhe
  useEffect(() => {
    scene.background = null;
    gl.setClearColor(0x000000, 0);
    gl.setClearAlpha(0);
  }, [gl, scene]);

  const gfx = useMemo(() => {
    const screen = makeCanvas(SCREEN_W, SCREEN_H);
    const cards = CARD_SIZES.map(([w, h]) => makeCanvas(w * CARD_SCALE, h * CARD_SCALE));
    const screenMat = new THREE.MeshBasicMaterial({ map: screen.tex, toneMapped: false });
    const cardMats = cards.map(
      (c) => new THREE.MeshBasicMaterial({ map: c.tex, transparent: true, toneMapped: false, depthWrite: false }),
    );
    const alu = new THREE.MeshStandardMaterial({ color: '#aab0c4', metalness: 0.35, roughness: 0.45 });
    const dark = new THREE.MeshStandardMaterial({ color: '#0b0a12', metalness: 0.2, roughness: 0.7 });
    const keyMat = new THREE.MeshStandardMaterial({ color: '#1b1828', roughness: 0.5 });
    const padMat = new THREE.MeshStandardMaterial({ color: '#2a2740', roughness: 0.3, metalness: 0.4 });
    const glow = makeGlow();
    const logo = makeLogo();
    const keys = new THREE.InstancedMesh(new THREE.BoxGeometry(0.17, 0.035, 0.15), keyMat, 6 * 15);
    const o = new THREE.Object3D();
    let n = 0;
    for (let r = 0; r < 6; r++)
      for (let k = 0; k < 15; k++) {
        o.position.set(-1.33 + k * 0.19, BASEH + 0.015, -0.75 + r * 0.19);
        o.updateMatrix();
        keys.setMatrixAt(n++, o.matrix);
      }
    return { screen, cards, screenMat, cardMats, alu, dark, keyMat, padMat, glow, logo, keys };
  }, []);

  useEffect(
    () => () => {
      gfx.screen.tex.dispose();
      gfx.cards.forEach((c) => c.tex.dispose());
      gfx.screenMat.dispose();
      gfx.cardMats.forEach((m) => m.dispose());
      gfx.alu.dispose();
      gfx.dark.dispose();
      gfx.keyMat.dispose();
      gfx.padMat.dispose();
      gfx.glow.dispose();
      gfx.logo.dispose();
      gfx.keys.dispose();
    },
    [gfx],
  );

  // Project badalte hi screen aur cards dobara draw hote hain.
  // Asli image async load hoti hai: pehle jo ho wo dikhta hai, image aate hi screen update.
  useEffect(() => {
    const p = projects[active];
    if (!p) return;
    let alive = true;
    const paint = (img: HTMLImageElement | null) => {
      drawScreen(gfx.screen.cv, p, active, projects.length, img);
      gfx.screen.tex.needsUpdate = true;
    };
    paint(getCachedImage(p.image));
    drawCards(gfx.cards.map((c) => c.cv), p, active, projects.length);
    gfx.cards.forEach((c) => (c.tex.needsUpdate = true));
    swap.current = { t: 0, flick: 1 };
    if (p.image && !getCachedImage(p.image)) {
      loadProjectImage(p.image).then((img) => {
        if (alive && img) paint(img);
      });
    }
    return () => {
      alive = false;
    };
  }, [active, projects, gfx]);

  useEffect(() => {
    if (reduced) return;
    const onMove = (e: PointerEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [reduced]);

  const tmp = useMemo(
    () => ({
      hinge: new THREE.Vector3(0, BASEH, -1.05),
      up: new THREE.Vector3(0, -Math.sin(A_OPEN), Math.cos(A_OPEN)),
      nrm: new THREE.Vector3(0, -Math.cos(A_OPEN), -Math.sin(A_OPEN)),
      c0: new THREE.Vector3(),
    }),
    [],
  );
  useMemo(() => tmp.c0.copy(tmp.hinge).addScaledVector(tmp.up, LID / 2), [tmp]);

  // laptop screen ke left/right arrow buttons ki jagah (laptop ke saath hilti hain)
  const arrowPos = useMemo(() => {
    const mk = (side: number) =>
      tmp.c0
        .clone()
        .addScaledVector(new THREE.Vector3(1, 0, 0), side * 1.95)
        .addScaledVector(tmp.up, 0.1)
        .addScaledVector(tmp.nrm, 0.25)
        .toArray() as [number, number, number];
    return { left: mk(-1), right: mk(1) };
  }, [tmp]);

  const accent = accentOf(active);

  useFrame((state, dt) => {
    const lt = state.clock.elapsedTime;

    // scroll-chapter ke andar: laptop aa jata hai, lekin lid / screen tab chalu hote hain jab scene poori screen par khul jaye
    if (host.current === undefined) host.current = state.gl.domElement.closest('.chapter') as HTMLElement | null;
    let t = lt;
    if (reduced) t = 99;
    else if (host.current) {
      if (startAt.current < 0 && parseFloat(host.current.style.getPropertyValue('--e') || '0') >= 0.9) {
        startAt.current = lt;
        startBase.current = Math.min(lt, OPEN_AT);
      }
      t = startAt.current >= 0 ? startBase.current + (lt - startAt.current) : Math.min(lt, OPEN_AT);
    }

    while (stageRef.current < 4 && t > STAGE_AT[stageRef.current + 1]) {
      stageRef.current += 1;
      onStage(stageRef.current);
    }

    const fly = easeOut(clamp(t / FLY));
    const open = easeBack(clamp((t - 2) / 1.5));
    const scr = clamp((t - 3.1) / 0.8);
    const settle = easeInOut(clamp((t - 1.9) / 2.2));

    const s = swap.current;
    s.t = Math.min(1, s.t + dt / 0.9);
    s.flick = Math.max(0, s.flick - dt * 3);
    const sw = easeOut(s.t);

    const g = root.current;
    if (g) {
      const ry = (1 - fly) * -5.2 + mouse.current.x * 0.35;
      g.rotation.y = fly < 1 ? ry : THREE.MathUtils.damp(g.rotation.y, ry, 4, dt);
      g.rotation.x = THREE.MathUtils.damp(g.rotation.x, mouse.current.y * 0.08, 4, dt);
      g.position.y = (1 - fly) * -3.4 + Math.sin(lt * 1.3) * 0.04 * fly;
      g.position.z = (1 - fly) * 2.5;
      g.scale.setScalar(0.55 + 0.45 * fly);
    }
    if (lid.current) lid.current.rotation.x = A_OPEN * clamp(open, 0, 1.08);

    // camera: upar se dekhta hua band laptop -> seedha screen par
    const cam = state.camera as THREE.PerspectiveCamera;
    if (cam.fov !== FOV) {
      cam.fov = FOV;
      cam.updateProjectionMatrix();
    }
    // camera ki doori viewport se tay hoti hai: badi screen par laptop bada, chhoti/patli par poora fit
    const aspect = state.size.width / Math.max(1, state.size.height);
    const visH = Math.max(compact ? 4.4 : 3.9, (compact ? 5.6 : 7.4) / aspect);
    const dist = (visH / 2 / Math.tan((FOV * Math.PI) / 360)) * (1.08 - 0.08 * settle);
    const camY = 3.4 - 1.7 * settle;
    cam.position.set(0, camY, Math.sqrt(Math.max(1, dist * dist - camY * camY)));
    cam.lookAt(0, 0, 0);

    // screen on + project badalne par halka flicker
    gfx.screenMat.color.setScalar(scr * (1 - 0.8 * s.flick * Math.abs(Math.sin(lt * 40))));
    if (keyLight.current) keyLight.current.intensity = scr * 22;

    // floating cards
    layerRefs.current.forEach((m, i) => {
      if (!m) return;
      const [, , sx, sy, nz] = LAYERS[i];
      const k = easeBack(clamp((t - 3.9 - i * 0.28) / 1.1)) * sw;
      const bob = Math.sin(lt * 1.4 + i * 2) * 0.06;
      m.position.copy(tmp.c0);
      m.position.x += sx * (0.6 + 0.4 * k);
      m.position.addScaledVector(tmp.up, sy + bob);
      m.position.addScaledVector(tmp.nrm, nz * k + 0.02);
      m.scale.setScalar(Math.max(0.001, k));
      m.visible = k > 0.01;
      gfx.cardMats[i].opacity = clamp(k * 1.4);
    });

    ringRefs.current.forEach((r, i) => {
      if (!r) return;
      r.rotation.z = lt * (0.3 + i * 0.15) * (i % 2 ? -1 : 1);
      (r.material as THREE.MeshBasicMaterial).opacity = 0.7 * fly;
    });
    if (glowRef.current) (glowRef.current.material as THREE.MeshBasicMaterial).opacity = fly;
  });

  const offset: [number, number, number] = compact ? [0, -0.4, 0] : [0, -1.1, 0];

  return (
    <>
      <hemisphereLight args={['#9a8cff', '#1a1030', 1.2]} />
      <directionalLight position={[3, 6, 5]} intensity={1.8} />
      <pointLight position={[-4, 2, -2]} color="#2dd4bf" intensity={40} distance={14} decay={2} />
      <pointLight ref={keyLight} position={[0, 1.6, 2.4]} color={accent} intensity={0} distance={9} decay={2} />

      <group position={offset}>
        {/* pedestal */}
        <mesh ref={glowRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.32, 0]}>
          <planeGeometry args={[7, 7]} />
          <meshBasicMaterial map={gfx.glow} transparent blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
        {[2.6, 2.1, 1.6].map((r, i) => (
          <mesh
            key={r}
            ref={(m) => {
              ringRefs.current[i] = m;
            }}
            rotation={[Math.PI / 2, 0, 0]}
            position={[0, -0.3 - i * 0.07, 0]}
          >
            <torusGeometry args={[r, 0.012, 8, 120]} />
            <meshBasicMaterial color={i === 1 ? '#8b6cff' : '#2dd4bf'} transparent opacity={0} />
          </mesh>
        ))}

        <group ref={root}>
          {/* base */}
          <mesh material={gfx.alu} position={[0, BASEH / 2, 0]}>
            <boxGeometry args={[3.2, BASEH, 2.1]} />
          </mesh>
          <mesh material={gfx.dark} rotation={[-Math.PI / 2, 0, 0]} position={[0, BASEH + 0.001, -0.35]}>
            <planeGeometry args={[2.9, 1.0]} />
          </mesh>
          <primitive object={gfx.keys} />
          <mesh material={gfx.padMat} rotation={[-Math.PI / 2, 0, 0]} position={[0, BASEH + 0.002, 0.62]}>
            <planeGeometry args={[1.0, 0.62]} />
          </mesh>

          {/* lid: hinge peeche, band hone par base ke upar leta hai */}
          <group ref={lid} position={[0, BASEH, -1.05]}>
            <mesh position={[0, 0.035, LID / 2]} material={[gfx.alu, gfx.alu, gfx.alu, gfx.dark, gfx.alu, gfx.alu]}>
              <boxGeometry args={[3.2, 0.07, LID]} />
            </mesh>
            <mesh material={gfx.screenMat} rotation={[Math.PI / 2, 0, 0]} position={[0, -0.002, LID / 2]}>
              <planeGeometry args={[2.98, 1.86]} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.072, LID / 2]}>
              <planeGeometry args={[0.8, 0.8]} />
              <meshBasicMaterial map={gfx.logo} transparent />
            </mesh>
          </group>


          {/* laptop ke left / right arrows: project badalne ke liye */}
          {ready && (
            <>
              <group position={arrowPos.left}>
                <Html center zIndexRange={[10, 0]}>
                  <ArrowBtn dir="prev" color={accent} onClick={onPrev} />
                </Html>
              </group>
              <group position={arrowPos.right}>
                <Html center zIndexRange={[10, 0]}>
                  <ArrowBtn dir="next" color={accent} onClick={onNext} />
                </Html>
              </group>
            </>
          )}

          {/* screen se bahar nikalte 3D cards */}
          {LAYERS.map(([w, h], i) => (
            <mesh
              key={i}
              ref={(m) => {
                layerRefs.current[i] = m;
              }}
              rotation={[Math.PI / 2 + A_OPEN, 0, 0]}
              material={gfx.cardMats[i]}
              visible={false}
            >
              <planeGeometry args={[w, h]} />
            </mesh>
          ))}
        </group>
      </group>

      <Sparkles count={40} scale={[9, 5, 4]} size={2} speed={0.15} opacity={0.6} color="#5ee6d0" />
    </>
  );
});