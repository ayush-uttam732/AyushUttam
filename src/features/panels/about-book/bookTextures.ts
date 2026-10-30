import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from "three";
import type { Texture } from "three";

import { about } from "../../../data/about";

/* ------------------------------------------------------------------ sizes */

export const PAGE_W = 2;
export const PAGE_H = 2.8;
export const COVER_MARGIN = 0.12;
export const COVER_W = PAGE_W + COVER_MARGIN;
export const COVER_H = PAGE_H + COVER_MARGIN * 2;

const PPU = 400; // canvas pixels per world unit
const PW = PAGE_W * PPU; // 800
const PH = PAGE_H * PPU; // 1120
const M = COVER_MARGIN * PPU; // 48

/* ----------------------------------------------------------------- styling */

const INK = "#1d1b27";
const SOFT = "#4a4658";
const TEAL = "#0f9f93";
const PURPLE = "#6c4fe0";
const AMBER = "#b8721e";
const PAPER_A = "#f6eedd";
const PAPER_B = "#e9ddc3";

const HEAD = '"Space Grotesk", "Inter", "Segoe UI", sans-serif';
const BODY = '"Inter", "Segoe UI", sans-serif';
const HAND = '"Caveat", "Segoe Script", "Brush Script MT", cursive';

type Ctx = CanvasRenderingContext2D;

