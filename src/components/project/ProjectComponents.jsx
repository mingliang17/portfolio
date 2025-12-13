//Consolidated componenets used only in Project Pages

import React, { useState, useEffect, useRef } from 'react';

// ===================================
// HERO SECTION
// ===================================

export const HeroBackground = ({ backgroundFade, gradientOpacity, imagePath }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleImageLoad = () => {
    console.log('✅ Hero image loaded successfully');
    setIsLoading(false);
  };

  const handleImageError = () => {
    console.error('❌ Hero image failed to load:', imagePath);
    setIsLoading(false);
    setHasError(true);
  };

  return (
    <>
      {/* Loading Spinner */}
      {isLoading && (
        <div className="mh1-loading-overlay">
          <div className="mh1-loading-spinner" />
          <p className="mh1-loading-text">Loading Experience...</p>
        </div>
      )}

      {/* Background Image */}
      <div 
        className="mh1-background-wrapper"
        style={{ 
          opacity: isLoading ? 0 : backgroundFade,
          transition: 'opacity 0.8s ease-out'
        }}
      >
        <div 
          className="mh1-background-image"
          style={{ backgroundImage: `url('${imagePath}')` }}
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
        
        <div 
          className="mh1-background-gradient-mask"
          style={{ 
            opacity: gradientOpacity,
            transition: 'opacity 0.5s ease-out'
          }}
        />
      </div>

      {/* Error State */}
      {hasError && (
        <div className="mh1-background-error">
          <p>Failed to load background image</p>
        </div>
      )}
    </>
  );
};

// Hero Content (Animated Title & Subtitle)
export const HeroContent = ({ titleOpacity = 1, title, subtitle }) => (
  <div 
    className="mh1-content-center"
    style={{ 
      opacity: titleOpacity,
      transition: 'opacity 0.8s ease-out',
      transform: `translateY(${(1 - titleOpacity) * 20}px)`, // Subtle move up
      willChange: 'opacity, transform'
    }}
  >
    <h1 className="mh1-hero-title unselectable">
      {title}
    </h1>
    <p className="mh1-hero-subtitle unselectable">
      {subtitle}
    </p>
  </div>
);


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

  useEffect(() => {
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
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '900px',
        height: '600px',
        overflow: 'hidden',
        cursor: 'ew-resize',
        borderRadius: '12px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}
      onClick={(e) => handleMove(e.clientX)}
    >
      {/* Right Image (Base Layer) */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
      }}>
        <img 
          src={rightImage}
          alt="After"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            userSelect: 'none',
            pointerEvents: 'none',
          }}
          draggable={false}
        />
        <div style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          background: 'rgba(0,0,0,0.7)',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '20px',
          fontSize: '14px',
          fontWeight: 'bold',
        }}>
          After
        </div>
      </div>

      {/* Left Image (Clipped Layer) */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
        transition: isDragging ? 'none' : 'clip-path 0.1s ease-out',
      }}>
        <img 
          src={leftImage}
          alt="Before"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            userSelect: 'none',
            pointerEvents: 'none',
          }}
          draggable={false}
        />
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          background: 'rgba(0,0,0,0.7)',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '20px',
          fontSize: '14px',
          fontWeight: 'bold',
        }}>
          Before
        </div>
      </div>

      {/* Slider Handle */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: `${sliderPosition}%`,
          width: '4px',
          height: '100%',
          background: 'white',
          transform: 'translateX(-50%)',
          cursor: 'ew-resize',
          boxShadow: '0 0 10px rgba(0,0,0,0.5)',
          transition: isDragging ? 'none' : 'left 0.1s ease-out',
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
      >
        {/* Handle Circle */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '48px',
          height: '48px',
          background: 'white',
          borderRadius: '50%',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'grab',
        }}>
          {/* Left Arrow */}
          <div style={{
            position: 'absolute',
            left: '12px',
            width: '0',
            height: '0',
            borderTop: '6px solid transparent',
            borderBottom: '6px solid transparent',
            borderRight: '8px solid #333',
          }} />
          
          {/* Right Arrow */}
          <div style={{
            position: 'absolute',
            right: '12px',
            width: '0',
            height: '0',
            borderTop: '6px solid transparent',
            borderBottom: '6px solid transparent',
            borderLeft: '8px solid #333',
          }} />
        </div>
      </div>

      {/* Percentage Indicator */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(0,0,0,0.7)',
        color: 'white',
        padding: '8px 16px',
        borderRadius: '20px',
        fontSize: '14px',
        fontWeight: 'bold',
      }}>
        {Math.round(sliderPosition)}% | {Math.round(100 - sliderPosition)}%
      </div>
    </div>
  );
};
