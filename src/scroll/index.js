// src/scroll/index.js — public API of the scroll system.
// See docs/ScrollArchitecture.md for the mental model and recipes.

export { default as ScrollStage } from './ScrollStage.jsx';
export { default as SectionNav } from './SectionNav.jsx';
export {
  useStage,
  useScene,
  useSceneProgress,
  useSceneProgressRef,
  useSceneFrame,
  useSceneVisible,
} from './context.js';
export { lockScroll, useScrollLock, isScrollLocked } from './scrollLock.js';
export { registerTransition } from './engine/transitions.js';
