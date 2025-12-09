// src/sections/Carousel.jsx - UPDATED REUSABLE VERSION
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types'; // Optional: for type checking
import { ICONS } from '../assets/index.js';

// Position configurations as constants
const POSITION_CONFIG = {
  '-2': { translateX: -100, translateZ: -500, rotateY: -40, scale: 0.7, zIndex: 3, opacity: 0.7, brightness: 0.4 },
  '-1': { translateX: -70, translateZ: -300, rotateY: -30, scale: 0.85, zIndex: 5, opacity: 1, brightness: 0.6 },
  0: { translateX: 0, translateZ: 0, rotateY: 0, scale: 1, zIndex: 10, opacity: 1, brightness: 1 },
  1: { translateX: 70, translateZ: -300, rotateY: 30, scale: 0.85, zIndex: 5, opacity: 1, brightness: 0.6 },
  2: { translateX: 100, translateZ: -500, rotateY: 40, scale: 0.7, zIndex: 3, opacity: 0.7, brightness: 0.4 },
};

const ANIMATION_STATES = {
  HIDDEN: 'hidden',
  ENTERING: 'entering', 
  VISIBLE: 'visible',
  EXITING: 'exiting'
};

// ==============================================
// REUSABLE CAROUSEL COMPONENT
// ==============================================
const Carousel = ({ 
  carouselData = [],           // Required: Array of carousel items
  title = "Carousel",          // Optional: Carousel title
  autoPlay = false,            // Optional: Auto-play feature
  autoPlayInterval = 5000,     // Optional: Auto-play interval
  showControls = true,         // Optional: Show navigation controls
  showIndicators = true,       // Optional: Show slide indicators
  className = "",              // Optional: Additional CSS classes
}) => {
  // Validate data
  if (!Array.isArray(carouselData) || carouselData.length === 0) {
    console.warn('Carousel: No carousel data provided or data is empty');
    return (
      <div className={`carousel-empty ${className}`}>
        <p>No carousel items to display</p>
      </div>
    );
  }

  // Component state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [targetIndex, setTargetIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [zoomedImage, setZoomedImage] = useState(null);
  const [overlayAnimation, setOverlayAnimation] = useState(ANIMATION_STATES.HIDDEN);
  const [isHoveringCloseArea, setIsHoveringCloseArea] = useState(false);
  
  // Consolidated refs
  const timeoutRefs = useRef({
    hover: null,
    closeHover: null,
    animation: null,
    autoPlay: null
  });
  const itemRefs = useRef([]);
  
  const totalItems = carouselData.length;

  // === UTILITY: Clear all timeouts ===
  const clearAllTimeouts = useCallback(() => {
    Object.values(timeoutRefs.current).forEach(timeout => {
      if (timeout) clearTimeout(timeout);
    });
    timeoutRefs.current = { 
      hover: null, 
      closeHover: null, 
      animation: null,
      autoPlay: null 
    };
  }, []);

  // === NAVIGATION ===
  const canNavigate = useMemo(() => !isAnimating && !zoomedImage, [isAnimating, zoomedImage]);
  
  const goToNext = useCallback(() => {
    if (!canNavigate) return;
    setTargetIndex(prev => (prev + 1) % totalItems);
  }, [canNavigate, totalItems]);

  const goToPrev = useCallback(() => {
    if (!canNavigate) return;
    setTargetIndex(prev => (prev - 1 + totalItems) % totalItems);
  }, [canNavigate, totalItems]);

  const goToSlide = useCallback((index) => {
    if (!canNavigate || index === currentIndex) return;
    setTargetIndex(index);
  }, [canNavigate, currentIndex]);

  // === AUTO-PLAY ===
  useEffect(() => {
    if (!autoPlay || zoomedImage) return;

    const playNext = () => {
      goToNext();
      timeoutRefs.current.autoPlay = setTimeout(playNext, autoPlayInterval);
    };

    timeoutRefs.current.autoPlay = setTimeout(playNext, autoPlayInterval);
    
    return () => {
      if (timeoutRefs.current.autoPlay) {
        clearTimeout(timeoutRefs.current.autoPlay);
      }
    };
  }, [autoPlay, autoPlayInterval, goToNext, zoomedImage]);

  // === ZOOM MANAGEMENT ===
  const openZoom = useCallback((image) => {
    clearAllTimeouts();
    setZoomedImage(image);
    setOverlayAnimation(ANIMATION_STATES.ENTERING);
    
    timeoutRefs.current.animation = setTimeout(() => {
      setOverlayAnimation(ANIMATION_STATES.VISIBLE);
    }, 300);
  }, [clearAllTimeouts]);

  const closeZoom = useCallback(() => {
    clearAllTimeouts();
    setOverlayAnimation(ANIMATION_STATES.EXITING);
    
    timeoutRefs.current.animation = setTimeout(() => {
      setZoomedImage(null);
      setOverlayAnimation(ANIMATION_STATES.HIDDEN);
      setIsHoveringCloseArea(false);
    }, 300);
  }, [clearAllTimeouts]);

  // === HOVER HANDLERS ===
  const handleMouseEnter = useCallback((index) => {
    if (zoomedImage) return;
    
    clearAllTimeouts();
    timeoutRefs.current.hover = setTimeout(() => {
      openZoom(carouselData[index]);
    }, 500);
  }, [zoomedImage, carouselData, openZoom, clearAllTimeouts]);

  const handleMouseLeave = useCallback(() => {
    if (timeoutRefs.current.hover) {
      clearTimeout(timeoutRefs.current.hover);
      timeoutRefs.current.hover = null;
    }
  }, []);

  const handleCloseAreaEnter = useCallback(() => {
    if (overlayAnimation !== ANIMATION_STATES.VISIBLE) return;
    
    setIsHoveringCloseArea(true);
    
    if (timeoutRefs.current.closeHover) {
      clearTimeout(timeoutRefs.current.closeHover);
    }
    
    timeoutRefs.current.closeHover = setTimeout(() => {
      closeZoom();
    }, 100);
  }, [overlayAnimation, closeZoom]);

  const handleCloseAreaLeave = useCallback(() => {
    if (timeoutRefs.current.closeHover) {
      clearTimeout(timeoutRefs.current.closeHover);
      timeoutRefs.current.closeHover = null;
    }
    setIsHoveringCloseArea(false);
  }, []);

  // === ANIMATION SEQUENCE ===
  useEffect(() => {
    if (currentIndex === targetIndex) return;

    setIsAnimating(true);
    
    let diff = targetIndex - currentIndex;
    if (Math.abs(diff) > totalItems / 2) {
      diff = diff > 0 ? diff - totalItems : diff + totalItems;
    }

    const steps = Math.abs(diff);
    const direction = diff > 0 ? 1 : -1;
    let step = 0;
    
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

  // === ITEM POSITIONING ===
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

    const config = POSITION_CONFIG[position];
    return {
      transform: `translate(-50%, -50%) translateX(${config.translateX}%) translateZ(${config.translateZ}px) rotateY(${config.rotateY}deg) scale(${config.scale})`,
      zIndex: config.zIndex,
      opacity: config.opacity,
      filter: `brightness(${config.brightness})`,
      className: Math.abs(position) === 0 ? 'center' : 'side'
    };
  }, [currentIndex, totalItems]);

  // === KEYBOARD NAVIGATION ===
  useEffect(() => {
    if (zoomedImage) return;

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') goToPrev();
      if (e.key === 'ArrowRight') goToNext();
      if (e.key === 'Escape' && overlayAnimation === ANIMATION_STATES.VISIBLE) closeZoom();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToPrev, goToNext, zoomedImage, overlayAnimation, closeZoom]);

  // === CLEANUP ===
  useEffect(() => clearAllTimeouts, [clearAllTimeouts]);

  const currentItem = carouselData[currentIndex];

  return (
    <>
      {/* ZOOM OVERLAY */}
      {(zoomedImage || overlayAnimation !== ANIMATION_STATES.HIDDEN) && createPortal(
        <div 
          className={`zoom-overlay zoom-overlay-${overlayAnimation}`}
          onClick={() => overlayAnimation === ANIMATION_STATES.VISIBLE && closeZoom()}
        >
          <div className={`zoom-background zoom-background-${overlayAnimation}`} />
          
          {/* Close Areas */}
          {['top', 'bottom', 'left', 'right'].map(side => (
            <div 
              key={side}
              className={`zoom-close-area zoom-close-${side} zoom-close-area-${overlayAnimation}`}
              onMouseEnter={handleCloseAreaEnter}
              onMouseLeave={handleCloseAreaLeave}
            />
          ))}

          {/* Hover Indicator */}
          {isHoveringCloseArea && overlayAnimation === ANIMATION_STATES.VISIBLE && (
            <div className="zoom-close-indicator">
              <div className="zoom-close-icon">✕</div>
              <span>Release to close</span>
            </div>
          )}
          
          {/* Image Container */}
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
              <img src={ICONS.icons.close} alt="Close" />
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

      {/* CAROUSEL */}
      <div 
        className={`carousel-main-container ${className} ${
          overlayAnimation === ANIMATION_STATES.HIDDEN ? 'carousel-visible' : 
          overlayAnimation === ANIMATION_STATES.ENTERING ? 'carousel-fading-out' : 
          overlayAnimation === ANIMATION_STATES.EXITING ? 'carousel-fading-in' : 
          'carousel-hidden'
        }`}
      >
        {/* Optional Title */}
        {title && <h2 className="carousel-title">{title}</h2>}
        
        <div className="carousel-3d-container">
          <div className="carousel-3d-stage">
            {carouselData.map((item, index) => {
              const style = getItemStyle(index);
              return (
                <div
                  key={item.id || index}
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
                      alt={item.title || `Carousel item ${index + 1}`} 
                      loading="lazy"
                      draggable="false"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Navigation Controls (Conditional) */}
          {showControls && (
            <div className="carousel-controls">
              <button 
                className="carousel-arrow" 
                onClick={goToPrev}
                disabled={!canNavigate}
                aria-label="Previous slide"
              >
                <svg viewBox="0 0 24 24">
                  <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
                </svg>
              </button>
              <button 
                className="carousel-arrow" 
                onClick={goToNext}
                disabled={!canNavigate}
                aria-label="Next slide"
              >
                <svg viewBox="0 0 24 24">
                  <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Description & Indicators */}
        <div className="carousel-description">
          <h3>{currentItem?.title || ''}</h3>
          <p>{currentItem?.description || ''}</p>
          
          {/* Slide Indicators (Conditional) */}
          {showIndicators && (
            <div className="carousel-indicators">
              {carouselData.map((_, index) => (
                <button
                  key={index}
                  className={`carousel-indicator ${index === currentIndex ? 'active' : ''}`}
                  onClick={() => goToSlide(index)}
                  disabled={!canNavigate}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

// Prop Types for documentation and validation (optional)
Carousel.propTypes = {
  carouselData: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      image: PropTypes.string.isRequired,
      title: PropTypes.string,
      description: PropTypes.string,
    })
  ).isRequired,
  title: PropTypes.string,
  autoPlay: PropTypes.bool,
  autoPlayInterval: PropTypes.number,
  showControls: PropTypes.bool,
  showIndicators: PropTypes.bool,
  className: PropTypes.string,
};

// Default Props
Carousel.defaultProps = {
  carouselData: [],
  title: "Carousel",
  autoPlay: false,
  autoPlayInterval: 5000,
  showControls: true,
  showIndicators: true,
  className: "",
};

export default Carousel;