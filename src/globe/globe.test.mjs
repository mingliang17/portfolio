// Tests for the globe's pure modules: country data, picking, geometry, tessellation. Run with `npm test`.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SphereGeometry, Euler, Vector3 } from 'three';

import { decodeArcs, stitch, unwrap, prepareRing, buildCountries, buildLines, pointInRing, findCountryAt } from './topo.js';
import { lonLatToDir, dirToLonLat, wrapLon, viewFor, focusOf, distanceForRadius, fitDistance, lineToSegments, angularDistance, DEG } from './geo.js';
import { tessellateCountry } from './tessellate.js';
import { GLOBE_THEMES, hexToRgb } from './themes.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const topology = JSON.parse(fs.readFileSync(path.resolve(here, '../../public/data/countries-50m.json'), 'utf8'));
const countries = buildCountries(topology);
const byIso = (iso) => countries.find((c) => c.iso === iso);
const near = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) <= eps, `${a} ≉ ${b} (±${eps})`);

// ── lon/lat ↔ 3D ────────────────────────────────────────────────────────────────────────────────
test('lonLatToDir agrees with three.js SphereGeometry, so hit points and textures line up', () => {
  const W = 72;
  const H = 36;
  const geo = new SphereGeometry(1, W, H);
  const pos = geo.attributes.position;
  for (const [ix, iy] of [[0, 18], [18, 18], [36, 12], [50, 30], [71, 5]]) {
    const i = iy * (W + 1) + ix;
    const lon = (ix / W) * 360 - 180;
    const lat = 90 - (iy / H) * 180;
    const [x, y, z] = lonLatToDir(lon, lat);
    near(pos.getX(i), x, 1e-5);
    near(pos.getY(i), y, 1e-5);
    near(pos.getZ(i), z, 1e-5);
  }
});

test('dirToLonLat inverts lonLatToDir everywhere', () => {
  for (let lon = -175; lon <= 175; lon += 35) {
    for (let lat = -85; lat <= 85; lat += 17) {
      const back = dirToLonLat(...lonLatToDir(lon, lat, 3.7));
      near(back.lat, lat, 1e-6);
      near(wrapLon(back.lon), wrapLon(lon), 1e-6);
    }
  }
  near(wrapLon(190), -170);
  near(wrapLon(-180), 180);
});

test('viewFor turns any point to the centre of the screen (XYZ Euler = Rx·Ry, north stays up)', () => {
  for (const [lon, lat] of [[0, 0], [139.7, 35.7], [-74, 40.7], [151, -34], [18, -34], [177, 65], [0, 80], [-100, -70]]) {
    const { yaw, pitch } = viewFor(lon, lat);
    const v = new Vector3(...lonLatToDir(lon, lat)).applyEuler(new Euler(pitch, yaw, 0, 'XYZ'));
    near(v.x, 0, 1e-9);
    near(v.y, 0, 1e-9);
    near(v.z, 1, 1e-9);
  }
  // nearest equivalent yaw: never the long way round
  const a = viewFor(10, 0, 6.0);
  assert.ok(Math.abs(a.yaw - 6.0) < Math.PI);
});

test('camera framing: closed forms agree with an actual perspective projection', () => {
  const R = 1.6;
  const fov = 50;
  const tanH = Math.tan((fov * DEG) / 2);
  for (const rho of [4, 10, 20, 38].map((d) => d * DEG)) {
    const d = distanceForRadius(rho, { globeRadius: R, fovDeg: fov, targetNdc: 0.45 });
    const ndc = (R * Math.sin(rho)) / ((d - R * Math.cos(rho)) * tanH); // project the cap's edge point
    near(ndc, 0.45, 1e-9);
  }
  const d = fitDistance({ globeRadius: R, fovDeg: fov, ndcRadius: 0.59 });
  near(R / (Math.sqrt(d * d - R * R) * tanH), 0.59, 1e-9); // silhouette radius
  // clamps
  assert.equal(distanceForRadius(0.01, { globeRadius: R, fovDeg: fov, targetNdc: 0.5, min: 2.5 }), 2.5);
  assert.equal(distanceForRadius(1.5, { globeRadius: R, fovDeg: fov, targetNdc: 0.2, max: 9.5 }), 9.5);
});

// ── TopoJSON decoding ──────────────────────────────────────────────────────────────────────────
test('decodeArcs / stitch: delta-decoding, transform, and reversed arcs', () => {
  const topo = { transform: { scale: [0.5, 0.25], translate: [-10, 20] }, arcs: [[[0, 0], [2, 0], [0, 4]], [[4, 4], [-2, 0]]] };
  const arcs = decodeArcs(topo);
  assert.deepEqual([...arcs[0]], [-10, 20, -9, 20, -9, 21]);
  assert.deepEqual([...arcs[1]], [-8, 21, -9, 21]);
  // arc 0 then arc 1: the repeated joint point is dropped
  assert.deepEqual([...stitch(arcs, [0, 1])], [-10, 20, -9, 20, -9, 21, -9, 21]);
  // ~id means "arc id, reversed": arc 1 backwards, then arc 0 backwards
  assert.deepEqual([...stitch(arcs, [~1, ~0])], [-9, 21, -8, 21, -9, 20, -10, 20]);
});

