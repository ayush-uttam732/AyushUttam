import { useEffect, useState } from "react";
import { RotateCcw, Trophy, X } from "lucide-react";

import {
  collectibles,
  gameActions,
  useExperience,
} from "../../store/experienceStore";
import "../../styles/game.css";

export const formatTime = (ms: number) => {
  const total = Math.floor(ms / 1000);
  const m = String(Math.floor(total / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return `${m}:${s}`;
};

export function GameHUD() {
  const playing = useExperience((s) => s.playing);
  const collected = useExperience((s) => s.collected);
  const completed = useExperience((s) => s.completed);
  const startedAt = useExperience((s) => s.startedAt);
  const finishedMs = useExperience((s) => s.finishedMs);
  const bestMs = useExperience((s) => s.bestMs);

  const [now, setNow] = useState(0);

  useEffect(() => {
    if (!playing || completed || startedAt === null) return;
    setNow(performance.now());
    const id = window.setInterval(() => setNow(performance.now()), 250);
    return () => window.clearInterval(id);
  }, [playing, completed, startedAt]);

  if (!playing) return null;

  const elapsed = completed
    ? (finishedMs ?? 0)
    : Math.max(0, now - (startedAt ?? now));

  return (
    <div className="game-hud" role="status" aria-live="polite">
      {completed ? (
        <>
          <Trophy size={16} className="game-hud-icon" />
          <span className="game-hud-title">ALL FOUND</span>
          <span className="game-hud-time">{formatTime(elapsed)}</span>
          {bestMs !== null && (
            <span className="game-hud-best">BEST {formatTime(bestMs)}</span>
          )}
          <button className="game-hud-btn" onClick={gameActions.start}>
            <RotateCcw size={13} /> PLAY AGAIN
          </button>
        </>
      ) : (
        <>
          <span className="game-hud-title">FIND THE ORBS</span>
          <span className="game-hud-dots">
            {collectibles.map((item) => (
              <span
                key={item.id}
                className={`game-dot ${collected.includes(item.id) ? "is-found" : ""}`}
              />
            ))}
          </span>
          <span className="game-hud-count">
            {collected.length}/{collectibles.length}
          </span>
          <span className="game-hud-time">{formatTime(elapsed)}</span>
        </>
      )}

      <button
        className="game-hud-close"
        onClick={gameActions.stop}
        aria-label="Exit game"
      >
        <X size={14} />
      </button>
    </div>
  );
}