// Run with:  npm test   (uses Node's built-in test runner, no extra deps)
import test from 'node:test';
import assert from 'node:assert/strict';

import { buildTimeline, sampleTimeline, resolveIndex } from './timeline.js';
import { flank, windowFor, decideRest, freeSceneAt } from './snap.js';
import { getTransition, REST_STYLE } from './transitions.js';

const near = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} !≈ ${b}`);

// page, long(4), page, long(3 with 4 checkpoints, mandatory)
const specs = [
  { id: 'hero', kind: 'page' },
  { id: 'spin', kind: 'long', length: 4, checkpoints: 5 },
  { id: 'carousel', kind: 'page' },
  { id: 'steps', kind: 'long', length: 3, checkpoints: 4, snap: 'mandatory' },
];
const tl = buildTimeline(specs, { transition: 1 });

test('geometry: sections are laid out with transition zones between them', () => {
  const [hero, spin, carousel, steps] = tl.scenes;
  near(hero.start, 0);
  near(hero.end, 0);
  near(spin.start, 1); // 1 screen transition after hero
  near(spin.end, 5);
  near(carousel.start, 6);
  near(steps.start, 7);
  near(steps.end, 10);
  near(tl.total, 10);
});

test('rests: starts/ends, plus checkpoints only for mandatory snap', () => {
  assert.deepEqual(tl.rests.map((r) => +r.toFixed(3)), [0, 1, 5, 6, 7, 8, 9, 10]);
});

test('checkpoints resolve to absolute positions', () => {
  const spin = tl.scenes[1];
  assert.equal(spin.snap, 'proximity'); // default when checkpoints given
  assert.deepEqual(spin.checkpoints.map((c) => +c.toFixed(3)), [1, 2, 3, 4, 5]);
});

test('sampling: progress is 0..1 across a long section and clamps outside it', () => {
  near(sampleTimeline(tl, 1).scenes[1].progress, 0);
  near(sampleTimeline(tl, 3).scenes[1].progress, 0.5);
  near(sampleTimeline(tl, 5).scenes[1].progress, 1);
  near(sampleTimeline(tl, 6).scenes[1].progress, 1); // after
  near(sampleTimeline(tl, 0).scenes[1].progress, 0); // before
});

test('sampling: enter/exit reverse symmetrically (backwards scroll = reverse transition)', () => {
  const down = sampleTimeline(tl, 5.25).scenes; // 25% into spin→carousel
  near(down[1].exit, 0.25);
  near(down[2].enter, 0.25);
  assert.ok(down[1].visible && down[2].visible);
  assert.ok(!down[0].visible && !down[3].visible);
});

test('sampling: active flips at the midpoint of a transition', () => {
  assert.equal(sampleTimeline(tl, 5.49).active, 1);
  assert.equal(sampleTimeline(tl, 5.51).active, 2);
  assert.equal(sampleTimeline(tl, 0).active, 0);
  assert.equal(sampleTimeline(tl, 10).active, 3);
});

test('resolveIndex accepts ids and indices', () => {
  assert.equal(resolveIndex(tl, 'spin'), 1);
  assert.equal(resolveIndex(tl, 2), 2);
  assert.equal(resolveIndex(tl, 'nope'), -1);
  assert.equal(resolveIndex(tl, 99), -1);
});

test('GATE: from a rest, one gesture may cross exactly one rest point each way', () => {
  // resting on the hero (0): may go up to the start of spin (1), nothing below
  assert.deepEqual(windowFor(tl.rests, 0), [0, 1]);
  // resting at the END of spin (5): back to its start (1), forward to carousel (6)
  assert.deepEqual(windowFor(tl.rests, 5), [1, 6]);
  // in the free interior of spin: previous boundary .. next boundary
  assert.deepEqual(windowFor(tl.rests, 3), [0, 6]);
});

test('free interior: no snapping inside a proximity section away from checkpoints', () => {
  assert.ok(freeSceneAt(tl, 3.5)); // spin interior
  assert.equal(freeSceneAt(tl, 1), null); // exactly at its start
  assert.equal(freeSceneAt(tl, 8.5), null); // mandatory sections are never free
  const mid = decideRest(tl, 3.5, 3.5);
  assert.equal(mid.free, true);
  assert.equal(mid.target, null);
});

test('proximity: magnetic pull toward a nearby checkpoint only', () => {
  near(decideRest(tl, 3.1, 3.1).target, 3); // within 25% of a segment
  assert.equal(decideRest(tl, 3.5, 3.5).target, null); // too far, free
});

test('commit: a small nudge from a rest snaps BACK, a real push snaps FORWARD', () => {
  // resting on hero (0), moved 0.01 screens down → back to hero
  near(decideRest(tl, 0.01, 0).target, 0);
  // moved 0.05 → commit to the spin section start
  near(decideRest(tl, 0.05, 0).target, 1);
  // resting at spin start (1), pushed back up 0.5 → return to hero
  near(decideRest(tl, 0.5, 1).target, 0);
  // tiny pull back from carousel (6) → stays
  near(decideRest(tl, 5.99, 6).target, 6);
});

test('arrival direction: scrolling UP into a long section lands at its END', () => {
  // from carousel (6), push up past the threshold → rest at spin END (5), not its start (1)
  near(decideRest(tl, 5.4, 6).target, 5);
});

test('mandatory checkpoints behave like a stepper', () => {
  // at steps start (7): nudge → next checkpoint (8)
  near(decideRest(tl, 7.1, 7).target, 8);
  near(decideRest(tl, 7.01, 7).target, 7);
  assert.deepEqual(windowFor(tl.rests, 8), [7, 9]);
});

test('flank handles exact rests and gaps', () => {
  assert.deepEqual(flank(tl.rests, 5), { lo: 2, hi: 2 });
  assert.deepEqual(flank(tl.rests, 5.5), { lo: 2, hi: 3 });
});

test('transitions: rest style is applied at rest; fly is mid-state in between', () => {
  const fly = getTransition('fly');
  assert.equal(fly(1, 0), REST_STYLE);
  const mid = fly(0.5, 0);
  assert.ok(Number(mid.opacity) > 0 && Number(mid.opacity) < 1);
  assert.match(mid.transform, /translate3d/);
  assert.equal(getTransition('fade')(1, 0), REST_STYLE);
  assert.equal(getTransition('cut')(0.4, 0).opacity, '0');
  assert.equal(getTransition('cut')(0.6, 0).opacity, '1');
  assert.equal(getTransition('does-not-exist'), fly); // safe fallback
});

test('a single page section is valid', () => {
  const one = buildTimeline([{ id: 'only' }]);
  assert.equal(one.total, 0);
  assert.equal(sampleTimeline(one, 0).active, 0);
});
