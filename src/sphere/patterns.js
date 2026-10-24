// src/sphere/patterns.js — the sphere patterns (modelled on the reference sheet).
//
// All patterns are generated on the fly for the visible patch only (live.js).
//
// `base` is the sphere's starting orientation in degrees (see orientation() in math.js).
// The page scroll rolls the sphere about the horizontal screen axis, which moves every point
// straight up the screen. So every pattern except `radial` puts its pole on that axis (rz = -90):
// their lattice lines then run along or across the motion and never diagonally.
//   - Tilting the pole off that axis (e.g. towards the viewer) would make the lattice turn as it rolls: that
//     is the diagonal zig-zag this layout avoids, so don't.
//   - `radial` puts the pole in the middle of the screen at scroll 0 (rx = 90): a hub that rolls away upwards.

import { graticule, rhombus, scan, dust, triangles, hexagons } from './live.js';

const ON_AXIS = { rx: 0, ry: 0, rz: -90 };

export const PATTERNS = {
  // ref 1 / 9 — triangulated sphere with a node on every vertex
  geodesic: { base: ON_AXIS, line: 0.3, dot: 0.55, draw: (f, s) => triangles(f, s, { cellPx: 86 }) },

  // ref 3 — hexagonal cells with a node on every corner
  hex: { base: ON_AXIS, line: 0.32, dot: 0.6, draw: (f, s) => hexagons(f, s, { cellPx: 92 }) },

  // ref 4 — square-celled latitude/longitude grid with nodes
  latlong: { base: ON_AXIS, line: 0.3, dot: 0.55, draw: (f, s) => graticule(f, s, { mode: 'mercator', cellPx: 74, nodes: true }) },

  // ref 1 / 6 — a globe: equal-angle parallels and meridians; the meridians bow towards the (distant) poles
  globe: { base: ON_AXIS, line: 0.34, dot: 0, draw: (f, s) => graticule(f, s, { mode: 'equal', cellPx: 118 }) },

  // ref 6 — rings and spokes meeting at a hub (the pole is on screen at scroll 0)
  radial: {
    base: { rx: 90, ry: 0, rz: 0 },
    line: 0.32,
    dot: 0.7,
    draw: (f, s) => graticule(f, s, { mode: 'equal', cellPx: 46, spokes: 72, hub: true }),
  },

  // ref 7 — diamond lattice
  rhombus: { base: ON_AXIS, line: 0.3, dot: 0.55, draw: (f, s) => rhombus(f, s, { cellPx: 78 }) },

  // ref 9 — dotted scan lines
  scan: { base: ON_AXIS, line: 0, dot: 0.55, draw: (f, s) => scan(f, s, { ringPx: 58, dotPx: 15 }) },

  // ref 2 — fine dust
  dust: { base: ON_AXIS, line: 0, dot: 0.5, draw: (f, s) => dust(f, s, { spacingPx: 13 }) },
};

export const PATTERN_NAMES = Object.keys(PATTERNS);
