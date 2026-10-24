// src/sphere/math.js
//
// Pure maths for the sphere background (no DOM, no React) so it can be unit-tested with `npm test`.
//
// Conventions
//   - The sphere has unit radius and is centred on the origin. Model point = (cosφ·sinλ, sinφ, cosφ·cosλ),
//     i.e. the model pole is +Y and λ = 0 faces the viewer when the orientation is the identity.
//   - Screen space: +x right, +y up, +z towards the viewer. The projection is orthographic: we are
//     looking at a tiny, very zoomed-in patch of a huge sphere, so perspective would be invisible.
//   - The camera is FIXED. Scrolling DOWN rolls the sphere about the horizontal screen axis (X), like a
//     ball under your finger, by DEGREES_PER_SCREEN for every screen (viewport height) scrolled.
//     A rotation about X leaves every point's screen x unchanged, so everything on the sphere moves
//     exactly VERTICALLY. Patterns therefore put the sphere's pole on the X axis (rz = -90) and
//     align their lattices to it: lines run along or across the motion, never diagonally, which is
//     what made the old tilted patterns read as zig-zag.

export const TAU = Math.PI * 2;
export const HALF_PI = Math.PI / 2;
export const D2R = Math.PI / 180;

/** Rotation applied for one page length (one viewport height) of scrolling. */
export const DEGREES_PER_SCREEN = 45;

/**
 * The viewport's longer side spans this fraction of the sphere's DIAMETER, i.e. only the centre
 * 30% of the sphere is ever on screen. Lower = more zoomed in and flatter, higher = more curvature.
 */
export const VISIBLE_FRACTION = 0.3;

export const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));

// 3×3 row-major matrices as plain arrays.
const mul = (a, b) => {
  const r = new Array(9);
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      r[i * 3 + j] = a[i * 3] * b[j] + a[i * 3 + 1] * b[3 + j] + a[i * 3 + 2] * b[6 + j];
    }
  }
  return r;
};

export const rotX = (a) => {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [1, 0, 0, 0, c, -s, 0, s, c];
};

export const rotY = (a) => {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [c, 0, s, 0, 1, 0, -s, 0, c];
};

export const rotZ = (a) => {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [c, -s, 0, s, c, 0, 0, 0, 1];
};

/**
 * Model → view rotation for a scroll position.
 * @param {number} screens  scroll position in screens (scrollY / viewport height)
 * @param {{rx?:number, ry?:number, rz?:number}} [base]  fixed starting orientation in degrees,
 *        applied in the order rx, rz, ry. The model pole starts at +Y:
 *        rz = -90 puts it on the X (rotation) axis (keep ry = 0 there: a pole off the axis turns the pattern as it rolls);
 *        rx = 90 puts it in the middle of the screen at scroll 0.
 */
export function orientation(screens, base = {}) {
  const theta = screens * DEGREES_PER_SCREEN * D2R;
  const b = mul(rotY((base.ry ?? 0) * D2R), mul(rotZ((base.rz ?? 0) * D2R), rotX((base.rx ?? 0) * D2R)));
  return mul(rotX(-theta), b);
}

/**
 * Everything a pattern needs to draw one frame.
 * `v` (the third row of M) is the model-space point that faces the viewer: a model point p is on
 * screen only if it is close to v. That is how patterns cull everything outside the window.
 */
export function makeFrame({ W, H, screens, base, fraction = VISIBLE_FRACTION }) {
  const S = Math.max(W, H) / (2 * fraction); // px per unit of sphere radius
  const M = orientation(screens, base);
  const v = [M[6], M[7], M[8]];
  return {
    W,
    H,
    S,
    M,
    v,
    cx: W / 2,
    cy: H / 2,
    phiC: Math.asin(clamp(v[1], -1, 1)), // model latitude at the screen centre
    lamC: Math.atan2(v[0], v[2]), // model longitude at the screen centre
    rho: Math.asin(Math.min(1, Math.hypot(W, H) / (2 * S))), // angular radius covering the whole viewport
    o: [0, 0], // scratch output for projectLL
  };
}

/** Project a (longitude, latitude) point. Writes screen x,y into `o` and returns depth (>0 = facing us). */
export function projectLL(f, lam, phi, o) {
  const cp = Math.cos(phi);
  const x = cp * Math.sin(lam);
  const y = Math.sin(phi);
  const z = cp * Math.cos(lam);
  const M = f.M;
  o[0] = f.cx + f.S * (M[0] * x + M[1] * y + M[2] * z);
  o[1] = f.cy - f.S * (M[3] * x + M[4] * y + M[5] * z);
  return M[6] * x + M[7] * y + M[8] * z;
}

/**
 * Bounding latitude/longitude window of the visible cap (padded by `pad` radians).
 * Includes the full circle of longitudes when the window touches a pole.
 */
export function lonWindow(f, pad = 0) {
  const r = Math.min(f.rho + pad, HALF_PI);
  const lo = f.phiC - r;
  const hi = f.phiC + r;
  const phi0 = Math.max(lo, -HALF_PI);
  const phi1 = Math.min(hi, HALF_PI);
  if (hi >= HALF_PI || lo <= -HALF_PI) return { phi0, phi1, lam0: -Math.PI, lam1: Math.PI, polar: true };

  const s = Math.sin(r) / Math.cos(f.phiC);
  if (s >= 1) return { phi0, phi1, lam0: -Math.PI, lam1: Math.PI, polar: false };
  const d = Math.asin(s);
  return { phi0, phi1, lam0: f.lamC - d, lam1: f.lamC + d, polar: false };
}

/** Mercator helpers: conformal (square-cell) grids on the sphere. */
export const merc = (phi) => Math.asinh(Math.tan(phi));
export const gd = (y) => Math.atan(Math.sinh(y));

/** Cheap deterministic hash → [0, 1). */
export const hash2 = (a, b) => {
  const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453123;
  return x - Math.floor(x);
};
