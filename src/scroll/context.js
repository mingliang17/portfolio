// src/scroll/context.js
//
// Hooks for reading scroll state. Pick the cheapest one that does the job:
//
//   useSceneProgressRef()   → ref, ZERO re-renders. For R3F useFrame / canvas / GSAP.
//   useSceneFrame(cb)       → per-frame callback, ZERO re-renders. For imperative DOM writes.
//   useSceneProgress()      → number state (re-renders ≤ 1×/frame while scrolling). For React UI.
//   useScene()              → { id, index, isActive, isNear, isVisible, ... } (changes rarely)
//   useStage()              → { activeIndex, goTo, sections, ... }     (changes rarely)

import { createContext, useContext, useEffect, useRef, useState } from 'react';

export const StageContext = createContext(null);
export const SceneContext = createContext(null);

export function useStage() {
  const ctx = useContext(StageContext);
  if (!ctx) throw new Error('useStage must be used inside <ScrollStage>');
  return ctx;
}

export function useScene() {
  const ctx = useContext(SceneContext);
  if (!ctx) throw new Error('useScene must be used inside a <ScrollStage> section');
  return ctx;
}

const round = (v, precision) => Math.round(v / precision) * precision;

/**
 * Progress (0..1) of a section as React state, quantised to `precision` so it
 * only re-renders when the value visibly changes.
 * `engine`/`index` are passed explicitly so ScrollStage can use it for its own render-prop;
 * inside a section prefer the no-argument form.
 */
export function useSceneProgress(precision = 0.001, scene) {
  const fromContext = useContext(SceneContext);
  const { engine, index } = scene || fromContext || {};
  const [value, setValue] = useState(() => (engine ? round(engine.getProgress(index), precision) : 0));

  useEffect(() => {
    if (!engine) return undefined;
    setValue(round(engine.getProgress(index), precision));
    return engine.subscribeProgress(index, (p) => setValue(round(p, precision)));
  }, [engine, index, precision]);

  return value;
}

/** Stable ref holding the live 0..1 progress. Reading it never re-renders. */
export function useSceneProgressRef() {
  return useScene().progressRef;
}

/**
 * Run `callback(progress)` on every progress change without re-rendering React.
 * Ideal for writing to the DOM/canvas directly.
 */
export function useSceneFrame(callback) {
  const { engine, index } = useScene();
  const saved = useRef(callback);
  saved.current = callback;

  useEffect(() => {
    if (!engine) return undefined;
    saved.current(engine.getProgress(index));
    return engine.subscribeProgress(index, (p) => saved.current(p));
  }, [engine, index]);
}

/** True while the section's layer is on screen (during its dwell or either transition). */
export function useSceneVisible(scene) {
  const fromContext = useContext(SceneContext);
  const { engine, index } = scene || fromContext || {};
  const [visible, setVisible] = useState(() => (engine ? engine.getVisible(index) : false));

  useEffect(() => {
    if (!engine) return undefined;
    setVisible(engine.getVisible(index));
    return engine.subscribeVisible(index, setVisible);
  }, [engine, index]);

  return visible;
}
