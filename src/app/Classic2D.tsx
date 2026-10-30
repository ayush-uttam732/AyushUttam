import type { CSSProperties, ReactNode } from "react";
import {
  AppWindow,
  ArrowRight,
  ArrowUpRight,
  Award,
  Bot,
  BrainCircuit,
  Briefcase,
  Bug,
  CheckCircle2,
  ChevronDown,
  Code2,
  Database,
  ExternalLink,
  Gamepad2,
  GraduationCap,
  Github,
  Globe,
  Layers,
  Linkedin,
  Mail,
  MapPin,
  MessageCircle,
  Palette,
  Puzzle,
  Rocket,
  Server,
  Sparkles,
  Users,
  Workflow,
  Wrench,
} from "lucide-react";

import { SectionHead } from "./ScrollExtras";
import { SOCIAL } from "../utils/constants";
import type { PanelName } from "../types";

/* ------------------------------------------------------------------ */
/* CONTENT                                                             */
/* ------------------------------------------------------------------ */

const intro = {
  title: "A developer who loves exploring technology.",
  paragraphs: [
    "Hello! I'm Ayush Uttam, a Computer Applications student passionate about web development, software technologies and artificial intelligence.",
    "My interest in technology goes beyond writing code. I enjoy exploring how different tools, platforms and technologies work together to solve real-world problems.",
    "I have practical exposure to frontend and backend development, databases, API integration, AI tools, CRM systems, website builders, workflow automation and UI design tools, along with professional experience from a paid internship at Shikom Solutions.",
    "Alongside traditional web development, I have also explored the Zoho ecosystem: Zoho CRM, Zoho Sites, Zoho Creator and Zoho Flow. I like understanding practical applications rather than limiting myself to a single technology stack.",
  ],
  facts: [
    { label: "LOCATION", value: "Kanpur, India" },
    { label: "STUDYING", value: "BCA · UIET" },
    { label: "FOCUS", value: "Full-Stack + AI" },
  ],
};

const approach = [
  { step: "01", title: "Learn", text: "Understand the problem and the tools." },
  { step: "02", title: "Explore", text: "Experiment with different technologies." },
  { step: "03", title: "Build", text: "Turn the idea into a working product." },
  { step: "04", title: "Improve", text: "Iterate, refine and grow." },
];

const services = [
  { icon: <Layers size={22} />, color: "#59e1d2", title: "Web Development", text: "Responsive web applications built with modern frontend and backend technologies." },
  { icon: <Server size={22} />, color: "#7fb6ff", title: "Backend & API Development", text: "Server-side technologies, databases, REST APIs and application logic." },
  { icon: <Bot size={22} />, color: "#ffb86e", title: "AI Integration", text: "AI APIs, LLM-powered applications, prompt engineering and AI-assisted workflows." },
  { icon: <Workflow size={22} />, color: "#8ef0a6", title: "Business Tools & Automation", text: "CRM platforms, website builders, low-code apps and workflow automation using Zoho." },
  { icon: <Palette size={22} />, color: "#e78cdb", title: "UI & Creative Tools", text: "Design tools, interactive interfaces, animations and user experience concepts." },
];

const skillGroups2d = [
  { icon: <Code2 size={20} />, color: "#59e1d2", label: "Programming & Web", items: ["HTML5", "CSS3", "JavaScript", "SQL", "Responsive Design"] },
  { icon: <Palette size={20} />, color: "#a78bfa", label: "Frontend", items: ["React.js", "EJS", "Tailwind CSS", "DOM Manipulation", "Component-Based UI", "Responsive Interfaces"] },
  { icon: <Server size={20} />, color: "#7fb6ff", label: "Backend", items: ["Node.js", "Express.js", "REST APIs", "Server-Side Programming", "Auth Fundamentals", "CRUD"] },
  { icon: <Database size={20} />, color: "#ffb86e", label: "Databases", items: ["MongoDB", "Mongoose", "SQL Fundamentals", "Database Design Basics"] },
  { icon: <BrainCircuit size={20} />, color: "#e78cdb", label: "AI & GenAI", items: ["OpenAI API", "Gemini API", "Groq API", "Prompt Engineering", "LLM Integration", "RAG Fundamentals", "Embeddings"] },
  { icon: <Wrench size={20} />, color: "#8ef0a6", label: "Design & Dev Tools", items: ["Figma", "Git & GitHub", "VS Code", "Postman", "npm", "Vercel", "Render"] },
];

