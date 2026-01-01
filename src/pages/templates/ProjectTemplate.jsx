// src/pages/templates/ProjectTemplate.jsx
// FIXED: Scroll lock at section bottom, drag to unlock

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
  const sectionDragRefs = useRef({});

  const DRAG_DISTANCE = 300;
  const SCROLL_THRESHOLD = 50;

  const heroSection = sections.find(s => s.type === 'hero');
  const nonHeroSections = sections.filter(s => s.type !== 'hero');

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

  // Scroll detection with lock for overflow sections
  useEffect(() => {
    if (!heroUnlocked) return;

    const handleScroll = (e) => {
      if (isScrollingProgrammatically.current || isTransitioning) return;

      const currentScrollY = window.scrollY;
      const direction = currentScrollY > lastScrollY.current ? 'down' : 'up';
      scrollDirection.current = direction;
      lastScrollY.current = currentScrollY;

      // Check if we should lock scroll
      if (!scrollLocked) {
        checkScrollLock();
      }

      const now = Date.now();
      if (now - lastScrollTime.current < 100) return;
      lastScrollTime.current = now;

      if (!scrollLocked) {
        detectSectionTransition();
      }
    };

    const checkScrollLock = () => {
      const viewportHeight = window.innerHeight;
      const scrollPos = window.scrollY;

      sectionRefs.current.forEach((ref, idx) => {
        if (!ref) return;

        const sectionConfig = nonHeroSections[idx];
        if (!sectionConfig || sectionConfig.fitInViewport) return;

        const rect = ref.getBoundingClientRect();
        const sectionBottom = scrollPos + rect.bottom;
        const viewportBottom = scrollPos + viewportHeight;

        // Check if at bottom of overflow section
        if (Math.abs(sectionBottom - viewportBottom) < 50 && scrollDirection.current === 'down') {
          console.log('🔒 Locking scroll at section', idx);
          setScrollLocked(true);
          setLockedSectionIndex(idx);
          
          // Prevent further scrolling
          window.scrollTo(0, sectionBottom - viewportHeight);
        }
      });
    };

    const detectSectionTransition = () => {
      const viewportHeight = window.innerHeight;
      const scrollPos = window.scrollY;

      let detectedSection = -1;
      let sectionProgress = 0;

      sectionRefs.current.forEach((ref, idx) => {
        if (!ref) return;

        const rect = ref.getBoundingClientRect();
        const sectionTop = scrollPos + rect.top;
        const sectionBottom = sectionTop + rect.height;

        const viewportCenter = scrollPos + viewportHeight / 2;
        if (viewportCenter >= sectionTop && viewportCenter <= sectionBottom) {
          detectedSection = idx;
          sectionProgress = (viewportCenter - sectionTop) / rect.height;
        }
      });

      if (detectedSection === -1) return;

      const currentSectionConfig = nonHeroSections[detectedSection];
      if (!currentSectionConfig) return;

      if (currentSectionConfig.fitInViewport) {
        const isScrollingDown = scrollDirection.current === 'down';
        const currentSectionIndex = detectedSection;

        if (isScrollingDown && sectionProgress > 0.3) {
          const nextIndex = currentSectionIndex + 1;
          if (nextIndex < nonHeroSections.length && currentSection !== nextIndex + 1) {
            isScrollingProgrammatically.current = true;
            transitionToSection(nextIndex, 'down');
          }
        }
        else if (!isScrollingDown && sectionProgress < 0.7 && currentSectionIndex > 0) {
          const prevIndex = currentSectionIndex - 1;
          if (currentSection !== prevIndex + 1) {
            isScrollingProgrammatically.current = true;
            transitionToSection(prevIndex, 'up');
          }
        }
      } else {
        if (currentSection !== detectedSection + 1) {
          setCurrentSection(detectedSection + 1);
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
    }, [heroUnlocked, isTransitioning, currentSection, nonHeroSections, scrollLocked]);
// Drag unlock for overflow sections at bottom
useEffect(() => {
if (lockedSectionIndex < 0) return;
const sectionIndex = lockedSectionIndex;
const sectionRef = sectionRefs.current[sectionIndex];
if (!sectionRef) return;

let isDraggingSection = false;
let dragStart = 0;

const handleStart = (clientY) => {
  if (!scrollLocked || lockedSectionIndex !== sectionIndex) return;
  isDraggingSection = true;
  dragStart = clientY;
  setSectionDragProgress(prev => ({ ...prev, [sectionIndex]: 0 }));
};

const handleMove = (clientY) => {
  if (!isDraggingSection) return;

  const delta = dragStart - clientY;
  if (delta <= 0) {
    // Dragging down - reset
    isDraggingSection = false;
    setSectionDragProgress(prev => ({ ...prev, [sectionIndex]: 0 }));
    return;
  }

  const progress = Math.min(1, delta / DRAG_DISTANCE);
  setSectionDragProgress(prev => ({ ...prev, [sectionIndex]: progress }));

  if (progress >= 1) {
    isDraggingSection = false;
    setScrollLocked(false);
    setLockedSectionIndex(-1);
    
    const nextIndex = sectionIndex + 1;
    if (nextIndex < nonHeroSections.length) {
      isScrollingProgrammatically.current = true;
      setTimeout(() => {
        transitionToSection(nextIndex, 'down');
      }, 300);
    }
    setSectionDragProgress(prev => ({ ...prev, [sectionIndex]: 0 }));
  }
};

const handleEnd = () => {
  if (isDraggingSection) {
    const progress = sectionDragProgress[sectionIndex] || 0;
    if (progress < 1) {
      gsap.to({}, {
        duration: 0.3,
        onUpdate: function() {
          const newProgress = progress * (1 - this.progress());
          setSectionDragProgress(prev => ({ ...prev, [sectionIndex]: newProgress }));
        },
        onComplete: () => {
          setSectionDragProgress(prev => ({ ...prev, [sectionIndex]: 0 }));
        }
      });
    }
  }
  isDraggingSection = false;
};

const onMouseDown = (e) => handleStart(e.clientY);
const onMouseMove = (e) => handleMove(e.clientY);
const onMouseUp = () => handleEnd();
const onTouchStart = (e) => handleStart(e.touches[0].clientY);
const onTouchMove = (e) => handleMove(e.touches[0].clientY);
const onTouchEnd = () => handleEnd();

window.addEventListener('mousedown', onMouseDown);
window.addEventListener('mousemove', onMouseMove);
window.addEventListener('mouseup', onMouseUp);
window.addEventListener('touchstart', onTouchStart);
window.addEventListener('touchmove', onTouchMove);
window.addEventListener('touchend', onTouchEnd);

return () => {
  window.removeEventListener('mousedown', onMouseDown);
  window.removeEventListener('mousemove', onMouseMove);
  window.removeEventListener('mouseup', onMouseUp);
  window.removeEventListener('touchstart', onTouchStart);
  window.removeEventListener('touchmove', onTouchMove);
  window.removeEventListener('touchend', onTouchEnd);
};
}, [lockedSectionIndex, scrollLocked, sectionDragProgress, nonHeroSections]);
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

      return (
        <section
          key={index}
          ref={el => sectionRefs.current[index] = el}
          className={`unified-section unified-section-${section.type} ${
            section.fitInViewport ? 'snap-section' : 'overflow-section'
          }`}
          data-section-type={section.type}
          data-section-index={index + 1}
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
                {dragProg > 0 ? 'Keep dragging...' : 'Drag up to continue'}
              </p>
              {dragProg > 0 && (
                <div className="drag-progress">
                  <div className="drag-progress-bar">
                    <div 
                      className="drag-progress-fill"
                      style={{ width: `${dragProg * 100}%` }}
                    />
                  </div>
                  {Math.round(dragProg * 100)}%
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
</div>
);
};
export default ProjectTemplate;