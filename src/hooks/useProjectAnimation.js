// src/hooks/useProjectAnimation.js
// FIXED VERSION: Proper drag tracking with accumulated distance

import { useState, useEffect, useRef, useCallback } from 'react';

export const useProjectAnimation = (
  currentSection,
  onAnimationComplete,
  setAnimationPhase
) => {
  // ========================================
  // STATE
  // ========================================
  const [backgroundShouldAnimate, setBackgroundShouldAnimate] = useState(false);
  const [titleShouldAnimate, setTitleShouldAnimate] = useState(false);
  const [unlockProgress, setUnlockProgress] = useState(0);
  const [animationPhase, setLocalAnimationPhase] = useState('initial');
  const [showDragInstruction, setShowDragInstruction] = useState(false);

  // ========================================
  // REFS
  // ========================================
  const dragStartY = useRef(0);
  const lastDragY = useRef(0);
  const currentDragDistance = useRef(0);
  const isDragging = useRef(false);
  const dragProgressRef = useRef(0);
  const hasInitialized = useRef(false);
  const isReturningToHero = useRef(false);
  const timelineTimeouts = useRef([]);
  const unlockTriggered = useRef(false);
  const dragAnimationFrame = useRef(null);

  // DRAG SETTINGS
  const DRAG_DISTANCE_REQUIRED = 800; // Total pixels needed

  // ========================================
  // SYNC
  // ========================================
  useEffect(() => {
    setAnimationPhase?.(animationPhase);
  }, [animationPhase, setAnimationPhase]);

  // ========================================
  // TIMELINE
  // ========================================
  useEffect(() => {
    if (currentSection !== 0) return;

    timelineTimeouts.current.forEach(timeout => clearTimeout(timeout));
    timelineTimeouts.current = [];

    console.log('🎬 Starting animation timeline');
    unlockTriggered.current = false;

    // RESET
    setBackgroundShouldAnimate(false);
    setTitleShouldAnimate(false);
    setUnlockProgress(0);
    dragProgressRef.current = 0;
    currentDragDistance.current = 0;
    lastDragY.current = 0;

    // FAST RETURN
    if (isReturningToHero.current) {
      console.log('🔄 Quick return');
      setLocalAnimationPhase('waiting');
      setBackgroundShouldAnimate(true);
      setTitleShouldAnimate(true);
      hasInitialized.current = true;
      isReturningToHero.current = false;
      return;
    }

    // STEP 1: Trigger background + gradient animation (0ms)
    const step1 = setTimeout(() => {
      console.log('📍 Step 1: Triggering background + gradient GSAP animation');
      setBackgroundShouldAnimate(true);
    }, 0);

    // STEP 2: Trigger title animation (500ms)
    const step2 = setTimeout(() => {
      console.log('📍 Step 2: Triggering title GSAP animation');
      setTitleShouldAnimate(true);
    }, 500);

    // STEP 3: Ready for interaction (1500ms)
    const step3 = setTimeout(() => {
      console.log('📍 Step 3: Ready for drag interaction');
      setLocalAnimationPhase('waiting');
      hasInitialized.current = true;
      
      // Show drag instruction after a short delay
      setTimeout(() => {
        setShowDragInstruction(true);
      }, 1000);
    }, 1500);

    timelineTimeouts.current = [step1, step2, step3];

    return () => {
      timelineTimeouts.current.forEach(timeout => clearTimeout(timeout));
      timelineTimeouts.current = [];
      if (dragAnimationFrame.current) {
        cancelAnimationFrame(dragAnimationFrame.current);
      }
    };
  }, [currentSection]);

  // ========================================
  // DRAG INTERACTION - FIXED
  // ========================================
  useEffect(() => {
    if (currentSection !== 0 || animationPhase !== 'waiting') {
      setShowDragInstruction(false);
      return;
    }

    console.log('👆 Drag system enabled - Must drag full 800px');

    // Update UI with current progress
    const updateProgress = () => {
      const progress = Math.min(1, currentDragDistance.current / DRAG_DISTANCE_REQUIRED);
      dragProgressRef.current = progress;
      setShowDragInstruction(progress < 0.1); // Hide instruction once user starts dragging
      
      // Check for unlock
      if (progress >= 1 && !unlockTriggered.current) {
        console.log('🔓 100% REACHED - Unlocking!');
        unlockTriggered.current = true;
        isDragging.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        setLocalAnimationPhase('unlocking');
      }
    };

    // Mouse/Touch Start
    const handleDragStart = (clientY) => {
      if (unlockTriggered.current) return;
      
      console.log('👇 Drag started at:', clientY);
      isDragging.current = true;
      dragStartY.current = clientY;
      lastDragY.current = clientY;
      currentDragDistance.current = 0; // Reset distance for this drag session
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
    };

    // Mouse/Touch Move
    const handleDragMove = (clientY) => {
      if (!isDragging.current || unlockTriggered.current) return;

      // Calculate movement since last frame
      const deltaY = lastDragY.current - clientY;
      
      // Only accumulate upward movement
      if (deltaY > 0) {
        currentDragDistance.current += deltaY;
        updateProgress();
        
        const progress = Math.min(100, (currentDragDistance.current / DRAG_DISTANCE_REQUIRED) * 100);
        
        // Log every 10%
        if (Math.floor(progress / 10) > Math.floor((progress - 1) / 10)) {
          console.log(`📊 Dragging: ${Math.floor(progress / 10) * 10}% (${currentDragDistance.current.toFixed(0)}px)`);
        }
      }
      
      // Update last position
      lastDragY.current = clientY;
    };

    // Mouse/Touch End
    const handleDragEnd = () => {
      if (!isDragging.current) return;
      
      const finalProgress = (currentDragDistance.current / DRAG_DISTANCE_REQUIRED) * 100;
      console.log('🔚 Drag ended at:', finalProgress.toFixed(1) + '%', `(${currentDragDistance.current.toFixed(0)}px)`);
      
      isDragging.current = false;
      lastDragY.current = 0;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';

      // If didn't reach 100%, reset with animation
      if (currentDragDistance.current < DRAG_DISTANCE_REQUIRED) {
        console.log('⚠️ Did not reach 100% - Resetting...');
        
        const startDistance = currentDragDistance.current;
        const resetDuration = 300;
        const startTime = Date.now();
        
        const resetAnimation = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(1, elapsed / resetDuration);
          const easeProgress = 1 - Math.pow(1 - progress, 3);
          
          currentDragDistance.current = startDistance * (1 - easeProgress);
          updateProgress();
          
          if (progress < 1) {
            dragAnimationFrame.current = requestAnimationFrame(resetAnimation);
          } else {
            currentDragDistance.current = 0;
            dragProgressRef.current = 0;
            console.log('✅ Reset complete');
            setShowDragInstruction(true);
          }
        };
        
        dragAnimationFrame.current = requestAnimationFrame(resetAnimation);
      }
    };

    // Event handlers
    const onMouseDown = (e) => {
      if (e.target.closest('button') || e.target.closest('a')) return;
      handleDragStart(e.clientY);
    };
    
    const onMouseMove = (e) => {
      if (!isDragging.current) return;
      dragAnimationFrame.current = requestAnimationFrame(() => handleDragMove(e.clientY));
    };
    
    const onMouseUp = () => handleDragEnd();
    
    const onTouchStart = (e) => {
      if (e.target.closest('button') || e.target.closest('a')) return;
      e.preventDefault();
      handleDragStart(e.touches[0].clientY);
    };
    
    const onTouchMove = (e) => {
      if (!isDragging.current) return;
      e.preventDefault();
      dragAnimationFrame.current = requestAnimationFrame(() => handleDragMove(e.touches[0].clientY));
    };
    
    const onTouchEnd = (e) => {
      if (!isDragging.current) return;
      e.preventDefault();
      handleDragEnd();
    };

    // Add listeners
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchstart', onTouchStart, { passive: false });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);

    return () => {
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      if (dragAnimationFrame.current) {
        cancelAnimationFrame(dragAnimationFrame.current);
      }
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
    
    setTitleShouldAnimate(false);
    setBackgroundShouldAnimate(false);
    setShowDragInstruction(false);

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
    
    // Immediate fadeout
    setTimeout(() => {
      console.log('✅ Fadeout complete');
      setLocalAnimationPhase('completed');
      setTimeout(() => onAnimationComplete?.(), 100);
    }, 400);

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
      currentDragDistance.current = 0;
      dragProgressRef.current = 0;
      lastDragY.current = 0;
      setShowDragInstruction(false);
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
    currentDragDistance.current = 0;
    dragProgressRef.current = 0;
    lastDragY.current = 0;
    setShowDragInstruction(false);
    setLocalAnimationPhase('initial');
  }, []);

  return {
    backgroundShouldAnimate,
    titleShouldAnimate,
    unlockProgress,
    dragProgress: dragProgressRef.current,
    animationPhase,
    showDragInstruction,
    handleReturnToHero,
  };
};

export default useProjectAnimation;