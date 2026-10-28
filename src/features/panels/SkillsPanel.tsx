import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import { Canvas } from '@react-three/fiber';
import { ErrorBoundary } from '../../components/ui/ErrorBoundary';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { BrainScene } from './skills-brain/BrainScene';
import { SKILLS } from './skills-brain/SkillData';

const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
const ALL = SKILLS.map((_, i) => i);
const pad = (n: number) => String(n).padStart(2, '0');

/** Text ko typewriter ki tarah likhta hai. */
function Typed({ text, speed = 34, instant = false }: { text: string; speed?: number; instant?: boolean }) {
  const [n, setN] = useState(instant ? text.length : 0);
  useEffect(() => {
    if (instant) {
      setN(text.length);
      return;
    }
    setN(0);
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setN(i);
      if (i >= text.length) window.clearInterval(id);
    }, speed);
    return () => window.clearInterval(id);
  }, [text, speed, instant]);
  return <>{text.slice(0, n)}</>;
}

function useCompact() {
  const [compact, setCompact] = useState(() => window.innerWidth < 820);
  useEffect(() => {
    const on = () => setCompact(window.innerWidth < 820);
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  return compact;
}

interface Props {
  onClose: () => void;
  /** Controls (REPLAY / CLOSE) ka top offset. Aapke homepage ke MENU button ke neeche ke liye 190, warna 72. */
  controlsTop?: number;
}

export function SkillsPanel({ onClose, controlsTop = 190 }: Props) {
  const reduced = useReducedMotion();
  const compact = useCompact();
  const [learned, setLearned] = useState<number[]>(reduced ? ALL : []);
  const [run, setRun] = useState(0);

  const onAbsorb = useCallback((i: number) => {
    setLearned((l) => (l.includes(i) ? l : [...l, i]));
  }, []);

  const replay = () => {
    setLearned(reduced ? ALL : []);
    setRun((r) => r + 1);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const done = learned.length >= SKILLS.length;
  const last = learned.length ? SKILLS[learned[learned.length - 1]] : null;
  const top = compact ? Math.min(controlsTop, 72) : controlsTop;

  const btn: CSSProperties = {
    pointerEvents: 'auto',
    padding: '9px 16px',
    borderRadius: 999,
    border: '1px solid rgba(255,255,255,0.18)',
    background: 'rgba(10,12,24,0.6)',
    backdropFilter: 'blur(6px)',
    color: '#fff',
    fontSize: 11,
    letterSpacing: '0.18em',
    cursor: 'pointer',
    fontFamily: MONO,
  };

  return (
    // Poora layer click-through hai, isliye neeche ka homepage UI waise hi kaam karta hai.
    <section
      aria-label="Technical skills"
      style={{ position: 'fixed', inset: 0, zIndex: 40, pointerEvents: 'none', overflow: 'hidden' }}
    >
      <style>{`
        @keyframes skFade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes skIn { from { opacity: 0; transform: translateX(24px) } to { opacity: 1; transform: none } }
        @keyframes skUp { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: none } }
        @keyframes skBlink { 50% { opacity: 0 } }
        .sk-btn:hover { border-color: #2dd4bf !important; }
        @media (prefers-reduced-motion: reduce) { .sk-anim { animation: none !important; } }
      `}</style>

      {/* halka dim, taaki brain background par saaf dikhe */}
      <div
        className="sk-anim"
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse at 58% 50%, rgba(5,6,13,0.6) 0%, rgba(5,6,13,0.28) 65%, rgba(5,6,13,0.05) 100%)',
          animation: 'skFade 1s ease-out both',
        }}
      />

      {/* transparent canvas: background ke upar brain */}
      <ErrorBoundary fallback={null} onError={() => setLearned(ALL)}>
        <Canvas
          key={run}
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
          camera={{ position: [0, 0, reduced ? 5.6 : 9.2], fov: 40 }}
          dpr={[1, 1.5]}
          gl={{ antialias: true, alpha: true }}
          onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
        >
          <BrainScene onAbsorb={onAbsorb} reduced={reduced} />
        </Canvas>
      </ErrorBoundary>

      {/* controls */}
      <div style={{ position: 'absolute', top, right: compact ? 16 : 36, display: 'flex', gap: 10 }}>
        <button className="sk-btn" style={btn} onClick={replay}>
          REPLAY
        </button>
        <button className="sk-btn" style={btn} onClick={onClose}>
          CLOSE ✕
        </button>
      </div>

      {/* numbered skill list: har skill absorb hote hi likhi jaati hai */}
      <div
        style={
          compact
            ? { position: 'absolute', left: 16, right: 16, bottom: 92, fontFamily: MONO, color: '#fff' }
            : { position: 'absolute', top: top + 60, right: 36, width: 260, fontFamily: MONO, color: '#fff' }
        }
      >
        <div style={{ fontSize: 11, letterSpacing: '0.3em', color: '#2dd4bf', marginBottom: compact ? 8 : 14 }}>
          04 / SKILLS &nbsp;·&nbsp; {pad(learned.length)} / {pad(SKILLS.length)}
        </div>

        <ol
          aria-live="polite"
          style={{
            listStyle: 'none',
            margin: 0,
            padding: 0,
            display: compact ? 'flex' : 'block',
            flexWrap: 'wrap',
            gap: compact ? '6px 14px' : 0,
          }}
        >
          {learned.map((idx, n) => {
            const s = SKILLS[idx];
            return (
              <li
                key={idx}
                className="sk-anim"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: compact ? '2px 0' : '7px 0',
                  borderBottom: compact ? 'none' : '1px solid rgba(255,255,255,0.08)',
                  animation: 'skIn .5s ease-out both',
                  textShadow: '0 1px 8px rgba(0,0,0,0.9)',
                }}
              >
                {!compact && <span style={{ fontSize: 11, opacity: 0.55, width: 22 }}>{pad(n + 1)}</span>}
                <span
                  aria-hidden="true"
                  style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, boxShadow: `0 0 10px ${s.color}` }}
                />
                <span style={{ fontSize: compact ? 11 : 13, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
                  <Typed text={s.name} speed={28} instant={reduced} />
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      {/* neeche: jo skill abhi seekhi, woh likhta hua dikhta hai */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: compact ? 28 : 64,
          textAlign: 'center',
          fontFamily: MONO,
          color: '#fff',
          textShadow: '0 1px 10px rgba(0,0,0,0.95)',
        }}
      >
        <div style={{ fontSize: compact ? 12 : 15, letterSpacing: '0.28em', minHeight: 22 }} role="status">
          {done ? (
            <span style={{ color: '#8b6cff' }}>
              <Typed text="> BRAIN FULLY LOADED" instant={reduced} />
            </span>
          ) : last ? (
            <>
              <span style={{ color: last.color }}>{'> '}</span>
              <Typed key={last.name} text={`${last.name.toUpperCase()} ADDED TO BRAIN`} speed={30} instant={reduced} />
            </>
          ) : (
            <span style={{ color: '#2dd4bf' }}>
              <Typed text="> BOOTING NEURAL CORE" speed={40} instant={reduced} />
            </span>
          )}
          <span aria-hidden="true" style={{ animation: 'skBlink 1s steps(1) infinite', marginLeft: 4 }}>
            ▍
          </span>
        </div>
        <div
          aria-hidden="true"
          style={{
            width: compact ? 180 : 260,
            height: 2,
            margin: '12px auto 0',
            background: 'rgba(255,255,255,0.12)',
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${(learned.length / SKILLS.length) * 100}%`,
              background: 'linear-gradient(90deg, #2dd4bf, #8b6cff)',
              transition: 'width .5s ease-out',
            }}
          />
        </div>
      </div>
    </section>
  );
}