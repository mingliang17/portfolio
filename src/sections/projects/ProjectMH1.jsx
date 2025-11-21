import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';

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
  
  const totalSections = 5;
  const scrollAccumulator = useRef(0);
  const touchStartY = useRef(0);
  const isDragging = useRef(false);
  const dragProgressRef = useRef(0);

  // Navbar functions
  const hideNavbar = () => window.dispatchEvent(new CustomEvent('projectMH1-navbar-hide'));
  const showNavbar = () => window.dispatchEvent(new CustomEvent('projectMH1-navbar-show'));

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
    <div className={`mh1-revolution-container ${currentSection === 1 ? 'mh1-map-section' : ''}`}>
      <NavigationDots />
      <UnlockOverlay />
      <DragProgressIndicator />

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
              <h1 className="mh1-hero-title">
                Project MH1
              </h1>
              <p className="mh1-hero-subtitle">
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
          <section className="mh1-map-section">
            <div className="mh1-map-layout">
              {/* Left Sidebar */}
              <div className="mh1-sidebar mh1-sidebar-left">
                <h2>Project Overview</h2>
                
                <div className="mh1-info-card mh1-info-card-blue">
                  <h3>Genetic Innovation</h3>
                  <p>Advanced genetic mapping techniques to enhance crop resilience and yield through targeted modifications.</p>
                </div>

                <div className="mh1-info-card mh1-info-card-green">
                  <h3>Sustainability Impact</h3>
                  <p>Reducing water consumption by 30% while increasing overall agricultural output by 50%.</p>
                </div>

                <div className="mh1-tip-box">
                  <p>Drag to explore the genetic mapping visualization</p>
                </div>
              </div>

              {/* Main Map Area */}
              <div className="mh1-map-container">
                <Suspense fallback={<div className="mh1-map-loading">Loading Genetic Map...</div>}>
                  <MyMap />
                </Suspense>
              </div>

              {/* Right Sidebar */}
              <div className="mh1-sidebar mh1-sidebar-right">
                <h2>Data Metrics</h2>

                <div className="mh1-metrics-grid">
                  <div className="mh1-metric-card">
                    <div className="mh1-metric-value">50%</div>
                    <div className="mh1-metric-label">Yield Increase</div>
                  </div>

                  <div className="mh1-metric-card">
                    <div className="mh1-metric-value">30%</div>
                    <div className="mh1-metric-label">Water Reduction</div>
                  </div>

                  <div className="mh1-metric-card">
                    <div className="mh1-metric-value">100M+</div>
                    <div className="mh1-metric-label">Lives Impacted</div>
                  </div>
                </div>

                <div className="mh1-focus-box">
                  <h4>Current Focus</h4>
                  <p>Analyzing genetic markers for drought resistance in key agricultural regions.</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Section 2: Impact Numbers */}
        {currentSection === 2 && (
          <section className="mh1-section mh1-impact-section">
            <div className="mh1-content-wrapper">
              <h2>Impact By Numbers</h2>
              <div className="mh1-stats-grid">
                {[
                  { number: '50%', label: 'Increased Yield' },
                  { number: '30%', label: 'Water Reduction' },
                  { number: '100M+', label: 'Lives Impacted' },
                ].map((stat, i) => (
                  <div key={i} className="mh1-stat-card">
                    <div className="mh1-stat-number">{stat.number}</div>
                    <div className="mh1-stat-label">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default ProjectMH1;