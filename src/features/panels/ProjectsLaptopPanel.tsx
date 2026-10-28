import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { Canvas } from '@react-three/fiber';
import { ExternalLink, Github } from 'lucide-react';
import { ErrorBoundary } from '../../components/ui/ErrorBoundary';
import { projects } from '../../data/projects';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { LaptopScene } from './projects-laptop/LaptopScene';
import { accentOf } from './projects-laptop/laptopTextures';

const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
const pad = (n: number) => String(n).padStart(2, '0');
const TEAL = '#2dd4bf';
const VIOLET = '#8b6cff';

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
  /** REPLAY / CLOSE ka top offset (SkillsPanel jaisa). */
  controlsTop?: number;
}

/** stage: 0 booting, 1 unlocking, 2 screen online, 3 loading project, 4 ready */
export function ProjectsLaptopPanel({ onClose, controlsTop = 190 }: Props) {
  const reduced = useReducedMotion();
  const compact = useCompact();
  const [stage, setStage] = useState(reduced ? 4 : 0);
  const [active, setActive] = useState(0);
  const [run, setRun] = useState(0);
  const timer = useRef<number | undefined>(undefined);

  const onStage = useCallback((n: number) => setStage((s) => (n > s ? n : s)), []);

  const replay = () => {
    window.clearTimeout(timer.current);
    setStage(reduced ? 4 : 0);
    setActive(0);
    setRun((r) => r + 1);
  };

  const n = projects.length;
  const pick = (i: number) => {
    if (stage < 4 || i === active) return;
    setActive(i);
    setStage(3);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setStage(4), 1000);
  };

  const goRef = useRef<(d: number) => void>(() => {});
  goRef.current = (d: number) => pick((active + d + n) % n);
  const onPrev = useCallback(() => goRef.current(-1), []);
  const onNext = useCallback(() => goRef.current(1), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') goRef.current(-1);
      else if (e.key === 'ArrowRight') goRef.current(1);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.clearTimeout(timer.current);
    };
  }, [onClose]);

  const project = projects[active];
  const accent = accentOf(active);
  const top = compact ? Math.min(controlsTop, 72) : controlsTop;
  const showList = stage >= 3;
  const live = project.live ?? project.href;
  const github = project.github;

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

  const linkBtn: CSSProperties = {
    pointerEvents: 'auto',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 16px',
    borderRadius: 999,
    border: '1px solid rgba(255,255,255,0.22)',
    background: 'rgba(10,12,24,0.6)',
    backdropFilter: 'blur(6px)',
    color: '#fff',
    fontSize: 11,
    letterSpacing: '0.18em',
    textDecoration: 'none',
    fontFamily: MONO,
  };

  const status =
    stage === 0
      ? { text: '> BOOTING PROJECT DECK', color: TEAL }
      : stage === 1
        ? { text: '> UNLOCKING LAPTOP', color: TEAL }
        : stage === 2
          ? { text: '> SCREEN ONLINE', color: TEAL }
          : stage === 3
            ? { text: `> LOADING ${project.title.toUpperCase()}`, color: accent }
            : { text: '> PROJECT DECK READY', color: VIOLET };

  return (
    <section
      aria-label="Projects"
      style={{ position: 'fixed', inset: 0, zIndex: 40, pointerEvents: 'none', overflow: 'hidden' }}
    >
      <style>{`
        @keyframes pjFade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes pjIn { from { opacity: 0; transform: translateX(24px) } to { opacity: 1; transform: none } }
        @keyframes pjBlink { 50% { opacity: 0 } }
        .pj-btn:hover { border-color: #2dd4bf !important; }
        .pj-item:hover { color: #fff !important; }
        .pj-link:hover { filter: brightness(1.3); }
        @media (prefers-reduced-motion: reduce) { .pj-anim { animation: none !important; } }
      `}</style>

      <div
        className="pj-anim"
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse at 50% 50%, rgba(5,6,13,0.62) 0%, rgba(5,6,13,0.3) 65%, rgba(5,6,13,0.06) 100%)',
          animation: 'pjFade 1s ease-out both',
        }}
      />

      <ErrorBoundary fallback={null} onError={() => setStage(4)}>
        <Canvas
          key={run}
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
          camera={{ position: [0, 3.4, 9], fov: 40 }}
          dpr={[1, 1.5]}
          gl={{ antialias: true, alpha: true }}
          onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
        >
          <LaptopScene
            projects={projects}
            active={active}
            reduced={reduced}
            onStage={onStage}
            ready={stage >= 4}
            onPrev={onPrev}
            onNext={onNext}
          />
        </Canvas>
      </ErrorBoundary>

      <div style={{ position: 'absolute', top, right: compact ? 16 : 36, display: 'flex', gap: 10 }}>
        <button className="pj-btn" style={btn} onClick={replay}>
          REPLAY
        </button>
        <button className="pj-btn" style={btn} onClick={onClose}>
          CLOSE ✕
        </button>
      </div>

      {/* project list: laptop khulne ke baad aati hai, click se project badalta hai */}
      <div
        style={
          compact
            ? { position: 'absolute', left: 16, right: 16, bottom: 92, fontFamily: MONO, color: '#fff' }
            : { position: 'absolute', top: top + 60, right: 36, width: 290, fontFamily: MONO, color: '#fff' }
        }
      >
        <div style={{ fontSize: 11, letterSpacing: '0.3em', color: accent, marginBottom: compact ? 8 : 14 }}>
          03 / PROJECTS &nbsp;·&nbsp; {pad(active + 1)} / {pad(projects.length)}
        </div>

        {showList && (
          <ol
            style={{
              listStyle: 'none',
              margin: 0,
              padding: 0,
              display: compact ? 'flex' : 'block',
              flexWrap: 'wrap',
              gap: compact ? '6px 14px' : 0,
            }}
          >
            {projects.map((p, i) => (
              <li
                key={p.id}
                className="pj-anim"
                style={{
                  borderBottom: compact ? 'none' : '1px solid rgba(255,255,255,0.08)',
                  animation: `pjIn .5s ease-out ${reduced ? 0 : i * 0.12}s both`,
                }}
              >
                <button
                  type="button"
                  className="pj-item"
                  onClick={() => pick(i)}
                  aria-current={i === active}
                  style={{
                    pointerEvents: 'auto',
                    background: 'none',
                    border: 'none',
                    textAlign: 'left',
                    boxSizing: 'border-box',
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: compact ? '2px 0' : '8px 0',
                    cursor: stage < 4 ? 'default' : 'pointer',
                    color: i === active ? '#fff' : 'rgba(255,255,255,0.55)',
                    textShadow: '0 1px 8px rgba(0,0,0,0.9)',
                    fontFamily: MONO,
                  }}
                >
                  {!compact && <span style={{ fontSize: 11, opacity: 0.55, width: 22 }}>{pad(i + 1)}</span>}
                  <span
                    aria-hidden="true"
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: accentOf(i),
                      boxShadow: `0 0 10px ${accentOf(i)}`,
                    }}
                  />
                  <span style={{ fontSize: compact ? 11 : 12, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                    {p.title}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        )}

        {stage >= 4 && (live || github) && (
          <div className="pj-anim" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: compact ? 10 : 18, animation: 'pjFade .5s ease-out both' }}>
            {live && (
              <a href={live} target="_blank" rel="noreferrer" className="pj-link" style={{ ...linkBtn, borderColor: accent, background: `${accent}22` }}>
                <ExternalLink size={14} /> LIVE DEMO
              </a>
            )}
            {github && (
              <a href={github} target="_blank" rel="noreferrer" className="pj-link" style={linkBtn}>
                <Github size={14} /> GITHUB
              </a>
            )}
          </div>
        )}
      </div>

      {/* status + progress */}
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
          <span style={{ color: status.color }}>
            <Typed key={status.text} text={status.text} speed={30} instant={reduced} />
          </span>
          <span aria-hidden="true" style={{ animation: 'pjBlink 1s steps(1) infinite', marginLeft: 4 }}>
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
              width: `${(Math.min(stage, 4) / 4) * 100}%`,
              background: `linear-gradient(90deg, ${TEAL}, ${VIOLET})`,
              transition: 'width .5s ease-out',
            }}
          />
        </div>
      </div>
    </section>
  );
}