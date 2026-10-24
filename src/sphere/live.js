// src/sphere/live.js
//
// Patterns generated on the fly from latitude/longitude, only for the part of the sphere that is
// in view. They need no stored geometry, so they stay cheap at any zoom, and their cell size is
// given in screen pixels so the look is the same on a phone and on a 4K monitor.
//
// Each function draws into a `sink` = { m(x,y), l(x,y), d(x,y,tier) }:
//   m/l  move/line-to for the line layer      d  a dot (tier 0 = normal, 1 = bright)

import { TAU, HALF_PI, lonWindow, projectLL, merc, gd, hash2 } from './math.js';

const SQ3 = Math.sqrt(3);

const PHI_MAX = 89 * (Math.PI / 180); // Mercator grids stop short of the poles
const LAT_MAX = 75 * (Math.PI / 180); // lattice patterns stay clear of the poles, where Mercator stretches
const onScreen = (f, x, y, m = 4) => x > -m && x < f.W + m && y > -m && y < f.H + m;

/**
 * Graticule: parallels + meridians.
 *   mode 'mercator'  square cells everywhere (conformal); meridians thin out towards the poles
 *   mode 'equal'     equal-angle rings and a fixed number of spokes that meet at the pole (a hub)
 */
export function graticule(f, sink, { mode = 'mercator', cellPx = 60, spokes = 0, nodes = false, hub = false, minPx = 10 } = {}) {
  const o = f.o;
  const S = f.S;
  const c = cellPx / S;
  const win = lonWindow(f, c * 2);
  const lim = mode === 'mercator' ? PHI_MAX : HALF_PI;
  const phi0 = Math.max(win.phi0, -lim);
  const phi1 = Math.min(win.phi1, lim);
  const dl = TAU / (spokes || Math.max(24, Math.round(TAU / c))); // meridian spacing; divides 2π exactly

  let k0;
  let k1;
  let phiOf;
  if (mode === 'mercator') {
    k0 = Math.ceil(merc(phi0) / c);
    k1 = Math.floor(merc(phi1) / c);
    phiOf = (k) => gd(k * c);
  } else {
    k0 = Math.ceil(phi0 / c);
    k1 = Math.floor(phi1 / c);
    phiOf = (k) => k * c;
  }

  // Parallels
  const nLon = Math.max(2, Math.ceil((win.lam1 - win.lam0) / c));
  for (let k = k0; k <= k1; k++) {
    const phi = phiOf(k);
    let pen = false;
    for (let i = 0; i <= nLon; i++) {
      const lam = win.lam0 + ((win.lam1 - win.lam0) * i) / nLon;
      if (projectLL(f, lam, phi, o) <= 0) {
        pen = false;
        continue;
      }
      if (pen) sink.l(o[0], o[1]);
      else {
        sink.m(o[0], o[1]);
        pen = true;
      }
    }
  }

  // Meridians (a Mercator grid drops them where they would be closer than minPx)
  const phiCut = mode === 'mercator' ? Math.acos(Math.min(1, minPx / (dl * S))) : HALF_PI;
  const mp0 = Math.max(phi0, -phiCut);
  const mp1 = Math.min(phi1, phiCut);
  const j0 = Math.ceil(win.lam0 / dl);
  const j1 = Math.floor(win.lam1 / dl);
  if (mp1 > mp0) {
    const nLat = Math.max(2, Math.ceil((mp1 - mp0) / c));
    for (let j = j0; j <= j1; j++) {
      const lam = j * dl;
      let pen = false;
      for (let i = 0; i <= nLat; i++) {
        const phi = mp0 + ((mp1 - mp0) * i) / nLat;
        if (projectLL(f, lam, phi, o) <= 0) {
          pen = false;
          continue;
        }
        if (pen) sink.l(o[0], o[1]);
        else {
          sink.m(o[0], o[1]);
          pen = true;
        }
      }
    }
  }

  if (nodes) {
    for (let k = k0; k <= k1; k++) {
      const phi = phiOf(k);
      if (Math.abs(phi) > phiCut) continue;
      for (let j = j0; j <= j1; j++) {
        if (projectLL(f, j * dl, phi, o) > 0 && onScreen(f, o[0], o[1])) sink.d(o[0], o[1], 0);
      }
    }
  }

  if (hub) {
    for (const pole of [HALF_PI, -HALF_PI]) {
      if (projectLL(f, 0, pole, o) > 0 && onScreen(f, o[0], o[1], 20)) sink.d(o[0], o[1], 1);
    }
  }
}

