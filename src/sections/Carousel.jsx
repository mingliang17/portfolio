import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { carouselMH1 } from '../constants/projects.js';

const Carousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [targetIndex, setTargetIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [zoomedImage, setZoomedImage] = useState(null);
  const [isHoveringCloseArea, setIsHoveringCloseArea] = useState(false);
  const [overlayAnimation, setOverlayAnimation] = useState('hidden'); // 'hidden' | 'entering' | 'visible' | 'exiting'
  
  const containerRef = useRef(null);
  const itemRefs = useRef([]);
  const hoverTimeoutRef = useRef(null);
  const closeHoverTimeoutRef = useRef(null);
  const animationTimeoutRef = useRef(null);
  
  const carouselData = carouselMH1;
  const totalItems = carouselData.length;

  // Position configuration
  const positionConfig = {
    '-2': { translateX: -100, translateZ: -500, rotateY: -40, scale: 0.7, zIndex: 3, opacity: 0.7, brightness: 0.4 },
    '-1': { translateX: -70, translateZ: -300, rotateY: -30, scale: 0.85, zIndex: 5, opacity: 1, brightness: 0.6 },
    0: { translateX: 0, translateZ: 0, rotateY: 0, scale: 1, zIndex: 10, opacity: 1, brightness: 1 },
    1: { translateX: 70, translateZ: -300, rotateY: 30, scale: 0.85, zIndex: 5, opacity: 1, brightness: 0.6 },
    2: { translateX: 100, translateZ: -500, rotateY: 40, scale: 0.7, zIndex: 3, opacity: 0.7, brightness: 0.4 },
  };

  // Navigation functions
  const goToNext = useCallback(() => {
    if (isAnimating || zoomedImage) return;
    setTargetIndex(prev => (prev + 1) % totalItems);
  }, [isAnimating, totalItems, zoomedImage]);

  const goToPrev = useCallback(() => {
    if (isAnimating || zoomedImage) return;
    setTargetIndex(prev => (prev - 1 + totalItems) % totalItems);
  }, [isAnimating, totalItems, zoomedImage]);

  const goToSlide = useCallback((index) => {
    if (isAnimating || index === currentIndex || zoomedImage) return;
    setTargetIndex(index);
  }, [isAnimating, currentIndex, zoomedImage]);

  // Enhanced zoom functions with animations
  const openZoom = useCallback((image) => {
    setZoomedImage(image);
    setOverlayAnimation('entering');
    
    // Clear any existing timeouts
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
    }
    
    // Transition to visible state after enter animation
    animationTimeoutRef.current = setTimeout(() => {
      setOverlayAnimation('visible');
    }, 300);
  }, []);

  const closeZoom = useCallback(() => {
    setOverlayAnimation('exiting');
    
    // Clear any existing timeouts
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
    }
    if (closeHoverTimeoutRef.current) {
      clearTimeout(closeHoverTimeoutRef.current);
    }
    
    // Remove overlay after exit animation
    animationTimeoutRef.current = setTimeout(() => {
      setZoomedImage(null);
      setOverlayAnimation('hidden');
      setIsHoveringCloseArea(false);
    }, 300);
  }, []);

  // Handle image hover
  const handleMouseEnter = useCallback((index) => {
    if (zoomedImage) return;
    
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    hoverTimeoutRef.current = setTimeout(() => {
      openZoom(carouselData[index]);
    }, 500);
  }, [zoomedImage, carouselData, openZoom]);

  const handleMouseLeave = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  }, []);

  // Handle hover over close areas (padded regions) - 100ms delay
  const handleCloseAreaEnter = useCallback(() => {
    if (overlayAnimation !== 'visible') return;
    
    setIsHoveringCloseArea(true);
    
    if (closeHoverTimeoutRef.current) {
      clearTimeout(closeHoverTimeoutRef.current);
    }
    
    closeHoverTimeoutRef.current = setTimeout(() => {
      closeZoom();
    }, 100);
  }, [overlayAnimation, closeZoom]);

  const handleCloseAreaLeave = useCallback(() => {
    if (closeHoverTimeoutRef.current) {
      clearTimeout(closeHoverTimeoutRef.current);
      closeHoverTimeoutRef.current = null;
    }
    setIsHoveringCloseArea(false);
  }, []);

  // Handle click on background
  const handleBackgroundClick = useCallback((e) => {
    if (overlayAnimation === 'visible') {
      closeZoom();
    }
  }, [overlayAnimation, closeZoom]);

  // Animate from currentIndex to targetIndex
  useEffect(() => {
    if (currentIndex === targetIndex) return;

    setIsAnimating(true);
    
    let diff = targetIndex - currentIndex;
    if (Math.abs(diff) > totalItems / 2) {
      diff = diff > 0 ? diff - totalItems : diff + totalItems;
    }

    let step = 0;
    const steps = Math.abs(diff);
    const direction = diff > 0 ? 1 : -1;
    
    const animateStep = () => {
      if (step < steps) {
        setCurrentIndex(prev => (prev + direction + totalItems) % totalItems);
        step++;
        setTimeout(animateStep, 400);
      } else {
        setIsAnimating(false);
      }
    };

    animateStep();
  }, [targetIndex, currentIndex, totalItems]);

  // Get item style based on position
  const getItemStyle = useCallback((index) => {
    let position = index - currentIndex;
    
    if (position < -2) {
      const altPosition = position + totalItems;
      if (altPosition <= 2) position = altPosition;
    }
    if (position > 2) {
      const altPosition = position - totalItems;
      if (altPosition >= -2) position = altPosition;
    }
    
    if (position < -2 || position > 2) {
      return {
        transform: 'translate(-50%, -50%) translateZ(-800px) scale(0.5)',
        zIndex: 1,
        opacity: 0,
        filter: 'brightness(0.2)',
        className: 'hidden'
      };
    }

    const config = positionConfig[position];
    return {
      transform: `translate(-50%, -50%) translateX(${config.translateX}%) translateZ(${config.translateZ}px) rotateY(${config.rotateY}deg) scale(${config.scale})`,
      zIndex: config.zIndex,
      opacity: config.opacity,
      filter: `brightness(${config.brightness})`,
      className: Math.abs(position) === 0 ? 'center' : 'side'
    };
  }, [currentIndex, totalItems]);

  // Keyboard navigation
  useEffect(() => {
    if (zoomedImage) return;

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') goToPrev();
      if (e.key === 'ArrowRight') goToNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToPrev, goToNext, zoomedImage]);

  // Escape key to close zoom
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && zoomedImage && overlayAnimation === 'visible') {
        closeZoom();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [zoomedImage, overlayAnimation, closeZoom]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      if (closeHoverTimeoutRef.current) {
        clearTimeout(closeHoverTimeoutRef.current);
      }
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, []);

  const currentItem = carouselData[currentIndex];

  return (
    <>
      {/* ENHANCED ZOOM OVERLAY - With smooth fade animations */}
      {(zoomedImage || overlayAnimation !== 'hidden') && createPortal(
        <div 
          className={`zoom-overlay zoom-overlay-${overlayAnimation}`}
          onClick={handleBackgroundClick}
        >
          {/* Background layer */}
          <div 
            className={`zoom-background zoom-background-${overlayAnimation}`}
            onClick={handleBackgroundClick}
          />
          
          {/* Close areas around the image */}
          <div 
            className={`zoom-close-area zoom-close-top zoom-close-area-${overlayAnimation}`}
            onMouseEnter={handleCloseAreaEnter}
            onMouseLeave={handleCloseAreaLeave}
          />
          
          <div 
            className={`zoom-close-area zoom-close-bottom zoom-close-area-${overlayAnimation}`}
            onMouseEnter={handleCloseAreaEnter}
            onMouseLeave={handleCloseAreaLeave}
          />
          
          <div 
            className={`zoom-close-area zoom-close-left zoom-close-area-${overlayAnimation}`}
            onMouseEnter={handleCloseAreaEnter}
            onMouseLeave={handleCloseAreaLeave}
          />
          
          <div 
            className={`zoom-close-area zoom-close-right zoom-close-area-${overlayAnimation}`}
            onMouseEnter={handleCloseAreaEnter}
            onMouseLeave={handleCloseAreaLeave}
          />

          {/* Visual indicator when hovering close areas */}
          {isHoveringCloseArea && overlayAnimation === 'visible' && (
            <div className="zoom-close-indicator">
              <div className="zoom-close-icon">✕</div>
              <span>Release to close</span>
            </div>
          )}
          
          {/* Main image content */}
          <div 
            className={`zoom-image-container zoom-image-container-${overlayAnimation}`}
            onClick={(e) => e.stopPropagation()}
            onMouseEnter={handleCloseAreaLeave}
          >
            <button 
              className={`zoom-close-btn zoom-close-btn-${overlayAnimation}`}
              onClick={(e) => {
                e.stopPropagation();
                closeZoom();
              }}
              aria-label="Close zoom view"
            >
              <svg viewBox="0 0 24 24">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
            
            <img 
              src={zoomedImage?.image}
              alt={zoomedImage?.title}
              className={`zoom-image zoom-image-${overlayAnimation}`}
            />
          </div>
        </div>,
        document.body
      )}

      {/* CAROUSEL with fade effects */}
      <div 
        className={`carousel-main-container ${
          overlayAnimation === 'hidden' ? 'carousel-visible' : 
          overlayAnimation === 'entering' ? 'carousel-fading-out' : 
          overlayAnimation === 'exiting' ? 'carousel-fading-in' : 
          'carousel-hidden'
        }`}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}
      >
        <div className="carousel-3d-container" ref={containerRef}>
          <div className="carousel-3d-stage">
            {carouselData.map((item, index) => {
              const style = getItemStyle(index);
              return (
                <div
                  key={item.id}
                  ref={el => itemRefs.current[index] = el}
                  className={`carousel-3d-item ${style.className}`}
                  style={{
                    ...style,
                    pointerEvents: zoomedImage ? 'none' : 'auto',
                  }}
                  onMouseEnter={() => handleMouseEnter(index)}
                  onMouseLeave={handleMouseLeave}
                >
                  <div className="carousel-3d-item-inner">
                    <img 
                      src={item.image} 
                      alt={item.title} 
                      loading="lazy"
                      draggable="false"
                      style={{
                        pointerEvents: 'none',
                        userSelect: 'none',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Navigation Arrows */}
          <div className="carousel-controls">
            <button 
              className="carousel-arrow" 
              onClick={goToPrev}
              disabled={isAnimating || zoomedImage}
              aria-label="Previous slide"
            >
              <svg viewBox="0 0 24 24">
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
              </svg>
            </button>
            <button 
              className="carousel-arrow" 
              onClick={goToNext}
              disabled={isAnimating || zoomedImage}
              aria-label="Next slide"
            >
              <svg viewBox="0 0 24 24">
                <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="carousel-description">
          <h3>{currentItem.title}</h3>
          <p>{currentItem.description}</p>
          <div className="carousel-indicators">
            {carouselData.map((_, index) => (
              <button
                key={index}
                className={`carousel-indicator ${index === currentIndex ? 'active' : ''}`}
                onClick={() => goToSlide(index)}
                disabled={isAnimating || zoomedImage}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default Carousel;