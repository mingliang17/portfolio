import { useState, useEffect, useRef, useCallback } from 'react';
import gsap from 'gsap';

export const useUnifiedScroll = (sections = [], options = {}) => {
  const {
    transitionDuration = 0.5,
    enableDebug = false
  } = options;

  // State
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [internalScrollProgress, setInternalScrollProgress] = useState(0);
  const [transitionDirection, setTransitionDirection] = useState(null);

  // Refs
  const containerRef = useRef(null);
  const sectionRefs = useRef([]);
  const isTransitioningRef = useRef(false);
  const scrollAccumulator = useRef(0);
  const lastScrollTime = useRef(Date.now());
  const internalScrollPositionRef = useRef(0);
  const ctxRef = useRef(null);
  
  // For checkpoint sections - track continuous scroll position
  const continuousScrollRef = useRef(0);
  const scrollVelocityRef = useRef(0);
  const lastDeltaRef = useRef(0);

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

  const hasCheckpoints = useCallback(() => {
    const section = sections[currentSectionIndex];
    return section && section.checkpoints && Array.isArray(section.checkpoints) && section.checkpoints.length > 1;
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
  // CHECKPOINT SYSTEM (CONTINUOUS SCROLL WITH INERTIA)
  // ---------------------------------------------------

  const getNumCheckpoints = useCallback(() => {
    const section = sections[currentSectionIndex];
    if (!section) return 1;
    
    if (section.checkpoints && Array.isArray(section.checkpoints)) {
      return section.checkpoints.length;
    }
    
    return 1;
  }, [currentSectionIndex, sections]);

  // Apply magnetic inertia towards checkpoint positions
  const applyCheckpointInertia = useCallback((currentPos, numCheckpoints) => {
    if (numCheckpoints <= 1) return currentPos;

    const MAGNETIC_STRENGTH = 0.15; // How strong the pull is
    const MAGNETIC_RADIUS = 0.08;   // Distance from checkpoint where pull starts (0-1 scale)
    
    let adjustedPos = currentPos;
    
    for (let i = 0; i < numCheckpoints; i++) {
      const checkpointPos = i / (numCheckpoints - 1);
      const distance = Math.abs(currentPos - checkpointPos);
      
      if (distance < MAGNETIC_RADIUS) {
        const pullStrength = (1 - distance / MAGNETIC_RADIUS) * MAGNETIC_STRENGTH;
        adjustedPos = currentPos + (checkpointPos - currentPos) * pullStrength;
      }
    }
    
    return adjustedPos;
  }, []);

  // ---------------------------------------------------
  // INTERNAL SCROLL (CONTINUOUS FOR CHECKPOINTS)
  // ---------------------------------------------------

  const handleInternalScroll = useCallback((delta) => {
    const sectionEl = sectionRefs.current[currentSectionIndex];
    if (!sectionEl) return false;

    const maxScroll = sectionEl.scrollHeight - window.innerHeight;
    if (maxScroll <= 0) return false;

    const numCheckpoints = getNumCheckpoints();
    
    if (!hasCheckpoints()) {
      // No checkpoints, normal scroll
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
    }

    // CONTINUOUS CHECKPOINT SCROLL WITH INERTIA
    const SCROLL_SPEED = 0.0008; // How fast we scroll through checkpoints
    const DAMPING = 0.92;        // How quickly velocity decays
    const MIN_VELOCITY = 0.0001; // Stop when velocity is this low
    
    // Update velocity
    scrollVelocityRef.current = (scrollVelocityRef.current + delta * SCROLL_SPEED) * DAMPING;
    
    // Cap velocity
    const MAX_VELOCITY = 0.02;
    scrollVelocityRef.current = Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, scrollVelocityRef.current));
    
    // Update continuous position (0-1 range)
    let newPos = continuousScrollRef.current + scrollVelocityRef.current;
    
    // Apply checkpoint magnetic inertia
    newPos = applyCheckpointInertia(newPos, numCheckpoints);
    
    // Clamp to bounds
    newPos = Math.max(0, Math.min(1, newPos));
    
    // Check if at boundary and trying to go further
    if ((newPos <= 0 && delta < 0) || (newPos >= 1 && delta > 0)) {
      // Reduce velocity when trying to go past boundary
      scrollVelocityRef.current *= 0.5;
      return false; // Allow section transition
    }
    
    continuousScrollRef.current = newPos;
    
    // Convert 0-1 progress to actual scroll position
    const scrollPos = newPos * maxScroll;
    internalScrollPositionRef.current = scrollPos;
    setInternalScrollProgress(newPos);
    
    if (enableDebug && Math.abs(delta) > 0) {
      console.log('📜 Continuous Scroll:', {
        progress: newPos.toFixed(4),
        velocity: scrollVelocityRef.current.toFixed(6),
        checkpoint: (newPos * (numCheckpoints - 1)).toFixed(2)
      });
    }

    // Apply visual scroll
    if (
      sectionEl.style.position === 'sticky' ||
      sectionEl.querySelector('[style*="sticky"]')
    ) {
      sectionEl.scrollTop = scrollPos;
    } else {
      gsap.to(sectionEl, {
        y: -scrollPos,
        duration: 0.05,
        ease: 'none',
        overwrite: true
      });
    }

    return true;
  }, [currentSectionIndex, getNumCheckpoints, hasCheckpoints, applyCheckpointInertia, enableDebug]);

  // ---------------------------------------------------
  // SECTION TRANSITION
  // ---------------------------------------------------

  const transitionToSection = useCallback((targetIndex, direction) => {
    if (
      isTransitioningRef.current ||
      targetIndex < 0 ||
      targetIndex >= totalSections
    ) {
      return;
    }

    if (enableDebug) {
      console.log('🚀 Section Transition:', {
        from: currentSectionIndex,
        to: targetIndex,
        direction
      });
    }

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

    // Set initial state for incoming section
    gsap.set(targetEl, {
      display: 'block',
      visibility: 'visible',
      opacity: 0,
      y: entryY,
      scale: 1.1,
      filter: 'blur(40px)',
      zIndex: 10,
      force3D: true
    });

    const tl = gsap.timeline({
      onComplete: () => {
        // Reset scroll state
        internalScrollPositionRef.current = 0;
        continuousScrollRef.current = 0;
        scrollVelocityRef.current = 0;
        setInternalScrollProgress(0);

        setCurrentSectionIndex(targetIndex);
        isTransitioningRef.current = false;
        setIsTransitioning(false);
        setTransitionDirection(null);
        scrollAccumulator.current = 0;

        if (enableDebug) {
          console.log('✅ Transition Complete:', {
            newIndex: targetIndex,
            scrollReset: true
          });
        }

        // Trigger section callbacks
        const targetSection = sections[targetIndex];
        if (targetSection?.onEnter) {
          targetSection.onEnter();
        }

        // Dispatch custom event
        window.dispatchEvent(
          new CustomEvent('sectionChanged', {
            detail: { 
              index: targetIndex, 
              section: targetSection, 
              direction 
            }
          })
        );

        // Hide all other sections
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

    // Smoother exit animation
    tl.to(
      currentEl,
      {
        y: exitY,
        opacity: 0,
        scale: 0.9,
        filter: 'blur(40px)',
        duration: transitionDuration * 1.3,
        ease: 'power2.inOut',
        zIndex: 5,
        force3D: true
      },
      0
    );

    // Smoother entrance animation
    tl.to(
      targetEl,
      {
        y: 0,
        opacity: 1,
        scale: 1,
        filter: 'blur(0px)',
        duration: transitionDuration * 1.3,
        ease: 'power2.inOut',
        zIndex: 10,
        force3D: true,
        clearProps: 'transform'
      },
      0.1
    );
  }, [currentSectionIndex, totalSections, transitionDuration, sections, enableDebug]);

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

    if (timeSinceLastScroll > 200) {
      scrollAccumulator.current = 0;
    }
    lastScrollTime.current = now;

    const NORMAL_THRESHOLD = 80;
    const LONG_SECTION_RESISTANCE = 300;

    if (isLongSection()) {
      const consumed = handleInternalScroll(delta);
      
      if (consumed) {
        return; // Still scrolling internally
      }

      // At boundary - check if we can transition
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
  // PUBLIC API
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