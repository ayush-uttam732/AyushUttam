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

const LAST_STEP = about.chapters.length - 1;
/** How long each page stays open while it plays by itself (ms). */
const FIRST_DELAY = 2600;
const PAGE_DELAY = 6200;

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
  const [auto, setAuto] = useState(true);
  const [run, setRun] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [embedded, setEmbedded] = useState(false);

  /* scroll-chapter ke andar: kitaab tab palatna shuru kare jab scene poori screen par khul jaye */
  useEffect(() => {
    const host = root.current?.closest(".chapter") as HTMLElement | null;
    if (!host) {
      setOpen(true);
      return;
    }
    setEmbedded(true);
    const check = () => {
      if (parseFloat(host.style.getPropertyValue("--e") || "0") >= 0.9) {
        setOpen(true);
        window.removeEventListener("scroll", check);
      }
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    return () => window.removeEventListener("scroll", check);
  }, []);

  /* draw the pages once fonts + photo are ready */
  useEffect(() => {
    let alive = true;
    let built: BookTextures | null = null;

    const fonts = [
      '700 40px "Space Grotesk"',
      '400 24px "Inter"',
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

  /* autoplay: cover -> chapter 1 -> 2 -> 3 */
  useEffect(() => {
    if (!textures || !open || !auto || step >= LAST_STEP) return;
    const id = window.setTimeout(
      () => setStep((value) => Math.min(LAST_STEP, value + 1)),
      step === 0 ? FIRST_DELAY : PAGE_DELAY,
    );
    return () => window.clearTimeout(id);
  }, [textures, open, auto, step, run]);

  const goTo = useCallback((next: number) => {
    setAuto(false);
    setStep(Math.max(0, Math.min(LAST_STEP, next)));
  }, []);

  const replay = () => {
    setStep(0);
    setAuto(true);
    setRun((value) => value + 1);
  };

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
            key={run}
            flat
            dpr={[1, 2]}
            camera={{ fov: 35, near: 0.1, far: 60, position: [0, 0, 7] }}
            gl={{ antialias: true, alpha: true }}
          >
            <Book3D textures={textures} step={step} />
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