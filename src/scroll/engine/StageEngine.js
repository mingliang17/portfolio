// src/scroll/engine/StageEngine.js
//
// The imperative runtime behind <ScrollStage>. It owns NO scroll input of its
// own: the browser scrolls natively (wheel, touch, keyboard, scrollbar, find,
// anchors all just work) and the engine only *reads* window.scrollY, then:
//
//   1. smooths it a little            (so wheel steps feel continuous)
//   2. maps it onto the timeline      (progress / enter / exit per section)
//   3. writes layer styles directly   (no React re-render per frame)
//   4. settles finished gestures      (snap to rests, gate to one section)
//
// Per-frame work is a single gsap.ticker callback; when the scroll is idle the
// callback exits early and costs ~nothing.

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';

import { sampleTimeline, resolveIndex } from './timeline.js';
import { decideRest, windowFor, DEFAULT_COMMIT } from './snap.js';
import { getTransition } from './transitions.js';
import { clamp, damp } from './math.js';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);
// Mobile URL-bar show/hide fires resize events; don't rebuild the world for them.
ScrollTrigger.config({ ignoreMobileResize: true });

const TOLERANCE_PX = 2; // anything within this many px of a rest counts as "on it"

export const ENGINE_DEFAULTS = {
  smoothing: 0.09, // seconds (time constant); 0 disables
  blur: 14, // px, peak blur of the default `fly` transition
  commit: DEFAULT_COMMIT, // screens of movement needed to commit to the next section
  settleDelay: 0.12, // seconds of input silence before a gesture counts as finished
  snapDuration: { min: 0.5, max: 1.3 }, // seconds
  gate: true, // limit a gesture to one section boundary
  transitionStyle: 'fly',
};

export class StageEngine {
  /**
   * @param {Object} args
   * @param {ReturnType<typeof import('./timeline.js').buildTimeline>} args.timeline
   * @param {HTMLElement}   args.track        tall element that creates the scroll distance
   * @param {HTMLElement}   args.stage        sticky 100vh viewport
   * @param {HTMLElement[]} args.layers       one element per section
   * @param {{current:number}[]} args.progressRefs  stable refs, one per section
   * @param {Object} [args.options]
   * @param {(index:number)=>void} [args.onActiveChange]
   * @param {(transitioning:boolean)=>void} [args.onTransitioningChange]
   * @param {number} [args.initialScreens]
   */
  constructor({
    timeline,
    track,
    stage,
    layers,
    progressRefs,
    options = {},
    onActiveChange,
    onTransitioningChange,
    initialScreens = 0,
  }) {
    this.timeline = timeline;
    this.track = track;
    this.stage = stage;
    this.layers = layers;
    this.progressRefs = progressRefs;
    this.options = { ...ENGINE_DEFAULTS, ...options };
    this.onActiveChange = onActiveChange;
    this.onTransitioningChange = onTransitioningChange;
    this.initialScreens = initialScreens;

    const n = layers.length;
    this._progressSubs = Array.from({ length: n }, () => new Set());
    this._visibleSubs = Array.from({ length: n }, () => new Set());
    this._frameSubs = new Set();

    this._visible = new Array(n).fill(false);
    this._styleCache = Array.from({ length: n }, () => ({}));

    this._active = -1;
    this._transitioning = false;
    this._nav = null; // Set<number> of layers allowed to show during a long-distance goTo

    this._s = 0; // raw scroll position (screens)
    this._smooth = 0; // smoothed position used for visuals
    this._applied = null;
    this._lastY = 0;

    this._settledS = 0; // where the last gesture came to rest
    this._window = [0, 0]; // gate: range the current gesture may travel
    this._pendingSettle = false;
    this._lastInput = 0;
    this._prevQuiet = Infinity;
    this._tween = null;
    this._destroyed = false;
    this._sBefore = null;
  }

  // ───────────────────────── lifecycle ─────────────────────────

