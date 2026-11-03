// Tests for the polaroid-menu layout maths. Run with `npm test`.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  frameMetrics, columnLayout, wrapOffset, lapOffsets, startScroll, edgeScrollSpeed, seeded, cardJitter, columnBand,
  FRAME_MARGIN, MAX_ROTATION, MIN_ROTATION, EDGE_DEAD_ZONE, EDGE_MAX_SPEED, OVERSCAN,
} from './stripFrame.js';

const near = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) <= eps, `${a} ≉ ${b} (±${eps})`);
const SIZES = [[1440, 900], [1920, 1080], [1280, 720], [2560, 1080], [1024, 768], [820, 1180], [390, 844]];

test('metrics: a 10% side buffer, big portrait cards, and an opening for the globe between the columns', () => {
  assert.equal(FRAME_MARGIN, 0.1);
  for (const [W, H] of SIZES) {
    const m = frameMetrics(W, H);
    near(m.mx, 0.1 * W, 1e-9);
    assert.ok(m.cardW < m.cardH && m.cardH >= 40, `${W}x${H}: portrait cards`);
    assert.ok(m.openingRadius >= 40, `${W}x${H}: room for the globe`);
    assert.ok(2 * (m.mx + m.cardW * 1.3) <= 0.62 * W + 1e-6, `${W}x${H}: columns leave the middle free`);
  }
  assert.ok(frameMetrics(1440, 900).cardH / 900 > 0.12, 'cards are big (the old ones were ~3.5% of the height)');
});

test('the columns are endless: they reach past the top and the bottom of the page', () => {
  for (const [W, H] of SIZES) {
    const { metrics: m, columns } = columnLayout(W, H);
    assert.deepEqual(columns.map((c) => c.id), ['V1', 'V2']);
    assert.deepEqual(columns.map((c) => c.side), ['left', 'right']);
    const [L, R] = columns;
    near(L.x + R.x, W, 1e-9); // mirrored about the centre line
    assert.ok(L.x < W / 2 && R.x > W / 2);
    near(L.yMid, H / 2);
    // cards are kept until they are mostly beyond the edge, so the strip visibly runs off the page
    assert.ok(L.reach > H / 2 + m.cardH * 0.5, `${W}x${H}: reach ${L.reach} vs half-height ${H / 2}`);
    near(L.reach, H / 2 + m.cardH * OVERSCAN, 1e-9);
    assert.ok(L.slots >= H / m.pitch, `${W}x${H}: ${L.slots} slots cover the page`);
    // sideways: every card, at its largest wobble, stays on the screen
    assert.ok(L.x - m.cardW / 2 - 0.14 * m.cardW * 1.02 - 0.04 * m.cardW >= m.mx * 0.7, `${W}x${H}: left edge`);
  }
});

test('wrapOffset: the loop never ends; the nearest copy of each item is returned', () => {
  const N = 10;
  near(wrapOffset(3, 3, N), 0); // the item at the middle
  near(wrapOffset(4, 3, N), 1);
  near(wrapOffset(2, 3, N), -1);
  near(wrapOffset(0, 9, N), 1); // ...and 0 follows 9: it wraps
  near(wrapOffset(9, 0, N), -1); // ...and 9 precedes 0
  near(wrapOffset(3, 3.5, N), -0.5); // fractional scroll while gliding
  for (let scroll = -25; scroll <= 25; scroll += 0.7) {
    const seen = [];
    for (let i = 0; i < N; i++) {
      const d = wrapOffset(i, scroll, N);
      assert.ok(d >= -N / 2 - 1e-9 && d < N / 2 + 1e-9, `d=${d}`);
      seen.push(d);
    }
    seen.sort((a, b) => a - b);
    for (let k = 1; k < seen.length; k++) near(seen[k] - seen[k - 1], 1, 1e-9); // exactly one card per slot: no gaps, no repeats
  }
  assert.equal(wrapOffset(0, 5, 1), 0);
});

