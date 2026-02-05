// src/hooks/useUnifiedScroll.js
import { useState, useEffect, useRef, useCallback } from 'react';
import gsap from 'gsap';

export const useUnifiedScroll = (sections = [], options = {}) => {
  const {
    transitionDuration = 0.5,
    enableDebug = false
  } = options;

  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [internalScrollProgress, setInternalScrollProgress] = useState(0);
  const [transitionDirection, setTransitionDirection] = useState(null);

  const containerRef = useRef(null);
  const sectionRefs = useRef([]);
  const isTransitioningRef = useRef(false);
  const scrollAccumulator = useRef(0);
  const lastScrollTime = useRef(Date.now());
  const internalScrollPositionRef = useRef(0);
  const ctxRef = useRef(null);

  const totalSections = sections.length;
  const currentSection = sections[currentSectionIndex] || {};

  // ---------------------------------------------------
  // SECTION TYPE HELPERS
  // ---------------------------------------------------

  const isLongSection = useCallback(() => {
    const section = sections[currentSectionIndex];
    if (!section) return false;
    if (section.type === 'long') return true;
    if (section.type === 'normal') return false;

    const sectionEl = sectionRefs.current[currentSectionIndex];
    if (!sectionEl) return false;

    return sectionEl.scrollHeight > window.innerHeight * 1.2;
  }, [currentSectionIndex, sections]);

  const isAtSectionBoundary = useCallback((direction) => {
    if (!isLongSection()) return true;

    const sectionEl = sectionRefs.current[currentSectionIndex];
    if (!sectionEl) return true;

    const scrollTop = internalScrollPositionRef.current;
    const scrollHeight = sectionEl.scrollHeight;
    const clientHeight = window.innerHeight;

    if (direction === 'down') {
      return scrollTop + clientHeight >= scrollHeight - 10;
    } else {
      return scrollTop <= 10;
    }
  }, [currentSectionIndex, isLongSection]);

  // ---------------------------------------------------
  // INTERNAL SCROLL (LONG SECTIONS)
  // ---------------------------------------------------

  const handleInternalScroll = useCallback((delta) => {
    const sectionEl = sectionRefs.current[currentSectionIndex];
    if (!sectionEl) return false;

    const maxScroll = sectionEl.scrollHeight - window.innerHeight;
    if (maxScroll <= 0) return false;

    const newScroll = Math.max(
      0,
      Math.min(maxScroll, internalScrollPositionRef.current + delta)
    );

    if (Math.abs(newScroll - internalScrollPositionRef.current) < 1) {
      return false;
    }

    internalScrollPositionRef.current = newScroll;
    setInternalScrollProgress(newScroll / maxScroll);

    if (
      sectionEl.style.position === 'sticky' ||
      sectionEl.querySelector('[style*="sticky"]')
    ) {
      sectionEl.scrollTop = newScroll;
    } else {
      gsap.to(sectionEl, {
        y: -newScroll,
        duration: 0.1,
        ease: 'power2.out',
        overwrite: true
      });
    }

    return true;
  }, [currentSectionIndex]);

  // ---------------------------------------------------
  // SECTION TRANSITION (FIXED)
  // ---------------------------------------------------

  const transitionToSection = useCallback((targetIndex, direction) => {
    if (
      isTransitioningRef.current ||
      targetIndex < 0 ||
      targetIndex >= totalSections
    ) return;

    isTransitioningRef.current = true;
    setIsTransitioning(true);
    setTransitionDirection(direction);

    const currentEl = sectionRefs.current[currentSectionIndex];
    const targetEl = sectionRefs.current[targetIndex];

    if (!currentEl || !targetEl) {
      isTransitioningRef.current = false;
      setIsTransitioning(false);
      return;
    }

    const isMovingDown = direction === 'down';
    const exitY = isMovingDown ? -400 : 400;
    const entryY = isMovingDown ? 400 : -400;

    gsap.set(targetEl, {
      display: 'block',
      visibility: 'visible',
      opacity: 0,
      y: entryY,
      scale: 1.2,
      filter: 'blur(60px)',
      zIndex: 10,
      force3D: true
    });

    const tl = gsap.timeline({
      onComplete: () => {
        // 🔒 Transition finished — NOW reset scroll state
        internalScrollPositionRef.current = 0;
        setInternalScrollProgress(0);

        setCurrentSectionIndex(targetIndex);
        isTransitioningRef.current = false;
        setIsTransitioning(false);
        setTransitionDirection(null);
        scrollAccumulator.current = 0;

        const targetSection = sections[targetIndex];
        if (targetSection?.onEnter) targetSection.onEnter();

        window.dispatchEvent(new CustomEvent('sectionChanged', {
          detail: { index: targetIndex, section: targetSection, direction }
        }));

        sectionRefs.current.forEach((el, idx) => {
          if (idx !== targetIndex && el) {
            gsap.set(el, {
              display: 'none',
              opacity: 0,
              y: 0,
              scale: 1,
              filter: 'blur(0px)',
              zIndex: 0
            });
          }
        });
      }
    });

    tl.to(currentEl, {
      y: exitY,
      opacity: 0,
      scale: 0.8,
      filter: 'blur(60px)',
      duration: transitionDuration * 1.2,
      ease: 'power2.inOut',
      zIndex: 5,
      force3D: true
    }, 0);

    tl.to(targetEl, {
      y: 0,
      opacity: 1,
      scale: 1,
      filter: 'blur(0px)',
      duration: transitionDuration * 1.2,
      ease: 'power2.inOut',
      zIndex: 10,
      force3D: true,
      clearProps: 'transform'
    }, 0);

  }, [currentSectionIndex, totalSections, transitionDuration, sections]);

  // ---------------------------------------------------
  // INPUT HANDLERS
  // ---------------------------------------------------

  const handleScroll = useCallback((e) => {
    e.preventDefault();
    if (isTransitioningRef.current) return;

    const delta = e.deltaY;
    const direction = delta > 0 ? 'down' : 'up';
    const now = Date.now();
    const timeSinceLastScroll = now - lastScrollTime.current;

    if (timeSinceLastScroll > 200) scrollAccumulator.current = 0;
    lastScrollTime.current = now;

    const NORMAL_THRESHOLD = 80;
    const LONG_SECTION_RESISTANCE = 300;

    if (isLongSection()) {
      if (!isAtSectionBoundary(direction)) {
        handleInternalScroll(delta);
        scrollAccumulator.current = 0;
        return;
      }
      scrollAccumulator.current += Math.abs(delta);
      if (scrollAccumulator.current < LONG_SECTION_RESISTANCE) return;
    } else {
      scrollAccumulator.current += Math.abs(delta);
      if (scrollAccumulator.current < NORMAL_THRESHOLD) return;
    }

    scrollAccumulator.current = 0;

    if (direction === 'down' && currentSectionIndex < totalSections - 1) {
      transitionToSection(currentSectionIndex + 1, 'down');
    } else if (direction === 'up' && currentSectionIndex > 0) {
      transitionToSection(currentSectionIndex - 1, 'up');
    }
  }, [
    currentSectionIndex,
    totalSections,
    isLongSection,
    isAtSectionBoundary,
    handleInternalScroll,
    transitionToSection
  ]);

  const handleKeyDown = useCallback((e) => {
    if (isTransitioningRef.current) return;

    const dir =
      e.key === 'ArrowDown' ? 'down' :
      e.key === 'ArrowUp' ? 'up' :
      null;

    if (dir && isLongSection() && !isAtSectionBoundary(dir)) return;

    if (e.key === 'ArrowDown' && currentSectionIndex < totalSections - 1) {
      e.preventDefault();
      transitionToSection(currentSectionIndex + 1, 'down');
    } else if (e.key === 'ArrowUp' && currentSectionIndex > 0) {
      e.preventDefault();
      transitionToSection(currentSectionIndex - 1, 'up');
    }
  }, [
    currentSectionIndex,
    totalSections,
    isLongSection,
    isAtSectionBoundary,
    transitionToSection
  ]);

  // ---------------------------------------------------
  // EFFECTS
  // ---------------------------------------------------

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('wheel', handleScroll, { passive: false });
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('wheel', handleScroll);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleScroll, handleKeyDown]);

  useEffect(() => {
    ctxRef.current = gsap.context(() => {
      sectionRefs.current.forEach((el, idx) => {
        gsap.set(el, {
          display: idx === 0 ? 'block' : 'none',
          opacity: idx === 0 ? 1 : 0,
          y: 0,
          scale: 1,
          filter: 'blur(0px)',
          zIndex: idx === 0 ? 10 : 0
        });
      });
    }, containerRef);

    return () => ctxRef.current?.revert();
  }, []);

  // ---------------------------------------------------
  // API
  // ---------------------------------------------------

  const goToSection = useCallback((index) => {
    if (index === currentSectionIndex) return;
    const direction = index > currentSectionIndex ? 'down' : 'up';
    transitionToSection(index, direction);
  }, [currentSectionIndex, transitionToSection]);

  return {
    containerRef,
    sectionRefs,
    currentSectionIndex,
    isTransitioning,
    transitionDirection,
    internalScrollProgress,
    goToSection,
    currentSection,
    totalSections,
    isLongSection: isLongSection()
  };
};

export default useUnifiedScroll;
