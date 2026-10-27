// Tests for the polaroid-frame layout maths. Run with `npm test`.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  frameMetrics, solveFrame, ringAt, hitSphere, cardBasis, stripLayout, slotDistance,
  FRAME_MARGIN, CURVATURE, FRAME_CAMERA, MAX_TILT, CARD_GAP,
} from './stripFrame.js';

const near = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) <= eps, `${a} ≉ ${b} (±${eps})`);
const SIZES = [[1440, 900], [1920, 1080], [1280, 720], [2560, 1080], [1024, 768], [820, 1180], [390, 844]];

test('metrics: a 10% buffer on every side, readable cards, and room left for the globe', () => {
  assert.equal(FRAME_MARGIN, 0.1);
  for (const [W, H] of SIZES) {
    const m = frameMetrics(W, H);
    near(m.mx, 0.1 * W, 1e-9);
    near(m.my, 0.1 * H, 1e-9);
    assert.ok(m.cardH >= 56 && m.cardW < m.cardH, `${W}x${H}: portrait cards, readable`);
    assert.ok(m.innerHalfW > 0 && m.innerHalfH > 0, `${W}x${H}: there is an opening for the globe`);
  }
  // cards are BIG: the old ones were ~3.5% of the screen height
  assert.ok(frameMetrics(1440, 900).cardH / 900 > 0.12);
});

test('the ring: its outer edge sits exactly on the 10% margin at the middle of each side, and no card leaves the screen', () => {
  for (const [W, H] of SIZES) {
    const frame = solveFrame(W, H);
    const m = frame.metrics;
    const { xs, ys } = frame.ring;
    let maxX = 0;
    let maxY = 0;
    for (let i = 0; i < xs.length; i++) { maxX = Math.max(maxX, Math.abs(xs[i])); maxY = Math.max(maxY, Math.abs(ys[i])); }
    // centre line + half a card = the margin
    near(((1 - maxY) * H) / 2 - m.cardH / 2, m.my, 0.01);
    near(((1 - maxX) * W) / 2 - m.cardW / 2, m.mx, 0.01);
    // every ring point is inside the centre-line rectangle
    for (let i = 0; i < xs.length; i++) assert.ok(Math.abs(xs[i]) <= maxX + 1e-9 && Math.abs(ys[i]) <= maxY + 1e-9);
  }
});

test('the ring is a rectangle rounded into an oval: corners are pulled in from the rectangle corners', () => {
  const frame = solveFrame(1440, 900);
  const { X, Y } = frame.ring;
  const tr = ringAt(frame, frame.ring.corners.TR);
  assert.ok(tr[0] > 0 && tr[1] > 0 && tr[0] < X && tr[1] < Y, 'the top-right corner is inside the rectangle');
  assert.ok(tr[0] > 0.7 * X && tr[1] > 0.7 * Y, 'but it is much squarer than an ellipse (which would sit at 0.707)');
  // clockwise from the top-left
  const tl = ringAt(frame, frame.ring.corners.TL);
  const br = ringAt(frame, frame.ring.corners.BR);
  const bl = ringAt(frame, frame.ring.corners.BL);
  assert.ok(tl[0] < 0 && tl[1] > 0 && br[0] > 0 && br[1] < 0 && bl[0] < 0 && bl[1] < 0);
  assert.ok(frame.ring.corners.TL < frame.ring.corners.TR && frame.ring.corners.TR < frame.ring.corners.BR && frame.ring.corners.BR < frame.ring.corners.BL && frame.ring.corners.BL < frame.ring.total);
});

test('hitSphere: the card sits where the ray through its ring position meets the sphere, tilting away towards the corners', () => {
  for (const [W, H] of SIZES) {
    const frame = solveFrame(W, H);
    assert.ok(frame.R > 0.5 && frame.R < frame.D, `${W}x${H}: sphere in front of the camera`);
    let worst = 0;
    for (let s = 0; s <= frame.ring.total; s += frame.ring.total / 200) {
      const [x, y] = ringAt(frame, s);
      const hit = hitSphere(frame, x, y);
      near(Math.hypot(...hit.p), frame.R, 1e-9); // on the sphere
      near(Math.hypot(...hit.n), 1, 1e-9);
      assert.ok(hit.n[2] > 0.3, `${W}x${H}: faces the camera side`);
      // project the hit back: it lands on the same ring point
      const px = hit.p[0] / (hit.depth * frame.tanH * frame.aspect);
      const py = hit.p[1] / (hit.depth * frame.tanH);
      near(px, x, 1e-9);
      near(py, y, 1e-9);
      worst = Math.max(worst, Math.acos(hit.n[2]));
    }
    // never edge-on (≤ the limit), but properly curved (the nearer of the ray's two hits can sit a little under it)
    assert.ok(worst <= MAX_TILT + 1e-3 && worst > MAX_TILT * 0.45, `${W}x${H}: the most turned-away card is ~${(worst * 57.3).toFixed(0)}° (limit ${(MAX_TILT * 57.3).toFixed(0)}°)`);
    // the part of the ring nearest the screen centre faces you; the farthest part is turned well away
    let best = -1;
    let least = 2;
    for (let s = 0; s <= frame.ring.total; s += frame.ring.total / 200) {
      const nz = hitSphere(frame, ...ringAt(frame, s)).n[2];
      best = Math.max(best, nz);
      least = Math.min(least, nz);
    }
    assert.ok(best > 0.7 && best - least > 0.2, `${W}x${H}: facing ${best.toFixed(2)} … ${least.toFixed(2)}`);
  }
});

