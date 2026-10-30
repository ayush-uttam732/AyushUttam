import type { Project } from '../../../types';

export const ACCENTS = ['#2dd4bf', '#a78bfa', '#fb923c', '#38bdf8', '#f472b6', '#facc15'];
export const accentOf = (i: number) => ACCENTS[i % ACCENTS.length];

const SANS = 'ui-sans-serif, system-ui, "Segoe UI", Roboto, sans-serif';
const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

/**
 * Texture size in pixels. Saari drawing 1024x640 ke "logical" space me hoti hai aur 2x scale hoti hai,
 * isliye badi screen par bhi image aur text sharp dikhte hain.
 */
export const SCREEN_W = 2048;
export const SCREEN_H = 1280;
const LW = 1024;
const LH = 640;
/** floating cards ka canvas bhi 2x (CARD_SIZES logical size hain) */
export const CARD_SCALE = 2;
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
  const W = LW;
  const H = LH;
  const top = 50; // browser bar
  const bottom = 62; // title strip (image ke upar overlay nahi, taaki image poori dikhe)
  const ah = H - top - bottom;
  c.fillStyle = '#0a0814';
  c.fillRect(0, 0, W, H);

  const kc = Math.max(W / img.width, ah / img.height); // cover
  const kt = Math.min(W / img.width, ah / img.height); // contain

  c.save();
  c.beginPath();
  c.rect(0, top, W, ah);
  c.clip();

  // 1) peeche image ki dhundhli, dark copy (side ki khali jagah bharti hai)
  c.filter = 'blur(40px)';
  c.drawImage(img, (W - img.width * kc) / 2, top + (ah - img.height * kc) / 2, img.width * kc, img.height * kc);
  c.filter = 'none';
  c.fillStyle = 'rgba(7,6,13,.5)';
  c.fillRect(0, top, W, ah);

  // 2) asli image: poori dikhti hai. Aspect lagbhag same ho to cover (zero khali jagah).
  const k = kc / kt < 1.1 ? kc : kt;
  const dw = img.width * k;
  const dh = img.height * k;
  const dx = (W - dw) / 2;
  const dy = top + (ah - dh) / 2;
  c.drawImage(img, dx, dy, dw, dh);
  if (k === kt && kc / kt >= 1.1) {
    c.strokeStyle = 'rgba(255,255,255,.14)';
    c.lineWidth = 1;
    c.strokeRect(dx + 0.5, dy + 0.5, dw - 1, dh - 1);
  }
  c.restore();

  // title strip
  c.fillStyle = '#0f0d1a';
  c.fillRect(0, H - bottom, W, bottom);
  c.fillStyle = col;
  c.fillRect(0, H - bottom, W, 2);
  c.textBaseline = 'middle';
  c.textAlign = 'left';
  c.fillStyle = '#fff';
  c.font = `700 24px ${SANS}`;
  c.fillText(p.title, 32, H - bottom / 2 + 2);
  c.fillStyle = col;
  c.font = `500 14px ${MONO}`;
  c.textAlign = 'right';
  c.fillText(p.tags.slice(0, 4).join('  ·  '), W - 32, H - bottom / 2 + 2);
  c.textAlign = 'left';

  // browser bar
  c.fillStyle = '#14111f';
  c.fillRect(0, 0, W, top);
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
  const W = LW;
  const H = LH;
  c.setTransform(cv.width / LW, 0, 0, cv.height / LH, 0, 0);
  c.imageSmoothingEnabled = true;
  c.imageSmoothingQuality = 'high';
  c.textAlign = 'left';
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

function prep(cv: HTMLCanvasElement, idx: number) {
  const [w, h] = CARD_SIZES[idx];
  const c = cv.getContext('2d')!;
  c.setTransform(cv.width / w, 0, 0, cv.height / h, 0, 0);
  c.textAlign = 'left';
  return { c, w, h };
}

export function drawCards(cvs: HTMLCanvasElement[], p: Project, i: number, total: number) {
  const col = accentOf(i);

  // A: title card
  {
    const { c, w, h } = prep(cvs[0], 0);
    glass(c, w, h, col);
    c.textBaseline = 'alphabetic';
    c.fillStyle = '#8a84a3';
    c.font = `500 17px ${MONO}`;
    c.fillText(`PROJECT ${String(i + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`, 28, 46);
    c.fillStyle = col;
    c.font = `700 38px ${SANS}`;
    wrap(c, p.title, 28, 106, w - 56, 46, 2);
  }

  // B: description card
  {
    const { c, w, h } = prep(cvs[1], 1);
    glass(c, w, h, col);
    ['#ff5f57', '#febc2e', '#28c840'].forEach((k, n) => {
      c.fillStyle = k;
      c.beginPath();
      c.arc(32 + n * 22, 34, 6, 0, 7);
      c.fill();
    });
    c.fillStyle = '#e8e4f7';
    c.font = `500 21px ${MONO}`;
    c.textBaseline = 'alphabetic';
    wrap(c, p.description, 28, 88, w - 56, 34, 5);
  }

  // C: stack chips
  {
    const { c, w, h } = prep(cvs[2], 2);
    glass(c, w, h, col);
    let x = 26;
    c.font = `700 20px ${MONO}`;
    c.textBaseline = 'middle';
    for (const s of p.tags) {
      const cw = c.measureText(s).width + 34;
      if (x + cw > w - 20) break;
      c.fillStyle = hexA(col, 0.16);
      rr(c, x, 33, cw, 44, 22);
      c.fill();
      c.strokeStyle = hexA(col, 0.7);
      c.lineWidth = 2;
      c.stroke();
      c.fillStyle = '#fff';
      c.fillText(s, x + 17, 56);
      x += cw + 12;
    }
  }
}