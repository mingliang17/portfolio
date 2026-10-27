// src/pages/Home.jsx
import React, { Suspense, useState, useRef, useEffect, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import Earth from '../components/home/Earth.jsx';
import StripCarousel from '../components/home/StripCarousel.jsx';
import { globeProjects, getSortedProjects, getSortedFotos } from '../constants/index.js';
import gsap from 'gsap';
import { uiState } from '../globe/uiState.js';
import { GLOBE_FOV } from '../globe/constants.js';

// ── Camera Intro ──────────────────────────────────────────────────────────────
// SHELVED: set SHOW_CAMERA_INTRO to true to bring the viewfinder intro back. Nothing else needs to change.
const SHOW_CAMERA_INTRO = false;

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
  const [introComplete,   setIntroComplete]   = useState(!SHOW_CAMERA_INTRO);
  const [globeTheme,      setGlobeTheme]      = useState('neutral');
  const [selectedCountry, setSelectedCountry] = useState(null); // name, as the project/photo data knows it
  const [selectedKey,     setSelectedKey]     = useState(null); // globe identity of the country (ISO code, else name)
  const [selectedItem,    setSelectedItem]    = useState(null);
  const [columnsVisible,  setColumnsVisible]  = useState(false);
  const [stripsMounted,   setStripsMounted]   = useState(false); // the polaroid canvas is created on first selection
  const [sortedProjects,  setSortedProjects]  = useState([]);
  const [sortedFotos,     setSortedFotos]     = useState([]);
  const [hoverInfo,       setHoverInfo]       = useState(null);
  const mainRef = useRef(null);
  const tipRef  = useRef(null);

  // Any country on the globe can be selected; ones with projects/photos fill the polaroid frame.
  const handleCountrySelect = useCallback((info) => {
    setSelectedCountry(info.country);
    setSelectedKey(info.key);
    setSelectedItem(null);
    setSortedProjects(getSortedProjects(info.country));
    setSortedFotos(getSortedFotos(info.country));
    setColumnsVisible(true);
    setStripsMounted(true);
  }, []);

  // Zoom back out. The polaroids keep their content while they fly out.
  const handleDeselect = useCallback(() => {
    setSelectedCountry(null);
    setSelectedKey(null);
    setSelectedItem(null);
    setColumnsVisible(false);
  }, []);

  // A click that hit nothing on the globe canvas (empty space around it) also zooms out.
  const handlePointerMissed = useCallback(() => {
    if (selectedKey && !uiState.cardHover && uiState.dragMoved < 6) handleDeselect();
  }, [selectedKey, handleDeselect]);

  useEffect(() => {
    if (!selectedKey) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') handleDeselect(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedKey, handleDeselect]);

  // The hover tooltip follows the pointer by writing a transform straight to the DOM (no re-render per move).
  const handlePointerMove = useCallback((e) => {
    if (tipRef.current) tipRef.current.style.transform = `translate(${e.clientX + 16}px, ${e.clientY + 18}px)`;
  }, []);

  // No tooltip over the country that is already open (the badge says it), nor over a polaroid.
  const hoverCountryInfo = hoverInfo && !uiState.cardHover && (hoverInfo.iso ?? hoverInfo.name) !== selectedKey ? hoverInfo : null;
  const selectedInfo = selectedKey ? globeProjects.find((c) => c.iso === selectedKey) : null;

  const starNavigationPoints = [
    { title: 'Future Projects', lat:  45, lon: 120, link: '/projects/future'  },
    { title: 'Archive',         lat: -30, lon: -45, link: '/projects/archive' },
    { title: 'Research Lab',    lat:  60, lon: -90, link: '/projects/lab'     },
    { title: 'Collaborations',  lat:  10, lon:  60, link: '/projects/collabs' },
  ];

  return (
    <main className="hp-main" ref={mainRef} onPointerMove={handlePointerMove}>
      {/* Viewfinder intro */}
      {SHOW_CAMERA_INTRO && !introComplete && <CameraIntro onComplete={() => setIntroComplete(true)} />}

      {/* Globe — always full-screen, z-index 1 */}
      <div className={`hp-globe-layer ${introComplete ? 'hp-globe-visible' : ''}`}>
        <Canvas
          className="hp-canvas"
          style={{ background: 'transparent' }}
          camera={{ fov: GLOBE_FOV, near: 0.3, far: 80, position: [0, 0, 6] }}
          dpr={[1, 2]}
          onPointerMissed={handlePointerMissed}
        >
          <ambientLight intensity={0.25} />
          <directionalLight position={[5, 3, 5]} intensity={0.4} />
          <Suspense fallback={null}>
            <Earth
              countries={globeProjects}
              stars={starNavigationPoints}
              globeTheme={globeTheme}
              onThemeChange={setGlobeTheme}
              onCountrySelect={handleCountrySelect}
              onDeselect={handleDeselect}
              onHover={setHoverInfo}
              selectedKey={selectedKey}
              showPins
              showStars
              autoRotate
            />
          </Suspense>
        </Canvas>

        {selectedCountry && (
          <div className="hp-country-badge hp-country-badge--interactive">
            <span className="hp-country-badge-name">{selectedCountry}</span>
            {selectedInfo ? (
              <span className="hp-country-badge-count">
                {selectedInfo.projects.length} projects · {selectedInfo.fotos.length} snaps
              </span>
            ) : (
              <span className="hp-country-badge-count">nothing here yet</span>
            )}
            <button className="hp-country-badge-close" onClick={handleDeselect} aria-label="Back to the globe" title="Back to the globe (Esc)">✕</button>
          </div>
        )}
      </div>

      {/* Hover tooltip: follows the pointer (see handlePointerMove) */}
      <div ref={tipRef} className={`hp-hover-tip ${hoverCountryInfo ? 'hp-hover-tip--on' : ''}`}>
        {hoverCountryInfo && (
          <div className="country-tooltip">
            {hoverCountryInfo.iso && (
              <img className="country-flag" src={`https://flagcdn.com/w80/${hoverCountryInfo.iso}.png`} alt="" onError={(e) => { e.target.style.display = 'none'; }} />
            )}
            <div className="country-tooltip-body">
              <span className="country-tooltip-name">{hoverCountryInfo.name}</span>
              {hoverCountryInfo.hasContent ? (
                <>
                  <span className="country-tooltip-stat" style={{ color: '#FF6B6B' }}>📐 {hoverCountryInfo.projects} {hoverCountryInfo.projects === 1 ? 'project' : 'projects'}</span>
                  <span className="country-tooltip-stat" style={{ color: '#4ECDC4' }}>📷 {hoverCountryInfo.fotos} {hoverCountryInfo.fotos === 1 ? 'snap' : 'snaps'}</span>
                </>
              ) : (
                <span className="country-tooltip-stat">click to explore</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Polaroid frame — four curved strips around the globe, full 100vw × 100vh ── */}
      <div className={`hp-overlay-layout ${columnsVisible ? 'hp-overlay-visible' : ''}`}>
        {stripsMounted && (
          <StripCarousel
            projects={sortedProjects}
            fotos={sortedFotos}
            visible={columnsVisible}
            selectedCountry={selectedCountry}
            selectedItem={selectedItem}
            eventSource={mainRef}
          />
        )}
      </div>
    </main>
  );
};

export default Home;