// src/sphere/SphereBackground.jsx
//
// A full-screen, fixed background: a zoomed-in patch of a light-gray vector sphere (only the centre
// 30% of the sphere is ever visible). The camera is fixed; scrolling rolls the sphere by 45° per
// page length (one viewport height of scrolling), moving it straight up the screen. The line pattern
// changes per page/section.
//
// It is mounted once in _app.jsx. It never touches scrolling: it only reads window.scrollY and,
// on project pages, the active section the scroll stage publishes as `.scroll-stage[data-active]`.
// It redraws only while something is changing, so it costs nothing when the page is idle.

import { useEffect, useRef } from 'react';
import { SphereRenderer } from './renderer.js';
import { resolvePattern, FADE_SECONDS } from './config.js';

const SMOOTH_SECONDS = 0.1; // lag between the scroll position and the rotation (matches the stage's own smoothing)

// The pattern for the section on screen: the section's own `sphere` field wins (see ScrollStage's
// data-sphere attribute), then the id/route tables in config.js.
function currentPattern(route, stage) {
  const id = stage?.dataset.active;
  let override;
  if (id) {
    const layer = stage.querySelector(`[data-section="${window.CSS?.escape ? CSS.escape(id) : id}"]`);
    override = layer?.dataset.sphere;
  }
  return resolvePattern(route, id, override);
}

export default function SphereBackground({ route = '/' }) {
  const canvasRef = useRef(null);
  const routeRef = useRef(route);
  const wakeRef = useRef(null);
  const snapRef = useRef(0);

  routeRef.current = route;

  // A new route resets the scroll position: jump instead of spinning back.
  useEffect(() => {
    snapRef.current = performance.now() + 300;
    wakeRef.current?.();
  }, [route]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const renderer = new SphereRenderer(canvas);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

    let raf = 0;
    let last = 0;
    let stage = null;
    let screens = 0;
    let layers = [];
    let wanted = null; // pattern the last frame was heading for

    const fit = () => renderer.resize(window.innerWidth, window.innerHeight, window.devicePixelRatio);

    const tick = (now) => {
      raf = 0;
      const dt = Math.min(0.1, Math.max(0.001, (now - last) / 1000));
      last = now;

      if (!stage || !stage.isConnected) stage = document.querySelector('.scroll-stage');
      const unit = stage?.clientHeight || window.innerHeight || 1; // one screen of scrolling
      const target = window.scrollY / unit;

      // Smooth the rotation.
      if (reduced.matches || now < snapRef.current) screens = target;
      else screens += (target - screens) * (1 - Math.exp(-dt / SMOOTH_SECONDS));
      const settling = Math.abs(target - screens) > 1e-4;
      if (!settling) screens = target;

      // Cross-fade between patterns.
      const want = currentPattern(routeRef.current, stage);
      wanted = want;
      if (!layers.some((l) => l.name === want)) layers.push({ name: want, w: layers.length ? 0 : 1 });
      const step = reduced.matches ? 1 : dt / FADE_SECONDS;
      let fading = false;
      layers = layers
        .map((l) => {
          const w = l.name === want ? Math.min(1, l.w + step) : Math.max(0, l.w - step);
          if (w !== (l.name === want ? 1 : 0)) fading = true;
          return { name: l.name, w };
        })
        .filter((l) => l.name === want || l.w > 0);

      renderer.draw(screens, layers);
      if (settling || fading) raf = requestAnimationFrame(tick);
    };

    const wake = () => {
      if (raf) return;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    };
    wakeRef.current = wake;

    const onResize = () => {
      fit();
      wake();
    };

    // The scroll stage mounts after us (dynamic import) and changes section without a scroll event
    // when it restores a deep link, so check the wanted pattern a few times a second. Idle cost: one querySelector.
    const watch = window.setInterval(() => {
      const s = stage && stage.isConnected ? stage : document.querySelector('.scroll-stage');
      if (currentPattern(routeRef.current, s) !== wanted) wake();
    }, 250);

    fit();
    wake();
    window.addEventListener('scroll', wake, { passive: true });
    window.addEventListener('resize', onResize);

    return () => {
      wakeRef.current = null;
      window.clearInterval(watch);
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('scroll', wake);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <div className="sphere-bg" aria-hidden="true">
      <canvas ref={canvasRef} className="sphere-bg-canvas" />
    </div>
  );
}
