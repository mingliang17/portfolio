// src/pages/Home.jsx
import React, { Suspense, useState, useRef, useEffect, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import Earth from '../components/home/Earth.jsx';
import { globeProjects, getSortedProjects, getSortedFotos } from '../constants/index.js';
import gsap from 'gsap';

// ── Polaroid Column ───────────────────────────────────────────────────────────
const PolaroidCard = ({ item, index, isHighlighted, isVisible, side }) => {
  const cardRef = useRef(null);
  const [nudging, setNudging] = useState(false);

  // Deterministic offsets so they don't jump on re-render
  const xOffsets = [-14, 10, -6, 16, -9, 7, -18, 12, -4, 15, -11, 8, -16, 5, -12, 11, -7, 14, -15, 6];
  const rotations = [-3.2, 2.4, -1.9, 3.5, -2.6, 1.7, -4.1, 2.8, -1.3, 3.9, -2.1, 1.8, -3.4, 2.6, -1.5, 3.2, -2.8, 1.4, -3.7, 2.3];
  const xOff = xOffsets[index % xOffsets.length];
  const rot  = rotations[index % rotations.length];

  useEffect(() => {
    if (!isVisible || !cardRef.current) return;
    // Pop/bounce in with stagger based on index
    gsap.fromTo(cardRef.current,
      { opacity: 0, y: 60, scale: 0.75, rotation: rot + (side === 'left' ? -8 : 8), x: xOff },
      { opacity: 1, y: 0, scale: 1, rotation: rot, x: xOff,
        duration: 0.65,
        delay: 0.05 + index * 0.06,
        ease: 'back.out(1.6)',
        clearProps: 'scale' }
    );
  }, [isVisible, rot, xOff, index, side]);

  const handleMouseEnter = () => {
    if (!cardRef.current) return;
    setNudging(true);
    gsap.killTweensOf(cardRef.current);
    gsap.to(cardRef.current, { y: -10, scale: 1.06, rotation: rot * 0.2, duration: 0.22, ease: 'back.out(2.5)' });
  };

  const handleMouseLeave = () => {
    if (!cardRef.current) return;
    setNudging(false);
    gsap.to(cardRef.current, { y: 0, scale: 1, rotation: rot, duration: 0.45, ease: 'elastic.out(1, 0.55)' });
  };

  const handleClick = () => {
    if (!cardRef.current) return;
    // Nudge bounce on click
    gsap.to(cardRef.current, {
      keyframes: [
        { scale: 0.92, duration: 0.08, ease: 'power2.in' },
        { scale: 1.1, duration: 0.15, ease: 'back.out(3)' },
        { scale: 1, duration: 0.2, ease: 'elastic.out(1, 0.4)' },
      ],
      onComplete: () => { window.location.href = item.link; }
    });
  };

  return (
    <div
      ref={cardRef}
      className={`hp-polaroid ${isHighlighted ? 'hp-polaroid-glow' : ''}`}
      style={{
        transform: `rotate(${rot}deg) translateX(${xOff}px)`,
        opacity: 0,
        marginBottom: '-30px', // overlap
        cursor: 'pointer',
        willChange: 'transform',
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      <div className="hp-polaroid-pin" style={{ backgroundColor: item.pinColor || '#eb4034' }} />
      <div className="hp-polaroid-img">
        <img src={item.heroImage} alt={item.title} loading="lazy" />
        {isHighlighted && <div className="hp-polaroid-glow-border" />}
      </div>
      <div className="hp-polaroid-caption">
        <span className="hp-polaroid-title">{item.title}</span>
        <span className="hp-polaroid-country">{item.country}</span>
      </div>
    </div>
  );
};

const PolaroidColumn = ({ items, selectedCountry, selectedItem, visible, side }) => {
  const colRef = useRef(null);

  return (
    <div ref={colRef} className={`hp-polaroid-col hp-polaroid-col-${side}`}>
      {items.map((item, i) => (
        <PolaroidCard
          key={item.id}
          item={item}
          index={i}
          isHighlighted={selectedItem === item.id || (!selectedItem && selectedCountry && item.country === selectedCountry)}
          isVisible={visible}
          side={side}
        />
      ))}
    </div>
  );
};

const ScrollablePolaroidArea = ({ items, selectedCountry, selectedItem, visible, side, emptyText }) => {
  const scrollRef = useRef(null);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);

  const checkScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    
    setCanScrollUp(scrollTop > 2);
    setCanScrollDown(scrollTop + clientHeight < scrollHeight - 2);
  }, []);

  useEffect(() => {
    checkScroll();
    const timeout = setTimeout(checkScroll, 300);
    return () => clearTimeout(timeout);
  }, [items, visible, checkScroll]);

  return (
    <>
      <div className="hp-scroll-indicator top" style={{ opacity: visible && canScrollUp ? 1 : 0 }}>▲</div>
      <div 
        ref={scrollRef} 
        className="hp-col-scroll"
        onScroll={checkScroll}
        onWheel={(e) => { 
          if (scrollRef.current) scrollRef.current.scrollTop += e.deltaY; 
          checkScroll();
        }}
      >
        {visible && (
          <PolaroidColumn
            items={items}
            selectedCountry={selectedCountry}
            selectedItem={selectedItem}
            visible={visible}
            side={side}
          />
        )}
        {!visible && (
          <div className="hp-col-empty">
            <span>{emptyText}</span>
          </div>
        )}
      </div>
      <div className="hp-scroll-indicator bottom" style={{ opacity: visible && canScrollDown ? 1 : 0 }}>▼</div>
    </>
  );
};

