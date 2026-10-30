import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import {
  ArrowUp,
  ArrowUpRight,
  Briefcase,
  Bug,
  Layers,
  Box,
  Mail,
  Menu,
  Rocket,
  X,
} from "lucide-react";

import { Experience } from "../features/experience/Experience";
import { ProjectsLaptopPanel } from "../features/panels/ProjectsLaptopPanel";
import { SkillsPanel } from "../features/panels/SkillsPanel";
import { AboutBook } from "../features/panels/about-book/AboutBook";
import { GamesArcade } from "../features/games/arcade/GamesArcade";
import { ContactPhone } from "../features/panels/phone/ContactPhone";

import { GameHUD } from "../components/layout/GameHUD";
import { AchievementSystem } from "../features/achievements/AchievementSystem";
import { useGameState } from "../hooks/useGameState";
import { about } from "../data/about";
import { projects } from "../data/projects";
import { skillGroups } from "../data/skills";
import type { PanelName } from "../types";
import Backdrop3D from "./Backdrop3d";
import { Classic2D } from "./Classic2D";
import { CtaBand, Marquee, SideDots, StatsStrip, Words, useChapter } from "./ScrollExtras";

import "./App.css";
import "./scroll-polish.css";
import "./classic2d.css";

const sections = [
  { id: "home", label: "Home" },
  { id: "about", label: "About" },
  { id: "skills", label: "Skills" },
  { id: "projects", label: "Projects" },
  { id: "games", label: "Games" },
  { id: "contact", label: "Contact" },
];

const arcade = [
  { title: "Stack Tower", tag: "TIMING", text: "Drop the sliding block exactly on top and build the tallest tower.", color: "#59e1d2", icon: <Layers size={26} /> },
  { title: "Bug Squash", tag: "REFLEX · 30s", text: "Squash the bugs, grab the golden bonus, avoid the red bomb.", color: "#ffb86e", icon: <Bug size={26} /> },
  { title: "Neon Dodge", tag: "ENDLESS RUN", text: "Fly down the neon road, dodge the blocks and collect gems.", color: "#a78bfa", icon: <Rocket size={26} /> },
];

const panelToSection: Record<PanelName, string> = {
  about: "about",
  skills: "skills",
  projects: "projects",
  contact: "contact",
  play: "games",
};

const allSkills = skillGroups.flatMap((group) => group.items);

const stats = [
  { label: "Projects built", value: projects.length, suffix: "+" },
  { label: "Technologies", value: allSkills.length, suffix: "+" },
  { label: "3D mini games", value: arcade.length },
  { label: "Hidden orbs", value: 5 },
];

const MODE_KEY = "portfolio-3d-mode";

