// src/views/Home.jsx
import React, { Suspense, useState, useRef, useEffect, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import Earth from '../components/home/Earth.jsx';
import StripCarousel from '../components/home/StripCarousel.jsx';
import CameraIntro from '../components/home/CameraIntro.jsx';
import HomeHints from '../components/home/HomeHints.jsx';
import { globeProjects, constellationEntries, getSortedProjects, getSortedFotos } from '../constants/index.js';
import { uiState } from '../globe/uiState.js';
import { GLOBE_FOV } from '../globe/constants.js';

// SHELVED: set SHOW_CAMERA_INTRO to true to bring the viewfinder intro back (src/components/home/CameraIntro.jsx).
const SHOW_CAMERA_INTRO = false;

// The four navigation stars that orbit the globe (a constant: it must not be rebuilt on every render).
const STAR_NAVIGATION_POINTS = [
  { title: 'Future Projects', lat:  45, lon: 120, link: '/projects/future'  },
  { title: 'Archive',         lat: -30, lon: -45, link: '/projects/archive' },
  { title: 'Research Lab',    lat:  60, lon: -90, link: '/projects/lab'     },
  { title: 'Collaborations',  lat:  10, lon:  60, link: '/projects/collabs' },
];

// ── Home ──────────────────────────────────────────────────────────────────────
const Home = () => {
  const [introComplete,   setIntroComplete]   = useState(!SHOW_CAMERA_INTRO);
  const [globeTheme,      setGlobeTheme]      = useState('neutral');
  const [selectedCountry, setSelectedCountry] = useState(null); // name, as the project/photo data knows it
  const [selectedKey,     setSelectedKey]     = useState(null); // globe identity of the country (ISO code, else name)
  const [stripsMounted,   setStripsMounted]   = useState(false); // the polaroid canvas is created on first selection
  const [sortedProjects,  setSortedProjects]  = useState([]);
  const [sortedFotos,     setSortedFotos]     = useState([]);
  const [hoverInfo,       setHoverInfo]       = useState(null);
  const mainRef = useRef(null);
  const tipRef  = useRef(null);

  // Only a country or constellation WITH work can be selected (Earth enforces it); its own work comes first in the columns.
  const handleCountrySelect = useCallback((info) => {
    setSelectedCountry(info.country);
    setSelectedKey(info.key);
    setSortedProjects(getSortedProjects(info.country));
    setSortedFotos(getSortedFotos(info.country));
    setStripsMounted(true);
  }, []);

  // Zoom back out. The polaroids keep their content while they fly out.
  const handleDeselect = useCallback(() => {
    setSelectedCountry(null);
    setSelectedKey(null);
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
  const hoverCountryInfo = hoverInfo && !uiState.cardHover && (hoverInfo.key ?? hoverInfo.iso ?? hoverInfo.name) !== selectedKey ? hoverInfo : null;
  const columnsVisible = !!selectedKey; // the polaroid columns are out exactly while a place is open
  const selectedInfo = selectedKey ? globeProjects.find((c) => c.iso === selectedKey) ?? constellationEntries.find((c) => c.key === selectedKey) : null;

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
              constellations={constellationEntries}
              stars={STAR_NAVIGATION_POINTS}
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
      </div>

      {/* Hover tooltip: follows the pointer (see handlePointerMove) */}
      <div ref={tipRef} className={`hp-hover-tip ${hoverCountryInfo ? 'hp-hover-tip--on' : ''}`}>
        {hoverCountryInfo && (
          <div className="country-tooltip">
            {hoverCountryInfo.iso && (
              <img className="country-flag" src={`https://flagcdn.com/w80/${hoverCountryInfo.iso}.png`} alt="" onError={(e) => { e.target.style.display = 'none'; }} />
            )}
            {hoverCountryInfo.kind === 'constellation' && <span className="country-flag country-flag--star" aria-hidden="true">✦</span>}
            <div className="country-tooltip-body">
              <span className="country-tooltip-name">{hoverCountryInfo.name}</span>
              {hoverCountryInfo.hasContent ? (
                <>
                  <span className="country-tooltip-stat" style={{ color: '#FF6B6B' }}>📐 {hoverCountryInfo.projects} {hoverCountryInfo.projects === 1 ? 'project' : 'projects'}</span>
                  <span className="country-tooltip-stat" style={{ color: '#4ECDC4' }}>📷 {hoverCountryInfo.fotos} {hoverCountryInfo.fotos === 1 ? 'snap' : 'snaps'}</span>
                </>
              ) : (
                <span className="country-tooltip-stat country-tooltip-stat--muted">no projects or snaps yet</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Polaroid menu — two columns of pinned-up polaroids either side of the globe, full 100vw × 100vh ── */}
      <div className={`hp-overlay-layout ${columnsVisible ? 'hp-overlay-visible' : ''}`}>
        {stripsMounted && (
          <StripCarousel
            projects={sortedProjects}
            fotos={sortedFotos}
            visible={columnsVisible}
            selectedCountry={selectedCountry}
            eventSource={mainRef}
          />
        )}
      </div>

      {/* The badge sits ABOVE the polaroid strips (they run through the top-left corner). */}
      {selectedCountry && (
        <div className="hp-country-badge hp-country-badge--interactive">
          <span className="hp-country-badge-name">{selectedCountry}</span>
          {selectedInfo ? (
            <span className="hp-country-badge-count">
              {selectedInfo.projects.length} {selectedInfo.projects.length === 1 ? 'project' : 'projects'} · {selectedInfo.fotos.length} {selectedInfo.fotos.length === 1 ? 'snap' : 'snaps'}
            </span>
          ) : (
            <span className="hp-country-badge-count">nothing here yet</span>
          )}
          <button className="hp-country-badge-close" onClick={handleDeselect} aria-label="Back to the globe" title="Back to the globe (Esc)">✕</button>
        </div>
      )}

      {/* How to use the page: changes with whether a place is open */}
      {introComplete && <HomeHints placeOpen={columnsVisible} />}
    </main>
  );
};

export default Home;