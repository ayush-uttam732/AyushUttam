import { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { makeCerebellum, makeCerebrum, makeCerebrumLowRes, makeStem } from './BrainGeometry';
import { cerebrumPoint } from './BrainShape';
import { BRAIN_IN, FIRST, FLY, GAP, GROW, SINK, SKILLS, type Skill } from './SkillData';

const N = SKILLS.length;
const N_TR = 16; // trail points per icon

const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);
const Y_AXIS = new THREE.Vector3(0, 1, 0);
const VIOLET = new THREE.Color('#8b6cff');
const TEAL = new THREE.Color('#2dd4bf');

/* ---------- Shared state (React re-render ke bina) ---------- */
interface Shared {
  absorbed: number;
  pulse: number;
  scale: number;
  rotY: number;
  spin: number;
  doneAt: number;
  birth: number[]; // har skill kab absorb hui (clock seconds), -1 = abhi nahi
  mx: number;
  my: number;
  startAt: number; // scene poori khulne par set hota hai (-1 = abhi nahi)
}
type SharedRef = { current: Shared };

/* ---------- Layout: har skill ka start, brain ke andar slot, aur surface point ---------- */
const LAYOUT = SKILLS.map((_, i) => {
  const a = i * 2.4 + 0.5;
  const start = new THREE.Vector3(Math.cos(a) * 4.6, Math.sin(a) * 2.6, 2.4);
  const y = 1 - (2 * (i + 0.5)) / N;
  const r = Math.sqrt(1 - y * y);
  const th = i * 2.39996;
  // slot brain ke andar (upar-beech me), taaki icon andar saaf dikhe
  const slot = new THREE.Vector3(Math.cos(th) * r * 0.55, 0.14 + y * 0.34, Math.sin(th) * r * 0.82);
  // surface point: wahi direction asli brain surface par
  const sp = cerebrumPoint(slot.x / 0.92, (slot.y - 0.12) / 0.7, slot.z / 1.22);
  const surfLocal = new THREE.Vector3(sp[0], sp[1], sp[2]);
  return { start, slot, surfLocal };
});

// Neural connections: har naya node apne 2 sabse paas ke purane nodes se judta hai.
const PAIRS: { a: number; b: number }[] = [];
for (let i = 1; i < N; i++) {
  LAYOUT.slice(0, i)
    .map((l, j) => ({ j, d: l.slot.distanceTo(LAYOUT[i].slot) }))
    .sort((p, q) => p.d - q.d)
    .slice(0, 2)
    .forEach((e) => PAIRS.push({ a: i, b: e.j }));
}

function bez(out: THREE.Vector3, a: THREE.Vector3, c: THREE.Vector3, b: THREE.Vector3, u: number) {
  const k = 1 - u;
  return out.set(0, 0, 0).addScaledVector(a, k * k).addScaledVector(c, 2 * k * u).addScaledVector(b, u * u);
}

function makeGlowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(0.25, 'rgba(255,255,255,0.4)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

/* ---------- Shaders ---------- */
const BRAIN_VERT = /* glsl */ `
  attribute float aDepth;
  varying vec3 vN; varying vec3 vV; varying vec3 vP; varying float vD;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vN = normalize(normalMatrix * normal);
    vV = normalize(-mv.xyz);
    vP = position;
    vD = aDepth;
    gl_Position = projectionMatrix * mv;
  }`;

const BRAIN_FRAG = /* glsl */ `
  uniform vec3 uColor; uniform float uPulse; uniform float uTime;
  uniform vec3 uRipPos[${N}]; uniform vec3 uRipCol[${N}]; uniform float uRipAge[${N}];
  varying vec3 vN; varying vec3 vV; varying vec3 vP; varying float vD;
  void main() {
    float f = pow(max(0.0, 1.0 - abs(dot(vN, vV))), 2.2);
    float lam = max(0.0, dot(normalize(vN), normalize(vec3(-0.4, 0.7, 0.6))));
    float fold = mix(0.3, 1.0, vD); // sulci (grooves) gehre, gyri ubhre
    float bb = (fract(vP.y * 0.55 + uTime * 0.07) - 0.5) * 9.0;
    float band = exp(-bb * bb);
    vec3 c = uColor * ((f * 1.4 + 0.1 + lam * 0.3) * fold + uPulse * 0.35 + band * 0.08);
    float a = (f * 0.9 + 0.1 + lam * 0.15) * mix(0.55, 1.0, vD) + uPulse * 0.1;
    for (int i = 0; i < ${N}; i++) {
      float age = uRipAge[i];
      if (age >= 0.0) {
        float e = (distance(vP, uRipPos[i]) - age * 1.7) * 6.0;
        float ring = exp(-e * e) * exp(-age * 1.6);
        c += uRipCol[i] * ring * 1.5;
        a += ring * 0.6;
      }
    }
    gl_FragColor = vec4(c, a);
  }`;

const DOT_VERT = /* glsl */ `
  uniform float uTime; uniform float uScale; uniform float uPulse;
  varying float vTw;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    float h = fract(sin(dot(position, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
    vTw = 0.5 + 0.5 * sin(uTime * 1.5 + h * 6.2831);
    gl_PointSize = (0.05 + 0.06 * vTw + uPulse * 0.05) * uScale / (-mv.z);
    gl_Position = projectionMatrix * mv;
  }`;
const DOT_FRAG = /* glsl */ `
  uniform vec3 uColorA; uniform vec3 uColorB; varying float vTw;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    vec3 c = mix(uColorA, uColorB, vTw) * (0.4 + 0.8 * vTw);
    gl_FragColor = vec4(c, a * a * (0.35 + 0.5 * vTw));
  }`;

const TRAIL_VERT = /* glsl */ `
  attribute float aA; attribute float aS; uniform float uScale; varying float vA;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vA = aA;
    gl_PointSize = aS * uScale / (-mv.z);
    gl_Position = projectionMatrix * mv;
  }`;
const TRAIL_FRAG = /* glsl */ `
  uniform vec3 uColor; uniform float uOpacity; varying float vA;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(uColor, a * a * vA * uOpacity);
  }`;

/* ---------- Ek skill icon: door se aata hai -> brain me ghusta hai ---------- */
const SkillIcon = memo(function SkillIcon({
  index,
  skill,
  shared,
  onAbsorb,
}: {
  index: number;
  skill: Skill;
  shared: SharedRef;
  onAbsorb: (i: number, time: number) => void;
}) {
  const group = useRef<THREE.Group>(null);
  const box = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLDivElement>(null);
  const done = useRef(false);

  const tmp = useMemo(
    () => ({
      pos: new THREE.Vector3(),
      ctrl: new THREE.Vector3(),
      surf: new THREE.Vector3(),
      slotW: new THREE.Vector3(),
      p: new THREE.Vector3(),
    }),
    [],
  );

  const trail = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N_TR * 3), 3));
    const alpha = new Float32Array(N_TR);
    const size = new Float32Array(N_TR);
    for (let k = 0; k < N_TR; k++) {
      const f = 1 - k / N_TR;
      alpha[k] = f * f;
      size[k] = 0.06 + 0.26 * f;
    }
    geo.setAttribute('aA', new THREE.BufferAttribute(alpha, 1));
    geo.setAttribute('aS', new THREE.BufferAttribute(size, 1));
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uColor: { value: new THREE.Color(skill.color) }, uOpacity: { value: 0 }, uScale: { value: 300 } },
      vertexShader: TRAIL_VERT,
      fragmentShader: TRAIL_FRAG,
    });
    return { geo, mat };
  }, [skill.color]);

  useEffect(
    () => () => {
      trail.geo.dispose();
      trail.mat.dispose();
    },
    [trail],
  );

  useFrame((state) => {
    const g = group.current;
    if (!g) return;
    const s = shared.current;
    const bx = box.current;
    // icons tab tak ruke rehte hain jab tak scroll se scene poori screen par na khul jaye
    const t = s.startAt < 0 ? -1 : state.clock.elapsedTime - s.startAt - (FIRST - 0.8 + index * GAP);
    if (t < 0) {
      if (bx) bx.style.opacity = '0';
      trail.mat.uniforms.uOpacity.value = 0;
      return;
    }

    const { start, slot, surfLocal } = LAYOUT[index];
    const { pos, ctrl, surf, slotW, p } = tmp;

    surf.copy(surfLocal).applyAxisAngle(Y_AXIS, s.rotY).multiplyScalar(s.scale);
    slotW.copy(slot).applyAxisAngle(Y_AXIS, s.rotY).multiplyScalar(s.scale);

    let opacity = 1;
    let size = 1;
    let labelOpacity = 1;

    if (t < FLY) {
      const u = easeInOut(t / FLY);
      ctrl.copy(start).add(surf).multiplyScalar(0.5);
      ctrl.y += 1.2;
      ctrl.x += index % 2 ? 0.9 : -0.9;
      bez(pos, start, ctrl, surf, u);
      opacity = Math.min(1, t / 0.3);
      size = 1 + (1 - u) * 0.25;
      labelOpacity = Math.min(1, t / 0.4) * (1 - Math.max(0, (u - 0.7) / 0.3));

      // comet trail: pichhle samay ki positions
      const attr = trail.geo.attributes.position as THREE.BufferAttribute;
      for (let k = 0; k < N_TR; k++) {
        const uk = easeInOut(Math.min(Math.max(0, t - k * 0.028) / FLY, 1));
        bez(p, start, ctrl, surf, uk);
        attr.setXYZ(k, p.x, p.y, p.z);
      }
      attr.needsUpdate = true;
      trail.mat.uniforms.uOpacity.value = Math.min(1, t / 0.2);
    } else {
      if (!done.current) {
        done.current = true;
        onAbsorb(index, state.clock.elapsedTime);
      }
      const w = easeInOut(Math.min((t - FLY) / SINK, 1));
      pos.copy(surf).lerp(slotW, w);
      pos.y += Math.sin(state.clock.elapsedTime * 1.2 + index) * 0.03 * w;
      // andar rehte hain: chhote ho jaate hain, aur peeche wale icons thode dhundhle/chhote (depth ka ehsaas)
      const facing = Math.min(1, Math.max(-1, slotW.z / Math.max(0.5, s.scale * 0.8))); // +1 camera ki taraf
      const k = 0.5 + 0.5 * facing;
      size = (1 - w * (0.5 - 0.12 * k)) * (1 - w * 0.2 * (1 - k));
      opacity = 1 - w * 0.55 * (1 - k);
      labelOpacity = 0;
      trail.mat.uniforms.uOpacity.value = Math.max(0, 1 - (t - FLY) / 0.2);
    }

    g.position.copy(pos);
    if (bx) {
      bx.style.opacity = String(opacity);
      bx.style.transform = `scale(${size})`;
    }
    if (label.current) label.current.style.opacity = String(labelOpacity);
  });

  const { Icon, color, name } = skill;
  return (
    <>
      <points geometry={trail.geo} material={trail.mat} frustumCulled={false} />
      <group ref={group}>
        <Html center distanceFactor={5} style={{ pointerEvents: 'none' }}>
          <div style={{ position: 'relative' }}>
            <div
              ref={box}
              style={{
                width: 64,
                height: 64,
                display: 'grid',
                placeItems: 'center',
                borderRadius: 18,
                color,
                opacity: 0,
                background: 'rgba(10,12,24,0.65)',
                border: `1px solid ${color}55`,
                boxShadow: `0 0 26px ${color}77`,
                backdropFilter: 'blur(4px)',
              }}
            >
              <Icon size={32} />
            </div>
            <div
              ref={label}
              style={{
                position: 'absolute',
                top: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                marginTop: 8,
                opacity: 0,
                whiteSpace: 'nowrap',
                fontFamily: 'ui-monospace, monospace',
                fontSize: 11,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: '#fff',
                textShadow: '0 1px 8px rgba(0,0,0,0.9)',
              }}
            >
              {name}
            </div>
          </div>
        </Html>
      </group>
    </>
  );
});

/* ---------- Brain + neural network + saare icons ---------- */
export const BrainScene = memo(function BrainScene({
  onAbsorb,
  reduced,
}: {
  onAbsorb: (i: number) => void;
  reduced: boolean;
}) {
  const size = useThree((s) => s.size);
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const compact = size.width < 820;
  const aspect = size.width / size.height;
  const fit = Math.min(1, aspect / 1.1);

  const geoMain = useMemo(makeCerebrum, []);
  const geoCb = useMemo(makeCerebellum, []);
  const geoStem = useMemo(makeStem, []);
  const geoLow = useMemo(makeCerebrumLowRes, []);

  const gfx = useMemo(() => {
    const glow = makeGlowTexture();

    const brainMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uColor: { value: VIOLET.clone() },
        uPulse: { value: 0 },
        uTime: { value: 0 },
        uRipPos: { value: LAYOUT.map((l) => l.surfLocal.clone()) },
        uRipCol: { value: SKILLS.map((s) => new THREE.Color(s.color)) },
        uRipAge: { value: SKILLS.map(() => -1) },
      },
      vertexShader: BRAIN_VERT,
      fragmentShader: BRAIN_FRAG,
    });

    const wireMat = new THREE.MeshBasicMaterial({
      color: '#7c6cff',
      wireframe: true,
      transparent: true,
      opacity: 0.1,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const dotMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uScale: { value: 300 },
        uPulse: { value: 0 },
        uColorA: { value: new THREE.Color('#2dd4bf') },
        uColorB: { value: new THREE.Color('#a78bfa') },
      },
      vertexShader: DOT_VERT,
      fragmentShader: DOT_FRAG,
    });

    // synaptic lines
    const lp = new Float32Array(PAIRS.length * 6);
    const lc = new Float32Array(PAIRS.length * 6);
    const ca = new THREE.Color();
    const cb = new THREE.Color();
    PAIRS.forEach((pr, k) => {
      const A = LAYOUT[pr.a].slot;
      const B = LAYOUT[pr.b].slot;
      ca.set(SKILLS[pr.a].color);
      cb.set(SKILLS[pr.b].color);
      lp.set([A.x, A.y, A.z, B.x, B.y, B.z], k * 6);
      lc.set([ca.r, ca.g, ca.b, cb.r, cb.g, cb.b], k * 6);
    });
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.BufferAttribute(lp, 3));
    lineGeo.setAttribute('color', new THREE.BufferAttribute(lc, 3));
    lineGeo.setDrawRange(0, 0);
    const lineMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    // glowing nodes (skill ke rang me) + core
    const nodeMats = SKILLS.map(
      (s) =>
        new THREE.SpriteMaterial({
          map: glow,
          color: s.color,
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
    );
    const nodes = LAYOUT.map((l, i) => {
      const sp = new THREE.Sprite(nodeMats[i]);
      sp.position.copy(l.slot);
      sp.scale.setScalar(0.0001);
      return sp;
    });
    const coreMat = new THREE.SpriteMaterial({
      map: glow,
      color: '#8b6cff',
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const core = new THREE.Sprite(coreMat);
    core.scale.setScalar(0.0001);

    return { glow, brainMat, wireMat, dotMat, lineGeo, lineMat, nodeMats, nodes, coreMat, core };
  }, []);

  useEffect(
    () => () => {
      geoMain.dispose();
      geoCb.dispose();
      geoStem.dispose();
      geoLow.dispose();
      gfx.glow.dispose();
      gfx.brainMat.dispose();
      gfx.wireMat.dispose();
      gfx.dotMat.dispose();
      gfx.lineGeo.dispose();
      gfx.lineMat.dispose();
      gfx.nodeMats.forEach((m) => m.dispose());
      gfx.coreMat.dispose();
    },
    [geoMain, geoCb, geoStem, geoLow, gfx],
  );

  const brain = useRef<THREE.Group>(null);
  const host = useRef<HTMLElement | null | undefined>(undefined);

  // canvas transparent: koi solid background nahi, peeche website ka 3D world dikhega
  useEffect(() => {
    scene.background = null;
    gl.setClearColor(0x000000, 0);
    gl.setClearAlpha(0);
  }, [gl, scene]);

  const shared = useRef<Shared>({
    absorbed: reduced ? N : 0,
    pulse: 0,
    scale: reduced ? 1 + GROW * N : 0,
    rotY: 0.5,
    spin: 0,
    doneAt: -1,
    birth: SKILLS.map(() => -1),
    mx: 0,
    my: 0,
    startAt: reduced ? 0 : -1,
  });

  useEffect(() => {
    if (reduced) return;
    const onMove = (e: PointerEvent) => {
      shared.current.mx = (e.clientX / window.innerWidth) * 2 - 1;
      shared.current.my = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [reduced]);

  const handleAbsorb = useCallback(
    (i: number, time: number) => {
      const s = shared.current;
      s.absorbed += 1;
      s.pulse = 1;
      s.birth[i] = time;
      if (s.absorbed >= N) {
        s.doneAt = time;
        s.pulse = 1.6;
        s.spin = 1;
      }
      onAbsorb(i);
    },
    [onAbsorb],
  );

  useFrame((state, dt) => {
    const s = shared.current;
    const t = state.clock.elapsedTime;
    const { brainMat, dotMat, lineGeo, nodes, core } = gfx;

    // scroll-chapter ke andar ho to icons tab shuru ho jab scene poori screen par khul chuka ho
    if (s.startAt < 0) {
      if (host.current === undefined) host.current = state.gl.domElement.closest('.chapter') as HTMLElement | null;
      const open = host.current ? parseFloat(host.current.style.getPropertyValue('--e') || '0') >= 0.9 : true;
      if (open) s.startAt = t;
    }

    // camera: dheere se andar aata hai + halka mouse parallax
    const cam = state.camera;
    const dolly = reduced ? 5.6 : 9.2 - 3.6 * easeOut(Math.min(t / 2.2, 1));
    cam.position.x = THREE.MathUtils.damp(cam.position.x, s.mx * 0.3, 3, dt);
    cam.position.y = THREE.MathUtils.damp(cam.position.y, s.my * 0.18, 3, dt);
    cam.position.z = dolly;
    cam.lookAt(0, 0, 0);

    const intro = reduced ? 1 : easeOut(Math.min(t / BRAIN_IN, 1));
    const target = (1 + GROW * s.absorbed) * intro;
    s.scale = THREE.MathUtils.damp(s.scale, target, 4, dt);
    s.pulse = Math.max(0, s.pulse - dt * 2.2);
    s.spin = Math.max(0, s.spin - dt * 0.9);
    s.rotY += dt * (reduced ? 0 : 0.18 + s.spin * 2.2);

    const g = brain.current;
    if (g) {
      g.scale.setScalar(Math.max(s.scale, 0.0001) * (1 + s.pulse * 0.04));
      g.rotation.y = s.rotY;
      g.position.y = reduced ? 0 : Math.sin(t * 0.8) * 0.04;
    }

    // uniforms
    const doneMix = reduced ? 1 : s.doneAt >= 0 ? Math.min((t - s.doneAt) / 1.2, 1) : 0;
    const u = brainMat.uniforms;
    u.uTime.value = t;
    u.uPulse.value = s.pulse;
    (u.uColor.value as THREE.Color).lerpColors(VIOLET, TEAL, doneMix * 0.5);
    const ages = u.uRipAge.value as number[];
    for (let i = 0; i < N; i++) {
      const b = s.birth[i];
      ages[i] = !reduced && b >= 0 && t - b < 3 ? t - b : -1;
    }
    const pxScale = state.size.height * state.gl.getPixelRatio() * 0.33;
    dotMat.uniforms.uTime.value = t;
    dotMat.uniforms.uPulse.value = s.pulse;
    dotMat.uniforms.uScale.value = pxScale;

    // skill nodes: absorb hote hi jagmagate hain
    for (let i = 0; i < N; i++) {
      const b = s.birth[i];
      const lit = reduced || b >= 0;
      const age = reduced ? 9 : b >= 0 ? t - b : 0;
      const k = lit ? easeOut(Math.min(age / 0.7, 1)) : 0;
      const flash = lit ? Math.max(0, 1 - age / 0.5) * 0.45 : 0;
      nodes[i].scale.setScalar(Math.max(0.0001, k * (0.3 + 0.05 * Math.sin(t * 2.2 + i * 1.7)) + flash));
    }
    // core glow
    core.scale.setScalar(Math.max(0.0001, intro * (0.9 + 0.09 * s.absorbed + s.pulse * 0.5)));

    // synapse lines: jitne nodes lit utni lines
    let c = 0;
    while (c < PAIRS.length && (reduced || s.birth[PAIRS[c].a] >= 0)) c++;
    lineGeo.setDrawRange(0, c * 2);
  });

  // Icons aur brain ek hi parent group me hain, isliye offset/scale dono par barabar lagta hai.
  const offset: [number, number, number] = compact ? [0, 0.25, 0] : [0, 0, 0];

  return (
    <group position={offset} scale={fit}>
      <group ref={brain}>
        <mesh geometry={geoMain} material={gfx.brainMat} />
        <mesh geometry={geoCb} material={gfx.brainMat} />
        <mesh geometry={geoStem} material={gfx.brainMat} />
        <mesh geometry={geoLow} material={gfx.wireMat} scale={1.01} />
        <points geometry={geoLow} material={gfx.dotMat} />
        <lineSegments geometry={gfx.lineGeo} material={gfx.lineMat} frustumCulled={false} />
        <primitive object={gfx.core} />
        {gfx.nodes.map((n, i) => (
          <primitive key={SKILLS[i].name} object={n} />
        ))}
        <Sparkles count={50} scale={[1.8, 1.3, 2.4]} size={3} speed={0.35} color="#a78bfa" />
      </group>
      <Sparkles count={36} scale={[8, 4.5, 3]} size={2} speed={0.15} opacity={0.6} color="#5ee6d0" />
      {!reduced &&
        SKILLS.map((skill, i) => (
          <SkillIcon key={skill.name} index={i} skill={skill} shared={shared} onAbsorb={handleAbsorb} />
        ))}
    </group>
  );
});