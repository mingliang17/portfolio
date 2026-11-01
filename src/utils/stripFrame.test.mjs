// Tests for the polaroid-menu layout maths. Run with `npm test`.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  frameMetrics, columnLayout, slotY, seeded, cardJitter, columnBand,
  FRAME_MARGIN, MAX_ROTATION, MIN_ROTATION, MAX_SPREAD, CARD_GAP,
} from './stripFrame.js';

const near = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) <= eps, `${a} ≉ ${b} (±${eps})`);
const SIZES = [[1440, 900], [1920, 1080], [1280, 720], [2560, 1080], [1024, 768], [820, 1180], [390, 844]];

test('metrics: a 10% buffer, portrait cards that are big, and an opening for the globe between the columns', () => {
  assert.equal(FRAME_MARGIN, 0.1);
  for (const [W, H] of SIZES) {
    const m = frameMetrics(W, H);
    near(m.mx, 0.1 * W, 1e-9);
    near(m.my, 0.1 * H, 1e-9);
    assert.ok(m.cardW < m.cardH && m.cardH >= 40, `${W}x${H}: portrait cards`);
    assert.ok(m.openingRadius >= 40, `${W}x${H}: room for the globe`);
    // the two columns never take more than ~60% of the width (so a phone still shows the globe)
    assert.ok(2 * (m.mx + m.cardW * 1.3) <= 0.62 * W + 1e-6, `${W}x${H}: columns leave the middle free`);
  }
  assert.ok(frameMetrics(1440, 900).cardH / 900 > 0.12, 'cards are big (the old ones were ~3.5% of the height)');
});

test('two straight vertical columns, mirrored, inside the 10% buffer', () => {
  for (const [W, H] of SIZES) {
    const { metrics: m, columns } = columnLayout(W, H);
    assert.deepEqual(columns.map((c) => c.id), ['V1', 'V2']);
    assert.deepEqual(columns.map((c) => c.side), ['left', 'right']);
    const [L, R] = columns;
    near(L.x + R.x, W, 1e-9); // mirrored about the centre line
    assert.ok(L.x < W / 2 && R.x > W / 2);
    // every card, even at its largest wobble, stays inside the buffer
    assert.ok(L.x - m.cardW / 2 - 0.14 * m.cardW * 1.02 - 0.04 * m.cardW >= m.mx * 0.7, `${W}x${H}: left edge`);
    assert.ok(L.y0 - m.cardH / 2 >= m.my - 1e-9 && L.y1 + m.cardH / 2 <= H - m.my + 1e-9, `${W}x${H}: top and bottom`);
    assert.equal(L.count, R.count);
    assert.ok(L.count >= 3, `${W}x${H}: at least a few cards fit (${L.count})`);
  }
  assert.ok(columnLayout(1440, 900).columns[0].count >= 5, 'a laptop shows five cards per column');
});

test('slotY: a scrolling column steps down by the pitch; a sparse one is spread and centred', () => {
  const col = columnLayout(1440, 900).columns[0];
  const n = col.count;
  near(slotY(col, 0, n + 4), col.y0);
  near(slotY(col, 3, n + 4), col.y0 + 3 * col.pitch);
  near(slotY(col, 1.5, n + 4), col.y0 + 1.5 * col.pitch); // fractional while scrolling
  near(slotY(col, 0, 1), col.y0 + col.span / 2); // one card: dead centre
  const mid = col.y0 + col.span / 2;
  near((slotY(col, 0, 3) + slotY(col, 2, 3)) / 2, mid, 1e-9);
  const gap = slotY(col, 1, 3) - slotY(col, 0, 3);
  assert.ok(gap <= col.pitch * MAX_SPREAD + 1e-9 && gap >= 0, `gap ${gap}`);
  for (let count = 2; count < n; count++) {
    for (let k = 0; k < count; k++) {
      const y = slotY(col, k, count);
      assert.ok(y >= col.y0 - 1e-9 && y <= col.y1 + 1e-9, `${count} cards, slot ${k}`);
    }
  }
  assert.ok(CARD_GAP >= 0 && CARD_GAP < 0.2);
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

test('columnBand covers the column and a pitch above and below it', () => {
  const col = columnLayout(1440, 900).columns[1];
  const b = columnBand(col);
  assert.ok(b.x0 < col.x && b.x1 > col.x && b.y0 < col.y0 && b.y1 > col.y1);
  near((b.x0 + b.x1) / 2, col.x, 1e-9);
});
