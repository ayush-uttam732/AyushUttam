import { Fragment, useEffect, useRef, useState } from "react";
import type { CSSProperties, RefObject } from "react";
import { ArrowUpRight } from "lucide-react";

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (t: number) => t * t * (3 - 2 * t);

/**
 * Scroll progress of a tall section with a sticky stage inside.
 * Writes CSS variables on the element so everything animates with plain CSS:
 *   --cp  0..1 progress while pinned
 *   --e   0..1 how far the 3D window has expanded to full screen
 *   --tf  1..0 intro text visibility
 *   --chip 0..1 small label visibility
 *   --g   page offset in screens (for horizontal ghost text)
 */
export function useChapter(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;

    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const total = r.height - vh;
      const cp = total > 0 ? clamp(-r.top / total) : 0;
      const e = smooth(clamp(cp / 0.26));
      const tf = 1 - smooth(clamp((cp - 0.03) / 0.17));
      const chip = smooth(clamp((cp - 0.3) / 0.08)) * (1 - smooth(clamp((cp - 0.95) / 0.05)));

      el.style.setProperty("--cp", cp.toFixed(4));
      el.style.setProperty("--e", e.toFixed(4));
      el.style.setProperty("--tf", tf.toFixed(4));
      el.style.setProperty("--chip", chip.toFixed(4));
      el.style.setProperty("--g", (-r.top / vh).toFixed(4));
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [ref]);
}

/** Words slide up out of a mask, one after another, when the parent gets the `in` class. */
export function Words({ text, start = 0 }: { text: string; start?: number }) {
  return (
    <>
      {text.split(" ").map((word, i) => (
        <Fragment key={i}>
          <span className="w">
            <span style={{ "--i": i + start } as CSSProperties}>{word}</span>
          </span>{" "}
        </Fragment>
      ))}
    </>
  );
}

/** Same heading everywhere (card mode, CTA...). */
export function SectionHead({
  num,
  kicker,
  title,
  text,
}: {
  num: string;
  kicker: string;
  title: string;
  text?: string;
}) {
  return (
    <div className="section-head" data-num={num}>
      <span className="kicker rv">
        {num} · {kicker}
      </span>
      <h2 className="rvw">
        <Words text={title} />
      </h2>
      {text && <p className="rv">{text}</p>}
    </div>
  );
}

const HIGHLIGHT = new Set(["fast", "polished", "immersive", "3D", "experiences", "engineering", "design"]);

/** Big sentence that lights up word by word while you scroll through it. */
export function Statement({ text }: { text: string }) {
  const ref = useRef<HTMLElement>(null);
  useChapter(ref);
  const words = text.split(" ");

  return (
    <section className="statement" ref={ref}>
      <div className="statement-stage">
        <div>
          <span className="kicker">HELLO, I&apos;M AYUSH</span>
          <p>
            {words.map((word, i) => (
              <Fragment key={i}>
                <span
                  className={`scrub-word ${HIGHLIGHT.has(word.replace(/[^\w3D]/g, "")) ? "hl" : ""}`}
                  style={{ "--wi": (i / words.length).toFixed(3) } as CSSProperties}
                >
                  {word}
                </span>{" "}
              </Fragment>
            ))}
          </p>
        </div>
      </div>
    </section>
  );
}

/** Two rows of tech pills scrolling in opposite directions. */
export function Marquee({ items }: { items: string[] }) {
  const half = Math.ceil(items.length / 2);
  const second = items.slice(half);
  const rows = [items.slice(0, half), second.length ? second : items];

  return (
    <section className="marquee" aria-label="Technologies">
      {rows.map((row, r) => (
        <div className={`marquee-row ${r === 1 ? "reverse" : ""}`} key={r}>
          <div className="marquee-track">
            {[...row, ...row, ...row, ...row].map((item, i) => (
              <span key={`${item}-${i}`}>{item}</span>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

function Counter({ to }: { to: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [n, setN] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        const t0 = performance.now();
        const step = (t: number) => {
          const k = Math.min(1, (t - t0) / 1400);
          setN(Math.round(to * (1 - Math.pow(1 - k, 3))));
          if (k < 1) raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [to]);

  return <span ref={ref}>{n}</span>;
}

export function StatsStrip({ stats }: { stats: { label: string; value: number; suffix?: string }[] }) {
  return (
    <section className="stats">
      {stats.map((s, i) => (
        <div className="stat rv" key={s.label} style={{ "--d": i } as CSSProperties}>
          <b>
            <Counter to={s.value} />
            {s.suffix ?? ""}
          </b>
          <small>{s.label}</small>
        </div>
      ))}
    </section>
  );
}

/** Dots on the right edge: shows where you are, click to jump. */
export function SideDots({
  sections,
  current,
  onGo,
}: {
  sections: { id: string; label: string }[];
  current: string;
  onGo: (id: string) => void;
}) {
  return (
    <nav className="side-dots" aria-label="Section progress">
      {sections.map((s) => (
        <button
          key={s.id}
          className={current === s.id ? "is-active" : ""}
          onClick={() => onGo(s.id)}
          aria-label={`Go to ${s.label}`}
        >
          <span>{s.label}</span>
          <i />
        </button>
      ))}
    </nav>
  );
}

/** Closing band before the footer. */
export function CtaBand({ onTalk }: { onTalk: () => void }) {
  return (
    <section className="cta-band">
      <div className="cta-card">
        <span className="kicker rv">NEXT STEP</span>
        <h2 className="rvw">
          <Words text="Have an idea?" />
          <br />
          <Words text="Let's build it." start={3} />
        </h2>
        <p className="rv">Project, collaboration or just a hello. I usually reply the same day.</p>
        <button className="btn btn-primary rv" onClick={onTalk}>
          Let&apos;s talk <ArrowUpRight size={16} />
        </button>
      </div>
    </section>
  );
}