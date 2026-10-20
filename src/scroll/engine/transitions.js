// src/scroll/engine/transitions.js
//
// A transition style maps (enter, exit) → CSS for one section layer.
//   enter: 0 → 1 as the section arrives   (1 = fully arrived)
//   exit : 0 → 1 as the section departs   (0 = still fully present)
//
// Because both values are pure functions of the scroll position, scrolling
// backwards plays the transition in reverse for free. The old hook computed
// "up" and "down" variants separately; here direction is intrinsic.
//
// Add your own with registerTransition('name', fn) and use it through
// <ScrollStage transitionStyle="name"> or a section's `transitionStyle`.

import { easeInOut, lerp } from './math.js';

/** Layer CSS at rest: nothing applied, so no stacking context / filter cost. */
export const REST_STYLE = Object.freeze({
  opacity: '1',
  transform: 'none',
  filter: 'none',
  willChange: 'auto',
});

const fly = (enter, exit, { blur = 14 } = {}) => {
  const e = easeInOut(enter);
  const x = easeInOut(exit);
  if (e >= 1 && x <= 0) return REST_STYLE;

  const offset = 40; // % of the layer's own height (≈ the old 400px)
  const y = (1 - e) * offset - x * offset;
  const scale = lerp(1.1, 1, e) * lerp(1, 0.9, x);
  const b = (1 - e) * blur + x * blur;

  return {
    opacity: String(e * (1 - x)),
    transform: `translate3d(0, ${y}%, 0) scale(${scale})`,
    filter: b > 0.05 ? `blur(${b}px)` : 'none',
    willChange: 'transform, opacity, filter',
  };
};

const fade = (enter, exit) => {
  const e = easeInOut(enter);
  const x = easeInOut(exit);
  if (e >= 1 && x <= 0) return REST_STYLE;
  return { opacity: String(e * (1 - x)), transform: 'none', filter: 'none', willChange: 'opacity' };
};

/** Hard cut at the midpoint of the transition zone. */
const cut = (enter, exit) => {
  const shown = enter >= 0.5 && exit < 0.5;
  return { opacity: shown ? '1' : '0', transform: 'none', filter: 'none', willChange: 'auto' };
};

const registry = new Map([
  ['fly', fly],
  ['fade', fade],
  ['cut', cut],
]);

export const registerTransition = (name, fn) => registry.set(name, fn);

/** Returns the style function; falls back to `fly` for unknown names. */
export const getTransition = (name) => registry.get(name) || fly;
