// src/components/project/ProjectComponents.jsx
// FIXED: Using GSAP for smooth timeline animations

import React, { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';

// ===================================
// HERO SECTION
// ===================================

export const HeroBackground = ({ backgroundFade, imagePath }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleImageLoad = () => {
    console.log('✅ Hero image loaded');
    setIsLoading(false);
  };

  const handleImageError = () => {
    console.error('❌ Hero image failed to load:', imagePath);
    setIsLoading(false);
    setHasError(true);
  };

  return (
    <>  
      <div className="project-background-wrapper">
        <div className="project-background-gradient-mask" />
        
        <div 
          className="project-background-image"
          style={{ 
            backgroundImage: `url('${imagePath}')`,
            opacity: isLoading ? 0 : backgroundFade
          }}
        >
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
 * HeroContent - GSAP-powered animation
 * Automatically animates when shouldAnimate prop changes
 */
export const HeroContent = ({ shouldAnimate = false, title, subtitle }) => {
  const titleRef = useRef(null);
  const subtitleRef = useRef(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    // Only animate once when shouldAnimate becomes true
    if (!shouldAnimate || hasAnimated.current) return;
    if (!titleRef.current || !subtitleRef.current) return;

    console.log('🎬 GSAP: Starting hero animation');
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
      stagger: 0.1, // Subtitle starts 0.1s after title
      onComplete: () => {
        console.log('✅ GSAP: Hero animation complete');
      }
    });

    // Cleanup
    return () => {
      tl.kill();
    };
  }, [shouldAnimate]);

  // Reset animation when component unmounts or returns to hero
  useEffect(() => {
    if (!shouldAnimate && hasAnimated.current) {
      console.log('🔄 GSAP: Resetting animation');
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
    if (isDragging) handleMove(e.touches[0].clientY);
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