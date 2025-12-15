import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { CAROUSEL_DATA, CAROUSEL_TITLE } from '../constants/carouselData.js'; 

// Sample data

const POSITIONS = {
  '-2': { x: -100, z: -500, rotateY: -35, scale: 0.65, opacity: 0.5, blur: 8 },
  '-1': { x: -70, z: -250, rotateY: -20, scale: 0.8, opacity: 0.8, blur: 4 },
  0: { x: 0, z: 0, rotateY: 0, scale: 1, opacity: 1, blur: 0 },
  1: { x: 70, z: -250, rotateY: 20, scale: 0.8, opacity: 0.8, blur: 4 },
  2: { x: 100, z: -500, rotateY: 35, scale: 0.65, opacity: 0.5, blur: 8 }
};

const LiquidCarousel = ({projectID}) => {
  const DATA = CAROUSEL_DATA[projectID] || [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [zoomedImage, setZoomedImage] = useState(null);
  const [itemRect, setItemRect] = useState(null);
  
  const hoverTimeoutRef = useRef(null);
  const closeTimeoutRef = useRef(null);
  const itemRefs = useRef({});

  const totalItems = DATA.length;

  const goToNext = useCallback(() => {
    if (isAnimating || zoomedImage) return;
    setIsAnimating(true);
    setCurrentIndex(prev => (prev + 1) % totalItems);
    setTimeout(() => setIsAnimating(false), 600);
  }, [isAnimating, zoomedImage, totalItems]);

  const goToPrev = useCallback(() => {
    if (isAnimating || zoomedImage) return;
    setIsAnimating(true);
    setCurrentIndex(prev => (prev - 1 + totalItems) % totalItems);
    setTimeout(() => setIsAnimating(false), 600);
  }, [isAnimating, zoomedImage, totalItems]);

  const goToSlide = useCallback((index) => {
    if (isAnimating || zoomedImage || index === currentIndex) return;
    setIsAnimating(true);
    setCurrentIndex(index);
    setTimeout(() => setIsAnimating(false), 600);
  }, [isAnimating, zoomedImage, currentIndex]);

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
  }, []);

  const closeZoom = useCallback(() => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    setZoomedImage(null);
    setItemRect(null);
  }, []);

  const handleItemMouseEnter = useCallback((index) => {
    if (zoomedImage || index !== currentIndex) return;
    
    hoverTimeoutRef.current = setTimeout(() => {
      openZoom(DATA[index], index);
    }, 800);
  }, [zoomedImage, currentIndex, openZoom]);

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

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  const currentItem = DATA[currentIndex];

  return (
    <> {/* ADDED: Opening Fragment */}
      {zoomedImage && createPortal(
        <div 
          className="zoom-overlay"
          onMouseEnter={handleOverlayMouseEnter}
          onMouseLeave={handleOverlayMouseLeave}
          onClick={closeZoom}
        >          
          <div className={`zoom-glass ${!zoomedImage ? 'closing' : ''}`} />
          
          <div 
            className={`zoom-image-container ${itemRect ? 'expanding' : ''} ${!zoomedImage ? 'shrinking' : ''}`}
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
              onClick={(e) => {
                e.stopPropagation();
                closeZoom();
              }}
            >
              ×
            </button>
            
            <img 
              src={zoomedImage.image}
              alt={zoomedImage.title}
              className="zoom-image"
            />
          </div>
          
          <div className="zoom-hint">
            Hover outside image to close
          </div>
        </div>,
        document.body
      )}

      {/* Main Carousel */}
      <div className="carousel-container">
        <div className="carousel-title">{CAROUSEL_TITLE[projectID]}</div>
        <div className="carousel-track">
          {DATA.map((item, index) => {
            const style = getItemStyle(index);
            const position = index - currentIndex;
            const isCenter = position === 0 || (position === -totalItems && currentIndex === 0) || (position === totalItems && currentIndex === totalItems - 1);
            
            return (
              <div
                key={item.id}
                ref={el => itemRefs.current[index] = el}
                className="carousel-item"
                style={style}
                data-position={position}
                onMouseEnter={() => handleItemMouseEnter(index)}
                onMouseLeave={handleItemMouseLeave}
              >
                <div className="item-frame" />
                
                <div className="item-image-wrapper">
                  <img 
                    src={item.image}
                    alt={item.title}
                    className="item-image"
                    draggable="false"
                  />
                </div>
                
                {isCenter && (
                  <div className="item-label">
                    {item.title}
                  </div>
                )}
              </div>
            );
          })}
          <div className="carousel-controls">
            <button 
              className="control-btn"
              onClick={goToPrev}
              disabled={isAnimating || !!zoomedImage}
            >
            </button>
            
            <button 
              className="control-btn"
              onClick={goToNext}
              disabled={isAnimating || !!zoomedImage}
            >
            </button>
          </div>
        </div>

        <div className="bottom-panel">
          <p className="description-panel">{currentItem.description}</p>
          
          <div className="indicators">
            {DATA.map((_, index) => (
              <button
                key={index}
                className={`indicator ${index === currentIndex ? 'active' : ''}`}
                onClick={() => goToSlide(index)}
                disabled={isAnimating || !!zoomedImage}
              />
            ))}
          </div>
          <p className="information-panel">{currentItem.information}</p>
        </div>
      </div>
    </> 
  );
};

export default LiquidCarousel;