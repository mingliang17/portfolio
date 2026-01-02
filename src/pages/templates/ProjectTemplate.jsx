// src/pages/templates/ProjectTemplate.jsx
// FIXED: Proper scroll detection and section management

import React, { useCallback, useState, useEffect, useRef } from 'react';
import { HeroContent, HeroBackground } from '../../components/project/ProjectComponents.jsx';
import gsap from 'gsap';

const ProjectTemplate = ({
  projectData,
  sections = [],
  onSectionChange = null,
}) => {
  if (!projectData) return <div className="project-error">Error: Project data not found</div>;
  if (!sections.length) return <div className="project-error">Error: No sections configured</div>;

  // Hero animation states
  const [heroUnlocked, setHeroUnlocked] = useState(false);
  const [animationPhase, setAnimationPhase] = useState('initial');
  
  const [gradientOpacity, setGradientOpacity] = useState(1);
  const [bgOpacity, setBgOpacity] = useState(0);
  const [bgScale, setBgScale] = useState(1.1);
  const [titleOpacity, setTitleOpacity] = useState(0);
  const [subtitleOpacity, setSubtitleOpacity] = useState(0);
  const [subtitleX, setSubtitleX] = useState(40);
  const [dragProgress, setDragProgress] = useState(0);

  // Navigation
  const [currentSection, setCurrentSection] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [sectionDragProgress, setSectionDragProgress] = useState({});
  const [scrollLocked, setScrollLocked] = useState(false);
  const [lockedSectionIndex, setLockedSectionIndex] = useState(-1);
  const [lockedScrollPosition, setLockedScrollPosition] = useState(0);
  const [sectionHeights, setSectionHeights] = useState({}); // Track section heights
  const [sectionOffsets, setSectionOffsets] = useState({}); // Track section top positions

  const heroRef = useRef(null);
  const contentRef = useRef(null);
  const sectionRefs = useRef([]);
  const isDragging = useRef(false);
  const dragStartY = useRef(0);
  const hasAnimated = useRef(false);
  const lastScrollY = useRef(0);
  const lastScrollTime = useRef(0);
  const scrollDirection = useRef('down');
  const isScrollingProgrammatically = useRef(false);
  const isDraggingSection = useRef(false);
  const scrollAnimationFrame = useRef(null);
  const sectionHeightRefs = useRef({});

  const DRAG_DISTANCE = 300;
  const SCROLL_THRESHOLD = 5; // Pixels to consider at bottom

  const heroSection = sections.find(s => s.type === 'hero');
  const nonHeroSections = sections.filter(s => s.type !== 'hero');

  // Track section heights and offsets
  useEffect(() => {
    if (!heroUnlocked || nonHeroSections.length === 0) return;

    const updateSectionMetrics = () => {
      const newHeights = {};
      const newOffsets = {};

      sectionRefs.current.forEach((ref, idx) => {
        if (!ref) return;

        const rect = ref.getBoundingClientRect();
        const sectionTop = window.scrollY + rect.top;
        
        newHeights[idx] = rect.height;
        newOffsets[idx] = {
          top: sectionTop,
          bottom: sectionTop + rect.height
        };

        // Store in ref for immediate access
        sectionHeightRefs.current[idx] = {
          height: rect.height,
          top: sectionTop,
          bottom: sectionTop + rect.height
        };
      });

      setSectionHeights(newHeights);
      setSectionOffsets(newOffsets);
    };

    // Initial measurement
    updateSectionMetrics();

    // Update on resize
    const handleResize = () => {
      updateSectionMetrics();
    };

    window.addEventListener('resize', handleResize);
    
    // Update after transitions
    const interval = setInterval(updateSectionMetrics, 500);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearInterval(interval);
    };
  }, [heroUnlocked, nonHeroSections.length]);

  // Initial hero animation
  useEffect(() => {
    if (hasAnimated.current || !heroSection) return;
    hasAnimated.current = true;

    const timeline = gsap.timeline({
      onComplete: () => setAnimationPhase('ready')
    });

    timeline.to({}, {
      duration: 1.2,
      onUpdate: function() {
        setBgOpacity(this.progress());
        setBgScale(1.1 - this.progress() * 0.1);
      }
    });

    timeline.to({}, {
      duration: 0.6,
      delay: 0.4,
      onUpdate: function() {
        setTitleOpacity(this.progress());
      }
    });

    timeline.to({}, {
      duration: 0.6,
      delay: 0.2,
      onUpdate: function() {
        setSubtitleOpacity(this.progress());
        setSubtitleX(40 - 40 * this.progress());
      }
    });
  }, [heroSection]);

  // Drag to unlock hero
  useEffect(() => {
    if (!heroRef.current || animationPhase !== 'ready' || heroUnlocked) return;

    const handleStart = (clientY) => {
      isDragging.current = true;
      dragStartY.current = clientY;
      setDragProgress(0);
    };

    const handleMove = (clientY) => {
      if (!isDragging.current) return;

      const delta = dragStartY.current - clientY;
      if (delta <= 0) return;

      const progress = Math.min(1, delta / DRAG_DISTANCE);
      setDragProgress(progress);

      setTitleOpacity(1 - progress);
      setSubtitleOpacity(1 - progress);
      setSubtitleX(40 * progress);
      setGradientOpacity(1 - progress);

      if (progress >= 1) {
        isDragging.current = false;
        setAnimationPhase('unlocking');
        unlockHero();
      }
    };

    const handleEnd = () => {
      if (isDragging.current && dragProgress < 1) {
        gsap.to({}, {
          duration: 0.3,
          onUpdate: function() {
            const reverseProgress = 1 - this.progress();
            setTitleOpacity(dragProgress + (1 - dragProgress) * this.progress());
            setSubtitleOpacity(dragProgress + (1 - dragProgress) * this.progress());
            setSubtitleX(40 * dragProgress * reverseProgress);
            setGradientOpacity(1 - dragProgress + dragProgress * reverseProgress);
          },
          onComplete: () => setDragProgress(0)
        });
      }
      isDragging.current = false;
    };

    const onMouseDown = (e) => handleStart(e.clientY);
    const onMouseMove = (e) => handleMove(e.clientY);
    const onMouseUp = () => handleEnd();
    const onTouchStart = (e) => handleStart(e.touches[0].clientY);
    const onTouchMove = (e) => handleMove(e.touches[0].clientY);
    const onTouchEnd = () => handleEnd();

    const hero = heroRef.current;
    hero.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    hero.addEventListener('touchstart', onTouchStart);
    hero.addEventListener('touchmove', onTouchMove);
    hero.addEventListener('touchend', onTouchEnd);

    return () => {
      hero.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      hero.removeEventListener('touchstart', onTouchStart);
      hero.removeEventListener('touchmove', onTouchMove);
      hero.removeEventListener('touchend', onTouchEnd);
    };
  }, [animationPhase, heroUnlocked, dragProgress]);

  const unlockHero = () => {
    setAnimationPhase('unlocking');

    gsap.to({}, {
      duration: 0.8,
      delay: 0.5,
      onUpdate: function() {
        setBgOpacity(1 - this.progress());
      },
      onComplete: () => {
        setHeroUnlocked(true);
        setAnimationPhase('unlocked');
        setCurrentSection(1);
        
        setTimeout(() => {
          if (sectionRefs.current[0]) {
            isScrollingProgrammatically.current = true;
            transitionToSection(0, 'down');
          }
        }, 100);
      }
    });
  };

  const transitionToSection = (targetIndex, direction) => {
    if (isTransitioning || targetIndex < 0 || targetIndex >= nonHeroSections.length) return;

    const targetSection = nonHeroSections[targetIndex];
    if (!targetSection) return;

    setIsTransitioning(true);
    setCurrentSection(targetIndex + 1);
    setScrollLocked(false);
    setLockedSectionIndex(-1);

    const targetRef = sectionRefs.current[targetIndex];
    if (!targetRef) {
      setIsTransitioning(false);
      return;
    }

    const startScroll = window.scrollY;
    const targetRect = targetRef.getBoundingClientRect();
    const targetScroll = startScroll + targetRect.top;

    const duration = 800;
    const startTime = Date.now();

    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const eased = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      const currentScroll = startScroll + (targetScroll - startScroll) * eased;
      window.scrollTo(0, currentScroll);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setTimeout(() => {
          isScrollingProgrammatically.current = false;
          setIsTransitioning(false);
        }, 100);
      }
    };

    animate();
  };

  // NEW: Improved function to detect if at bottom of a long section
  const isAtBottomOfSection = (sectionIndex, scrollY) => {
    const sectionData = sectionHeightRefs.current[sectionIndex];
    if (!sectionData) return false;

    const viewportHeight = window.innerHeight;
    const sectionConfig = nonHeroSections[sectionIndex];
    
    if (sectionConfig.fitInViewport) {
      // For fit-in-viewport sections, we're at bottom when scrolled to it
      return Math.abs(scrollY + viewportHeight - sectionData.bottom) < SCROLL_THRESHOLD;
    } else {
      // For overflow sections, check if viewport bottom is near section bottom
      const distanceToBottom = sectionData.bottom - (scrollY + viewportHeight);
      return distanceToBottom <= SCROLL_THRESHOLD && distanceToBottom >= -SCROLL_THRESHOLD;
    }
  };

  // NEW: Check if next section is overlapping
  const isNextSectionOverlapping = (currentIndex, scrollY) => {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= nonHeroSections.length) return false;

    const currentData = sectionHeightRefs.current[currentIndex];
    const nextData = sectionHeightRefs.current[nextIndex];
    if (!currentData || !nextData) return false;

    const viewportHeight = window.innerHeight;
    const viewportBottom = scrollY + viewportHeight;
    
    // If viewport bottom is already showing next section content
    return viewportBottom > nextData.top;
  };

  // Enforce scroll lock
  useEffect(() => {
    if (!scrollLocked || lockedScrollPosition === 0) return;

    const enforceScrollLock = () => {
      if (isDraggingSection.current) return; // Allow drag movement
      
      const currentScroll = window.scrollY;
      if (Math.abs(currentScroll - lockedScrollPosition) > 5) {
        window.scrollTo(0, lockedScrollPosition);
      }
    };

    const handleWheel = (e) => {
      if (scrollLocked && !isDraggingSection.current) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const handleTouchMove = (e) => {
      if (scrollLocked && !isDraggingSection.current) {
        e.preventDefault();
      }
    };

    window.addEventListener('scroll', enforceScrollLock, { passive: true });
    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      window.removeEventListener('scroll', enforceScrollLock);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [scrollLocked, lockedScrollPosition]);

  // Main scroll handler with improved detection
  useEffect(() => {
    if (!heroUnlocked) return;

    const handleScroll = () => {
      if (scrollAnimationFrame.current) {
        cancelAnimationFrame(scrollAnimationFrame.current);
      }

      scrollAnimationFrame.current = requestAnimationFrame(() => {
        if (isScrollingProgrammatically.current || isTransitioning || isDraggingSection.current) return;

        const currentScrollY = window.scrollY;
        const direction = currentScrollY > lastScrollY.current ? 'down' : 'up';
        scrollDirection.current = direction;
        lastScrollY.current = currentScrollY;

        const viewportHeight = window.innerHeight;
        const viewportBottom = currentScrollY + viewportHeight;

        // Find which section we're currently in
        let currentSectionIndex = -1;
        
        for (let i = 0; i < nonHeroSections.length; i++) {
          const sectionData = sectionHeightRefs.current[i];
          if (!sectionData) continue;

          const sectionTop = sectionData.top;
          const sectionBottom = sectionData.bottom;

          // Check if viewport center is within this section
          const viewportCenter = currentScrollY + viewportHeight / 2;
          if (viewportCenter >= sectionTop && viewportCenter <= sectionBottom) {
            currentSectionIndex = i;
            break;
          }
        }

        // Update current section display
        if (currentSectionIndex !== -1 && currentSection !== currentSectionIndex + 1) {
          setCurrentSection(currentSectionIndex + 1);
        }

        // Check if we should lock scroll for overflow sections
        if (!scrollLocked && currentSectionIndex !== -1) {
          const sectionConfig = nonHeroSections[currentSectionIndex];
          
          if (!sectionConfig.fitInViewport && direction === 'down') {
            // Check if we're at the bottom of this overflow section
            if (isAtBottomOfSection(currentSectionIndex, currentScrollY)) {
              const sectionData = sectionHeightRefs.current[currentSectionIndex];
              
              if (sectionData) {
                const lockPosition = sectionData.bottom - viewportHeight;
                
                console.log('🔒 Locking scroll at section', currentSectionIndex, 
                  'position:', lockPosition, 
                  'section bottom:', sectionData.bottom,
                  'viewport bottom:', viewportBottom);
                
                setScrollLocked(true);
                setLockedSectionIndex(currentSectionIndex);
                setLockedScrollPosition(lockPosition);
                
                // Smoothly lock to position
                window.scrollTo({
                  top: lockPosition,
                  behavior: 'smooth'
                });
              }
            }
          }
        }

        // Check if we should unlock (scrolling up from locked position)
        if (scrollLocked && direction === 'up') {
          const currentSectionData = sectionHeightRefs.current[lockedSectionIndex];
          
          if (currentSectionData) {
            const distanceFromBottom = currentSectionData.bottom - viewportBottom;
            
            // If we're no longer at the bottom (scrolled up more than threshold)
            if (distanceFromBottom > SCROLL_THRESHOLD * 2) {
              console.log('🔓 Unlocking scroll - scrolled up from bottom');
              setScrollLocked(false);
              setLockedSectionIndex(-1);
              setLockedScrollPosition(0);
            }
          }
        }

        // Auto-transition for fit-in-viewport sections
        if (!scrollLocked && currentSectionIndex !== -1) {
          const sectionConfig = nonHeroSections[currentSectionIndex];
          
          if (sectionConfig.fitInViewport) {
            const sectionRef = sectionRefs.current[currentSectionIndex];
            if (!sectionRef) return;

            const rect = sectionRef.getBoundingClientRect();
            const viewportCenter = currentScrollY + viewportHeight / 2;
            const sectionTop = currentScrollY + rect.top;
            const sectionProgress = (viewportCenter - sectionTop) / rect.height;

            if (direction === 'down' && sectionProgress > 0.3) {
              const nextIndex = currentSectionIndex + 1;
              if (nextIndex < nonHeroSections.length && currentSection !== nextIndex + 1) {
                isScrollingProgrammatically.current = true;
                transitionToSection(nextIndex, 'down');
              }
            } else if (direction === 'up' && sectionProgress < 0.7 && currentSectionIndex > 0) {
              const prevIndex = currentSectionIndex - 1;
              if (currentSection !== prevIndex + 1) {
                isScrollingProgrammatically.current = true;
                transitionToSection(prevIndex, 'up');
              }
            }
          }
        }

        lastScrollTime.current = Date.now();
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollAnimationFrame.current) {
        cancelAnimationFrame(scrollAnimationFrame.current);
      }
    };
  }, [heroUnlocked, isTransitioning, currentSection, nonHeroSections, scrollLocked, lockedSectionIndex]);

  // Drag unlock for locked sections (improved)
  useEffect(() => {
    if (!scrollLocked || lockedSectionIndex < 0) return;

    const sectionIndex = lockedSectionIndex;
    let dragStart = 0;
    let currentDragProgress = 0;
    let isVerticalDrag = false;

    const handleStart = (clientY) => {
      isDraggingSection.current = true;
      isVerticalDrag = false;
      dragStart = clientY;
      currentDragProgress = 0;
      setSectionDragProgress(prev => ({ ...prev, [sectionIndex]: 0 }));
      console.log('🖱️ Started dragging section', sectionIndex);
    };

    const handleMove = (clientY, clientX) => {
      if (!isDraggingSection.current) return;

      const deltaY = dragStart - clientY;
      const deltaX = clientX ? Math.abs(dragStart - clientX) : 0;
      
      // Check if it's a vertical drag (not horizontal scroll)
      if (!isVerticalDrag && deltaX > 10) {
        // Horizontal movement detected, don't treat as drag-to-continue
        return;
      }
      
      if (deltaY <= 0) {
        // Dragging down - reset
        currentDragProgress = 0;
        setSectionDragProgress(prev => ({ ...prev, [sectionIndex]: 0 }));
        return;
      }

      isVerticalDrag = true;
      const progress = Math.min(1, deltaY / DRAG_DISTANCE);
      currentDragProgress = progress;
      setSectionDragProgress(prev => ({ ...prev, [sectionIndex]: progress }));

      console.log('📊 Drag progress:', Math.round(progress * 100) + '%');

      if (progress >= 1) {
        console.log('✅ Drag complete! Unlocking section');
        isDraggingSection.current = false;
        setScrollLocked(false);
        setLockedSectionIndex(-1);
        setLockedScrollPosition(0);
        
        const nextIndex = sectionIndex + 1;
        if (nextIndex < nonHeroSections.length) {
          isScrollingProgrammatically.current = true;
          setTimeout(() => {
            transitionToSection(nextIndex, 'down');
          }, 200);
        }
        setSectionDragProgress(prev => ({ ...prev, [sectionIndex]: 0 }));
      }
    };

    const handleEnd = () => {
      if (isDraggingSection.current) {
        console.log('🖱️ Ended drag, progress was:', Math.round(currentDragProgress * 100) + '%');
        
        if (currentDragProgress < 1 && currentDragProgress > 0) {
          // Snap back
          gsap.to({}, {
            duration: 0.3,
            onUpdate: function() {
              const newProgress = currentDragProgress * (1 - this.progress());
              setSectionDragProgress(prev => ({ ...prev, [sectionIndex]: newProgress }));
            },
            onComplete: () => {
              setSectionDragProgress(prev => ({ ...prev, [sectionIndex]: 0 }));
            }
          });
        }
      }
      isDraggingSection.current = false;
      isVerticalDrag = false;
    };

    const onMouseDown = (e) => handleStart(e.clientY);
    const onMouseMove = (e) => handleMove(e.clientY, e.clientX);
    const onMouseUp = () => handleEnd();
    const onTouchStart = (e) => {
      e.preventDefault();
      handleStart(e.touches[0].clientY);
    };
    const onTouchMove = (e) => {
      e.preventDefault();
      handleMove(e.touches[0].clientY, e.touches[0].clientX);
    };
    const onTouchEnd = (e) => {
      e.preventDefault();
      handleEnd();
    };

    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchstart', onTouchStart, { passive: false });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd, { passive: false });

    console.log('🎮 Drag handlers registered for section', sectionIndex);

    return () => {
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      console.log('🧹 Drag handlers removed for section', sectionIndex);
    };
  }, [scrollLocked, lockedSectionIndex, nonHeroSections]);

  // Nav dot click handler
  const handleNavDotClick = (index) => {
    if (isTransitioning) return;

    if (index === 0 && !heroUnlocked) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setCurrentSection(0);
    } else if (heroUnlocked) {
      const targetIndex = index - 1;
      if (targetIndex >= 0 && targetIndex < nonHeroSections.length) {
        setScrollLocked(false);
        setLockedSectionIndex(-1);
        setLockedScrollPosition(0);
        isScrollingProgrammatically.current = true;
        transitionToSection(targetIndex, index > currentSection ? 'down' : 'up');
      }
    }
  };

  const renderHeroSection = () => {
    if (!heroSection || heroUnlocked) return null;

    return (
      <section
        ref={heroRef}
        className="unified-hero-section"
        style={{
          cursor: animationPhase === 'ready' ? 'grab' : 'default',
        }}
      >
        <div className="hero-gradient" style={{ opacity: gradientOpacity }} />

        <div
          className="hero-background"
          style={{
            backgroundImage: `url('${heroSection.backgroundImage}')`,
            opacity: bgOpacity,
            transform: `scale(${bgScale})`
          }}
        />

        <div className="hero-content-wrapper">
          <h1 className="hero-title" style={{ opacity: titleOpacity }}>
            {heroSection.title}
          </h1>
          <p
            className="hero-subtitle"
            style={{
              opacity: subtitleOpacity,
              transform: `translateX(${subtitleX}px)`,
            }}
          >
            {heroSection.subtitle}
          </p>
        </div>

        {animationPhase === 'ready' && (
          <div className="drag-prompt">
            <div 
              className="drag-arrow"
              style={{
                borderRightColor: dragProgress > 0 ? '#fbbf24' : '#f59e0b',
                borderBottomColor: dragProgress > 0 ? '#fbbf24' : '#f59e0b',
              }}
            />
            <p className="drag-text">
              {dragProgress > 0 ? 'Keep dragging...' : 'Drag up to unlock'}
            </p>
            {dragProgress > 0 && (
              <div className="drag-progress">
                <div className="drag-progress-bar">
                  <div 
                    className="drag-progress-fill"
                    style={{ width: `${dragProgress * 100}%` }}
                  />
                </div>
                {Math.round(dragProgress * 100)}%
              </div>
            )}
          </div>
        )}
      </section>
    );
  };

  const renderContentSections = () => {
    if (!heroUnlocked) return null;

    return (
      <div ref={contentRef} className="unified-content-container">
        {nonHeroSections.map((section, index) => {
          const dragProg = sectionDragProgress[index] || 0;
          const showDragPrompt = scrollLocked && lockedSectionIndex === index;
          const sectionHeight = sectionHeights[index] || 0;

          return (
            <section
              key={index}
              ref={el => {
                sectionRefs.current[index] = el;
                // Update height ref when element changes
                if (el) {
                  const rect = el.getBoundingClientRect();
                  const sectionTop = window.scrollY + rect.top;
                  sectionHeightRefs.current[index] = {
                    height: rect.height,
                    top: sectionTop,
                    bottom: sectionTop + rect.height
                  };
                }
              }}
              className={`unified-section unified-section-${section.type} ${
                section.fitInViewport ? 'snap-section' : 'overflow-section'
              }`}
              data-section-type={section.type}
              data-section-index={index + 1}
              data-locked={showDragPrompt}
              style={{
                minHeight: section.fitInViewport ? '100vh' : 'auto',
                height: section.fitInViewport ? '100vh' : 'auto'
              }}
            >
              {section.component}

              {showDragPrompt && (
                <div className="section-drag-prompt">
                  <div 
                    className="drag-arrow"
                    style={{
                      borderRightColor: dragProg > 0 ? '#fbbf24' : '#f59e0b',
                      borderBottomColor: dragProg > 0 ? '#fbbf24' : '#f59e0b',
                    }}
                  />
                  <p className="drag-text">
                    {dragProg > 0 ? `${Math.round(dragProg * 100)}% - Keep dragging...` : 'Drag up to continue'}
                  </p>
                  {dragProg > 0 && (
                    <div className="drag-progress">
                      <div className="drag-progress-bar">
                        <div 
                          className="drag-progress-fill"
                          style={{ width: `${dragProg * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>
          );
        })}
      </div>
    );
  };

  const renderNavDots = () => {
    if (!heroUnlocked && currentSection === 0) return null;

    return (
      <div className="unified-nav-dots">
        {sections.map((_, index) => (
          <button
            key={index}
            className={`unified-nav-dot ${currentSection === index ? 'active' : ''}`}
            onClick={() => handleNavDotClick(index)}
            aria-label={`Go to section ${index + 1}`}
            disabled={isTransitioning}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="unified-project-container">
      {renderHeroSection()}
      {renderContentSections()}
      {renderNavDots()}

      {/* Debug info - optional */}
      {process.env.NODE_ENV === 'development' && (
        <div className="debug-info">
          <div>Current Section: {currentSection}</div>
          <div>Scroll Locked: {scrollLocked ? 'Yes' : 'No'}</div>
          <div>Locked Section: {lockedSectionIndex}</div>
          {Object.entries(sectionHeightRefs.current).map(([idx, data]) => (
            <div key={idx}>
              Section {idx}: Top={Math.round(data?.top)} Bottom={Math.round(data?.bottom)} Height={Math.round(data?.height)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectTemplate;