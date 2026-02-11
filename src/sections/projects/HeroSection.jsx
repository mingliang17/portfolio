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
  const imageRef = useRef(null);
  const wrapperRef = useRef(null);
  const apertureRef = useRef(null);
  const overlayVideoRef = useRef(null);

  useEffect(() => {
    if (!isActive) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power2.inOut' } });

      // 1. Initial State Setup
      gsap.set(".hero-bg-image", { scale: 1.1, opacity: 0, filter: 'blur(20px)' });
      gsap.set([".hero-polaroid-frame", ".hero-focus-overlay", ".hero-green-layover", ".hero-vignette", ".hero-focus-frame", ".hero-bokeh-container", ".hero-lens-flares", ".hero-exposure-flash", ".hero-chromatic-aberration", ".hero-aperture-video", ".hero-overlay-video"], { opacity: 0 });
      gsap.set(".hero-focus-pulse", { opacity: 0, scale: 1 });
      gsap.set([".polaroid-title", ".polaroid-subtitle"], { opacity: 0, y: 15 });

      // 2. Intro
      tl.to(".hero-bg-image", { opacity: 0.6, duration: 0.8 })
        .to([".hero-bokeh-container", ".hero-vignette", ".hero-lens-flares", ".hero-chromatic-aberration"], { opacity: 1, duration: 0.8 }, 0);

      if (overlayVideoRef.current) {
        tl.to(overlayVideoRef.current, { opacity: 0.7, duration: 0.8 }, 0);
        overlayVideoRef.current.play();
      }

      // 3. Focus UI
      tl.to(".hero-focus-overlay", { opacity: 1, duration: 0.3 }, "+=0.2")
        .to(".hero-green-layover", { opacity: 0.15, duration: 0.4 }, "<")
        .to(".hero-focus-frame", { opacity: 0.8, duration: 0.4 }, "-=0.2");

      // 4. Searching Phase
      tl.to(".hero-bg-image", { filter: 'blur(40px)', scale: 1.15, duration: 0.6 }, "+=0.2")
        .to(".hero-exposure-flash", { opacity: 0.2, duration: 0.6 }, "<");

      if (apertureVideoPath && apertureRef.current) {
        tl.to(apertureRef.current, { opacity: 1, duration: 0.4, onStart: () => apertureRef.current.play() })
          .to({}, { duration: 2.0 })
          .to(apertureRef.current, { opacity: 0, duration: 0.4 });
      }

      // 5. Focus Lock (Combined steps for brevity)
      tl.to(".hero-bg-image", { filter: 'blur(0px)', scale: 1, opacity: 1, duration: 1.2, ease: 'power3.out' }, "+=0.5")
        .to(".hero-focus-pulse", { opacity: 1, scale: 1.2, duration: 0.5, ease: 'back.out(2)' }, "<")
        .to([".hero-bokeh-container", ".hero-chromatic-aberration", ".hero-exposure-flash"], { opacity: 0, duration: 0.8 }, "-=0.8");

      // 6. Photo Taken & Polaroid Snap
      tl.to(".hero-focus-overlay", { opacity: 0, duration: 0.4 }, "+=0.3")
        .to(".hero-exposure-flash", { opacity: 1, duration: 0.1, ease: 'power1.in' })
        .to(".hero-exposure-flash", { opacity: 0, duration: 0.3 })
        .to(wrapperRef.current, { scale: 0.65, rotation: -8, duration: 1.2, ease: 'back.out(1)' }, "+=0.1")
        .to(".hero-polaroid-frame", { opacity: 1, duration: 0.5 }, "-=1.0")
        .to([".hero-vignette", ".hero-lens-flares"], { opacity: 0, duration: 0.5 }, "-=0.5")
        .to(".polaroid-title", { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }, "-=0.2")
        .to(".polaroid-subtitle", { opacity: 0.6, y: 0, duration: 0.8, ease: 'power2.out' }, "-=0.6");

    }, containerRef);
    return () => ctx.revert();
  }, [isActive, apertureVideoPath]);

  return (
    <section ref={containerRef} className="hero-section-container">
      <div className="hero-vignette" />
      <div className="hero-chromatic-aberration" />
      <div className="hero-exposure-flash" />
      
      <div className="hero-lens-flares">
        {[1, 2, 3].map(i => <div key={i} className={`lens-flare lens-flare-${i}`} />)}
      </div>

      <div ref={wrapperRef} className="hero-bg-wrapper">
        <div className="hero-polaroid-frame">
          <div className="polaroid-inner-container">
            <div className="polaroid-photo-area">
               <img ref={imageRef} src={imagePath} alt={title} className="hero-bg-image" />
            </div>
            <div className="polaroid-caption-area">
              <h1 className="polaroid-title">{title}</h1>
              {subtitle && <p className="polaroid-subtitle">{subtitle}</p>}
            </div>
          </div>
        </div>
      </div>

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

      <div className="hero-bokeh-container">
        {[...Array(18)].map((_, i) => (
          <div key={i} className="bokeh-circle" style={{
            '--delay': `${Math.random() * 3}s`,
            '--duration': `${5 + Math.random() * 3}s`,
            '--size': `${40 + Math.random() * 90}px`,
            '--start-x': `${Math.random() * 100}%`,
            '--start-y': `${Math.random() * 100}%`,
            '--end-x': `${Math.random() * 100}%`,
            '--end-y': `${Math.random() * 100}%`
          }} />
        ))}
      </div>

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
            <div className="focus-distance-bars"><div className="distance-bar" /><div className="distance-bar" /><div className="distance-bar" /></div>
          </div>
        </div>
      </div>

      <div className="hero-scroll-indicator">Scroll to Explore</div>
    </section>
  );
};

export default HeroSection;