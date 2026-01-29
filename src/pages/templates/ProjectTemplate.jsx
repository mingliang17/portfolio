// src/pages/templates/ProjectTemplate.jsx
import React, { useCallback, useState, useEffect, useRef, useMemo } from 'react';
import gsap from 'gsap';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';

gsap.registerPlugin(ScrollToPlugin);

const DRAG_THRESHOLD_DISTANCE = 200;
const SNAP_SENSITIVITY = 100; 

const ProjectTemplate = ({ projectData, sections = [] }) => {
  const [heroUnlocked, setHeroUnlocked] = useState(false);
  const [currentSection, setCurrentSection] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const heroRef = useRef(null);
  const sectionRefs = useRef([]);
  const sectionPositionsRef = useRef({});
  
  const isScrollingProgrammatically = useRef(false);
  const isDragging = useRef(false);
  const dragStartY = useRef(0);
  const lastScrollY = useRef(0);

  const heroSection = useMemo(() => sections.find(s => s.type === 'hero'), [sections]);
  const nonHeroSections = useMemo(() => sections.filter(s => s.type !== 'hero'), [sections]);

  // --- 1. Calculate Positions ---
  const updateSectionMetrics = useCallback(() => {
    const positions = {};
    let currentTop = 0;

    sectionRefs.current.forEach((ref, idx) => {
      if (!ref) return;
      // Get the real height (including the 600vh runway)
      const height = ref.offsetHeight; 
      positions[idx] = { 
        top: currentTop, 
        bottom: currentTop + height, 
        height,
        type: nonHeroSections[idx].type 
      };
      currentTop += height;
    });
    sectionPositionsRef.current = positions;
  }, [nonHeroSections]);

  useEffect(() => {
    if (heroUnlocked) {
      // Small delay to ensure DOM is rendered
      const timer = setTimeout(updateSectionMetrics, 100);
      window.addEventListener('resize', updateSectionMetrics);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', updateSectionMetrics);
      };
    }
  }, [heroUnlocked, updateSectionMetrics]);

  // --- 2. Smooth Scroll To ---
  const transitionToSection = useCallback((targetIdx) => {
    if (isTransitioning || targetIdx < 0) return;

    setIsTransitioning(true);
    isScrollingProgrammatically.current = true;
    
    const targetPos = sectionPositionsRef.current[targetIdx]?.top ?? 0;

    gsap.to(window, {
      duration: 1,
      scrollTo: { y: targetPos, autoKill: false },
      ease: "power4.inOut",
      onComplete: () => {
        isScrollingProgrammatically.current = false;
        setIsTransitioning(false);
        setCurrentSection(targetIdx + 1);
        lastScrollY.current = window.scrollY;
      }
    });
  }, [isTransitioning]);

  // --- 3. Scroll Watcher ---
  useEffect(() => {
    if (!heroUnlocked) return;

    const handleScroll = () => {
      if (isScrollingProgrammatically.current) return;

      const currentY = window.scrollY;
      const vh = window.innerHeight;
      const positions = sectionPositionsRef.current;

      // Update Nav Dots
      Object.entries(positions).forEach(([idx, pos]) => {
        if (currentY >= pos.top - vh/2 && currentY < pos.bottom - vh/2) {
          setCurrentSection(parseInt(idx) + 1);
        }
      });

      // Snapping Logic: Only snap if we are close to a boundary of a 'fitInViewport' section
      Object.entries(positions).forEach(([idx, pos]) => {
        const i = parseInt(idx);
        const config = nonHeroSections[i];

        if (config.fitInViewport) {
          const dist = currentY - pos.top;
          if (Math.abs(dist) > 10 && Math.abs(dist) < SNAP_SENSITIVITY) {
            transitionToSection(i);
          }
        }
      });

      lastScrollY.current = currentY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [heroUnlocked, transitionToSection, nonHeroSections]);

  // --- 4. Hero Interaction ---
  const onDrag = (clientY) => {
    if (heroUnlocked || !isDragging.current) return;
    const dist = dragStartY.current - clientY;
    if (dist > DRAG_THRESHOLD_DISTANCE) {
      setHeroUnlocked(true);
      isDragging.current = false;
    }
  };

  return (
    <div 
      className="unified-project-container"
      onMouseDown={e => { isDragging.current = true; dragStartY.current = e.clientY; }}
      onMouseMove={e => onDrag(e.clientY)}
      onMouseUp={() => isDragging.current = false}
      onTouchStart={e => { isDragging.current = true; dragStartY.current = e.touches[0].clientY; }}
      onTouchMove={e => onDrag(e.touches[0].clientY)}
      onTouchEnd={() => isDragging.current = false}
    >
      {!heroUnlocked && heroSection && (
        <section className="unified-hero-section">
          <div className="hero-background" style={{ backgroundImage: `url('${heroSection.backgroundImage}')` }} />
          <div className="hero-content-wrapper">
            <h1 className="text-6xl font-bold">{heroSection.title}</h1>
            <p className="text-xl opacity-70">{heroSection.subtitle}</p>
          </div>
          <div className="absolute bottom-10 animate-bounce text-white/50">Drag Up to Explore</div>
        </section>
      )}

      {heroUnlocked && (
        <div className="unified-content-container">
          {nonHeroSections.map((section, idx) => (
            <section
              key={idx}
              ref={el => sectionRefs.current[idx] = el}
              className={`unified-section ${section.fitInViewport ? 'snap-section' : 'overflow-section'}`}
            >
              {section.component}
            </section>
          ))}
        </div>
      )}

      <div className="unified-nav-dots">
        {sections.map((_, i) => (
          <button 
            key={i} 
            className={`unified-nav-dot ${currentSection === i ? 'active' : ''}`}
            onClick={() => i === 0 ? setHeroUnlocked(false) : transitionToSection(i - 1)}
          >
            <span className="dot-label">Section {i}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ProjectTemplate;