// src/hooks/useUnifiedScroll.js
// PREMIUM BIDIRECTIONAL SECTION TRANSITION SYSTEM
// Inspired by ironhill.au - Glass panel aesthetic with cinematic motion

import { useState, useEffect, useRef, useCallback } from 'react';
import gsap from 'gsap';

/**
 * Section Types:
 * - NORMAL: Standard viewport-height sections (snap transitions)
 * - LONG: Scrollable sections taller than viewport (scroll within, then transition)
 */

const SECTION_TYPES = {
  NORMAL: 'normal',
  LONG: 'long'
};

export const useUnifiedScroll = (sections = [], options = {}) => {
  const {
    transitionDuration = 0.5,
    easingFunction = 'cubic-bezier(0.65, 0, 0.35, 1)',
    rotationDegrees = 8, // Increased for visibility
    enableDebug = false
  } = options;

  // State
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [internalScrollProgress, setInternalScrollProgress] = useState(0);
  const [transitionDirection, setTransitionDirection] = useState(null); // 'down' | 'up'

  // Refs
  const containerRef = useRef(null);
  const sectionRefs = useRef([]);
  const isTransitioningRef = useRef(false);
  const scrollAccumulator = useRef(0);
  const lastScrollTime = useRef(Date.now());
  const internalScrollPositionRef = useRef(0);
  const currentSectionTypeRef = useRef(SECTION_TYPES.NORMAL);

  // Get current section config
  const currentSection = sections[currentSectionIndex] || {};
  const totalSections = sections.length;

  // Determine if current section is long (matching previous logic)
  const isLongSection = useCallback(() => {
    const section = sections[currentSectionIndex];
    if (!section) return false;
    
    // Use explicit type from config first
    if (section.type === 'long') return true;
    if (section.type === 'normal') return false;
    
    // Fallback to height detection
    const sectionEl = sectionRefs.current[currentSectionIndex];
    if (!sectionEl) return false;
    
    const sectionHeight = sectionEl.scrollHeight;
    const viewportHeight = window.innerHeight;
    
    // Match previous logic: if content overflows significantly
    return sectionHeight > viewportHeight * 1.2;
  }, [currentSectionIndex, sections]);

  // Check if at boundary of long section
  const isAtSectionBoundary = useCallback((direction) => {
    if (!isLongSection()) return true;

    const sectionEl = sectionRefs.current[currentSectionIndex];
    if (!sectionEl) return true;

    const scrollTop = internalScrollPositionRef.current;
    const scrollHeight = sectionEl.scrollHeight;
    const clientHeight = window.innerHeight;

    if (direction === 'down') {
      // At bottom boundary
      return scrollTop + clientHeight >= scrollHeight - 10;
    } else {
      // At top boundary
      return scrollTop <= 10;
    }
  }, [currentSectionIndex, isLongSection]);

  // Handle internal scroll within long sections (matching previous logic)
  const handleInternalScroll = useCallback((delta) => {
    const sectionEl = sectionRefs.current[currentSectionIndex];
    if (!sectionEl) return false;

    const maxScroll = sectionEl.scrollHeight - window.innerHeight;
    if (maxScroll <= 0) return false;

    const newScroll = Math.max(0, Math.min(maxScroll, internalScrollPositionRef.current + delta));
    
    // Only update if there's actual scroll change
    if (Math.abs(newScroll - internalScrollPositionRef.current) < 1) {
      return false;
    }

    internalScrollPositionRef.current = newScroll;
    setInternalScrollProgress(newScroll / maxScroll);

    // Use scrollTop directly for sticky sections (preserves previous behavior)
    if (sectionEl.style.position === 'sticky' || sectionEl.querySelector('[style*="sticky"]')) {
      // For sticky sections, let native scroll handle it
      sectionEl.scrollTop = newScroll;
    } else {
      // For non-sticky, use transform
      gsap.to(sectionEl, {
        y: -newScroll,
        duration: 0.1,
        ease: 'power2.out',
        overwrite: true
      });
    }

    return true;
  }, [currentSectionIndex]);

  // Glass panel transition animation
  const transitionToSection = useCallback((targetIndex, direction) => {
    if (isTransitioningRef.current) return;
    if (targetIndex < 0 || targetIndex >= totalSections) return;

    isTransitioningRef.current = true;
    setIsTransitioning(true);
    setTransitionDirection(direction);

    const currentEl = sectionRefs.current[currentSectionIndex];
    const targetEl = sectionRefs.current[targetIndex];

    if (!currentEl || !targetEl) {
      console.error('Section elements not found');
      isTransitioningRef.current = false;
      setIsTransitioning(false);
      return;
    }

    if (enableDebug) {
      console.log(`🎬 Transition: ${currentSectionIndex} → ${targetIndex} (${direction})`);
    }

    // Reset internal scroll position
    internalScrollPositionRef.current = 0;
    setInternalScrollProgress(0);

    // Create timeline
    const tl = gsap.timeline({
      onStart: () => {
        // Trigger section animations on start
        if (enableDebug) {
          console.log(`🎬 Animation starting for section ${targetIndex}`);
        }
      },
      onComplete: () => {
        setCurrentSectionIndex(targetIndex);
        isTransitioningRef.current = false;
        setIsTransitioning(false);
        setTransitionDirection(null);
        scrollAccumulator.current = 0;
        
        // CRITICAL: Trigger animations for the new active section
        const targetSection = sections[targetIndex];
        if (targetSection && targetSection.onEnter) {
          targetSection.onEnter();
        }
        
        // Dispatch custom event for section change
        window.dispatchEvent(new CustomEvent('sectionChanged', {
          detail: { 
            index: targetIndex, 
            section: targetSection,
            direction: direction
          }
        }));
        
        // Clean up non-active sections
        sectionRefs.current.forEach((el, idx) => {
          if (idx !== targetIndex && el) {
            gsap.set(el, {
              opacity: 0,
              y: 0,
              rotationX: 0,
              rotationY: 0,
              rotationZ: 0,
              scale: 1,
              filter: 'blur(0px)',
              display: 'none',
              zIndex: 0
            });
          }
        });

        if (enableDebug) {
          console.log('✅ Transition complete - section active:', targetIndex);
        }
      }
    });

    // Direction-specific parameters
    const isMovingDown = direction === 'down';
    
    // TRANSITION LOGIC: Vertical Disintegration (Ironhill Style)
    // Concept: Old section "evaporates" upward with heavy blur.
    // New section "condenses" from upward with heavy blur.
    
    // Increased distance for more prominent shift (Req 2)
    const exitY = isMovingDown ? -400 : 400; 
    const entryY = isMovingDown ? 400 : -400;
    
    // CRITICAL: Prepare target section
    gsap.set(targetEl, {
      display: 'block',
      visibility: 'visible',
      opacity: 0,
      x: 0,
      y: entryY,
      rotationX: 0,
      rotationY: 0,
      rotationZ: 0,
      scale: 1.2, // Start even larger (Req 2 prominence)
      filter: 'blur(60px)', // Heavier initial blur (Req 2)
      zIndex: 10,
      transformOrigin: 'center center',
      force3D: true
    });

    // Current section exit animation (Disintegrate)
    tl.to(currentEl, {
      y: exitY,
      opacity: 0,
      scale: 0.8, // Shrink more (Req 2)
      filter: 'blur(60px)', // Heavier blur out (Req 2)
      duration: transitionDuration * 1.2, // Slightly longer for prominence
      ease: 'power2.inOut',
      zIndex: 5,
      force3D: true
    }, 0);

    // Target section entry animation (Reintegrate)
    tl.to(targetEl, {
      y: 0,
      opacity: 1,
      scale: 1,
      filter: 'blur(0px)',
      duration: transitionDuration * 1.2,
      ease: 'power2.inOut',
      zIndex: 10,
      force3D: true,
      clearProps: 'all' 
    }, 0);

    // CRITICAL: Ensure final state is clean
    tl.set(targetEl, {
      display: 'block',
      visibility: 'visible',
      opacity: 1,
      x: 0, y: 0,
      rotationX: 0, rotationY: 0, rotationZ: 0,
      scale: 1,
      filter: 'blur(0px)',
      zIndex: 10
    });



  }, [currentSectionIndex, totalSections, transitionDuration, easingFunction, rotationDegrees, enableDebug]);

  // Scroll handler with INERTIA
  const handleScroll = useCallback((e) => {
    e.preventDefault();

    if (isTransitioningRef.current) return;

    const delta = e.deltaY;
    const direction = delta > 0 ? 'down' : 'up';
    const now = Date.now();
    const timeSinceLastScroll = now - lastScrollTime.current;

    // Reset accumulator if too much time passed (stops stale inertia)
    if (timeSinceLastScroll > 200) {
      scrollAccumulator.current = 0;
    }

    lastScrollTime.current = now;

    // INERTIA THRESHOLDS
    const NORMAL_THRESHOLD = 80;
    const LONG_SECTION_RESISTANCE = 300; // Much higher resistance for long sections (Req 4)

    // Check if current section is long
    if (isLongSection()) {
      currentSectionTypeRef.current = SECTION_TYPES.LONG;

      // Try internal scroll first
      const atBoundary = isAtSectionBoundary(direction);

      if (!atBoundary) {
        // Scroll within section
        handleInternalScroll(delta);
        scrollAccumulator.current = 0;
        return;
      }

      // At boundary - accumulate for transition (INERTIA)
      scrollAccumulator.current += Math.abs(delta);

      if (enableDebug) {
        console.log(`🛡️ Inertia Resistance: ${scrollAccumulator.current} / ${LONG_SECTION_RESISTANCE}`);
      }

      // Need significant momentum to break out of long section
      if (scrollAccumulator.current < LONG_SECTION_RESISTANCE) {
        // Add a small "rubber band" effect here if desired, but for now just resistance
        return;
      }
    } else {
      currentSectionTypeRef.current = SECTION_TYPES.NORMAL;
      scrollAccumulator.current += Math.abs(delta);

      if (scrollAccumulator.current < NORMAL_THRESHOLD) {
        return;
      }
    }

    // Trigger section transition
    scrollAccumulator.current = 0;

    if (direction === 'down' && currentSectionIndex < totalSections - 1) {
      transitionToSection(currentSectionIndex + 1, 'down');
    } else if (direction === 'up' && currentSectionIndex > 0) {
      transitionToSection(currentSectionIndex - 1, 'up');
    }

  }, [currentSectionIndex, totalSections, isLongSection, isAtSectionBoundary, handleInternalScroll, transitionToSection, enableDebug]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (isTransitioningRef.current) return;

    // Only trigger on boundaries for long sections
    if (isLongSection() && !isAtSectionBoundary(e.key === 'ArrowDown' ? 'down' : 'up')) {
      return;
    }

    if (e.key === 'ArrowDown' && currentSectionIndex < totalSections - 1) {
      e.preventDefault();
      transitionToSection(currentSectionIndex + 1, 'down');
    } else if (e.key === 'ArrowUp' && currentSectionIndex > 0) {
      e.preventDefault();
      transitionToSection(currentSectionIndex - 1, 'up');
    } else if (e.key === 'Home') {
      e.preventDefault();
      transitionToSection(0, 'up');
    } else if (e.key === 'End') {
      e.preventDefault();
      transitionToSection(totalSections - 1, 'down');
    }
  }, [currentSectionIndex, totalSections, isLongSection, isAtSectionBoundary, transitionToSection]);

  // Setup event listeners
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

  // Initialize first section
  useEffect(() => {
    if (sectionRefs.current[0]) {
      gsap.set(sectionRefs.current[0], {
        display: 'block',
        opacity: 1,
        y: 0,
        rotationX: 0,
        rotationY: 0,
        scale: 1,
        filter: 'blur(0px)',
        zIndex: 10
      });
    }

    // Hide all other sections
    sectionRefs.current.forEach((el, idx) => {
      if (idx !== 0 && el) {
        gsap.set(el, {
          display: 'none',
          opacity: 0
        });
      }
    });
  }, []);

  // Public API
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