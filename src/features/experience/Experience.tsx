import { useEffect, useRef, useState } from "react";
import type { MutableRefObject } from "react";
import { Database, FolderOpen, Gamepad2, Mail, UserRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { hotspotById, hotspots } from "../../data/hotspots";
import { useExperience } from "../../store/experienceStore";
import type { PanelName } from "../../types";
import { CollectiblesGame } from "../games/collectibles/CollectiblesGame";
import { AmbientEffects } from "./AmbientEffects";
import { Anchor } from "./Anchor";
import { DepthCanvas } from "./DepthCanvas";
import type { PointerState } from "./DepthCanvas";
import { IMAGE_ASPECT, focusOrigin } from "./Stage";
import "../../styles/experience.css";

const icons: Record<PanelName, LucideIcon> = {
  skills: Database,
  projects: FolderOpen,
  about: UserRound,
  contact: Mail,
  play: Gamepad2,
};

/** Scroll-zoom limits (1 = normal). Don't go much above 1.3: the photo gets soft. */
const MIN_ZOOM = 1;
const MAX_ZOOM = 1.3;
/** Scroll speed. Bigger = zooms faster. */
const ZOOM_SPEED = 0.0012;

type ExperienceProps = {
  activePanel: PanelName | null;
  onSelect: (panel: PanelName) => void;
  /** page-scroll driven zoom (1..1.3). When given, the mouse wheel is left alone so the page can scroll. */
  scrollZoom?: MutableRefObject<number>;
  /** stop drawing the room (it is hidden behind the page) */
  paused?: boolean;
};

export function Experience({ activePanel, onSelect, scrollZoom, paused }: ExperienceProps) {
  const stage = useRef<HTMLDivElement>(null);
  const pointer = useRef<PointerState>({ x: 0, y: 0 });
  const zoomTarget = useRef(MIN_ZOOM);
  const [loaded, setLoaded] = useState(false);
  const hunting = useExperience((s) => s.playing);

  /* smooth mouse + scroll-zoom -> shared by the shader (pointer ref) and the HTML overlay (CSS vars) */
  useEffect(() => {
    const target = { x: 0, y: 0 };
    let zoom = MIN_ZOOM;
    let raf = 0;
    let lastMove = -10_000;

    const onMove = (event: PointerEvent) => {
      target.x = (event.clientX / window.innerWidth - 0.5) * 2;
      target.y = (event.clientY / window.innerHeight - 0.5) * 2;
      lastMove = performance.now();
    };

    const onWheel = (event: WheelEvent) => {
      // let the open panel scroll normally
      if ((event.target as HTMLElement | null)?.closest(".world-panel, .about-book")) return;

      event.preventDefault();
      const next = zoomTarget.current - event.deltaY * ZOOM_SPEED;
      zoomTarget.current = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, next));
    };

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const tick = (now: number) => {
      // slow idle drift when the pointer is still / on touch devices
      const idle = now - lastMove > 2500;
      const drift = reduce ? 0 : 1;
      const tx = idle ? Math.sin(now / 4200) * 0.55 * drift : target.x;
      const ty = idle ? Math.cos(now / 5300) * 0.35 * drift : target.y;

      pointer.current.x += (tx - pointer.current.x) * 0.05;
      pointer.current.y += (ty - pointer.current.y) * 0.05;
      if (scrollZoom) zoomTarget.current = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, scrollZoom.current));
      zoom += (zoomTarget.current - zoom) * 0.1;

      // when zoomed in, slide the view a little toward where the cursor is
      const extra = zoom - 1;
      const el = stage.current;
      if (el) {
        el.style.setProperty("--mx", pointer.current.x.toFixed(4));
        el.style.setProperty("--my", pointer.current.y.toFixed(4));
        el.style.setProperty("--zoom", zoom.toFixed(4));
        el.style.setProperty("--panx", `${(-pointer.current.x * extra * 10).toFixed(3)}%`);
        el.style.setProperty("--pany", `${(-pointer.current.y * extra * 8).toFixed(3)}%`);
      }

      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove);
    if (!scrollZoom) window.addEventListener("wheel", onWheel, { passive: false });
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("wheel", onWheel);
      cancelAnimationFrame(raf);
    };
  }, []);

  // opening a panel already zooms the room, so reset the scroll-zoom
  useEffect(() => {
    if (activePanel && !scrollZoom) zoomTarget.current = MIN_ZOOM;
  }, [activePanel, scrollZoom]);

  const focus = activePanel && activePanel !== "play" ? hotspotById[activePanel] : null;
  const origin = focus ? focusOrigin(focus.x, focus.y) : { x: 50, y: 50 };

  return (
    <div
      className={`experience ${loaded ? "is-loaded" : ""} ${
        activePanel ? "has-panel" : ""
      } ${hunting ? "is-hunting" : ""}`}
      aria-label="Interactive developer room"
    >
      <div
        ref={stage}
        className="stage"
        style={{
          aspectRatio: String(IMAGE_ASPECT),
          transformOrigin: `${origin.x}% ${origin.y}%`,
        }}
      >
        <div className="stage-zoom">
          <DepthCanvas pointer={pointer} onReady={() => setLoaded(true)} paused={paused} />

          <AmbientEffects />
          <CollectiblesGame />

          <div className="hotspot-layer">
            {hotspots.map((spot, index) => {
              const Icon = icons[spot.id];

              return (
                <Anchor key={spot.id} x={spot.x} y={spot.y} depth={spot.depth}>
                  <button
                    className="hotspot"
                    style={
                      {
                        "--accent": spot.accent,
                        "--i": index,
                      } as React.CSSProperties
                    }
                    onClick={() => onSelect(spot.id)}
                    aria-label={`Open ${spot.label.toLowerCase()}`}
                  >
                    <Icon size={14} />
                    <span>{spot.label}</span>
                  </button>
                </Anchor>
              );
            })}

            {/* glowing ball next to the dog */}
            <Anchor x={0.661} y={0.671} depth={0.5} className="ball" />
          </div>
        </div>
      </div>

      <div className="experience-loader" aria-hidden="true">
        <span />
      </div>
    </div>
  );
}