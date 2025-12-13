// Consolidated common components used across the application

import React, { useState, useEffect } from 'react';
import {Html, useProgress} from '@react-three/drei'

// ===================================
// NAVIGATION DOTS - Section Navigation Indicator
// ===================================

export const NavigationDots = ({ 
  totalSections, 
  currentSection, 
  onSectionChange, 
  disabled = false 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isFadedIn, setIsFadedIn] = useState(false);
  
  useEffect(() => {
    if (currentSection === 0) {
      setIsVisible(false);
    } else if (currentSection === 1) {
      setIsVisible(true);
      setTimeout(() => setIsFadedIn(true), 100);
    }
  }, [currentSection]);

  return (
    <div 
      className={`mh1-navigation-dots ${isFadedIn ? 'fade-in' : ''}`}
      style={{ opacity: isVisible ? 1 : 0, transition: 'opacity 1s' }}
    >
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

// ===================================
// UNLOCK OVERLAY - Animated Overlay During Unlock Sequence
// ===================================

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

// ===================================
// DRAG PROGRESS INDICATOR - Show Drag Completion Progress
// ===================================

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

// ===================================
// SCROLL PROMPT (DRAG ARROW)
// ===================================

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

// ===================================
// BACKGROUND SYSTEM - Reusable Background with Gradient Mask
// ===================================

export const ProjectBackground = ({ 
  imagePath, 
  backgroundFade = 1, 
  gradientOpacity = 1,
  visible = true 
}) => {
  if (!visible) return null;

  return (
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
};

// ===================================
// MAP SECTION LAYOUT - Layout for Site Map
// ===================================

// Map Section Layout with Animated Sidebar
export const MapSection = ({ 
  logos, 
  MapComponent, 
  description,
  visible = true 
}) => {
  const [sidebarVisible, setSidebarVisible] = useState(false);

  // Listen for map animation completion
  useEffect(() => {
    const handleSidebarShow = () => {
      console.log('📊 MapSection: Received sidebar show event');
      setSidebarVisible(true);
    };

    window.addEventListener('map-sidebar-visible', handleSidebarShow);
    
    return () => {
      window.removeEventListener('map-sidebar-visible', handleSidebarShow);
      setSidebarVisible(false);
    };
  }, []);

  if (!visible) return null;

  return (
    <section className="mh1-section">
      <div className="mh1-map-layout">
        {/* Map Container */}
        <div className="mh1-map-container">
          <React.Suspense fallback={<MapLoading />}>
            {MapComponent}
          </React.Suspense>
        </div>

        {/* Logos - Always visible */}
        <div className="mh1-logo-container">
          {logos.map((logo, index) => (
            <img 
              key={index}
              src={logo.src} 
              alt={logo.alt} 
              title={logo.title}
              className={logo.className || 'mh1-logo'}
            />
          ))}
        </div>

        {/* Description Sidebar - Animated */}
        <div 
          className="mh1-sidebar"
          style={{
            opacity: sidebarVisible ? 1 : 0,
            transform: sidebarVisible ? 'translateX(0)' : 'translateX(50px)',
            transition: 'opacity 0.8s ease-out, transform 0.8s ease-out',
            pointerEvents: sidebarVisible ? 'auto' : 'none'
          }}
        >
          <h2>{description.title || 'Project Details'}</h2>
          
          {description.metrics && description.metrics.map((metric, index) => (
            <MetricItem 
              key={index}
              label={metric.label} 
              value={metric.value}
              delay={index * 0.1} // Stagger animation
              visible={sidebarVisible}
            />
          ))}
          
          {description.disclaimer && (
            <p 
              className="mh1-description-label"
              style={{
                opacity: sidebarVisible ? 1 : 0,
                transition: 'opacity 0.6s ease-out 0.4s'
              }}
            >
              {description.disclaimer}
            </p>
          )}
        </div>
      </div>
    </section>
  );
};

// MetricItem with staggered animation
const MetricItem = ({ label, value, delay = 0, visible }) => (
  <div 
    className="mh1-description-grid"
    style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(10px)',
      transition: `opacity 0.5s ease-out ${delay}s, transform 0.5s ease-out ${delay}s`
    }}
  >
    <div className="mh1-description-value">{label}</div>
    <div className="mh1-description-label">{value}</div>
  </div>
);

// MapLoading component
const MapLoading = () => (
  <div className="mh1-map-loading">
    <div className="mh1-loading-spinner" />
    <p>Loading Map...</p>
  </div>
);

// ===================================
// CANVAS LOADER
// ===================================
export const CanvasLoader = () => {
    const { progress } = useProgress();
    return (
        <Html
            as="div"
            center
            style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                flexDirection: 'column',
            }}
        >
            <span className="canvas-loader" />
            <p style={{ fontSize:14, color: '#F1F1F1', fontWeight:800, marginTop: 40}}>
                {progress !== 0 ? `${progress.toFixed(2)}%` : 'Loading...'}
            </p>
        </Html>
    )
}