function rand(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function spacing(ctx: Ctx, px: number) {
  (ctx as unknown as { letterSpacing: string }).letterSpacing = `${px}px`;
}

function rr(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrap(ctx: Ctx, text: string, maxW: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** Draws wrapped text, returns the y after the last line. */
function paragraph(
  ctx: Ctx,
  text: string,
  x: number,
  y: number,
  maxW: number,
  lineHeight: number,
) {
  const lines = wrap(ctx, text, maxW);
  lines.forEach((line, i) => ctx.fillText(line, x, y + i * lineHeight));
  return y + lines.length * lineHeight;
}

function label(ctx: Ctx, text: string, x: number, y: number, color = TEAL) {
  ctx.save();
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = color;
  ctx.font = `600 21px ${BODY}`;
  spacing(ctx, 5);
  ctx.fillText(text, x, y);
  ctx.restore();
}

function heading(ctx: Ctx, text: string, x: number, y: number, maxW: number, size = 74) {
  ctx.save();
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = INK;
  ctx.font = `700 ${size}px ${HEAD}`;
  spacing(ctx, -2);
  const end = paragraph(ctx, text, x, y, maxW, size * 1.08);
  ctx.restore();
  return end;
}

function pageNumber(ctx: Ctx, n: string, side: "left" | "right") {
  ctx.save();
  ctx.fillStyle = "rgba(60,50,70,0.55)";
  ctx.font = `500 20px ${BODY}`;
  spacing(ctx, 4);
  ctx.textAlign = side === "left" ? "left" : "right";
  ctx.fillText(n, side === "left" ? 84 : PW - 84, PH - 58);
  ctx.restore();
}

/* ------------------------------------------------------------------ paper */

function drawPaper(
  ctx: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  spineAt: "left" | "right",
) {
  const g = ctx.createLinearGradient(x, y, x + w, y + h);
  g.addColorStop(0, PAPER_A);
  g.addColorStop(1, PAPER_B);
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);

  const r = rand(spineAt === "left" ? 3 : 8);
  for (let i = 0; i < 2600; i++) {
    ctx.fillStyle =
      r() > 0.5 ? `rgba(120,90,50,${r() * 0.05})` : `rgba(255,255,255,${r() * 0.12})`;
    ctx.fillRect(x + r() * w, y + r() * h, 2, 2);
  }

  // shadow where the page curves into the spine
  const s0 = spineAt === "left" ? x : x + w;
  const s1 = spineAt === "left" ? x + 120 : x + w - 120;
  const sg = ctx.createLinearGradient(s0, 0, s1, 0);
  sg.addColorStop(0, "rgba(60,38,18,0.34)");
  sg.addColorStop(1, "rgba(60,38,18,0)");
  ctx.fillStyle = sg;
  ctx.fillRect(Math.min(s0, s1), y, 120, h);

  // soft edge on the free side
  const e0 = spineAt === "left" ? x + w : x;
  const e1 = spineAt === "left" ? x + w - 26 : x + 26;
  const eg = ctx.createLinearGradient(e0, 0, e1, 0);
  eg.addColorStop(0, "rgba(90,60,30,0.16)");
  eg.addColorStop(1, "rgba(90,60,30,0)");
  ctx.fillStyle = eg;
  ctx.fillRect(Math.min(e0, e1), y, 26, h);
}

function makeCanvas(w: number, h: number) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  return { canvas, ctx: canvas.getContext("2d")! };
}

function toTexture(canvas: HTMLCanvasElement, mirror: boolean) {
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 16;

  if (mirror) {
    // seen from behind a plane the picture is flipped, so flip it back
    texture.wrapS = RepeatWrapping;
    texture.repeat.x = -1;
    texture.offset.x = 1;
  }
  return texture;
}

/** An inside page. "right" = spine on the left, "left" = spine on the right. */
function innerPage(side: "left" | "right", draw: (ctx: Ctx) => void) {
  const { canvas, ctx } = makeCanvas(PW, PH);
  drawPaper(ctx, 0, 0, PW, PH, side === "right" ? "left" : "right");
  draw(ctx);
  return toTexture(canvas, side === "left");
}

/** The inside of the front cover (a left page, framed by the cover leather). */
function coverInside(draw: (ctx: Ctx) => void) {
  const w = PW + M;
  const h = PH + M * 2;
  const { canvas, ctx } = makeCanvas(w, h);

  ctx.fillStyle = "#14122b";
  ctx.fillRect(0, 0, w, h);
  drawPaper(ctx, M, M, PW, PH, "right");

  ctx.save();
  ctx.translate(M, M);
  draw(ctx);
  ctx.restore();
  return toTexture(canvas, true);
}

/* ------------------------------------------------------------------ cover */

function coverFront() {
  const w = PW + M;
  const h = PH + M * 2;
  const { canvas, ctx } = makeCanvas(w, h);
  const r = rand(5);

  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, "#1d1844");
  g.addColorStop(0.55, "#120f2e");
  g.addColorStop(1, "#0a0b1c");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  for (let i = 0; i < 7000; i++) {
    ctx.fillStyle = r() > 0.5 ? `rgba(255,255,255,${r() * 0.05})` : `rgba(0,0,0,${r() * 0.18})`;
    ctx.fillRect(r() * w, r() * h, 2, 2);
  }

  // spine groove
  const groove = ctx.createLinearGradient(0, 0, 90, 0);
  groove.addColorStop(0, "rgba(0,0,0,0.5)");
  groove.addColorStop(0.55, "rgba(0,0,0,0.12)");
  groove.addColorStop(0.62, "rgba(255,255,255,0.1)");
  groove.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = groove;
  ctx.fillRect(0, 0, 90, h);

  const cx = (w + 70) / 2;

  // foil frame
  ctx.strokeStyle = "rgba(89,225,210,0.6)";
  ctx.lineWidth = 3;
  rr(ctx, 118, 96, w - 118 - 56, h - 192, 18);
  ctx.stroke();
  ctx.strokeStyle = "rgba(89,225,210,0.22)";
  ctx.lineWidth = 1.5;
  rr(ctx, 134, 112, w - 134 - 72, h - 224, 12);
  ctx.stroke();

  // gold corners
  ctx.strokeStyle = "rgba(255,184,110,0.85)";
  ctx.lineWidth = 3;
  const corner = (x: number, y: number, sx: number, sy: number) => {
    ctx.beginPath();
    ctx.moveTo(x, y + sy * 46);
    ctx.lineTo(x, y);
    ctx.lineTo(x + sx * 46, y);
    ctx.stroke();
  };
  corner(150, 128, 1, 1);
  corner(w - 88, 128, -1, 1);
  corner(150, h - 128, 1, -1);
  corner(w - 88, h - 128, -1, -1);

  // circuit emblem
  const ey = 430;
  ctx.save();
  ctx.shadowColor = "rgba(89,225,210,0.9)";
  ctx.shadowBlur = 18;
  ctx.strokeStyle = "rgba(89,225,210,0.9)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, ey, 132, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([6, 12]);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, ey, 98, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const x1 = cx + Math.cos(a) * 132;
    const y1 = ey + Math.sin(a) * 132;
    const x2 = cx + Math.cos(a) * (i % 2 ? 160 : 178);
    const y2 = ey + Math.sin(a) * (i % 2 ? 160 : 178);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.fillStyle = i % 3 === 0 ? "#ffb86e" : "#59e1d2";
    ctx.beginPath();
    ctx.arc(x2, y2, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `700 84px ${HEAD}`;
  ctx.fillStyle = "#59e1d2";
  ctx.shadowColor = "rgba(89,225,210,0.95)";
  ctx.shadowBlur = 26;
  ctx.fillText("</>", cx, ey + 4);
  ctx.restore();

  // name
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.shadowColor = "rgba(89,225,210,0.55)";
  ctx.shadowBlur = 28;
  ctx.fillStyle = "#eefffd";
  ctx.font = `700 132px ${HEAD}`;
  spacing(ctx, -5);
  ctx.fillText("AYUSH", cx, 760);
  ctx.fillText("UTTAM", cx - 10, 892);
  ctx.fillStyle = "#59e1d2";
  const nameWidth = ctx.measureText("UTTAM").width;
  ctx.fillText(".", cx - 10 + nameWidth / 2 + 24, 892);
  ctx.restore();

  // subtitle
  ctx.save();
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,184,110,0.95)";
  ctx.font = `600 24px ${BODY}`;
  spacing(ctx, 13);
  ctx.fillText("ABOUT ME", cx, 1032);
  ctx.fillStyle = "rgba(200,210,235,0.6)";
  ctx.font = `500 17px ${BODY}`;
  spacing(ctx, 6);
  ctx.fillText("SCROLL TO OPEN", cx, 1072);
  ctx.restore();

  return toTexture(canvas, false);
}