test('lapOffsets: a long list is drawn once; a short list comes round again so the strip is never bare', () => {
  assert.deepEqual(lapOffsets(24, 10), [0]);
  assert.deepEqual(lapOffsets(10, 10), [0]);
  for (const N of [1, 2, 3, 5, 9]) {
    const slots = 10;
    const laps = lapOffsets(N, slots);
    assert.ok(laps.length > 1 && laps.length % 2 === 1, `N=${N}`);
    // every card-slot within half the strip is occupied by some copy, wherever the scroll is
    for (let scroll = 0; scroll < N; scroll += 0.37) {
      const occupied = [];
      for (let i = 0; i < N; i++) for (const lap of laps) occupied.push(wrapOffset(i, scroll, N) + lap * N);
      for (let p = -slots / 2; p <= slots / 2; p += 0.25) {
        assert.ok(occupied.some((o) => Math.abs(o - p) <= 0.5 + 1e-9), `N=${N} scroll=${scroll}: nothing near slot ${p}`);
      }
    }
  }
});

test("startScroll puts the selected place's own cards in the middle of the screen", () => {
  const items = [{ country: 'Orion' }, { country: 'Orion' }, { country: 'Orion' }, { country: 'Peru' }, { country: 'Chile' }];
  near(startScroll(items, 'Orion'), 1); // the middle of three
  near(startScroll(items.slice(1), 'Orion'), 0.5);
  near(startScroll(items, 'Peru'), 0); // not at the front: nothing to centre
  near(startScroll([], 'Orion'), 0);
  // with that scroll the cluster is centred: offsets are symmetric about zero
  const offs = [0, 1, 2].map((i) => wrapOffset(i, startScroll(items, 'Orion'), items.length));
  near(offs[0] + offs[2], 0);
});

test('edge scrolling: still in the middle, faster towards the edges, opposite at the two ends', () => {
  const H = 900;
  assert.equal(edgeScrollSpeed(H / 2, H), 0);
  assert.equal(edgeScrollSpeed(H / 2 + (H / 2) * EDGE_DEAD_ZONE * 0.99, H), 0);
  assert.ok(edgeScrollSpeed(H * 0.8, H) > 0 && edgeScrollSpeed(H * 0.2, H) < 0);
  near(edgeScrollSpeed(H, H), EDGE_MAX_SPEED, 1e-9);
  near(edgeScrollSpeed(0, H), -EDGE_MAX_SPEED, 1e-9);
  let prev = 0;
  for (let y = H / 2; y <= H; y += 15) {
    const s = edgeScrollSpeed(y, H);
    assert.ok(s >= prev - 1e-12, 'never slows down towards the edge');
    prev = s;
  }
  for (const y of [100, 260, 700, 850]) near(edgeScrollSpeed(y, H), -edgeScrollSpeed(H - y, H), 1e-9);
});

test('the hand-made wobble: deterministic, bounded, and every card is a little crooked', () => {
  assert.equal(seeded('abc', 1), seeded('abc', 1));
  assert.notEqual(seeded('abc', 1), seeded('abd', 1));
  const ids = Array.from({ length: 300 }, (_, i) => `foto-${i}`);
  let left = 0;
  let right = 0;
  const rots = new Set();
  for (const id of ids) {
    const j = cardJitter(id);
    assert.deepEqual(j, cardJitter(id), 'same id, same wobble');
    assert.ok(Math.abs(j.rot) >= MIN_ROTATION - 1e-12 && Math.abs(j.rot) <= MAX_ROTATION + 1e-12, `rot ${j.rot}`);
    assert.ok(Math.abs(j.dx) <= 0.14 && Math.abs(j.dy) <= 0.06 && Math.abs(j.scale - 1) <= 0.04);
    if (j.rot > 0) left++; else right++;
    rots.add(j.rot.toFixed(4));
  }
  assert.ok(left > 80 && right > 80, `tilts both ways (${left}/${right})`);
  assert.ok(rots.size > 250, 'plenty of variety');
});

test('columnBand covers the full height of a column', () => {
  const { columns } = columnLayout(1440, 900);
  const b = columnBand(columns[1], 900);
  assert.equal(b.y0, 0);
  assert.equal(b.y1, 900);
  near((b.x0 + b.x1) / 2, columns[1].x, 1e-9);
});
