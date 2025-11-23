import React, { useState, useEffect, useRef, useCallback } from 'react';
import { carouselMH1 } from '../constants/projects.js';

const Carousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [targetIndex, setTargetIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const [clonePosition, setClonePosition] = useState({ top: 0, left: 0, width: 0, height: 0 });
  const containerRef = useRef(null);
  const itemRefs = useRef([]);
  const zoomRef = useRef(null);
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

  // Navigation functions with smooth animation
  const goToNext = useCallback(() => {
    if (isAnimating) return;
    setTargetIndex(prev => (prev + 1) % totalItems);
  }, [isAnimating, totalItems]);

  const goToPrev = useCallback(() => {
    if (isAnimating) return;
    setTargetIndex(prev => (prev - 1 + totalItems) % totalItems);
  }, [isAnimating, totalItems]);

  const goToSlide = useCallback((index) => {
    if (isAnimating || index === currentIndex) return;
    setTargetIndex(index);
  }, [isAnimating, currentIndex]);

  // Handle image hover and create clone
  const handleImageHover = useCallback((index, event) => {
    if (isAnimating || isZoomed) return;
    
    const itemElement = itemRefs.current[index];
    if (!itemElement) return;

    // Get the position and size of the original image
    const rect = itemElement.getBoundingClientRect();
    
    setHoveredIndex(index);
    setClonePosition({
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height
    });

    // Start zoom after delay
    setTimeout(() => {
      if (hoveredIndex === index) {
        setIsZoomed(true);
      }
    }, 300);
  }, [isAnimating, isZoomed, hoveredIndex]);

  const handleImageLeave = useCallback(() => {
    setHoveredIndex(null);
  }, []);

  // Handle zoom close when clicking outside
  const handleZoomClose = useCallback((event) => {
    if (isZoomed && zoomRef.current && !zoomRef.current.contains(event.target)) {
      setIsZoomed(false);
      setHoveredIndex(null);
    }
  }, [isZoomed]);

  // Close zoom with Escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && isZoomed) {
        setIsZoomed(false);
        setHoveredIndex(null);
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('mousedown', handleZoomClose);

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleZoomClose);
    };
  }, [isZoomed, handleZoomClose]);

  // Animate from currentIndex to targetIndex
  useEffect(() => {
    if (currentIndex === targetIndex) return;

    setIsAnimating(true);
    
    // Calculate the shortest path (considering loop)
    let diff = targetIndex - currentIndex;
    if (Math.abs(diff) > totalItems / 2) {
      diff = diff > 0 ? diff - totalItems : diff + totalItems;
    }

    // Animate through each intermediate step
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
    
    // Adjust for infinite loop - find the closest position
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
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') goToPrev();
      if (e.key === 'ArrowRight') goToNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToPrev, goToNext]);

  const currentItem = carouselData[currentIndex];
  const zoomedItem = hoveredIndex !== null ? carouselData[hoveredIndex] : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
      <div className="carousel-3d-container" ref={containerRef}>
        <div className="carousel-3d-stage">
          {carouselData.map((item, index) => {
            const style = getItemStyle(index);
            return (
              <div
                key={item.id}
                ref={el => itemRefs.current[index] = el}
                className={`carousel-3d-item ${style.className}`}
                style={style}
                onClick={() => style.className === 'side' && goToSlide(index)}
                onMouseEnter={(e) => handleImageHover(index, e)}
                onMouseLeave={handleImageLeave}
              >
                <div className="carousel-3d-item-inner">
                  <img src={item.image} alt={item.title} loading="lazy" />
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
            disabled={isAnimating}
            aria-label="Previous slide"
          >
            <svg viewBox="0 0 24 24">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
            </svg>
          </button>
          <button 
            className="carousel-arrow" 
            onClick={goToNext}
            disabled={isAnimating}
            aria-label="Next slide"
          >
            <svg viewBox="0 0 24 24">
              <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Zoom Overlay with Clone Animation */}
      {isZoomed && zoomedItem && (
        <div className="carousel-zoom-overlay">
          <div 
            ref={zoomRef}
            className="carousel-zoom-clone"
            style={{
              '--start-top': `${clonePosition.top}px`,
              '--start-left': `${clonePosition.left}px`,
              '--start-width': `${clonePosition.width}px`,
              '--start-height': `${clonePosition.height}px`,
            }}
          >
            <img 
              src={zoomedItem.image} 
              alt={zoomedItem.title}
              className="carousel-zoom-image"
            />
            <div className="carousel-zoom-info">
              <h3>{zoomedItem.title}</h3>
              <p>{zoomedItem.description}</p>
            </div>
            <button 
              className="carousel-zoom-close"
              onClick={() => {
                setIsZoomed(false);
                setHoveredIndex(null);
              }}
              aria-label="Close zoom"
            >
              <svg viewBox="0 0 24 24">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      <div className="carousel-description">
        <h3>{currentItem.title}</h3>
        <p>{currentItem.description}</p>
        <div className="carousel-indicators">
          {carouselData.map((_, index) => (
            <button
              key={index}
              className={`carousel-indicator ${index === currentIndex ? 'active' : ''}`}
              onClick={() => goToSlide(index)}
              disabled={isAnimating}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Carousel;