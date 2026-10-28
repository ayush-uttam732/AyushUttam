import { ArrowUpRight, Folder } from "lucide-react";

import { projects } from "../../data/projects";
import { stagger } from "../../lib/animations";

export function ProjectsPanel() {
  return (
    <>
      {projects.map((project, index) => (
        <a
          key={project.id}
          className="project-placeholder project-card reveal"
          style={stagger(index)}
          href={project.href ?? "#"}
          target="_blank"
          rel="noreferrer"
        >
          <span className="project-icon">
            <Folder size={18} />
          </span>

          <div>
            <strong>{project.title}</strong>
            <p>{project.description}</p>
            <p>{project.tags.join(" · ")}</p>
          </div>

          <ArrowUpRight size={16} />
        </a>
      ))}
    </>
  );
}