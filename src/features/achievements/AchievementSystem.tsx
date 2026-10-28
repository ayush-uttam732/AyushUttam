import { useEffect, useState } from "react";
import { Sparkles, Trophy } from "lucide-react";

import { useExperience } from "../../store/experienceStore";
import "../../styles/game.css";

type Toast = { title: string; text: string; kind: "first" | "done" };

export function AchievementSystem() {
  const found = useExperience((s) => s.collected.length);
  const completed = useExperience((s) => s.completed);
  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => {
    if (found === 1 && !completed) {
      setToast({
        kind: "first",
        title: "FIRST FIND",
        text: "One orb down, four to go.",
      });
    }
  }, [found, completed]);

  useEffect(() => {
    if (completed) {
      setToast({
        kind: "done",
        title: "ROOM EXPLORER",
        text: "You found every hidden orb. Nothing escapes you.",
      });
    }
  }, [completed]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 3800);
    return () => window.clearTimeout(id);
  }, [toast]);

  if (!toast) return null;

  return (
    <div className="achievement-toast" role="status" key={toast.title}>
      <span className="achievement-icon">
        {toast.kind === "done" ? <Trophy size={18} /> : <Sparkles size={18} />}
      </span>
      <div>
        <span className="achievement-label">ACHIEVEMENT UNLOCKED</span>
        <strong>{toast.title}</strong>
        <p>{toast.text}</p>
      </div>
    </div>
  );
}