test('strips: four, clockwise, each owns one corner; the frame holds plenty of cards on every side', () => {
  for (const [W, H] of SIZES) {
    const frame = solveFrame(W, H);
    const strips = stripLayout(frame);
    assert.deepEqual(strips.map((s) => s.id), ['H1', 'V2', 'H2', 'V1']);
    assert.deepEqual(strips.map((s) => s.horizontal), [true, false, true, false]);
    const c = frame.ring.corners;
    assert.deepEqual(strips.map((s) => s.from), [c.TL, c.TR, c.BR, c.BL]); // each starts on its own corner
    const next = [c.TR, c.BR, c.BL, frame.ring.total];
    strips.forEach((s, i) => {
      // pinwheel: the last slot stops a full pitch before the next corner (whose card belongs to the next strip)
      near(s.limit, next[i] - s.pitch, 1e-9);
      assert.ok(s.count >= 2, `${W}x${H} ${s.id}: only ${s.count} slot(s)`);
      assert.ok(s.from + (s.count - 1) * s.pitch <= s.limit + 1e-6, 'slots stay inside the strip');
    });
  }
  // On a typical laptop screen the frame holds a full set of cards
  const laptop = stripLayout(solveFrame(1440, 900));
  assert.ok(laptop[0].count >= 5 && laptop[1].count >= 3, laptop.map((s) => s.count).join('/'));
});

test('cards are upright polaroids tangent to the sphere (eased by CURVATURE)', () => {
  assert.ok(CURVATURE > 0 && CURVATURE <= 1);
  const frame = solveFrame(1440, 900);
  for (let s = 0; s <= frame.ring.total; s += frame.ring.total / 40) {
    const { n } = hitSphere(frame, ...ringAt(frame, s));
    const { x, y, z } = cardBasis(n);
    near(x[1], 0, 1e-12); // the card's right edge is level: the polaroid never rolls
    assert.ok(y[1] > 0, 'and its up points up');
    for (const [a, b] of [[x, y], [y, z], [x, z]]) near(a[0] * b[0] + a[1] * b[1] + a[2] * b[2], 0, 1e-12);
    near(Math.hypot(...x), 1, 1e-12);
    near(Math.hypot(...y), 1, 1e-12);
  }
});

test('slotDistance: scrolls when there are more items than slots, spreads and centres when fewer', () => {
  const strip = stripLayout(solveFrame(1440, 900))[0];
  const n = strip.count;
  near(slotDistance(strip, 0, n + 5), strip.from);
  near(slotDistance(strip, 2.5, n + 5), strip.from + 2.5 * strip.pitch); // fractional slots glide
  near(slotDistance(strip, 0, 1), strip.from + strip.span / 2); // one item: dead centre
  const mid = strip.from + strip.span / 2;
  const a = slotDistance(strip, 0, 3);
  const b = slotDistance(strip, 2, 3);
  near((a + b) / 2, mid, 1e-9);
  const gap = slotDistance(strip, 1, 3) - a;
  assert.ok(gap >= strip.pitch - 1e-9 && gap <= strip.pitch * 2.4 + 1e-9, `gap ${gap} vs pitch ${strip.pitch}`);
  for (let count = 2; count < n; count++) {
    for (let k = 0; k < count; k++) {
      const along = slotDistance(strip, k, count) - strip.from;
      assert.ok(along >= -1e-9 && along <= strip.span + 1e-9, `${count} items, slot ${k}`);
    }
  }
  assert.ok(CARD_GAP > 0 && FRAME_CAMERA.fovDeg === 50);
});
