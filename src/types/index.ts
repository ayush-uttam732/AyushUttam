export type PanelName = "projects" | "about" | "skills" | "contact" | "play";

export type Vec3 = [number, number, number];

export interface Project {
  id: string;
  title: string;
  description: string;
  tags: string[];
  href?: string;
  // ...jo pehle se hai
  image?: string;
  live?: string;
  github?: string;

}

export interface SkillGroup {
  label: string;
  items: string[];
}

export interface ExperienceItem {
  id: string;
  period: string;
  role: string;
  organization: string;
  description: string;
}