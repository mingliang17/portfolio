// src/scroll/ScrollStage.jsx
//
// <ScrollStage sections={[...]} /> — one scroll system for the whole page.
//
//   <div class="scroll-track">          ← tall; creates the native scroll distance
//     <div class="scroll-stage">        ← position: sticky; stays on screen
//       <div class="scroll-layer"/>     ← one per section, stacked; the engine fades/moves them
//       {children}                      ← overlays (nav dots, HUD, ...)
//
// Sections are declarative:
//   { id: 'hero',  kind: 'page', render: (scene) => <Hero {...scene} /> }
//   { id: 'spin',  kind: 'long', length: 5, checkpoints: 5, render: (scene) => <Spin {...scene} /> }
// Optional per-section fields: `sphere` (background pattern name), `transition`, `transitionStyle`, `keepMounted`.
//
// `scene` = { id, index, kind, isActive, isNear, isVisible, progress, progressRef }

import React, { Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { StageContext, SceneContext, useSceneProgress, useSceneVisible } from './context.js';
import { StageEngine } from './engine/StageEngine.js';
import { buildTimeline, resolveIndex } from './engine/timeline.js';
import ScrollDebug from './ScrollDebug.jsx';

// A failing section (e.g. a 3D model or HDR that fails to load) must not unmount the
// whole page. Without this, one rejected fetch inside a <Canvas> blanked every section.
class SceneBoundary extends React.Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    console.error(`[ScrollStage] section "${this.props.id}" failed to render:`, error);
  }

  render() {
    if (this.state.failed) return <div className="scene-error" role="alert">This section could not be loaded.</div>;
    return this.props.children;
  }
}

// One scene: subscribes to just ITS progress, so only the scene being scrolled re-renders.
const SceneHost = React.memo(function SceneHost({ section, index, engine, progressRef, active, mountRadius }) {
  const sceneRef = useMemo(() => ({ engine, index }), [engine, index]);
  const progress = useSceneProgress(0.001, sceneRef);
  const isVisible = useSceneVisible(sceneRef);

  const isActive = index === active;
  const isNear = Math.abs(index - active) <= mountRadius;
  const mounted = isNear || section.keepMounted || isVisible;

  const scene = useMemo(
    () => ({
      id: section.id,
      index,
      kind: section.kind || 'page',
      isActive,
      isNear,
      isVisible,
      progress,
      progressRef,
      engine,
    }),
    [section.id, section.kind, index, isActive, isNear, isVisible, progress, progressRef, engine]
  );

  return (
    <SceneContext.Provider value={scene}>
      <SceneBoundary id={section.id}>
        {/* Loading stays LOCAL to the section. Without this, a section that suspends makes React hide
            the whole stage (display: none !important) → the document collapses → scrollY resets to 0. */}
        <Suspense fallback={<div className="scene-loading" aria-busy="true" />}>
          {mounted ? section.render(scene) : null}
        </Suspense>
      </SceneBoundary>
    </SceneContext.Provider>
  );
});

const layoutKeyOf = (sections, transition) =>
  `${transition}|` +
  sections
    .map((s) =>
      [s.id, s.kind || 'page', s.length ?? '', JSON.stringify(s.checkpoints ?? ''), s.snap ?? '', s.transition ?? '', s.transitionStyle ?? ''].join(':')
    )
    .join('|');

