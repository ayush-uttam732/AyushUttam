import { useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Code2,
  Folder,
  Gamepad2,
  Github,
  Layers3,
  Linkedin,
  Mail,
  Menu,
  UserRound,
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
import type { PanelName } from "../types";
import { SOCIAL } from "../utils/constants";

import "./App.css";

const navigationItems: {
  id: PanelName;
  label: string;
  icon: typeof UserRound;
}[] = [
  { id: "about", label: "ABOUT", icon: UserRound },
  { id: "projects", label: "PROJECTS", icon: Folder },
  { id: "skills", label: "SKILLS", icon: Layers3 },
  { id: "contact", label: "CONTACT", icon: Mail },
];

function App() {
  const [activePanel, setActivePanel] = useState<PanelName | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const game = useGameState();

  const openPanel = (panel: PanelName) => {
    setActivePanel(panel);
    setMenuOpen(false);
  };

  const closePanel = () => {
    setActivePanel(null);
  };

  const startGame = () => {
    setActivePanel(null);
    setMenuOpen(false);
    game.start();
  };

  const goHome = () => {
    setActivePanel(null);
    setMenuOpen(false);
  };

  return (
    <main className="world-app has-photo">
      {/* 3D ROOM */}
      <div className="world-canvas">
        <Experience activePanel={activePanel} onSelect={openPanel} />
      </div>

      {/* LEFT SIDEBAR */}
      {/* <aside className="portfolio-sidebar">
        <button
          className="world-logo"
          onClick={goHome}
          aria-label="Return home"
        >
          AU<span>.</span>
        </button>

        <nav className="sidebar-navigation" aria-label="Main navigation">
          <button
            className={`sidebar-link ${!activePanel ? "is-active" : ""}`}
            onClick={goHome}
          >
            <span className="sidebar-number">01</span>
            <span>HOME</span>
          </button>

          {navigationItems.map((item, index) => (
            <button
              key={item.id}
              className={`sidebar-link ${
                activePanel === item.id ? "is-active" : ""
              }`}
              onClick={() => openPanel(item.id)}
            >
              <span className="sidebar-number">
                {String(index + 2).padStart(2, "0")}
              </span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-socials">
          <a
            href={SOCIAL.github}
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub"
          >
            <Github size={18} />
          </a>

          <a
            href={SOCIAL.linkedin}
            target="_blank"
            rel="noreferrer"
            aria-label="LinkedIn"
          >
            <Linkedin size={18} />
          </a>

          <button
            onClick={() => openPanel("contact")}
            aria-label="Contact"
          >
            <Mail size={18} />
          </button>
        </div>
      </aside> */}

{/* FLOATING 3D SOCIAL RAIL */}
<aside className="portfolio-sidebar floating-social-rail">
  {/* AU LOGO */}
  <button
    className="world-logo rail-logo"
    onClick={goHome}
    aria-label="Return home"
    title="Home"
  >
    AU<span>.</span>
  </button>

  {/* SOCIAL ICONS */}
  <div className="sidebar-socials rail-socials">
    <a
      href={SOCIAL.github}
      target="_blank"
      rel="noreferrer"
      aria-label="GitHub"
      title="GitHub"
    >
      <Github size={19} />
    </a>

    <a
      href={SOCIAL.linkedin}
      target="_blank"
      rel="noreferrer"
      aria-label="LinkedIn"
      title="LinkedIn"
    >
      <Linkedin size={19} />
    </a>

    <button
      onClick={() => openPanel("contact")}
      aria-label="Contact"
      title="Contact"
    >
      <Mail size={19} />
    </button>
  </div>
</aside>


      {/* TOP RIGHT MENU */}
      <header className="world-header">
        <div className="world-status">
          <span className="status-dot" />
          <span>AVAILABLE FOR OPPORTUNITIES</span>
        </div>

        <button
          className="world-menu"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={17} /> : <Menu size={17} />}
          <span>{menuOpen ? "CLOSE" : "MENU"}</span>
        </button>
      </header>

      {/* DROPDOWN MENU */}
      {menuOpen && (
        <nav className="world-nav" aria-label="Portfolio menu">
          {navigationItems.map((item, index) => (
            <button
              key={item.id}
              onClick={() => openPanel(item.id)}
            >
              <span className="nav-number">
                {String(index + 1).padStart(2, "0")}
              </span>

              <span>{item.label.toLowerCase()}</span>

              <ArrowUpRight size={16} />
            </button>
          ))}

          <button onClick={() => openPanel("play")}>
            <span className="nav-number">05</span>
            <span>explore world</span>
            <Gamepad2 size={16} />
          </button>
        </nav>
      )}

      {/* HERO */}
      <section className="world-caption">
        <div className="caption-eyebrow">
          <Code2 size={14} />
          <span>INTERACTIVE DEVELOPER WORLD</span>
        </div>

        <h1>
          Ayush Uttam<span className="title-period">.</span>
        </h1>

        <p>
          BUILDING DIGITAL EXPERIENCES
          <br />
          THROUGH CODE, CREATIVITY AND CURIOSITY.
        </p>

        <button
          className="explore-button"
          onClick={() => openPanel("play")}
        >
          <span>EXPLORE MY WORLD</span>
          <ArrowDownRight size={17} />
        </button>
      </section>

      {/* EXPLORATION HINT */}
      <div className="world-hint">
        <span className="mouse-symbol">↕</span>
        <span>SCROLL TO ZOOM</span>
      </div>

      {/* ABOUT STORYBOOK
          Alag render hoga, purane world-panel ke andar nahi. */}
      {activePanel === "about" && (
        <AboutBook onClose={closePanel} />
      )}

      {activePanel === "contact" && <ContactPhone onClose={closePanel} />}

      {/* GAMES ARCADE */}
      {activePanel === "play" && (
        <GamesArcade onClose={closePanel} onStartHunt={startGame} />
      )}


      {/* SKILLS */}
      {activePanel === "skills" && (
        <SkillsPanel onClose={closePanel} />
      )}

      {/* PROJECTS */}
      {activePanel === "projects" && (
        <ProjectsLaptopPanel onClose={closePanel} />
      )}

      {/* BOTTOM FOOTER */}
      <footer className="world-footer">
        <span>DESIGNED TO BE EXPLORED</span>

        <span>
          © {new Date().getFullYear()} AYUSH UTTAM
        </span>

        <GameHUD />
        <AchievementSystem />
      </footer>
    </main>
  );
}

export default App;