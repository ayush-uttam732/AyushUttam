
import { ArrowUpRight, Mail } from "lucide-react";

const CONTACT_EMAIL = "your-email@example.com";

export function ContactPanel() {
  return (
    <div className="contact-content">
      <div className="contact-icon">
        <Mail size={26} />
      </div>

      <p>
        Have an interesting project, collaboration, or idea? I'd love
        to hear about it.
      </p>

      <a
        className="panel-action"
        href={`mailto:${CONTACT_EMAIL}`}
      >
        <Mail size={17} />
        Let's talk
        <ArrowUpRight size={16} />
      </a>

      <span className="contact-note">
        Usually happy to discuss interesting ideas.
      </span>
    </div>
  );
}
