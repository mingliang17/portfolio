import { useState, useEffect, useRef } from 'react';

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

export default useProjectAnimation;