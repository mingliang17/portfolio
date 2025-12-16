// src/sections/MapSection.jsx
// ============================================
// MAP SECTION - 3-Column Flex Layout
// ============================================
// Layout: [MyMap Animation] | [Logos] | [Description]

import React, { useState, useEffect, Suspense } from 'react';

/**
 * MapSection - 3-column layout for project map pages
 * 
 * @param {React.Component} MapComponent - The MyMap component to render
 * @param {Array} logos - Array of logo objects {src, alt, title, className}
 * @param {Object} description - Description data {title, metrics, disclaimer}
 * @param {boolean} visible - Control visibility
 */
export const MapSection = ({ 
  MapComponent,  // The actual MyMap component (already rendered)
  logos = [], 
  description = {},
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
    <section className="map-section-wrapper">
      <div className="map-flex-container">
        
        {/* LEFT: Map Animation Container */}
        <div className="map-animation-container">
          <Suspense fallback={<ComponentLoading />}>
            {MapComponent}
          </Suspense>
        </div>

        {/* MIDDLE: Logos Column */}
        <div className="map-logos-column">
          {logos.length > 0 ? (
            logos.map((logo, index) => (
              <img 
                key={index}
                src={logo.src} 
                alt={logo.alt || `Logo ${index + 1}`} 
                title={logo.title || ''}
                className={logo.className || 'map-logo-item'}
              />
            ))
          ) : (
            <p className="map-no-logos">No logos available</p>
          )}
        </div>

        {/* RIGHT: Description Sidebar */}
        <div 
          className="map-description-sidebar"
          style={{
            opacity: sidebarVisible ? 1 : 0,
            transform: sidebarVisible ? 'translateX(0)' : 'translateX(50px)',
            transition: 'opacity 0.8s ease-out, transform 0.8s ease-out',
            pointerEvents: sidebarVisible ? 'auto' : 'none'
          }}
        >
          <h2 className="map-sidebar-title">
            {description.title || 'Project Details'}
          </h2>
          
          {/* Metrics List */}
          {description.metrics && description.metrics.length > 0 && (
            <div className="map-metrics-list">
              {description.metrics.map((metric, index) => (
                <MetricItem 
                  key={index}
                  label={metric.label} 
                  value={metric.value}
                  delay={index * 0.1}
                  visible={sidebarVisible}
                />
              ))}
            </div>
          )}
          
          {/* Disclaimer */}
          {description.disclaimer && (
            <p 
              className="map-disclaimer"
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

/**
 * MetricItem - Individual metric with staggered animation
 */
const MetricItem = ({ label, value, delay = 0, visible }) => (
  <div 
    className="map-metric-item"
    style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(10px)',
      transition: `opacity 0.5s ease-out ${delay}s, transform 0.5s ease-out ${delay}s`
    }}
  >
    <div className="map-metric-label">{label}</div>
    <div className="map-metric-value">{value}</div>
  </div>
);

/**
 * ComponentLoading - Loading state for map component
 */
const ComponentLoading = () => (
  <div className="map-component-loading">
    <div className="map-loading-spinner" />
    <p>Loading Map...</p>
  </div>
);

export default MapSection;