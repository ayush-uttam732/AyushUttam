import { CanvasTexture, Color, RepeatWrapping, SRGBColorSpace } from "three";

type Draw = (ctx: CanvasRenderingContext2D, w: number, h: number) => void;

/** HDR-ish colour (values above 1) so Bloom picks it up. */
export const glow = (hex: string, strength = 2.5) =>
  new Color(hex).multiplyScalar(strength);

export function makeTexture(width: number, height: number, draw: Draw) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  draw(ctx, width, height);

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function random(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/* ---------------------------------------------------------------- floor */

export function woodFloorTexture() {
  const texture = makeTexture(1024, 1024, (ctx, w, h) => {
    const rand = random(7);
    const planks = 16;
    const plankW = w / planks;

    for (let i = 0; i < planks; i++) {
      const light = 15 + rand() * 9;
      ctx.fillStyle = `hsl(22, 34%, ${light}%)`;
      ctx.fillRect(i * plankW, 0, plankW, h);

      // grain
      for (let g = 0; g < 26; g++) {
        const x = i * plankW + rand() * plankW;
        ctx.strokeStyle = `rgba(${rand() > 0.5 ? "0,0,0" : "255,190,140"}, ${
          0.04 + rand() * 0.06
        })`;
        ctx.lineWidth = 1 + rand() * 1.5;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + (rand() - 0.5) * 8, h);
        ctx.stroke();
      }

      // end joint
      const jointY = rand() * h;
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(i * plankW, jointY, plankW, 2);

      // seam
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(i * plankW, 0, 2, h);
    }
  });

  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.repeat.set(6, 6);
  return texture;
}

export function rugTexture() {
  return makeTexture(512, 512, (ctx, w, h) => {
    const rand = random(21);
    const n = 10;
    const cw = w / n;
    const ch = h / n;

    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const base = (r + c) % 2 === 0 ? [74, 66, 86] : [46, 40, 58];
        const j = rand() * 18 - 9;
        ctx.fillStyle = `rgb(${base[0] + j}, ${base[1] + j}, ${base[2] + j})`;
        ctx.fillRect(c * cw, r * ch, cw, ch);
      }
    }

    // shaggy speckle
    for (let i = 0; i < 9000; i++) {
      ctx.fillStyle =
        rand() > 0.5
          ? `rgba(255,255,255,${rand() * 0.07})`
          : `rgba(0,0,0,${rand() * 0.12})`;
      ctx.fillRect(rand() * w, rand() * h, 2, 2);
    }
  });
}

/* ------------------------------------------------------------- paintings */

export function mountainTexture() {
  return makeTexture(1024, 700, (ctx, w, h) => {
    const rand = random(33);

    const sky = ctx.createLinearGradient(0, 0, 0, h * 0.8);
    sky.addColorStop(0, "#15133a");
    sky.addColorStop(0.42, "#5a2d63");
    sky.addColorStop(0.78, "#e0714f");
    sky.addColorStop(1, "#f7b36c");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    // stars
    for (let i = 0; i < 90; i++) {
      ctx.fillStyle = `rgba(255,255,255,${0.2 + rand() * 0.6})`;
      ctx.fillRect(rand() * w, rand() * h * 0.4, 2, 2);
    }

    // sun glow
    const glowGrad = ctx.createRadialGradient(
      w * 0.5, h * 0.64, 10, w * 0.5, h * 0.64, w * 0.5,
    );
    glowGrad.addColorStop(0, "rgba(255,190,120,0.75)");
    glowGrad.addColorStop(1, "rgba(255,190,120,0)");
    ctx.fillStyle = glowGrad;
    ctx.fillRect(0, 0, w, h);

    // distant ridge
    ctx.fillStyle = "#4a2a52";
    ctx.beginPath();
    ctx.moveTo(0, h * 0.78);
    for (let x = 0; x <= w; x += 16) {
      ctx.lineTo(x, h * 0.7 + Math.sin(x * 0.012) * 18 + rand() * 8);
    }
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.fill();

    // volcano
    ctx.fillStyle = "#2c1b38";
    ctx.beginPath();
    ctx.moveTo(w * 0.08, h * 0.84);
    ctx.lineTo(w * 0.41, h * 0.36);
    ctx.lineTo(w * 0.5, h * 0.31);
    ctx.lineTo(w * 0.59, h * 0.36);
    ctx.lineTo(w * 0.92, h * 0.84);
    ctx.closePath();
    ctx.fill();

    // snow cap
    ctx.fillStyle = "rgba(235,200,215,0.85)";
    ctx.beginPath();
    ctx.moveTo(w * 0.41, h * 0.36);
    ctx.lineTo(w * 0.5, h * 0.31);
    ctx.lineTo(w * 0.59, h * 0.36);
    ctx.lineTo(w * 0.56, h * 0.4);
    ctx.lineTo(w * 0.53, h * 0.375);
    ctx.lineTo(w * 0.5, h * 0.42);
    ctx.lineTo(w * 0.46, h * 0.38);
    ctx.lineTo(w * 0.44, h * 0.41);
    ctx.closePath();
    ctx.fill();

    // foreground silhouette
    ctx.fillStyle = "#110c1b";
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = 0; x <= w; x += 8) {
      ctx.lineTo(x, h * 0.87 + Math.sin(x * 0.03) * 8 + rand() * 6);
    }
    ctx.lineTo(w, h);
    ctx.fill();

    // tiny building lights
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = "rgba(255,200,120,0.8)";
      ctx.fillRect(rand() * w, h * 0.9 + rand() * h * 0.08, 3, 3);
    }
  });
}

