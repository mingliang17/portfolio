// src/pages/templates/ProjectTemplate.jsx
import React, { useCallback, useState, useEffect, useRef, useMemo } from 'react';
import gsap from 'gsap';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';

gsap.registerPlugin(ScrollToPlugin);

const DRAG_THRESHOLD_DISTANCE = 300;
const SNAP_SENSITIVITY = 80; // Pixels of scroll nudge to trigger a snap

const ProjectTemplate = ({ projectData, sections = [], onSectionChange = null }) => {
  // --- State ---
  const [heroUnlocked, setHeroUnlocked] = useState(false);
  const [currentSection, setCurrentSection] = useState(0); // 0 = Hero
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [dragProgress, setDragProgress] = useState(0);

  // --- Refs ---
  const heroRef = useRef(null);
  const titleRef = useRef(null);
  const subtitleRef = useRef(null);
  const backgroundRef = useRef(null);
  const sectionRefs = useRef([]);
  const sectionPositionsRef = useRef({});
  const sectionConfigsRef = useRef({});
  
  const isScrollingProgrammatically = useRef(false);
  const isDragging = useRef(false);
  const dragStartY = useRef(0);
  const lastScrollY = useRef(0);

  const heroSection = useMemo(() => sections.find(s => s.type === 'hero'), [sections]);
  const nonHeroSections = useMemo(() => sections.filter(s => s.type !== 'hero'), [sections]);

  // --- 1. Metrics ---
  const updateSectionMetrics = useCallback(() => {
    if (!heroUnlocked) return;
    const positions = {};
    let currentTop = 0;

    sectionRefs.current.forEach((ref, idx) => {
      if (!ref) return;
      const config = sectionConfigsRef.current[idx];
      const vh = window.innerHeight;
      
      const height = config?.fitInViewport 
        ? vh 
        : (config?.scrollMultiplier > 1 ? vh * config.scrollMultiplier : ref.offsetHeight);

      positions[idx] = { top: currentTop, bottom: currentTop + height, height };
      currentTop += height;
    });
    sectionPositionsRef.current = positions;
  }, [heroUnlocked]);

  useEffect(() => {
    const configs = {};
    nonHeroSections.forEach((s, i) => {
      configs[i] = { fitInViewport: s.fitInViewport, scrollMultiplier: s.scrollMultiplier || 1 };
    });
    sectionConfigsRef.current = configs;
    updateSectionMetrics();
  }, [nonHeroSections, updateSectionMetrics]);

  // --- 2. Transition Mechanism ---
  const transitionToSection = useCallback((targetIdx) => {
    if (isTransitioning || targetIdx < 0 || targetIdx >= nonHeroSections.length) return;

    setIsTransitioning(true);
    isScrollingProgrammatically.current = true;
    setCurrentSection(targetIdx + 1);

    const targetPos = sectionPositionsRef.current[targetIdx]?.top ?? 0;

    gsap.to(window, {
      duration: 0.9,
      scrollTo: { y: targetPos, autoKill: false },
      ease: "power4.inOut",
      onComplete: () => {
        setTimeout(() => {
          isScrollingProgrammatically.current = false;
          setIsTransitioning(false);
          lastScrollY.current = window.scrollY;
        }, 50);
      }
    });
  }, [isTransitioning, nonHeroSections.length]);

  // --- 3. Boundary Snapping Logic ---
  useEffect(() => {
    if (!heroUnlocked) return;

    const handleScroll = () => {
      if (isScrollingProgrammatically.current || isTransitioning) return;

      const currentY = window.scrollY;
      const direction = currentY > lastScrollY.current ? 'down' : 'up';
      const viewportHeight = window.innerHeight;
      const positions = sectionPositionsRef.current;

      // Update Nav Indicator
      let activeIdx = 0;
      Object.entries(positions).forEach(([idx, pos]) => {
        if (currentY + viewportHeight / 2 >= pos.top) activeIdx = parseInt(idx) + 1;
      });
      if (activeIdx !== currentSection) setCurrentSection(activeIdx);

      // --- Snapping Logic ---
      Object.entries(positions).forEach(([idx, pos]) => {
        const i = parseInt(idx);
        
        // A) SNAP DOWN: If we are scrolling down and cross into a new section's "territory"
        if (direction === 'down' && i > 0) {
          const prevSectionPos = positions[i - 1];
          // If we just left the previous section's bottom
          if (currentY > prevSectionPos.bottom - viewportHeight + SNAP_SENSITIVITY && currentY < pos.top) {
            transitionToSection(i);
          }
        }

        // B) SNAP UP: If we are scrolling up and cross back into the previous section
        if (direction === 'up' && i < nonHeroSections.length - 1) {
          const nextSectionPos = positions[i + 1];
          // If we scroll up past the top of the next section
          if (currentY < nextSectionPos.top - SNAP_SENSITIVITY && currentY > pos.top) {
            transitionToSection(i);
          }
        }
        
        // C) SPECIAL CASE: If we are inside a normal section, snap to it immediately
        if (sectionConfigsRef.current[i]?.fitInViewport) {
          const distFromTop = Math.abs(currentY - pos.top);
          if (distFromTop > 0 && distFromTop < SNAP_SENSITIVITY) {
            transitionToSection(i);
          }
        }
      });

      lastScrollY.current = currentY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [heroUnlocked, isTransitioning, currentSection, transitionToSection, nonHeroSections.length]);

  // --- 4. Hero Logic ---
  const handleHeroDrag = (clientY) => {
    if (!isDragging.current || heroUnlocked) return;
    const progress = Math.min(1, Math.max(0, (dragStartY.current - clientY) / DRAG_THRESHOLD_DISTANCE));
    setDragProgress(progress);
    gsap.set([titleRef.current, subtitleRef.current], { opacity: 1 - progress });
    if (progress >= 1) {
      setHeroUnlocked(true);
      setTimeout(() => {
        updateSectionMetrics();
        transitionToSection(0);
      }, 50);
    }
  };

  return (
    <div 
      className="unified-project-container"
      onMouseMove={(e) => handleHeroDrag(e.clientY)}
      onTouchMove={(e) => handleHeroDrag(e.touches[0].clientY)}
      onMouseDown={(e) => { isDragging.current = true; dragStartY.current = e.clientY; }}
      onTouchStart={(e) => { isDragging.current = true; dragStartY.current = e.touches[0].clientY; }}
      onMouseUp={() => { isDragging.current = false; setDragProgress(0); }}
      onTouchEnd={() => { isDragging.current = false; setDragProgress(0); }}
    >
      {!heroUnlocked && (
        <section ref={heroRef} className="unified-hero-section">
          <div ref={backgroundRef} className="hero-background" style={{ backgroundImage: `url('${heroSection.backgroundImage}')` }} />
          <div className="hero-content-wrapper">
            <h1 ref={titleRef}>{heroSection.title}</h1>
            <p ref={subtitleRef}>{heroSection.subtitle}</p>
          </div>
          <div className="drag-prompt">Drag Up to Begin</div>
        </section>
      )}
      
      {heroUnlocked && (
        <div className="unified-content-container">
          {nonHeroSections.map((section, idx) => (
            <section
              key={idx}
              ref={el => sectionRefs.current[idx] = el}
              className={`unified-section ${section.fitInViewport ? 'snap-section' : 'overflow-section'}`}
              style={{
                height: section.fitInViewport ? '100vh' : (section.scrollMultiplier > 1 ? `${section.scrollMultiplier * 100}vh` : 'auto')
              }}
            >
              {section.component}
            </section>
          ))}
        </div>
      )}

      {/* Nav Dots with #Section index labels */}
      <div className="unified-nav-dots">
        {sections.map((_, i) => (
          <button 
            key={i} 
            className={`unified-nav-dot ${currentSection === i ? 'active' : ''}`}
            onClick={() => i === 0 ? window.scrollTo({top: 0, behavior: 'smooth'}) : transitionToSection(i - 1)}
          >
            <span className="dot-label">#0{i}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ProjectTemplate;