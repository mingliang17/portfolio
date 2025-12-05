
import React, { useEffect, useState } from 'react';


/*Navigation Dots Component*/

export const NavigationDots = ({ totalSections, currentSection, onSectionChange, disabled }) => {
  const [isVisible, setIsVisible] = useState(false);  // Track visibility
  const [isFadedIn, setIsFadedIn] = useState(false);  // Track fading effect
  const [startMapAnimation, setStartMapAnimation] = useState(false);
  
  useEffect(() => {
    if (currentSection === 0) {
      setIsVisible(false);  // Hide dots in section 0
    } else if (currentSection === 1) {
      setIsVisible(true);   // Show dots from section 1 onwards
      setTimeout(() => setIsFadedIn(true), 100);  // Fade in after section 1
    }
  }, [currentSection]);

  return (
    <div className={`mh1-navigation-dots ${isFadedIn ? 'fade-in' : ''}`} style={{ opacity: isVisible ? 1 : 0, transition: 'opacity 1s' }}>
      {Array.from({ length: totalSections }).map((_, i) => (
        <button
          key={i}
          onClick={() => !disabled && onSectionChange(i)}
          className={`mh1-nav-dot ${i === currentSection ? 'active' : ''}`}
          aria-label={`Go to section ${i + 1}`}
          disabled={disabled}
        />
      ))}
    </div>
  );
};


/**
 * Unlock Animation Overlay
 */
export const UnlockOverlay = ({ unlockProgress, visible }) => {
  if (!visible) return null;

  return (
    <div className="mh1-unlock-overlay">
      <div 
        className="mh1-unlock-circle" 
        style={{ 
          transform: `scale(${unlockProgress * 3})`, 
          opacity: 1 - unlockProgress 
        }} 
      />
      <div 
        className="mh1-unlock-ring" 
        style={{ 
          transform: `scale(${0.5 + unlockProgress * 1.5}) rotate(${unlockProgress * 360}deg)`,
          opacity: 1 - unlockProgress 
        }} 
      />
    </div>
  );
};

/**
 * Drag Progress Indicator
 */
export const DragProgressIndicator = ({ progress, visible }) => {
  if (!visible || progress === 0) return null;

  return (
    <div className="mh1-drag-progress">
      <div className="mh1-drag-progress-bar">
        <div 
          className="mh1-drag-progress-fill"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
      {Math.round(progress * 100)}% Complete
    </div>
  );
};

/**
 * Hero Section Background
 */
export const HeroBackground = ({ backgroundFade, gradientOpacity, imagePath }) => (
  <div 
    className="mh1-background-wrapper"
    style={{ opacity: backgroundFade }}
  >
    <div 
      className="mh1-background-image"
      style={{ backgroundImage: `url('${imagePath}')` }}
    />
    <div 
      className="mh1-background-gradient-mask"
      style={{ opacity: gradientOpacity }}
    />
  </div>
);

/**
 * Hero Content (Title + Subtitle)
 */
export const HeroContent = ({ titleOpacity, title, subtitle }) => (
  <div 
    className="mh1-content-center"
    style={{ opacity: titleOpacity }}
  >
    <h1 className="mh1-hero-title unselectable">
      {title}
    </h1>
    <p className="mh1-hero-subtitle unselectable">
      {subtitle}
    </p>
  </div>
);

/**
 * Scroll Prompt (Drag Arrow)
 */
export const ScrollPrompt = ({ dragProgress, visible }) => {
  if (!visible) return null;

  return (
    <div className="mh1-scroll-prompt">
      <div 
        className="mh1-scroll-arrow mh1-drag-arrow"
        style={{ 
          borderRightColor: dragProgress > 0 ? '#fbbf24' : '#f59e0b',
          borderBottomColor: dragProgress > 0 ? '#fbbf24' : '#f59e0b',
        }} 
      />
      <p className="mh1-drag-text">
        {dragProgress > 0 ? 'Keep dragging...' : 'Drag up to unlock'}
      </p>
    </div>
  );
};

/**
 * Map Section with Sidebars
 */