/* ------------------------------------------------------------------ pages */

function drawPhoto(ctx: Ctx, photo: HTMLImageElement | null, w: number, h: number) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, w, h);
  ctx.clip();
  ctx.imageSmoothingQuality = "high";

  if (photo) {
    const scale = Math.max(w / photo.width, h / photo.height);
    const iw = photo.width * scale;
    const ih = photo.height * scale;
    // keep faces in frame: bias toward the top of the picture
    ctx.drawImage(photo, (w - iw) / 2, -(ih - h) * 0.22, iw, ih);
  } else {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, "#1c8f89");
    g.addColorStop(1, "#4a37b8");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.beginPath();
    ctx.arc(w * 0.8, h * 0.2, 150, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `700 190px ${HEAD}`;
    spacing(ctx, -6);
    ctx.fillText("AU.", w / 2, h / 2);
  }
  ctx.restore();
}

const L = 84;
const MAXW = PW - L * 2;

/** Shrinks the font until the text fits on one line. */
function fit(ctx: Ctx, text: string, maxW: number, weight: number, size: number, family: string) {
  let s = size;
  ctx.font = `${weight} ${s}px ${family}`;
  while (ctx.measureText(text).width > maxW && s > 20) {
    s -= 2;
    ctx.font = `${weight} ${s}px ${family}`;
  }
}

/** Label + big heading + short colour bar. Returns the y the body can start at. */
function head(ctx: Ctx, tag: string, title: string, color: string, size = 80) {
  label(ctx, tag, L, 120, color);
  const y = heading(ctx, title, L, 226, MAXW, size);
  ctx.fillStyle = color;
  ctx.fillRect(L, y - 30, 90, 6);
  return y + 46;
}

function body(ctx: Ctx, text: string, y: number, size = 38, lineHeight = 58) {
  ctx.save();
  ctx.fillStyle = SOFT;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.font = `400 ${size}px ${BODY}`;
  spacing(ctx, 0);
  const end = paragraph(ctx, text, L, y, MAXW, lineHeight);
  ctx.restore();
  return end;
}

/** Outlined pills that wrap onto new rows. Returns the bottom y. */
function chips(ctx: Ctx, items: string[], y: number, size = 30, height = 62, gap = 16) {
  const colors = [TEAL, PURPLE, AMBER];
  let x = L;
  ctx.save();
  ctx.font = `500 ${size}px ${BODY}`;
  spacing(ctx, 0);
  items.forEach((text, i) => {
    const w = ctx.measureText(text).width + 56;
    if (x + w > PW - L) {
      x = L;
      y += height + gap;
    }
    ctx.strokeStyle = colors[i % 3];
    ctx.lineWidth = 2.5;
    rr(ctx, x, y, w, height, height / 2);
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.fill();
    ctx.fillStyle = INK;
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.fillText(text, x + 28, y + height / 2 + 1);
    x += w + gap;
  });
  ctx.restore();
  return y + height;
}

