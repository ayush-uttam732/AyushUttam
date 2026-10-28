import type { Project } from '../../../types';

export const ACCENTS = ['#2dd4bf', '#a78bfa', '#fb923c', '#38bdf8', '#f472b6', '#facc15'];
export const accentOf = (i: number) => ACCENTS[i % ACCENTS.length];

const SANS = 'ui-sans-serif, system-ui, "Segoe UI", Roboto, sans-serif';
const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

export const SCREEN_W = 1024;
export const SCREEN_H = 640;
export const CARD_SIZES: [number, number][] = [
  [420, 200],
  [460, 260],
  [560, 110],
];

function hexA(h: string, a: number) {
  const n = parseInt(h.slice(1), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
}

function rr(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

/** Text ko maxW me wrap karke likhta hai, last y return karta hai. */
function wrap(c: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lh: number, maxLines: number) {
  const words = text.split(' ');
  let line = '';
  let lines = 0;
  for (let i = 0; i < words.length; i++) {
    const t = line ? `${line} ${words[i]}` : words[i];
    if (line && c.measureText(t).width > maxW) {
      lines++;
      const last = lines === maxLines;
      c.fillText(last ? `${line}…` : line, x, y);
      if (last) return y;
      y += lh;
      line = words[i];
    } else line = t;
  }
  c.fillText(line, x, y);
  return y;
}


const imgCache = new Map<string, HTMLImageElement | null>();

/** "images/x.jpg" ko Vite BASE_URL ke saath resolve karta hai, http(s) link jaisa hai waisa rehta hai. */
export function resolveImageUrl(src: string) {
  if (/^(https?:)?\/\//.test(src) || src.startsWith('data:')) return src;
  return import.meta.env.BASE_URL + src.replace(/^\//, '');
}

export function getCachedImage(src?: string) {
  return src ? (imgCache.get(src) ?? null) : null;
}

/** Image load karta hai (cache ke saath). Fail hone par null deta hai, tab generated design dikhta hai. */
export function loadProjectImage(src?: string): Promise<HTMLImageElement | null> {
  if (!src) return Promise.resolve(null);
  if (imgCache.has(src)) return Promise.resolve(imgCache.get(src) ?? null);
  return new Promise((resolve) => {
    const img = new Image();
    const url = resolveImageUrl(src);
    if (/^(https?:)?\/\//.test(url)) img.crossOrigin = 'anonymous';
    img.onload = () => {
      imgCache.set(src, img);
      resolve(img);
    };
    img.onerror = () => {
      imgCache.set(src, null);
      resolve(null);
    };
    img.src = url;
  });
}

function drawImageScreen(
  c: CanvasRenderingContext2D,
  p: Project,
  i: number,
  total: number,
  img: HTMLImageElement,
  col: string,
) {
  const W = SCREEN_W;
  const H = SCREEN_H;
  c.fillStyle = '#0a0814';
  c.fillRect(0, 0, W, H);

  // asli project image (cover-fit)
  const ay = 50;
  const ah = H - ay;
  const k = Math.max(W / img.width, ah / img.height);
  const dw = img.width * k;
  const dh = img.height * k;
  c.save();
  c.beginPath();
  c.rect(0, ay, W, ah);
  c.clip();
  c.drawImage(img, (W - dw) / 2, ay + (ah - dh) / 2, dw, dh);
  c.restore();

  // neeche gradient + title
  const g = c.createLinearGradient(0, H - 190, 0, H);
  g.addColorStop(0, 'rgba(7,6,13,0)');
  g.addColorStop(1, 'rgba(7,6,13,.94)');
  c.fillStyle = g;
  c.fillRect(0, H - 190, W, 190);
  c.textBaseline = 'alphabetic';
  c.fillStyle = '#fff';
  c.font = `700 36px ${SANS}`;
  c.fillText(p.title, 40, H - 62);
  c.fillStyle = col;
  c.font = `500 16px ${MONO}`;
  c.fillText(p.tags.join('  ·  '), 40, H - 28);

  // browser bar
  c.fillStyle = '#14111f';
  c.fillRect(0, 0, W, 50);
  ['#ff5f57', '#febc2e', '#28c840'].forEach((kk, n) => {
    c.fillStyle = kk;
    c.beginPath();
    c.arc(28 + n * 24, 25, 7, 0, 7);
    c.fill();
  });
  c.fillStyle = '#1d1930';
  rr(c, 130, 11, 560, 28, 14);
  c.fill();
  c.fillStyle = '#9a93b8';
  c.font = `16px ${MONO}`;
  c.textBaseline = 'middle';
  c.fillText(`ayushuttam.dev/projects/${p.id}`, 150, 26);
  c.fillStyle = '#8a84a3';
  c.textAlign = 'right';
  c.fillText(`${String(i + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`, W - 24, 26);
  c.textAlign = 'left';
}

export function drawScreen(cv: HTMLCanvasElement, p: Project, i: number, total: number, img?: HTMLImageElement | null) {
  const c = cv.getContext('2d')!;
  const col = accentOf(i);
  const W = SCREEN_W;
  const H = SCREEN_H;
  c.clearRect(0, 0, W, H);
  if (img) {
    drawImageScreen(c, p, i, total, img, col);
    return;
  }
  c.fillStyle = '#0a0814';
  c.fillRect(0, 0, W, H);
  const g = c.createRadialGradient(W * 0.72, H * 0.35, 10, W * 0.72, H * 0.35, W * 0.7);
  g.addColorStop(0, hexA(col, 0.45));
  g.addColorStop(1, 'rgba(10,8,20,0)');
  c.fillStyle = g;
  c.fillRect(0, 0, W, H);

  // browser bar
  c.fillStyle = '#14111f';
  c.fillRect(0, 0, W, 50);
  ['#ff5f57', '#febc2e', '#28c840'].forEach((k, n) => {
    c.fillStyle = k;
    c.beginPath();
    c.arc(28 + n * 24, 25, 7, 0, 7);
    c.fill();
  });
  c.fillStyle = '#1d1930';
  rr(c, 130, 11, 560, 28, 14);
  c.fill();
  c.fillStyle = '#9a93b8';
  c.font = `16px ${MONO}`;
  c.textBaseline = 'middle';
  c.fillText(`ayushuttam.dev/projects/${p.id}`, 150, 26);

  c.fillStyle = '#8a84a3';
  c.font = `14px ${MONO}`;
  c.fillText(`PROJECT ${String(i + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`, 48, 92);

  // title
  c.textBaseline = 'alphabetic';
  c.fillStyle = '#ffffff';
  c.font = `700 58px ${SANS}`;
  const yEnd = wrap(c, p.title, 48, 170, 560, 66, 2);

  // description
  c.fillStyle = '#b7b1d0';
  c.font = `19px ${MONO}`;
  const yd = wrap(c, p.description, 48, yEnd + 56, 540, 30, 4);

  // buttons
  const by = Math.min(yd + 40, 420);
  c.fillStyle = col;
  rr(c, 48, by, 190, 50, 25);
  c.fill();
  c.fillStyle = '#07060d';
  c.font = `700 15px ${MONO}`;
  c.textBaseline = 'middle';
  c.fillText('VIEW PROJECT ↗', 70, by + 26);
  c.strokeStyle = 'rgba(255,255,255,.3)';
  c.lineWidth = 2;
  rr(c, 254, by, 140, 50, 25);
  c.stroke();
  c.fillStyle = '#fff';
  c.fillText('SOURCE', 288, by + 26);

  // art: wireframe squares
  c.save();
  c.translate(810, 290);
  for (let n = 0; n < 5; n++) {
    const s = 170 - n * 28;
    c.strokeStyle = hexA(col, 0.9 - n * 0.14);
    c.lineWidth = 2.5;
    c.save();
    c.rotate(0.35 + n * 0.18);
    c.strokeRect(-s / 2, -s / 2, s, s);
    c.restore();
  }
  c.fillStyle = hexA(col, 0.9);
  c.beginPath();
  c.arc(0, 0, 16, 0, 7);
  c.fill();
  c.restore();

  // tags as cards
  const tags = p.tags.slice(0, 3);
  tags.forEach((t, n) => {
    const x = 48 + n * 322;
    c.fillStyle = 'rgba(255,255,255,.06)';
    rr(c, x, 505, 296, 100, 14);
    c.fill();
    c.strokeStyle = 'rgba(255,255,255,.1)';
    c.lineWidth = 1;
    c.stroke();
    c.fillStyle = hexA(col, 0.9);
    rr(c, x + 20, 525, 34, 34, 9);
    c.fill();
    c.fillStyle = '#e8e4f7';
    c.font = `700 17px ${SANS}`;
    c.textBaseline = 'middle';
    c.fillText(t, x + 68, 543);
    c.fillStyle = '#7d7798';
    c.fillRect(x + 20, 576, 200 - n * 30, 7);
  });
}

function glass(c: CanvasRenderingContext2D, w: number, h: number, col: string) {
  c.clearRect(0, 0, w, h);
  const g = c.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, 'rgba(24,20,40,.94)');
  g.addColorStop(1, 'rgba(12,10,22,.94)');
  c.fillStyle = g;
  rr(c, 3, 3, w - 6, h - 6, 22);
  c.fill();
  c.strokeStyle = hexA(col, 0.8);
  c.lineWidth = 3;
  c.stroke();
}

export function drawCards(cvs: HTMLCanvasElement[], p: Project, i: number, total: number) {
  const col = accentOf(i);

  // A: title card
  let cv = cvs[0];
  let c = cv.getContext('2d')!;
  glass(c, cv.width, cv.height, col);
  c.textBaseline = 'alphabetic';
  c.fillStyle = '#8a84a3';
  c.font = `500 17px ${MONO}`;
  c.fillText(`PROJECT ${String(i + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`, 28, 46);
  c.fillStyle = col;
  c.font = `700 38px ${SANS}`;
  wrap(c, p.title, 28, 106, cv.width - 56, 46, 2);

  // B: description card
  cv = cvs[1];
  c = cv.getContext('2d')!;
  glass(c, cv.width, cv.height, col);
  ['#ff5f57', '#febc2e', '#28c840'].forEach((k, n) => {
    c.fillStyle = k;
    c.beginPath();
    c.arc(32 + n * 22, 34, 6, 0, 7);
    c.fill();
  });
  c.fillStyle = '#e8e4f7';
  c.font = `500 21px ${MONO}`;
  wrap(c, p.description, 28, 88, cv.width - 56, 34, 5);

  // C: stack chips
  cv = cvs[2];
  c = cv.getContext('2d')!;
  glass(c, cv.width, cv.height, col);
  let x = 26;
  c.font = `700 20px ${MONO}`;
  c.textBaseline = 'middle';
  for (const s of p.tags) {
    const w = c.measureText(s).width + 34;
    if (x + w > cv.width - 20) break;
    c.fillStyle = hexA(col, 0.16);
    rr(c, x, 33, w, 44, 22);
    c.fill();
    c.strokeStyle = hexA(col, 0.7);
    c.lineWidth = 2;
    c.stroke();
    c.fillStyle = '#fff';
    c.fillText(s, x + 17, 56);
    x += w + 12;
  }
}