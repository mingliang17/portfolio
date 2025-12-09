// src/hooks/index.js
// FULLY FIXED VERSION - Proper state management and dependencies

import { useState, useEffect, useRef, useCallback } from 'react';

// ===================================
// ANIMATION HOOK - FIXED
// ===================================

/**
 * useProjectAnimation - Manages project animation sequences
 * 
 * @param {number} currentSection - Current section index
 * @param {function} onAnimationComplete - Callback when unlock animation finishes
 * @param {function} setAnimationPhase - State setter from parent
 */
export const useProjectAnimation = (currentSection, onAnimationComplete, setAnimationPhase) => {
  const [animationPhase, setLocalAnimationPhase] = useState('initial');
  const [titleOpacity, setTitleOpacity] = useState(0);
  const [unlockProgress, setUnlockProgress] = useState(0);
  const [gradientOpacity, setGradientOpacity] = useState(0);
  const [backgroundFade, setBackgroundFade] = useState(0);
  
  const scrollAccumulator = useRef(0);
  const touchStartY = useRef(0);
  const isDragging = useRef(false);
  const dragProgressRef = useRef(0);

  // Sync local state with parent state setter
  useEffect(() => {
    if (setAnimationPhase) {
      setAnimationPhase(animationPhase);
    }
  }, [animationPhase, setAnimationPhase]);

  // Initial animation sequence (section 0 only)
  useEffect(() => {
    if (currentSection !== 0) return;
    
    console.log('🎬 Starting initial animation sequence');
    const runSequence = async () => {
      setGradientOpacity(0);
      setBackgroundFade(0);
      setTitleOpacity(0);
      
      // Step 1: Fade in gradient
      setGradientOpacity(1);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Step 2: Fade in background
      setBackgroundFade(1);
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Step 3: Fade in title and transition to waiting
      setTitleOpacity(1);
      setTimeout(() => {
        console.log('✅ Initial sequence complete, entering waiting phase');
        setLocalAnimationPhase('waiting');
      }, 1000);
    };
    
    runSequence();
  }, [currentSection]);

  // Handle drag during waiting phase
  useEffect(() => {
    if (currentSection !== 0 || animationPhase !== 'waiting') return;

    const updateDragUI = (progress) => {
      dragProgressRef.current = progress;
      setGradientOpacity(Math.max(0, 1 - progress));
    };

    const resetDrag = () => {
      isDragging.current = false;
      document.body.style.cursor = '';
      
      if (dragProgressRef.current > 0) {
        const resetInterval = setInterval(() => {
          dragProgressRef.current = Math.max(0, dragProgressRef.current - 0.1);
          updateDragUI(dragProgressRef.current);
          
          if (dragProgressRef.current <= 0) {
            clearInterval(resetInterval);
            scrollAccumulator.current = 0;
          }
        }, 16);
      }
    };

    const handleStart = (clientY) => {
      isDragging.current = true;
      touchStartY.current = clientY;
      document.body.style.cursor = 'grabbing';
    };

    const handleMove = (clientY) => {
      if (!isDragging.current) return;
      
      const deltaY = touchStartY.current - clientY;
      
      if (deltaY > 0) {
        scrollAccumulator.current += deltaY;
        const progress = Math.min(1, scrollAccumulator.current / 300);
        updateDragUI(progress);
        
        if (scrollAccumulator.current >= 300) {
          console.log('🎯 Drag threshold reached (300px), starting unlock animation');
          setLocalAnimationPhase('unlocking');
          scrollAccumulator.current = 0;
          isDragging.current = false;
          document.body.style.cursor = '';
        }
        
        touchStartY.current = clientY;
      }
    };

    const handleTouchStart = (e) => handleStart(e.touches[0].clientY);
    const handleTouchMove = (e) => handleMove(e.touches[0].clientY);
    const handleTouchEnd = resetDrag;
    const handleMouseDown = (e) => handleStart(e.clientY);
    const handleMouseMove = (e) => handleMove(e.clientY);
    const handleMouseUp = resetDrag;

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
    };
  }, [animationPhase, currentSection]);

  // Unlock animation
  useEffect(() => {
    if (currentSection !== 0 || animationPhase !== 'unlocking') return;

    console.log('🔓 Starting unlock animation (circle expanding)');
    let progress = 0;
    const unlockInterval = setInterval(() => {
      progress += 0.02;
      setUnlockProgress(progress);
      setTitleOpacity(Math.max(0, 1 - progress * 2));
      
      if (progress >= 1) {
        clearInterval(unlockInterval);
        console.log('✅ Unlock animation complete (100%), starting fadeout');
        setLocalAnimationPhase('fadeout');
      }
    }, 20);

    return () => clearInterval(unlockInterval);
  }, [animationPhase, currentSection]);

  // Fade out and trigger section transition
  useEffect(() => {
    if (currentSection !== 0 || animationPhase !== 'fadeout') return;

    console.log('🌅 Starting fadeout animation (background fading out)');
    let fadeProgress = 0;
    const fadeInterval = setInterval(() => {
      fadeProgress += 0.05;
      const newFade = Math.max(0, 1 - fadeProgress);
      setBackgroundFade(newFade);
      
      console.log(`📉 Fadeout progress: ${(fadeProgress * 100).toFixed(0)}%, backgroundFade: ${newFade.toFixed(2)}`);
      
      if (fadeProgress >= 1) {
        clearInterval(fadeInterval);
        console.log('✅ Fadeout complete (100%), setting phase to completed');
        setLocalAnimationPhase('completed');
        
        // Trigger section change
        if (onAnimationComplete) {
          setTimeout(() => {
            console.log('🚀 Calling onAnimationComplete to change section');
            onAnimationComplete();
          }, 100);
        }
      }
    }, 20);

    return () => clearInterval(fadeInterval);
  }, [animationPhase, currentSection, onAnimationComplete]);

  return {
    titleOpacity,
    unlockProgress,
    gradientOpacity,
    backgroundFade,
    dragProgress: dragProgressRef.current,
    setBackgroundFade,
    setTitleOpacity,
    setGradientOpacity,
  };
};

