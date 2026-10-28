import type { IconType } from 'react-icons';
import {
  SiFigma,
  SiGit,
  SiGithub,
  SiJavascript,
  SiMongodb,
  SiNextdotjs,
  SiNodedotjs,
  SiPython,
  SiReact,
  SiTailwindcss,
  SiThreedotjs,
  SiTypescript,
} from 'react-icons/si';

export type Skill = { name: string; Icon: IconType; color: string };

// Apni asli skills yahin rakho. Order hi absorb hone ka order hai.
export const SKILLS: Skill[] = [
  { name: 'GitHub', Icon: SiGithub, color: '#ffffff' },
  { name: 'React', Icon: SiReact, color: '#61dafb' },
  { name: 'TypeScript', Icon: SiTypescript, color: '#3178c6' },
  { name: 'JavaScript', Icon: SiJavascript, color: '#f7df1e' },
  { name: 'Node.js', Icon: SiNodedotjs, color: '#5fa04e' },
  { name: 'Three.js', Icon: SiThreedotjs, color: '#ffffff' },
  { name: 'Tailwind CSS', Icon: SiTailwindcss, color: '#38bdf8' },
  { name: 'Next.js', Icon: SiNextdotjs, color: '#ffffff' },
  { name: 'Python', Icon: SiPython, color: '#ffd43b' },
  { name: 'Git', Icon: SiGit, color: '#f05032' },
  { name: 'Figma', Icon: SiFigma, color: '#f24e1e' },
  { name: 'MongoDB', Icon: SiMongodb, color: '#47a248' },
];

/* ---------- Timing / tuning ---------- */
export const BRAIN_IN = 1.4; // brain ubharne ka time (s)
export const FIRST = 1.5; // pehla icon kab shuru ho
export const GAP = 0.95; // do icons ke beech gap
export const FLY = 1.5; // icon ko brain tak pahunchne me time
export const SINK = 0.6; // brain ke andar utarne me time
export const GROW = 0.025; // har skill ke baad brain kitna bada ho