export function wallpaperTexture() {
  return makeTexture(512, 330, (ctx, w, h) => {
    const sky = ctx.createLinearGradient(0, 0, 0, h * 0.6);
    sky.addColorStop(0, "#2b5d9a");
    sky.addColorStop(1, "#c8dcee");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = "#42607c";
    ctx.beginPath();
    ctx.moveTo(w * 0.05, h * 0.62);
    ctx.lineTo(w * 0.38, h * 0.3);
    ctx.lineTo(w * 0.5, h * 0.17);
    ctx.lineTo(w * 0.62, h * 0.3);
    ctx.lineTo(w * 0.95, h * 0.62);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#f2f6fb";
    ctx.beginPath();
    ctx.moveTo(w * 0.42, h * 0.27);
    ctx.lineTo(w * 0.5, h * 0.17);
    ctx.lineTo(w * 0.58, h * 0.27);
    ctx.lineTo(w * 0.53, h * 0.3);
    ctx.lineTo(w * 0.5, h * 0.26);
    ctx.lineTo(w * 0.46, h * 0.31);
    ctx.closePath();
    ctx.fill();

    const lake = ctx.createLinearGradient(0, h * 0.6, 0, h);
    lake.addColorStop(0, "#5a86b4");
    lake.addColorStop(1, "#1d3350");
    ctx.fillStyle = lake;
    ctx.fillRect(0, h * 0.6, w, h * 0.4);

    // taskbar
    ctx.fillStyle = "rgba(10,18,32,0.85)";
    ctx.fillRect(0, h - 22, w, 22);
  });
}

