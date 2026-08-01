import React, { useState, useEffect } from 'react';
import { Html, useProgress } from '@react-three/drei';

// ===================================
// NAVIGATION DOTS
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
      setIsFadedIn(false);
    } else if (currentSection === 1) {
      setIsVisible(true);
      setTimeout(() => setIsFadedIn(true), 100);
    }
  }, [currentSection]);

  if (!isVisible) return null;

  return (
    <div className={`nav-dots ${isFadedIn ? 'fade-in' : ''}`}>
      {Array.from({ length: totalSections }).map((_, i) => (
        <button
          key={i}
          onClick={() => !disabled && onSectionChange(i)}
          className={`nav-dot ${i === currentSection ? 'active' : ''}`}
          aria-label={`Go to section ${i + 1}`}
          disabled={disabled}
        />
      ))}
    </div>
  );
};

// ===================================
// UNLOCK OVERLAY
// ===================================

export const UnlockOverlay = ({ unlockProgress, visible }) => {
  if (!visible) return null;

  return (
    <div className="project-unlock-overlay">
      <div 
        className="project-unlock-circle" 
        style={{ 
          transform: `scale(${unlockProgress * 3})`, 
          opacity: 1 - unlockProgress 
        }} 
      />
      <div 
        className="project-unlock-ring" 
        style={{ 
          transform: `scale(${0.5 + unlockProgress * 1.5}) rotate(${unlockProgress * 360}deg)`,
          opacity: 1 - unlockProgress 
        }} 
      />
    </div>
  );
};

// ===================================
// DRAG PROGRESS INDICATOR - REINSTATED
// ===================================

export const DragProgressIndicator = ({ progress, visible }) => {
  if (!visible || progress === 0) return null;

  return (
    <div className="project-drag-progress">
      <div className="project-drag-progress-bar">
        <div 
          className="project-drag-progress-fill"
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
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    if (visible) {
      // allow mount first, then fade
      requestAnimationFrame(() => setFadeIn(true));
    } else {
      setFadeIn(false);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <div className={`project-scroll-prompt ${fadeIn ? 'fade-in' : ''}`}>
      <div
        className="project-scroll-arrow project-drag-arrow"
        style={{
          borderRightColor: dragProgress > 0 ? '#fbbf24' : '#f59e0b',
          borderBottomColor: dragProgress > 0 ? '#fbbf24' : '#f59e0b',
        }}
      />
      <p className="project-drag-text">
        {dragProgress > 0 ? 'Keep dragging...' : 'Drag up to unlock'}
      </p>

      <DragProgressIndicator
        progress={dragProgress}
        visible={dragProgress > 0}
      />
    </div>
  );
};


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
      <p style={{ 
        fontSize: 14, 
        color: '#F1F1F1', 
        fontWeight: 800, 
        marginTop: 40 
      }}>
        {progress !== 0 ? `${progress.toFixed(2)}%` : 'Loading...'}
      </p>
    </Html>
  );
};

// ===================================
// COMPONENT LOADER
// ===================================

export const ComponentLoading = () => (
  <div className="component-loading">
    <div className="component-loading-spinner" />
    <p>Loading...</p>
  </div>
);