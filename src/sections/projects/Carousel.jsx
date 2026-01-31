// src/sections/projects/Carousel.jsx
// FIXED: Individual image scaling based on each image's dimensions

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ICONS } from '../../assets/icons.js';

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
  const MAGNIFY_SIZE = 500;      // Size of the magnifying glass circle
  const MAGNIFY_ZOOM = 2.5;     // Zoom factor

  // Interaction Delay
  const [isInteractive, setIsInteractive] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInteractive(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // Normalize carousel data
  const normalizedData = React.useMemo(() => {
    if (!carouselData || !Array.isArray(carouselData)) return [];
    return carouselData.map((item, index) => {
      if (typeof item === 'string') {
        return { id: index, image: item, title: `Image ${index + 1}`, description: '' };
      }
      return {
        id: item.id ?? index,
        image: item.image || '',
        title: item.title || `Image ${index + 1}`,
        description: item.description || '',
        information: item.information || ''
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

  const calculateContainerDimensionsForImage = useCallback((naturalWidth, naturalHeight) => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const isLandscape = naturalWidth >= naturalHeight;
    let scaledWidth, scaledHeight;
    
    if (isLandscape) {
      scaledWidth = Math.min(naturalWidth, viewportWidth * 0.9);
      scaledHeight = (scaledWidth / naturalWidth) * naturalHeight;
      if (scaledHeight > viewportHeight * 0.9) {
        scaledHeight = viewportHeight * 0.9;
        scaledWidth = (scaledHeight / naturalHeight) * naturalWidth;
      }
    } else {
      scaledHeight = Math.min(naturalHeight, viewportHeight * 0.9);
      scaledWidth = (scaledHeight / naturalHeight) * naturalWidth;
      if (scaledWidth > viewportWidth * 0.9) {
        scaledWidth = viewportWidth * 0.9;
        scaledHeight = (scaledWidth / naturalWidth) * naturalHeight;
      }
    }
    
    return { width: Math.round(scaledWidth), height: Math.round(scaledHeight) };
  }, []);

  const openZoom = useCallback((image, index) => {
    if (!isInteractive) return;
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    const itemEl = itemRefs.current[index];
    if (itemEl) setItemRect(itemEl.getBoundingClientRect());
    setZoomedImage(image);
    setMagnifyActive(false);
    setImageLoaded(false);
  }, [isInteractive]);

  const closeZoom = useCallback(() => {
    setZoomedImage(null);
    setItemRect(null);
    setMagnifyActive(false);
  }, []);

  const handleItemMouseEnter = useCallback((index) => {
    if (zoomedImage || index !== currentIndex) return;
    hoverTimeoutRef.current = setTimeout(() => {
      openZoom(normalizedData[index].image, index);
    }, 800);
  }, [zoomedImage, currentIndex, openZoom, normalizedData]);

  const handleItemMouseLeave = useCallback(() => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
  }, []);

  const handleImageClick = useCallback(() => {
    setMagnifyActive(prev => !prev);
  }, []);

  const handleImageMouseMove = useCallback((e) => {
    if (!magnifyActive || !zoomContainerRef.current) return;
    const rect = zoomContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const clampedX = Math.max(0, Math.min(containerDimensions.width, x));
    const clampedY = Math.max(0, Math.min(containerDimensions.height, y));
    
    setMagnifyPosition({ x: clampedX + rect.left, y: clampedY + rect.top });
    
    const relX = clampedX / containerDimensions.width;
    const relY = clampedY / containerDimensions.height;
    
    setMagnifyOffset({
      x: relX * imageDimensions.width * MAGNIFY_ZOOM - MAGNIFY_SIZE / 2,
      y: relY * imageDimensions.height * MAGNIFY_ZOOM - MAGNIFY_SIZE / 2,
      width: imageDimensions.width,
      height: imageDimensions.height
    });
  }, [magnifyActive, containerDimensions, imageDimensions, MAGNIFY_SIZE, MAGNIFY_ZOOM]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (zoomedImage) {
        if (e.key === 'Escape') closeZoom();
        return;
      }
      if (e.key === 'ArrowLeft') goToPrev();
      if (e.key === 'ArrowRight') goToNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zoomedImage, closeZoom, goToPrev, goToNext]);

  if (totalItems === 0) return null;
  const currentItem = normalizedData[currentIndex] || {};

  return (
    <>
      {zoomedImage && createPortal(
        <div className="zoom-overlay" onClick={closeZoom}>
          <div className="zoom-glass" />
          <div 
            className="zoom-image-container"
            ref={zoomContainerRef}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: containerDimensions.width ? `${containerDimensions.width}px` : 'auto',
              height: containerDimensions.height ? `${containerDimensions.height}px` : 'auto'
            }}
          >
            <button className="zoom-close-btn" onClick={closeZoom}>
              <img src={ICONS.close.src} alt="Close" />
            </button>
            <div className="zoom-image-wrapper">
              <img
                src={zoomedImage}
                alt="Zoomed"
                className="zoom-image"
                onClick={handleImageClick}
                onMouseMove={handleImageMouseMove}
                onLoad={(e) => {
                  const dims = calculateContainerDimensionsForImage(e.target.naturalWidth, e.target.naturalHeight);
                  setImageDimensions({ width: e.target.naturalWidth, height: e.target.naturalHeight });
                  setContainerDimensions(dims);
                  setImageLoaded(true);
                }}
              />
            </div>
            {magnifyActive && imageLoaded && (
              <div 
                className="magnify-lens"
                style={{
                  left: `${magnifyPosition.x}px`,
                  top: `${magnifyPosition.y}px`,
                  width: `${MAGNIFY_SIZE}px`,
                  height: `${MAGNIFY_SIZE}px`,
                  backgroundImage: `url(${zoomedImage})`,
                  backgroundSize: `${imageDimensions.width * MAGNIFY_ZOOM}px ${imageDimensions.height * MAGNIFY_ZOOM}px`,
                  backgroundPosition: `-${magnifyOffset.x}px -${magnifyOffset.y}px`
                }}
              />
            )}
            <div className="zoom-hint">
              {magnifyActive ? 'Click again to disable magnifier' : 'Click to magnify'}
            </div>
          </div>
        </div>,
        document.body
      )}

      <div className="carousel-container">
        {title && (
          <div className="carousel-header">
            <h2 className="carousel-title">{title}</h2>
          </div>
        )}

        {isInteractive && !zoomedImage && (
          <div className="carousel-hover-hint" style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            zIndex: 20, pointerEvents: 'none', background: 'rgba(0,0,0,0.6)', color: 'white',
            padding: '0.5rem 1rem', borderRadius: '2rem', backdropFilter: 'blur(4px)',
            fontSize: '0.9rem', opacity: 0, animation: 'fadeInHint 0.5s ease forwards'
          }}>
            Hover image to enlarge
          </div>
        )}

        <div className={`carousel ${!isInteractive ? 'carousel-locked' : ''}`}>
          <div className="carousel-wrapper">
            {normalizedData.map((item, index) => (
              <div 
                className="carousel-item"
                key={item.id}
                style={getItemStyle(index)}
                ref={(el) => (itemRefs.current[index] = el)}
                onMouseEnter={() => handleItemMouseEnter(index)}
                onMouseLeave={handleItemMouseLeave}
                onClick={() => index === currentIndex && openZoom(item.image, index)}
              >
                <div className="item-image-wrapper">
                  <img className="item-image" src={item.image} alt={item.title} loading="lazy" />
                </div>
              </div>
            ))}
          </div>

          {showControls && totalItems > 1 && (
            <>
              <button className="carousel-prev" onClick={goToPrev} disabled={isAnimating}>
                <img src={ICONS.leftArrow.src} alt="Prev" />
              </button>
              <button className="carousel-next" onClick={goToNext} disabled={isAnimating}>
                <img src={ICONS.rightArrow.src} alt="Next" />
              </button>
            </>
          )}
        </div>

        <div className="bottom-panel">
          {currentItem.description && (
            <div className="description-panel">
              <p>{currentItem.description}</p>
            </div>
          )}
          {showIndicators && totalItems > 1 && (
            <div className="indicators">
              {normalizedData.map((_, index) => (
                <button
                  key={index}
                  className={`indicator ${index === currentIndex ? 'active' : ''}`}
                  onClick={() => goToSlide(index)}
                />
              ))}
            </div>
          )}
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