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
  const hasInitialized = useRef(false);

  // Sync local state with parent state setter
  useEffect(() => {
    if (setAnimationPhase) {
      setAnimationPhase(animationPhase);
    }
  }, [animationPhase, setAnimationPhase]);

  // Initial animation sequence (section 0 only)
  useEffect(() => {
    if (currentSection !== 0 || hasInitialized.current) return;
    
    console.log('🎬 Starting initial animation sequence');
    hasInitialized.current = true;
    
    // Reset all states
    setGradientOpacity(0);
    setBackgroundFade(0);
    setTitleOpacity(0);
    
    const runSequence = async () => {
      // Wait a moment for image to start loading
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Step 1: Fade in background (0.8s)
      console.log('📸 Step 1: Fading in background');
      setBackgroundFade(1);
      await new Promise(resolve => setTimeout(resolve, 0));
      
      // Step 2: Fade in gradient overlay (0.6s)
      console.log('🌈 Step 2: Fading in gradient');
      setGradientOpacity(1);  
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // Step 3: Fade in title (1s) and transition to waiting
      console.log('✍️ Step 3: Fading in title');
      setTitleOpacity(1);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('✅ Initial sequence complete, entering waiting phase');
      setLocalAnimationPhase('waiting');
    };
    
    runSequence();
  }, [currentSection]);

  // Handle drag during waiting phase
  useEffect(() => {
    if (currentSection !== 0 || animationPhase !== 'waiting') return;

    const updateDragUI = (progress) => {
      dragProgressRef.current = progress;
      // Fade out gradient as user drags
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
          console.log('🎯 Drag threshold reached, starting unlock animation');
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

  // Unlock animation (circle expanding)
  useEffect(() => {
    if (currentSection !== 0 || animationPhase !== 'unlocking') return;

    console.log('🔓 Starting unlock animation');
    let progress = 0;
    const unlockInterval = setInterval(() => {
      progress += 0.02;
      setUnlockProgress(progress);
      // Fade out title faster than circle grows
      setTitleOpacity(Math.max(0, 1 - progress * 2));
      
      if (progress >= 1) {
        clearInterval(unlockInterval);
        console.log('✅ Unlock animation complete, starting fadeout');
        setLocalAnimationPhase('fadeout');
      }
    }, 20);

    return () => clearInterval(unlockInterval);
  }, [animationPhase, currentSection]);

  // Fade out background before section change
  useEffect(() => {
    if (currentSection !== 0 || animationPhase !== 'fadeout') return;

    console.log('🌅 Starting fadeout animation');
    let fadeProgress = 0;
    const fadeInterval = setInterval(() => {
      fadeProgress += 0.05; // Faster fade out
      const newFade = Math.max(0, 1 - fadeProgress);
      setBackgroundFade(newFade);
      
      if (fadeProgress >= 1) {
        clearInterval(fadeInterval);
        console.log('✅ Fadeout complete, transitioning to section 1');
        setLocalAnimationPhase('completed');
        
        // Small delay before section change for smooth transition
        setTimeout(() => {
          if (onAnimationComplete) {
            onAnimationComplete();
          }
        }, 100);
      }
    }, 20);

    return () => clearInterval(fadeInterval);
  }, [animationPhase, currentSection, onAnimationComplete]);

  // Reset when returning to section 0
  useEffect(() => {
    if (currentSection === 0 && animationPhase === 'completed') {
      hasInitialized.current = false;
    }
  }, [currentSection, animationPhase]);

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