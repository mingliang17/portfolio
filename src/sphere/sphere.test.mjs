// Unit tests for the pure sphere modules. Run with `npm test`.
import test from 'node:test';
import assert from 'node:assert/strict';

import { orientation, makeFrame, lonWindow, projectLL, DEGREES_PER_SCREEN, VISIBLE_FRACTION, D2R } from './math.js';
import { PATTERNS, PATTERN_NAMES } from './patterns.js';
import { resolvePattern, SECTION_PATTERNS, TYPE_PATTERNS } from './config.js';

const near = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) <= eps, `${a} ≉ ${b}`);

const makeSink = () => {
  const s = { moves: 0, lines: 0, dots: 0, pts: [], segs: [] };
  let last = null;
  s.m = (x, y) => { s.moves++; s.pts.push([x, y]); last = [x, y]; };
  s.l = (x, y) => { s.lines++; s.pts.push([x, y]); s.segs.push([last, [x, y]]); last = [x, y]; };
  s.d = (x, y) => { s.dots++; s.pts.push([x, y]); };
  return s;
};

test('rotation matrix is orthonormal for any scroll position and base', () => {
  for (const s of [0, 0.5, 1, 3.7, 10]) {
    const M = orientation(s, { rx: 33, ry: -35, rz: -65 });
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        const dot = M[i * 3] * M[j * 3] + M[i * 3 + 1] * M[j * 3 + 1] + M[i * 3 + 2] * M[j * 3 + 2];
        near(dot, i === j ? 1 : 0);
      }
    }
  }
});

test('one screen of scrolling rotates the sphere by exactly 45°, upwards', () => {
  assert.equal(DEGREES_PER_SCREEN, 45);
  for (const base of [{}, { rx: 90 }, { rz: -90 }, { ry: -35, rz: -90 }]) {
    const M0 = orientation(0, base);
    const p = [M0[6], M0[7], M0[8]]; // the model point that faces the viewer at scroll 0
    const M1 = orientation(1, base);
    const z = M1[6] * p[0] + M1[7] * p[1] + M1[8] * p[2];
    const y = M1[3] * p[0] + M1[4] * p[1] + M1[5] * p[2];
    near(Math.acos(z), 45 * D2R);
    assert.ok(y > 0, 'scrolling down moves the surface up');
  }
  const A = orientation(0, {});
  const B = orientation(8, {});
  A.forEach((v, i) => near(v, B[i])); // 8 screens = one full turn
});

test('the camera is fixed: scrolling moves every point straight up/down, its screen x never changes', () => {
  for (const base of [{}, { rx: 90 }, { rz: -90 }, { ry: -35, rz: -90 }, { rx: 20, ry: 10, rz: -40 }]) {
    const r0 = orientation(0, base).slice(0, 3);
    for (const s of [0.3, 1, 2.7, 9]) near(Math.hypot(...orientation(s, base).slice(0, 3).map((v, i) => v - r0[i])), 0);
  }
  // …and in practice, for an actual lattice node projected at different scroll positions
  const o = [0, 0];
  const at = (s) => { const f = makeFrame({ W: 1440, H: 900, screens: s, base: PATTERNS.geodesic.base }); projectLL(f, 0.2, 0.1, o); return [...o]; };
  const a = at(0.5);
  const b = at(0.6);
  near(a[0], b[0], 1e-6);
  assert.ok(Math.abs(a[1] - b[1]) > 1, 'but it does move vertically');
});

test('only the centre 30% of the sphere (by diameter) is visible', () => {
  assert.equal(VISIBLE_FRACTION, 0.3);
  for (const [W, H] of [[1440, 900], [390, 844], [2560, 1440]]) {
    const f = makeFrame({ W, H, screens: 0 });
    near(Math.max(W, H) / f.S, 2 * VISIBLE_FRACTION); // the longer side spans 30% of the diameter
    assert.ok(f.rho < Math.asin(1.3 * VISIBLE_FRACTION), `rho ${f.rho}`); // even the viewport corner stays near the centre
  }
});

test('lonWindow: wide in longitude only when the window touches a pole', () => {
  const eq = makeFrame({ W: 1440, H: 900, screens: 0, base: { rx: 0, rz: 0 } });
  const w = lonWindow(eq);
  assert.equal(w.polar, false);
  assert.ok(w.lam1 - w.lam0 < 1);
  const pole = makeFrame({ W: 1440, H: 900, screens: 0, base: { rx: 90, rz: 0 } });
  assert.equal(lonWindow(pole).polar, true);
});

