// src/components/project/ProjectComponents.jsx
import React from 'react';

/**
 * Navigation Dots Component
 */
export const NavigationDots = ({ totalSections, currentSection, onSectionChange, disabled }) => (
  <div className="mh1-navigation-dots">
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