/** Diamond lattice: loxodromes (constant-bearing lines) at ±45°, which tile the sphere with rhombi. */
export function rhombus(f, sink, { cellPx = 70, nodes = true } = {}) {
  const o = f.o;
  const c = cellPx / f.S;
  const d = TAU / Math.max(8, Math.round(TAU / (c * 1.2))); // diamond pitch; divides 2π so the lattice closes
  const win = lonWindow(f, c * 2);
  const lat = 69 * (Math.PI / 180);
  const y0 = merc(Math.max(win.phi0, -lat));
  const y1 = merc(Math.min(win.phi1, lat));
  if (!(y1 > y0)) return;
  const nY = Math.max(2, Math.ceil((y1 - y0) / c));

  for (const sgn of [1, -1]) {
    const kMin = Math.min(win.lam0 - sgn * y0, win.lam0 - sgn * y1);
    const kMax = Math.max(win.lam1 - sgn * y0, win.lam1 - sgn * y1);
    for (let m = Math.ceil(kMin / d); m <= Math.floor(kMax / d); m++) {
      const kappa = m * d;
      let pen = false;
      for (let i = 0; i <= nY; i++) {
        const y = y0 + ((y1 - y0) * i) / nY;
        if (projectLL(f, kappa + sgn * y, gd(y), o) <= 0) {
          pen = false;
          continue;
        }
        if (pen) sink.l(o[0], o[1]);
        else {
          sink.m(o[0], o[1]);
          pen = true;
        }
      }
    }
  }

  // Nodes where a +45° line crosses a -45° line: λ - y = m·d and λ + y = n·d.
  if (nodes) {
    const mMin = Math.floor((win.lam0 - y1) / d);
    const mMax = Math.ceil((win.lam1 - y0) / d);
    const nMin = Math.floor((win.lam0 + y0) / d);
    const nMax = Math.ceil((win.lam1 + y1) / d);
    for (let m = mMin; m <= mMax; m++) {
      for (let n = nMin; n <= nMax; n++) {
        const lam = ((m + n) * d) / 2;
        const y = ((n - m) * d) / 2;
        if (y < y0 || y > y1 || lam < win.lam0 || lam > win.lam1) continue;
        if (projectLL(f, lam, gd(y), o) > 0 && onScreen(f, o[0], o[1])) sink.d(o[0], o[1], 0);
      }
    }
  }
}

/** Dotted parallels with every other ring offset by half a step (like a scan / halftone). */
export function scan(f, sink, { ringPx = 58, dotPx = 15 } = {}) {
  const o = f.o;
  const S = f.S;
  const ring = ringPx / S;
  const win = lonWindow(f, ring * 2);
  const lim = 86 * (Math.PI / 180);
  const k0 = Math.ceil(Math.max(win.phi0, -lim) / ring);
  const k1 = Math.floor(Math.min(win.phi1, lim) / ring);

  for (let k = k0; k <= k1; k++) {
    const phi = k * ring;
    const n = Math.max(8, Math.round((TAU * Math.cos(phi) * S) / dotPx)); // dots on this ring
    const dl = TAU / n;
    const off = (k & 1) * dl * 0.5;
    const tier = k % 4 === 0 ? 1 : 0;
    for (let j = Math.ceil((win.lam0 - off) / dl); j <= Math.floor((win.lam1 - off) / dl); j++) {
      if (projectLL(f, off + j * dl, phi, o) > 0 && onScreen(f, o[0], o[1])) sink.d(o[0], o[1], tier);
    }
  }
}

/** Fine, irregular dust: equal-area rings of jittered points, thinned randomly. */
export function dust(f, sink, { spacingPx = 13 } = {}) {
  const o = f.o;
  const S = f.S;
  const dphi = spacingPx / S;
  const win = lonWindow(f, dphi * 2);
  const k0 = Math.ceil(win.phi0 / dphi);
  const k1 = Math.floor(win.phi1 / dphi);

  for (let k = k0; k <= k1; k++) {
    const phi0 = k * dphi;
    const n = Math.max(1, Math.round((TAU * Math.cos(phi0)) / dphi)); // points on this ring: equal area everywhere
    const dl = TAU / n;
    for (let j = Math.ceil(win.lam0 / dl); j <= Math.floor(win.lam1 / dl); j++) {
      const jm = ((j % n) + n) % n; // wrap so the dust is continuous around the sphere
      const keep = hash2(k * 7 + 1, jm * 13 + 3);
      if (keep < 0.3) continue;
      const lam = j * dl + (hash2(jm, k) - 0.5) * dl * 0.85; // jitter only: j·dl must stay unscaled
      const phi = phi0 + (hash2(k + 211, jm) - 0.5) * dphi * 0.85;
      if (projectLL(f, lam, phi, o) > 0 && onScreen(f, o[0], o[1])) sink.d(o[0], o[1], keep > 0.93 ? 1 : 0);
    }
  }
}

