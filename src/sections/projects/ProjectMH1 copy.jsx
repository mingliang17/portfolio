import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';

// Lazy load the MyMap component to prevent early mounting
const MyMap = lazy(() => import('../map.jsx'));

const ProjectMH1 = () => {
  const [currentSection, setCurrentSection] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [animationPhase, setAnimationPhase] = useState('initial');
  const [titleOpacity, setTitleOpacity] = useState(0);
  const [unlockProgress, setUnlockProgress] = useState(0);
  const [gradientOpacity, setGradientOpacity] = useState(0);
  const [backgroundFade, setBackgroundFade] = useState(0);
  const [navbarOpacity, setNavbarOpacity] = useState(0);
  
  const totalSections = 5;
  const heroContentRef = useRef(null);
  const scrollAccumulator = useRef(0);
  const touchStartY = useRef(0);
  const isDragging = useRef(false);
  const dragProgressRef = useRef(0);

  // Function to hide navbar
  const hideNavbar = () => {
    window.dispatchEvent(new CustomEvent('projectMH1-navbar-hide'));
  };

  // Function to show navbar
  const showNavbar = () => {
    window.dispatchEvent(new CustomEvent('projectMH1-navbar-show'));
  };

  // Enhanced animation sequence - ONLY for section 1
  useEffect(() => {
    if (currentSection !== 0) return;
    
    setIsLoaded(true);
    
    // Initial state: everything hidden
    setNavbarOpacity(0);
    setGradientOpacity(0);
    setBackgroundFade(0);
    setTitleOpacity(0);
    
    // Animation sequence
    const sequence = async () => {
      // Step 1: Fade in navbar and gradient overlay (1 second)
      await new Promise(resolve => {
        setNavbarOpacity(1);
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
      setTimeout(() => {
        setAnimationPhase('waiting');
      }, 1000);
    };
    
    sequence();
  }, [currentSection]);

  // Handle drag during waiting phase with improved UI - ONLY for section 1
  useEffect(() => {
    if (currentSection !== 0 || animationPhase !== 'waiting') return;

    const updateDragUI = (progress) => {
      dragProgressRef.current = progress;
      const newGradientOpacity = Math.max(0, 1 - progress);
      setGradientOpacity(newGradientOpacity);
    };

    const handleTouchStart = (e) => {
      isDragging.current = true;
      touchStartY.current = e.touches[0].clientY;
      hideNavbar();
      document.body.style.cursor = 'grabbing';
    };

    const handleTouchMove = (e) => {
      if (!isDragging.current) return;
      
      const touchY = e.touches[0].clientY;
      const deltaY = touchStartY.current - touchY;
      
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
        
        touchStartY.current = touchY;
      }
    };

    const handleTouchEnd = () => {
      isDragging.current = false;
      document.body.style.cursor = '';
      
      if (animationPhase === 'waiting') {
        if (dragProgressRef.current > 0) {
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
      }
    };

    const handleMouseDown = (e) => {
      isDragging.current = true;
      touchStartY.current = e.clientY;
      hideNavbar();
      document.body.style.cursor = 'grabbing';
    };

    const handleMouseMove = (e) => {
      if (!isDragging.current) return;
      
      const mouseY = e.clientY;
      const deltaY = touchStartY.current - mouseY;
      
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
        
        touchStartY.current = mouseY;
      }
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      document.body.style.cursor = '';
      
      if (animationPhase === 'waiting') {
        if (dragProgressRef.current > 0) {
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
      }
    };

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

  // Unlock animation sequence - ONLY for section 1
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

  // Fade out background and transition to next section - ONLY for section 1
  useEffect(() => {
    if (currentSection !== 0 || animationPhase !== 'fadeout') return;

    let fadeProgress = 0;
    const fadeInterval = setInterval(() => {
      fadeProgress += 0.05;
      setBackgroundFade(Math.max(0, 1 - fadeProgress));
      
      if (fadeProgress >= 1) {
        clearInterval(fadeInterval);
        setAnimationPhase('completed');
        setTimeout(() => {
          setCurrentSection(1);
        }, 100);
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
      const timeSinceLastScroll = now - lastScrollTime;
      
      if (timeSinceLastScroll > 200) {
        accumulatedDelta = 0;
      }
      
      lastScrollTime = now;
      accumulatedDelta += e.deltaY;
      
      const threshold = 100;
      
      if (Math.abs(accumulatedDelta) > threshold && !isScrolling) {
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

    const handleTouchStart = (e) => {
      isDraggingPostAnimation = true;
      dragStartY = e.touches[0].clientY;
      hideNavbar();
    };

    const handleTouchMove = (e) => {
      if (!isDraggingPostAnimation || isScrolling) return;
      
      const touchY = e.touches[0].clientY;
      const deltaY = dragStartY - touchY;
      
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

    const handleTouchEnd = () => {
      isDraggingPostAnimation = false;
    };

    const handleMouseDown = (e) => {
      isDraggingPostAnimation = true;
      dragStartY = e.clientY;
      hideNavbar();
    };

    const handleMouseMove = (e) => {
      if (!isDraggingPostAnimation || isScrolling) return;
      
      const mouseY = e.clientY;
      const deltaY = dragStartY - mouseY;
      
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

    const handleMouseUp = () => {
      isDraggingPostAnimation = false;
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
      if (e.clientY < 100) {
        showNavbar();
      }
    };

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

  // DNA Helix Component
  const DNAHelix = () => {
    const [rotation, setRotation] = useState(0);
    useEffect(() => {
      const interval = setInterval(() => {
        setRotation(prev => (prev + 1) % 360);
      }, 30);
      return () => clearInterval(interval);
    }, []);

    const numPairs = 20;
    const pairs = Array.from({ length: numPairs }, (_, i) => {
      const angle1 = (rotation + i * 18) * (Math.PI / 180);
      const angle2 = angle1 + Math.PI;
      const y = i * 15;
      const radius = 40;
      return {
        x1: Math.cos(angle1) * radius + 100,
        y1: y + 50,
        x2: Math.cos(angle2) * radius + 100,
        y2: y + 50,
      };
    });

    return (
      <svg width="200" height="350" className="mx-auto">
        <defs>
          <linearGradient id="dnaGradient1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
          <linearGradient id="dnaGradient2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
        </defs>
        
        {pairs.map((pair, i) => (
          <g key={i} opacity={0.8}>
            <circle cx={pair.x1} cy={pair.y1} r="4" fill="url(#dnaGradient1)" />
            <circle cx={pair.x2} cy={pair.y2} r="4" fill="url(#dnaGradient2)" />
            <line 
              x1={pair.x1} 
              y1={pair.y1} 
              x2={pair.x2} 
              y2={pair.y2} 
              stroke="#94a3b8" 
              strokeWidth="1.5"
              opacity="0.4"
            />
          </g>
        ))}
        
        {pairs.slice(0, -1).map((pair, i) => {
          const nextPair = pairs[i + 1];
          return (
            <g key={`strand-${i}`}>
              <line 
                x1={pair.x1} 
                y1={pair.y1} 
                x2={nextPair.x1} 
                y2={nextPair.y1} 
                stroke="url(#dnaGradient1)" 
                strokeWidth="2.5"
                opacity="0.7"
              />
              <line 
                x1={pair.x2} 
                y1={pair.y2} 
                x2={nextPair.x2} 
                y2={nextPair.y2} 
                stroke="url(#dnaGradient2)" 
                strokeWidth="2.5"
                opacity="0.7"
              />
            </g>
          );
        })}
      </svg>
    );
  };

  // Particle Background
  const ParticleBackground = () => {
    const particles = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: Math.random() * 5,
      duration: 10 + Math.random() * 10,
    }));

    return (
      <div className="mh1-particle-background">
        {particles.map(p => (
          <div
            key={p.id}
            className="mh1-particle"
            style={{
              left: p.left,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
      </div>
    );
  };

  // Section Navigation Dots
  const NavigationDots = () => (
    <div className="mh1-navigation-dots">
      {Array.from({ length: totalSections }).map((_, i) => (
        <button
          key={i}
          onClick={() => {
            if (animationPhase === 'completed') {
              setCurrentSection(i);
            }
          }}
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
        <div className="mh1-unlock-circle" style={{ transform: `scale(${unlockProgress * 3})`, opacity: 1 - unlockProgress }} />
        <div className="mh1-unlock-ring" style={{ 
          transform: `scale(${0.5 + unlockProgress * 1.5}) rotate(${unlockProgress * 360}deg)`,
          opacity: 1 - unlockProgress 
        }} />
      </div>
    );
  };

  // Enhanced Drag Progress Indicator
  const DragProgressIndicator = () => {
    if (currentSection !== 0 || animationPhase !== 'waiting' || dragProgressRef.current === 0) return null;

    return (
      <div className="mh1-drag-progress" style={{
        position: 'fixed',
        bottom: '6rem',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 100,
        textAlign: 'center',
        color: '#f59e0b',
        fontSize: '0.9rem',
        fontWeight: '600'
      }}>
        <div style={{
          width: '120px',
          height: '4px',
          backgroundColor: 'rgba(245, 158, 11, 0.3)',
          borderRadius: '2px',
          margin: '0 auto 8px auto',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${dragProgressRef.current * 100}%`,
            height: '100%',
            backgroundColor: '#f59e0b',
            borderRadius: '2px',
            transition: 'width 0.1s ease'
          }} />
        </div>
        {Math.round(dragProgressRef.current * 100)}% Complete
      </div>
    );
  };

  return (
    <div 
      className="mh1-revolution-container"
      style={{
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
        height: '100vh',
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      <NavigationDots />
      <UnlockOverlay />
      <DragProgressIndicator />

      {/* Background Image with gradient mask - ONLY for section 1 */}
      {currentSection === 0 && (
        <div 
          className="mh1-background-wrapper"
          style={{
            opacity: backgroundFade,
            transition: 'opacity 0.8s ease-out',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%'
          }}
        >
          <div 
            className="mh1-background-image"
            style={{
              backgroundImage: "url('assets/projects/projectMH1/imageMH1_1.jpg')",
              width: '100%',
              height: '100%',
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          />
          {/* Gradient overlay with controlled opacity */}
          <div 
            className="mh1-background-gradient-mask"
            style={{
              opacity: gradientOpacity,
              transition: 'opacity 0.3s ease-out',
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.7))'
            }}
          />
        </div>
      )}

      <div className="mh1-section-container">
        {/* Only render the current section */}
        {currentSection === 0 && (
          <section className="mh1-section" style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div 
              ref={heroContentRef}
              className="mh1-content-center"
              style={{ 
                opacity: titleOpacity,
                transition: 'opacity 0.8s ease-out',
                textAlign: 'center',
                color: 'white',
                zIndex: 10
              }}
            >
              <h1 className="mh1-hero-title" style={{ fontSize: '4rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                Project MH1
              </h1>
              <p className="mh1-hero-subtitle" style={{ fontSize: '1.5rem', opacity: 0.9 }}>
                Redefining Agriculture Through Genetic Innovation
              </p>
            </div>
            
            {animationPhase === 'waiting' && currentSection === 0 && (
              <div className="mh1-scroll-prompt" style={{
                position: 'absolute',
                bottom: '2rem',
                left: '50%',
                transform: 'translateX(-50%)',
                textAlign: 'center',
                zIndex: 10
              }}>
                <div 
                  className="mh1-scroll-arrow" 
                  style={{ 
                    transform: 'rotate(180deg)',
                    cursor: 'grab',
                    borderColor: dragProgressRef.current > 0 ? '#fbbf24' : '#f59e0b',
                    transition: 'border-color 0.2s ease',
                    width: '30px',
                    height: '30px',
                    border: '2px solid',
                    borderLeft: 'none',
                    borderTop: 'none',
                    margin: '0 auto'
                  }} 
                />
                <p 
                  style={{
                    cursor: 'grab',
                    color: dragProgressRef.current > 0 ? '#fbbf24' : '#f59e0b',
                    marginTop: '1rem',
                    fontSize: '1rem'
                  }}
                >
                  {dragProgressRef.current > 0 ? 'Keep dragging...' : 'Drag up to unlock'}
                </p>
              </div>
            )}
          </section>
        )}

            {currentSection === 1 && (
        <section className="h-screen bg-red-500"> {/* Added background to see the section */}
          <div className="flex border-4 border-blue-400 h-full">
            {/* Map Container */}
            <div className="flex-1 border-4 border-green-400 relative min-h-0 bg-blue-900"> {/* Added background */}
              <Suspense fallback={
                <div className="flex items-center justify-center h-full bg-yellow-500"> {/* High visibility fallback */}
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
                    <p className="text-black font-bold text-lg">LOADING MAP...</p>
                  </div>
                </div>
              }>
                <MyMap />
              </Suspense>
            </div>
            
            {/* Sidebar - make it more visible */}
            <div className="flex-col border-4 border-red-400 w-64 bg-gray-800 p-4">
              <p className="text-white text-xl font-bold">Logo A</p>
              <p className="text-white text-xl font-bold">Logo B</p>
              <p className="text-white text-xl font-bold">Logo C</p>
            </div>
            <div className="border-4 border-yellow-400 w-64 bg-gray-700 p-4">
              <p className="text-white text-xl font-bold">Description Content Here</p>
            </div>
          </div>
        </section>
      )}

        {currentSection === 2 && (
          <section className="mh1-section mh1-bg-accent" style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#334155' }}>
            <div className="mh1-content-wrapper" style={{ maxWidth: '1200px', width: '100%', padding: '2rem' }}>
              <h2 style={{ fontSize: '3rem', fontWeight: 'bold', textAlign: 'center', marginBottom: '5rem', color: 'white' }}>
                Impact By Numbers
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
                {[
                  { number: '50%', label: 'Increased Yield' },
                  { number: '30%', label: 'Water Reduction' },
                  { number: '100M+', label: 'Lives Impacted' },
                ].map((stat, i) => (
                  <div 
                    key={i}
                    style={{
                      textAlign: 'center',
                      padding: '2rem',
                      background: 'linear-gradient(135deg, #475569, #374151)',
                      borderRadius: '1rem',
                      transition: 'transform 0.3s'
                    }}
                  >
                    <div style={{ fontSize: '3.75rem', fontWeight: 'bold', color: '#f59e0b', marginBottom: '1rem' }}>{stat.number}</div>
                    <div style={{ fontSize: '1.25rem', color: '#cbd5e1' }}>{stat.label}</div>
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