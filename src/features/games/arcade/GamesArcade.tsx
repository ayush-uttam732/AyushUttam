import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { ArrowLeft, Bug, Gamepad2, Layers, RotateCcw, Rocket, Trophy, X } from "lucide-react";

import { BugGame } from "./BugGame";
import { DodgeGame } from "./DodgeGame";
import { StackGame } from "./StackGame";
import type { GameId, GameProps } from "./types";
import "../../../styles/arcade.css";

type Entry = {
  id: GameId;
  title: string;
  tag: string;
  text: string;
  how: string;
  accent: string;
  icon: ReactNode;
  Component: (props: GameProps) => JSX.Element;
};

const games: Entry[] = [
  {
    id: "stack",
    title: "STACK TOWER",
    tag: "TIMING",
    text: "Drop the sliding block exactly on top. Miss a little and the tower gets thinner.",
    how: "Click / tap / SPACE to drop",
    accent: "#59e1d2",
    icon: <Layers size={26} />,
    Component: StackGame,
  },
  {
    id: "bugs",
    title: "BUG SQUASH",
    tag: "REFLEX · 30s",
    text: "Bugs pop out of the holes. Squash the green ones, hit the golden bonus, avoid the red bomb.",
    how: "Click / tap the bugs",
    accent: "#ffb86e",
    icon: <Bug size={26} />,
    Component: BugGame,
  },
  {
    id: "dodge",
    title: "NEON DODGE",
    tag: "ENDLESS RUN",
    text: "Fly down the neon road, dodge the red blocks and grab the golden gems.",
    how: "← → or A D (tap left / right side on mobile)",
    accent: "#a78bfa",
    icon: <Rocket size={26} />,
    Component: DodgeGame,
  },
];

const readBest = (id: GameId) => {
  try {
    return Number(localStorage.getItem(`arcade-best-${id}`) ?? 0) || 0;
  } catch {
    return 0;
  }
};

const writeBest = (id: GameId, score: number) => {
  try {
    localStorage.setItem(`arcade-best-${id}`, String(score));
  } catch {
    /* private mode: ignore */
  }
};

type Props = {
  onClose: () => void;
  /** starts the hidden-orb hunt in the room (closes the arcade) */
  onStartHunt: () => void;
};

export function GamesArcade({ onClose, onStartHunt }: Props) {
  const [current, setCurrent] = useState<GameId | null>(null);
  const [run, setRun] = useState(0);
  const [score, setScore] = useState(0);
  const [info, setInfo] = useState("");
  const [result, setResult] = useState<{ score: number; best: boolean } | null>(null);
  const [best, setBest] = useState<Record<GameId, number>>(() => ({
    stack: readBest("stack"),
    bugs: readBest("bugs"),
    dodge: readBest("dodge"),
  }));

  const currentRef = useRef(current);
  currentRef.current = current;

  const handleScore = useCallback((value: number) => setScore(value), []);
  const handleInfo = useCallback((value: string) => setInfo(value), []);
  const handleOver = useCallback((value: number) => {
    const id = currentRef.current;
    if (!id) return;
    setBest((previous) => {
      const isBest = value > previous[id];
      if (isBest) writeBest(id, value);
      setResult({ score: value, best: isBest && value > 0 });
      return isBest ? { ...previous, [id]: value } : previous;
    });
  }, []);

  const start = (id: GameId) => {
    setCurrent(id);
    setScore(0);
    setInfo("");
    setResult(null);
    setRun((value) => value + 1);
  };

  const toMenu = () => {
    setCurrent(null);
    setResult(null);
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (currentRef.current) toMenu();
      else onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const entry = games.find((game) => game.id === current);

  return (
    <div className="arcade" role="dialog" aria-modal="true" aria-label="Mini games">
      {!entry && (
        <div className="arcade-menu">
          <div className="arcade-title">
            <span className="status-dot" />
            <span>GAMES · TAKE A BREAK</span>
          </div>
          <h2>Pick a tiny game.</h2>
          <p>Three quick 3D games, 30–60 seconds each. Beat your best score.</p>

          <div className="arcade-cards">
            {games.map((game, index) => (
              <button
                key={game.id}
                className="arcade-card"
                style={{ "--accent": game.accent, "--i": index } as CSSProperties}
                onClick={() => start(game.id)}
                onPointerMove={(event) => {
                  const r = event.currentTarget.getBoundingClientRect();
                  event.currentTarget.style.setProperty("--rx", `${((event.clientY - r.top) / r.height - 0.5) * -12}deg`);
                  event.currentTarget.style.setProperty("--ry", `${((event.clientX - r.left) / r.width - 0.5) * 14}deg`);
                }}
                onPointerLeave={(event) => {
                  event.currentTarget.style.setProperty("--rx", "0deg");
                  event.currentTarget.style.setProperty("--ry", "0deg");
                }}
              >
                <span className="arcade-icon">{game.icon}</span>
                <span className="arcade-tag">{game.tag}</span>
                <strong>{game.title}</strong>
                <span className="arcade-text">{game.text}</span>
                <span className="arcade-best">
                  <Trophy size={13} /> BEST {best[game.id]}
                </span>
                <span className="arcade-play">PLAY ▸</span>
              </button>
            ))}
          </div>

          <button
            className="arcade-hunt"
            onClick={() => {
              onClose();
              onStartHunt();
            }}
          >
            <Gamepad2 size={16} />
            <span>OR: FIND THE 5 HIDDEN ORBS IN THE ROOM</span>
          </button>
        </div>
      )}

      {entry && (
        <>
          <div className="arcade-stage" key={run}>
            <entry.Component onScore={handleScore} onInfo={handleInfo} onOver={handleOver} />
          </div>

          <div className="arcade-hud">
            <div>
              <small>SCORE</small>
              <b>{score}</b>
            </div>
            <div className="arcade-info">{info}</div>
            <div>
              <small>BEST</small>
              <b>{Math.max(best[entry.id], score)}</b>
            </div>
          </div>

          <div className="arcade-how">{entry.how}</div>

          <div className="arcade-bar">
            <button onClick={toMenu}>
              <ArrowLeft size={14} /> GAMES
            </button>
            <button onClick={() => start(entry.id)}>
              <RotateCcw size={14} /> RESTART
            </button>
          </div>

          {result && (
            <div className="arcade-over">
              <div className="arcade-over-card">
                <small>{result.best ? "NEW BEST!" : "GAME OVER"}</small>
                <b>{result.score}</b>
                <p>{entry.title}</p>
                <div>
                  <button className="primary" onClick={() => start(entry.id)}>
                    PLAY AGAIN
                  </button>
                  <button onClick={toMenu}>MORE GAMES</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <button className="arcade-close" onClick={onClose} aria-label="Close games">
        <X size={19} />
      </button>
    </div>
  );
}