// src/sections/Carousel.jsx - LIQUID GLASS VERSION
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';

// Liquid-inspired position configurations
const LIQUID_POSITION_CONFIG = {
  '-2': { 
    translateX: -100, 
    translateZ: -500, 
    rotateY: -35, 
    scale: 0.65, 
    zIndex: 3, 
    opacity: 0.5, 
    blur: 8,
    brightness: 0.4,
    saturation: 0.8
  },
  '-1': { 
    translateX: -70, 
    translateZ: -250, 
    rotateY: -20, 
    scale: 0.8, 
    zIndex: 5, 
    opacity: 0.8, 
    blur: 4,
    brightness: 0.7,
    saturation: 0.9
  },
  0: { 
    translateX: 0, 
    translateZ: 0, 
    rotateY: 0, 
    scale: 1, 
    zIndex: 10, 
    opacity: 1, 
    blur: 0,
    brightness: 1,
    saturation: 1.1
  },
  1: { 
    translateX: 70, 
    translateZ: -250, 
    rotateY: 20, 
    scale: 0.8, 
    zIndex: 5, 
    opacity: 0.8, 
    blur: 4,
    brightness: 0.7,
    saturation: 0.9
  },
  2: { 
    translateX: 100, 
    translateZ: -500, 
    rotateY: 35, 
    scale: 0.65, 
    zIndex: 3, 
    opacity: 0.5, 
    blur: 8,
    brightness: 0.4,
    saturation: 0.8
  },
};

const ANIMATION_STATES = {
  HIDDEN: 'hidden',
  ENTERING: 'entering', 
  VISIBLE: 'visible',
  EXITING: 'exiting'
};

// Liquid gradient colors for glass effect
const LIQUID_GRADIENTS = [
  'linear-gradient(135deg, rgba(100, 149, 237, 0.2) 0%, rgba(138, 43, 226, 0.2) 100%)',
  'linear-gradient(135deg, rgba(255, 105, 180, 0.2) 0%, rgba(255, 215, 0, 0.2) 100%)',
  'linear-gradient(135deg, rgba(50, 205, 50, 0.2) 0%, rgba(32, 178, 170, 0.2) 100%)',
  'linear-gradient(135deg, rgba(220, 20, 60, 0.2) 0%, rgba(255, 69, 0, 0.2) 100%)',
];

