// src/components/project/ProjectComponents.jsx
// FIXED: Background and gradient fade together using GSAP

import React, { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';

// ===================================
// HERO SECTION
// ===================================

/**
 * HeroBackground - GSAP-powered synchronized fade
 * Background image and gradient mask fade in together
 */
export const HeroBackground = ({ shouldAnimate = false, imagePath }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  
  const backgroundRef = useRef(null);
  const gradientRef = useRef(null);
  const hasAnimated = useRef(false);

  const handleImageLoad = () => {
    console.log('✅ Hero image loaded');
    setIsLoading(false);
  };

  const handleImageError = () => {
    console.error('❌ Hero image failed to load:', imagePath);
    setIsLoading(false);
    setHasError(true);
  };

  // GSAP animation when image is loaded and shouldAnimate is true
  useEffect(() => {
    if (!shouldAnimate || hasAnimated.current || isLoading) return;
    if (!backgroundRef.current || !gradientRef.current) return;

    console.log('🎬 GSAP: Animating background + gradient together');
    hasAnimated.current = true;

    // Set initial state (hidden)
    gsap.set([backgroundRef.current, gradientRef.current], {
      opacity: 0
    });

    // Animate both together
    gsap.to([backgroundRef.current, gradientRef.current], {
      opacity: 1,
      duration: 0.8,
      ease: 'power2.out',
      onComplete: () => {
        console.log('✅ GSAP: Background + gradient animation complete');
      }
    });

  }, [shouldAnimate, isLoading]);

  // Reset when returning to hero
  useEffect(() => {
    if (!shouldAnimate && hasAnimated.current) {
      console.log('🔄 GSAP: Resetting background animation');
      hasAnimated.current = false;
      if (backgroundRef.current && gradientRef.current) {
        gsap.set([backgroundRef.current, gradientRef.current], {
          opacity: 0
        });
      }
    }
  }, [shouldAnimate]);

  return (
    <>  
      <div className="project-background-wrapper">
        {/* Gradient Mask - Animated with GSAP */}
        <div 
          ref={gradientRef}
          className="project-background-gradient-mask"
        />
        
        {/* Background Image - Animated with GSAP */}
        <div 
          ref={backgroundRef}
          className="project-background-image"
          style={{ 
            backgroundImage: `url('${imagePath}')`,
          }}
        >
          {/* Hidden image for preloading */}
          <img
            src={imagePath}
            alt="Hero background"
            onLoad={handleImageLoad}
            onError={handleImageError}
            style={{ display: 'none' }}
          />
        </div>
      </div>

      {hasError && (
        <div className="project-background-error">
          <p>Failed to load background image</p>
        </div>
      )}
    </>
  );
};

/**
 * HeroContent - GSAP-powered title animation
 */
export const HeroContent = ({ shouldAnimate = false, title, subtitle }) => {
  const titleRef = useRef(null);
  const subtitleRef = useRef(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!shouldAnimate || hasAnimated.current) return;
    if (!titleRef.current || !subtitleRef.current) return;

    console.log('🎬 GSAP: Starting title animation');
    hasAnimated.current = true;

    // Create GSAP timeline
    const tl = gsap.timeline({
      defaults: {
        ease: 'power2.out',
        duration: 0.8
      }
    });

    // Set initial state (hidden, 30px up)
    gsap.set([titleRef.current, subtitleRef.current], {
      opacity: 0,
      y: -30
    });

    // Animate title and subtitle together
    tl.to([titleRef.current, subtitleRef.current], {
      opacity: 1,
      y: 0,
      stagger: 0.1,
      onComplete: () => {
        console.log('✅ GSAP: Title animation complete');
      }
    });

    return () => {
      tl.kill();
    };
  }, [shouldAnimate]);

  // Reset animation when component unmounts or returns to hero
  useEffect(() => {
    if (!shouldAnimate && hasAnimated.current) {
      console.log('🔄 GSAP: Resetting title animation');
      hasAnimated.current = false;
      if (titleRef.current && subtitleRef.current) {
        gsap.set([titleRef.current, subtitleRef.current], {
          opacity: 0,
          y: -30
        });
      }
    }
  }, [shouldAnimate]);

  return (
    <div className="project-content-center">
      <h1 
        ref={titleRef}
        className="project-hero-title"
      >
        {title}
      </h1>
      <p 
        ref={subtitleRef}
        className="project-hero-subtitle"
      >
        {subtitle}
      </p>
    </div>
  );
};

// ===================================
// IMAGE SLIDER SECTION
// ===================================

export const ImageSlider = () => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  const leftImage = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop';
  const rightImage = 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&h=600&fit=crop';

  const handleMove = (clientX) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);

  const handleMouseMove = (e) => {
    if (isDragging) handleMove(e.clientX);
  };

  const handleTouchMove = (e) => {
    if (isDragging) handleMove(e.touches[0].clientX);
  };

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div 
      ref={containerRef}
      className="image-slider-container"
      onClick={(e) => handleMove(e.clientX)}
    >
      <div className="image-slider-base">
        <img 
          src={rightImage}
          alt="After"
          className="image-slider-img"
          draggable={false}
        />
        <div className="image-slider-label image-slider-label-right">
          After
        </div>
      </div>

      <div 
        className="image-slider-overlay"
        style={{
          clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
          transition: isDragging ? 'none' : 'clip-path 0.1s ease-out'
        }}
      >
        <img 
          src={leftImage}
          alt="Before"
          className="image-slider-img"
          draggable={false}
        />
        <div className="image-slider-label image-slider-label-left">
          Before
        </div>
      </div>

      <div 
        className="image-slider-handle"
        style={{
          left: `${sliderPosition}%`,
          transition: isDragging ? 'none' : 'left 0.1s ease-out'
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
      >
        <div className="image-slider-handle-circle">
          <div className="image-slider-arrow-left" />
          <div className="image-slider-arrow-right" />
        </div>
      </div>

      <div className="image-slider-percentage">
        {Math.round(sliderPosition)}% | {Math.round(100 - sliderPosition)}%
      </div>
    </div>
  );
};