// src/hooks/useProjectNavigation.js
import { useState, useEffect } from 'react';

export const useProjectNavigation = (
  totalSections,
  animationStatus,
  onGoBack,
  currentSection,
  setCurrentSection,
  startMapAnimation,
  setStartMapAnimation
) => {
  const [isScrolling, setIsScrolling] = useState(false);

  // Trigger map animation when entering section 1
  useEffect(() => {
    if (currentSection === 1 && !startMapAnimation) {
      console.log('🗺️ Starting map animation');
      setStartMapAnimation(true);
    }
  }, [currentSection, startMapAnimation, setStartMapAnimation]);

  // Navigation listeners
  useEffect(() => {
    console.log(`🎮 Navigation: currentSection=${currentSection}, animationStatus=${animationStatus}`);
    
    // CRITICAL: Disable ALL navigation when we're in section 0 
    // The hero section handles its own drag for unlocking
    if (currentSection === 0) {
      console.log('🔒 Navigation DISABLED in hero section');
      return;
    }

    let lastScrollTime = Date.now();
    let accumulatedDelta = 0;

    const handleWheel = (e) => {
      e.preventDefault();

      const now = Date.now();
      if (now - lastScrollTime > 200) accumulatedDelta = 0;

      lastScrollTime = now;
      accumulatedDelta += e.deltaY;

      if (Math.abs(accumulatedDelta) > 120 && !isScrolling) {
        if (accumulatedDelta > 0 && currentSection < totalSections - 1) {
          console.log('⬇️ Wheel scroll down - Next section');
          setCurrentSection(prev => prev + 1);
        } else if (accumulatedDelta < 0 && currentSection > 0) {
          console.log('⬆️ Wheel scroll up - Previous section');
          onGoBack(currentSection, setCurrentSection);
        }
        accumulatedDelta = 0;
        setIsScrolling(true);
      }
    };

    const handleKeyDown = (e) => {
      if (isScrolling) return;

      if (e.key === 'ArrowDown' && currentSection < totalSections - 1) {
        console.log('⬇️ ArrowDown - Next section');
        setCurrentSection(prev => prev + 1);
        setIsScrolling(true);
      } else if (e.key === 'ArrowUp' && currentSection > 0) {
        console.log('⬆️ ArrowUp - Previous section');
        onGoBack(currentSection, setCurrentSection);
        setIsScrolling(true);
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    currentSection,
    isScrolling,
    totalSections,
    onGoBack,
    setCurrentSection,
    animationStatus
  ]);

  // Scroll throttle
  useEffect(() => {
    if (isScrolling) {
      const timeout = setTimeout(() => {
        setIsScrolling(false);
      }, 900);
      return () => clearTimeout(timeout);
    }
  }, [isScrolling]);
};