/** 3D mode: a tall section with a sticky stage. The scene opens from a small window to FULL SCREEN while you scroll. */
function Chapter({
  id,
  num,
  kicker,
  title,
  text,
  ghost,
  render,
}: {
  id: string;
  num: string;
  kicker: string;
  title: string;
  text: string;
  ghost: string;
  render: () => ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  const [live, setLive] = useState(false);
  useChapter(ref);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setLive(entry.isIntersecting), {
      rootMargin: "15% 0px 15% 0px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section className="chapter" id={id} ref={ref}>
      <div className="chapter-stage">
        <div className="chapter-ghost" aria-hidden="true">
          {ghost}
        </div>

        <div className="chapter-intro">
          <span className="kicker rv">
            {num} · {kicker}
          </span>
          <h2 className="rvw">
            <Words text={title} />
          </h2>
          <p className="rv">{text}</p>
          <div className="chapter-hint rv">
            <i /> SCROLL TO ENTER
          </div>
        </div>

        <div className="chapter-window">
          <div className="scene-embed">
            {live ? render() : <div className="scene-wait">LOADING · {kicker}</div>}
          </div>
        </div>

        <div className="chapter-chip">
          {num} / {kicker}
        </div>
      </div>
    </section>
  );
}

function App() {
  const [activePanel, setActivePanel] = useState<PanelName | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [solid, setSolid] = useState(false);
  const [roomPaused, setRoomPaused] = useState(false);
  const [showTop, setShowTop] = useState(false);
  const [current, setCurrent] = useState("home");
  const [mode3d, setMode3d] = useState(() => {
    try {
      return localStorage.getItem(MODE_KEY) !== "off";
    } catch {
      return true;
    }
  });

  const site = useRef<HTMLElement>(null);
  const room = useRef<HTMLDivElement>(null);
  const scrollZoom = useRef(1);
  const scrollProg = useRef(0);

  const game = useGameState();

  const openPanel = (panel: PanelName) => {
    setActivePanel(panel);
    setMenuOpen(false);
  };
  const closePanel = () => setActivePanel(null);

  const scrollToSection = (id: string) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  /** 3D mode: jump to the scene. Card mode: open the full-screen overlay. */
  const go = (panel: PanelName) => {
    if (mode3d) scrollToSection(panelToSection[panel]);
    else openPanel(panel);
  };

  const nextAfter = (id: string) => {
    const i = sections.findIndex((s) => s.id === id);
    const next = sections[Math.min(sections.length - 1, i + 1)];
    scrollToSection(next.id);
  };

  const toggleMode = () => {
    setActivePanel(null);
    setMode3d((on) => {
      try {
        localStorage.setItem(MODE_KEY, on ? "off" : "on");
      } catch {
        /* ignore */
      }
      return !on;
    });
  };

  const startGame = () => {
    setActivePanel(null);
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
    game.start();
  };

  /* scroll: room fades + zooms, progress bar, solid navbar */
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const y = window.scrollY;
      const p = Math.min(1, Math.max(0, y / (window.innerHeight * 0.85)));
      const total = document.documentElement.scrollHeight - window.innerHeight;
      const el = site.current;
      if (el) {
        el.style.setProperty("--p", p.toFixed(3));
        el.style.setProperty("--sp", total > 0 ? (y / total).toFixed(4) : "0");
      }
      scrollProg.current = total > 0 ? y / total : 0;
      room.current?.classList.toggle("is-passed", p > 0.55);
      scrollZoom.current = 1 + p * 0.22;
      setSolid(y > 40);
      setShowTop(y > window.innerHeight * 1.5);
      setRoomPaused(y > window.innerHeight * 1.1);
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
  }, []);

  /* scroll-in reveal + active nav link */
  useEffect(() => {
    const reveal = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            reveal.unobserve(entry.target);
          }
        }),
      { threshold: 0.12 },
    );
    document.querySelectorAll(".rv, .rvw").forEach((el) => reveal.observe(el));

    const spy = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) setCurrent(entry.target.id);
        }),
      { rootMargin: "-45% 0px -50% 0px" },
    );
    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) spy.observe(el);
    });

    return () => {
      reveal.disconnect();
      spy.disconnect();
    };
  }, [mode3d]);

  return (
    <main className="site" ref={site}>
      <div className="scroll-bar" />

      {/* FIXED 3D ROOM (background of the hero, fades as you scroll) */}
      <div className="room-fixed" ref={room}>
        <Experience activePanel={activePanel} onSelect={go} scrollZoom={scrollZoom} paused={roomPaused} />
      </div>

      {/* shared background for ALL sections (fades in as the room fades out) */}
      <Backdrop3D progress={scrollProg} />

      {/* NAVBAR */}
      <header className={`site-header ${solid ? "is-solid" : ""}`}>
        <a className="brand" href="#home" aria-label="Home" style={{ textDecoration: "none" }}>
          <span className="brand-mark">
            AU<span>.</span>
          </span>
          <span className="brand-text">
            <strong>Ayush Uttam</strong>
            <small>PORTFOLIO</small>
          </span>
        </a>

        <nav className="site-nav" aria-label="Main navigation">
          {sections.slice(1).map((s) => (
            <a key={s.id} href={`#${s.id}`} className={current === s.id ? "is-active" : ""}>
              {s.label}
            </a>
          ))}
        </nav>

        <div className="header-actions">
          <span className="availability">
            <span className="status-dot" />
            Available for work
          </span>
          <button
            className={`mode-switch ${mode3d ? "is-on" : ""}`}
            role="switch"
            aria-checked={mode3d}
            onClick={toggleMode}
            title={mode3d ? "3D scenes are ON while scrolling" : "Switch on 3D scenes"}
          >
            <Box size={14} />
            <span>3D</span>
            <i />
          </button>
          <button className="btn btn-primary" onClick={() => go("contact")}>
            Let&apos;s talk <ArrowUpRight size={16} />
          </button>
          <button
            className="menu-toggle"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </header>

      {menuOpen && (
        <nav className="mobile-nav" aria-label="Portfolio menu">
          {sections.map((s) => (
            <a key={s.id} href={`#${s.id}`} onClick={() => setMenuOpen(false)}>
              {s.label.toUpperCase()}
            </a>
          ))}
        </nav>
      )}

      <SideDots sections={sections} current={current} onGo={scrollToSection} />

      <div className="site-content">
        {/* HERO */}
        <section className="hero" id="home">
          <div className="hero-inner">
            <span className="hero-eyebrow">
              <span className="status-dot" /> INTERACTIVE PORTFOLIO
            </span>
            <h1 className="split" aria-label="Ayush Uttam.">
              {[..."Ayush Uttam"].map((c, i) => (
                <span className="ch" key={i} style={{ "--i": i } as CSSProperties} aria-hidden="true">
                  {c === " " ? "\u00A0" : c}
                </span>
              ))}
              <span className="ch title-period" style={{ "--i": 11 } as CSSProperties} aria-hidden="true">
                .
              </span>
            </h1>
            <p className="hero-role">Full-Stack Developer · Web Technologies &amp; AI Enthusiast</p>
            <p className="hero-text">
              Building digital experiences with curiosity, creativity, and code. A Computer
              Science student with hands-on exposure to web development, backend, AI-powered
              apps and business automation tools.
            </p>
            <div className="hero-actions">
              <a className="btn btn-primary" href="#projects">
                <Briefcase size={16} /> View projects
              </a>
              <button className="btn" onClick={() => go("contact")}>
                <Mail size={16} /> Get in touch
              </button>
            </div>
          </div>

          <div className="scroll-cue">
            <span>SCROLL</span>
            <i />
          </div>
        </section>

        <Marquee items={allSkills} />
        <StatsStrip stats={stats} />

        {mode3d ? (
          <>
            <Chapter
              id="about"
              num="01"
              kicker="ABOUT"
              title={about.intro.title}
              text="Scroll down to open the book."
              ghost="ABOUT"
              render={() => <AboutBook onClose={() => nextAfter("about")} />}
            />
            <Chapter
              id="skills"
              num="02"
              kicker="SKILLS"
              title="Tools I use to ship."
              text="A focused stack for building fast, accessible and visually rich products."
              ghost="SKILLS"
              render={() => <SkillsPanel onClose={() => nextAfter("skills")} />}
            />
            <Chapter
              id="projects"
              num="03"
              kicker="PROJECTS"
              title="Selected work."
              text="A few things I have designed and built recently."
              ghost="PROJECTS"
              render={() => <ProjectsLaptopPanel onClose={() => nextAfter("projects")} />}
            />
            <Chapter
              id="games"
              num="04"
              kicker="GAMES"
              title="Take a break. Play something."
              text="Three tiny 3D games, built for a quick round. Beat your best score."
              ghost="GAMES"
              render={() => (
                <GamesArcade onClose={() => nextAfter("games")} onStartHunt={startGame} />
              )}
            />
            <Chapter
              id="contact"
              num="05"
              kicker="CONTACT"
              title="Say hello."
              text="Power on the phone and your message lands straight in my WhatsApp."
              ghost="CONTACT"
              render={() => <ContactPhone onClose={() => nextAfter("contact")} />}
            />
            <CtaBand onTalk={() => go("contact")} />
          </>
        ) : (
          <Classic2D onOpenPanel={openPanel} onStartGame={startGame} />
        )}

        <footer className="site-footer">
          <span>DESIGNED &amp; BUILT BY AYUSH UTTAM</span>
          <span>© {new Date().getFullYear()} ALL RIGHTS RESERVED</span>
        </footer>
      </div>

      {/* 3D OVERLAYS */}
      {!mode3d && activePanel === "about" && <AboutBook onClose={closePanel} />}
      {!mode3d && activePanel === "contact" && <ContactPhone onClose={closePanel} />}
      {!mode3d && activePanel === "play" && <GamesArcade onClose={closePanel} onStartHunt={startGame} />}
      {!mode3d && activePanel === "skills" && <SkillsPanel onClose={closePanel} />}
      {!mode3d && activePanel === "projects" && <ProjectsLaptopPanel onClose={closePanel} />}

      <button
        className={`to-top ${showTop ? "is-visible" : ""}`}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Back to top"
        tabIndex={showTop ? 0 : -1}
      >
        <ArrowUp size={18} />
      </button>

      <GameHUD />
      <AchievementSystem />
    </main>
  );
}

export default App;