/** Spread 1, left: photo, name, role, location, availability. */
function pagePhoto(photo: HTMLImageElement | null) {
  return (ctx: Ctx) => {
    label(ctx, "HELLO, WORLD", 90, 112);

    // polaroid
    ctx.save();
    ctx.translate(PW / 2 - 14, 430);
    ctx.rotate(-0.035);
    ctx.shadowColor = "rgba(40,25,10,0.38)";
    ctx.shadowBlur = 34;
    ctx.shadowOffsetY = 16;
    ctx.fillStyle = "#fcf9f2";
    ctx.fillRect(-290, -320, 580, 690);
    ctx.shadowColor = "transparent";

    ctx.save();
    ctx.translate(-266, -296);
    drawPhoto(ctx, photo, 532, 566);
    ctx.restore();

    ctx.fillStyle = AMBER;
    ctx.font = `600 56px ${HAND}`;
    ctx.textAlign = "center";
    spacing(ctx, 0);
    ctx.fillText(about.photoCaption, 0, 338);

    // tape
    ctx.fillStyle = "rgba(255,226,150,0.78)";
    ctx.save();
    ctx.translate(-215, -320);
    ctx.rotate(-0.5);
    ctx.fillRect(-60, -18, 120, 36);
    ctx.restore();
    ctx.save();
    ctx.translate(215, -320);
    ctx.rotate(0.5);
    ctx.fillRect(-60, -18, 120, 36);
    ctx.restore();
    ctx.restore();

    ctx.save();
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";

    // name
    ctx.font = `700 88px ${HEAD}`;
    spacing(ctx, -3);
    ctx.fillStyle = INK;
    ctx.fillText(about.name, 90, 922);
    const nameWidth = ctx.measureText(about.name).width;
    ctx.fillStyle = TEAL;
    ctx.fillText(".", 90 + nameWidth, 922);

    // role + location
    spacing(ctx, 0.5);
    ctx.fillStyle = PURPLE;
    fit(ctx, about.role, MAXW - 10, 600, 30, BODY);
    ctx.fillText(about.role, 92, 976);

    ctx.fillStyle = SOFT;
    fit(ctx, about.location, MAXW - 10, 500, 28, BODY);
    ctx.fillText(about.location, 92, 1018);
    ctx.restore();

    // availability, handwritten
    ctx.save();
    ctx.translate(92, 1082);
    ctx.rotate(-0.02);
    ctx.fillStyle = AMBER;
    spacing(ctx, 0);
    fit(ctx, about.openTo, MAXW - 24, 600, 58, HAND);
    ctx.fillText(about.openTo, 0, 0);
    ctx.restore();
  };
}

/** Spread 1, right. */
function pageIntro(ctx: Ctx) {
  const y = head(ctx, "01 — ABOUT", about.intro.title, TEAL, 76);
  body(ctx, about.intro.text, y + 14);
  pageNumber(ctx, "02", "right");
}

/** Spread 2, left. */
function pageCuriosity(ctx: Ctx) {
  const y = head(ctx, "02 — CURIOSITY", about.curiosity.title, PURPLE);
  body(ctx, about.curiosity.text, y + 14);
  pageNumber(ctx, "03", "left");
}

/** Spread 2, right. */
function pageFacts(ctx: Ctx) {
  const y = head(ctx, "03 — AT A GLANCE", about.factsTitle, AMBER);

  about.facts.forEach((fact, i) => {
    const fy = y + 90 + i * 170;
    ctx.fillStyle = "rgba(29,27,39,0.14)";
    ctx.fillRect(L, fy - 54, MAXW, 2);

    ctx.save();
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = TEAL;
    ctx.font = `600 24px ${BODY}`;
    spacing(ctx, 5);
    ctx.fillText(fact.label, L, fy);

    ctx.fillStyle = INK;
    spacing(ctx, -1);
    fit(ctx, fact.value, MAXW, 700, 62, HEAD);
    ctx.fillText(fact.value, L, fy + 76);
    ctx.restore();
  });

  pageNumber(ctx, "04", "right");
}

/** Spread 3, left. */
function pageSkills(ctx: Ctx) {
  const y = head(ctx, "04 — SKILLS", about.skills.title, TEAL);
  chips(ctx, about.skills.items, y + 10, 32, 68, 16);
  pageNumber(ctx, "05", "left");
}

