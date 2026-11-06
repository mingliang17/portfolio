// src/components/home/CameraIntro.jsx
//
// SHELVED viewfinder intro. Set SHOW_CAMERA_INTRO to true in src/views/Home.jsx to bring it back; nothing else needs to change.
import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

const CameraIntro = ({ onComplete }) => {
  const ref = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ onComplete });

      gsap.set('.ci-overlay',  { opacity: 1 });
      gsap.set('.ci-flash',    { opacity: 0 });
      gsap.set(['.ci-corner', '.ci-grid-line'], { opacity: 0 });
      gsap.set('.ci-hud-text',  { opacity: 0, y: 8 });
      gsap.set('.ci-af-label',  { opacity: 0 });
      gsap.set('.ci-crosshair', { opacity: 0 });

      tl
        .to('.ci-overlay',     { opacity: 0.55, duration: 0.8, ease: 'power2.out' }, 0)
        .to('.ci-hud-text',    { opacity: 1, y: 0, duration: 0.5, stagger: 0.1 }, 0.3)
        .to('.ci-corner',      { opacity: 0.95, duration: 0.4, stagger: 0.06 }, 0.7)
        .to('.ci-crosshair',   { opacity: 0.5, duration: 0.3 }, 0.9)
        .to('.ci-grid-line',   { opacity: 0.18, duration: 0.4 }, 0.9)
        .to('.ci-frame-outer', { scale: 0.88, duration: 0.6, ease: 'power3.inOut', transformOrigin: 'center' }, 1.8)
        .to('.ci-overlay',     { opacity: 0.28, duration: 0.6 }, 1.8)
        .to('.ci-af-label',    { opacity: 1, duration: 0.3 }, 2.2)
        .to('.ci-corner',      { borderColor: '#00ff88', duration: 0.3 }, 2.1)
        .to('.ci-overlay',     { opacity: 1, duration: 0.07, ease: 'power1.in' }, 2.7)
        .to('.ci-flash',       { opacity: 1, duration: 0.05 }, 2.7)
        .to('.ci-flash',       { opacity: 0, duration: 0.3, ease: 'power2.out' }, 2.75)
        .to('.ci-overlay',     { opacity: 0, duration: 1.1, ease: 'power2.inOut' }, 2.75);
    }, ref);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={ref} className="ci-wrapper" style={{ pointerEvents: 'none' }}>
      <div className="ci-overlay" />
      <div className="ci-flash" />
      <div className="ci-frame-outer">
        <div className="ci-corner ci-tl" />
        <div className="ci-corner ci-tr" />
        <div className="ci-corner ci-bl" />
        <div className="ci-corner ci-br" />
        <div className="ci-crosshair">
          <div className="ci-ch-h" />
          <div className="ci-ch-v" />
        </div>
        <div className="ci-grid">
          <div className="ci-grid-line ci-gl-h" style={{ top: '33.33%' }} />
          <div className="ci-grid-line ci-gl-h" style={{ top: '66.66%' }} />
          <div className="ci-grid-line ci-gl-v" style={{ left: '33.33%' }} />
          <div className="ci-grid-line ci-gl-v" style={{ left: '66.66%' }} />
        </div>
        <div className="ci-af-label">◉ AF LOCK</div>
      </div>
      <div className="ci-hud ci-hud-top">
        <span className="ci-hud-text">ISO 1600</span>
        <span className="ci-hud-text">⬤ REC</span>
        <span className="ci-hud-text">f/2.8</span>
      </div>
      <div className="ci-hud ci-hud-bottom">
        <span className="ci-hud-text">1/200s</span>
        <span className="ci-hud-text">EARTH — LIVE VIEW</span>
        <span className="ci-hud-text">35mm</span>
      </div>
    </div>
  );
};

export default CameraIntro;
