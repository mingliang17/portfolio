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

  /* -------------------- CONSTANTS -------------------- */

  const DRAG_DISTANCE = 300;
  const FADE_DELAY = 2000;

  /* -------------------- INTRO TIMELINE -------------------- */

  const createTimeline = useCallback(() => {
    if (timeline.current) timeline.current.kill();

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
      onComplete: () => setAnimationStatus('complete'),
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

  /* -------------------- INIT / RESET -------------------- */

  useEffect(() => {
    if (currentSection === 0) {
      createTimeline();
    } else {
      // FULL RESET when leaving hero
      setAnimationStatus('idle');
      setGradientOpacity(1);
      setBgOpacity(0);
      setBgScale(1.1);
      setTitleOpacity(0);
      setSubtitleOpacity(0);
      setSubtitleX(40);
      setDragProgress(0);
      setIsHeroUnlocked(false);

      if (timeline.current) timeline.current.kill();
      if (fadeTimeout.current) clearTimeout(fadeTimeout.current);
    }
  }, [currentSection, createTimeline]);

  /* -------------------- DRAG SETUP -------------------- */

  const setupDrag = useCallback(() => {
    if (!heroRef.current || animationStatus !== 'complete') return;

    const el = heroRef.current;

    /* ----- CORE LOGIC (ORDER MATTERS) ----- */

    const start = (y) => {
      if (isHeroUnlocked) return;
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
        isDragging.current = false;
        setIsHeroUnlocked(true);

        fadeTimeout.current = setTimeout(() => {
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

    el.addEventListener('touchstart', onTouchStart);
    el.addEventListener('touchmove', onTouchMove);
    el.addEventListener('touchend', onTouchEnd);

    return () => {
      el.removeEventListener('mousedown', onMouseDown);
      el.removeEventListener('mousemove', onMouseMove);
      el.removeEventListener('mouseup', onMouseUp);

      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [animationStatus, isHeroUnlocked, onAnimationComplete]);

  useEffect(() => {
    const cleanup = setupDrag();
    return cleanup;
  }, [setupDrag]);

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
