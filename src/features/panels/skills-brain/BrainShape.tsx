/**
 * Pure math (three.js ke bina): brain ka shape.
 * Axes: x = left/right, y = upar/neeche, z = aage/peeche (+z = frontal lobe).
 * Har function unit-sphere direction leta hai aur [x, y, z, depth] deta hai.
 * depth: 0 = gehra sulcus (groove), 1 = gyrus (ubhra hua hissa).
 */

const sstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

function hash(ix: number, iy: number, iz: number) {
  let h = Math.imul(ix, 374761393) ^ Math.imul(iy, 668265263) ^ Math.imul(iz, 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967295;
}

/** Signed value-noise, range -1..1 */
function sn(x: number, y: number, z: number) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fy = y - iy;
  const fz = z - iz;
  const u = fx * fx * (3 - 2 * fx);
  const v = fy * fy * (3 - 2 * fy);
  const w = fz * fz * (3 - 2 * fz);
  const l = (a: number, b: number, t: number) => a + (b - a) * t;
  const c000 = hash(ix, iy, iz);
  const c100 = hash(ix + 1, iy, iz);
  const c010 = hash(ix, iy + 1, iz);
  const c110 = hash(ix + 1, iy + 1, iz);
  const c001 = hash(ix, iy, iz + 1);
  const c101 = hash(ix + 1, iy, iz + 1);
  const c011 = hash(ix, iy + 1, iz + 1);
  const c111 = hash(ix + 1, iy + 1, iz + 1);
  const r = l(l(l(c000, c100, u), l(c010, c110, u), v), l(l(c001, c101, u), l(c011, c111, u), v), w);
  return r * 2 - 1;
}

export type ShapePoint = [number, number, number, number];

export function cerebrumPoint(ux: number, uy: number, uz: number): ShapePoint {
  const len = Math.hypot(ux, uy, uz) || 1;
  ux /= len;
  uy /= len;
  uz /= len;

  // gyri / sulci: noise ke zero-level lines meandering grooves banati hain (asli brain jaisi)
  const n = 0.62 * sn(ux * 8, uy * 8, uz * 8) + 0.38 * sn(ux * 17 + 7.3, uy * 17 + 1.9, uz * 17 + 4.1);
  const sulcus = 1 - sstep(0, 0.17, Math.abs(n));

  // Sylvian fissure: side me aage-neeche se peeche-upar jaati ek gehri line
  const side = sstep(0.4, 0.8, Math.abs(ux));
  const gy = -0.12 - 0.3 * (uz - 0.1);
  const gd = (uy - gy) / 0.09;
  const groove = Math.exp(-gd * gd) * side * sstep(-0.6, -0.1, uz) * (1 - sstep(0.55, 0.9, uz));

  // Temporal lobe: sylvian ke neeche side me ubhar
  const tz = (uz - 0.2) / 0.55;
  const bulge = side * sstep(-0.05, -0.4, uy) * Math.exp(-tz * tz);

  const r = 1 - 0.07 * sulcus - 0.07 * groove + 0.02 * n;

  let px = ux * r * 0.92;
  let py = uy * r * (uy > 0 ? 0.82 : 0.64); // upar se gumbad, neeche se kam
  let pz = uz * r * 1.22;

  // frontal lobe thoda patla, occipital (peeche) thoda nukila aur neecha
  const front = sstep(0, 1, uz);
  px *= 1 - 0.14 * front;
  const back = sstep(0.2, 1, -uz);
  px *= 1 - 0.12 * back;
  py *= 1 - 0.1 * back;

  // neeche se flat, temporal lobe neeche tak aata hai
  if (py < -0.26) py = -0.26 + (py + 0.26) * 0.3;
  py -= 0.2 * bulge;

  // dono hemispheres ke beech gehri longitudinal fissure
  const top = sstep(0, 0.45, uy);
  const fis = Math.exp(-(px * px) / 0.005) * top;
  py -= 0.26 * fis;

  return [px, py, pz, 1 - Math.max(sulcus, groove, fis * 0.9)];
}

/** Cerebellum: peeche-neeche, patli horizontal ridges ke saath. */
export function cerebellumPoint(ux: number, uy: number, uz: number): ShapePoint {
  const len = Math.hypot(ux, uy, uz) || 1;
  ux /= len;
  uy /= len;
  uz /= len;
  const ridge = 0.5 + 0.5 * Math.sin(uy * 34 + ux * 2);
  const r = 1 - 0.05 * (1 - ridge);
  const x = ux * r * 0.6;
  let y = uy * r * 0.26;
  const z = uz * r * 0.4;
  y -= 0.03 * Math.exp(-(x * x) / 0.004) * sstep(0, 0.5, uy); // beech ki halki line
  return [x, y - 0.42, z - 0.8, 0.25 + 0.75 * ridge];
}

/** Brainstem: neeche nikalta hua chhota tana. */
export function stemPoint(ux: number, uy: number, uz: number): ShapePoint {
  const len = Math.hypot(ux, uy, uz) || 1;
  ux /= len;
  uy /= len;
  uz /= len;
  return [ux * 0.15, uy * 0.34 - 0.5, uz * 0.16 - 0.34 - uy * 0.06, 0.55];
}