export default function ScrollStage({
  sections,
  transition = 1,
  smoothing,
  blur,
  gate,
  commit,
  settleDelay,
  transitionStyle,
  mountRadius = 1,
  initialSection,
  syncHash = false,
  debug = false,
  className = '',
  children,
}) {
  const layoutKey = layoutKeyOf(sections, transition);
  const sectionsRef = useRef(sections);
  sectionsRef.current = sections;

  const timeline = useMemo(() => buildTimeline(sectionsRef.current, { transition }), [layoutKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const progressRefs = useMemo(() => timeline.scenes.map(() => ({ current: 0 })), [timeline]);

  const initialIndex = useMemo(() => {
    const wanted = initialSection ?? (syncHash && typeof window !== 'undefined' ? decodeURIComponent(window.location.hash.slice(1)) : '');
    const idx = wanted ? resolveIndex(timeline, wanted) : -1;
    return idx >= 0 ? idx : 0;
  }, [timeline]); // eslint-disable-line react-hooks/exhaustive-deps

  const trackRef = useRef(null);
  const stageRef = useRef(null);
  const layerRefs = useRef([]);

  const [engine, setEngine] = useState(null);
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const optionsKey = JSON.stringify([smoothing, blur, gate, commit, settleDelay, transitionStyle]);

  useLayoutEffect(() => {
    const options = Object.fromEntries(
      Object.entries({ smoothing, blur, gate, commit, settleDelay, transitionStyle }).filter(([, v]) => v !== undefined)
    );
    const instance = new StageEngine({
      timeline,
      track: trackRef.current,
      stage: stageRef.current,
      layers: layerRefs.current.slice(0, timeline.scenes.length),
      progressRefs,
      options,
      initialScreens: timeline.scenes[initialIndex]?.start ?? 0,
      onActiveChange: setActiveIndex,
      onTransitioningChange: setIsTransitioning,
    });
    instance.mount();
    setEngine(instance);
    if (debug && typeof window !== 'undefined') window.__scrollStage = instance;

    return () => {
      instance.destroy();
      if (debug && window.__scrollStage === instance) delete window.__scrollStage;
    };
  }, [timeline, progressRefs, optionsKey, debug]); // eslint-disable-line react-hooks/exhaustive-deps

  // Deep links: keep #section-id in the URL (router-safe: history.state is preserved).
  useEffect(() => {
    if (!syncHash) return;
    const id = timeline.scenes[activeIndex]?.id;
    if (!id) return;
    const { pathname, search } = window.location;
    const url = activeIndex === 0 ? `${pathname}${search}` : `${pathname}${search}#${encodeURIComponent(id)}`;
    window.history.replaceState(window.history.state, '', url);
  }, [activeIndex, syncHash, timeline]);

  // In-page hash changes (<a href="#spin">, edited address bar) navigate too. Our own URL updates
  // use replaceState, which does not fire `hashchange`, so there is no feedback loop.
  useEffect(() => {
    if (!syncHash || !engine) return undefined;
    const onHashChange = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (id) engine.goTo(id);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [syncHash, engine]);

  const goTo = useCallback((id, opts) => engine?.goTo(id, opts), [engine]);

  const meta = useMemo(
    () => sections.map((s, i) => ({ id: s.id, label: s.label ?? s.id, kind: s.kind || 'page', index: i })),
    [layoutKey] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const stageValue = useMemo(
    () => ({
      engine,
      sections: meta,
      timeline,
      activeIndex,
      activeId: meta[activeIndex]?.id,
      isTransitioning,
      goTo,
    }),
    [engine, meta, timeline, activeIndex, isTransitioning, goTo]
  );

  return (
    <StageContext.Provider value={stageValue}>
      <div className={`scroll-track ${className}`} ref={trackRef}>
        <div className="scroll-stage" ref={stageRef} data-active={meta[activeIndex]?.id}>
          {sections.map((section, i) => (
            <div
              key={section.id}
              ref={(el) => (layerRefs.current[i] = el)}
              className={`scroll-layer scroll-layer--${section.kind || 'page'} section-${section.id}`}
              data-section={section.id}
              data-sphere={section.sphere || undefined} // sphere background pattern for this section (src/sphere)
              data-kind={section.kind || 'page'}
              style={{ visibility: i === initialIndex ? 'visible' : 'hidden' }}
              role="region"
              aria-label={section.label ?? section.id}
            >
              <SceneHost
                section={section}
                index={i}
                engine={engine}
                progressRef={progressRefs[i]}
                active={activeIndex}
                mountRadius={mountRadius}
              />
            </div>
          ))}
          {children}
          {debug && <ScrollDebug />}
        </div>
      </div>
    </StageContext.Provider>
  );
}
