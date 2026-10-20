// src/scroll/engine/math.js
// Tiny pure helpers shared by the scroll engine. No DOM, no GSAP.

export const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));

export const lerp = (a, b, t) => a + (b - a) * t;

/** Symmetric ease-in-out (same curve as GSAP's "power2.inOut"). */
export const easeInOut = (t) => {
  const x = clamp(t);
  return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
};

/**
 * Frame-rate independent exponential smoothing.
 * `tau` is the time constant in seconds (≈ time to cover 63% of the gap).
 * tau <= 0 disables smoothing.
 */
export const damp = (current, target, tau, dt) => {
  if (tau <= 0) return target;
  return current + (target - current) * (1 - Math.exp(-dt / tau));
};

export const EPS = 1e-4;