export function codeTexture() {
  return makeTexture(512, 330, (ctx, w, h) => {
    const rand = random(55);
    ctx.fillStyle = "#0a111f";
    ctx.fillRect(0, 0, w, h);

    // title bar + sidebar
    ctx.fillStyle = "#101a2d";
    ctx.fillRect(0, 0, w, 20);
    ctx.fillRect(0, 20, 90, h - 20);
    ["#ff6b6b", "#ffd166", "#59e1d2"].forEach((c, i) => {
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(14 + i * 14, 10, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // sidebar rows
    for (let i = 0; i < 14; i++) {
      ctx.fillStyle = "rgba(140,160,200,0.35)";
      ctx.fillRect(10, 34 + i * 18, 30 + rand() * 40, 5);
    }

    // code lines
    const colors = ["#59e1d2", "#9b85ff", "#ffb86e", "#6fa8ff", "#e78cdb", "#7d8bad"];
    for (let i = 0; i < 24; i++) {
      let x = 110 + Math.floor(rand() * 4) * 18;
      const y = 34 + i * 12;
      const words = 1 + Math.floor(rand() * 4);
      for (let k = 0; k < words; k++) {
        const len = 16 + rand() * 60;
        ctx.fillStyle = colors[Math.floor(rand() * colors.length)];
        ctx.fillRect(x, y, len, 4);
        x += len + 8;
      }
    }

    // minimap
    ctx.fillStyle = "rgba(100,130,190,0.2)";
    ctx.fillRect(w - 50, 24, 40, h - 30);
  });
}

/* ------------------------------------------------------------ city night */

export function cityTexture() {
  return makeTexture(1024, 1024, (ctx, w, h) => {
    const rand = random(91);

    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, "#050924");
    sky.addColorStop(0.55, "#1a1747");
    sky.addColorStop(1, "#4a2070");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < 220; i++) {
      ctx.fillStyle = `rgba(255,255,255,${0.15 + rand() * 0.7})`;
      const s = rand() > 0.9 ? 3 : 2;
      ctx.fillRect(rand() * w, rand() * h * 0.5, s, s);
    }

    const skyline = (
      color: string,
      count: number,
      minH: number,
      maxH: number,
      lit: number,
    ) => {
      let x = -20;
      for (let i = 0; i < count; i++) {
        const bw = 40 + rand() * 70;
        const bh = minH + rand() * (maxH - minH);
        ctx.fillStyle = color;
        ctx.fillRect(x, h - bh, bw, bh);

        for (let wy = h - bh + 12; wy < h - 10; wy += 14) {
          for (let wx = x + 6; wx < x + bw - 6; wx += 12) {
            if (rand() < lit) {
              ctx.fillStyle = rand() > 0.3 ? "#ffcf8a" : "#8fd3ff";
              ctx.globalAlpha = 0.5 + rand() * 0.5;
              ctx.fillRect(wx, wy, 5, 7);
              ctx.globalAlpha = 1;
            }
          }
        }
        x += bw + rand() * 6;
        if (x > w) break;
      }
    };

    skyline("#141a40", 22, 160, 520, 0.28);

    // tall landmark spire
    const sx = w * 0.3;
    ctx.fillStyle = "#0e1230";
    ctx.fillRect(sx - 60, h - 560, 120, 560);
    ctx.fillRect(sx - 42, h - 700, 84, 140);
    ctx.fillRect(sx - 26, h - 800, 52, 100);
    ctx.fillRect(sx - 12, h - 870, 24, 70);
    ctx.fillRect(sx - 2, h - 960, 4, 90);
    const spireGlow = ctx.createRadialGradient(sx, h - 820, 4, sx, h - 820, 120);
    spireGlow.addColorStop(0, "rgba(255,170,230,0.8)");
    spireGlow.addColorStop(1, "rgba(255,170,230,0)");
    ctx.fillStyle = spireGlow;
    ctx.fillRect(sx - 130, h - 960, 260, 300);
    ctx.fillStyle = "#ffd6f2";
    ctx.fillRect(sx - 18, h - 840, 36, 6);
    ctx.fillRect(sx - 30, h - 770, 60, 5);

    for (let wy = h - 540; wy < h - 20; wy += 14) {
      for (let wx = sx - 52; wx < sx + 52; wx += 12) {
        if (rand() < 0.5) {
          ctx.fillStyle = "#ffcf8a";
          ctx.fillRect(wx, wy, 5, 7);
        }
      }
    }

    skyline("#0a0d26", 18, 120, 400, 0.4);

    // street glow
    const street = ctx.createLinearGradient(0, h - 140, 0, h);
    street.addColorStop(0, "rgba(255,110,200,0)");
    street.addColorStop(1, "rgba(255,110,200,0.28)");
    ctx.fillStyle = street;
    ctx.fillRect(0, h - 140, w, 140);
  });
}

/* ------------------------------------------------------------------ neon */

export function drawNeon(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d")!;
  const { width: w, height: h } = canvas;
  ctx.clearRect(0, 0, w, h);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "600 150px Caveat, 'Brush Script MT', cursive";

  ["Good", "Code", "Good", "Life"].forEach((line, i) => {
    const y = h * (0.14 + i * 0.24);
    ctx.shadowColor = "#ff8a2b";
    ctx.shadowBlur = 42;
    ctx.fillStyle = "#ffb457";
    ctx.fillText(line, w / 2, y);
    ctx.shadowBlur = 12;
    ctx.fillStyle = "#fff0d2";
    ctx.fillText(line, w / 2, y);
  });
  ctx.shadowBlur = 0;
}

export function neonTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 768;
  drawNeon(canvas);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

/* ------------------------------------------------------------- small art */

export function bookCoverTexture() {
  return makeTexture(512, 360, (ctx, w, h) => {
    ctx.fillStyle = "#2a2838";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(255,200,140,0.35)";
    ctx.lineWidth = 3;
    ctx.strokeRect(18, 18, w - 36, h - 36);
    ctx.fillStyle = "#f1d7ae";
    ctx.textAlign = "center";
    ctx.font = "600 38px Georgia, serif";
    ctx.fillText("Better Developers", w / 2, h * 0.5);
    ctx.fillText("Build Better Worlds.", w / 2, h * 0.5 + 48);
  });
}

export function photoWallTexture() {
  return makeTexture(512, 400, (ctx, w, h) => {
    const rand = random(12);
    ctx.fillStyle = "#17161d";
    ctx.fillRect(0, 0, w, h);

    // pegboard dots
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    for (let y = 8; y < h; y += 16) {
      for (let x = 8; x < w; x += 16) ctx.fillRect(x, y, 2, 2);
    }

    // pinned photos
    for (let i = 0; i < 22; i++) {
      const pw = 46 + rand() * 40;
      const ph = 40 + rand() * 40;
      const px = rand() * (w - pw);
      const py = rand() * (h - ph);
      ctx.save();
      ctx.translate(px + pw / 2, py + ph / 2);
      ctx.rotate((rand() - 0.5) * 0.3);
      ctx.fillStyle = "#e9e4da";
      ctx.fillRect(-pw / 2, -ph / 2, pw, ph);
      ctx.fillStyle = `hsl(${Math.floor(rand() * 360)}, 35%, ${30 + rand() * 25}%)`;
      ctx.fillRect(-pw / 2 + 4, -ph / 2 + 4, pw - 8, ph - 14);
      ctx.restore();
    }
  });
}