// src/sections/projects/Carousel.jsx
// FIXED: Individual image scaling based on each image's dimensions

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
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });

  const [magnifyActive, setMagnifyActive] = useState(false);
  const [magnifyPosition, setMagnifyPosition] = useState({ x: 0, y: 0 });
  const [magnifyOffset, setMagnifyOffset] = useState({ x: 0, y: 0, width: 0, height: 0 });

  const hoverTimeoutRef = useRef(null);
  const closeTimeoutRef = useRef(null);
  const itemRefs = useRef({});
  const zoomImageRef = useRef(null);
  const zoomContainerRef = useRef(null);

  // Configurable magnifier settings
  const MAGNIFY_SIZE = 300;      // Size of the magnifying glass circle
  const MAGNIFY_ZOOM = 2.5;     // Zoom factor

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

  // NEW LOGIC: Calculate container dimensions for EACH INDIVIDUAL IMAGE
  const calculateContainerDimensionsForImage = useCallback((naturalWidth, naturalHeight) => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Determine which is the longer side of THIS image
    const isLandscape = naturalWidth >= naturalHeight; // >= handles squares
    
    let scaledWidth, scaledHeight, scaleFactor;
    
    if (isLandscape) {
      // Landscape or square: Width is longer side
      // Set container width to 95% of viewport width
      scaledWidth = Math.min(naturalWidth, viewportWidth * 0.95);
      scaledHeight = (scaledWidth / naturalWidth) * naturalHeight;
      
      // Check if the scaled height exceeds viewport height (with margin)
      if (scaledHeight > viewportHeight * 0.95) {
        // If yes, scale by height instead
        scaledHeight = Math.min(naturalHeight, viewportHeight * 0.95);
        scaledWidth = (scaledHeight / naturalHeight) * naturalWidth;
      }
    } else {
      // Portrait: Height is longer side
      // Set container height to 95% of viewport height
      scaledHeight = Math.min(naturalHeight, viewportHeight * 0.95);
      scaledWidth = (scaledHeight / naturalHeight) * naturalWidth;
      
      // Check if the scaled width exceeds viewport width (with margin)
      if (scaledWidth > viewportWidth * 0.95) {
        // If yes, scale by width instead
        scaledWidth = Math.min(naturalWidth, viewportWidth * 0.95);
        scaledHeight = (scaledWidth / naturalWidth) * naturalHeight;
      }
    }
    
    // Calculate scale factor
    scaleFactor = scaledWidth / naturalWidth;
    
    // Round to nearest pixel
    return {
      width: Math.round(scaledWidth),
      height: Math.round(scaledHeight),
      scale: scaleFactor,
      isLandscape
    };
  }, []);

  const openZoom = useCallback((image, index) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);

    const itemEl = itemRefs.current[index];
    if (itemEl) {
      const rect = itemEl.getBoundingClientRect();
      setItemRect(rect);
    }

    setZoomedImage(image);
    setMagnifyActive(false);
    setImageLoaded(false);
    setImageDimensions({ width: 0, height: 0 });
    setContainerDimensions({ width: 0, height: 0 });
  }, []);

  const closeZoom = useCallback(() => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    setZoomedImage(null);
    setItemRect(null);
    setMagnifyActive(false);
    setImageLoaded(false);
    setImageDimensions({ width: 0, height: 0 });
    setContainerDimensions({ width: 0, height: 0 });
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

  // Magnifier positioning for individually scaled images
  const handleImageMouseMove = useCallback((e) => {
    if (!magnifyActive || !zoomImageRef.current || !zoomContainerRef.current) return;

    const container = zoomContainerRef.current;
    const img = zoomImageRef.current;
    
    // Get container rect
    const containerRect = container.getBoundingClientRect();
    
    // Get mouse position relative to container
    const mouseX = e.clientX - containerRect.left;
    const mouseY = e.clientY - containerRect.top;
    
    // Clamp mouse position within container bounds
    const clampedX = Math.max(0, Math.min(containerDimensions.width, mouseX));
    const clampedY = Math.max(0, Math.min(containerDimensions.height, mouseY));
    
    // Since image uses object-fit: contain and fills the container,
    // calculate relative position (0 to 1)
    const relX = clampedX / containerDimensions.width;
    const relY = clampedY / containerDimensions.height;
    
    // Set magnifier position
    setMagnifyPosition({ 
      x: clampedX + containerRect.left,
      y: clampedY + containerRect.top
    });
    
    // Calculate background offset for magnifier
    const bgOffsetX = relX * imageDimensions.width * MAGNIFY_ZOOM - MAGNIFY_SIZE / 2;
    const bgOffsetY = relY * imageDimensions.height * MAGNIFY_ZOOM - MAGNIFY_SIZE / 2;
    
    setMagnifyOffset({ 
      x: bgOffsetX, 
      y: bgOffsetY,
      width: imageDimensions.width,
      height: imageDimensions.height
    });
  }, [magnifyActive, MAGNIFY_SIZE, MAGNIFY_ZOOM, containerDimensions, imageDimensions]);

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (zoomedImage) {
        if (e.key === 'Escape') closeZoom();
        if (e.key === ' ') handleImageClick();
        return;
      }
      if (e.key === 'ArrowLeft') goToPrev();
      if (e.key === 'ArrowRight') goToNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToPrev, goToNext, zoomedImage, closeZoom, handleImageClick]);

  // Auto-play functionality
  useEffect(() => {
    if (!autoPlay || zoomedImage || totalItems <= 1) return;
    
    const interval = setInterval(() => {
      goToNext();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [autoPlay, zoomedImage, totalItems, goToNext]);

  // Handle window resize for current image
  useEffect(() => {
    const handleResize = () => {
      if (imageDimensions.width && imageDimensions.height && zoomedImage) {
        const newDimensions = calculateContainerDimensionsForImage(
          imageDimensions.width,
          imageDimensions.height
        );
        setContainerDimensions(newDimensions);
        console.log(`Resized: Container now ${newDimensions.width}x${newDimensions.height}`);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [imageDimensions, zoomedImage, calculateContainerDimensionsForImage]);

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
            style={{
              '--start-x': itemRect ? `${itemRect.left + itemRect.width / 2 - window.innerWidth / 2}px` : '0px',
              '--start-y': itemRect ? `${itemRect.top + itemRect.height / 2 - window.innerHeight / 2}px` : '0px',
              '--start-scale': itemRect ? Math.min(itemRect.width / Math.max(containerDimensions.width || 400, 100), 1) : 1,
              '--start-width': itemRect ? `${itemRect.width}px` : '400px',
              '--start-height': itemRect ? `${itemRect.height}px` : '300px',
              '--target-width': containerDimensions.width ? `${containerDimensions.width}px` : 'auto',
              '--target-height': containerDimensions.height ? `${containerDimensions.height}px` : 'auto'
            }}
            onMouseEnter={handleImageContainerMouseEnter}
            onClick={(e) => e.stopPropagation()}
            ref={zoomContainerRef}
          >
            <button 
              className="zoom-close-btn"
              onClick={closeZoom}
              title="Close Zoom"
            >
              <img src={ICONS.close} alt="Close" />
            </button>

            <div className="zoom-image-wrapper">
              {!imageLoaded && (
                <div className="zoom-loading">Loading image...</div>
              )}
              <div 
                className="zoom-image" 
                onClick={handleImageClick}
                onMouseMove={handleImageMouseMove}
                style={{ 
                  display: imageLoaded ? 'block' : 'none',
                  // Debug border to see container bounds
                  // border: '1px solid red'
                }}
              >
                <img
                  src={zoomedImage}
                  alt={currentItem.title || 'Zoomed Image'}
                  ref={zoomImageRef}
                  onLoad={(e) => {
                    const img = e.target;
                    const naturalWidth = img.naturalWidth;
                    const naturalHeight = img.naturalHeight;
                    
                    console.log(`Original image: ${naturalWidth}x${naturalHeight}`);
                    console.log(`Viewport: ${window.innerWidth}x${window.innerHeight}`);
                    
                    // Calculate container dimensions based on THIS image's dimensions
                    const containerDims = calculateContainerDimensionsForImage(
                      naturalWidth,
                      naturalHeight
                    );
                    
                    setImageDimensions({ 
                      width: naturalWidth, 
                      height: naturalHeight 
                    });
                    
                    setContainerDimensions(containerDims);
                    setImageLoaded(true);
                    
                    console.log(`Container calculated for THIS image: ${containerDims.width}x${containerDims.height} (scale: ${containerDims.scale.toFixed(2)})`);
                    console.log(`Is landscape: ${containerDims.isLandscape}`);
                  }}
                  onError={() => {
                    console.error('Failed to load zoom image');
                    setImageLoaded(true);
                  }}
                />
              </div>
            </div>

            {/* Magnifier */}
            {magnifyActive && imageLoaded && containerDimensions.width > 0 && (
              <div 
                className="magnify-lens"
                style={{
                  left: `${magnifyPosition.x}px`,
                  top: `${magnifyPosition.y}px`,
                  width: `${MAGNIFY_SIZE}px`,
                  height: `${MAGNIFY_SIZE}px`,
                  backgroundSize: `${magnifyOffset.width * MAGNIFY_ZOOM}px ${magnifyOffset.height * MAGNIFY_ZOOM}px`,
                  backgroundPosition: `-${magnifyOffset.x}px -${magnifyOffset.y}px`,
                  backgroundImage: `url(${zoomedImage})`,
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
                Click again to disable magnifier • Press ESC to close
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
          {showControls && totalItems > 1 && (
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