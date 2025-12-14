import { useState, useEffect, useRef, useCallback } from 'react';

console.log('🚀 useProjectAnimation module loaded');

// Timeline configuration - Easy to edit!
const ANIMATION_TIMELINE = {
  // Initial sequence (section 0 on load)
  initial: {
    steps: [
      {
        action: 'setBackgroundFade',
        value: 1,
        duration: 0, // Instant
        easing: 'linear',
      },
      {
        action: 'setGradientOpacity',
        value: 1,
        duration: 400, // Wait 400ms before title starts
        easing: 'linear',
      },
      {
        action: 'animateTitle',
        value: 1, // Target opacity
        duration: 2000, // Title fades in over 2 seconds
        easing: 'easeOutCubic',
        callback: () => {
          console.log('✅ Title animation complete, setting phase to waiting');
          return 'SET_PHASE_WAITING';
        },
      },
    ],
  },

  // When returning to hero (from map section)
  returnToHero: {
    steps: [
      {
        action: 'setLocalAnimationPhase',
        value: 'waiting',
        duration: 0,
      },
      {
        action: 'setGradientOpacity',
        value: 1,
        duration: 0,
      },
      {
        action: 'animateBackground',
        value: 1,
        duration: 300, // Fast 300ms fade
        easing: 'linear',
      },
    ],
  },

  // Unlock animation (after dragging)
  unlock: {
    steps: [
      {
        action: 'setTitleOpacity',
        value: 0, // Immediately hide title
        duration: 0,
      },
      {
        action: 'animateUnlock',
        value: 1,
        duration: 1000, // Unlock animation takes 1 second
        easing: 'linear',
        callback: () => 'SET_PHASE_FADEOUT',
      },
    ],
  },

  // Background fade out (after unlock)
  fadeout: {
    steps: [
      {
        action: 'animateBackground',
        value: 0,
        duration: 1000, // Fade out over 1 second
        easing: 'linear',
        callback: () => 'SET_PHASE_COMPLETED',
      },
    ],
  },
};

