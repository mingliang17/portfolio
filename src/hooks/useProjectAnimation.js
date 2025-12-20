// src/hooks/useProjectAnimation.js
import { useState, useEffect, useRef, useCallback } from 'react';
import gsap from 'gsap';

export const useProjectAnimation = (
  currentSection,
  onAnimationComplete
) => {
  console.log(`🔄 useProjectAnimation: currentSection=${currentSection}`);
  
  // State
  const [animationStatus, setAnimationStatus] = useState('idle');
  const [gradientOpacity, setGradientOpacity] = useState(1);
  const [bgOpacity, setBgOpacity] = useState(0);
  const [bgScale, setBgScale] = useState(1.1);
  const [titleOpacity, setTitleOpacity] = useState(0);
  const [titleY, setTitleY] = useState(30);
  const [subtitleOpacity, setSubtitleOpacity] = useState(0);
  const [subtitleY, setSubtitleY] = useState(30);
  const [dragComponentOpacity, setDragComponentOpacity] = useState(0);
  const [dragProgress, setDragProgress] = useState(0);
  const [isHeroUnlocked, setIsHeroUnlocked] = useState(false);

  // Refs
  const timeline = useRef(null);
  const dragStartY = useRef(0);
  const accumulatedDistance = useRef(0);
  const isDragging = useRef(false);
  const heroSectionRef = useRef(null);
  const eventListenersAdded = useRef(false);
  
  // Animation targets
  const animationTargets = useRef({
    bgOpacity: { current: 0 },
    bgScale: { current: 1.1 },
    titleOpacity: { current: 0 },
    titleY: { current: 30 },
    subtitleOpacity: { current: 0 },
    subtitleY: { current: 30 },
    dragComponentOpacity: { current: 0 }
  });

  // Constants
  const DRAG_DISTANCE_REQUIRED = 300;

  // Create animation timeline
  const createTimeline = useCallback(() => {
    console.log('📅 Creating timeline');
    
    if (timeline.current) {
      timeline.current.kill();
    }

    // Reset all values
    setGradientOpacity(1);
    setBgOpacity(0);
    setBgScale(1.1);
    setTitleOpacity(0);
    setTitleY(30);
    setSubtitleOpacity(0);
    setSubtitleY(30);
    setDragComponentOpacity(0);
    setDragProgress(0);
    setIsHeroUnlocked(false);
    accumulatedDistance.current = 0;
    isDragging.current = false;
    
    // Reset refs for GSAP
    animationTargets.current.bgOpacity.current = 0;
    animationTargets.current.bgScale.current = 1.1;
    animationTargets.current.titleOpacity.current = 0;
    animationTargets.current.titleY.current = 30;
    animationTargets.current.subtitleOpacity.current = 0;
    animationTargets.current.subtitleY.current = 30;
    animationTargets.current.dragComponentOpacity.current = 0;
    
    // Create timeline
    timeline.current = gsap.timeline({
      onStart: () => {
        console.log('▶️ Timeline started');
        setAnimationStatus('running');
      },
      onComplete: () => {
        console.log('✅ Timeline complete, showing drag instruction');
        setAnimationStatus('complete');
      }
    });

    // 1. Background fade + scale (0ms - 1200ms)
    timeline.current.to(animationTargets.current.bgOpacity, {
      current: 1,
      duration: 1.2,
      ease: 'power2.out',
      onUpdate: () => setBgOpacity(animationTargets.current.bgOpacity.current)
    }, 0);

    timeline.current.to(animationTargets.current.bgScale, {
      current: 1,
      duration: 1.2,
      ease: 'power3.out',
      onUpdate: () => setBgScale(animationTargets.current.bgScale.current)
    }, 0);

    // 2. Title + subtitle (800ms - 1600ms)
    timeline.current.to(
    {
      titleOpacity: animationTargets.current.titleOpacity.current,
      titleY: animationTargets.current.titleY.current,
    },
    {
      titleOpacity: 1,
      titleY: 0,
      duration: 0.8,
      ease: 'power3.out',
      delay: 0.8,
      onUpdate: function () {
        setTitleOpacity(this.targets()[0].titleOpacity);
        setTitleY(this.targets()[0].titleY);
      }
    });

    timeline.current.to(
    {
      subtitleOpacity: animationTargets.current.subtitleOpacity.current,
      subtitleY: animationTargets.current.subtitleY.current
    },
    {
      subtitleOpacity: 1,
      subtitleY: 0,
      duration: 0.8,
      ease: 'power3.out',
      delay: 0.8,
      onUpdate: function () {
        setSubtitleOpacity(this.targets()[0].subtitleOpacity);
        setSubtitleY(this.targets()[0].subtitleY);
      }
    });

    // 3. Drag component (1600ms - 2000ms)
    timeline.current.to(animationTargets.current.dragComponentOpacity, {
      current: 1,
      duration: 0.6,
      ease: 'power2.out',
      delay: 0.8,
      onUpdate: () => setDragComponentOpacity(animationTargets.current.dragComponentOpacity.current)
    });

    return timeline.current;
  }, []);

  // Initialize animations when on section 0
  useEffect(() => {
    console.log(`🎬 Animation init check: currentSection=${currentSection}, isHeroUnlocked=${isHeroUnlocked}`);
    
    if (currentSection === 0 && !isHeroUnlocked) {
      console.log('🎬 Initializing hero animations');
      setAnimationStatus('idle');
      setDragProgress(0);
      accumulatedDistance.current = 0;
      setGradientOpacity(1);
      isDragging.current = false;
      
      // Start timeline
      const timer = setTimeout(() => {
        createTimeline();
      }, 100);
      
      return () => {
        clearTimeout(timer);
        if (timeline.current) {
          timeline.current.kill();
        }
      };
    }
  }, [currentSection, isHeroUnlocked, createTimeline]);

  // Setup event listeners for drag
  const setupDragListeners = useCallback(() => {
    if (!heroSectionRef.current || eventListenersAdded.current) return;
    
    console.log('🔧 Setting up drag listeners on hero section');
    
    const element = heroSectionRef.current;
    
    const handleStart = (clientY) => {
      console.log('👇 Drag STARTED', { clientY });
      
      if (isHeroUnlocked) {
        console.log('🚫 Already unlocked, ignoring drag');
        return;
      }
      
      isDragging.current = true;
      dragStartY.current = clientY;
      accumulatedDistance.current = 0;
      
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
      document.body.style.touchAction = 'none';
    };

    const handleMove = (clientY) => {
      if (!isDragging.current || isHeroUnlocked) {
        return;
      }
      
      const deltaY = dragStartY.current - clientY;
      
      // Only register upward drag
      if (deltaY > 0) {
        accumulatedDistance.current = deltaY;
        const progress = Math.min(1, accumulatedDistance.current / DRAG_DISTANCE_REQUIRED);
        
        // Update every 20px
        if (Math.floor(accumulatedDistance.current) % 20 === 0) {
          console.log(`📏 Drag: ${Math.round(progress * 100)}% (${Math.round(deltaY)}px / ${DRAG_DISTANCE_REQUIRED}px)`);
        }
        
        setDragProgress(progress);
        setGradientOpacity(1 - progress);
        
        // Check for unlock
        if (progress >= 0.95 && !isHeroUnlocked) {
          console.log('🔓 REACHED 95% - UNLOCKING!');
          setIsHeroUnlocked(true);
          isDragging.current = false;
          
          // Animate to 100%
          gsap.to({}, {
            duration: 0.3,
            ease: 'power2.out',
            onUpdate: function() {
              const finalProgress = progress + (0.05 * this.progress());
              setDragProgress(finalProgress);
              setGradientOpacity(1 - finalProgress);
            },
            onComplete: () => {
              console.log('✅ Unlock complete, calling onAnimationComplete');
              onAnimationComplete?.();
            }
          });
        }
      }
    };

    const handleEnd = () => {
      if (!isDragging.current) return;
      
      console.log(`🔚 Drag ENDED at ${Math.round(dragProgress * 100)}% progress (${Math.round(accumulatedDistance.current)}px)`);
      
      isDragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.body.style.touchAction = '';
      
      // Reset if not completed
      if (dragProgress < 0.8 && !isHeroUnlocked) {
        console.log('🔄 Resetting drag - not enough progress');
        
        // Animate back to initial state
        gsap.to({}, {
          duration: 0.5,
          ease: 'power2.out',
          onUpdate: function() {
            const progress = dragProgress * (1 - this.progress());
            setDragProgress(progress);
            setGradientOpacity(1 - progress);
          },
          onComplete: () => {
            setDragProgress(0);
            setGradientOpacity(1);
            accumulatedDistance.current = 0;
          }
        });
      } else if (dragProgress >= 0.8 && !isHeroUnlocked) {
        // Complete if close enough
        console.log('✅ Close enough to 100%, completing');
        setIsHeroUnlocked(true);
        
        // Animate to 100%
        gsap.to({}, {
          duration: 0.3,
          ease: 'power2.out',
          onUpdate: function() {
            const finalProgress = dragProgress + ((1 - dragProgress) * this.progress());
            setDragProgress(finalProgress);
            setGradientOpacity(1 - finalProgress);
          },
          onComplete: () => {
            setTimeout(() => {
              onAnimationComplete?.();
            }, 100);
          }
        });
      }
    };

    // Mouse event handlers
    const onMouseDown = (e) => {
      e.preventDefault();
      e.stopPropagation();
      handleStart(e.clientY);
    };

    const onMouseMove = (e) => {
      if (!isDragging.current) return;
      e.preventDefault();
      e.stopPropagation();
      handleMove(e.clientY);
    };

    const onMouseUp = (e) => {
      e.preventDefault();
      e.stopPropagation();
      handleEnd();
    };

    const onMouseLeave = () => {
      if (isDragging.current) {
        handleEnd();
      }
    };

    // Touch event handlers
    const onTouchStart = (e) => {
      e.preventDefault();
      e.stopPropagation();
      handleStart(e.touches[0].clientY);
    };

    const onTouchMove = (e) => {
      if (!isDragging.current) return;
      e.preventDefault();
      e.stopPropagation();
      handleMove(e.touches[0].clientY);
    };

    const onTouchEnd = (e) => {
      e.preventDefault();
      e.stopPropagation();
      handleEnd();
    };

    const onTouchCancel = () => {
      if (isDragging.current) {
        handleEnd();
      }
    };

    // Add event listeners
    element.addEventListener('mousedown', onMouseDown);
    element.addEventListener('mousemove', onMouseMove);
    element.addEventListener('mouseup', onMouseUp);
    element.addEventListener('mouseleave', onMouseLeave);
    element.addEventListener('touchstart', onTouchStart);
    element.addEventListener('touchmove', onTouchMove);
    element.addEventListener('touchend', onTouchEnd);
    element.addEventListener('touchcancel', onTouchCancel);
    
    eventListenersAdded.current = true;
    console.log('✅ Drag event listeners added to hero section');

    // Store cleanup functions
    const cleanup = () => {
      console.log('🧹 Removing drag event listeners from hero section');
      element.removeEventListener('mousedown', onMouseDown);
      element.removeEventListener('mousemove', onMouseMove);
      element.removeEventListener('mouseup', onMouseUp);
      element.removeEventListener('mouseleave', onMouseLeave);
      element.removeEventListener('touchstart', onTouchStart);
      element.removeEventListener('touchmove', onTouchMove);
      element.removeEventListener('touchend', onTouchEnd);
      element.removeEventListener('touchcancel', onTouchCancel);
      eventListenersAdded.current = false;
    };

    return cleanup;
  }, [isHeroUnlocked, dragProgress, onAnimationComplete]);

  // Setup drag listeners when conditions are met
  useEffect(() => {
    console.log(`🎯 Drag setup check: currentSection=${currentSection}, animationStatus=${animationStatus}, isHeroUnlocked=${isHeroUnlocked}`);
    
    // Only setup drag when we're in section 0, animation is complete, and not unlocked
    if (currentSection === 0 && animationStatus === 'complete' && !isHeroUnlocked && heroSectionRef.current) {
      console.log('🎯 Setting up drag system');
      const cleanup = setupDragListeners();
      return cleanup;
    } else {
      // Cleanup if conditions change
      if (eventListenersAdded.current && heroSectionRef.current) {
        console.log('🧹 Removing drag listeners (conditions changed)');
        // We need to actually remove the listeners here
        eventListenersAdded.current = false;
      }
    }
  }, [currentSection, animationStatus, isHeroUnlocked, setupDragListeners]);

  // Cleanup timeline on unmount
  useEffect(() => {
    return () => {
      console.log('🧹 Cleaning up timeline');
      if (timeline.current) {
        timeline.current.kill();
      }
    };
  }, []);

  // Return to hero
  const handleReturnToHero = useCallback(() => {
    console.log('🔄 Returning to hero');
    setIsHeroUnlocked(false);
    setDragProgress(0);
    setAnimationStatus('idle');
    setGradientOpacity(1);
    setBgOpacity(0);
    setBgScale(1.1);
    setTitleOpacity(0);
    setTitleY(30);
    setSubtitleOpacity(0);
    setSubtitleY(30);
    setDragComponentOpacity(0);
    accumulatedDistance.current = 0;
    isDragging.current = false;
    eventListenersAdded.current = false;
    
    // Kill timeline
    if (timeline.current) {
      timeline.current.kill();
    }
  }, []);

  // Function to set hero section ref from component
  const setHeroSectionRef = useCallback((ref) => {
    heroSectionRef.current = ref;
  }, []);

  return {
    // Animation status
    animationStatus,
    
    // Animation values
    gradientOpacity,
    bgOpacity,
    bgScale,
    titleOpacity,
    titleY,
    subtitleOpacity,
    subtitleY,
    dragComponentOpacity,
    
    // Drag system
    dragProgress,
    isHeroUnlocked,
    
    // Refs
    setHeroSectionRef,
    
    // Methods
    handleReturnToHero
  };
};

export default useProjectAnimation;