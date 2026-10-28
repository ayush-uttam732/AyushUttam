import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from "three";
import type { Texture } from "three";

import { about } from "../../../data/about";
import { experience } from "../../../data/experience";
import { SOCIAL } from "../../../utils/constants";

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
  texture.anisotropy = 8;

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
  ctx.fillText("THE STORY SO FAR", cx, 1072);
  ctx.restore();

  return toTexture(canvas, false);
}

/* ------------------------------------------------------------------ pages */

function drawPhoto(ctx: Ctx, photo: HTMLImageElement | null, w: number, h: number) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, w, h);
  ctx.clip();

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

function pagePhoto(photo: HTMLImageElement | null) {
  return (ctx: Ctx) => {
    label(ctx, "HELLO, WORLD", 90, 112);

    // polaroid
    ctx.save();
    ctx.translate(PW / 2 - 14, 440);
    ctx.rotate(-0.035);
    ctx.shadowColor = "rgba(40,25,10,0.38)";
    ctx.shadowBlur = 34;
    ctx.shadowOffsetY = 16;
    ctx.fillStyle = "#fcf9f2";
    ctx.fillRect(-290, -330, 580, 700);
    ctx.shadowColor = "transparent";

    ctx.save();
    ctx.translate(-266, -306);
    drawPhoto(ctx, photo, 532, 566);
    ctx.restore();

    ctx.fillStyle = AMBER;
    ctx.font = `600 50px ${HAND}`;
    ctx.textAlign = "center";
    spacing(ctx, 0);
    ctx.fillText(about.photoCaption, 0, 336);

    // tape
    ctx.fillStyle = "rgba(255,226,150,0.78)";
    ctx.save();
    ctx.translate(-215, -330);
    ctx.rotate(-0.5);
    ctx.fillRect(-60, -18, 120, 36);
    ctx.restore();
    ctx.save();
    ctx.translate(215, -330);
    ctx.rotate(0.5);
    ctx.fillRect(-60, -18, 120, 36);
    ctx.restore();
    ctx.restore();

    // name + role
    ctx.save();
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.font = `700 70px ${HEAD}`;
    spacing(ctx, -2);
    ctx.fillStyle = INK;
    ctx.fillText(about.name, 90, 925);
    const nameWidth = ctx.measureText(about.name).width;
    ctx.fillStyle = TEAL;
    ctx.fillText(".", 90 + nameWidth, 925);
    ctx.restore();

    label(ctx, about.role, 92, 975, PURPLE);

    ctx.save();
    ctx.translate(92, 1050);
    ctx.rotate(-0.025);
    ctx.fillStyle = AMBER;
    ctx.font = `600 54px ${HAND}`;
    spacing(ctx, 0);
    ctx.fillText(about.signature, 0, 0);
    ctx.restore();

  };
}

function pageWho(ctx: Ctx) {
  const L = 84;
  const maxW = PW - L * 2;

  label(ctx, "01 — WHO AM I", L, 120);
  let y = heading(ctx, about.who.title, L, 226, maxW, 80);

  ctx.fillStyle = TEAL;
  ctx.fillRect(L, y - 30, 90, 6);

  ctx.fillStyle = SOFT;
  ctx.font = `400 31px ${BODY}`;
  spacing(ctx, 0);
  y += 40;
  for (const text of about.who.paragraphs) {
    y = paragraph(ctx, text, L, y, maxW, 49) + 22;
  }

  // facts
  const top = Math.max(y + 24, 820);
  about.who.facts.forEach((fact, i) => {
    const fy = top + i * 74;
    ctx.fillStyle = "rgba(29,27,39,0.14)";
    ctx.fillRect(L, fy - 38, maxW, 2);
    label(ctx, fact.label, L, fy);
    ctx.save();
    ctx.textAlign = "right";
    ctx.fillStyle = INK;
    ctx.font = `600 32px ${HEAD}`;
    spacing(ctx, -0.5);
    ctx.fillText(fact.value, PW - L, fy + 2);
    ctx.restore();
  });

  pageNumber(ctx, "02", "right");
}