// Easing functions
const EASING_FUNCTIONS = {
  linear: (t) => t,
  easeOutCubic: (t) => 1 - Math.pow(1 - t, 3),
  easeInOutQuad: (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
  easeOutExpo: (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
};

export const useProjectAnimation = (
  currentSection,
  onAnimationComplete,
  setAnimationPhase
) => {
  console.log('🎬 useProjectAnimation called:', { 
    currentSection, 
    onAnimationComplete: !!onAnimationComplete,
    setAnimationPhase: !!setAnimationPhase 
  });

  const [animationPhase, setLocalAnimationPhase] = useState('initial');
  const [titleOpacity, setTitleOpacity] = useState(0);
  const [unlockProgress, setUnlockProgress] = useState(0);
  const [gradientOpacity, setGradientOpacity] = useState(0);
  const [backgroundFade, setBackgroundFade] = useState(0);

  const scrollAccumulator = useRef(0);
  const touchStartY = useRef(0);
  const isDragging = useRef(false);
  const dragProgressRef = useRef(0);
  const hasInitialized = useRef(false);
  const isReturningToHero = useRef(false);
  const animationTimers = useRef([]);
  const componentMounted = useRef(false);

  // Helper function to clear all animations
  const clearAllAnimations = useCallback(() => {
    console.log('🧹 Clearing all animations');
    animationTimers.current.forEach(timer => {
      if (timer.interval) clearInterval(timer.interval);
      if (timer.timeout) clearTimeout(timer.timeout);
    });
    animationTimers.current = [];
  }, []);

  // Helper function to execute animation steps
  const executeTimeline = useCallback((timelineName, stepCallback) => {
    console.log('📋 Executing timeline:', timelineName);
    clearAllAnimations(); // Clear any existing animations
    
    const timeline = ANIMATION_TIMELINE[timelineName];
    if (!timeline) {
      console.error('❌ Timeline not found:', timelineName);
      return;
    }

    let delayAccumulator = 0;

    timeline.steps.forEach((step, index) => {
      const timerId = setTimeout(() => {
        console.log(`⏱️ Step ${index}: ${step.action} after ${delayAccumulator}ms`);
        
        switch (step.action) {
          case 'setBackgroundFade':
            setBackgroundFade(step.value);
            break;
          
          case 'setGradientOpacity':
            setGradientOpacity(step.value);
            break;
          
          case 'setTitleOpacity':
            setTitleOpacity(step.value);
            break;
          
          case 'setLocalAnimationPhase':
            console.log(`📊 Setting animation phase to: ${step.value}`);
            setLocalAnimationPhase(step.value);
            break;
          
          case 'animateTitle':
            // Animate title opacity gradually
            if (step.duration > 0) {
              let startTime = Date.now();
              const startValue = titleOpacity;
              const endValue = step.value;
              const easing = EASING_FUNCTIONS[step.easing] || EASING_FUNCTIONS.linear;
              
              console.log(`🎨 Animating title from ${startValue} to ${endValue} over ${step.duration}ms`);
              
              const intervalId = setInterval(() => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(1, elapsed / step.duration);
                const easedProgress = easing(progress);
                const currentValue = startValue + (endValue - startValue) * easedProgress;
                
                setTitleOpacity(currentValue);
                
                if (progress >= 1) {
                  console.log('✅ Title animation complete');
                  clearInterval(intervalId);
                  if (step.callback) {
                    const callbackResult = step.callback();
                    if (callbackResult === 'SET_PHASE_WAITING') {
                      console.log('📊 Setting phase to waiting from callback');
                      setLocalAnimationPhase('waiting');
                    }
                  }
                }
              }, 16); // ~60fps
              
              animationTimers.current.push({ interval: intervalId });
            }
            break;
          
          case 'animateBackground':
            // Animate background fade
            if (step.duration > 0) {
              let startTime = Date.now();
              const startValue = backgroundFade;
              const endValue = step.value;
              const easing = EASING_FUNCTIONS[step.easing] || EASING_FUNCTIONS.linear;
              
              console.log(`🎨 Animating background from ${startValue} to ${endValue} over ${step.duration}ms`);
              
              const intervalId = setInterval(() => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(1, elapsed / step.duration);
                const easedProgress = easing(progress);
                const currentValue = startValue + (endValue - startValue) * easedProgress;
                
                setBackgroundFade(currentValue);
                
                if (progress >= 1) {
                  console.log('✅ Background animation complete');
                  clearInterval(intervalId);
                  if (step.callback) {
                    const callbackResult = step.callback();
                    if (callbackResult === 'SET_PHASE_COMPLETED') {
                      console.log('📊 Setting phase to completed from callback');
                      setLocalAnimationPhase('completed');
                    }
                  }
                }
              }, 16);
              
              animationTimers.current.push({ interval: intervalId });
            }
            break;
          
          case 'animateUnlock':
            // Animate unlock progress
            if (step.duration > 0) {
              let startTime = Date.now();
              const startValue = unlockProgress;
              const endValue = step.value;
              const easing = EASING_FUNCTIONS[step.easing] || EASING_FUNCTIONS.linear;
              
              console.log(`🎨 Animating unlock from ${startValue} to ${endValue} over ${step.duration}ms`);
              
              const intervalId = setInterval(() => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(1, elapsed / step.duration);
                const easedProgress = easing(progress);
                const currentValue = startValue + (endValue - startValue) * easedProgress;
                
                setUnlockProgress(currentValue);
                
                if (progress >= 1) {
                  console.log('✅ Unlock animation complete');
                  clearInterval(intervalId);
                  if (step.callback) {
                    const callbackResult = step.callback();
                    if (callbackResult === 'SET_PHASE_FADEOUT') {
                      console.log('📊 Setting phase to fadeout from callback');
                      setLocalAnimationPhase('fadeout');
                    }
                  }
                }
              }, 16);
              
              animationTimers.current.push({ interval: intervalId });
            }
            break;
        }
      }, delayAccumulator);

      animationTimers.current.push({ timeout: timerId });
      delayAccumulator += step.duration || 0;
    });
  }, [titleOpacity, backgroundFade, unlockProgress, clearAllAnimations]);

  // 🔁 Sync animation phase to parent
  useEffect(() => {
    console.log('📤 Syncing animation phase to parent:', animationPhase);
    setAnimationPhase?.(animationPhase);
  }, [animationPhase, setAnimationPhase]);

  // 🎬 Handle animation phases - FIXED VERSION
  useEffect(() => {
    console.log('🎬 Animation effect triggered:', { 
      currentSection, 
      animationPhase,
      hasInitialized: hasInitialized.current,
      isReturningToHero: isReturningToHero.current,
      componentMounted: componentMounted.current
    });

    if (currentSection !== 0) return;

    // Reset states when entering section 0
    setTitleOpacity(0);
    setGradientOpacity(0);
    setBackgroundFade(0);
    setUnlockProgress(0);

    const startAnimation = () => {
      console.log('🚀 Starting animation sequence');
      
      // ALWAYS run initial animation when in section 0 and phase is initial
      if (animationPhase === 'initial') {
        console.log('🎬 Running initial animation');
        executeTimeline('initial');
        hasInitialized.current = true;
      }
      // Only run return animation if specifically flagged
      else if (isReturningToHero.current) {
        console.log('↩️ Returning to hero animation');
        executeTimeline('returnToHero');
        isReturningToHero.current = false;
        hasInitialized.current = true;
      }
      // If we're already waiting, just ensure values are set
      else if (animationPhase === 'waiting') {
        console.log('⏸️ Already in waiting phase, ensuring values');
        // Make sure background and gradient are visible
        setBackgroundFade(1);
        setGradientOpacity(1);
        setTitleOpacity(1);
      }
    };

    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      setTimeout(startAnimation, 100);
    });
  }, [currentSection, animationPhase, executeTimeline]);

  // 👆 Drag interaction
  useEffect(() => {
    if (currentSection !== 0 || animationPhase !== 'waiting') return;

    console.log('👆 Setting up drag interaction');

    const updateDragUI = (progress) => {
      dragProgressRef.current = progress;
      setGradientOpacity(Math.max(0, 1 - progress));
    };

    const resetDrag = () => {
      isDragging.current = false;
      document.body.style.cursor = '';

      const resetInterval = setInterval(() => {
        dragProgressRef.current = Math.max(0, dragProgressRef.current - 0.1);
        updateDragUI(dragProgressRef.current);

        if (dragProgressRef.current <= 0) {
          clearInterval(resetInterval);
          scrollAccumulator.current = 0;
        }
      }, 16);
    };

    const handleStart = (y) => {
      isDragging.current = true;
      touchStartY.current = y;
      document.body.style.cursor = 'grabbing';
    };

    const handleMove = (y) => {
      if (!isDragging.current) return;

      const deltaY = touchStartY.current - y;
      if (deltaY <= 0) return;

      scrollAccumulator.current += deltaY;
      const progress = Math.min(1, scrollAccumulator.current / 300);
      updateDragUI(progress);

      if (progress >= 1) {
        console.log('🔓 Drag complete, unlocking');
        setLocalAnimationPhase('unlocking');
        isDragging.current = false;
        document.body.style.cursor = '';
        scrollAccumulator.current = 0;
      }

      touchStartY.current = y;
    };

    const ts = e => handleStart(e.touches[0].clientY);
    const tm = e => handleMove(e.touches[0].clientY);
    const te = resetDrag;
    const md = e => handleStart(e.clientY);
    const mm = e => handleMove(e.clientY);
    const mu = resetDrag;

    window.addEventListener('touchstart', ts, { passive: true });
    window.addEventListener('touchmove', tm, { passive: true });
    window.addEventListener('touchend', te);
    window.addEventListener('mousedown', md);
    window.addEventListener('mousemove', mm);
    window.addEventListener('mouseup', mu);

    return () => {
      window.removeEventListener('touchstart', ts);
      window.removeEventListener('touchmove', tm);
      window.removeEventListener('touchend', te);
      window.removeEventListener('mousedown', md);
      window.removeEventListener('mousemove', mm);
      window.removeEventListener('mouseup', mu);
      document.body.style.cursor = '';
    };
  }, [animationPhase, currentSection]);

  // 🔓 Handle unlock animation
  useEffect(() => {
    if (currentSection !== 0 || animationPhase !== 'unlocking') return;
    
    console.log('🔓 Starting unlock animation');
    executeTimeline('unlock');
  }, [animationPhase, currentSection, executeTimeline]);

  // 🌅 Handle fadeout animation
  useEffect(() => {
    if (currentSection !== 0 || animationPhase !== 'fadeout') return;
    
    console.log('🌅 Starting fadeout animation');
    executeTimeline('fadeout');
  }, [animationPhase, currentSection, executeTimeline]);

  // 🔄 Handle completed animation phase
  useEffect(() => {
    if (currentSection !== 0 || animationPhase !== 'completed') return;
    
    console.log('✅ Animation completed, notifying parent');
    setTimeout(() => {
      onAnimationComplete?.();
    }, 100);
  }, [animationPhase, currentSection, onAnimationComplete]);

  // 🔄 Reset when returning
  useEffect(() => {
    if (currentSection === 0 && animationPhase === 'completed') {
      console.log('🔄 Resetting animation for return');
      hasInitialized.current = false;
      isReturningToHero.current = false;
      setLocalAnimationPhase('initial');
    }
  }, [currentSection, animationPhase]);

  // Track component mount
  useEffect(() => {
    componentMounted.current = true;
    return () => {
      componentMounted.current = false;
    };
  }, []);

  // 📤 Public method for returning to hero
  const handleReturnToHero = useCallback(() => {
    console.log('🔄 useProjectAnimation: Handling return to hero');
    isReturningToHero.current = true;
    clearAllAnimations();
    setLocalAnimationPhase('initial');
  }, [clearAllAnimations]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('🧹 Cleaning up animation timers');
      clearAllAnimations();
    };
  }, [clearAllAnimations]);

  console.log('📤 useProjectAnimation returning state:', {
    titleOpacity: titleOpacity.toFixed(2),
    unlockProgress: unlockProgress.toFixed(2),
    gradientOpacity: gradientOpacity.toFixed(2),
    backgroundFade: backgroundFade.toFixed(2),
    animationPhase,
  });

  return {
    titleOpacity,
    unlockProgress,
    gradientOpacity,
    backgroundFade,
    dragProgress: dragProgressRef.current,
    animationPhase,
    handleReturnToHero,
  };
};

export default useProjectAnimation;