// ==============================================
// LIQUID GLASS CAROUSEL COMPONENT
// ==============================================
const Carousel = ({ 
  carouselData = [],
  title = "Liquid Gallery",
  autoPlay = false,
  autoPlayInterval = 5000,
  showControls = true,
  showIndicators = true,
  className = "",
  liquidGradientIndex = 0, // Optional: Choose gradient
}) => {
  if (!Array.isArray(carouselData) || carouselData.length === 0) {
    return (
      <div className={`liquid-glass-empty ${className}`}>
        <div className="liquid-bubble animate-pulse"></div>
        <p className="text-white/60">No content to display</p>
      </div>
    );
  }

  const [currentIndex, setCurrentIndex] = useState(0);
  const [targetIndex, setTargetIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [zoomedImage, setZoomedImage] = useState(null);
  const [overlayAnimation, setOverlayAnimation] = useState(ANIMATION_STATES.HIDDEN);
  const [isHoveringCloseArea, setIsHoveringCloseArea] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [activeGradient] = useState(LIQUID_GRADIENTS[liquidGradientIndex % LIQUID_GRADIENTS.length]);
  
  const timeoutRefs = useRef({
    hover: null,
    closeHover: null,
    animation: null,
    autoPlay: null,
    mouseMove: null
  });
  
  const containerRef = useRef(null);
  const totalItems = carouselData.length;

  // === LIQUID MOUSE EFFECT ===
  const handleMouseMove = useCallback((e) => {
    if (!containerRef.current || zoomedImage) return;
    
    if (timeoutRefs.current.mouseMove) {
      clearTimeout(timeoutRefs.current.mouseMove);
    }
    
    timeoutRefs.current.mouseMove = setTimeout(() => {
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setMousePosition({ x, y });
    }, 10);
  }, [zoomedImage]);

  // === CLEANUP ===
  const clearAllTimeouts = useCallback(() => {
    Object.values(timeoutRefs.current).forEach(timeout => {
      if (timeout) clearTimeout(timeout);
    });
    timeoutRefs.current = { 
      hover: null, 
      closeHover: null, 
      animation: null,
      autoPlay: null,
      mouseMove: null 
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

  // === LIQUID TRANSITION ANIMATION ===
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
        setCurrentIndex(prev => {
          const next = (prev + direction + totalItems) % totalItems;
          return next;
        });
        step++;
        setTimeout(animateStep, 500); // Smooth liquid-like transition
      } else {
        setIsAnimating(false);
      }
    };

    animateStep();
  }, [targetIndex, currentIndex, totalItems]);

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

  // === LIQUID HOVER EFFECTS ===
  const handleMouseEnter = useCallback((index) => {
    if (zoomedImage) return;
    
    clearAllTimeouts();
    timeoutRefs.current.hover = setTimeout(() => {
      openZoom(carouselData[index]);
    }, 800); // Longer delay for more fluid feel
  }, [zoomedImage, carouselData, openZoom, clearAllTimeouts]);

  const handleMouseLeave = useCallback(() => {
    if (timeoutRefs.current.hover) {
      clearTimeout(timeoutRefs.current.hover);
      timeoutRefs.current.hover = null;
    }
  }, []);

  // === ITEM POSITIONING WITH LIQUID EFFECTS ===
  const getItemStyle = useCallback((index) => {
    let position = index - currentIndex;
    
    // Wrap-around logic
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
        transform: 'translate(-50%, -50%) translateZ(-800px) scale(0.4)',
        zIndex: 1,
        opacity: 0,
        filter: 'blur(12px) brightness(0.2) saturate(0.5)',
        className: 'liquid-hidden'
      };
    }

    const config = LIQUID_POSITION_CONFIG[position];
    const isCenter = Math.abs(position) === 0;
    
    // Subtle liquid wobble for center item
    const wobble = isCenter && !isAnimating ? 
      `rotateX(${(mousePosition.y - 50) * 0.1}deg) rotateY(${(mousePosition.x - 50) * 0.2}deg)` : 
      '';
    
    return {
      transform: `
        translate(-50%, -50%) 
        translateX(${config.translateX}%) 
        translateZ(${config.translateZ}px) 
        rotateY(${config.rotateY}deg) 
        scale(${config.scale})
        ${wobble}
      `.trim(),
      zIndex: config.zIndex,
      opacity: config.opacity,
      filter: `
        blur(${config.blur}px) 
        brightness(${config.brightness}) 
        saturate(${config.saturation})
      `.trim(),
      className: isCenter ? 'liquid-center' : 'liquid-side',
      '--liquid-blur': `${config.blur}px`,
    };
  }, [currentIndex, totalItems, isAnimating, mousePosition]);

  // === RENDER ===
  const currentItem = carouselData[currentIndex];

  return (
    <>
      {/* LIQUID GLASS ZOOM OVERLAY */}
      {(zoomedImage || overlayAnimation !== ANIMATION_STATES.HIDDEN) && createPortal(
        <div 
          className={`liquid-zoom-overlay liquid-overlay-${overlayAnimation}`}
          onClick={() => overlayAnimation === ANIMATION_STATES.VISIBLE && closeZoom()}
        >
          {/* Animated liquid background */}
          <div className="liquid-background-animation">
            {[1, 2, 3].map(i => (
              <div 
                key={i}
                className={`liquid-bubble bubble-${i}`}
                style={{
                  background: activeGradient,
                  animationDelay: `${i * 0.5}s`
                }}
              />
            ))}
          </div>
          
          {/* Glass overlay */}
          <div className={`liquid-glass-overlay glass-${overlayAnimation}`} 
               style={{ background: activeGradient }} />
          
          {/* Close Areas with liquid effect */}
          {['top', 'bottom', 'left', 'right'].map(side => (
            <div 
              key={side}
              className={`liquid-close-area liquid-close-${side} liquid-area-${overlayAnimation}`}
              onMouseEnter={() => overlayAnimation === ANIMATION_STATES.VISIBLE && setIsHoveringCloseArea(true)}
              onMouseLeave={() => setIsHoveringCloseArea(false)}
              onClick={(e) => {
                e.stopPropagation();
                closeZoom();
              }}
            />
          ))}

          {/* Liquid close indicator */}
          {isHoveringCloseArea && overlayAnimation === ANIMATION_STATES.VISIBLE && (
            <div className="liquid-close-indicator">
              <div className="liquid-close-ripple"></div>
              <span>Release to close</span>
            </div>
          )}
          
          {/* Glass image container */}
          <div 
            className={`liquid-image-container liquid-container-${overlayAnimation}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="liquid-glass-border"></div>
            
            <img 
              src={zoomedImage?.image}
              alt={zoomedImage?.title}
              className={`liquid-zoom-image liquid-image-${overlayAnimation}`}
            />
            
            {/* Liquid reflection effect */}
            <div className="liquid-reflection"></div>
          </div>
        </div>,
        document.body
      )}

      {/* MAIN LIQUID CAROUSEL */}
      <div 
        ref={containerRef}
        className={`liquid-carousel-container ${className} ${
          overlayAnimation === ANIMATION_STATES.HIDDEN ? 'liquid-visible' : 
          overlayAnimation === ANIMATION_STATES.ENTERING ? 'liquid-fading' : 
          'liquid-hidden'
        }`}
        onMouseMove={handleMouseMove}
      >
        {/* Liquid glass title */}
        {title && (
          <div className="liquid-title-container">
            <h2 className="liquid-glass-title">{title}</h2>
            <div className="liquid-title-underline"></div>
          </div>
        )}
        
        {/* 3D Carousel Stage */}
        <div className="liquid-3d-stage">
          {/* Ambient liquid lights */}
          <div className="liquid-ambient-light" style={{ 
            left: `${mousePosition.x}%`,
            top: `${mousePosition.y}%`,
            background: activeGradient.replace('0.2)', '0.1)')
          }}></div>
          
          {/* Carousel Items */}
          <div className="liquid-3d-track">
            {carouselData.map((item, index) => {
              const style = getItemStyle(index);
              const isCenter = Math.abs(index - currentIndex) === 0;
              
              return (
                <div
                  key={item.id || index}
                  className={`liquid-3d-item ${style.className}`}
                  style={{
                    ...style,
                    pointerEvents: zoomedImage ? 'none' : 'auto',
                    transition: isCenter 
                      ? 'all 0.8s cubic-bezier(0.19, 1, 0.22, 1)' 
                      : 'all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                    '--liquid-glow': isCenter ? '1' : '0.3',
                  }}
                  onMouseEnter={() => handleMouseEnter(index)}
                  onMouseLeave={handleMouseLeave}
                >
                  {/* Liquid glass frame */}
                  <div className="liquid-glass-frame" style={{ background: activeGradient }}>
                    <div className="liquid-inner-glow"></div>
                  </div>
                  
                  {/* Image with liquid border */}
                  <div className="liquid-image-wrapper">
                    <img 
                      src={item.image} 
                      alt={item.title || `Slide ${index + 1}`}
                      loading="lazy"
                      draggable="false"
                      className="liquid-item-image"
                    />
                    <div className="liquid-image-overlay"></div>
                  </div>
                  
                  {/* Floating label for center item */}
                  {isCenter && (
                    <div className="liquid-item-label">
                      <span>{item.title}</span>
                      <div className="liquid-label-tail"></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Liquid Navigation Controls */}
          {showControls && (
            <div className="liquid-controls">
              <button 
                className="liquid-control-btn liquid-control-prev"
                onClick={goToPrev}
                disabled={!canNavigate}
                aria-label="Previous slide"
              >
                <div className="liquid-control-inner">
                  <svg viewBox="0 0 24 24">
                    <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" 
                          fill="currentColor"/>
                  </svg>
                  <div className="liquid-control-ripple"></div>
                </div>
              </button>
              
              <div className="liquid-control-center">
                <div className="liquid-control-orb"></div>
              </div>
              
              <button 
                className="liquid-control-btn liquid-control-next"
                onClick={goToNext}
                disabled={!canNavigate}
                aria-label="Next slide"
              >
                <div className="liquid-control-inner">
                  <svg viewBox="0 0 24 24">
                    <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" 
                          fill="currentColor"/>
                  </svg>
                  <div className="liquid-control-ripple"></div>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Liquid Description Panel */}
        <div className="liquid-description-panel">
          <div className="liquid-glass-panel" style={{ background: activeGradient }}>
            <div className="liquid-panel-content">
              <h3 className="liquid-item-title">{currentItem?.title || ''}</h3>
              <p className="liquid-item-description">{currentItem?.description || ''}</p>
              
              {/* Liquid Indicators */}
              {showIndicators && (
                <div className="liquid-indicators">
                  {carouselData.map((_, index) => {
                    const isActive = index === currentIndex;
                    return (
                      <button
                        key={index}
                        className={`liquid-indicator ${isActive ? 'liquid-indicator-active' : ''}`}
                        onClick={() => goToSlide(index)}
                        disabled={!canNavigate}
                        aria-label={`Go to slide ${index + 1}`}
                      >
                        <div className="liquid-indicator-inner">
                          <div className="liquid-indicator-drop"></div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          
          {/* Liquid drip effect at bottom */}
          <div className="liquid-drip-effect">
            {[...Array(5)].map((_, i) => (
              <div 
                key={i} 
                className="liquid-drip"
                style={{ animationDelay: `${i * 0.2}s` }}
              ></div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

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
  liquidGradientIndex: PropTypes.number,
};

Carousel.defaultProps = {
  carouselData: [],
  title: "Liquid Gallery",
  autoPlay: false,
  autoPlayInterval: 5000,
  showControls: true,
  showIndicators: true,
  className: "",
  liquidGradientIndex: 0,
};

export default Carousel;