import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';

const ProjectMH1 = () => {
  const [currentSection, setCurrentSection] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [overlayEl, setOverlayEl] = useState(null);
  const [animationCompleted, setAnimationCompleted] = useState(false);
  const [waitingForInteraction, setWaitingForInteraction] = useState(false);
  const [unlockAnimation, setUnlockAnimation] = useState(false);
  const [dragProgress, setDragProgress] = useState(0);
  const totalSections = 5;

  const heroContentRef = useRef(null);
  const backgroundImageRef = useRef(null);
  const scrollIndicatorRef = useRef(null);
  const gradientOverlayRef = useRef(null);
  const interactionListenerRef = useRef(null);
  const dragContainerRef = useRef(null);

  useEffect(() => {
    setIsLoaded(true);
    
    // Initial animation sequence
    if (heroContentRef.current && backgroundImageRef.current && scrollIndicatorRef.current && gradientOverlayRef.current) {
      const timeline = gsap.timeline();
      
      // Fade in background image with initial gradient
      timeline.fromTo(backgroundImageRef.current,
        { opacity: 0 },
        { 
          opacity: 1, 
          duration: 1.2, 
          ease: "power2.out" 
        }
      );
      
      // Fade in title and description
      timeline.fromTo(heroContentRef.current,
        { opacity: 0, y: 50 },
        { 
          opacity: 1, 
          y: 0,
          duration: 3, 
          ease: "power2.out" 
        },
        "-=0.8"
      );
      
      // Animate scroll indicator with bounce effect
      timeline.fromTo(scrollIndicatorRef.current,
        { 
          opacity: 0,
          scale: 0.8,
          y: 20
        },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.8,
          ease: "back.out(1.7)",
          onComplete: () => {
            setWaitingForInteraction(true);
          }
        },
        "-=0.5"
      );
    }
  }, []);

  // Handle drag interaction
  useEffect(() => {
    if (!waitingForInteraction) return;

    let startY = 0;
    let currentY = 0;
    let isDragging = false;
    const dragThreshold = 150; // pixels to drag to unlock

    const handleTouchStart = (e) => {
      startY = e.touches[0].clientY;
      isDragging = true;
      document.body.style.overflow = 'hidden'; // Prevent page scroll
    };

    const handleTouchMove = (e) => {
      if (!isDragging) return;
      
      e.preventDefault();
      currentY = e.touches[0].clientY;
      const dragDistance = startY - currentY; // Positive = upward drag
      
      if (dragDistance > 0) {
        const progress = Math.min(dragDistance / dragThreshold, 1);
        setDragProgress(progress);
        
        // Update background gradient based on drag progress
        updateBackgroundGradient(progress);
        
        // Update scroll indicator position and scale
        updateScrollIndicator(progress);
      }
    };

    const handleTouchEnd = (e) => {
      if (!isDragging) return;
      
      isDragging = false;
      document.body.style.overflow = ''; // Restore scroll
      
      const dragDistance = startY - currentY;
      
      if (dragDistance >= dragThreshold) {
        triggerUnlockSequence();
      } else {
        // Reset if not enough drag
        resetDragAnimation();
      }
    };

    const handleMouseDown = (e) => {
      startY = e.clientY;
      isDragging = true;
      document.body.style.overflow = 'hidden';
      
      // Add mouse move and up listeners
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    };

    const handleMouseMove = (e) => {
      if (!isDragging) return;
      
      e.preventDefault();
      currentY = e.clientY;
      const dragDistance = startY - currentY;
      
      if (dragDistance > 0) {
        const progress = Math.min(dragDistance / dragThreshold, 1);
        setDragProgress(progress);
        
        // Update background gradient based on drag progress
        updateBackgroundGradient(progress);
        
        // Update scroll indicator position and scale
        updateScrollIndicator(progress);
      }
    };

    const handleMouseUp = (e) => {
      if (!isDragging) return;
      
      isDragging = false;
      document.body.style.overflow = '';
      
      // Remove mouse listeners
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      const dragDistance = startY - currentY;
      
      if (dragDistance >= dragThreshold) {
        triggerUnlockSequence();
      } else {
        // Reset if not enough drag
        resetDragAnimation();
      }
    };

    const updateBackgroundGradient = (progress) => {
      if (gradientOverlayRef.current) {
        // Reduce gradient opacity as user drags up
        const opacity = 1 - progress;
        gradientOverlayRef.current.style.opacity = opacity;
        
        // Also adjust background brightness for more dramatic effect
        const brightness = 0.7 + (progress * 0.3); // From 70% to 100%
        backgroundImageRef.current.style.filter = `brightness(${brightness})`;
      }
    };

    const updateScrollIndicator = (progress) => {
      if (scrollIndicatorRef.current) {
        // Move indicator up with drag
        const moveDistance = -progress * 100; // Move up to 100px
        scrollIndicatorRef.current.style.transform = `translateX(-50%) translateY(${moveDistance}px)`;
        
        // Scale down as user drags
        const scale = 1 - (progress * 0.3); // Scale down to 70%
        scrollIndicatorRef.current.style.scale = scale;
        
        // Change color based on progress
        const arrowIcon = scrollIndicatorRef.current.querySelector('.project-mh1-arrow-icon');
        if (arrowIcon) {
          const hueRotate = progress * 90; // Rotate hue based on progress
          arrowIcon.style.filter = `hue-rotate(${hueRotate}deg) brightness(${1 + progress})`;
        }
      }
    };

    const resetDragAnimation = () => {
      setDragProgress(0);
      
      // Reset background gradient
      if (gradientOverlayRef.current) {
        gsap.to(gradientOverlayRef.current, {
          opacity: 1,
          duration: 0.5,
          ease: "power2.out"
        });
      }
      
      // Reset background filter
      if (backgroundImageRef.current) {
        gsap.to(backgroundImageRef.current, {
          filter: "brightness(0.7)",
          duration: 0.5,
          ease: "power2.out"
        });
      }
      
      // Reset scroll indicator
      if (scrollIndicatorRef.current) {
        gsap.to(scrollIndicatorRef.current, {
          y: 0,
          scale: 1,
          duration: 0.5,
          ease: "back.out(1.7)"
        });
        
        const arrowIcon = scrollIndicatorRef.current.querySelector('.project-mh1-arrow-icon');
        if (arrowIcon) {
          gsap.to(arrowIcon, {
            filter: "hue-rotate(0deg) brightness(1)",
            duration: 0.5
          });
        }
      }
    };

    const triggerUnlockSequence = () => {
      if (waitingForInteraction && !unlockAnimation) {
        setWaitingForInteraction(false);
        setUnlockAnimation(true);
        
        // Remove interaction listeners
        if (interactionListenerRef.current) {
          interactionListenerRef.current();
        }

        // Unlock animation sequence
        const unlockTimeline = gsap.timeline();
        
        // Remove gradient overlay completely
        unlockTimeline.to(gradientOverlayRef.current, {
          opacity: 0,
          duration: 0.6,
          ease: "power2.inOut"
        });
        
        // Fully brighten background
        unlockTimeline.to(backgroundImageRef.current, {
          filter: "brightness(1)",
          duration: 0.8,
          ease: "power2.out"
        }, "-=0.6");
        
        // Scale up and fade out scroll indicator with glow effect
        unlockTimeline.to(scrollIndicatorRef.current, {
          scale: 2,
          opacity: 0,
          duration: 0.6,
          ease: "power2.out"
        }, "-=0.4");
        
        // Fade out title and description
        unlockTimeline.to(heroContentRef.current, {
          opacity: 0,
          y: -50,
          duration: 0.8,
          ease: "power2.inOut"
        }, "-=0.3");
        
        // Final transition to next section
        unlockTimeline.to({}, {
          duration: 0.5,
          onComplete: () => {
            setAnimationCompleted(true);
            setCurrentSection(1);
          }
        });
      }
    };

    // Add event listeners to the drag container
    const dragContainer = dragContainerRef.current;
    if (dragContainer) {
      dragContainer.addEventListener('touchstart', handleTouchStart, { passive: false });
      dragContainer.addEventListener('touchmove', handleTouchMove, { passive: false });
      dragContainer.addEventListener('touchend', handleTouchEnd);
      dragContainer.addEventListener('mousedown', handleMouseDown);
    }

    // Store cleanup function
    interactionListenerRef.current = () => {
      if (dragContainer) {
        dragContainer.removeEventListener('touchstart', handleTouchStart);
        dragContainer.removeEventListener('touchmove', handleTouchMove);
        dragContainer.removeEventListener('touchend', handleTouchEnd);
        dragContainer.removeEventListener('mousedown', handleMouseDown);
      }
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    return () => {
      if (interactionListenerRef.current) {
        interactionListenerRef.current();
      }
    };
  }, [waitingForInteraction, unlockAnimation]);

  // Handle reverse animation when scrolling back to first section
  useEffect(() => {
    if (currentSection === 0 && animationCompleted) {
      const reverseTimeline = gsap.timeline();
      
      // Reset drag progress
      setDragProgress(0);
      
      // Fade in gradient overlay
      reverseTimeline.to(gradientOverlayRef.current, {
        opacity: 1,
        duration: 0.8,
        ease: "power2.out"
      });
      
      // Reset background brightness
      reverseTimeline.to(backgroundImageRef.current, {
        filter: "brightness(0.7)",
        duration: 0.8,
        ease: "power2.out"
      }, "-=0.8");
      
      // Fade in title and description
      reverseTimeline.to(heroContentRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power2.out"
      }, "-=0.5");
      
      // Show scroll indicator again
      reverseTimeline.to(scrollIndicatorRef.current, {
        opacity: 1,
        scale: 1,
        y: 0,
        duration: 0.6,
        ease: "back.out(1.7)",
        onComplete: () => {
          setWaitingForInteraction(true);
        }
      }, "-=0.3");
    }
  }, [currentSection, animationCompleted]);

  // Rest of the component remains the same...
  // [Previous scroll logic, image zoom, navigation dots, etc.]

  return (
    <div className="project-mh1-container">
      {/* Navigation Dots and other components... */}

      {/* Background Image with initial dark filter */}
      <div 
        ref={backgroundImageRef}
        className="project-mh1-background-image"
        style={{
          backgroundImage: "url('/portfolio/assets/projects/projectMH1/imageMH1_1.jpg')",
          filter: "brightness(0.7)" // Initial dark filter
        }}
      />

      {/* Gradient Overlay for the background effect */}
      <div 
        ref={gradientOverlayRef}
        className="project-mh1-gradient-overlay"
      />

      {/* Drag Container - covers the entire first section */}
      {waitingForInteraction && (
        <div 
          ref={dragContainerRef}
          className="project-mh1-drag-container"
        />
      )}

      {/* Drag Progress Indicator */}
      {waitingForInteraction && dragProgress > 0 && (
        <div className="project-mh1-drag-progress">
          <div 
            className="project-mh1-progress-bar"
            style={{ width: `${dragProgress * 100}%` }}
          />
          <span className="project-mh1-progress-text">
            {Math.round(dragProgress * 100)}%
          </span>
        </div>
      )}

      <div 
        className="project-mh1-section-container"
        style={{
          transform: `translateY(-${currentSection * 100}vh)`,
        }}
      >
        {/* Section 1: Hero */}
        <section className="project-mh1-section">
          <div 
            ref={heroContentRef}
            className="project-mh1-content-center"
          >
            <h1 className="project-mh1-hero-title">
              Meinhardt I
            </h1>
            <p className="project-mh1-hero-subtitle">
              Large Factory Design (Internship Project)
            </p>
          </div>
          
          {/* Animated Scroll Indicator */}
          <div 
            ref={scrollIndicatorRef}
            className="project-mh1-scroll-indicator"
          >
            <div className="project-mh1-scroll-arrow">
              <svg className="project-mh1-arrow-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
            <p className="project-mh1-scroll-text">
              {waitingForInteraction ? "Drag up to unlock" : ""}
            </p>
          </div>
        </section>

        {/* Other sections... */}
      </div>
    </div>
  );
};

export default ProjectMH1;