const zoho = [
  { icon: <Users size={20} />, color: "#ff8a8a", title: "Zoho CRM", points: ["Managing customer and business information", "Leads, contacts and deals", "Modules and CRM workflows"] },
  { icon: <Globe size={20} />, color: "#7fb6ff", title: "Zoho Sites", points: ["Website creation and customization", "Layouts and page elements", "Publishing and site management"] },
  { icon: <AppWindow size={20} />, color: "#ffb86e", title: "Zoho Creator", points: ["Low-code application development", "Forms, reports and components", "Application workflows"] },
  { icon: <Workflow size={20} />, color: "#8ef0a6", title: "Zoho Flow", points: ["Workflow automation", "Triggers and actions", "Connecting apps through automation"] },
];

const extensions = [
  { icon: <Puzzle size={20} />, color: "#59e1d2", title: "Chrome Extensions", points: ["Extension architecture and Manifest V3", "Popup and side panel interfaces", "Permissions and browser APIs"] },
  { icon: <Code2 size={20} />, color: "#a78bfa", title: "VS Code Extensions", points: ["Extension structure and dev environment", "Manifests and basic functionality", "How extensions boost developer productivity"] },
];

type Project2d = {
  num: string;
  title: string;
  subtitle: string;
  status: string;
  color: string;
  description: string;
  features: string[];
  stack: string[];
  contribution: string;
  link: { label: string; href: string };
};

const featured: Project2d[] = [
  {
    num: "01",
    title: "Explore Kanpur",
    subtitle: "A digital discovery platform for Kanpur",
    status: "Live",
    color: "#59e1d2",
    description:
      "A city-focused web platform that helps people discover useful places, services and experiences across Kanpur. The idea evolved from a traditional accommodation-listing project into a broader city discovery platform.",
    features: [
      "Local places and attractions",
      "Restaurants, hotels, hospitals and colleges",
      "Browsable local listings and service discovery",
      "AI-powered city assistant",
      "Organized info for residents and visitors",
    ],
    stack: ["Node.js", "Express.js", "MongoDB", "Mongoose", "EJS", "JavaScript", "Groq API"],
    contribution: "Application features, backend functionality, database integration, listing management and AI assistant integration.",
    link: { label: "Live website", href: "https://explorekanpur.onrender.com/" },
  },
  {
    num: "02",
    title: "AI Synopsis Generator",
    subtitle: "AI-powered content generation application",
    status: "Live",
    color: "#a78bfa",
    description:
      "An AI-powered application that simplifies generating and organizing structured synopsis content, making content creation more accessible through AI and an editable interface.",
    features: [
      "AI-powered synopsis generation",
      "Structured content creation",
      "Editable generated content",
      "User-friendly interface and AI API integration",
    ],
    stack: ["React.js", "JavaScript", "AI APIs"],
    contribution: "Frontend development, application interface and AI-powered content generation workflows.",
    link: { label: "Live website", href: "https://au-synopsys-frontant.vercel.app/" },
  },
];

const experience2d = [
  {
    role: "Web Developer Intern",
    org: "Shikom Solutions",
    period: "3 Months",
    type: "Paid Internship",
    text: "Gained professional experience in a development environment, exploring practical web technologies and business-oriented digital solutions.",
    highlights: [
      "Explored web development tools and technologies",
      "Exposure to the Zoho ecosystem and CRM concepts",
      "Website development and customization",
      "Low-code apps and Zoho Flow automation",
      "Better understanding of practical software workflows",
    ],
  },
  {
    role: "Web Development Intern",
    org: "CODSOFT · Batch B93",
    period: "April – May 2026",
    type: "Internship Program",
    text: "Participated in a web development internship focused on practical development activities.",
    highlights: [
      "Practiced frontend development",
      "Worked on web development tasks",
      "Improved understanding of website structure and styling",
      "Strengthened practical development fundamentals",
    ],
  },
];