/** Spread 3, right. */
function pageExperience(ctx: Ctx) {
  const y = head(ctx, "05 — EXPERIENCE", about.experience.title, PURPLE);

  // internship card
  const cy = y + 10;
  ctx.save();
  ctx.strokeStyle = PURPLE;
  ctx.lineWidth = 3;
  rr(ctx, L, cy, MAXW, 250, 28);
  ctx.stroke();
  ctx.fillStyle = "rgba(108,79,224,0.07)";
  ctx.fill();

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = PURPLE;
  ctx.font = `600 22px ${BODY}`;
  spacing(ctx, 5);
  ctx.fillText(about.experience.kicker, L + 36, cy + 60);

  ctx.fillStyle = INK;
  spacing(ctx, -1.5);
  fit(ctx, about.experience.org, MAXW - 72, 700, 60, HEAD);
  ctx.fillText(about.experience.org, L + 36, cy + 142);

  ctx.fillStyle = SOFT;
  ctx.font = `400 30px ${BODY}`;
  spacing(ctx, 0);
  ctx.fillText(about.experience.text, L + 36, cy + 200);
  ctx.restore();

  // zoho
  const zy = body(ctx, about.experience.zohoText, cy + 330, 36, 54);
  chips(ctx, about.experience.zoho, zy + 4, 32, 68, 16);

  pageNumber(ctx, "06", "right");
}

/** Spread 4, left. */
function pageApproach(ctx: Ctx) {
  const y = head(ctx, "06 — HOW I WORK", about.approachTitle, AMBER);
  const colors = [TEAL, PURPLE, AMBER, TEAL];

  about.approach.forEach((item, i) => {
    const iy = y + 20 + i * 172;

    ctx.save();
    ctx.strokeStyle = colors[i];
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(L + 40, iy + 26, 40, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = colors[i];
    ctx.font = `700 32px ${HEAD}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    spacing(ctx, 0);
    ctx.fillText(`0${i + 1}`, L + 40, iy + 28);
    ctx.restore();

    ctx.save();
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = INK;
    ctx.font = `700 48px ${HEAD}`;
    spacing(ctx, -1);
    ctx.fillText(item.title, L + 116, iy + 22);
    ctx.fillStyle = SOFT;
    ctx.font = `400 30px ${BODY}`;
    spacing(ctx, 0);
    paragraph(ctx, item.text, L + 116, iy + 72, MAXW - 116, 42);
    ctx.restore();
  });

  pageNumber(ctx, "07", "left");
}

/** Spread 4, right. */
function pageClosing(ctx: Ctx) {
  const y = head(ctx, "LET'S BUILD", about.closing.title, TEAL, 76);
  body(ctx, about.closing.text, y + 14, 36, 54);

  // sign-off
  ctx.save();
  ctx.translate(L, 950);
  ctx.rotate(-0.04);
  ctx.fillStyle = AMBER;
  spacing(ctx, 0);
  fit(ctx, about.closing.thanks, MAXW - 20, 600, 76, HAND);
  ctx.fillText(about.closing.thanks, 0, 0);
  ctx.font = `600 54px ${HAND}`;
  ctx.fillStyle = PURPLE;
  ctx.fillText(`— ${about.name.split(" ")[0]}`, 6, 70);
  ctx.restore();

  label(ctx, "THE END... FOR NOW", L, PH - 58, "rgba(60,50,70,0.55)");
}

/* ------------------------------------------------------------------ build */

export type BookTextures = {
  coverFront: Texture;
  s1L: Texture;
  s1R: Texture;
  s2L: Texture;
  s2R: Texture;
  s3L: Texture;
  s3R: Texture;
  s4L: Texture;
  s4R: Texture;
  dispose: () => void;
};

export function buildBookTextures(photo: HTMLImageElement | null): BookTextures {
  const list = {
    coverFront: coverFront(),
    s1L: coverInside(pagePhoto(photo)),
    s1R: innerPage("right", pageIntro),
    s2L: innerPage("left", pageCuriosity),
    s2R: innerPage("right", pageFacts),
    s3L: innerPage("left", pageSkills),
    s3R: innerPage("right", pageExperience),
    s4L: innerPage("left", pageApproach),
    s4R: innerPage("right", pageClosing),
  };

  return {
    ...list,
    dispose: () => Object.values(list).forEach((texture) => texture.dispose()),
  };
}