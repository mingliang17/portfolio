// src/components/projects/HeroSection.jsx
import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';

export const HeroSection = ({
  imagePath,
  title,
  subtitle,
  isActive,
  apertureVideoPath = null,
  overlayVideoPath = null
}) => {
  const containerRef = useRef(null);
  const wrapperRef = useRef(null);
  const apertureRef = useRef(null);
  const overlayVideoRef = useRef(null);

  useEffect(() => {
    if (!isActive) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power2.inOut' } });

      // INITIAL STATE
      // The full-screen bg image is VISIBLE by default (z-index 0, behind overlay)
      // Overlay starts translucent, polaroid frame hidden
      gsap.set('.hero-bg-image-fullscreen', { scale: 1.08, opacity: 0, filter: 'blur(20px)' });
      gsap.set('.hero-viewfinder-overlay', { opacity: 0 });
      gsap.set('.hero-polaroid-frame', { opacity: 0, scale: 0.65, rotation: -8 });
      gsap.set('.hero-polaroid-image', { opacity: 0 });
      gsap.set(['.hero-vignette', '.hero-bokeh-container', '.hero-lens-flares', '.hero-chromatic-aberration'], { opacity: 0 });
      gsap.set('.hero-focus-overlay', { opacity: 0 });
      gsap.set('.hero-exposure-flash', { opacity: 0 });
      gsap.set(['.polaroid-title', '.polaroid-subtitle'], { opacity: 0, y: 15 });

      // PHASE 1 — Reveal background image + translucent overlay (camera viewfinder look)
      tl.to('.hero-bg-image-fullscreen', { opacity: 1, filter: 'blur(0px)', scale: 1, duration: 1.0, ease: 'power3.out' }, 0)
        .to('.hero-viewfinder-overlay', { opacity: 0.32, duration: 0.8 }, 0.1)
        .to(['.hero-vignette', '.hero-bokeh-container', '.hero-chromatic-aberration', '.hero-lens-flares'], { opacity: 1, duration: 0.8 }, 0.2);

      if (overlayVideoRef.current) {
        tl.to(overlayVideoRef.current, { opacity: 0.7, duration: 0.8 }, 0);
        overlayVideoRef.current.play();
      }

      // PHASE 2 — Focus UI (overlay stays translucent — image is visible below)
      tl.to('.hero-focus-overlay', { opacity: 1, duration: 0.3 }, '+=0.3');

      // PHASE 3 — Searching (blur pulse)
      tl.to('.hero-bg-image-fullscreen', { filter: 'blur(30px)', scale: 1.1, duration: 0.7 }, '+=0.2')
        .to('.hero-bg-image-fullscreen', { filter: 'blur(0px)', scale: 1, duration: 1.1, ease: 'power3.out' }, '+=0.4');

      if (apertureVideoPath && apertureRef.current) {
        tl.to(apertureRef.current, { opacity: 1, duration: 0.4, onStart: () => apertureRef.current.play() })
          .to({}, { duration: 2.0 })
          .to(apertureRef.current, { opacity: 0, duration: 0.4 });
      }

      // PHASE 4 — SHUTTER CLOSE: overlay goes fully opaque (brief flash of black)
      tl.to('.hero-focus-overlay', { opacity: 0, duration: 0.3 }, '+=0.3')
        .to('.hero-viewfinder-overlay', { opacity: 1, duration: 0.08, ease: 'power1.in' }) // ← OPAQUE shutter close
        .to('.hero-exposure-flash', { opacity: 0.7, duration: 0.06 }, '<')
        // Shutter reopens — polaroid now in frame, fullscreen image gone
        .to('.hero-exposure-flash', { opacity: 0, duration: 0.25 }, '+=0.04')
        .to('.hero-viewfinder-overlay', { opacity: 0, duration: 0.3 }, '<')
        .to('.hero-bg-image-fullscreen', { opacity: 0, duration: 0.25 }, '<')
        // Polaroid snaps in
        .to('.hero-polaroid-frame', { opacity: 1, scale: 1, rotation: -3, duration: 0.9, ease: 'back.out(1.4)' }, '-=0.1')
        .to('.hero-polaroid-image', { opacity: 1, duration: 0.4 }, '-=0.5')
        .to(['.hero-vignette', '.hero-bokeh-container', '.hero-chromatic-aberration', '.hero-lens-flares'], { opacity: 0, duration: 0.6 }, '-=0.5')
        .to('.polaroid-title', { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }, '-=0.3')
        .to('.polaroid-subtitle', { opacity: 0.6, y: 0, duration: 0.8 }, '-=0.6');

    }, containerRef);

    return () => ctx.revert();
  }, [isActive, apertureVideoPath]);

  return (
    <section ref={containerRef} className="hero-section-container">

      {/* ── Full-screen background image, visible UNDER overlay ── */}
      <div className="hero-bg-fullscreen-layer">
        <img src={imagePath} alt={title} className="hero-bg-image-fullscreen" />
      </div>

      {/* ── Translucent viewfinder overlay (camera POV) ── */}
      <div className="hero-viewfinder-overlay" />

      {/* ── Visual FX layers ── */}
      <div className="hero-vignette" />
      <div className="hero-chromatic-aberration" />
      <div className="hero-exposure-flash" />
      <div className="hero-lens-flares">
        {[1, 2, 3].map(i => <div key={i} className={`lens-flare lens-flare-${i}`} />)}
      </div>
      <div className="hero-bokeh-container">
        {[...Array(16)].map((_, i) => (
          <div key={i} className="bokeh-circle" style={{
            '--delay': `${(i * 0.37).toFixed(2)}s`,
            '--duration': `${5 + (i % 4)}s`,
            '--size': `${40 + (i % 3) * 30}px`,
            '--start-x': `${(i * 13) % 90}%`,
            '--start-y': `${(i * 17) % 90}%`,
            '--end-x': `${(i * 19 + 10) % 90}%`,
            '--end-y': `${(i * 23 + 5) % 90}%`,
          }} />
        ))}
      </div>

      {/* ── Aperture video ── */}
      {apertureVideoPath && (
        <div className="hero-aperture-video-container">
          <video ref={apertureRef} src={apertureVideoPath} className="hero-aperture-video" muted playsInline />
        </div>
      )}
      {overlayVideoPath && (
        <div className="hero-overlay-video-container">
          <video ref={overlayVideoRef} src={overlayVideoPath} className="hero-overlay-video" muted loop playsInline />
        </div>
      )}

      {/* ── Focus / Viewfinder HUD ── */}
      <div className="hero-focus-overlay" aria-hidden="true">
        <div className="hero-green-layover" />
        <div className="hero-focus-pulse" />
        <div className="hero-focus-frame">
          <div className="focus-corner focus-corner-tl" />
          <div className="focus-corner focus-corner-tr" />
          <div className="focus-corner focus-corner-bl" />
          <div className="focus-corner focus-corner-br" />
          <div className="focus-crosshair">
            <div className="crosshair-h" /><div className="crosshair-v" /><div className="crosshair-center" />
          </div>
          <div className="focus-grid">
            <div className="grid-line grid-h" style={{ top: '33.33%' }} />
            <div className="grid-line grid-h" style={{ top: '66.66%' }} />
            <div className="grid-line grid-v" style={{ left: '33.33%' }} />
            <div className="grid-line grid-v" style={{ left: '66.66%' }} />
          </div>
          <div className="focus-distance-indicator">
            <span>AF</span>
            <div className="focus-distance-bars">
              <div className="distance-bar" /><div className="distance-bar" /><div className="distance-bar" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Polaroid frame (hidden until shutter closes) ── */}
      <div ref={wrapperRef} className="hero-bg-wrapper">
        <div className="hero-polaroid-frame">
          <div className="polaroid-inner-container">
            <div className="polaroid-photo-area">
              <img src={imagePath} alt={title} className="hero-polaroid-image" />
            </div>
            <div className="polaroid-caption-area">
              <h1 className="polaroid-title">{title}</h1>
              {subtitle && <p className="polaroid-subtitle">{subtitle}</p>}
            </div>
          </div>
        </div>
      </div>

      <div className="hero-scroll-indicator">Scroll to Explore</div>
    </section>
  );
};

export default HeroSection;