const certs = [
  { issuer: "IBM SkillsBuild", title: "Web Development Basics", text: "Foundational web development concepts.", color: "#7fb6ff" },
  { issuer: "Apna College", title: "Full Stack Web Development", text: "Web development fundamentals and full-stack concepts.", color: "#ffb86e" },
  { issuer: "Delta 5.0", title: "MERN Stack Development", text: "MongoDB, Express.js, React.js, Node.js and Git/GitHub.", color: "#59e1d2" },
  { issuer: "CODSOFT", title: "Web Development Internship", text: "Completed the CODSOFT internship program, Batch B93.", color: "#a78bfa" },
];

const arcade2d = [
  { title: "Stack Tower", tag: "TIMING", text: "Drop the sliding block exactly on top and build the tallest tower.", color: "#59e1d2", icon: <Layers size={26} /> },
  { title: "Bug Squash", tag: "REFLEX · 30s", text: "Squash the bugs, grab the golden bonus, avoid the red bomb.", color: "#ffb86e", icon: <Bug size={26} /> },
  { title: "Neon Dodge", tag: "ENDLESS RUN", text: "Fly down the neon road, dodge the blocks and collect gems.", color: "#a78bfa", icon: <Rocket size={26} /> },
];

const exploring = [
  { icon: <BrainCircuit size={22} />, color: "#e78cdb", title: "RAG & Embeddings", text: "Going deeper into retrieval-augmented apps that answer from your own data." },
  { icon: <Puzzle size={22} />, color: "#59e1d2", title: "Browser & Editor Extensions", text: "Chrome (Manifest V3) and VS Code extensions that make daily workflows faster." },
  { icon: <Workflow size={22} />, color: "#8ef0a6", title: "Low-code & Automation", text: "Zoho Creator and Zoho Flow for business apps and connected workflows." },
  { icon: <Rocket size={22} />, color: "#a78bfa", title: "Interactive 3D on the Web", text: "Scroll-driven scenes and playful interfaces, like this portfolio itself." },
];

const faqs = [
  {
    q: "Are you open to internships and collaborations?",
    a: "Yes. I'm open to internships and collaborations. The quickest way to reach me is the WhatsApp or email button in the contact section.",
  },
  {
    q: "What is your main tech stack?",
    a: "I mostly build with React.js, Node.js, Express.js and MongoDB, and add AI features using the OpenAI, Gemini and Groq APIs.",
  },
  {
    q: "Do you have professional experience?",
    a: "Yes. I completed a 3-month paid web developer internship at Shikom Solutions and the CODSOFT web development internship (Batch B93, April to May 2026).",
  },
  {
    q: "Can you build AI-powered features?",
    a: "Yes. Explore Kanpur includes an AI city assistant built with the Groq API, and the AI Synopsis Generator is built around AI-powered content generation.",
  },
  {
    q: "Can I play the games on this site?",
    a: "Absolutely. There are three tiny 3D games in the Games section, plus a hunt for five hidden orbs in the 3D room on the home screen.",
  },
];

/* ------------------------------------------------------------------ */
/* SMALL HELPERS                                                       */
/* ------------------------------------------------------------------ */

const c = (color: string, extra: CSSProperties = {}) => ({ "--c": color, ...extra }) as CSSProperties;
const d = (n: number) => ({ "--d": n }) as CSSProperties;

function Card({ children, className = "", style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <div className={`c2-card rv ${className}`} style={style}>
      {children}
    </div>
  );
}

