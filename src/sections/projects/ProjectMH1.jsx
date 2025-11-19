import React, { useState, useEffect, useRef } from 'react';

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

  // Enhanced animation sequence
  useEffect(() => {
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
  }, []);

  // Handle drag during waiting phase with improved UI
  useEffect(() => {
    if (animationPhase !== 'waiting') return;

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
  }, [animationPhase]);

  // Unlock animation sequence
  useEffect(() => {
    if (animationPhase !== 'unlocking') return;

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
  }, [animationPhase]);

  // Fade out background and transition to next section
  useEffect(() => {
    if (animationPhase !== 'fadeout') return;

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
  }, [animationPhase]);

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
      <div className="corn-particle-background">
        {particles.map(p => (
          <div
            key={p.id}
            className="corn-particle"
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
    <div className="corn-navigation-dots">
      {Array.from({ length: totalSections }).map((_, i) => (
        <button
          key={i}
          onClick={() => {
            if (animationPhase === 'completed') {
              setCurrentSection(i);
            }
          }}
          className={`corn-nav-dot ${i === currentSection ? 'active' : ''}`}
          aria-label={`Go to section ${i + 1}`}
        />
      ))}
    </div>
  );

  // Unlock Animation Overlay
  const UnlockOverlay = () => {
    if (animationPhase !== 'unlocking') return null;

    return (
      <div className="corn-unlock-overlay">
        <div className="corn-unlock-circle" style={{ transform: `scale(${unlockProgress * 3})`, opacity: 1 - unlockProgress }} />
        <div className="corn-unlock-ring" style={{ 
          transform: `scale(${0.5 + unlockProgress * 1.5}) rotate(${unlockProgress * 360}deg)`,
          opacity: 1 - unlockProgress 
        }} />
      </div>
    );
  };

  // Enhanced Drag Progress Indicator
  const DragProgressIndicator = () => {
    if (animationPhase !== 'waiting' || dragProgressRef.current === 0) return null;

    return (
      <div className="corn-drag-progress" style={{
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
      className="corn-revolution-container"
      style={{
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
      }}
    >
      {/* <ParticleBackground /> */}
      <NavigationDots />
      <UnlockOverlay />
      <DragProgressIndicator />

      {/* Background Image with gradient mask */}
      <div 
        className="corn-background-wrapper"
        style={{
          opacity: backgroundFade,
          transition: 'opacity 0.8s ease-out'
        }}
      >
        <div 
          className="corn-background-image"
          style={{
            backgroundImage: "url('assets/projects/projectMH1/imageMH1_1.jpg')",
          }}
        />
        {/* Gradient overlay with controlled opacity */}
        <div 
          className="corn-background-gradient-mask"
          style={{
            opacity: gradientOpacity,
            transition: 'opacity 0.3s ease-out'
          }}
        />
      </div>

      <div 
        className="corn-section-container"
        style={{
          transform: `translateY(-${currentSection * 100}vh)`,
        }}
      >
        {/* Section 1: Hero with Animation */}
        <section className="corn-section">
          <div 
            ref={heroContentRef}
            className="corn-content-center"
            style={{ 
              opacity: titleOpacity,
              transition: 'opacity 0.8s ease-out'
            }}
          >
            <h1 className="corn-hero-title">
              Project MH1
            </h1>
            <p className="corn-hero-subtitle">
              Redefining Agriculture Through Genetic Innovation
            </p>
          </div>
          
          {animationPhase === 'waiting' && (
            <div className="corn-scroll-prompt">
              <div 
                className="corn-scroll-arrow" 
                style={{ 
                  transform: 'rotate(180deg)',
                  cursor: 'grab',
                  borderColor: dragProgressRef.current > 0 ? '#fbbf24' : '#f59e0b',
                  transition: 'border-color 0.2s ease'
                }} 
              />
              <p 
                className="text-yellow-400 mt-4 animate-pulse"
                style={{
                  cursor: 'grab',
                  color: dragProgressRef.current > 0 ? '#fbbf24' : '#f59e0b'
                }}
              >
                {dragProgressRef.current > 0 ? 'Keep dragging...' : 'Drag up to unlock'}
              </p>
            </div>
          )}
        </section>

        {/* Section 2: DNA Science */}
        <section className="corn-section">
          <div className="corn-content-wrapper">
            <div className="corn-grid-2col">
              <div className={currentSection >= 1 ? 'corn-slide-in-left' : 'opacity-0'}>
                <DNAHelix />
              </div>
              <div className={currentSection >= 1 ? 'corn-slide-in-right' : 'opacity-0'}>
                <h2 className="text-5xl font-bold mb-6 text-yellow-400">
                  The Science Behind Growth
                </h2>
                <p className="text-lg text-slate-300 mb-4 leading-relaxed">
                  Through cutting-edge genetic research, we're unlocking the full potential of corn. Our revolutionary approach combines traditional breeding with modern biotechnology to create crops that are more resilient, nutritious, and sustainable.
                </p>
                <p className="text-lg text-slate-300 leading-relaxed">
                  Each strand of DNA represents years of research, innovation, and commitment to feeding the future.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Statistics */}
        <section className="corn-section corn-bg-accent">
          <div className="corn-content-wrapper">
            <h2 className={`text-5xl font-bold text-center mb-20 ${currentSection >= 2 ? 'corn-fade-in-up' : 'opacity-0'}`}>
              Impact By Numbers
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { number: '50%', label: 'Increased Yield', delay: '0s' },
                { number: '30%', label: 'Water Reduction', delay: '0.2s' },
                { number: '100M+', label: 'Lives Impacted', delay: '0.4s' },
              ].map((stat, i) => (
                <div 
                  key={i}
                  className={`text-center p-8 bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl hover:scale-105 transition-transform duration-300 ${currentSection >= 2 ? 'corn-scale-in' : 'opacity-0'}`}
                  style={{ animationDelay: stat.delay }}
                >
                  <div className="text-6xl font-bold text-yellow-400 mb-4">{stat.number}</div>
                  <div className="text-xl text-slate-300">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 4: Innovation */}
        <section className="corn-section">
          <div className="corn-content-wrapper">
            <div className="corn-grid-2col">
              <div className={currentSection >= 3 ? 'corn-slide-in-left' : 'opacity-0'}>
                <h2 className="text-5xl font-bold mb-6 text-yellow-400">
                  Innovation Rooted in Nature
                </h2>
                <p className="text-lg text-slate-300 mb-6 leading-relaxed">
                  We believe the future of agriculture lies in understanding and enhancing nature's own processes. Our research focuses on:
                </p>
                <ul className="space-y-4">
                  {['Drought Resistance', 'Nutrient Enhancement', 'Climate Adaptation', 'Sustainable Practices'].map((item, i) => (
                    <li key={i} className="flex items-center text-lg text-slate-300">
                      <span className="w-2 h-2 bg-yellow-400 rounded-full mr-4"></span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className={`relative h-96 ${currentSection >= 3 ? 'corn-slide-in-right' : 'opacity-0'}`}>
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 to-amber-600/20 rounded-3xl backdrop-blur-sm flex items-center justify-center">
                  <div className="text-center">
                    <svg className="w-32 h-32 mx-auto mb-4 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
                    </svg>
                    <p className="text-2xl font-semibold text-yellow-400">Research in Progress</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: Footer/Contact */}
        <section className="corn-section corn-bg-dark">
          <div className="corn-content-center">
            <h3 className={`text-5xl font-bold mb-6 text-yellow-400 ${currentSection >= 4 ? 'corn-fade-in-up' : 'opacity-0'}`}>
              Join the Revolution
            </h3>
            <p className={`text-xl text-slate-400 mb-12 ${currentSection >= 4 ? 'corn-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '0.2s' }}>
              Together, we're growing a better future.
            </p>
            <div className={`flex justify-center space-x-4 ${currentSection >= 4 ? 'corn-scale-in' : 'opacity-0'}`} style={{ animationDelay: '0.4s' }}>
              <button className="bg-slate-800 hover:bg-slate-700 px-8 py-4 rounded-lg transition-colors text-lg">
                Contact Us
              </button>
              <button className="bg-yellow-500 hover:bg-yellow-400 text-slate-900 px-8 py-4 rounded-lg transition-colors font-semibold text-lg">
                Get Started
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ProjectMH1;