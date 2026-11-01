// src/globe/constellationRing.js
//
// Where the constellations sit, and how the camera flies to one. Pure (no three.js, no DOM): unit-tested in Node.
//
// The constellations lie FLAT on a plane behind the globe (facing the camera) and are placed on a circle around it.
// The whole ring turns anticlockwise in 2D about the globe's centre. Sizes are worked out in screen terms
// (fractions of half the screen height, "NDC height units") so the ring looks the same on any screen shape, then
// converted to world units at the plane's depth.

import { DEG } from './geo.js';

export const PLANE_Z = -1.6; // the constellations' plane, behind the globe's centre
export const RING_SPEED = 0.055; // rad/s, anticlockwise (positive rotation about +Z, seen from the camera)
const OUTER_NDC = 0.96; // outermost reach of a constellation, as a fraction of half the screen height
const MIN_FLY_DISTANCE = 1.2; // the camera may come this close to the globe's centre plane (it slides over the ring, clear of the globe)

/** Half the screen height in world units at the constellations' plane. */
export const planeHalfHeight = (camDist, fovDeg) => (camDist - PLANE_Z) * Math.tan((fovDeg * DEG) / 2);

/** Largest distance of a star from the local origin: the constellation's own radius in local units. */
export const localRadius = (c) => c.stars.reduce((m, s) => Math.max(m, Math.hypot(s[0], s[1])), 0.001);

/**
 * @param {{key:string, stars:number[][]}[]} entries
 * @param {{camDist:number, fovDeg:number, globeNdc:number}} view  globeNdc = the globe's silhouette radius, NDC height units
 * @returns {{items: {key:string, angle:number, ringR:number, scale:number, radius:number}[], innerNdc:number, outerNdc:number, rcNdc:number}}
 */
export function ringLayout(entries, { camDist, fovDeg, globeNdc }) {
  const halfH = planeHalfHeight(camDist, fovDeg);
  const inner0 = globeNdc * 1.22 + 0.03;
  const innerNdc = Math.min(inner0, OUTER_NDC - 0.2); // always leave a ring at least 0.2 thick
  const thickness = OUTER_NDC - innerNdc;
  const rcNdc = Math.min(0.2, Math.max(0.075, 0.4 * thickness));
  const midNdc = innerNdc + thickness / 2;
  const N = Math.max(1, entries.length);

  const items = entries.map((c, i) => {
    // A little deterministic drift in and out so it does not look machined.
    const drift = ((i % 3) - 1) * 0.06 * thickness;
    const rNdc = midNdc + drift;
    return {
      key: c.key,
      angle: Math.PI / 2 + (i * Math.PI * 2) / N, // first one at the top, then anticlockwise
      ringR: rNdc * halfH,
      radius: rcNdc * halfH,
      scale: (rcNdc * halfH) / localRadius(c),
    };
  });
  return { items, innerNdc, outerNdc: OUTER_NDC, rcNdc, midNdc, halfH };
}

/** World position (x, y) of a ring item once the ring has turned by `ringAngle` radians. */
export const ringPosition = (item, ringAngle) => [item.ringR * Math.cos(item.angle + ringAngle), item.ringR * Math.sin(item.angle + ringAngle)];

/**
 * Camera target that centres a constellation and fills `openingPx` (the radius of the space the polaroid
 * columns leave) with it. The camera stays level and just slides over and closes in.
 */
export function flyTo(item, ringAngle, { openingPx, H, fovDeg, baseDist }) {
  const [x, y] = ringPosition(item, ringAngle);
  const tanH = Math.tan((fovDeg * DEG) / 2);
  const targetNdc = (0.9 * openingPx) / (H / 2);
  const dist = PLANE_Z + item.radius / (targetNdc * tanH);
  return { x, y, dist: Math.min(baseDist, Math.max(MIN_FLY_DISTANCE, dist)) };
}