function MiniCard({ icon, color, title, points, delay }: { icon: ReactNode; color: string; title: string; points: string[]; delay: number }) {
  return (
    <Card className="c2-mini" style={c(color, d(delay))}>
      <div className="c2-skill-head">
        <span className="c2-ico">{icon}</span>
        <h3>{title}</h3>
      </div>
      <ul className="c2-list">
        {points.map((p) => (
          <li key={p}>
            <CheckCircle2 size={15} /> {p}
          </li>
        ))}
      </ul>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* COMPONENT                                                           */
/* ------------------------------------------------------------------ */

export function Classic2D({
  onOpenPanel,
  onStartGame,
}: {
  onOpenPanel: (panel: PanelName) => void;
  onStartGame: () => void;
}) {
  return (
    <>
      {/* ABOUT */}
      <section className="panel-section c2" id="about">
        <SectionHead num="01" kicker="ABOUT" title={intro.title} />
        <div className="c2-about">
          <Card className="c2-profile">
            <div className="c2-avatar">
              AU<span>.</span>
            </div>
            <h3>Ayush Uttam</h3>
            <p className="c2-role">Full-Stack Developer · AI Enthusiast</p>
            <p className="c2-loc">
              <MapPin size={14} /> Kanpur, Uttar Pradesh, India
            </p>
            <div className="c2-status">
              <span className="status-dot" /> Open to internships &amp; collaborations
            </div>
            <div className="c2-socials">
              <a href={SOCIAL.github} target="_blank" rel="noreferrer" aria-label="GitHub">
                <Github size={18} />
              </a>
              <a href={SOCIAL.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn">
                <Linkedin size={18} />
              </a>
              <a href={`mailto:${SOCIAL.email}`} aria-label="Email">
                <Mail size={18} />
              </a>
            </div>
          </Card>

          <div className="c2-about-copy">
            {intro.paragraphs.map((t, i) => (
              <p key={i} className="rv" style={d(i)}>
                {t}
              </p>
            ))}
            <div className="c2-facts rv" style={d(3)}>
              {intro.facts.map((f) => (
                <div key={f.label}>
                  <small>{f.label}</small>
                  <b>{f.value}</b>
                </div>
              ))}
            </div>

            <h4 className="c2-col-title rv">My approach</h4>
            <div className="c2-approach">
              {approach.map((a, i) => (
                <Card key={a.step} className="c2-step" style={d(i)}>
                  <span>{a.step}</span>
                  <b>{a.title}</b>
                  <p>{a.text}</p>
                  {i < approach.length - 1 && <ArrowRight className="c2-step-arrow" size={16} />}
                </Card>
              ))}
            </div>

            <button className="btn btn-primary rv" onClick={() => onOpenPanel("about")}>
              Open my story in 3D <ArrowUpRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* WHAT I DO */}
      <section className="panel-section c2" id="services">
        <SectionHead
          num="02"
          kicker="WHAT I DO"
          title="Turning ideas into digital products."
          text="From interface to database to AI and automation, I work across the whole stack."
        />
        <div className="c2-grid c2-grid-3">
          {services.map((s, i) => (
            <Card key={s.title} className="c2-service" style={c(s.color, d(i))}>
              <span className="c2-ico c2-ico-lg">{s.icon}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* SKILLS */}
      <section className="panel-section c2" id="skills">
        <SectionHead
          num="03"
          kicker="SKILLS"
          title="Technologies I've explored and worked with."
          text="Hands-on exposure gained through projects, practice, internships and experimentation."
        />
        <div className="c2-grid c2-grid-3">
          {skillGroups2d.map((g, i) => (
            <Card key={g.label} className="c2-skill" style={c(g.color, d(i))}>
              <div className="c2-skill-head">
                <span className="c2-ico">{g.icon}</span>
                <h3>{g.label}</h3>
                <em>{String(g.items.length).padStart(2, "0")}</em>
              </div>
              <div className="c2-chips">
                {g.items.map((it) => (
                  <span key={it}>{it}</span>
                ))}
              </div>
            </Card>
          ))}
        </div>

        <h4 className="c2-col-title c2-sub-title rv">Zoho ecosystem &amp; business applications</h4>
        <div className="c2-grid c2-grid-4">
          {zoho.map((z, i) => (
            <MiniCard key={z.title} icon={z.icon} color={z.color} title={z.title} points={z.points} delay={i} />
          ))}
        </div>

        <h4 className="c2-col-title c2-sub-title rv">Extension development exposure</h4>
        <div className="c2-grid c2-grid-2">
          {extensions.map((x, i) => (
            <MiniCard key={x.title} icon={x.icon} color={x.color} title={x.title} points={x.points} delay={i} />
          ))}
        </div>

        <p className="c2-note rv">
          My experience across these technologies varies. Some I have used in projects, while others represent basic
          hands-on exposure and exploration.
        </p>

        <div className="section-cta rv">
          <button className="btn" onClick={() => onOpenPanel("skills")}>
            Explore as 3D neural brain <ArrowUpRight size={16} />
          </button>
        </div>
      </section>

      {/* PROJECTS */}
      <section className="panel-section c2" id="projects">
        <SectionHead
          num="04"
          kicker="PROJECTS"
          title="Turning ideas into working applications."
          text="Practical projects that combine full-stack engineering with AI."
        />
        <div className="c2-grid c2-grid-2">
          {featured.map((p, i) => (
            <Card key={p.title} className="c2-project" style={c(p.color, d(i))}>
              <div className="c2-project-top">
                <span className="c2-num">PROJECT {p.num}</span>
                <span className="c2-badge live">
                  <i /> {p.status}
                </span>
              </div>
              <h3>{p.title}</h3>
              <p className="c2-sub">{p.subtitle}</p>
              <p className="c2-desc">{p.description}</p>
              <ul className="c2-list">
                {p.features.map((f) => (
                  <li key={f}>
                    <CheckCircle2 size={15} /> {f}
                  </li>
                ))}
              </ul>
              <div className="c2-chips c2-chips-sm">
                {p.stack.map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </div>
              <p className="c2-contrib">
                <b>My role · </b>
                {p.contribution}
              </p>
              <div className="c2-actions">
                <a className="btn c2-btn" href={p.link.href} target="_blank" rel="noreferrer">
                  <ExternalLink size={15} /> {p.link.label}
                </a>
              </div>
            </Card>
          ))}
        </div>
        <div className="section-cta rv">
          <button className="btn btn-primary" onClick={() => onOpenPanel("projects")}>
            Browse on the 3D laptop <ArrowUpRight size={16} />
          </button>
        </div>
      </section>

      {/* EXPERIENCE */}
      <section className="panel-section c2" id="experience">
        <SectionHead
          num="05"
          kicker="EXPERIENCE"
          title="My industry experience."
          text="Professional exposure to real development workflows and business-oriented solutions."
        />
        <div className="c2-grid c2-grid-2">
          {experience2d.map((e, i) => (
            <Card key={e.role + e.org} className="c2-exp" style={c(i === 0 ? "#59e1d2" : "#a78bfa", d(i))}>
              <div className="c2-exp-top">
                <span className="c2-ico">
                  <Briefcase size={18} />
                </span>
                <div>
                  <h3>{e.role}</h3>
                  <p className="c2-org">{e.org}</p>
                </div>
              </div>
              <div className="c2-meta">
                <span>{e.period}</span>
                <span>{e.type}</span>
              </div>
              <p className="c2-exp-text">{e.text}</p>
              <ul className="c2-list">
                {e.highlights.map((h) => (
                  <li key={h}>
                    <CheckCircle2 size={15} /> {h}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </section>

      {/* EDUCATION + CERTIFICATIONS */}
      <section className="panel-section c2" id="education">
        <SectionHead
          num="06"
          kicker="EDUCATION"
          title="Learning beyond the classroom."
          text="Academic background and structured learning that shaped my technical foundation."
        />
        <Card className="c2-edu c2-edu-wide" style={c("#59e1d2")}>
          <span className="c2-ico c2-ico-lg">
            <GraduationCap size={24} />
          </span>
          <div>
            <h3>Bachelor of Computer Applications (BCA)</h3>
            <p className="c2-org">Chhatrapati Shahu Ji Maharaj University (CSJMU) · UIET, Kanpur</p>
            <p>
              Undergraduate student with an academic focus on computer applications, programming, software
              development and modern computing technologies.
            </p>
          </div>
        </Card>

        <h4 className="c2-col-title c2-sub-title rv">Certifications &amp; learning</h4>
        <div className="c2-grid c2-grid-4">
          {certs.map((x, i) => (
            <Card key={x.issuer} className="c2-cert" style={c(x.color, d(i))}>
              <span className="c2-ico">
                <Award size={20} />
              </span>
              <small>{x.issuer}</small>
              <h3>{x.title}</h3>
              <p>{x.text}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* CURRENTLY EXPLORING */}
      <section className="panel-section c2" id="exploring">
        <SectionHead
          num="07"
          kicker="NOW"
          title="Currently exploring."
          text="Always learning. Here is what I am digging into next."
        />
        <div className="c2-grid c2-grid-4">
          {exploring.map((x, i) => (
            <Card key={x.title} className="c2-service c2-now" style={c(x.color, d(i))}>
              <span className="c2-ico c2-ico-lg">{x.icon}</span>
              <h3>{x.title}</h3>
              <p>{x.text}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* PHILOSOPHY */}
      <section className="panel-section c2" id="philosophy">
        <Card className="c2-quote c2-quote-wide">
          <span className="kicker">BEYOND THE CODE</span>
          <h3>Learn continuously. Build practically. Grow consistently.</h3>
          <p>
            Technology is not just about learning programming languages or frameworks. It is about understanding
            problems and finding practical ways to solve them. Whether it is developing a website, integrating an AI
            API, exploring CRM systems or building an interactive interface, every experience adds something valuable
            to my journey.
          </p>
        </Card>
      </section>

      {/* GAMES */}
      <section className="panel-section c2" id="games">
        <SectionHead
          num="08"
          kicker="GAMES"
          title="Take a break. Play something."
          text="Three tiny 3D games, built for a quick round. Beat your best score."
        />
        <div className="c2-grid c2-grid-3">
          {arcade2d.map((g, i) => (
            <Card key={g.title} className="c2-game" style={c(g.color, d(i))}>
              <span className="c2-ico c2-ico-lg">{g.icon}</span>
              <small>{g.tag}</small>
              <h3>{g.title}</h3>
              <p>{g.text}</p>
              <button className="c2-play" onClick={() => onOpenPanel("play")}>
                PLAY ▸
              </button>
            </Card>
          ))}
        </div>
        <div className="section-cta rv">
          <button className="btn" onClick={onStartGame}>
            <Gamepad2 size={16} /> Or hunt the 5 hidden orbs in the room
          </button>
        </div>
      </section>

      {/* FAQ */}
      <section className="panel-section c2" id="faq">
        <SectionHead
          num="09"
          kicker="FAQ"
          title="Quick answers."
          text="Things people usually ask before getting in touch."
        />
        <div className="c2-faq">
          {faqs.map((f, i) => (
            <Card key={f.q} className="c2-faq-item" style={d(i)}>
              <details>
                <summary>
                  <Sparkles size={16} />
                  <span>{f.q}</span>
                  <ChevronDown size={18} className="c2-faq-chev" />
                </summary>
                <p>{f.a}</p>
              </details>
            </Card>
          ))}
        </div>
      </section>

      {/* CONTACT */}
      <section className="panel-section c2" id="contact">
        <Card className="c2-contact">
          <div>
            <span className="kicker">10 · CONTACT</span>
            <h2>
              Let&apos;s connect &amp;
              <br />
              create something meaningful.
            </h2>
            <p>
              I&apos;m always interested in connecting with developers, technology enthusiasts and professionals who
              enjoy building innovative digital solutions. Reach out for discussions, collaborations and
              development-related opportunities.
            </p>
            <div className="c2-tags">
              {["Internships", "Collaborations", "Open Source", "Learning"].map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>
            <div className="contact-links">
              <button className="btn btn-primary" onClick={() => onOpenPanel("contact")}>
                <MessageCircle size={16} /> Message on WhatsApp
              </button>
              <a className="btn" href={`mailto:${SOCIAL.email}`}>
                <Mail size={16} /> Email
              </a>
              <a className="btn" href={SOCIAL.github} target="_blank" rel="noreferrer">
                <Github size={16} /> GitHub
              </a>
              <a className="btn" href={SOCIAL.linkedin} target="_blank" rel="noreferrer">
                <Linkedin size={16} /> LinkedIn
              </a>
            </div>
          </div>
        </Card>
      </section>
    </>
  );
}