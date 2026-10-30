import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { ArrowDown, ArrowLeft, ArrowRight, Check, RotateCcw, X } from "lucide-react";

import { about } from "../../../data/about";
import { Book3D } from "./Book3D";
import { buildBookTextures } from "./bookTextures.ts";
import type { BookTextures } from "./bookTextures.ts";
import "../../../styles/about-book.css";

/**
 * Put your photo at src/assets/me.jpg (jpg, jpeg, png or webp).
 * Without a photo the book shows your initials instead.
 */
const photoFiles = import.meta.glob("../../../assets/me.{jpg,jpeg,png,webp}", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;
const photoUrl = Object.values(photoFiles)[0] ?? null;

/** 0 = closed cover, 1..LAST_STEP = the spreads. */
const LAST_STEP = about.chapters.length - 1;

/** Wait before the first page turns by itself (ms). */
const FIRST_DELAY = 2200;
/** After any scrolling stops, the book waits this long, then turns the next page by itself (ms). */
const IDLE_MS = 3800;

/**
 * The scroll chapter is stretched so every page turn gets its own stretch of scrolling.
 * (The chapter's own CSS height is only 250vh, far too short for 4 page turns.)
 */
const CHAPTER_VH = 520;
/**
 * Where, inside the chapter's scroll progress (--cp, 0..1), the pages turn.
 * Before SCROLL_START the 3D window is still growing to full screen; after SCROLL_END the book stays open.
 */
const SCROLL_START = 0.24;
const SCROLL_END = 0.94;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const goalFromProgress = (cp: number) =>
  clamp((cp - SCROLL_START) / (SCROLL_END - SCROLL_START), 0, 1) * LAST_STEP;
const progressFromGoal = (goal: number) =>
  SCROLL_START + (goal / LAST_STEP) * (SCROLL_END - SCROLL_START);

function loadPhoto(url: string | null) {
  return new Promise<HTMLImageElement | null>((resolve) => {
    if (!url) return resolve(null);
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = url;
  });
}

function Typed({ text }: { text: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(0);
    const id = window.setInterval(() => {
      setCount((value) => {
        if (value >= text.length) {
          window.clearInterval(id);
          return value;
        }
        return value + 1;
      });
    }, 26);
    return () => window.clearInterval(id);
  }, [text]);

  return (
    <>
      {text.slice(0, count)}
      <span className="book-caret" />
    </>
  );
}

