import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import Carousel from '../Carousel.jsx';
import { logoMH1 } from '/src/constants/projects.js';

// Lazy load the MyMap component to prevent early mounting
const MyMap = lazy(() => import('../MyMap.jsx'));

const ProjectMH1 = () => {
  const [currentSection, setCurrentSection] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [animationPhase, setAnimationPhase] = useState('initial');
  const [titleOpacity, setTitleOpacity] = useState(0);
  const [unlockProgress, setUnlockProgress] = useState(0);
  const [gradientOpacity, setGradientOpacity] = useState(0);
  const [backgroundFade, setBackgroundFade] = useState(0);
  const [startMapAnimation, setStartMapAnimation] = useState(false); // ⭐ NEW STATE
  
  const totalSections = 5;
  const scrollAccumulator = useRef(0);
  const touchStartY = useRef(0);
  const isDragging = useRef(false);
  const dragProgressRef = useRef(0);

  // Navbar functions
  const hideNavbar = () => window.dispatchEvent(new CustomEvent('projectMH1-navbar-hide'));
  const showNavbar = () => window.dispatchEvent(new CustomEvent('projectMH1-navbar-show'));

  // ⭐ NEW: Trigger map animation when entering section 1
  useEffect(() => {
    console.log('📍 Section changed to:', currentSection);
    if (currentSection === 1 && !startMapAnimation) {
      console.log('🎯 Setting startMapAnimation to TRUE');
      setStartMapAnimation(true);
    }
  }, [currentSection, startMapAnimation]);

  // Enhanced animation sequence - ONLY for section 0
  useEffect(() => {
    if (currentSection !== 0) return;
    
    // Initial state: everything hidden
    setGradientOpacity(0);
    setBackgroundFade(0);
    setTitleOpacity(0);
    
    const sequence = async () => {
      // Step 1: Fade in navbar and gradient overlay
      await new Promise(resolve => {
        setGradientOpacity(1);
        setTimeout(resolve, 1000);
      });
      
      // Step 2: Fade in background image
      await new Promise(resolve => {
        setBackgroundFade(1);
        setTimeout(resolve, 800);
      });
      
      // Step 3: Fade in title and move to waiting phase
      setTitleOpacity(1);
      setTimeout(() => setAnimationPhase('waiting'), 1000);
    };
    
    sequence();
  }, [currentSection]);

  // Handle drag during waiting phase - ONLY for section 0
  useEffect(() => {
    if (currentSection !== 0 || animationPhase !== 'waiting') return;

    const updateDragUI = (progress) => {
      dragProgressRef.current = progress;
      setGradientOpacity(Math.max(0, 1 - progress));
    };

    const handleStart = (clientY) => {
      isDragging.current = true;
      touchStartY.current = clientY;
      hideNavbar();
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
          setAnimationPhase('unlocking');
          scrollAccumulator.current = 0;
          isDragging.current = false;
          document.body.style.cursor = '';
        }
        
        touchStartY.current = clientY;
      }
    };

    const handleEnd = () => {
      isDragging.current = false;
      document.body.style.cursor = '';
      
      if (animationPhase === 'waiting' && dragProgressRef.current > 0) {
        const resetInterval = setInterval(() => {
          dragProgressRef.current = Math.max(0, dragProgressRef.current - 0.1);
          updateDragUI(dragProgressRef.current);
          
          if (dragProgressRef.current <= 0) {
            clearInterval(resetInterval);
            scrollAccumulator.current = 0;
            showNavbar();
          }
        }, 16);
      } else {
        showNavbar();
      }
    };

    // Event handlers
    const handleTouchStart = (e) => handleStart(e.touches[0].clientY);
    const handleTouchMove = (e) => handleMove(e.touches[0].clientY);
    const handleMouseDown = (e) => handleStart(e.clientY);
    const handleMouseMove = (e) => handleMove(e.clientY);

    // Add event listeners
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleEnd);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleEnd);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEnd);
      document.body.style.cursor = '';
    };
  }, [animationPhase, currentSection]);

  // Unlock animation sequence - ONLY for section 0
  useEffect(() => {
    if (currentSection !== 0 || animationPhase !== 'unlocking') return;

    let progress = 0;
    const unlockInterval = setInterval(() => {
      progress += 0.02;
      setUnlockProgress(progress);
      setTitleOpacity(Math.max(0, 1 - progress * 2));
      
      if (progress >= 1) {
        clearInterval(unlockInterval);
        setAnimationPhase('fadeout');
      }
    }, 20);

    return () => clearInterval(unlockInterval);
  }, [animationPhase, currentSection]);

  // Fade out background and transition to next section - ONLY for section 0
  useEffect(() => {
    if (currentSection !== 0 || animationPhase !== 'fadeout') return;

    let fadeProgress = 0;
    const fadeInterval = setInterval(() => {
      fadeProgress += 0.05;
      setBackgroundFade(Math.max(0, 1 - fadeProgress));
      
      if (fadeProgress >= 1) {
        clearInterval(fadeInterval);
        setAnimationPhase('completed');
        setTimeout(() => setCurrentSection(1), 100);
      }
    }, 20);

    return () => clearInterval(fadeInterval);
  }, [animationPhase, currentSection]);

  // Show navbar when returning to first section
  useEffect(() => {
    if (currentSection === 0 && animationPhase === 'waiting') {
      showNavbar();
    }
  }, [currentSection, animationPhase]);

  // Regular scroll/drag logic after animation completion
  useEffect(() => {
    if (animationPhase !== 'completed') return;

    let lastScrollTime = Date.now();
    let accumulatedDelta = 0;
    let dragStartY = 0;
    let isDraggingPostAnimation = false;

    const handleWheel = (e) => {
      e.preventDefault();
      
      const now = Date.now();
      if (now - lastScrollTime > 200) accumulatedDelta = 0;
      
      lastScrollTime = now;
      accumulatedDelta += e.deltaY;
      
      if (Math.abs(accumulatedDelta) > 100 && !isScrolling) {
        if (accumulatedDelta > 0 && currentSection < totalSections - 1) {
          hideNavbar();
          setCurrentSection(prev => prev + 1);
          accumulatedDelta = 0;
        } else if (accumulatedDelta < 0 && currentSection > 0) {
          handleGoBack();
          accumulatedDelta = 0;
        }
      }
    };

    const handleKeyDown = (e) => {
      if (isScrolling) return;
      if (e.key === 'ArrowDown' && currentSection < totalSections - 1) {
        hideNavbar();
        setCurrentSection(prev => prev + 1);
      } else if (e.key === 'ArrowUp' && currentSection > 0) {
        handleGoBack();
      }
    };

    const handleDragStart = (clientY) => {
      isDraggingPostAnimation = true;
      dragStartY = clientY;
      hideNavbar();
    };

    const handleDragMove = (clientY) => {
      if (!isDraggingPostAnimation || isScrolling) return;
      
      const deltaY = dragStartY - clientY;
      
      if (Math.abs(deltaY) > 50) {
        if (deltaY > 0 && currentSection < totalSections - 1) {
          setCurrentSection(prev => prev + 1);
          isDraggingPostAnimation = false;
        } else if (deltaY < 0 && currentSection > 0) {
          handleGoBack();
          isDraggingPostAnimation = false;
        }
      }
    };

    const handleGoBack = () => {
      if (currentSection === 1) {
        setBackgroundFade(0);
        setCurrentSection(0);
        setStartMapAnimation(false); // ⭐ RESET ANIMATION STATE
        
        setTimeout(() => {
          let reverseFade = 0;
          const reverseFadeInterval = setInterval(() => {
            reverseFade += 0.05;
            setBackgroundFade(Math.min(1, reverseFade));
            
            if (reverseFade >= 1) {
              clearInterval(reverseFadeInterval);
              setAnimationPhase('waiting');
              setTitleOpacity(1);
              setGradientOpacity(1);
              setUnlockProgress(0);
              scrollAccumulator.current = 0;
              dragProgressRef.current = 0;
            }
          }, 20);
        }, 500);
      } else {
        setCurrentSection(prev => prev - 1);
      }
    };

    const handleMouseMoveTop = (e) => {
      if (e.clientY < 100) showNavbar();
    };

    // Event handlers for cleanup
    const handleTouchStart = (e) => handleDragStart(e.touches[0].clientY);
    const handleTouchMove = (e) => handleDragMove(e.touches[0].clientY);
    const handleTouchEnd = () => isDraggingPostAnimation = false;
    const handleMouseDown = (e) => handleDragStart(e.clientY);
    const handleMouseMove = (e) => handleDragMove(e.clientY);
    const handleMouseUp = () => isDraggingPostAnimation = false;

    // Event listeners
    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMoveTop);

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMoveTop);
    };
  }, [currentSection, isScrolling, animationPhase]);

  useEffect(() => {
    if (animationPhase !== 'completed') return;
    setIsScrolling(true);
    const timeout = setTimeout(() => setIsScrolling(false), 1000);
    return () => clearTimeout(timeout);
  }, [currentSection, animationPhase]);

  // Section Navigation Dots
  const NavigationDots = () => (
    <div className="mh1-navigation-dots">
      {Array.from({ length: totalSections }).map((_, i) => (
        <button
          key={i}
          onClick={() => animationPhase === 'completed' && setCurrentSection(i)}
          className={`mh1-nav-dot ${i === currentSection ? 'active' : ''}`}
          aria-label={`Go to section ${i + 1}`}
        />
      ))}
    </div>
  );

  // Unlock Animation Overlay
  const UnlockOverlay = () => {
    if (animationPhase !== 'unlocking' || currentSection !== 0) return null;

    return (
      <div className="mh1-unlock-overlay">
        <div className="mh1-unlock-circle" style={{ 
          transform: `scale(${unlockProgress * 3})`, 
          opacity: 1 - unlockProgress 
        }} />
        <div className="mh1-unlock-ring" style={{ 
          transform: `scale(${0.5 + unlockProgress * 1.5}) rotate(${unlockProgress * 360}deg)`,
          opacity: 1 - unlockProgress 
        }} />
      </div>
    );
  };

  // Drag Progress Indicator
  const DragProgressIndicator = () => {
    if (currentSection !== 0 || animationPhase !== 'waiting' || dragProgressRef.current === 0) return null;

    return (
      <div className="mh1-drag-progress">
        <div className="mh1-drag-progress-bar">
          <div 
            className="mh1-drag-progress-fill"
            style={{ width: `${dragProgressRef.current * 100}%` }}
          />
        </div>
        {Math.round(dragProgressRef.current * 100)}% Complete
      </div>
    );
  };

  return (
    <div className="mh1-base-container">
      <NavigationDots />
      <UnlockOverlay />
      <DragProgressIndicator />

      {/* ⭐ DEBUG PANEL - Remove after testing */}
      <div style={{
        position: 'fixed',
        top: '100px',
        left: '20px',
        zIndex: 1001,
        background: 'rgba(0,0,0,0.9)',
        padding: '15px',
        borderRadius: '8px',
        fontSize: '13px',
        fontFamily: 'monospace',
        border: '2px solid #f59e0b',
        color: 'white',
      }}>
        <div style={{ color: '#f59e0b', fontWeight: 'bold', marginBottom: '8px' }}>
          🐛 DEBUG INFO
        </div>
        <div>Current Section: <strong>{currentSection}</strong></div>
        <div>Start Map Anim: <strong style={{ color: startMapAnimation ? '#22c55e' : '#ef4444' }}>
          {startMapAnimation ? '✅ TRUE' : '❌ FALSE'}
        </strong></div>
        <div>Animation Phase: <strong>{animationPhase}</strong></div>
      </div>

      {/* Background Image with gradient mask - ONLY for section 0 */}
      {currentSection === 0 && (
        <div 
          className="mh1-background-wrapper"
          style={{ opacity: backgroundFade }}
        >
          <div 
            className="mh1-background-image bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: "url('assets/projects/projectMH1/imageMH1_1.jpg')" }}
          />
          <div 
            className="mh1-background-gradient-mask"
            style={{ opacity: gradientOpacity }}
          />
        </div>
      )}

      <div className="mh1-section-container">
        {/* Section 0: Hero */}
        {currentSection === 0 && (
          <section className="mh1-section mh1-hero-section">
            <div 
              className="mh1-content-center"
              style={{ opacity: titleOpacity }}
            >
              <h1 className="mh1-hero-title unselectable">
                Project MH1
              </h1>
              <p className="mh1-hero-subtitle unselectable">
                Redefining Agriculture Through Genetic Innovation
              </p>
            </div>
            
            {animationPhase === 'waiting' && (
              <div className="mh1-scroll-prompt">
                <div 
                  className="mh1-scroll-arrow mh1-drag-arrow"
                  style={{ 
                    borderRightColor: dragProgressRef.current > 0 ? '#fbbf24' : '#f59e0b',
                    borderBottomColor: dragProgressRef.current > 0 ? '#fbbf24' : '#f59e0b',
                  }} 
                />
                <p className="mh1-drag-text">
                  {dragProgressRef.current > 0 ? 'Keep dragging...' : 'Drag up to unlock'}
                </p>
              </div>
            )}
          </section>
        )}

        {/* Section 1: Map with Sidebars */}
        {currentSection === 1 && (
          <section className="mh1-section">
            <div className="mh1-map-layout">

              {/* Map - ⭐ KEY CHANGE: Added startAnimation prop */}
              <div className="mh1-map-container">
                <Suspense fallback={<div className="mh1-map-loading">Loading Genetic Map...</div>}>
                  <MyMap startAnimation={startMapAnimation} />
                </Suspense>
              </div>

              {/* Logos */}
              <div className="mh1-logo-container flex flex-col justify-center items-center">
                {logoMH1.map((logo, index) => (
                  <img 
                    key={index}
                    src={logo.src} 
                    alt={logo.alt} 
                    title={logo.title}
                    className={logo.className}
                  />
                ))}
              </div>

              {/* Right Sidebar */} 
              <div className="mh1-sidebar">
                <h2>Data Metrics</h2>
                <div className="mh1-description-grid">
                  <div className="mh1-description-value">Collaborators</div>
                  <div className="mh1-description-label">Meinhardt EPCM</div>
                </div>  

                <div className="mh1-description-grid">
                  <div className="mh1-description-value">Type</div>
                  <div className="mh1-description-label">Design and Preliminary Design</div>
                </div>

                <div className="mh1-description-grid">
                  <div className="mh1-description-value">Description</div>
                    <div className="mh1-description-label">A project is a temporary endeavor undertaken to create a unique product, service, or result. It can involve anything from the glamorous events of Fashion Week to humanitarian aid efforts overseas. More specifically, a project is a series of structured tasks, activities, and deliverables that are carefully executed to achieve a desired outcome.</div>
                </div>
                <div className="mh1-description-label">*Client Name and certain details have been omitted for confidentiality</div>
              </div>
            </div>
          </section>
        )}

        {/* Section 2: Carousel */}
        {currentSection === 2 && (
          <section className="mh1-section mh1-carousel-section-wrapper">
            <Carousel />
          </section>
        )}
      </div>  
    </div>
  );
};

export default ProjectMH1;