// ===================================
// NAVIGATION HOOK - FIXED
// ===================================

/**
 * useProjectNavigation - Manages section navigation
 * Now handles state internally and returns nothing (uses passed state setters)
 */
export const useProjectNavigation = (
  totalSections, 
  animationPhase, 
  onGoBack,
  currentSection,
  setCurrentSection,
  startMapAnimation,
  setStartMapAnimation
) => {
  const [isScrolling, setIsScrolling] = useState(false);

  // Trigger map animation when entering section 1
  useEffect(() => {
    console.log('📍 Navigation: currentSection changed to', currentSection);
    if (currentSection === 1 && !startMapAnimation) {
      console.log('🗺️ Triggering map animation');
      setStartMapAnimation(true);
    }
  }, [currentSection, startMapAnimation, setStartMapAnimation]);

  // Navigation event handlers (only after animation completes)
  useEffect(() => {
    console.log('🎮 Navigation listeners check - animationPhase:', animationPhase);
    
    if (animationPhase !== 'completed') {
      console.log('⏸️ Navigation disabled, waiting for animation to complete');
      return;
    }

    console.log('✅ Navigation ENABLED - setting up event listeners');

    let lastScrollTime = Date.now();
    let accumulatedDelta = 0;
    let dragStartY = 0;
    let isDragging = false;

    const handleWheel = (e) => {
      e.preventDefault();
      
      const now = Date.now();
      if (now - lastScrollTime > 200) accumulatedDelta = 0;
      
      lastScrollTime = now;
      accumulatedDelta += e.deltaY;
      
      if (Math.abs(accumulatedDelta) > 100 && !isScrolling) {
        if (accumulatedDelta > 0 && currentSection < totalSections - 1) {
          console.log('⬇️ Scrolling down to section', currentSection + 1);
          setCurrentSection(prev => prev + 1);
          accumulatedDelta = 0;
        } else if (accumulatedDelta < 0 && currentSection > 0) {
          console.log('⬆️ Scrolling up to section', currentSection - 1);
          onGoBack(currentSection, setCurrentSection);
          accumulatedDelta = 0;
        }
      }
    };

    const handleKeyDown = (e) => {
      if (isScrolling) return;
      if (e.key === 'ArrowDown' && currentSection < totalSections - 1) {
        console.log('⬇️ Arrow down pressed, going to section', currentSection + 1);
        setCurrentSection(prev => prev + 1);
      } else if (e.key === 'ArrowUp' && currentSection > 0) {
        console.log('⬆️ Arrow up pressed, going to section', currentSection - 1);
        onGoBack(currentSection, setCurrentSection);
      }
    };

    const handleDragStart = (clientY) => {
      isDragging = true;
      dragStartY = clientY;
    };

    const handleDragMove = (clientY) => {
      if (!isDragging || isScrolling) return;
      
      const deltaY = dragStartY - clientY;
      
      if (Math.abs(deltaY) > 50) {
        if (deltaY > 0 && currentSection < totalSections - 1) {
          console.log('👆 Drag down detected, going to section', currentSection + 1);
          setCurrentSection(prev => prev + 1);
          isDragging = false;
        } else if (deltaY < 0 && currentSection > 0) {
          console.log('👇 Drag up detected, going to section', currentSection - 1);
          onGoBack(currentSection, setCurrentSection);
          isDragging = false;
        }
      }
    };

    const handleTouchStart = (e) => handleDragStart(e.touches[0].clientY);
    const handleTouchMove = (e) => handleDragMove(e.touches[0].clientY);
    const handleTouchEnd = () => isDragging = false;
    const handleMouseDown = (e) => handleDragStart(e.clientY);
    const handleMouseMove = (e) => handleDragMove(e.clientY);
    const handleMouseUp = () => isDragging = false;

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      console.log('🧹 Cleaning up navigation listeners');
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [currentSection, isScrolling, animationPhase, totalSections, onGoBack, setCurrentSection]);

  // Scroll throttling
  useEffect(() => {
    if (animationPhase !== 'completed') return;
    setIsScrolling(true);
    const timeout = setTimeout(() => setIsScrolling(false), 1000);
    return () => clearTimeout(timeout);
  }, [currentSection, animationPhase]);

  // Hook doesn't return anything now - uses passed state setters
};

// ===================================
// NAVBAR CONTROL HOOK
// ===================================

export const useNavbarControl = (currentSection, animationPhase) => {
  const hideNavbar = useCallback(() => {
    window.dispatchEvent(new CustomEvent('projectMH1-navbar-hide'));
  }, []);

  const showNavbar = useCallback(() => {
    window.dispatchEvent(new CustomEvent('projectMH1-navbar-show'));
  }, []);

  useEffect(() => {
    if (currentSection === 0 && animationPhase === 'waiting') {
      showNavbar();
    }
  }, [currentSection, animationPhase, showNavbar]);

  return { hideNavbar, showNavbar };
};

export default {
  useProjectAnimation,
  useProjectNavigation,
  useNavbarControl,
};