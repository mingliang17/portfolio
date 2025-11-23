import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { carouselMH1 } from '../constants/projects.js';

const Carousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [targetIndex, setTargetIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [zoomedImage, setZoomedImage] = useState(null);
  
  const containerRef = useRef(null);
  const itemRefs = useRef([]);
  const hoverTimeoutRef = useRef(null);
  
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

  // Handle image hover
  const handleMouseEnter = useCallback((index) => {
    console.log('🖱️ Mouse entered image:', index);
    
    if (zoomedImage) {
      console.log('⚠️ Already zoomed, ignoring');
      return;
    }
    
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    hoverTimeoutRef.current = setTimeout(() => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      console.log('🔍 ZOOMING:', {
        index,
        viewport: `${vw}px × ${vh}px`,
        target: `${Math.floor(vw * 0.9)}px × ${Math.floor(vh * 0.9)}px`,
        item: carouselData[index].title
      });
      setZoomedImage(carouselData[index]);
    }, 500);
  }, [zoomedImage, carouselData]);

  const handleMouseLeave = useCallback(() => {
    console.log('🖱️ Mouse left image');
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  }, []);

  const closeZoom = useCallback(() => {
    console.log('🚪 Closing zoom overlay');
    setZoomedImage(null);
  }, []);

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
      if (e.key === 'Escape' && zoomedImage) {
        closeZoom();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [zoomedImage, closeZoom]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const currentItem = carouselData[currentIndex];

  return (
    <>
      {/* ZOOM OVERLAY - Rendered to document.body via portal */}
      {zoomedImage && createPortal(
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            zIndex: 999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
          onClick={closeZoom}
          onMouseLeave={closeZoom}
        >
          <button 
            style={{
              position: 'fixed',
              top: '2rem',
              right: '2rem',
              width: '3.5rem',
              height: '3.5rem',
              borderRadius: '50%',
              backgroundColor: 'rgba(239, 68, 68, 0.9)',
              border: '2px solid #ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 1000000,
            }}
            onClick={(e) => {
              e.stopPropagation();
              closeZoom();
            }}
          >
            <svg viewBox="0 0 24 24" style={{ width: '1.5rem', height: '1.5rem', fill: 'white' }}>
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
          
          <div style={{
            width: `${Math.floor(window.innerWidth * 0.9)}px`,
            height: `${Math.floor(window.innerHeight * 0.9)}px`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}>
            <img 
              src={zoomedImage.image}
              alt={zoomedImage.title}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                width: 'auto',
                height: 'auto',
                objectFit: 'contain',
                borderRadius: '0.5rem',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)',
              }}
            />
            <div style={{
              position: 'absolute',
              bottom: '-5rem',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '90%',
              maxWidth: '800px',
              textAlign: 'center',
              background: 'rgba(0, 0, 0, 0.9)',
              padding: '1.5rem 2rem',
              borderRadius: '0.5rem',
              border: '1px solid rgba(245, 158, 11, 0.3)',
            }}>
              <h3 style={{ fontSize: '2rem', color: '#f59e0b', margin: '0 0 0.5rem 0' }}>
                {zoomedImage.title}
              </h3>
              <p style={{ color: '#cbd5e1', fontSize: '1.1rem', lineHeight: '1.6', margin: 0 }}>
                {zoomedImage.description}
              </p>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* CAROUSEL */}
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