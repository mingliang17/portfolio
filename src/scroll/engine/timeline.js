// src/scroll/engine/timeline.js
//
// The whole scroll experience is described as ONE ordered timeline measured in
// "screens" (1 screen = 1 viewport height of scrolling):
//
//   scene 0 dwell      transition   scene 1 dwell      transition   scene 2 ...
//   |==========|--------------------|=========|-----------------|======
//   start0   end0                start1    end1             start2
//
// - A `page` section has a dwell of 0 screens: it is a single resting point.
// - A `long` section has a dwell of N screens: while the scroll position is
//   inside it, the section receives a 0..1 `progress` value.
// - Between two sections there is a transition zone (default 1 screen) where
//   the outgoing section "exits" and the incoming one "enters". Both are pure
//   functions of the scroll position, so scrolling backwards reverses them.
//
// Everything here is pure (no DOM, no GSAP) so it can be unit-tested in Node.

import { clamp, EPS } from './math.js';

export const DEFAULT_LONG_LENGTH = 3; // screens
export const DEFAULT_TRANSITION = 1; // screens
const REST_EPS = 0.004; // ≈3px on an 800px screen
// Snap values within rounding distance of 0 or 1 to exactly 0 / 1, so a layer a pixel
// away from entering is not kept "visible" (and painted) at opacity ≈ 0.
const settleUnit = (v) => (v < REST_EPS ? 0 : v > 1 - REST_EPS ? 1 : v);

/**
 * Normalise `checkpoints` (a count, or an array of 0..1 positions) into
 * absolute positions (in screens) inside a scene.
 */
const resolveCheckpoints = (checkpoints, start, length) => {
  if (!length) return [];
  if (Array.isArray(checkpoints) && checkpoints.length > 0) {
    return checkpoints.map((p) => start + clamp(p) * length);
  }
  if (Number.isFinite(checkpoints) && checkpoints > 1) {
    const n = Math.floor(checkpoints);
    return Array.from({ length: n }, (_, k) => start + (k / (n - 1)) * length);
  }
  return [];
};

/**
 * @typedef {Object} SectionSpec
 * @property {string}  id
 * @property {'page'|'long'} [kind='page']
 * @property {number}  [length]       dwell length in screens (long sections)
 * @property {number|number[]} [checkpoints]  count or 0..1 positions
 * @property {'mandatory'|'proximity'|false} [snap]  how checkpoints attract
 * @property {number}  [transition]   length (screens) of the transition INTO this section
 * @property {string}  [transitionStyle]
 */

/**
 * Build the timeline geometry from section specs.
 * @param {SectionSpec[]} sections
 * @param {{ transition?: number }} [options]
 */
export function buildTimeline(sections, options = {}) {
  const globalTransition = options.transition ?? DEFAULT_TRANSITION;
  const scenes = [];
  let cursor = 0;

  sections.forEach((spec, index) => {
    const enterLen = index === 0 ? 0 : Math.max(0, spec.transition ?? globalTransition);
    cursor += enterLen;

    const kind = spec.kind === 'long' ? 'long' : 'page';
    const length = Math.max(0, spec.length ?? (kind === 'long' ? DEFAULT_LONG_LENGTH : 0));
    const start = cursor;
    const end = start + length;
    const checkpoints = resolveCheckpoints(spec.checkpoints, start, length);
    const snap = spec.snap ?? (checkpoints.length > 1 ? 'proximity' : false);

    scenes.push({
      index,
      id: spec.id,
      kind,
      length,
      start,
      end,
      enterLen,
      checkpoints,
      snap: checkpoints.length > 1 ? snap : false,
      transitionStyle: spec.transitionStyle,
    });

    cursor = end;
  });

  // Rest points: positions where scrolling is allowed to come to rest.
  const restSet = [];
  scenes.forEach((scene) => {
    restSet.push(scene.start);
    if (scene.length > 0) restSet.push(scene.end);
    if (scene.snap === 'mandatory') restSet.push(...scene.checkpoints);
  });
  restSet.sort((a, b) => a - b);
  const rests = restSet.filter((v, i) => i === 0 || v - restSet[i - 1] > EPS);

  return { scenes, rests, total: cursor };
}

/**
 * Sample every scene for a given scroll position `s` (in screens).
 * @returns {{ active: number, scenes: Array<{progress:number, enter:number, exit:number, visible:boolean}> }}
 */
export function sampleTimeline(timeline, s) {
  const { scenes } = timeline;
  const last = scenes.length - 1;

  const states = scenes.map((scene, i) => {
    const next = scenes[i + 1];

    const enter =
      i === 0 ? 1 : scene.enterLen > 0 ? clamp((s - (scene.start - scene.enterLen)) / scene.enterLen) : s >= scene.start ? 1 : 0;

    const exit =
      i === last ? 0 : next.enterLen > 0 ? clamp((s - scene.end) / next.enterLen) : s > scene.end ? 1 : 0;

    const progress = scene.length > 0 ? clamp((s - scene.start) / scene.length) : 0;

    // Sub-pixel/rounding noise at rest must not read as "mid-transition".
    const e = settleUnit(enter);
    const x = settleUnit(exit);
    return { progress, enter: e, exit: x, visible: e > 0 && x < 1 };
  });

  // Active scene flips at the midpoint of each transition zone.
  let active = last;
  for (let i = 0; i < last; i++) {
    const mid = scenes[i].end + scenes[i + 1].enterLen / 2;
    if (s < mid) {
      active = i;
      break;
    }
  }

  return { active, scenes: states };
}

/** Section index by id (or pass-through for numbers). Returns -1 if unknown. */
export function resolveIndex(timeline, idOrIndex) {
  if (typeof idOrIndex === 'number') {
    return idOrIndex >= 0 && idOrIndex < timeline.scenes.length ? idOrIndex : -1;
  }
  return timeline.scenes.findIndex((s) => s.id === idOrIndex);
}