// ── Lattices in the Mercator plane ────────────────────────────────────────────────────────────
// Plane coordinates: u = longitude (runs along the scroll direction = vertical on screen),
// v = Mercator y (runs across it = horizontal on screen). The mapping is conformal, so a regular
// lattice in (u, v) stays regular on the sphere. The lattices are laid out with one family of
// edges across the motion and one pair steeply along it.

const latticeWindow = (f, pad) => {
  const win = lonWindow(f, pad);
  return {
    u0: win.lam0,
    u1: win.lam1,
    v0: merc(Math.max(win.phi0, -LAT_MAX)),
    v1: merc(Math.min(win.phi1, LAT_MAX)),
  };
};

/** Triangular lattice (every node has six neighbours) with a dot on every node. */
export function triangles(f, sink, { cellPx = 84, nodes = true } = {}) {
  const o = f.o;
  const c = cellPx / f.S; // node spacing within a row
  const nRows = 2 * Math.max(4, Math.round(TAU / ((c * SQ3) / 2) / 2)); // even, so the lattice closes around the sphere
  const r = TAU / nRows; // row spacing (u)
  const cc = (2 * r) / SQ3; // in-row spacing (v): equilateral
  const w = latticeWindow(f, c * 3);
  if (!(w.v1 > w.v0)) return;

  const proj = (u, v) => (projectLL(f, u, gd(v), o) > 0 ? true : false);
  const seg = (u0, v0, u1, v1) => {
    if (!proj(u0, v0)) return;
    const x0 = o[0];
    const y0 = o[1];
    if (!proj(u1, v1)) return;
    sink.m(x0, y0);
    sink.l(o[0], o[1]);
  };

  for (let i = Math.floor(w.u0 / r) - 1; i <= Math.ceil(w.u1 / r) + 1; i++) {
    const u = i * r;
    const off = (((i % 2) + 2) % 2) * 0.5;
    for (let j = Math.floor(w.v0 / cc - off) - 1; j <= Math.ceil(w.v1 / cc - off) + 1; j++) {
      const v = (j + off) * cc;
      seg(u, v, u, v + cc); // along the row (across the motion)
      seg(u, v, u + r, v + cc / 2); // to the two nodes in the next row
      seg(u, v, u + r, v - cc / 2);
      if (nodes && v >= w.v0 && v <= w.v1 && u >= w.u0 && u <= w.u1 && proj(u, v) && onScreen(f, o[0], o[1])) {
        sink.d(o[0], o[1], 0);
      }
    }
  }
}

/** Honeycomb (pointy-top: two edges of every cell run along the motion) with a dot on every corner. */
export function hexagons(f, sink, { cellPx = 84, nodes = true } = {}) {
  const o = f.o;
  const R0 = (cellPx / f.S) * 0.62; // corner radius
  const nRows = 2 * Math.max(4, Math.round(TAU / (1.5 * R0) / 2));
  const rowSp = TAU / nRows;
  const R = rowSp / 1.5;
  const W = SQ3 * R; // centre-to-centre spacing within a row
  const w = latticeWindow(f, R * 3);
  if (!(w.v1 > w.v0)) return;

  const cornerU = [];
  const cornerV = [];
  for (let k = 0; k < 6; k++) {
    const a = ((30 + 60 * k) * Math.PI) / 180;
    cornerU.push(R * Math.sin(a));
    cornerV.push(R * Math.cos(a));
  }

  for (let i = Math.floor(w.u0 / rowSp) - 1; i <= Math.ceil(w.u1 / rowSp) + 1; i++) {
    const u = i * rowSp;
    const off = (((i % 2) + 2) % 2) * 0.5;
    for (let j = Math.floor(w.v0 / W - off) - 1; j <= Math.ceil(w.v1 / W - off) + 1; j++) {
      const v = (j + off) * W;
      let first = null;
      let ok = true;
      for (let k = 0; k < 6; k++) {
        if (projectLL(f, u + cornerU[k], gd(v + cornerV[k]), o) <= 0) {
          ok = false;
          break;
        }
        if (k === 0) {
          first = [o[0], o[1]];
          sink.m(o[0], o[1]);
        } else sink.l(o[0], o[1]);
        if (nodes && onScreen(f, o[0], o[1])) sink.d(o[0], o[1], 0);
      }
      if (ok) sink.l(first[0], first[1]);
    }
  }
}