export function AboutBook({ onClose }: { onClose: () => void }) {
  const [textures, setTextures] = useState<BookTextures | null>(null);
  const [step, setStep] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const host = useRef<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);
  const [embedded, setEmbedded] = useState(false);

  /** Where the book is: 0 = closed ... LAST_STEP = last spread. Fractions = a page mid-turn. */
  const goal = useRef(0);
  /** The book will not turn a page by itself before this moment (performance.now()). */
  const holdUntil = useRef(0);
  /** Is the chapter on screen? Autoplay only runs while it is. */
  const visible = useRef(true);
  /** The visitor scrolled up (probably leaving): do not drag them back down with autoplay. */
  const blockAuto = useRef(false);
  const lastY = useRef(0);
  /** Scrolling that autoplay / the buttons cause themselves must not count as the visitor scrolling up. */
  const ignoreDirUntil = useRef(0);

  const setGoal = useCallback((next: number, hold: number) => {
    goal.current = clamp(next, 0, LAST_STEP);
    holdUntil.current = performance.now() + hold;
    setStep(Math.round(goal.current));
  }, []);

  /**
   * Scrolls the page (smoothly) to the spot where the book shows `target`.
   * Inside the scroll chapter the page position IS the book position, so scrolling up
   * always turns pages back, and autoplay is just the page scrolling itself.
   */
  const scrollToGoal = useCallback(
    (target: number, hold: number) => {
      const chapter = host.current;
      const total = chapter ? chapter.getBoundingClientRect().height - window.innerHeight : 0;
      if (!chapter || total <= 0) {
        setGoal(target, hold);
        return;
      }
      const rect = chapter.getBoundingClientRect();
      const cp = clamp(-rect.top / total, 0, 1);
      const top = window.scrollY + (progressFromGoal(clamp(target, 0, LAST_STEP)) - cp) * total;
      holdUntil.current = performance.now() + hold;
      ignoreDirUntil.current = performance.now() + 1600;
      blockAuto.current = false;
      window.scrollTo({ top, behavior: "smooth" });
    },
    [setGoal],
  );

  /* inside the scroll chapter: stretch it, and only start once the scene has fully opened */
  useEffect(() => {
    const chapter = root.current?.closest(".chapter") as HTMLElement | null;
    if (!chapter) {
      setOpen(true);
      return;
    }
    host.current = chapter;
    setEmbedded(true);
    chapter.style.height = `${CHAPTER_VH}vh`;

    const check = () => {
      if (parseFloat(chapter.style.getPropertyValue("--e") || "0") >= 0.9) {
        setOpen(true);
        window.removeEventListener("scroll", check);
      }
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    return () => {
      window.removeEventListener("scroll", check);
      chapter.style.height = "";
    };
  }, []);

  /* scroll position decides the page: the book follows the chapter's scroll progress exactly */
  useEffect(() => {
    const chapter = host.current;
    if (!embedded || !chapter) return;

    lastY.current = window.scrollY;

    const sync = () => {
      const y = window.scrollY;
      if (performance.now() > ignoreDirUntil.current) {
        if (y < lastY.current - 2) blockAuto.current = true;
        else if (y > lastY.current + 2) blockAuto.current = false;
      }
      lastY.current = y;

      const rect = chapter.getBoundingClientRect();
      const vh = window.innerHeight;
      visible.current = rect.top < vh * 0.6 && rect.bottom > vh * 0.4;
      const total = rect.height - vh;
      if (total <= 0) return;
      const cp = clamp(-rect.top / total, 0, 1);
      setGoal(goalFromProgress(cp), IDLE_MS);
    };

    sync();
    window.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    return () => {
      window.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, [embedded, setGoal]);

  /* draw the pages once fonts + photo are ready */
  useEffect(() => {
    let alive = true;
    let built: BookTextures | null = null;

    const fonts = [
      '700 40px "Space Grotesk"',
      '400 24px "Inter"',
      '500 24px "Inter"',
      '600 24px "Inter"',
      '600 40px "Caveat"',
    ];

    Promise.all([
      Promise.all(fonts.map((font) => document.fonts?.load(font).catch(() => []))),
      loadPhoto(photoUrl),
    ]).then(([, photo]) => {
      if (!alive) return;
      built = buildBookTextures(photo);
      setTextures(built);
    });

    return () => {
      alive = false;
      built?.dispose();
    };
  }, []);

  /* time: when nobody scrolls or clicks, the next page turns by itself */
  useEffect(() => {
    if (!textures || !open) return;
    holdUntil.current = Math.max(holdUntil.current, performance.now() + FIRST_DELAY);

    const id = window.setInterval(() => {
      if (!visible.current || blockAuto.current) return;
      if (performance.now() < holdUntil.current) return;
      if (goal.current >= LAST_STEP - 0.001) return;

      const next = Math.floor(goal.current + 0.001) + 1;
      if (embedded) scrollToGoal(next, IDLE_MS);
      else setGoal(next, IDLE_MS);
    }, 200);
    return () => window.clearInterval(id);
  }, [textures, open, embedded, scrollToGoal, setGoal]);

  const goTo = useCallback(
    (next: number) => {
      const target = clamp(next, 0, LAST_STEP);
      if (embedded) scrollToGoal(target, IDLE_MS);
      else setGoal(target, IDLE_MS);
    },
    [embedded, scrollToGoal, setGoal],
  );

  const replay = () => goTo(0);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !embedded) onClose();
      if (event.key === "ArrowRight") goTo(step + 1);
      if (event.key === "ArrowLeft") goTo(step - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [embedded, goTo, onClose, step]);

  const logLines = useMemo(() => about.status.slice(0, step + 1), [step]);
  const done = step === LAST_STEP;

  return (
    <div
      ref={root}
      className={`about-book ${embedded ? "is-embedded" : ""}`}
      role={embedded ? "region" : "dialog"}
      aria-modal={embedded ? undefined : true}
      aria-label="About me"
    >
      <div className="about-book-stage">
        {textures && (
          <Canvas
            flat
            dpr={[1, 2]}
            camera={{ fov: 35, near: 0.1, far: 60, position: [0, 0, 7] }}
            gl={{ antialias: true, alpha: true }}
          >
            <Book3D textures={textures} goal={goal} />
          </Canvas>
        )}
        {!textures && <div className="about-book-loading">OPENING THE BOOK…</div>}
      </div>

      <header className="about-book-head">
        <span className="status-dot" />
        <span>ABOUT · THE STORY SO FAR</span>
      </header>

      {/* right: chapter checklist */}
      <aside className="about-book-chapters" aria-label="Chapters">
        <h3>CHAPTERS</h3>
        <ul>
          {about.chapters.map((chapter, index) => {
            const state = index < step ? "done" : index === step ? "active" : "";
            return (
              <li key={chapter}>
                <button className={state} onClick={() => goTo(index)}>
                  <span className="tick">{index < step || done ? <Check size={12} /> : null}</span>
                  <span>{chapter}</span>
                </button>
              </li>
            );
          })}
        </ul>
        <div className="book-meter">
          <span style={{ width: `${(step / LAST_STEP) * 100}%` }} />
        </div>
      </aside>

      {/* bottom: console + controls */}
      <footer className="about-book-foot">
        <div className="book-log" aria-live="polite">
          {logLines.map((line, index) => (
            <p key={line} className={index === logLines.length - 1 ? "is-last" : ""}>
              <span>&gt;</span>{" "}
              {index === logLines.length - 1 ? <Typed text={line} /> : line}
            </p>
          ))}
        </div>

        {done && <div className="book-loaded">STORY FULLY LOADED</div>}

        <div className="book-actions">
          <button onClick={() => goTo(step - 1)} disabled={step === 0} aria-label="Previous page">
            <ArrowLeft size={15} />
          </button>
          <button onClick={() => goTo(step + 1)} disabled={done} aria-label="Next page">
            <ArrowRight size={15} />
          </button>
          <button onClick={replay}>
            <RotateCcw size={14} /> REPLAY
          </button>
          <button onClick={onClose}>
            {embedded ? <ArrowDown size={14} /> : <X size={14} />} {embedded ? "CONTINUE" : "CLOSE"}
          </button>
        </div>
      </footer>
    </div>
  );
}