import type { PanelName } from "../types";

export type HotspotDef = {
  id: PanelName;
  label: string;
  /** 0..1 position on the image */
  x: number;
  y: number;
  /** 0 far .. 1 near (matches the depth map) */
  depth: number;
  accent: string;
};

export const hotspots: HotspotDef[] = [
  { id: "skills", label: "SKILLS", x: 0.264, y: 0.256, depth: 0.36, accent: "#ffb86e" },
  { id: "projects", label: "PROJECTS", x: 0.502, y: 0.256, depth: 0.16, accent: "#59e1d2" },
  { id: "about", label: "ABOUT", x: 0.681, y: 0.398, depth: 0.4, accent: "#a78bfa" },
  { id: "contact", label: "CONTACT", x: 0.849, y: 0.463, depth: 0.48, accent: "#e78cdb" },
  { id: "play", label: "PLAY", x: 0.674, y: 0.624, depth: 0.5, accent: "#59e1d2" },
];

export const hotspotById = Object.fromEntries(
  hotspots.map((spot) => [spot.id, spot]),
) as Record<PanelName, HotspotDef>;