// ── Camera Intro ─────────────────────────────────────────────────────────────
const CameraIntro = ({ onComplete }) => {
  const ref = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ onComplete });
      gsap.set('.ci-overlay', { opacity: 1 });
      gsap.set('.ci-flash', { opacity: 0 });
      gsap.set(['.ci-corner', '.ci-grid-line'], { opacity: 0 });
      gsap.set('.ci-hud-text', { opacity: 0, y: 8 });
      gsap.set('.ci-af-label', { opacity: 0 });
      gsap.set('.ci-crosshair', { opacity: 0 });

      // Reveal viewfinder
      tl.to('.ci-overlay', { opacity: 0.55, duration: 0.8, ease: 'power2.out' }, 0)
        .to('.ci-hud-text', { opacity: 1, y: 0, duration: 0.5, stagger: 0.1 }, 0.3)
        .to('.ci-corner', { opacity: 0.95, duration: 0.4, stagger: 0.06 }, 0.7)
        .to('.ci-crosshair', { opacity: 0.5, duration: 0.3 }, 0.9)
        .to('.ci-grid-line', { opacity: 0.18, duration: 0.4 }, 0.9)
        // Focus tighten
        .to('.ci-frame-outer', { scale: 0.88, duration: 0.6, ease: 'power3.inOut', transformOrigin: 'center' }, 1.8)
        .to('.ci-overlay', { opacity: 0.28, duration: 0.6 }, 1.8)
        .to('.ci-af-label', { opacity: 1, duration: 0.3 }, 2.2)
        .to('.ci-corner', { borderColor: '#00ff88', duration: 0.3 }, 2.1)
        // SHUTTER FIRE
        .to('.ci-overlay', { opacity: 1, duration: 0.07, ease: 'power1.in' }, 2.7)
        .to('.ci-flash', { opacity: 1, duration: 0.05 }, 2.7)
        .to('.ci-flash', { opacity: 0, duration: 0.3, ease: 'power2.out' }, 2.75)
        .to('.ci-overlay', { opacity: 0, duration: 1.1, ease: 'power2.inOut' }, 2.75);
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={ref} className="ci-wrapper" style={{ pointerEvents: 'none' }}>
      <div className="ci-overlay" />
      <div className="ci-flash" />
      <div className="ci-frame-outer">
        <div className="ci-corner ci-tl" /><div className="ci-corner ci-tr" />
        <div className="ci-corner ci-bl" /><div className="ci-corner ci-br" />
        <div className="ci-crosshair"><div className="ci-ch-h" /><div className="ci-ch-v" /></div>
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