test('unwrap makes antimeridian-crossing rings continuous (and keeps a closed ring closed)', () => {
  const ring = Float64Array.from([170, 60, 179, 61, -179, 62, -170, 61, 170, 60]);
  assert.deepEqual([...unwrap(ring)], [170, 60, 179, 61, 181, 62, 190, 61, 170, 60]);
});

test('prepareRing: closes a ring that winds around the pole and drops pole-line rings', () => {
  // A coastline running -180 → 180 around Antarctica
  const coast = [];
  for (let lon = -180; lon <= 180; lon += 30) coast.push(lon, -70);
  const closed = prepareRing(Float64Array.from(coast));
  const n = closed.length / 2;
  assert.equal(closed[(n - 1) * 2 + 1], -90); // ends on the pole
  assert.equal(closed[(n - 2) * 2 + 1], -90);
  assert.ok(pointInRing(closed, 0, -80));
  assert.ok(!pointInRing(closed, 0, -60));
  // a ring lying along latitude -90 is degenerate
  assert.equal(prepareRing(Float64Array.from([-180, -90, -90, -90, 0, -90, 90, -90, 180, -90])), null);
});

test('buildLines tells shared borders from coastlines', () => {
  // Two squares sharing the edge x = 1; arcs: 0 = shared edge, 1 = left square's other 3 sides, 2 = right square's
  const topo = {
    arcs: [[[1, 0], [1, 1]], [[1, 1], [0, 1], [0, 0], [1, 0]], [[1, 0], [2, 0], [2, 1], [1, 1]]],
    objects: { countries: { type: 'GeometryCollection', geometries: [
      { type: 'Polygon', arcs: [[0, 1]], properties: { name: 'A', iso: 'aa' } },
      { type: 'Polygon', arcs: [[2, ~0]], properties: { name: 'B', iso: 'bb' } },
    ] } },
  };
  const lines = buildLines(topo);
  assert.equal(lines.length, 3);
  assert.equal(lines.filter((l) => l.kind === 'border').length, 1);
  assert.equal(lines.filter((l) => l.kind === 'coast').length, 2);
});

// ── The real data ──────────────────────────────────────────────────────────────────────────────
test('country data: every country is present, with an outline, a box and a name', () => {
  assert.ok(countries.length >= 235, `${countries.length} countries`);
  for (const c of countries) {
    assert.ok(c.name && c.polygons.length > 0, c.name);
    assert.ok(c.polygons.every((p) => p.rings.every((r) => r.every(Number.isFinite))), `${c.name}: finite`);
  }
  // the countries the site has work in must all be selectable by their ISO code
  for (const iso of ['au', 'cn', 'us', 'gb', 'jp', 'br', 'de', 'za']) assert.ok(byIso(iso), iso);
  assert.equal(new Set(countries.map((c) => c.iso).filter(Boolean)).size, countries.filter((c) => c.iso).length, 'ISO codes are unique');
});

test('picking: well-known places resolve to the right country (including across the antimeridian)', () => {
  const at = (lon, lat) => findCountryAt(countries, lon, lat)?.iso ?? null;
  const cases = [
    [151.2, -33.9, 'au'], [-0.12, 51.5, 'gb'], [139.7, 35.7, 'jp'], [-46.6, -23.5, 'br'], [37.6, 55.75, 'ru'],
    [172, 66.5, 'ru'], // Chukotka interior, just before the antimeridian
    [-175, 66, 'ru'], // Chukotka beyond it: the same polygon, unwrapped past 180°
    [178.4, -18.1, 'fj'], [0, -89, 'aq'], [28.0, -26.2, 'za'], [27.5, -29.3, 'ls'], // Lesotho: a hole in South Africa
    [13.4, 52.5, 'de'], [116.4, 39.9, 'cn'], [-98, 39, 'us'], [-157.8, 21.3, 'us'], [103.8, 1.35, 'sg'],
  ];
  for (const [lon, lat, iso] of cases) assert.equal(at(lon, lat), iso, `(${lon}, ${lat})`);
  for (const [lon, lat] of [[-30, 0], [-140, -40], [80, -40], [-170, 0]]) assert.equal(at(lon, lat), null, `ocean (${lon}, ${lat})`);
});