export const MapSection = ({ logos, MapComponent, visible }) => {
  if (!visible) return null;

  return (
    <section className="mh1-section">
      <div className="mh1-map-layout">
        {/* Map */}
        <div className="mh1-map-container">
          <React.Suspense fallback={<MapLoading />}>
            <MapComponent />
          </React.Suspense>
        </div>

        {/* Logos */}
        <div className="mh1-logo-container">
          {logos.map((logo, index) => (
            <img 
              key={index}
              src={logo.src} 
              alt={logo.alt} 
              title={logo.title}
              className={logo.className}
            />
          ))}
        </div>

        {/* Description Sidebar */}
        <div className="mh1-sidebar">
          <h2>Data Metrics</h2>
          <MetricItem label="Collaborators" value="Meinhardt EPCM" />
          <MetricItem label="Type" value="Design and Preliminary Design" />
          <MetricItem 
            label="Description" 
            value="A project is a temporary endeavor undertaken to create a unique product, service, or result. It can involve anything from the glamorous events of Fashion Week to humanitarian aid efforts overseas. More specifically, a project is a series of structured tasks, activities, and deliverables that are carefully executed to achieve a desired outcome."
          />
          <p className="mh1-description-label">
            *Client Name and certain details have been omitted for confidentiality
          </p>
        </div>
      </div>
    </section>
  );
};

/**
 * Metric Item Component (for sidebar)
 */
const MetricItem = ({ label, value }) => (
  <div className="mh1-description-grid">
    <div className="mh1-description-value">{label}</div>
    <div className="mh1-description-label">{value}</div>
  </div>
);

/**
 * Map Loading State
 */
const MapLoading = () => (
  <div className="mh1-map-loading">
    Loading Genetic Map...
  </div>
);

/**
 * Image Comparison Slider Component
 */

const ImageComparisonSlider = () => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  const leftImage = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop';
  const rightImage = 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&h=600&fit=crop';

  const handleMove = (clientX) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);

  const handleMouseMove = (e) => {
    if (isDragging) handleMove(e.clientX);
  };

  const handleTouchMove = (e) => {
    if (isDragging) handleMove(e.touches[0].clientX);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div 
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '900px',
        height: '600px',
        overflow: 'hidden',
        cursor: 'ew-resize',
        borderRadius: '12px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}
      onClick={(e) => handleMove(e.clientX)}
    >
      {/* Right Image (Base Layer) */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
      }}>
        <img 
          src={rightImage}
          alt="After"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            userSelect: 'none',
            pointerEvents: 'none',
          }}
          draggable={false}
        />
        <div style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          background: 'rgba(0,0,0,0.7)',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '20px',
          fontSize: '14px',
          fontWeight: 'bold',
        }}>
          After
        </div>
      </div>

      {/* Left Image (Clipped Layer) */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
        transition: isDragging ? 'none' : 'clip-path 0.1s ease-out',
      }}>
        <img 
          src={leftImage}
          alt="Before"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            userSelect: 'none',
            pointerEvents: 'none',
          }}
          draggable={false}
        />
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          background: 'rgba(0,0,0,0.7)',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '20px',
          fontSize: '14px',
          fontWeight: 'bold',
        }}>
          Before
        </div>
      </div>

      {/* Slider Handle */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: `${sliderPosition}%`,
          width: '4px',
          height: '100%',
          background: 'white',
          transform: 'translateX(-50%)',
          cursor: 'ew-resize',
          boxShadow: '0 0 10px rgba(0,0,0,0.5)',
          transition: isDragging ? 'none' : 'left 0.1s ease-out',
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
      >
        {/* Handle Circle */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '48px',
          height: '48px',
          background: 'white',
          borderRadius: '50%',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'grab',
        }}>
          {/* Left Arrow */}
          <div style={{
            position: 'absolute',
            left: '12px',
            width: '0',
            height: '0',
            borderTop: '6px solid transparent',
            borderBottom: '6px solid transparent',
            borderRight: '8px solid #333',
          }} />
          
          {/* Right Arrow */}
          <div style={{
            position: 'absolute',
            right: '12px',
            width: '0',
            height: '0',
            borderTop: '6px solid transparent',
            borderBottom: '6px solid transparent',
            borderLeft: '8px solid #333',
          }} />
        </div>
      </div>

      {/* Percentage Indicator */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(0,0,0,0.7)',
        color: 'white',
        padding: '8px 16px',
        borderRadius: '20px',
        fontSize: '14px',
        fontWeight: 'bold',
      }}>
        {Math.round(sliderPosition)}% | {Math.round(100 - sliderPosition)}%
      </div>
    </div>
  );
};
export default ImageComparisonSlider;