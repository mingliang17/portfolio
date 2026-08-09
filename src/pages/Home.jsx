// src/pages/Home.jsx
import React, { Suspense, useState, useRef, useEffect, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import Earth from '../components/home/Earth.jsx';
import StripCarousel from '../components/home/StripCarousel.jsx';
import { globeProjects, getSortedProjects, getSortedFotos } from '../constants/index.js';
import gsap from 'gsap';

// ── Camera Intro ──────────────────────────────────────────────────────────────
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

// ── Home ──────────────────────────────────────────────────────────────────────
const Home = () => {
  const [introComplete,   setIntroComplete]   = useState(false);
  const [globeTheme,      setGlobeTheme]      = useState('neutral');
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedItem,    setSelectedItem]    = useState(null);
  const [columnsVisible,  setColumnsVisible]  = useState(false);
  const [sortedProjects,  setSortedProjects]  = useState([]);
  const [sortedFotos,     setSortedFotos]     = useState([]);

  const handleItemSelect = useCallback((item) => {
    setSelectedItem(item.id);
    setSelectedCountry(item.country);
    setSortedProjects(getSortedProjects(item.country, item.id));
    setSortedFotos(getSortedFotos(item.country, item.id));
    setColumnsVisible(true);
  }, []);

  const handleCountrySelect = useCallback((country) => {
    setSelectedCountry(country.country);
    setSelectedItem(null);
    setSortedProjects(getSortedProjects(country.country));
    setSortedFotos(getSortedFotos(country.country));
    setColumnsVisible(true);
  }, []);

  const starNavigationPoints = [
    { title: 'Future Projects', lat:  45, lon: 120, link: '/projects/future'  },
    { title: 'Archive',         lat: -30, lon: -45, link: '/projects/archive' },
    { title: 'Research Lab',    lat:  60, lon: -90, link: '/projects/lab'     },
    { title: 'Collaborations',  lat:  10, lon:  60, link: '/projects/collabs' },
  ];

  return (
    <main className="hp-main">
      {/* Viewfinder intro */}
      {!introComplete && <CameraIntro onComplete={() => setIntroComplete(true)} />}

      {/* Globe — always full-screen, z-index 1 */}
      <div className={`hp-globe-layer ${introComplete ? 'hp-globe-visible' : ''}`}>
        <Canvas className="hp-canvas" style={{ background: 'transparent' }}>
          <PerspectiveCamera makeDefault position={[0, 0, 6]} />
          <ambientLight intensity={0.25} />
          <directionalLight position={[5, 3, 5]} intensity={0.4} />
          <Suspense fallback={null}>
            <Earth
              countries={globeProjects}
              stars={starNavigationPoints}
              globeTheme={globeTheme}
              onThemeChange={setGlobeTheme}
              onItemSelect={handleItemSelect}
              onCountrySelect={handleCountrySelect}
              selectedCountry={selectedCountry}
              selectedItem={selectedItem}
              showPins
              showStars
              autoRotate={false}
            />
          </Suspense>
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            rotateSpeed={0.5}
            enableDamping
            dampingFactor={0.1}
          />
        </Canvas>

        {selectedCountry && (
          <div className="hp-country-badge">
            <span className="hp-country-badge-name">{selectedCountry}</span>
          </div>
        )}
      </div>

      {/* ── 4-strip 3D carousel — sits on top of globe, full 100vw × 100vh ── */}
      <div className={`hp-overlay-layout ${columnsVisible ? 'hp-overlay-visible' : ''}`}>
        {columnsVisible && (
          <StripCarousel
            projects={sortedProjects}
            fotos={sortedFotos}
            selectedCountry={selectedCountry}
            selectedItem={selectedItem}
          />
        )}
      </div>
    </main>
  );
};

export default Home;