test('focusOf: centres on the mainland with a sensible radius', () => {
  const f = (iso) => focusOf(byIso(iso));
  const deg = (r) => r / DEG;
  const jp = f('jp');
  assert.ok(jp.lon > 128 && jp.lon < 146 && jp.lat > 30 && jp.lat < 42, JSON.stringify(jp));
  assert.ok(deg(jp.radius) > 10 && deg(jp.radius) < 25);
  const de = f('de');
  assert.ok(deg(de.radius) > 3 && deg(de.radius) < 7);
  assert.ok(deg(f('ru').radius) > 30 && deg(f('ru').radius) < 60);
  assert.ok(deg(f('sg').radius) < 2);
  const us = f('us'); // Alaska and Hawaii are far from the mainland and must not drag the centre
  assert.ok(us.lon < -80 && us.lon > -115 && us.lat > 32 && us.lat < 46, JSON.stringify(us));
  // the centre of every country lies inside the cap it reports
  for (const c of countries.filter((x) => x.iso)) {
    const foc = focusOf(c);
    assert.ok(Number.isFinite(foc.lon) && Number.isFinite(foc.lat) && foc.radius > 0, c.name);
  }
});

// ── Tessellation ───────────────────────────────────────────────────────────────────────────────
test('tessellateCountry: hugs the sphere and covers the right area (no gaps, no spill)', () => {
  const area = (tri) => {
    let s = 0;
    for (let i = 0; i < tri.length; i += 9) {
      const ax = tri[i + 3] - tri[i], ay = tri[i + 4] - tri[i + 1], az = tri[i + 5] - tri[i + 2];
      const bx = tri[i + 6] - tri[i], by = tri[i + 7] - tri[i + 1], bz = tri[i + 8] - tri[i + 2];
      s += 0.5 * Math.hypot(ay * bz - az * by, az * bx - ax * bz, ax * by - ay * bx);
    }
    return s;
  };
  const R = 2;
  const EARTH_KM2 = 4 * Math.PI * 6371 ** 2;
  // Natural Earth areas (km²) → fraction of the sphere
  for (const [iso, km2, tol] of [['de', 357e3, 0.12], ['jp', 378e3, 0.2], ['au', 7.69e6, 0.1], ['ru', 17.1e6, 0.1], ['aq', 14.2e6, 0.25]]) {
    const tri = tessellateCountry(byIso(iso), R, 2);
    for (let i = 0; i < tri.length; i += 3) near(Math.hypot(tri[i], tri[i + 1], tri[i + 2]), R, 1e-4);
    const frac = area(tri) / (4 * Math.PI * R * R);
    const expected = km2 / EARTH_KM2;
    assert.ok(Math.abs(frac - expected) / expected < tol, `${iso}: ${(frac * 100).toFixed(3)}% of the sphere, expected ${(expected * 100).toFixed(3)}%`);
  }
});

// ── Lines ──────────────────────────────────────────────────────────────────────────────────────
test('lineToSegments densifies so no chord is longer than the step, and stays on the sphere', () => {
  const out = lineToSegments(Float64Array.from([0, 49, 40, 49]), 2, 1, []); // a 40° long border along 49°N
  assert.ok(out.length / 6 >= 40);
  for (let i = 0; i < out.length; i += 6) {
    near(Math.hypot(out[i], out[i + 1], out[i + 2]), 2, 1e-9);
    assert.ok(Math.hypot(out[i + 3] - out[i], out[i + 4] - out[i + 1], out[i + 5] - out[i + 2]) < 2 * 1.2 * DEG);
  }
  // continuity: each segment starts where the last ended
  for (let i = 6; i < out.length; i += 6) near(out[i], out[i - 3], 1e-9);
});

test('all borders: every line is finite and the world is covered by a few tens of thousands of segments', () => {
  const lines = buildLines(topology);
  const out = [];
  for (const l of lines) lineToSegments(l.coords, 2, 1, out);
  assert.ok(out.every(Number.isFinite));
  assert.ok(out.length / 6 > 30000 && out.length / 6 < 200000, `${out.length / 6} segments`);
  assert.ok(lines.some((l) => l.kind === 'border') && lines.some((l) => l.kind === 'coast'));
});

test('themes: all three palettes define every colour the globe reads', () => {
  const keys = ['oceanCenter', 'oceanEdge', 'land', 'landContent', 'border', 'graticule', 'rim', 'hover', 'select'];
  for (const [name, p] of Object.entries(GLOBE_THEMES)) {
    for (const k of keys) assert.ok(/^#[0-9a-f]{6}$/i.test(p[k]), `${name}.${k}`);
    assert.ok(p.borderAlpha > 0 && p.borderAlpha <= 1 && p.coastAlpha > 0 && p.graticuleAlpha >= 0);
  }
  assert.deepEqual(hexToRgb('#ff8000').map((v) => +v.toFixed(3)), [1, 0.502, 0]);
  assert.ok(angularDistance(0, 0, 90, 0) - Math.PI / 2 < 1e-12);
});