test('every pattern draws something inside the viewport and nothing is NaN, at every scroll position and size', () => {
  for (const [W, H] of [[1440, 900], [390, 844]]) {
    for (const name of PATTERN_NAMES) {
      const def = PATTERNS[name];
      // Dense sweep (two full turns): a pattern must never go blank at any scroll position.
      for (let s = 0; s <= 16; s += 0.25) {
        const f = makeFrame({ W, H, screens: s, base: def.base });
        const sink = makeSink();
        def.draw(f, sink);
        assert.ok(sink.pts.every(([x, y]) => Number.isFinite(x) && Number.isFinite(y)), `${name}@${s}: finite`);
        const inside = sink.pts.filter(([x, y]) => x > -50 && x < W + 50 && y > -50 && y < H + 50).length;
        assert.ok(inside > 20, `${name}@${s} ${W}x${H}: only ${inside} points on screen`);
      }
    }
  }
});

test('lattice patterns are aligned with the motion: no diagonal slant that would read as zig-zag', () => {
  // Classify every drawn segment by its angle from vertical (the direction of motion).
  const hist = (name) => {
    const def = PATTERNS[name];
    const f = makeFrame({ W: 1440, H: 900, screens: 1.3, base: def.base });
    const sink = makeSink();
    def.draw(f, sink);
    const h = { vertical: 0, horizontal: 0, other: 0 };
    for (const [[x0, y0], [x1, y1]] of sink.segs) {
      const len = Math.hypot(x1 - x0, y1 - y0);
      if (len < 5) continue;
      const a = (Math.acos(Math.min(1, Math.abs(y1 - y0) / len)) * 180) / Math.PI; // 0 = vertical, 90 = horizontal
      if (a < 8) h.vertical += len;
      else if (a > 82) h.horizontal += len;
      else h.other += len;
    }
    return h;
  };
  // Mercator graticule: only meridians (horizontal) and parallels (vertical).
  const g = hist('latlong');
  assert.ok(g.other < 0.15 * (g.vertical + g.horizontal), JSON.stringify(g));
  // Globe likewise (meridians bow slightly towards the distant poles).
  const gl = hist('globe');
  assert.ok(gl.other < 0.2 * (gl.vertical + gl.horizontal), JSON.stringify(gl));
  // Hexagons: two of six edges are vertical; the rest are 30° off horizontal — no near-45° diagonals.
  const hx = hist('hex');
  assert.ok(hx.vertical > 0.25 * (hx.vertical + hx.other + hx.horizontal), JSON.stringify(hx));
});

test('radial: the pole is at the centre of the screen at scroll 0 and has moved away after 1 screen', () => {
  const o = [0, 0];
  const at = (s) => {
    const f = makeFrame({ W: 1440, H: 900, screens: s, base: PATTERNS.radial.base });
    const z = projectLL(f, 0, Math.PI / 2, o);
    return { x: o[0], y: o[1], z };
  };
  const p0 = at(0);
  near(p0.x, 720, 0.5);
  near(p0.y, 450, 0.5);
  assert.ok(p0.z > 0.99);
  assert.ok(at(1).y < 450 - 1000, 'the hub has scrolled off the top');
});

test('resolvePattern: override beats id, id beats route, unknown names fall back safely', () => {
  assert.equal(resolvePattern('/projects/[project_id]', 'hero'), SECTION_PATTERNS.hero);
  assert.equal(resolvePattern('/projects/[project_id]', 'hero', 'hex'), 'hex');
  assert.equal(resolvePattern('/projects/[project_id]', 'x', 'not-a-pattern'), 'geodesic');
  assert.equal(resolvePattern('/projects/[project_id]', 'carousel7'), 'dust');
  assert.equal(resolvePattern('/', undefined), 'dust');
  assert.equal(resolvePattern('/projects', undefined), 'hex');
  assert.equal(resolvePattern('/somewhere-else', undefined), 'geodesic');
  for (const id of [...Object.values(SECTION_PATTERNS), ...Object.values(TYPE_PATTERNS)]) assert.ok(PATTERN_NAMES.includes(id), id);
});
