import { useState, useEffect } from 'react';

export const useProjectNavigation = (
  totalSections, 
  animationPhase, 
  onGoBack,
  currentSection,
  setCurrentSection,
  startMapAnimation,
  setStartMapAnimation
) => {
  const [isScrolling, setIsScrolling] = useState(false);

  // Trigger map animation when entering section 1
  useEffect(() => {
    console.log('📍 Navigation: currentSection changed to', currentSection);
    if (currentSection === 1 && !startMapAnimation) {
      console.log('🗺️ Triggering map animation');
      setStartMapAnimation(true);
    }
  }, [currentSection, startMapAnimation, setStartMapAnimation]);

  // Navigation event handlers (only after animation completes)
  useEffect(() => {
    console.log('🎮 Navigation listeners check - animationPhase:', animationPhase);
    
    // FIXED: Allow navigation when NOT in initial animations
    if (currentSection === 0 && 
        (animationPhase === 'initial' || 
         animationPhase === 'unlocking' || 
         animationPhase === 'fadeout')) {
      console.log('⏸️ Navigation disabled during hero animation');
      return;
    }

    console.log('✅ Navigation ENABLED - setting up event listeners');

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
          console.log('⬇️ Scrolling down to section', currentSection + 1);
          setCurrentSection(prev => prev + 1);
          accumulatedDelta = 0;
        } else if (accumulatedDelta < 0 && currentSection > 0) {
          console.log('⬆️ Scrolling up to section', currentSection - 1);
          onGoBack(currentSection, setCurrentSection);
          accumulatedDelta = 0;
        }
      }
    };

    const handleKeyDown = (e) => {
      if (isScrolling) return;
      if (e.key === 'ArrowDown' && currentSection < totalSections - 1) {
        console.log('⬇️ Arrow down pressed, going to section', currentSection + 1);
        setCurrentSection(prev => prev + 1);
      } else if (e.key === 'ArrowUp' && currentSection > 0) {
        console.log('⬆️ Arrow up pressed, going to section', currentSection - 1);
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
          console.log('👆 Drag down detected, going to section', currentSection + 1);
          setCurrentSection(prev => prev + 1);
          isDragging = false;
        } else if (deltaY < 0 && currentSection > 0) {
          console.log('👇 Drag up detected, going to section', currentSection - 1);
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
      console.log('🧹 Cleaning up navigation listeners');
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [currentSection, isScrolling, animationPhase, totalSections, onGoBack, setCurrentSection]);

  // Scroll throttling - FIXED: Allow when not in initial animations
  useEffect(() => {
    if (currentSection === 0 && 
        (animationPhase === 'initial' || 
         animationPhase === 'unlocking' || 
         animationPhase === 'fadeout')) {
      return;
    }
    
    setIsScrolling(true);
    const timeout = setTimeout(() => setIsScrolling(false), 1000);
    return () => clearTimeout(timeout);
  }, [currentSection, animationPhase]);
};