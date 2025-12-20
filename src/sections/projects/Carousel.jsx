// src/sections/projects/Carousel.jsx
// FIXED MAGNIFIER - Now works at any zoom level (0.5x to 100x+)

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ICONS } from '../../assets/index.js';

const POSITIONS = {
  '-2': { x: -100, z: -500, rotateY: -35, scale: 0.65, opacity: 0.5, blur: 8 },
  '-1': { x: -70, z: -250, rotateY: -20, scale: 0.8, opacity: 0.8, blur: 4 },
  0: { x: 0, z: 0, rotateY: 0, scale: 1, opacity: 1, blur: 0 },
  1: { x: 70, z: -250, rotateY: 20, scale: 0.8, opacity: 0.8, blur: 4 },
  2: { x: 100, z: -500, rotateY: 35, scale: 0.65, opacity: 0.5, blur: 8 }
};

const Carousel = ({ 
  carouselData = [], 
  title = 'Gallery', 
  autoPlay = false, 
  showControls = true, 
  showIndicators = true 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [zoomedImage, setZoomedImage] = useState(null);
  const [itemRect, setItemRect] = useState(null);

  const [magnifyActive, setMagnifyActive] = useState(false);
  const [magnifyPosition, setMagnifyPosition] = useState({ x: 0, y: 0 });
  // FIXED: Store pixel offsets AND rendered dimensions
  const [magnifyOffset, setMagnifyOffset] = useState({ x: 0, y: 0, width: 0, height: 0 });

  const hoverTimeoutRef = useRef(null);
  const closeTimeoutRef = useRef(null);
  const itemRefs = useRef({});
  const zoomImageRef = useRef(null);

  // Configurable magnifier settings
  const MAGNIFY_SIZE = 400;      // Size of the magnifying glass circle
  const MAGNIFY_ZOOM = 2.5;       // Zoom factor (try 2.5, 5, 10, 20, etc.)

  // Normalize carousel data
  const normalizedData = React.useMemo(() => {
    if (!carouselData || !Array.isArray(carouselData)) {
      console.warn('Carousel: Invalid carouselData, expected array');
      return [];
    }
    
    return carouselData.map((item, index) => {
      if (typeof item === 'string') {
        return {
          id: index,
          image: item,
          title: `Image ${index + 1}`,
          description: ''
        };
      }
      
      return {
        id: item.id ?? index,
        image: item.image || '',
        title: item.title || `Image ${index + 1}`,
        description: item.description || ''
      };
    });
  }, [carouselData]);

  const totalItems = normalizedData.length;

  const goToNext = useCallback(() => {
    if (isAnimating || zoomedImage || totalItems === 0) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev + 1) % totalItems);
    setTimeout(() => setIsAnimating(false), 600);
  }, [isAnimating, zoomedImage, totalItems]);

  const goToPrev = useCallback(() => {
    if (isAnimating || zoomedImage || totalItems === 0) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev - 1 + totalItems) % totalItems);
    setTimeout(() => setIsAnimating(false), 600);
  }, [isAnimating, zoomedImage, totalItems]);

  const goToSlide = useCallback((index) => {
    if (isAnimating || zoomedImage || index === currentIndex || totalItems === 0) return;
    setIsAnimating(true);
    setCurrentIndex(index);
    setTimeout(() => setIsAnimating(false), 600);
  }, [isAnimating, zoomedImage, currentIndex, totalItems]);

  const getItemStyle = (index) => {
    let position = index - currentIndex;

    if (position < -2) {
      const altPos = position + totalItems;
      if (altPos <= 2) position = altPos;
    }
    if (position > 2) {
      const altPos = position - totalItems;
      if (altPos >= -2) position = altPos;
    }

    if (position < -2 || position > 2) {
      return {
        transform: 'translate(-50%, -50%) translateZ(-800px) scale(0.4)',
        zIndex: 1,
        opacity: 0,
        filter: 'blur(12px)',
        pointerEvents: 'none'
      };
    }

    const config = POSITIONS[position];
    return {
      transform: `translate(-50%, -50%) translateX(${config.x}%) translateZ(${config.z}px) rotateY(${config.rotateY}deg) scale(${config.scale})`,
      zIndex: 10 - Math.abs(position) * 2,
      opacity: config.opacity,
      filter: `blur(${config.blur}px)`,
      pointerEvents: position === 0 ? 'auto' : 'none'
    };
  };

  const openZoom = useCallback((image, index) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);

    const itemEl = itemRefs.current[index];
    if (itemEl) {
      const rect = itemEl.getBoundingClientRect();
      setItemRect(rect);
    }

    setZoomedImage(image);
    setMagnifyActive(false);
  }, []);

  const closeZoom = useCallback(() => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    setZoomedImage(null);
    setItemRect(null);
    setMagnifyActive(false);
  }, []);

  const handleItemMouseEnter = useCallback((index) => {
    if (zoomedImage || index !== currentIndex) return;

    hoverTimeoutRef.current = setTimeout(() => {
      const item = normalizedData[index];
      openZoom(item.image, index);
    }, 800);
  }, [zoomedImage, currentIndex, openZoom, normalizedData]);

  const handleItemMouseLeave = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  }, []);

  const handleOverlayMouseEnter = useCallback(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  }, []);

  const handleOverlayMouseLeave = useCallback(() => {
    closeTimeoutRef.current = setTimeout(closeZoom, 300);
  }, [closeZoom]);

  const handleImageContainerMouseEnter = useCallback(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  }, []);

  const handleImageClick = useCallback(() => {
    setMagnifyActive((prev) => {
      console.log(prev ? '🔍 Magnifier OFF' : '🔍 Magnifier ON');
      return !prev;
    });
  }, []);

  // FIXED: Pixel-based magnifier positioning with proper background size calculation
  const handleImageMouseMove = useCallback((e) => {
    if (!magnifyActive || !zoomImageRef.current) return;

    const rect = zoomImageRef.current.getBoundingClientRect();
    
    // Get mouse position relative to the image
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Clamp the magnifier position to stay within image bounds
    const clampedX = Math.max(MAGNIFY_SIZE / 2, Math.min(rect.width - MAGNIFY_SIZE / 2, mouseX));
    const clampedY = Math.max(MAGNIFY_SIZE / 2, Math.min(rect.height - MAGNIFY_SIZE / 2, mouseY));

    // Set the magnifier circle position
    setMagnifyPosition({ x: clampedX, y: clampedY });

    // CRITICAL FIX: Calculate pixel offset for background position
    // The background image needs to be positioned so that the point under the cursor
    // appears at the center of the magnifier lens
    
    // Calculate the offset: where the magnified image should start
    // Formula: (mouse position * zoom factor) - (lens radius)
    // This centers the magnified portion under the cursor
    const bgOffsetX = mouseX * MAGNIFY_ZOOM - MAGNIFY_SIZE / 2;
    const bgOffsetY = mouseY * MAGNIFY_ZOOM - MAGNIFY_SIZE / 2;

    setMagnifyOffset({ 
      x: bgOffsetX, 
      y: bgOffsetY,
      // Store the rendered dimensions for background-size calculation
      width: rect.width,
      height: rect.height
    });
  }, [magnifyActive, MAGNIFY_SIZE, MAGNIFY_ZOOM]);

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (zoomedImage) return;
      if (e.key === 'ArrowLeft') goToPrev();
      if (e.key === 'ArrowRight') goToNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToPrev, goToNext, zoomedImage]);

  if (totalItems === 0) {
    return (
      <div className="carousel-container">
        <div className="carousel-header">
          <h2 className="carousel-title">{title}</h2>
        </div>
        <div className="carousel-empty-state">
          <p className="carousel-empty">No images available</p>
        </div>
      </div>
    );
  }

  const currentItem = normalizedData[currentIndex] || {};

  return (
    <>
      {/* Zoom Overlay Portal */}
      {zoomedImage && createPortal(
        <div 
          className="zoom-overlay"
          onMouseEnter={handleOverlayMouseEnter}
          onMouseLeave={handleOverlayMouseLeave}
          onClick={closeZoom}
        >          
          <div className={`zoom-glass ${!zoomedImage ? 'closing' : ''}`} />

          <div 
            className={`zoom-image-container ${itemRect ? 'expanding' : ''} ${!zoomedImage ? 'shrinking' : ''} ${magnifyActive ? 'magnify-active' : ''}`}
            style={itemRect ? {
              '--start-x': `${itemRect.left + itemRect.width / 2 - window.innerWidth / 2}px`,
              '--start-y': `${itemRect.top + itemRect.height / 2 - window.innerHeight / 2}px`,
              '--start-scale': `${itemRect.width / 800}`
            } : {}}
            onMouseEnter={handleImageContainerMouseEnter}
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              className="zoom-close-btn"
              onClick={closeZoom}
              title="Close Zoom"
            >
              <img src={ICONS.close} alt="Close" />
            </button>

            <div className="zoom-image" onClick={handleImageClick}>
              <img
                src={zoomedImage}
                alt={currentItem.title || 'Zoomed Image'}
                ref={zoomImageRef}
                onMouseMove={handleImageMouseMove}
              />
            </div>

            {/* FIXED: Magnifier with pixel-based positioning and explicit dimensions */}
            {magnifyActive && magnifyOffset.width && (
              <div 
                className="magnify-lens"
                style={{
                  left: `${magnifyPosition.x}px`,
                  top: `${magnifyPosition.y}px`,
                  width: `${MAGNIFY_SIZE}px`,
                  height: `${MAGNIFY_SIZE}px`,
                  // CRITICAL: Use explicit pixel dimensions for background-size
                  // This ensures the background image scales correctly at any zoom level
                  backgroundSize: `${magnifyOffset.width * MAGNIFY_ZOOM}px ${magnifyOffset.height * MAGNIFY_ZOOM}px`,
                  // Position using negative pixels to align with cursor
                  backgroundPosition: `-${magnifyOffset.x}px -${magnifyOffset.y}px`,
                  backgroundImage: `url(${zoomedImage})`,
                  transform: 'translate(-50%, -50%)',
                }}
              />
            )}

            {/* Hints */}
            {!magnifyActive ? (
              <div className="zoom-hint">
                Click image to enable magnifier (Zoom: {MAGNIFY_ZOOM}x)
              </div>
            ) : (
              <div className="zoom-hint zoom-hint-active">
                Click again to disable magnifier
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* Carousel Container */}
      <div className="carousel-container">
        {/* Title Header */}
        {title && (
          <div className="carousel-header">
            <h2 className="carousel-title">{title}</h2>
          </div>
        )}

        {/* Main Carousel */}
        <div className="carousel">
          <div className="carousel-wrapper">
            {normalizedData.map((item, index) => (
              <div 
                className="carousel-item"
                key={item.id}
                data-position={index - currentIndex}
                style={getItemStyle(index)}
                ref={(el) => (itemRefs.current[index] = el)}
                onMouseEnter={() => handleItemMouseEnter(index)}
                onMouseLeave={handleItemMouseLeave}
                onClick={() => index === currentIndex && openZoom(item.image, index)}
              >
                <div className="item-frame" />
                <div className="item-image-wrapper">
                  <img
                    className="item-image"
                    src={item.image}
                    alt={item.title}
                    loading="lazy"
                  />
                </div>
                {index === currentIndex && (item.title || item.description) && (
                  <div className="item-label">
                    {item.title}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Navigation Controls */}
          {showControls && (
            <>
              <button 
                className="carousel-prev" 
                onClick={goToPrev}
                disabled={isAnimating || totalItems <= 1}
                aria-label="Previous slide"
              >
                <img src={ICONS.leftArrow} alt="Previous" />
              </button>
              <button 
                className="carousel-next" 
                onClick={goToNext}
                disabled={isAnimating || totalItems <= 1}
                aria-label="Next slide"
              >
                <img src={ICONS.rightArrow} alt="Next" />
              </button>
            </>
          )}
        </div>

        {/* Bottom Panel */}
        <div className="bottom-panel">
          {/* Description */}
          {currentItem.description && (
            <div className="description-panel">
              <p>{currentItem.description}</p>
            </div>
          )}

          {/* Indicators */}
          {showIndicators && totalItems > 1 && (
            <div className="indicators">
              {normalizedData.map((item, index) => (
                <button
                  key={item.id}
                  className={`indicator ${index === currentIndex ? 'active' : ''}`}
                  onClick={() => goToSlide(index)}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          )}

          {/* Information */}
          {currentItem.information && (
            <div className="information-panel">
              <pre>{currentItem.information}</pre>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Carousel;