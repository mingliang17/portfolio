// src/hooks/useProjectAnimation.js
// FIXED: Drag requires 100% completion, proper sensitivity

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * ANIMATION TIMELINE:
 * 1. Background fade (0-500ms)
 * 2. Title animation trigger (500ms) - GSAP handles the animation
 * 3. Waiting for drag (800px total distance)
 * 4. Unlock when reaching 100%
 */
export const useProjectAnimation = (
  currentSection,
  onAnimationComplete,
  setAnimationPhase
) => {
  // ========================================
  // STATE
  // ========================================
  const [titleShouldAnimate, setTitleShouldAnimate] = useState(false);
  const [unlockProgress, setUnlockProgress] = useState(0);
  const [backgroundFade, setBackgroundFade] = useState(0);
  const [animationPhase, setLocalAnimationPhase] = useState('initial');

  // ========================================
  // REFS
  // ========================================
  const scrollAccumulator = useRef(0);
  const touchStartY = useRef(0);
  const isDragging = useRef(false);
  const dragProgressRef = useRef(0);
  const hasInitialized = useRef(false);
  const isReturningToHero = useRef(false);
  const timelineTimeouts = useRef([]);
  const unlockTriggered = useRef(false);

  // FIXED: Extended drag distance for better UX
  const DRAG_DISTANCE = 800; // pixels needed to reach 100%

  // ========================================
  // SYNC
  // ========================================
  useEffect(() => {
    setAnimationPhase?.(animationPhase);
  }, [animationPhase, setAnimationPhase]);

  // ========================================
  // TIMELINE: Main animation sequence
  // ========================================
  useEffect(() => {
    if (currentSection !== 0) return;

    timelineTimeouts.current.forEach(timeout => clearTimeout(timeout));
    timelineTimeouts.current = [];

    console.log('🎬 Starting animation timeline');
    unlockTriggered.current = false;

    // RESET
    setTitleShouldAnimate(false);
    setBackgroundFade(0);
    setUnlockProgress(0);
    dragProgressRef.current = 0;
    scrollAccumulator.current = 0;

    // FAST RETURN
    if (isReturningToHero.current) {
      console.log('🔄 Quick return');
      setLocalAnimationPhase('waiting');
      setBackgroundFade(1);
      setTitleShouldAnimate(true);
      hasInitialized.current = true;
      isReturningToHero.current = false;
      return;
    }

    // STEP 1: Background fade (0ms - 500ms)
    const step1 = setTimeout(() => {
      console.log('📍 Step 1: Background fade');
      let bgFade = 0;
      const bgInterval = setInterval(() => {
        bgFade += 0.04;
        setBackgroundFade(Math.min(1, bgFade));
        if (bgFade >= 1) {
          clearInterval(bgInterval);
          console.log('✅ Background complete');
        }
      }, 20);
    }, 0);

    // STEP 2: Trigger title animation (500ms)
    const step2 = setTimeout(() => {
      console.log('📍 Step 2: Triggering GSAP title animation');
      setTitleShouldAnimate(true);
    }, 500);

    // STEP 3: Ready for interaction (1500ms)
    const step3 = setTimeout(() => {
      console.log('📍 Step 3: Ready for drag interaction');
      setLocalAnimationPhase('waiting');
      hasInitialized.current = true;
    }, 1500);

    timelineTimeouts.current = [step1, step2, step3];

    return () => {
      timelineTimeouts.current.forEach(timeout => clearTimeout(timeout));
      timelineTimeouts.current = [];
    };
  }, [currentSection]);

  // ========================================
  // INTERACTION: Drag-to-unlock (FIXED)
  // ========================================
  useEffect(() => {
    if (currentSection !== 0 || animationPhase !== 'waiting') return;

    console.log('👆 Drag enabled - must reach 100% to unlock');

    const updateDragUI = (progress) => {
      dragProgressRef.current = progress;
    };

    const resetDrag = () => {
      if (!isDragging.current) return;
      
      const currentProgress = dragProgressRef.current;
      console.log('🔙 Drag released at:', (currentProgress * 100).toFixed(1) + '%');
      
      isDragging.current = false;
      document.body.style.cursor = '';

      // FIXED: Only reset if not at 100%
      if (currentProgress < 1.0) {
        console.log('⚠️ Did not reach 100%, resetting...');
        
        // Smooth reset animation
        const resetInterval = setInterval(() => {
          dragProgressRef.current = Math.max(0, dragProgressRef.current - 0.08);
          updateDragUI(dragProgressRef.current);

          if (dragProgressRef.current <= 0) {
            clearInterval(resetInterval);
            scrollAccumulator.current = 0;
            console.log('✅ Reset complete');
          }
        }, 16);
      }
    };

    const handleStart = (y) => {
      console.log('👇 Drag started');
      isDragging.current = true;
      touchStartY.current = y;
      scrollAccumulator.current = dragProgressRef.current * DRAG_DISTANCE; // Resume from current progress
      document.body.style.cursor = 'grabbing';
    };

    const handleMove = (y) => {
      if (!isDragging.current || unlockTriggered.current) return;

      const deltaY = touchStartY.current - y;
      
      // Ignore downward movement
      if (deltaY <= 0) {
        touchStartY.current = y;
        return;
      }

      // FIXED: Reduced sensitivity for more controlled drag
      const dragSensitivity = 0.8; // 80% of actual movement
      const adjustedDelta = deltaY * dragSensitivity;
      
      // Add to accumulator
      scrollAccumulator.current += adjustedDelta;
      
      // Calculate progress (0-1)
      const progress = Math.min(1, scrollAccumulator.current / DRAG_DISTANCE);
      updateDragUI(progress);

      console.log(`📊 Drag: ${(progress * 100).toFixed(1)}%`);

      // FIXED: Trigger unlock ONLY at exactly 100%
      if (progress >= 1.0 && !unlockTriggered.current) {
        console.log('🔓 100% REACHED! Unlocking...');
        unlockTriggered.current = true;
        setLocalAnimationPhase('unlocking');
        isDragging.current = false;
        document.body.style.cursor = '';
        scrollAccumulator.current = DRAG_DISTANCE;
        updateDragUI(1);
        return;
      }

      touchStartY.current = y;
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
      console.log('🧹 Drag listeners cleaned up');
    };
  }, [animationPhase, currentSection]);

  // ========================================
  // UNLOCK ANIMATION
  // ========================================
  useEffect(() => {
    if (currentSection !== 0 || animationPhase !== 'unlocking') return;

    console.log('🔓 Unlock animation starting');
    let progress = 0;
    
    // Hide title during unlock
    setTitleShouldAnimate(false);

    const interval = setInterval(() => {
      progress += 0.02;
      setUnlockProgress(progress);

      if (progress >= 1) {
        clearInterval(interval);
        console.log('✅ Unlock animation complete');
        setLocalAnimationPhase('fadeout');
      }
    }, 20);

    return () => clearInterval(interval);
  }, [animationPhase, currentSection]);

  // ========================================
  // FADEOUT
  // ========================================
  useEffect(() => {
    if (currentSection !== 0 || animationPhase !== 'fadeout') return;

    console.log('🌅 Fadeout starting');
    let fade = 1;

    const interval = setInterval(() => {
      fade -= 0.05;
      setBackgroundFade(Math.max(0, fade));

      if (fade <= 0) {
        clearInterval(interval);
        console.log('✅ Fadeout complete');
        setLocalAnimationPhase('completed');
        setTimeout(() => onAnimationComplete?.(), 100);
      }
    }, 20);

    return () => clearInterval(interval);
  }, [animationPhase, currentSection, onAnimationComplete]);

  // ========================================
  // RESET
  // ========================================
  useEffect(() => {
    if (currentSection === 0 && animationPhase === 'completed') {
      console.log('🔄 Resetting state');
      hasInitialized.current = false;
      isReturningToHero.current = false;
      unlockTriggered.current = false;
      scrollAccumulator.current = 0;
      dragProgressRef.current = 0;
      setLocalAnimationPhase('initial');
    }
  }, [currentSection, animationPhase]);

  // ========================================
  // PUBLIC API
  // ========================================
  const handleReturnToHero = useCallback(() => {
    console.log('🔄 Return to hero');
    isReturningToHero.current = true;
    unlockTriggered.current = false;
    scrollAccumulator.current = 0;
    dragProgressRef.current = 0;
    setLocalAnimationPhase('initial');
  }, []);

  return {
    titleShouldAnimate,  // For GSAP trigger
    unlockProgress,
    backgroundFade,
    dragProgress: dragProgressRef.current,
    animationPhase,
    handleReturnToHero,
  };
};

export default useProjectAnimation;