// src/pages/Home.jsx
import React, { Suspense, useState, useRef, useEffect, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import Earth from '../components/home/Earth.jsx';
import { globeProjects, getSortedProjects, getSortedFotos } from '../constants/index.js';
import gsap from 'gsap';

// ── Deterministic stagger tables — fixed per-index, never change ──────────────
// These define the resting position of each card (applied BEFORE the fly-in).
// Cards always land at these positions → never a straight column.
const X_OFFSETS = [-16, 11, -7, 18, -10, 8, -20, 13, -5, 17, -12, 9, -18, 6, -14, 12, -8, 15, -17, 7];
const ROTATIONS = [-3.5, 2.6, -2.1, 3.8, -2.8, 1.9, -4.3, 3.0, -1.5, 4.1, -2.3, 2.0, -3.7, 2.8, -1.7, 3.4, -3.0, 1.6, -4.0, 2.5];
const Y_OFFSETS = [0, -10, 14, -6, 18, -14, 5, -20, 11, -4, 22, -11, 7, -17, 4, -22, 13, -7, 20, -10];

// ── PolaroidCard ──────────────────────────────────────────────────────────────
const PolaroidCard = ({ item, index, isSelected, isHighlighted, side }) => {
  const cardRef = useRef(null);

  const xOff = X_OFFSETS[index % X_OFFSETS.length];
  const rot  = ROTATIONS[index % ROTATIONS.length];
  const yOff = Y_OFFSETS[index % Y_OFFSETS.length];

  useEffect(() => {
    if (!cardRef.current) return;

    // 1. Immediately SET the card to its final resting (staggered) position,
    //    but invisible and slightly scaled down.
    //    This means even before the animation plays the layout is staggered.
    gsap.set(cardRef.current, {
      x:       xOff,
      y:       yOff,
      rotation: rot,
      scale:   0.75,
      opacity: 0,
    });

    // 2. Animate IN from above (y shifted up by 60px) to the already-staggered position.
    gsap.to(cardRef.current, {
      y:       yOff,          // land exactly at stagger position
      scale:   1,
      opacity: 1,
      duration: 0.65,
      delay:    0.05 + index * 0.06,
      ease:    'back.out(1.4)',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // mount only

  const handleMouseEnter = () => {
    if (!cardRef.current) return;
    gsap.killTweensOf(cardRef.current);
    gsap.to(cardRef.current, {
      y: yOff - 13,
      scale: 1.08,
      rotation: rot * 0.12,
      duration: 0.22,
      ease: 'back.out(2.5)',
    });
  };

  const handleMouseLeave = () => {
    if (!cardRef.current) return;
    gsap.to(cardRef.current, {
      y: yOff,
      scale: 1,
      rotation: rot,
      duration: 0.45,
      ease: 'elastic.out(1, 0.55)',
    });
  };

  const handleClick = () => {
    if (!cardRef.current) return;
    gsap.to(cardRef.current, {
      keyframes: [
        { scale: 0.88,  duration: 0.08, ease: 'power2.in'   },
        { scale: 1.14,  duration: 0.14, ease: 'back.out(3)' },
        { scale: 1,     duration: 0.22, ease: 'elastic.out(1, 0.4)' },
      ],
      onComplete: () => { if (item.link) window.location.href = item.link; },
    });
  };

  const glowClass =
    isSelected    ? 'hp-polaroid-selected' :
    isHighlighted ? 'hp-polaroid-glow'     : '';

  return (
    <div
      ref={cardRef}
      className={`hp-polaroid ${glowClass}`}
      style={{
        // Do NOT set transform here — GSAP owns the transform entirely.
        // Setting opacity:0 is safe; GSAP will override after gsap.set().
        opacity: 0,
        flexShrink: 0,
        marginBottom: '-20px',
        cursor: 'pointer',
        willChange: 'transform, opacity',
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      <div
        className="hp-polaroid-pin"
        style={{ backgroundColor: item.pinColor || '#eb4034' }}
      />
      <div className="hp-polaroid-img">
        <img src={item.heroImage} alt={item.title} loading="lazy" />
        {isSelected    && <div className="hp-polaroid-selected-border" />}
        {isHighlighted && !isSelected && <div className="hp-polaroid-glow-border" />}
      </div>
      <div className="hp-polaroid-caption">
        <span className="hp-polaroid-title">{item.title}</span>
        <span className="hp-polaroid-country">{item.country}</span>
      </div>
    </div>
  );
};

// ── PolaroidColumn ────────────────────────────────────────────────────────────
// key forces remount (fresh stagger animation) when country changes
const PolaroidColumn = React.memo(({ items, selectedCountry, selectedItem, side }) => (
  <div className="hp-polaroid-col">
    {items.map((item, i) => (
      <PolaroidCard
        key={item.id}
        item={item}
        index={i}
        isSelected={selectedItem === item.id}
        isHighlighted={selectedItem !== item.id && selectedCountry === item.country}
        side={side}
      />
    ))}
  </div>
));
PolaroidColumn.displayName = 'PolaroidColumn';

// ── ScrollablePolaroidArea ────────────────────────────────────────────────────
const ScrollablePolaroidArea = ({
  items, selectedCountry, selectedItem, visible, side, emptyText,
}) => {
  const scrollRef = useRef(null);
  const [canUp,   setCanUp]   = useState(false);
  const [canDown, setCanDown] = useState(false);

  const check = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    setCanUp(scrollTop > 2);
    setCanDown(scrollTop + clientHeight < scrollHeight - 2);
  }, []);

  useEffect(() => {
    check();
    const t = setTimeout(check, 400);
    return () => clearTimeout(t);
  }, [items, visible, check]);

  return (
    // This fragment is a flex child of hp-col — it MUST flex-fill the column.
    // We wrap in a div that takes all remaining height.
    <div className="hp-col-scroll-wrapper">
      <div className="hp-scroll-arrow hp-scroll-arrow-top" style={{ opacity: visible && canUp ? 1 : 0 }}>▲</div>

      <div
        ref={scrollRef}
        className="hp-col-scroll"
        onScroll={check}
        onWheel={e => { scrollRef.current && (scrollRef.current.scrollTop += e.deltaY); check(); }}
      >
        {visible ? (
          <PolaroidColumn
            key={`${side}-${selectedCountry || 'none'}`}
            items={items}
            selectedCountry={selectedCountry}
            selectedItem={selectedItem}
            side={side}
          />
        ) : (
          <div className="hp-col-empty"><span>{emptyText}</span></div>
        )}
      </div>

      <div className="hp-scroll-arrow hp-scroll-arrow-bottom" style={{ opacity: visible && canDown ? 1 : 0 }}>▼</div>
    </div>
  );
};

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

      {/* ── Polaroid overlay — sits on top of globe, full 100vw × 100vh ── */}
      <div className={`hp-overlay-layout ${columnsVisible ? 'hp-overlay-visible' : ''}`}>

        {/* LEFT column */}
        <div className="hp-col hp-col-left">
          <ScrollablePolaroidArea
            items={sortedProjects}
            selectedCountry={selectedCountry}
            selectedItem={selectedItem}
            visible={columnsVisible}
            side="left"
            emptyText={<>Select a<br />country</>}
          />
        </div>

        {/* Centre gap: pointer-events none so globe interactions work */}
        <div className="hp-col-spacer" />

        {/* RIGHT column */}
        <div className="hp-col hp-col-right">
          <ScrollablePolaroidArea
            items={sortedFotos}
            selectedCountry={selectedCountry}
            selectedItem={selectedItem}
            visible={columnsVisible}
            side="right"
            emptyText={<>Select a<br />country</>}
          />
        </div>
      </div>
    </main>
  );
};

export default Home;