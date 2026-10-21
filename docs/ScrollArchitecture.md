# Scroll architecture

All scrolling on project pages is handled by one module: `src/scroll/`.
This document explains the mental model, how to add or change sections, and the rules
that keep it from breaking again.

## Why it was rewritten

The old system ran **two scroll systems at once**: a hook (`useUnifiedScroll`) that captured
wheel events and faked scrolling, and long sections written for native `position: sticky`.
Sticky cannot work when the page doesn't really scroll, so every long section was a
workaround on top of a workaround. It also had no touch support, double-skipped on trackpad
momentum, landed at the *start* of a long section when scrolling up into it, re-rendered the
whole page on every scroll tick, and kept all six WebGL canvases running.

The new system has **one source of truth: the browser's native scroll position.**
Wheel, touch, keyboard, scrollbar, find-in-page and anchors all just work, because the engine
never intercepts input. It only *reads* `window.scrollY`.

## Mental model

The whole experience is one timeline measured in **screens** (1 screen = 1 viewport height of scrolling):

```
 hero        transition      anime (long, 6.25 screens)      transition     carousel
  |-------------|=================================================|-------------|
  0             1                                                  7.25
  page: a point  <- 1 screen ->  long: progress 0 → 1                          page: a point
```

- **`page` section** – one resting screen (dwell = 0).
- **`long` section** – scrolled through continuously; receives `progress` from 0 to 1.
- **Transition zone** – between two sections (default 1 screen). The outgoing section *exits*,
  the incoming one *enters*. Both are pure functions of the scroll position, so **scrolling
  backwards reverses the transition automatically** and scrolling up into a long section lands
  you at its **end**.
- The page is `.scroll-track` (tall, creates the native scroll distance) containing
  `.scroll-stage` (`position: sticky`, one viewport tall) containing one `.scroll-layer` per section.
  The engine moves/fades layers; it never moves the page.

### Resting, snapping and the gate

When a gesture finishes (input quiet for `settleDelay`, 120 ms) the engine decides where to rest:

| Situation | Result |
|---|---|
| Between two sections | Commit to the next one if you moved ≥ `commit` (0.03 screens ≈ one wheel notch), otherwise snap back. A tiny accidental scroll goes nowhere. |
| Inside a long section | Free: stays exactly where you stopped (optionally pulled toward a checkpoint, see below). |
| Section with `snap: 'mandatory'` checkpoints | Steps one checkpoint per gesture. |

**The gate:** from where a gesture starts, it may cross **at most one rest point** in each
direction. This is what makes *one flick = one section* even when a trackpad keeps sending
inertia events for a second afterwards. After a snap the gate is shut until input goes quiet,
so leftover momentum can't push you on to the next section. A main-thread stall (a heavy
section mounting) is *not* treated as "the user stopped".

Consequence worth knowing: scrolling continuously from the start of a long section stops at
its end; the next gesture crosses into the next section. Starting from the *middle* of a
long section, one gesture may flow across the boundary. Both are intentional.

## Adding a section

1. Write a component that fills its parent and takes `scrollProgress` / `isVisible` / `isActive`.
   **Do not** set its own height, `position: sticky` or `position: fixed` (see rules below).
2. Add one entry in `buildSections()` in `src/views/templates/ProjectPage.jsx`:

```jsx
out.push({
  id: 'timeline',            // unique; also the #hash and nav label key
  label: 'Timeline',         // nav dot tooltip
  kind: 'long',              // 'page' | 'long'
  length: 4,                 // screens of scrolling (long only; default 3)
  checkpoints: 4,            // optional: count, or [0, .3, 1] positions
  snap: 'proximity',         // 'proximity' (default with checkpoints) | 'mandatory' | false
  render: (scene) => <Timeline isVisible={scene.isVisible} scrollProgress={scene.progress} />,
});
```

### Section options

| Option | Default | Meaning |
|---|---|---|
| `id` | – | Unique id. Used for `goTo(id)` and the URL hash. |
| `kind` | `'page'` | `'page'` = one screen, `'long'` = scroll-driven. |
| `length` | `0` page / `3` long | Scroll distance in screens. |
| `checkpoints` | none | Count (evenly spaced) or array of 0..1 positions. |
| `snap` | `'proximity'` if checkpoints | `'proximity'` pulls toward a checkpoint within 25% of a segment; `'mandatory'` steps checkpoint to checkpoint; `false` never snaps. |
| `transition` | `1` | Screens of transition *into* this section. |
| `transitionStyle` | `'fly'` | `'fly'`, `'fade'`, `'cut'`, or one you register. |
| `keepMounted` | `false` | Keep mounted even when far from the active section. |
| `render(scene)` | – | Returns the section's React tree. |

### `scene` (argument to `render`)

`{ id, index, kind, isActive, isNear, isVisible, progress, progressRef, engine }`

- `isActive` – this section is the current one (flips at the midpoint of a transition).
- `isNear` – within `mountRadius` (default 1) of the active section. Sections outside this are **unmounted**, which frees their WebGL contexts.
- `isVisible` – on screen at all (dwell or mid-transition). **Use it for `<Canvas frameloop={isVisible ? 'always' : 'never'}>`.**
- `progress` – 0..1 as React state (re-renders at most once per frame while scrolling).
- `progressRef` – `{ current }`, the same value with **no re-renders**.

## Reading scroll state – pick the cheapest hook

| Hook | Re-renders? | Use for |
|---|---|---|
| `useSceneProgressRef()` | never | R3F `useFrame`, canvas, GSAP |
| `useSceneFrame(cb)` | never | imperative DOM writes |
| `useSceneProgress()` | ≤1×/frame while scrolling | plain React UI |
| `useScene()` | rarely | `isActive` / `isVisible` etc. |
| `useStage()` | rarely | `{ activeIndex, activeId, goTo, sections, isTransitioning }` |

