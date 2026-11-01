// Tests for the constellation ring layout and the fly-to camera. Run with `npm test`.
import test from 'node:test';
import assert from 'node:assert/strict';
import { CONSTELLATIONS } from '../constants/constellations.js';
import { ringLayout, ringPosition, flyTo, localRadius, planeHalfHeight, PLANE_Z, RING_SPEED } from './constellationRing.js';
import { fitDistance, DEG } from './geo.js';
import { WORLD_RADIUS, GLOBE_FOV, BASE_SILHOUETTE } from './constants.js';

const near = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) <= eps, `${a} ≉ ${b} (±${eps})`);
const entries = CONSTELLATIONS.map((c) => ({ ...c, key: `const:${c.id}` }));
const viewFor = (aspect) => {
  const globeNdc = Math.min(BASE_SILHOUETTE, 0.8 * aspect);
  return { globeNdc, camDist: fitDistance({ globeRadius: WORLD_RADIUS, fovDeg: GLOBE_FOV, ndcRadius: globeNdc }), fovDeg: GLOBE_FOV };
};

test('the ring turns anticlockwise', () => {
  assert.ok(RING_SPEED > 0); // positive rotation about +Z is anticlockwise as the camera sees it
  const { items } = ringLayout(entries, viewFor(1.6));
  const [x0, y0] = ringPosition(items[0], 0);
  const [x1, y1] = ringPosition(items[0], 0.1);
  assert.ok(x0 * y1 - y0 * x1 > 0, 'cross product > 0 means anticlockwise');
});

test('constellations sit on a ring around the globe: never on the globe, never overlapping, on any screen shape', () => {
  for (const aspect of [0.46, 0.75, 1, 1.6, 1.78, 2.4]) {
    const v = viewFor(aspect);
    const { items, innerNdc, rcNdc, halfH } = ringLayout(entries, v);
    const globeWorldAtPlane = v.globeNdc * halfH; // the globe's silhouette, projected to the plane's depth
    assert.equal(items.length, entries.length);
    for (const it of items) {
      assert.ok(it.ringR - it.radius > globeWorldAtPlane * 1.05, `aspect ${aspect}: ${it.key} clear of the globe`);
      assert.ok(it.ringR + it.radius <= 0.97 * halfH + 1e-9 + 0.1 * halfH, `aspect ${aspect}: ${it.key} within the screen height`);
    }
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const [ax, ay] = ringPosition(items[i], 0);
        const [bx, by] = ringPosition(items[j], 0);
        assert.ok(Math.hypot(ax - bx, ay - by) > (items[i].radius + items[j].radius) * 1.02, `aspect ${aspect}: ${items[i].key} / ${items[j].key} do not overlap`);
      }
    }
    assert.ok(rcNdc >= 0.075 && rcNdc <= 0.2 && innerNdc > 0.2);
  }
});

test('overlap holds at every angle the ring can be at (it is a rigid rotation)', () => {
  const { items } = ringLayout(entries, viewFor(1.6));
  for (let a = 0; a < Math.PI * 2; a += 0.37) {
    const p = items.map((it) => ringPosition(it, a));
    for (let i = 0; i < p.length; i++) for (let j = i + 1; j < p.length; j++) {
      assert.ok(Math.hypot(p[i][0] - p[j][0], p[i][1] - p[j][1]) > (items[i].radius + items[j].radius) * 1.02);
    }
  }
});

test('each constellation is scaled so its stars fit its radius', () => {
  const { items } = ringLayout(entries, viewFor(1.6));
  items.forEach((it, i) => near(localRadius(entries[i]) * it.scale, it.radius, 1e-9));
});

test('flyTo centres the constellation and fills the opening, projected exactly', () => {
  const v = viewFor(1.6);
  const { items } = ringLayout(entries, v);
  const H = 900;
  for (const ang of [0, 1.3, 4]) {
    const it = items[2];
    const f = flyTo(it, ang, { openingPx: 300, H, fovDeg: GLOBE_FOV, baseDist: v.camDist });
    const [px, py] = ringPosition(it, ang);
    near(f.x, px, 1e-9);
    near(f.y, py, 1e-9);
    assert.ok(f.dist >= 1.2 && f.dist <= v.camDist);
    // apparent radius of the constellation as a fraction of half the screen height
    const apparent = it.radius / ((f.dist - PLANE_Z) * Math.tan((GLOBE_FOV * DEG) / 2));
    if (f.dist > 1.2 + 1e-6 && f.dist < v.camDist - 1e-6) near(apparent, (0.9 * 300) / (H / 2), 1e-9);
  }
  assert.ok(planeHalfHeight(8, 50) > 0);
});
