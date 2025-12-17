// src/hooks/useProjectAnimation.js
// Refactored to use a single timeline-based animation system
// This eliminates redundant useEffects and makes the flow crystal clear

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Timeline-based animation hook for project hero section
 * 
 * ANIMATION TIMELINE:
 * 1. Initial:   Section loads → Start background fade
 * 2. Background: Fade in background (0→1) over 500ms
 * 3. Gradient:   Fade in gradient overlay (0→1) over 400ms
 * 4. Title:      Fade in title (0→1) over 800ms
 * 5. Waiting:    User can now drag to unlock
 * 6. Unlocking:  Pulse animation while dragging completes
 * 7. Fadeout:    Everything fades out (1→0) over 400ms
 * 8. Completed:  Trigger section transition callback
 */
export const useProjectAnimation = (
  currentSection,
  onAnimationComplete,
  setAnimationPhase
) => {
  // ========================================
  // STATE: Animation values
  // ========================================
  const [titleOpacity, setTitleOpacity] = useState(0);
  const [unlockProgress, setUnlockProgress] = useState(0);
  const [gradientOpacity, setGradientOpacity] = useState(0);
  const [backgroundFade, setBackgroundFade] = useState(0);
  const [animationPhase, setLocalAnimationPhase] = useState('initial');

  // ========================================
  // REFS: Persistent values across renders
  // ========================================
  const scrollAccumulator = useRef(0);      // Tracks cumulative drag distance
  const touchStartY = useRef(0);            // Starting Y position for drag
  const isDragging = useRef(false);         // Is user currently dragging?
  const dragProgressRef = useRef(0);        // Current drag progress (0-1)
  const hasInitialized = useRef(false);     // Has initial animation run?
  const isReturningToHero = useRef(false);  // Is this a return from another section?
  const timelineTimeouts = useRef([]);      // Array to store all timeline timeouts for cleanup
  const unlockTriggered = useRef(false);    // Prevent multiple unlock triggers

  // ========================================
  // SYNC: Keep parent informed of phase changes
  // ========================================
  useEffect(() => {
    setAnimationPhase?.(animationPhase);
  }, [animationPhase, setAnimationPhase]);

  // ========================================
  // TIMELINE: Main animation sequence
  // This runs when entering section 0 (hero)
  // ========================================
  useEffect(() => {
    // Only run on section 0 (hero section)
    if (currentSection !== 0) return;

    // Clear any existing timeline timeouts
    timelineTimeouts.current.forEach(timeout => clearTimeout(timeout));
    timelineTimeouts.current = [];

    console.log('🎬 Starting hero animation timeline');
    
    // Reset unlock trigger flag
    unlockTriggered.current = false;

    // RESET: Clear all animation values
    setTitleOpacity(0);
    setGradientOpacity(0);
    setBackgroundFade(0);
    setUnlockProgress(0);
    dragProgressRef.current = 0;
    scrollAccumulator.current = 0;

    // CHECK: Fast return animation if coming back from another section
    if (isReturningToHero.current) {
      console.log('🔄 Quick return animation');
      
      // Skip to end state immediately
      setLocalAnimationPhase('waiting');
      setBackgroundFade(1);
      setGradientOpacity(1);
      setTitleOpacity(1);
      
      hasInitialized.current = true;
      isReturningToHero.current = false;
      return;
    }

    // TIMELINE STEP 1: Background fade in (0ms - 500ms)
    const step1 = setTimeout(() => {
      console.log('📍 Timeline Step 1: Background fade in');
      
      let bgFade = 0;
      const bgInterval = setInterval(() => {
        bgFade += 0.04; // Increment by 4% per frame (25 frames = 1.0)
        setBackgroundFade(Math.min(1, bgFade));
        
        if (bgFade >= 1) {
          clearInterval(bgInterval);
          console.log('✅ Background fade complete');
        }
      }, 20); // 20ms = ~50fps
    }, 0);

    // TIMELINE STEP 2: Gradient overlay fade in (500ms - 900ms)
    const step2 = setTimeout(() => {
      console.log('📍 Timeline Step 2: Gradient fade in');
      
      let gradFade = 0;
      const gradInterval = setInterval(() => {
        gradFade += 0.05; // Increment by 5% per frame (20 frames = 1.0)
        setGradientOpacity(Math.min(1, gradFade));
        
        if (gradFade >= 1) {
          clearInterval(gradInterval);
          console.log('✅ Gradient fade complete');
        }
      }, 20);
    }, 500);

    // TIMELINE STEP 3: Title fade in (900ms - 1700ms)
    const step3 = setTimeout(() => {
      console.log('📍 Timeline Step 3: Title fade in');
      
      let titleFade = 0;
      const titleInterval = setInterval(() => {
        titleFade += 0.025; // Slower fade for title (40 frames = 1.0)
        setTitleOpacity(Math.min(1, titleFade));
        
        if (titleFade >= 1) {
          clearInterval(titleInterval);
          console.log('✅ Title fade complete');
        }
      }, 20);
    }, 900);

    // TIMELINE STEP 4: Ready for interaction (1700ms)
    const step4 = setTimeout(() => {
      console.log('📍 Timeline Step 4: Waiting for user interaction');
      setLocalAnimationPhase('waiting');
      hasInitialized.current = true;
    }, 1700);

    // Store timeouts for cleanup
    timelineTimeouts.current = [step1, step2, step3, step4];

    // CLEANUP: Clear all timeouts when component unmounts or dependencies change
    return () => {
      timelineTimeouts.current.forEach(timeout => clearTimeout(timeout));
      timelineTimeouts.current = [];
    };
  }, [currentSection]); // Only re-run when section changes

  // ========================================
  // INTERACTION: Drag-to-unlock functionality
  // Only active when phase is 'waiting'
  // ========================================
  useEffect(() => {
    // Only allow dragging on section 0 in waiting phase
    if (currentSection !== 0 || animationPhase !== 'waiting') return;

    console.log('👆 Drag interaction enabled');

    /**
     * Updates UI based on drag progress
     * As user drags, gradient fades out to reveal background
     */
    const updateDragUI = (progress) => {
      dragProgressRef.current = progress;
      // Inverse relationship: more drag = less gradient
      setGradientOpacity(Math.max(0, 1 - progress));
    };

    /**
     * Resets drag progress when user releases
     * Smoothly animates back to initial state
     */
    const resetDrag = () => {
      if (!isDragging.current) return;
      
      console.log('🔙 Resetting drag, progress was:', dragProgressRef.current.toFixed(2));
      isDragging.current = false;
      document.body.style.cursor = '';

      // Only reset if we didn't reach unlock threshold
      if (dragProgressRef.current < 0.95) {
        // Animate back to 0
        const resetInterval = setInterval(() => {
          dragProgressRef.current = Math.max(0, dragProgressRef.current - 0.1);
          updateDragUI(dragProgressRef.current);

          if (dragProgressRef.current <= 0) {
            clearInterval(resetInterval);
            scrollAccumulator.current = 0;
            console.log('✅ Drag reset complete');
          }
        }, 16); // ~60fps
      }
    };

    /**
     * Starts drag tracking
     */
    const handleStart = (y) => {
      console.log('👇 Drag start');
      isDragging.current = true;
      touchStartY.current = y;
      scrollAccumulator.current = 0;
      document.body.style.cursor = 'grabbing';
    };

    /**
     * Handles drag movement
     * Accumulates vertical distance and converts to progress (0-1)
     */
    const handleMove = (y) => {
      if (!isDragging.current || unlockTriggered.current) return;

      const deltaY = touchStartY.current - y;
      
      // Only track downward drags (positive deltaY)
      if (deltaY <= 0) {
        // Reset start position if moving up
        touchStartY.current = y;
        return;
      }

      // Accumulate drag distance with a small max per frame to prevent jumps
      const maxDeltaPerFrame = 30; // Prevent huge jumps from fast swipes
      const clampedDelta = Math.min(deltaY, maxDeltaPerFrame);
      scrollAccumulator.current += clampedDelta;
      
      // Convert to 0-1 progress (300px = full unlock)
      const progress = Math.min(1, scrollAccumulator.current / 300);
      updateDragUI(progress);

      console.log('📏 Drag progress:', {
        progress: progress.toFixed(3),
        accumulator: scrollAccumulator.current.toFixed(0),
        delta: deltaY.toFixed(0),
        clampedDelta: clampedDelta.toFixed(0)
      });

      // UNLOCK: If progress reaches 100%, trigger unlock animation
      // Use strict threshold to ensure full completion
      if (progress >= 0.95 && !unlockTriggered.current) {
        console.log('🔓 Unlock threshold reached at', progress.toFixed(2), '%');
        unlockTriggered.current = true;
        setLocalAnimationPhase('unlocking');
        isDragging.current = false;
        document.body.style.cursor = '';
        scrollAccumulator.current = 300; // Force to max
        updateDragUI(1); // Ensure UI shows 100%
        
        // Prevent further processing
        return;
      }

      touchStartY.current = y;
    };

    // Touch event handlers
    const handleTouchStart = (e) => handleStart(e.touches[0].clientY);
    const handleTouchMove = (e) => handleMove(e.touches[0].clientY);
    const handleTouchEnd = resetDrag;

    // Mouse event handlers
    const handleMouseDown = (e) => handleStart(e.clientY);
    const handleMouseMove = (e) => handleMove(e.clientY);
    const handleMouseUp = resetDrag;

    // Register event listeners
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    // CLEANUP: Remove all event listeners
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
  // UNLOCK ANIMATION: Pulsing circle effect
  // Runs when user completes drag gesture
  // ========================================
  useEffect(() => {
    if (currentSection !== 0 || animationPhase !== 'unlocking') return;

    console.log('🔓 Starting unlock animation');

    let progress = 0;
    
    // Immediately fade out title for clean transition
    setTitleOpacity(0);

    // Pulse animation for unlock progress
    const interval = setInterval(() => {
      progress += 0.02; // 2% per frame
      setUnlockProgress(progress);

      if (progress >= 1) {
        clearInterval(interval);
        console.log('✅ Unlock animation complete, starting fadeout');
        setLocalAnimationPhase('fadeout');
      }
    }, 20);

    return () => clearInterval(interval);
  }, [animationPhase, currentSection]);

  // ========================================
  // FADEOUT: Everything fades to black
  // Prepares for transition to next section
  // ========================================
  useEffect(() => {
    if (currentSection !== 0 || animationPhase !== 'fadeout') return;

    console.log('🌅 Starting fadeout animation');

    let fade = 1;
    const interval = setInterval(() => {
      fade -= 0.05; // 5% per frame
      setBackgroundFade(Math.max(0, fade));

      if (fade <= 0) {
        clearInterval(interval);
        console.log('✅ Fadeout complete, transitioning to next section');
        setLocalAnimationPhase('completed');

        // Trigger parent callback after brief delay
        setTimeout(() => {
          onAnimationComplete?.();
        }, 100);
      }
    }, 20);

    return () => clearInterval(interval);
  }, [animationPhase, currentSection, onAnimationComplete]);

  // ========================================
  // RESET: When returning to section 0
  // Ensures clean state for next animation
  // ========================================
  useEffect(() => {
    if (currentSection === 0 && animationPhase === 'completed') {
      console.log('🔄 Resetting animation state');
      hasInitialized.current = false;
      isReturningToHero.current = false;
      unlockTriggered.current = false;
      scrollAccumulator.current = 0;
      dragProgressRef.current = 0;
      setLocalAnimationPhase('initial');
    }
  }, [currentSection, animationPhase]);

  // ========================================
  // PUBLIC API: Return to hero section
  // Called when user navigates back from other sections
  // ========================================
  const handleReturnToHero = useCallback(() => {
    console.log('🔄 Handling return to hero');
    isReturningToHero.current = true;
    unlockTriggered.current = false;
    scrollAccumulator.current = 0;
    dragProgressRef.current = 0;
    setLocalAnimationPhase('initial');
  }, []);

  // ========================================
  // RETURN: All animation values and controls
  // ========================================
  return {
    titleOpacity,           // 0-1: Title transparency
    unlockProgress,         // 0-1: Unlock pulse animation progress
    gradientOpacity,        // 0-1: Gradient overlay transparency
    backgroundFade,         // 0-1: Background image transparency
    dragProgress: dragProgressRef.current, // 0-1: Current drag progress
    animationPhase,         // Current phase string
    handleReturnToHero,     // Function to trigger return animation
  };
};

export default useProjectAnimation;