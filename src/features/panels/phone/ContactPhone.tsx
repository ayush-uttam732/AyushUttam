import { useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import {
  ArrowLeft,
  ArrowUpRight,
  Github,
  Linkedin,
  MessageCircle,
  RotateCcw,
  Send,
  X,
} from "lucide-react";

import { Phone3D } from "./Phone3D";
import { contact, whatsappLink } from "../../../data/contact";
import { SOCIAL } from "../../../utils/constants";
import "../../../styles/contact-phone.css";

type ContactPhoneProps = {
  onClose: () => void;
};

type View = "lock" | "card" | "chat";

type Message = {
  id: number;
  from: "me" | "him";
  text: string;
};

export function ContactPhone({ onClose }: ContactPhoneProps) {
  const [view, setView] = useState<View>("lock");
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, from: "him", text: contact.greeting },
  ]);
  const [now, setNow] = useState(() => new Date());
  const screenRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (view !== "lock") return;

    const timer = window.setTimeout(() => setView("card"), 2600);
    return () => window.clearTimeout(timer);
  }, [view]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 15000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const sendMessage = () => {
    const text = draft.trim();
    if (!text) return;

    setMessages((previous) => [
      ...previous,
      { id: Date.now(), from: "me", text },
    ]);
    setDraft("");
    setView("chat");

    window.open(
      whatsappLink(text),
      "_blank",
      "noopener,noreferrer",
    );
  };

  const resetPhone = () => {
    setView("lock");
    setDraft("");
    setMessages([{ id: Date.now(), from: "him", text: contact.greeting }]);
  };

  const time = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const date = now.toLocaleDateString([], {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="contact-phone-overlay" role="dialog" aria-modal="true" aria-label="Contact Ayush">
      {/* Transparent canvas: existing home scene stays visible behind it. */}
      <div className="contact-phone-canvas">
        <Canvas
          dpr={[1, 1.5]}
          gl={{ alpha: true, antialias: true }}
          camera={{ position: [0, 0, 6], fov: 35, near: 0.1, far: 60 }}
        >
          <Phone3D awake screenRef={screenRef} />
        </Canvas>
      </div>

      {/* Screen: real HTML, pinned onto the 3D phone glass by Phone3D every frame. */}
      <div ref={screenRef} className={`contact-phone-screen view-${view}`}>
        <div className="phone-statusbar">
          <span>{time}</span>
          <span className="phone-status-icons">● ▰ ▰</span>
        </div>

        {view === "lock" && (
          <button
            type="button"
            className="phone-lock-screen"
            onClick={() => setView("card")}
            aria-label="Unlock contact phone"
          >
            <span className="phone-lock-icon">
              <MessageCircle size={26} />
            </span>
            <span className="phone-lock-time">{time}</span>
            <span className="phone-lock-date">{date}</span>
            <span className="phone-lock-hint">Tap to connect</span>
            <span className="phone-lock-bar" />
          </button>
        )}

        {view === "card" && (
          <div className="phone-contact-view">
            <header className="phone-appbar">
              <span className="phone-app-mark">AU.</span>
              <span>CONTACT</span>
              <button type="button" onClick={resetPhone} aria-label="Replay phone intro">
                <RotateCcw size={15} />
              </button>
            </header>

            <div className="phone-profile">
              <div className="phone-avatar">AU<span>.</span></div>
              <span className="phone-online">
                <span />
                AVAILABLE FOR OPPORTUNITIES
              </span>
              <h2>Ayush Uttam</h2>
              <p>Full-Stack Web Developer</p>
              <p className="phone-greeting">{contact.greeting}</p>
            </div>

            <div className="phone-links">
              <a href={SOCIAL.github} target="_blank" rel="noreferrer">
                <Github size={17} />
                <span>GitHub</span>
                <ArrowUpRight size={15} />
              </a>
              <a href={SOCIAL.linkedin} target="_blank" rel="noreferrer">
                <Linkedin size={17} />
                <span>LinkedIn</span>
                <ArrowUpRight size={15} />
              </a>
            </div>

            <button
              type="button"
              className="phone-primary-action"
              onClick={() => setView("chat")}
            >
              <MessageCircle size={17} />
              Say hello
            </button>

            <div className="phone-bottom-nav">
              <button type="button" onClick={resetPhone} aria-label="Back to lock screen">
                <RotateCcw size={15} />
              </button>
              <button type="button" onClick={() => setView("chat")}>
                Open chat <ArrowUpRight size={14} />
              </button>
            </div>
          </div>
        )}

        {view === "chat" && (
          <div className="phone-chat-view">
            <header className="phone-chat-header">
              <button type="button" onClick={() => setView("card")} aria-label="Back to contact">
                <ArrowLeft size={17} />
              </button>
              <div className="phone-chat-avatar">AU</div>
              <div className="phone-chat-person">
                <strong>Ayush Uttam</strong>
                <span>Usually replies on WhatsApp</span>
              </div>
              <button type="button" onClick={onClose} aria-label="Close contact">
                <X size={17} />
              </button>
            </header>

            <div className="phone-chat-messages">
              <div className="phone-chat-date">TODAY</div>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`phone-message ${message.from === "me" ? "mine" : "theirs"}`}
                >
                  {message.text}
                  <span>{time}</span>
                </div>
              ))}
              <p className="phone-chat-note">
                Your message opens in WhatsApp so you can send it there.
              </p>
            </div>

            <form
              className="phone-chat-composer"
              onSubmit={(event) => {
                event.preventDefault();
                sendMessage();
              }}
            >
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Type a message..."
                aria-label="Your message"
              />
              <button type="submit" disabled={!draft.trim()} aria-label="Send message">
                <Send size={17} />
              </button>
            </form>
          </div>
        )}

        <div className="phone-home-indicator" />
      </div>

      <button
        type="button"
        className="contact-phone-close"
        onClick={onClose}
        aria-label="Close contact phone"
        title="Close"
      >
        <X size={19} />
      </button>

      <p className="contact-phone-hint">✦ A little closer to connecting</p>
    </div>
  );
}