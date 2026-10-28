import { useSyncExternalStore } from "react";

import type { Vec3 } from "../types";

export type CollectibleDef = {
  id: string;
  label: string;
  position: Vec3;
  color: string;
};

/** The 5 hidden orbs. Change positions here to hide them elsewhere. */
export const collectibles: CollectibleDef[] = [
  { id: "under-desk", label: "Under the desk", position: [0.6, 0.45, -1.4], color: "#9b85ff" },
  { id: "bookshelf", label: "Bookshelf", position: [-4.55, 2.2, -1.85], color: "#ffb86e" },
  { id: "wall-shelf", label: "Plant shelf", position: [2.1, 4.35, -3.45], color: "#59e1d2" },
  { id: "coffee-table", label: "Under the table", position: [3.3, 0.25, 3.0], color: "#e78cdb" },
  { id: "bean-bag", label: "Behind the bean bag", position: [5.3, 0.4, 2.3], color: "#ffd166" },
];

type ExperienceState = {
  playing: boolean;
  collected: string[];
  completed: boolean;
  startedAt: number | null;
  finishedMs: number | null;
  bestMs: number | null;
};

const BEST_KEY = "portfolio-best-time";

function readBest(): number | null {
  try {
    const value = localStorage.getItem(BEST_KEY);
    return value ? Number(value) : null;
  } catch {
    return null;
  }
}

let state: ExperienceState = {
  playing: false,
  collected: [],
  completed: false,
  startedAt: null,
  finishedMs: null,
  bestMs: readBest(),
};

const listeners = new Set<() => void>();

function setState(patch: Partial<ExperienceState>) {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export const gameActions = {
  start() {
    setState({
      playing: true,
      collected: [],
      completed: false,
      startedAt: performance.now(),
      finishedMs: null,
    });
  },

  stop() {
    setState({
      playing: false,
      collected: [],
      completed: false,
      startedAt: null,
      finishedMs: null,
    });
  },

  collect(id: string) {
    if (!state.playing || state.completed || state.collected.includes(id)) return;

    const collected = [...state.collected, id];

    if (collected.length === collectibles.length) {
      const finishedMs = Math.round(
        performance.now() - (state.startedAt ?? performance.now()),
      );
      const bestMs =
        state.bestMs === null ? finishedMs : Math.min(state.bestMs, finishedMs);

      try {
        localStorage.setItem(BEST_KEY, String(bestMs));
      } catch {
        /* ignore */
      }

      setState({ collected, completed: true, finishedMs, bestMs });
    } else {
      setState({ collected });
    }
  },
};

/** Select primitives (or the stable `collected` array) to avoid extra renders. */
export function useExperience<T>(selector: (s: ExperienceState) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(state),
    () => selector(state),
  );
}