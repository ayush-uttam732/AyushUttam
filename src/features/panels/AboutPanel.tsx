import { experience } from "../../data/experience";
import { stagger } from "../../lib/animations";

export function AboutPanel() {
  return (
    <div className="about-content">
      <div className="about-intro reveal" style={stagger(0)}>
        <span className="about-symbol">{"</>"}</span>
        <p>
          I like turning ideas into interactive, polished experiences — from
          pixel-perfect interfaces to full 3D worlds that run right in the
          browser.
        </p>
      </div>

      <h3 className="section-label reveal" style={stagger(1)}>
        EXPERIENCE
      </h3>

      <div className="experience-list">
        {experience.map((item, index) => (
          <div
            className="experience-item reveal"
            style={stagger(index + 2)}
            key={`${item.period}-${item.role}`}
          >
            <span className="experience-marker" />
            <div className="experience-details">
              <span className="experience-period">{item.period}</span>
              <h4>{item.role}</h4>
              <p className="experience-organization">{item.organization}</p>
              <p className="experience-description">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}