React context does **not** cross the R3F `<Canvas>` boundary, so pass `progressRef` into the
canvas as a prop (as the existing sections do) rather than calling the hooks inside it.

Programmatic navigation: `const { goTo } = useStage(); goTo('spin')` or `goTo('spin', { edge: 'end' })`.
Far jumps show only the source and destination instead of flashing through every section.

## Rules of the road

1. **Sections never set their own height, `sticky` or `fixed`.** They fill their layer.
   `position: fixed` inside a section escapes the layer and covers the whole page.
2. **No `overflow: hidden/auto` between `<html>` and `.scroll-track`.** It turns that element
   into a scroll container and silently breaks `position: sticky`. Use `overflow-x: clip`
   (as `core.css` now does for `body`).
3. **No `scroll-behavior: smooth` on `html`.** It animates every programmatic scroll on top of
   the engine's own tweens. The engine sets it to `auto` while mounted.
4. **Only `lockScroll()` / `useScrollLock()` may stop the page scrolling** (menus, modals).
   It is ref-counted. Never write `document.body.style.overflow` directly.
5. **Don't add your own wheel/touch/scroll listeners that move the page.** If you need to react to
   scroll, subscribe via the hooks above.
6. **Loading must stay local.** Every section is wrapped in its own `<Suspense>` and error
   boundary. If a section suspended with only the app-level `<Suspense>` above it, React would
   hide the whole stage (`display: none !important`), the document height would collapse to 0
   and the browser would reset `scrollY` to the top.
7. **Pause expensive work when not visible.** The engine marks non-active layers `inert`, and
   `scroll.css` pauses all CSS animations inside them. 3D canvases still need `frameloop` from `isVisible`.

## Tuning

Props on `<ScrollStage>` (all optional):

| Prop | Default | Effect |
|---|---|---|
| `transition` | `1` | Default transition length in screens. |
| `smoothing` | `0.09` | Seconds of lag between scroll and visuals. `0` = none. |
| `blur` | `14` | Peak blur (px) of the `fly` transition. |
| `commit` | `0.03` | Screens of movement needed to commit to the next section. |
| `settleDelay` | `0.12` | Seconds of input silence before a gesture counts as finished. |
| `gate` | `true` | One boundary per gesture. `false` allows free multi-section scrolling. |
| `mountRadius` | `1` | How many neighbours stay mounted. |
| `syncHash` | `false` | Keep `#section-id` in the URL (router-safe). |
| `debug` | `false` | Live HUD. Also enabled by `?scrolldebug` on project pages. |

Custom transition:

```js
import { registerTransition } from '@/scroll';
// enter: 0→1 as the section arrives, exit: 0→1 as it leaves
registerTransition('zoom', (enter, exit) => ({
  opacity: String(enter * (1 - exit)),
  transform: `scale(${0.8 + 0.2 * enter + 0.2 * exit})`,
  filter: 'none',
  willChange: 'transform, opacity',
}));
```

Users with `prefers-reduced-motion: reduce` automatically get a plain cross-fade and no smoothing.

## Files

```
src/scroll/
  ScrollStage.jsx        the component (track + sticky stage + layers)
  SectionNav.jsx         dot navigation
  ScrollDebug.jsx        HUD
  context.js             hooks
  scrollLock.js          ref-counted scroll lock
  scroll.css             the ONLY stylesheet that knows about the stage
  engine/
    timeline.js          PURE  section config → geometry; scroll position → progress/enter/exit
    snap.js              PURE  rest points, gate window, commit rules
    transitions.js       PURE  fly / fade / cut + registerTransition
    math.js              PURE  helpers
    StageEngine.js       the only imperative part: reads scrollY, writes layer styles, settles gestures
    engine.test.mjs      unit tests for the pure modules
```

The pure modules import nothing from the DOM or GSAP, so they are unit-tested with Node's
built-in runner: `npm test`.

Browser-level behaviour (wheel, momentum, keyboard, touch, resize, reduced motion, deep links) is
covered by the Playwright scripts in `tests/e2e/` (see its README).

## Debugging

Open any project with `?scrolldebug`. The HUD shows the active section, position in screens,
the gate window `[lo, hi]`, the last settled position, and whether the engine is
`idle` / in a `gesture` / `snapping`. In debug mode the engine is also on `window.__scrollStage`
(`getState()`, `goTo()`, and a mutable `options` object for live tuning).

Common symptoms:

| Symptom | Likely cause |
|---|---|
| Page jumps to the top when a section loads | A section suspended with no local `<Suspense>` (rule 6). |
| A section's content covers other sections | `position: fixed` inside a section (rule 1). |
| Sticky/pinning does nothing | An ancestor has `overflow` set (rule 2). |
| Scroll feels animated twice / laggy | `scroll-behavior: smooth` is back on `html` (rule 3). |
| Can't scroll past a long section | Expected: one gesture crosses one boundary. Scroll again. Set `gate={false}` to disable. |

## Known limitations

- Tested in Chromium only (wheel, touch, keyboard, resize, reduced motion). Safari and Firefox are untested.
- The gate clamps the scroll position inside the engine's frame callback. During a long
  main-thread stall a hard fling could briefly overshoot a boundary before the clamp runs.
  Not observed in testing, but not proven impossible on slow devices.
- Mobile browser URL-bar show/hide does not rebuild the layout (`ignoreMobileResize`), but
  `dvh` units may differ by a few pixels from the measured height.
- `mh2` references image files that are not in the repository.
- The carousel is expensive to paint (many `backdrop-filter` panels, animated blur, a ~9.7 MB image).
  This predates the scroll system but is the main frame-rate cost in transitions into it.
