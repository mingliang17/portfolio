// src/sections/projects/Carousel.jsx
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

const Carousel = ({ carouselData, title, autoPlay, showControls, showIndicators }) => {
  // Use the carouselData prop directly - don't fetch anything!
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [zoomedImage, setZoomedImage] = useState(null);
  const [itemRect, setItemRect] = useState(null);

  const [magnifyActive, setMagnifyActive] = useState(false);
  const [magnifyPosition, setMagnifyPosition] = useState({ x: 0, y: 0 });
  const [magnifyOffset, setMagnifyOffset] = useState({ x: 0, y: 0 });

  const hoverTimeoutRef = useRef(null);
  const closeTimeoutRef = useRef(null);
  const itemRefs = useRef({});
  const zoomImageRef = useRef(null);

  const totalItems = carouselData ? carouselData.length : 0;

  const MAGNIFY_SIZE = 200;
  const MAGNIFY_ZOOM = 2.5;

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
    setMagnifyActive(false); // Reset on open
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
      const item = carouselData[index];
      const imageSrc = item.image; // item is an object with image property
      openZoom(imageSrc, index);
    }, 800);
  }, [zoomedImage, currentIndex, openZoom, carouselData]);

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

  const handleImageMouseMove = useCallback((e) => {
    if (!magnifyActive || !zoomImageRef.current) return;

    const rect = zoomImageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const clampedX = Math.max(MAGNIFY_SIZE / 2, Math.min(rect.width - MAGNIFY_SIZE / 2, x));
    const clampedY = Math.max(MAGNIFY_SIZE / 2, Math.min(rect.height - MAGNIFY_SIZE / 2, y));

    setMagnifyPosition({ x: clampedX, y: clampedY });

    const bgX = (clampedX / rect.width) * 100;
    const bgY = (clampedY / rect.height) * 100;

    setMagnifyOffset({ x: bgX, y: bgY });
  }, [magnifyActive]);

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  // Early return if no data
  if (!carouselData || carouselData.length === 0) {
    return (
      <div className="carousel">
        <div className="carousel-header">
          <h2 className="carousel-title">{title || 'Gallery'}</h2>
          <p className="carousel-empty">No images available</p>
        </div>
      </div>
    );
  }

  // Get current item
  const currentItem = carouselData[currentIndex] || {};

  return (
    <>
      {/* Carousel Title */}
      {title && (
        <div className="carousel-header">
          <h2 className="carousel-title">{title}</h2>
        </div>
      )}

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
              <img src={ICONS.close} alt="Close Zoom" />
            </button>

            <div className="zoom-image" onClick={handleImageClick}>
              <img
                src={zoomedImage}
                alt={currentItem.title || 'Zoomed Image'}
                ref={zoomImageRef}
                onMouseMove={handleImageMouseMove}
              />
            </div>

            {magnifyActive && (
              <div 
                className="magnify-lens"
                style={{
                  left: `${magnifyPosition.x - MAGNIFY_SIZE / 2}px`,
                  top: `${magnifyPosition.y - MAGNIFY_SIZE / 2}px`,
                  backgroundPosition: `${-magnifyOffset.x}% ${-magnifyOffset.y}%`,
                  backgroundSize: `${MAGNIFY_ZOOM * 100}%`,
                  backgroundImage: `url(${zoomedImage})`,
                }}
              />
            )}
          </div>
        </div>,
        document.body
      )}

      <div className="carousel">
        <div className="carousel-wrapper">
          {carouselData.map((item, index) => (
            <div 
              className="carousel-item"
              key={item.id || index}
              style={getItemStyle(index)}
              ref={(el) => (itemRefs.current[index] = el)}
              onMouseEnter={() => handleItemMouseEnter(index)}
              onMouseLeave={handleItemMouseLeave}
              onClick={() => openZoom(item.image, index)}
            >
              <img
                className="carousel-image"
                src={item.image}
                alt={item.title || 'Carousel Image'}
              />
              {(item.title || item.description) && (
                <div className="carousel-item-info">
                  {item.title && <h3>{item.title}</h3>}
                  {item.description && <p>{item.description}</p>}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Carousel Navigation */}
        <button className="carousel-prev" onClick={goToPrev}>
          <img src={ICONS.leftArrow} alt="Previous" />
        </button>
        <button className="carousel-next" onClick={goToNext}>
          <img src={ICONS.rightArrow} alt="Next" />
        </button>
      </div>
    </>
  );
};

export default Carousel;