import type { Project } from "../types";

/**
 * image  -> public/images/projects/ me file rakhiye, yahan "images/projects/<naam>" likhiye
 * live   -> deployed website ka link
 * github -> repo ka link
 */
export const projects: Project[] = [
  {
    id: "dev-world",
    title: "Explore Kanpur",
    description: "This provide home services and all famous tourist place every thing in on place !.",
    tags: ["html", "css", "node.js", "mongoDB"],
    image: "images/projects/exploreKanpur.png",
    live: "https://explorekanpur.onrender.com/explore-kanpur",
    github: "https://github.com/ayush-uttam732",
  },
  {
    id: "realtime-chat",
    title: "Meetmin-AI Assistance",
    description: "Low-latency messaging with rooms, presence and typing indicators.",
    tags: ["Node.js", "WebSockets", "React"],
    image: "images/projects/meetmindAI.png",
    live: "https://your-chat-app.com",
    github: "https://github.com/ayush-uttam732",
  },
  {
    id: "ai-notes",
    title: "AI Notes Assistant",
    description: "Notes that summarise, tag and search themselves.",
    tags: ["Next.js", "OpenAI", "PostgreSQL"],
    image: "images/projects/ai-notes.jpg",
    live: "https://your-notes-app.com",
    github: "https://github.com/your-username/ai-notes",
  },
  {
    id: "dashboard",
    title: "Analytics Dashboard",
    description: "Clean, fast dashboards with live charts and role-based access.",
    tags: ["React", "Charts", "REST"],
    image: "images/projects/dashboard.jpg",
    live: "https://your-dashboard.com",
    github: "https://github.com/your-username/dashboard",
  },
];