import { Anchor } from "./Anchor";

/* Glowing spots, positions are 0..1 on the image. */
const glows = [
  { id: "neon", x: 0.151, y: 0.18, d: 0.28, size: 15, className: "glow-neon" },
  { id: "lamp", x: 0.4, y: 0.304, d: 0.4, size: 11, className: "glow-lamp" },
  { id: "moon", x: 0.949, y: 0.722, d: 0.66, size: 17, className: "glow-moon" },
  { id: "pc", x: 0.705, y: 0.352, d: 0.4, size: 11, className: "glow-pc" },
  { id: "mon-l", x: 0.485, y: 0.352, d: 0.4, size: 13, className: "glow-screen" },
  { id: "mon-r", x: 0.569, y: 0.348, d: 0.4, size: 13, className: "glow-screen glow-screen-b" },
  { id: "shelf", x: 0.285, y: 0.14, d: 0.36, size: 14, className: "glow-shelf" },
];

/* tiny deterministic random so the layout is stable between renders */
function rand(seed: number) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

const stars = Array.from({ length: 16 }, (_, i) => ({
  id: i,
  x: 0.9 + rand(i + 1) * 0.09,
  y: 0.015 + rand(i + 40) * 0.15,
  delay: rand(i + 80) * 4,
  size: 2 + Math.round(rand(i + 120) * 2),
}));

const dust = Array.from({ length: 30 }, (_, i) => ({
  id: i,
  x: 0.08 + rand(i + 200) * 0.88,
  y: 0.15 + rand(i + 300) * 0.7,
  size: 2 + rand(i + 400) * 3,
  duration: 9 + rand(i + 500) * 10,
  delay: -rand(i + 600) * 14,
  depth: 0.2 + rand(i + 700) * 0.7,
}));

export function AmbientEffects() {
  return (
    <>
      <div className="glow-layer" aria-hidden="true">
        {glows.map((glow) => (
          <Anchor
            key={glow.id}
            x={glow.x}
            y={glow.y}
            depth={glow.d}
            className={`glow ${glow.className}`}
            style={{ width: `${glow.size}%` }}
          />
        ))}

        {stars.map((star) => (
          <Anchor
            key={star.id}
            x={star.x}
            y={star.y}
            depth={0.04}
            className="star"
            style={{
              width: star.size,
              height: star.size,
              animationDelay: `${star.delay}s`,
            }}
          />
        ))}
      </div>

      <div className="dust-layer" aria-hidden="true">
        {dust.map((mote) => (
          <Anchor
            key={mote.id}
            x={mote.x}
            y={mote.y}
            depth={mote.depth}
            className="dust"
            style={{
              width: mote.size,
              height: mote.size,
              animationDuration: `${mote.duration}s`,
              animationDelay: `${mote.delay}s`,
            }}
          />
        ))}
      </div>
    </>
  );
}