// ── Home Page ─────────────────────────────────────────────────────────────────
const Home = () => {
  const [introComplete, setIntroComplete] = useState(false);
  const [globeTheme, setGlobeTheme] = useState('neutral');
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [columnsVisible, setColumnsVisible] = useState(false);
  const [sortedProjects, setSortedProjects] = useState([]);
  const [sortedFotos, setSortedFotos] = useState([]);

  const handleIntroComplete = useCallback(() => {
    setIntroComplete(true);
  }, []);

  const handleItemSelect = useCallback((item) => {
    setSelectedItem(item.id);
    setSelectedCountry(item.country);
    
    setSortedProjects(getSortedProjects(item.country, item.id));
    setSortedFotos(getSortedFotos(item.country, item.id));

    if (!columnsVisible) {
      setColumnsVisible(true);
    }
  }, [columnsVisible]);

  const handleCountrySelect = useCallback((country) => {
    setSelectedCountry(country.country);
    setSelectedItem(null);
    
    setSortedProjects(getSortedProjects(country.country));
    setSortedFotos(getSortedFotos(country.country));

    if (!columnsVisible) {
      setColumnsVisible(true);
    }
  }, [columnsVisible]);

  const handleCountryHover = useCallback((country) => {
    // No-op; handled in Earth.jsx tooltip
  }, []);

  const starNavigationPoints = [
    { title: 'Future Projects', description: 'Coming Soon', lat: 45, lon: 120, link: '/projects/future' },
    { title: 'Archive', description: 'Past Work', lat: -30, lon: -45, link: '/projects/archive' },
    { title: 'Research Lab', description: 'Experiments', lat: 60, lon: -90, link: '/projects/lab' },
    { title: 'Collaborations', description: 'Joint Work', lat: 10, lon: 60, link: '/projects/collabs' },
  ];

  return (
    <main className="hp-main">
      {/* Camera intro overlay */}
      {!introComplete && <CameraIntro onComplete={handleIntroComplete} />}

      <div className={`hp-layout ${introComplete ? 'hp-layout-visible' : ''}`}>

        {/* LEFT 20% — Projects column */}
        <div className="hp-col hp-col-left">
          <div className="hp-col-label">Projects</div>
          <ScrollablePolaroidArea
            items={sortedProjects}
            selectedCountry={selectedCountry}
            selectedItem={selectedItem}
            visible={columnsVisible}
            side="left"
            emptyText={<>Select a country<br/>to explore</>}
          />
        </div>

        {/* CENTER 60% — Earth Globe */}
        <div className="hp-center">
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
                onCountryHover={handleCountryHover}
                showPins={true}
                showStars={true}
                autoRotate={false}
              />
            </Suspense>
            <OrbitControls
              enableZoom={false}
              enablePan={false}
              minPolarAngle={0}
              maxPolarAngle={Math.PI}
              rotateSpeed={0.5}
              enableDamping={true}
              dampingFactor={0.1}
            />
          </Canvas>
          {selectedCountry && (
            <div className="hp-country-badge">
              <span className="hp-country-badge-name">{selectedCountry}</span>
            </div>
          )}
        </div>

        {/* RIGHT 20% — Fotos column */}
        <div className="hp-col hp-col-right">
          <div className="hp-col-label">Snaps</div>
          <ScrollablePolaroidArea
            items={sortedFotos}
            selectedCountry={selectedCountry}
            selectedItem={selectedItem}
            visible={columnsVisible}
            side="right"
            emptyText={<>Select a country<br/>to explore</>}
          />
        </div>
      </div>
    </main>
  );
};

export default Home;