// src/globe/tessellate.js
//
// Triangle meshes for ONE country, on demand (hover and selection highlights). The base map is a texture,
// so only the highlighted country ever needs geometry. Polygons are triangulated in the lon/lat plane
// (three's earcut), then split until every edge is short so the surface hugs the sphere instead of cutting
// chords through it.

import { ShapeUtils, Vector2 } from 'three';
import { lonLatToDir } from './geo.js';

const toVec2 = (flat) => {
  const out = [];
  for (let i = 0; i < flat.length; i += 2) out.push(new Vector2(flat[i], flat[i + 1]));
  return out;
};

/** Ground-ish length in degrees of the lon/lat edge a→b (longitude shrinks with latitude). */
const edgeLen = (ax, ay, bx, by) => {
  const c = Math.max(0.25, Math.cos(((ay + by) / 2) * (Math.PI / 180)));
  return Math.hypot((bx - ax) * c, by - ay);
};

/**
 * @param {Float64Array[]} rings  outer ring then holes (flat lon/lat, unwrapped)
 * @param {number} radius         sphere radius
 * @param {number} maxEdgeDeg     longest allowed edge
 * @returns {Float32Array}        non-indexed triangle positions (9 floats per triangle)
 */
export function tessellateRings(rings, radius, maxEdgeDeg = 1.5) {
  const contour = toVec2(rings[0]);
  const holes = rings.slice(1).map(toVec2);
  const faces = ShapeUtils.triangulateShape(contour, holes); // mutates the arrays (drops closing duplicates)
  const all = [...contour, ...holes.flat()];

  const out = [];
  const stack = [];
  for (const [a, b, c] of faces) stack.push([all[a].x, all[a].y, all[b].x, all[b].y, all[c].x, all[c].y]);

  let guard = 400000;
  while (stack.length && guard-- > 0) {
    const t = stack.pop();
    const l01 = edgeLen(t[0], t[1], t[2], t[3]);
    const l12 = edgeLen(t[2], t[3], t[4], t[5]);
    const l20 = edgeLen(t[4], t[5], t[0], t[1]);
    const longest = Math.max(l01, l12, l20);
    if (longest <= maxEdgeDeg) {
      for (let k = 0; k < 6; k += 2) out.push(...lonLatToDir(t[k], t[k + 1], radius));
      continue;
    }
    // Split the longest edge at its midpoint.
    if (longest === l01) {
      const mx = (t[0] + t[2]) / 2;
      const my = (t[1] + t[3]) / 2;
      stack.push([t[0], t[1], mx, my, t[4], t[5]], [mx, my, t[2], t[3], t[4], t[5]]);
    } else if (longest === l12) {
      const mx = (t[2] + t[4]) / 2;
      const my = (t[3] + t[5]) / 2;
      stack.push([t[0], t[1], t[2], t[3], mx, my], [t[0], t[1], mx, my, t[4], t[5]]);
    } else {
      const mx = (t[4] + t[0]) / 2;
      const my = (t[5] + t[1]) / 2;
      stack.push([t[0], t[1], t[2], t[3], mx, my], [mx, my, t[2], t[3], t[4], t[5]]);
    }
  }
  return Float32Array.from(out);
}

/** All of a country's polygons as one triangle soup. Cached per country. */
const cache = new Map();
export function tessellateCountry(country, radius, maxEdgeDeg = 1.5) {
  const key = `${country.index}:${radius}:${maxEdgeDeg}`;
  let hit = cache.get(key);
  if (!hit) {
    const parts = country.polygons.map((p) => tessellateRings(p.rings, radius, maxEdgeDeg));
    const total = parts.reduce((s, p) => s + p.length, 0);
    hit = new Float32Array(total);
    let o = 0;
    for (const p of parts) {
      hit.set(p, o);
      o += p.length;
    }
    cache.set(key, hit);
    if (cache.size > 24) cache.delete(cache.keys().next().value); // keep memory bounded
  }
  return hit;
}