  mount() {
    const root = document.documentElement;
    this._prev = {
      restoration: 'scrollRestoration' in history ? history.scrollRestoration : null,
      behavior: root.style.scrollBehavior,
    };
    // We position the scroll ourselves; the browser/CSS must not fight us.
    if (this._prev.restoration) history.scrollRestoration = 'manual';
    root.style.scrollBehavior = 'auto';

    this._reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    this._onReducedChange = () => {
      this._applied = null;
    };
    this._reduced.addEventListener?.('change', this._onReducedChange);

    this._measure();
    this._st = ScrollTrigger.create({
      trigger: this.track,
      start: 'top top',
      end: 'bottom bottom',
      invalidateOnRefresh: true,
      onRefresh: () => this._restoreAfterRefresh(),
    });
    ScrollTrigger.addEventListener('refreshInit', this._onRefreshInit);

    // Input is only *observed* (passive) to know when a gesture is happening.
    this._inputEvents = ['wheel', 'touchstart', 'touchmove', 'keydown', 'pointerdown'];
    this._inputEvents.forEach((type) => window.addEventListener(type, this._onInput, { passive: true }));

    window.scrollTo({ top: this.toPx(this.initialScreens), behavior: 'instant' });
    this._lastY = window.scrollY;
    this._s = this._smooth = this.toScreens(this._lastY);
    this._settledS = this._s;
    this._window = windowFor(this.timeline.rests, this._s);
    this._pendingSettle = true; // resolve an initial position that sits mid-transition
    this._lastInput = performance.now() - 1000;

    gsap.ticker.add(this._tick);
    this._apply(this._smooth);
    this._applied = this._smooth;
  }

  destroy() {
    this._destroyed = true;
    gsap.ticker.remove(this._tick);
    this._tween?.kill();
    this._tween = null;
    ScrollTrigger.removeEventListener('refreshInit', this._onRefreshInit);
    this._st?.kill();
    this._inputEvents?.forEach((type) => window.removeEventListener(type, this._onInput));
    this._reduced?.removeEventListener?.('change', this._onReducedChange);

    const root = document.documentElement;
    root.style.scrollBehavior = this._prev?.behavior ?? '';
    if (this._prev?.restoration) history.scrollRestoration = this._prev.restoration;
    this._progressSubs.forEach((s) => s.clear());
    this._visibleSubs.forEach((s) => s.clear());
    this._frameSubs.clear();
  }

  // ───────────────────────── geometry ─────────────────────────

  _measure() {
    const unit = this.stage.clientHeight || window.innerHeight;
    this.track.style.height = `${(this.timeline.total + 1) * unit}px`;
  }

  _onRefreshInit = () => {
    if (this._destroyed) return;
    this._sBefore = this._s;
    this._measure();
  };

  /** Keep the same *screen* position when the viewport is resized. */
  _restoreAfterRefresh() {
    if (this._destroyed || this._sBefore == null) return;
    const s = this._sBefore;
    this._sBefore = null;
    window.scrollTo({ top: this.toPx(s), behavior: 'instant' });
    this._lastY = window.scrollY;
  }

  _pxPerScreen() {
    const span = this._st ? this._st.end - this._st.start : 0;
    return this.timeline.total > 0 && span > 0 ? span / this.timeline.total : 1;
  }

  toScreens(y) {
    if (!this._st || this.timeline.total <= 0) return 0;
    return ((y - this._st.start) / (this._st.end - this._st.start || 1)) * this.timeline.total;
  }

  toPx(screens) {
    if (!this._st || this.timeline.total <= 0) return this._st ? this._st.start : 0;
    return this._st.start + (screens / this.timeline.total) * (this._st.end - this._st.start);
  }

  _jumpTo(screens) {
    window.scrollTo({ top: this.toPx(screens), behavior: 'instant' });
  }

  // ───────────────────────── input & settling ─────────────────────────

  _onInput = () => {
    this._lastInput = performance.now();
    this._pendingSettle = true;
  };

