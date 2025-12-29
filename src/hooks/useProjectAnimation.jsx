import { useState, useEffect, useRef, useCallback } from 'react';
import gsap from 'gsap';

export const useProjectAnimation = (currentSection, onAnimationComplete) => {
  /* -------------------- STATE -------------------- */

  const [animationStatus, setAnimationStatus] = useState('idle');

  const [gradientOpacity, setGradientOpacity] = useState(1);
  const [bgOpacity, setBgOpacity] = useState(0);
  const [bgScale, setBgScale] = useState(1.1);

  const [titleOpacity, setTitleOpacity] = useState(0);
  const [subtitleOpacity, setSubtitleOpacity] = useState(0);
  const [subtitleX, setSubtitleX] = useState(40);

  const [dragProgress, setDragProgress] = useState(0);
  const [isHeroUnlocked, setIsHeroUnlocked] = useState(false);

  /* -------------------- REFS -------------------- */

  const heroRef = useRef(null);
  const timeline = useRef(null);

  const isDragging = useRef(false);
  const dragStartY = useRef(0);
  const accumulated = useRef(0);

  const fadeTimeout = useRef(null);
  const cleanupDragRef = useRef(null); // Store cleanup function

  /* -------------------- CONSTANTS -------------------- */

  const DRAG_DISTANCE = 300;
  const FADE_DELAY = 2000;

  /* -------------------- INTRO TIMELINE -------------------- */

  const createTimeline = useCallback(() => {
    if (timeline.current) timeline.current.kill();

    console.log('🎬 Creating fresh timeline for section 0');

    setAnimationStatus('running');
    setGradientOpacity(1);
    setBgOpacity(0);
    setBgScale(1.1);
    setTitleOpacity(0);
    setSubtitleOpacity(0);
    setSubtitleX(40);
    setDragProgress(0);
    setIsHeroUnlocked(false);

    timeline.current = gsap.timeline({
      onComplete: () => {
        console.log('✅ Timeline complete - drag now available');
        setAnimationStatus('complete');
      },
    });

    timeline.current.to({}, {
      duration: 1.2,
      onUpdate: function () {
        setBgOpacity(this.progress());
        setBgScale(1.1 - this.progress() * 0.1);
      },
    });

    timeline.current.to({}, {
      duration: 0.6,
      delay: 0.4,
      onUpdate: function () {
        setTitleOpacity(this.progress());
      },
    });

    timeline.current.to({}, {
      duration: 0.6,
      delay: 0.2,
      onUpdate: function () {
        setSubtitleOpacity(this.progress());
        setSubtitleX(40 - 40 * this.progress());
      },
    });

  }, []);

  /* -------------------- COMPLETE RESET FUNCTION -------------------- */

  const completeReset = useCallback(() => {
    console.log('🔄 Complete reset of animation state');
    
    // Kill any running animations
    if (timeline.current) {
      timeline.current.kill();
      timeline.current = null;
    }
    if (fadeTimeout.current) {
      clearTimeout(fadeTimeout.current);
      fadeTimeout.current = null;
    }

    // Clean up drag listeners
    if (cleanupDragRef.current) {
      console.log('🧹 Cleaning up previous drag listeners');
      cleanupDragRef.current();
      cleanupDragRef.current = null;
    }

    // Reset all state
    setAnimationStatus('idle');
    setGradientOpacity(1);
    setBgOpacity(0);
    setBgScale(1.1);
    setTitleOpacity(0);
    setSubtitleOpacity(0);
    setSubtitleX(40);
    setDragProgress(0);
    setIsHeroUnlocked(false);

    // Reset all refs
    isDragging.current = false;
    dragStartY.current = 0;
    accumulated.current = 0;
  }, []);

  /* -------------------- INIT / RESET -------------------- */

  useEffect(() => {
    if (currentSection === 0) {
      console.log('📍 Entering section 0');
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        completeReset();
        createTimeline();
      }, 50);
      
      return () => clearTimeout(timer);
    } else {
      console.log('📍 Leaving section 0');
      completeReset();
    }
  }, [currentSection, createTimeline, completeReset]);

  /* -------------------- DRAG SETUP -------------------- */

  const setupDrag = useCallback(() => {
    // Clean up previous listeners first
    if (cleanupDragRef.current) {
      cleanupDragRef.current();
    }

    if (!heroRef.current) {
      console.warn('⚠️ heroRef not available for drag setup');
      return;
    }
    
    if (animationStatus !== 'complete') {
      console.log('⏳ Waiting for animation to complete before setting up drag');
      return;
    }

    console.log('🖱️ Setting up drag listeners');
    const el = heroRef.current;

    /* ----- CORE LOGIC (ORDER MATTERS) ----- */

    const start = (y) => {
      if (isHeroUnlocked) return;
      console.log('🖱️ Drag started');
      isDragging.current = true;
      dragStartY.current = y;
      accumulated.current = 0;
    };

    const move = (y) => {
      if (!isDragging.current || isHeroUnlocked) return;

      const delta = dragStartY.current - y;
      if (delta <= 0) return;

      const progress = Math.min(1, delta / DRAG_DISTANCE);
      accumulated.current = delta;

      setDragProgress(progress);

      /* reverse animations during drag */
      setTitleOpacity(1 - progress);
      setSubtitleOpacity(1 - progress);
      setSubtitleX(40 * progress);
      setGradientOpacity(1 - progress);

      if (progress >= 1) {
        console.log('🔓 Hero unlocked');
        isDragging.current = false;
        setIsHeroUnlocked(true);

        fadeTimeout.current = setTimeout(() => {
          console.log('🌅 Starting fadeout to next section');
          gsap.to({}, {
            duration: 0.8,
            onUpdate: function () {
              setBgOpacity(1 - this.progress());
            },
            onComplete: () => {
              onAnimationComplete?.();
            },
          });
        }, FADE_DELAY);
      }
    };

    const end = () => {
      if (isDragging.current) {
        console.log('🖱️ Drag ended');
      }
      isDragging.current = false;
    };

    /* ----- EVENTS ----- */

    const onMouseDown = (e) => start(e.clientY);
    const onMouseMove = (e) => move(e.clientY);
    const onMouseUp = end;

    const onTouchStart = (e) => start(e.touches[0].clientY);
    const onTouchMove = (e) => move(e.touches[0].clientY);
    const onTouchEnd = end;

    el.addEventListener('mousedown', onMouseDown);
    el.addEventListener('mousemove', onMouseMove);
    el.addEventListener('mouseup', onMouseUp);
    el.addEventListener('mouseleave', onMouseUp); // Added: handle mouse leaving area

    el.addEventListener('touchstart', onTouchStart, { passive: false });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd);

    // Store cleanup function
    const cleanup = () => {
      console.log('🧹 Removing drag listeners');
      el.removeEventListener('mousedown', onMouseDown);
      el.removeEventListener('mousemove', onMouseMove);
      el.removeEventListener('mouseup', onMouseUp);
      el.removeEventListener('mouseleave', onMouseUp);

      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };

    cleanupDragRef.current = cleanup;
    return cleanup;
  }, [animationStatus, isHeroUnlocked, onAnimationComplete, DRAG_DISTANCE, FADE_DELAY]);

  // Set up drag when animation status changes to 'complete'
  useEffect(() => {
    if (animationStatus === 'complete' && currentSection === 0) {
      const cleanup = setupDrag();
      return cleanup;
    }
  }, [setupDrag, animationStatus, currentSection]);

  /* -------------------- API -------------------- */

  const setHeroSectionRef = useCallback((ref) => {
    heroRef.current = ref;
  }, []);

  return {
    animationStatus,

    gradientOpacity,
    bgOpacity,
    bgScale,

    titleOpacity,
    subtitleOpacity,
    subtitleX,

    dragProgress,
    isHeroUnlocked,

    setHeroSectionRef,
  };
};

export default useProjectAnimation;