import * as THREE from 'three';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { cerebellumPoint, cerebrumPoint, stemPoint, type ShapePoint } from './BrainShape';

/**
 * Unit icosphere ko `shape` se brain ke hisse me badalta hai.
 * `aDepth` attribute (0 = sulcus/groove, 1 = gyrus) shader me fold-shading ke kaam aata hai.
 */
function build(detail: number, shape: (x: number, y: number, z: number) => ShapePoint, withNormals: boolean) {
  let geo: THREE.BufferGeometry = new THREE.IcosahedronGeometry(1, detail);
  geo.deleteAttribute('normal');
  geo.deleteAttribute('uv');
  geo = mergeVertices(geo, 1e-4);
  const p = geo.attributes.position as THREE.BufferAttribute;
  const depth = new Float32Array(p.count);
  for (let i = 0; i < p.count; i++) {
    const [x, y, z, d] = shape(p.getX(i), p.getY(i), p.getZ(i));
    p.setXYZ(i, x, y, z);
    depth[i] = d;
  }
  geo.setAttribute('aDepth', new THREE.BufferAttribute(depth, 1));
  if (withNormals) geo.computeVertexNormals();
  return geo;
}

/** Solid glow meshes (normals ke saath) */
export const makeCerebrum = () => build(48, cerebrumPoint, true);
export const makeCerebellum = () => build(22, cerebellumPoint, true);
export const makeStem = () => build(12, stemPoint, true);

/** Neural mesh (wireframe + node dots) ke liye low-res version. */
export const makeCerebrumLowRes = () => build(7, cerebrumPoint, false);