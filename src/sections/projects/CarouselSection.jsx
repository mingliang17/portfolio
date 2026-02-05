// src/sections/projects/CarouselSection.jsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ICONS } from '../../assets/icons.js';

const POSITIONS = {
  '-2': { x: -100, z: -500, rotateY: -35, scale: 0.65, opacity: 0.5, blur: 8 },
  '-1': { x: -70, z: -250, rotateY: -20, scale: 0.8, opacity: 0.8, blur: 4 },
  0: { x: 0, z: 0, rotateY: 0, scale: 1, opacity: 1, blur: 0 },
  1: { x: 70, z: -250, rotateY: 20, scale: 0.8, opacity: 0.8, blur: 4 },
  2: { x: 100, z: -500, rotateY: 35, scale: 0.65, opacity: 0.5, blur: 8 }
};

// --- SUB-COMPONENT: ZOOM MODAL ---
const ZoomModal = ({ image, onClose, magnifySize, zoomFactor }) => {
  const [magnify, setMagnify] = useState({ active: false, x: 0, y: 0, ox: 0, oy: 0 });
  const [dims, setDims] = useState({ cw: 0, ch: 0, iw: 0, ih: 0, loaded: false });
  const containerRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!magnify.active || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(dims.cw, e.clientX - rect.left));
    const y = Math.max(0, Math.min(dims.ch, e.clientY - rect.top));

    setMagnify(prev => ({
      ...prev,
      x: x + rect.left,
      y: y + rect.top,
      ox: (x / dims.cw) * dims.iw * zoomFactor - magnifySize / 2,
      oy: (y / dims.ch) * dims.ih * zoomFactor - magnifySize / 2
    }));
  };

  const onImgLoad = (e) => {
    const { naturalWidth: iw, naturalHeight: ih } = e.target;
    const vW = window.innerWidth * 0.9, vH = window.innerHeight * 0.9;
    const ratio = Math.min(vW / iw, vH / ih);
    setDims({ cw: iw * ratio, ch: ih * ratio, iw, ih, loaded: true });
  };

  return createPortal(
    <div className="zoom-overlay" onClick={onClose}>
      <div className="zoom-glass" />
      <div className="zoom-image-container" ref={containerRef} onClick={e => e.stopPropagation()} 
           style={{ width: dims.cw, height: dims.ch }}>
        <button className="zoom-close-btn" onClick={onClose}><img src={ICONS.close.src} alt="X" /></button>
        <div className="zoom-image-wrapper">
          <img src={image} className="zoom-image" alt="Zoom" onLoad={onImgLoad}
               onClick={() => setMagnify(p => ({ ...p, active: !p.active }))} onMouseMove={handleMouseMove} />
        </div>
        {magnify.active && dims.loaded && (
          <div className="magnify-lens" style={{
            left: magnify.x, top: magnify.y, width: magnifySize, height: magnifySize,
            backgroundImage: `url(${image})`,
            backgroundSize: `${dims.iw * zoomFactor}px ${dims.ih * zoomFactor}px`,
            backgroundPosition: `-${magnify.ox}px -${magnify.oy}px`
          }} />
        )}
        <div className="zoom-hint">{magnify.active ? 'Click to disable magnifier' : 'Click to magnify'}</div>
      </div>
    </div>, document.body
  );
};

// --- MAIN COMPONENT ---
const CarouselSection = ({ carouselData = [], title = 'Gallery', showControls = true, showIndicators = true }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [zoomedImage, setZoomedImage] = useState(null);
  const [isInteractive, setIsInteractive] = useState(false);

  const hoverTimeoutRef = useRef(null);
  const itemRefs = useRef({});

  useEffect(() => {
    const timer = setTimeout(() => setIsInteractive(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  const data = useMemo(() => carouselData.map((item, i) => (
    typeof item === 'string' ? { id: i, image: item, title: `Image ${i + 1}` } : { ...item, id: item.id ?? i }
  )), [carouselData]);

  const total = data.length;

  const move = useCallback((dir) => {
    if (isAnimating || zoomedImage || total === 0) return;
    setIsAnimating(true);
    setCurrentIndex(prev => (prev + dir + total) % total);
    setTimeout(() => setIsAnimating(false), 600);
  }, [isAnimating, zoomedImage, total]);

  const getItemStyle = (index) => {
    let pos = index - currentIndex;
    if (pos < -2) pos += total; if (pos > 2) pos -= total;
    if (pos < -2 || pos > 2) return { opacity: 0, display: 'none' };

    const c = POSITIONS[pos];
    return {
      transform: `translate(-50%, -50%) translateX(${c.x}%) translateZ(${c.z}px) rotateY(${c.rotateY}deg) scale(${c.scale})`,
      zIndex: 10 - Math.abs(pos) * 2,
      opacity: c.opacity, filter: `blur(${c.blur}px)`,
      pointerEvents: pos === 0 ? 'auto' : 'none'
    };
  };

  useEffect(() => {
    const handleKey = (e) => {
      if (zoomedImage) { if (e.key === 'Escape') setZoomedImage(null); }
      else { if (e.key === 'ArrowLeft') move(-1); if (e.key === 'ArrowRight') move(1); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [zoomedImage, move]);

  if (total === 0) return null;
  const current = data[currentIndex];

  return (
    <>
      {zoomedImage && <ZoomModal image={zoomedImage} onClose={() => setZoomedImage(null)} magnifySize={500} zoomFactor={2.5} />}

      <div className="carousel-container">
        {title && <div className="carousel-header"><h2 className="carousel-title">{title}</h2></div>}

        <div className={`carousel ${!isInteractive ? 'carousel-locked' : ''}`}>
          <div className="carousel-wrapper">
            {data.map((item, i) => (
              <div key={item.id} className="carousel-item" style={getItemStyle(i)}
                   ref={el => (itemRefs.current[i] = el)}
                   onMouseEnter={() => i === currentIndex && !zoomedImage && (hoverTimeoutRef.current = setTimeout(() => setZoomedImage(item.image), 800))}
                   onMouseLeave={() => clearTimeout(hoverTimeoutRef.current)}
                   onClick={() => i === currentIndex && setZoomedImage(item.image)}>
                <div className="item-image-wrapper"><img className="item-image" src={item.image} alt={item.title} /></div>
              </div>
            ))}
          </div>

          {showControls && total > 1 && (
            <>
              <button className="carousel-prev" onClick={() => move(-1)} disabled={isAnimating}><img src={ICONS.leftArrow.src} alt="<" /></button>
              <button className="carousel-next" onClick={() => move(1)} disabled={isAnimating}><img src={ICONS.rightArrow.src} alt=">" /></button>
            </>
          )}
        </div>

        <div className="bottom-panel">
          {current.description && <div className="description-panel"><p>{current.description}</p></div>}
          {showIndicators && total > 1 && (
            <div className="indicators">
              {data.map((_, i) => <button key={i} className={`indicator ${i === currentIndex ? 'active' : ''}`} onClick={() => !isAnimating && setCurrentIndex(i)} />)}
            </div>
          )}
          {current.information && <div className="information-panel"><pre>{current.information}</pre></div>}
        </div>
      </div>
    </>
  );
};

export default CarouselSection;