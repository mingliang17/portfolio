// src/scroll/engine/snap.js
//
// Where may scrolling come to rest, and how far may one gesture travel?
//
// REST POINTS  – positions a gesture may settle on: every section start/end
//                (+ checkpoints when a section uses `snap: 'mandatory'`).
// FREE INTERIOR – the span inside a long section, between its start and end,
//                where scrolling is continuous and nothing is snapped.
// GATE          – a gesture may cross at most ONE rest point in each direction
//                from where it began. This is what makes one flick equal one
//                section even with trackpad inertia, while long sections still
//                scroll freely. (See docs/ScrollArchitecture.md)

import { EPS } from './math.js';

export const DEFAULT_COMMIT = 0.03; // screens of movement needed to commit to the next rest
export const DEFAULT_PROXIMITY_RADIUS = 0.25; // fraction of a checkpoint segment

/** Indices of the rests flanking `s`: lo = last rest <= s, hi = first rest >= s. */
export function flank(rests, s) {
  let lo = 0;
  let hi = rests.length - 1;
  for (let i = 0; i < rests.length; i++) {
    if (rests[i] <= s + EPS) lo = i;
    if (rests[i] >= s - EPS) {
      hi = i;
      break;
    }
  }
  return { lo, hi };
}

/**
 * The span (in screens) a gesture is allowed to move through, given where the
 * scroll currently rests. One rest point beyond each flanking rest.
 */
export function windowFor(rests, s) {
  const { lo, hi } = flank(rests, s);
  return [rests[Math.max(0, lo - 1)], rests[Math.min(rests.length - 1, hi + 1)]];
}

/** The scene whose free interior strictly contains `s`, or null. */
export function freeSceneAt(timeline, s) {
  return (
    timeline.scenes.find(
      (scene) =>
        scene.length > 0 &&
        scene.snap !== 'mandatory' &&
        s > scene.start + EPS &&
        s < scene.end - EPS
    ) || null
  );
}

/** Nearest checkpoint within `radius` of a segment, or null. */
export function proximityTarget(scene, s, radius = DEFAULT_PROXIMITY_RADIUS) {
  const { checkpoints } = scene;
  if (checkpoints.length < 2) return null;
  const segment = scene.length / (checkpoints.length - 1);
  let best = null;
  let bestDist = Infinity;
  for (const cp of checkpoints) {
    const d = Math.abs(cp - s);
    if (d < bestDist) {
      best = cp;
      bestDist = d;
    }
  }
  return bestDist <= segment * radius ? best : null;
}

/**
 * Decide where a finished gesture should come to rest.
 *
 * @param timeline  from buildTimeline
 * @param s         current scroll position (screens)
 * @param settledS  position where the gesture began (last settled position)
 * @returns {{ target: number|null, free: boolean }}
 *          target === null  → stay exactly where you are (free scrolling)
 */
export function decideRest(timeline, s, settledS, { commit = DEFAULT_COMMIT, radius } = {}) {
  const free = freeSceneAt(timeline, s);
  if (free) {
    if (free.snap === 'proximity') {
      return { target: proximityTarget(free, s, radius), free: true };
    }
    return { target: null, free: true };
  }

  const { rests } = timeline;
  const { lo, hi } = flank(rests, s);
  const L = rests[lo];
  const U = rests[hi];
  if (lo === hi) return { target: L, free: false }; // already on a rest

  // Between two rests: commit forward/back based on how far we moved.
  if (s - settledS >= 0) {
    return { target: s - L >= commit ? U : L, free: false };
  }
  return { target: U - s >= commit ? L : U, free: false };
}
