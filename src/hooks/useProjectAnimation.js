// src/hooks/useProjectAnimation.js
import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook to manage project animation phases and drag interactions
 * Consolidates all animation logic from ProjectMH1
 */
export const useProjectAnimation = (currentSection) => {
  const [animationPhase, setAnimationPhase] = useState('initial');
  const [titleOpacity, setTitleOpacity] = useState(0);
  const [unlockProgress, setUnlockProgress] = useState(0);
  const [gradientOpacity, setGradientOpacity] = useState(0);
  const [backgroundFade, setBackgroundFade] = useState(0);
  
  const scrollAccumulator = useRef(0);
  const touchStartY = useRef(0);
  const isDragging = useRef(false);
  const dragProgressRef = useRef(0);

  // === ANIMATION SEQUENCE (Section 0 only) ===
  useEffect(() => {
    if (currentSection !== 0) return;
    
    const runSequence = async () => {
      // Reset states
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
      setTimeout(() => setAnimationPhase('waiting'), 1000);
    };
    
    runSequence();
  }, [currentSection]);

  // === DRAG INTERACTION (Waiting phase only) ===
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
          setAnimationPhase('unlocking');
          scrollAccumulator.current = 0;
          isDragging.current = false;
          document.body.style.cursor = '';
        }
        
        touchStartY.current = clientY;
      }
    };

    // Event handlers
    const handleTouchStart = (e) => handleStart(e.touches[0].clientY);
    const handleTouchMove = (e) => handleMove(e.touches[0].clientY);
    const handleTouchEnd = resetDrag;
    const handleMouseDown = (e) => handleStart(e.clientY);
    const handleMouseMove = (e) => handleMove(e.clientY);
    const handleMouseUp = resetDrag;

    // Attach listeners
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

  // === UNLOCK ANIMATION ===
  useEffect(() => {
    if (currentSection !== 0 || animationPhase !== 'unlocking') return;

    let progress = 0;
    const unlockInterval = setInterval(() => {
      progress += 0.02;
      setUnlockProgress(progress);
      setTitleOpacity(Math.max(0, 1 - progress * 2));
      
      if (progress >= 1) {
        clearInterval(unlockInterval);
        setAnimationPhase('fadeout');
      }
    }, 20);

    return () => clearInterval(unlockInterval);
  }, [animationPhase, currentSection]);

  // === FADEOUT ANIMATION ===
  useEffect(() => {
    if (currentSection !== 0 || animationPhase !== 'fadeout') return;

    let fadeProgress = 0;
    const fadeInterval = setInterval(() => {
      fadeProgress += 0.05;
      setBackgroundFade(Math.max(0, 1 - fadeProgress));
      
      if (fadeProgress >= 1) {
        clearInterval(fadeInterval);
        setAnimationPhase('completed');
      }
    }, 20);

    return () => clearInterval(fadeInterval);
  }, [animationPhase, currentSection]);

  return {
    animationPhase,
    titleOpacity,
    unlockProgress,
    gradientOpacity,
    backgroundFade,
    dragProgressRef,
    setAnimationPhase,
    setTitleOpacity,
    setGradientOpacity,
    setBackgroundFade,
    setUnlockProgress,
    scrollAccumulator,
    dragProgressRef
  };
};

/**
 * Custom hook to manage section navigation
 */
export const useSectionNavigation = (totalSections, animationPhase, onGoBack) => {
  const [currentSection, setCurrentSection] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);

  useEffect(() => {
    if (animationPhase !== 'completed') return;

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
          setCurrentSection(prev => prev + 1);
          accumulatedDelta = 0;
        } else if (accumulatedDelta < 0 && currentSection > 0) {
          onGoBack(currentSection, setCurrentSection);
          accumulatedDelta = 0;
        }
      }
    };

    const handleKeyDown = (e) => {
      if (isScrolling) return;
      if (e.key === 'ArrowDown' && currentSection < totalSections - 1) {
        setCurrentSection(prev => prev + 1);
      } else if (e.key === 'ArrowUp' && currentSection > 0) {
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
          setCurrentSection(prev => prev + 1);
          isDragging = false;
        } else if (deltaY < 0 && currentSection > 0) {
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
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [currentSection, isScrolling, animationPhase, totalSections, onGoBack]);

  useEffect(() => {
    if (animationPhase !== 'completed') return;
    setIsScrolling(true);
    const timeout = setTimeout(() => setIsScrolling(false), 1000);
    return () => clearTimeout(timeout);
  }, [currentSection, animationPhase]);

  return { currentSection, setCurrentSection, isScrolling };
};

/**
 * Custom hook for navbar visibility control
 */
export const useNavbarControl = (currentSection, animationPhase) => {
  const hideNavbar = () => window.dispatchEvent(new CustomEvent('projectMH1-navbar-hide'));
  const showNavbar = () => window.dispatchEvent(new CustomEvent('projectMH1-navbar-show'));

  useEffect(() => {
    if (currentSection === 0 && animationPhase === 'waiting') {
      showNavbar();
    }
  }, [currentSection, animationPhase]);

  return { hideNavbar, showNavbar };
};