function pageDoing(ctx: Ctx) {
  const L = 84;
  const maxW = PW - L * 2;

  label(ctx, "02 — WHAT I DO", L, 120);
  let y = heading(ctx, about.doing.title, L, 226, maxW, 70);
  ctx.fillStyle = TEAL;
  ctx.fillRect(L, y - 30, 90, 6);

  y += 52;
  about.doing.items.forEach((item, i) => {
    const iy = y + i * 232;

    ctx.save();
    ctx.strokeStyle = i === 1 ? PURPLE : TEAL;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(L + 38, iy + 26, 38, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = i === 1 ? PURPLE : TEAL;
    ctx.font = `700 30px ${HEAD}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    spacing(ctx, 0);
    ctx.fillText(`0${i + 1}`, L + 38, iy + 28);
    ctx.restore();

    ctx.save();
    ctx.textAlign = "left";
    ctx.fillStyle = INK;
    ctx.font = `700 40px ${HEAD}`;
    spacing(ctx, -1);
    ctx.fillText(item.title, L + 110, iy + 18);
    ctx.fillStyle = SOFT;
    ctx.font = `400 28px ${BODY}`;
    spacing(ctx, 0);
    paragraph(ctx, item.text, L + 110, iy + 66, maxW - 110, 42);
    ctx.restore();
  });

  pageNumber(ctx, "03", "left");
}

function pageJourney(ctx: Ctx) {
  const L = 84;
  const maxW = PW - L * 2;

  label(ctx, "THE JOURNEY", L, 120, PURPLE);
  const y = heading(ctx, about.journeyTitle, L, 226, maxW, 70);
  ctx.fillStyle = PURPLE;
  ctx.fillRect(L, y - 30, 90, 6);

  const x0 = L + 14;
  let cy = y + 70;
  const startY = cy - 20;

  experience.forEach((item, i) => {
    ctx.fillStyle = TEAL;
    ctx.beginPath();
    ctx.arc(x0, cy - 12, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(15,159,147,0.35)";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(x0, cy - 12, 22, 0, Math.PI * 2);
    ctx.stroke();

    ctx.save();
    ctx.textAlign = "left";
    label(ctx, item.period, x0 + 54, cy - 6);
    ctx.fillStyle = INK;
    ctx.font = `700 42px ${HEAD}`;
    spacing(ctx, -1);
    ctx.fillText(item.role, x0 + 54, cy + 44);
    ctx.fillStyle = PURPLE;
    ctx.font = `500 26px ${BODY}`;
    spacing(ctx, 0);
    ctx.fillText(item.organization, x0 + 54, cy + 86);
    ctx.fillStyle = SOFT;
    ctx.font = `400 27px ${BODY}`;
    const next = paragraph(ctx, item.description, x0 + 54, cy + 132, maxW - 70, 40);
    ctx.restore();

    cy = next + 70 + (i === experience.length - 1 ? 0 : 0);
  });

  // "next" dot
  ctx.strokeStyle = TEAL;
  ctx.setLineDash([4, 8]);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x0, cy - 12, 13, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.save();
  ctx.fillStyle = AMBER;
  ctx.font = `600 46px ${HAND}`;
  spacing(ctx, 0);
  ctx.fillText("next chapter: your project?", x0 + 54, cy - 2);
  ctx.restore();

  // timeline rail
  ctx.strokeStyle = "rgba(15,159,147,0.4)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x0, startY);
  ctx.lineTo(x0, cy - 30);
  ctx.stroke();

  pageNumber(ctx, "04", "right");
}

function pageBeyond(ctx: Ctx) {
  const L = 84;
  const maxW = PW - L * 2;

  label(ctx, "03 — BEYOND CODE", L, 120, AMBER);
  let y = heading(ctx, about.beyond.title, L, 226, maxW, 70);
  ctx.fillStyle = AMBER;
  ctx.fillRect(L, y - 30, 90, 6);

  // interest chips
  y += 50;
  let x = L;
  ctx.font = `500 30px ${BODY}`;
  spacing(ctx, 0);
  const colors = [TEAL, PURPLE, AMBER];
  about.beyond.interests.forEach((text, i) => {
    const w = ctx.measureText(text).width + 56;
    if (x + w > PW - L) {
      x = L;
      y += 84;
    }
    ctx.strokeStyle = colors[i % 3];
    ctx.lineWidth = 2.5;
    rr(ctx, x, y, w, 58, 29);
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.fill();
    ctx.fillStyle = INK;
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.fillText(text, x + 28, y + 30);
    x += w + 16;
  });

  // handwritten note
  ctx.save();
  ctx.translate(L + 6, Math.max(y + 190, 760));
  ctx.rotate(-0.03);
  ctx.fillStyle = AMBER;
  ctx.textBaseline = "alphabetic";
  ctx.font = `600 62px ${HAND}`;
  spacing(ctx, 0);
  paragraph(ctx, about.beyond.note, 0, 0, maxW - 20, 70);
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = "rgba(184,114,30,0.55)";
  ctx.lineWidth = 3;
  ctx.setLineDash([2, 12]);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(L, 1000);
  ctx.bezierCurveTo(L + 160, 960, L + 300, 1040, L + 460, 990);
  ctx.stroke();
  ctx.restore();

  pageNumber(ctx, "05", "left");
}

function pageClosing(ctx: Ctx) {
  const L = 84;
  const maxW = PW - L * 2;

  label(ctx, "LET'S CONNECT", L, 120);
  let y = heading(ctx, about.closing.title, L, 226, maxW, 74);
  ctx.fillStyle = TEAL;
  ctx.fillRect(L, y - 30, 90, 6);

  ctx.fillStyle = SOFT;
  ctx.font = `400 31px ${BODY}`;
  spacing(ctx, 0);
  y = paragraph(ctx, about.closing.text, L, y + 40, maxW, 49);

  // email box
  y += 34;
  ctx.strokeStyle = TEAL;
  ctx.lineWidth = 3;
  rr(ctx, L, y, maxW, 92, 46);
  ctx.stroke();
  ctx.fillStyle = "rgba(15,159,147,0.08)";
  ctx.fill();
  ctx.fillStyle = INK;
  ctx.font = `600 32px ${HEAD}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(SOCIAL.email, PW / 2, y + 47);

  // links
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = SOFT;
  ctx.font = `500 26px ${BODY}`;
  spacing(ctx, 1);
  const shorten = (url: string) => url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
  ctx.fillText(`GitHub  ·  ${shorten(SOCIAL.github)}`, L, y + 160);
  ctx.fillText(`LinkedIn  ·  ${shorten(SOCIAL.linkedin)}`, L, y + 204);

  // sign-off
  ctx.save();
  ctx.translate(L, 960);
  ctx.rotate(-0.04);
  ctx.fillStyle = AMBER;
  ctx.font = `600 78px ${HAND}`;
  spacing(ctx, 0);
  ctx.fillText(about.closing.thanks, 0, 0);
  ctx.font = `600 52px ${HAND}`;
  ctx.fillStyle = PURPLE;
  ctx.fillText(`— ${about.name.split(" ")[0]}`, 6, 66);
  ctx.restore();

  label(ctx, "THE END... FOR NOW", L, PH - 58, "rgba(60,50,70,0.55)");
}

function blankPage() {
  return innerPage("left", () => undefined);
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
  blank: Texture;
  dispose: () => void;
};

export function buildBookTextures(photo: HTMLImageElement | null): BookTextures {
  const list = {
    coverFront: coverFront(),
    s1L: coverInside(pagePhoto(photo)),
    s1R: innerPage("right", pageWho),
    s2L: innerPage("left", pageDoing),
    s2R: innerPage("right", pageJourney),
    s3L: innerPage("left", pageBeyond),
    s3R: innerPage("right", pageClosing),
    blank: blankPage(),
  };

  return {
    ...list,
    dispose: () => Object.values(list).forEach((texture) => texture.dispose()),
  };
}