  /** A finished gesture: decide where to rest, and what the next gesture may do. */
  _settle(rawS) {
    const { rests } = this.timeline;
    const tol = TOLERANCE_PX / this._pxPerScreen();
    const onRest = rests.find((r) => Math.abs(r - rawS) <= tol);
    const s = onRest ?? rawS;

    const { target } = decideRest(this.timeline, s, this._settledS, { commit: this.options.commit });

    if (target == null) {
      // Free scrolling inside a long section: keep exactly where we are.
      this._settledS = s;
      this._window = windowFor(rests, s);
      return;
    }
    if (Math.abs(target - rawS) <= tol) {
      this._settledS = target;
      this._window = windowFor(rests, target);
      if (Math.abs(target - rawS) > 0.25 / this._pxPerScreen()) this._jumpTo(target);
      return;
    }
    this._snapTo(target);
  }

  _snapTo(target, { duration, ease = 'power2.inOut' } = {}) {
    this._tween?.kill();
    const dist = Math.abs(target - this._s);
    const { min, max } = this.options.snapDuration;
    const d = duration ?? (this._reduced.matches ? 0.01 : clamp(0.35 + dist * 0.75, min, max));

    this._pendingSettle = false;
    this._tween = gsap.to(window, {
      scrollTo: { y: this.toPx(target), autoKill: false }, // keep control even if the user keeps scrolling
      duration: d,
      ease,
      overwrite: true,
      onComplete: () => this._arrived(target),
    });
  }

  _arrived(target) {
    this._tween = null;
    this._nav = null;
    this._settledS = target;
    // Hold the gate shut until input goes quiet, so trackpad inertia that is
    // still arriving cannot push us on to the *next* section (the old double-skip bug).
    this._window = [target, target];
    this._pendingSettle = true;
    this._lastInput = performance.now();
    this._lastY = window.scrollY;
    this._applied = null;
  }

  // ───────────────────────── frame loop ─────────────────────────

  _tick = (_time, deltaTime) => {
    if (this._destroyed) return;
    const dt = Math.min(deltaTime, 100) / 1000;
    const now = performance.now();
    const y = window.scrollY;

    // Scroll we didn't cause (wheel/touch momentum, keys, scrollbar) = user input.
    if (!this._tween && Math.abs(y - this._lastY) > 0.5) {
      this._lastInput = now;
      this._pendingSettle = true;
    }

    let s = this.toScreens(y);

    // GATE: a gesture may not travel past its window. Clamp *before* painting.
    if (this.options.gate && !this._tween) {
      const tol = TOLERANCE_PX / this._pxPerScreen();
      const [lo, hi] = this._window;
      if (s < lo - tol || s > hi + tol) {
        s = clamp(s, lo, hi);
        this._jumpTo(s);
      }
    }
    this._lastY = window.scrollY;
    this._s = s;

    // Smooth, then draw.
    const tau = this._reduced.matches ? 0 : this.options.smoothing;
    this._smooth = Math.abs(this._smooth - s) < 1e-4 ? s : damp(this._smooth, s, tau, dt);
    if (this._smooth !== this._applied) {
      this._apply(this._smooth);
      this._applied = this._smooth;
    }

    // Settle once input has been quiet for a moment.
    // A long frame (main-thread stall, e.g. a heavy section mounting) is NOT evidence that the
    // user stopped: input queued during the stall is delivered right after it. So if the stall
    // began while input was still flowing, wait one more frame before deciding.
    const delayMs = this.options.settleDelay * 1000;
    const quiet = now - this._lastInput;
    const stalled = deltaTime > delayMs * 0.6 && this._prevQuiet < delayMs;
    if (!this._tween && this._pendingSettle && quiet >= delayMs && !stalled) {
      this._pendingSettle = false;
      this._settle(s);
    }
    this._prevQuiet = quiet;

    if (this._frameSubs.size) this._emitFrame();
  };

  // ───────────────────────── drawing ─────────────────────────

  _apply(s) {
    const sample = sampleTimeline(this.timeline, s);
    const reduced = this._reduced.matches;
    let layerStateChanged = false;
    let transitioning = false;

    sample.scenes.forEach((state, i) => {
      const scene = this.timeline.scenes[i];
      const layer = this.layers[i];
      if (!layer) return;

      const shown = state.visible && (!this._nav || this._nav.has(i));
      if (shown !== this._visible[i]) {
        this._visible[i] = shown;
        layer.style.visibility = shown ? 'visible' : 'hidden';
        this._visibleSubs[i].forEach((fn) => fn(shown));
        layerStateChanged = true;
      }

      if (shown) {
        const name = reduced ? 'fade' : scene.transitionStyle || this.options.transitionStyle;
        const css = getTransition(name)(state.enter, state.exit, { blur: this.options.blur });
        const cache = this._styleCache[i];
        for (const key of ['opacity', 'transform', 'filter', 'willChange']) {
          if (cache[key] !== css[key]) {
            layer.style[key] = css[key];
            cache[key] = css[key];
          }
        }
        if ((state.enter > 0 && state.enter < 1) || (state.exit > 0 && state.exit < 1)) transitioning = true;
      }

      const ref = this.progressRefs[i];
      if (ref && Math.abs(ref.current - state.progress) > 1e-5) {
        ref.current = state.progress;
        this._progressSubs[i].forEach((fn) => fn(state.progress));
      }
    });

    if (sample.active !== this._active) {
      this._active = sample.active;
      this.stage.dataset.active = this.timeline.scenes[sample.active]?.id ?? '';
      layerStateChanged = true;
      this.onActiveChange?.(sample.active);
    }

    if (layerStateChanged) this._syncLayers();

    if (transitioning !== this._transitioning) {
      this._transitioning = transitioning;
      this.stage.dataset.phase = transitioning ? 'transition' : 'dwell';
      this.onTransitioningChange?.(transitioning);
    }
  }

  /** Only the active layer is interactive/focusable; others are inert. */
  _syncLayers() {
    this.layers.forEach((layer, i) => {
      if (!layer) return;
      const isActive = i === this._active;
      layer.style.pointerEvents = this._visible[i] && isActive ? 'auto' : 'none';
      layer.style.zIndex = isActive ? '2' : '1';
      layer.inert = !isActive;
    });
  }

  _emitFrame() {
    const info = this.getState();
    this._frameSubs.forEach((fn) => fn(info));
  }

  // ───────────────────────── public API ─────────────────────────

  getState() {
    return {
      s: this._smooth,
      raw: this._s,
      total: this.timeline.total,
      active: this._active,
      activeId: this.timeline.scenes[this._active]?.id,
      window: this._window,
      settledS: this._settledS,
      animating: !!this._tween,
      pendingSettle: this._pendingSettle,
      transitioning: this._transitioning,
    };
  }

  getProgress(index) {
    return this.progressRefs[index]?.current ?? 0;
  }

  getVisible(index) {
    return !!this._visible[index];
  }

  subscribeProgress(index, fn) {
    this._progressSubs[index]?.add(fn);
    return () => this._progressSubs[index]?.delete(fn);
  }

  subscribeVisible(index, fn) {
    this._visibleSubs[index]?.add(fn);
    return () => this._visibleSubs[index]?.delete(fn);
  }

  subscribeFrame(fn) {
    this._frameSubs.add(fn);
    return () => this._frameSubs.delete(fn);
  }

  /**
   * Scroll to a section (by id or index).
   * @param {{ edge?: 'start'|'end', immediate?: boolean }} [opts]
   */
  goTo(idOrIndex, { edge = 'start', immediate = false } = {}) {
    const idx = resolveIndex(this.timeline, idOrIndex);
    if (idx < 0) return;
    const scene = this.timeline.scenes[idx];
    const target = edge === 'end' ? scene.end : scene.start;

    if (immediate) {
      this._tween?.kill();
      this._tween = null;
      this._nav = null;
      this._jumpTo(target);
      this._lastY = window.scrollY;
      this._s = this._smooth = target; // no smoothing across an instant jump (would sweep through every section)
      this._arrived(target);
      return;
    }

    const hops = Math.abs(idx - Math.max(0, this._active));
    // For long-distance jumps, show only source and destination instead of flashing through every section.
    this._nav = hops > 1 ? new Set([this._active, idx]) : null;
    const dist = Math.abs(target - this._s);
    this._snapTo(target, { duration: clamp(0.7 + dist * 0.18, 0.8, 2), ease: 'power3.inOut' });
  }
}
