import React, { useState, lazy, useEffect } from 'react';

const MyMapComponent = lazy(() => import('./MyMap.jsx'));
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
      <section className="project-section">
        <div className="map-layout">
          {/* Map Container */}
          <div className="project-map-container">
            <React.Suspense fallback={<ComponentLoading />}>
              {MyMapComponent}
            </React.Suspense>
          </div>

          {/* Logos - Always visible */}
          <div className="project-logo-container">
            {logos.map((logo, index) => (
              <img 
                key={index}
                src={logo.src} 
                alt={logo.alt} 
                title={logo.title}
                className={logo.className || 'project-logo'}
              />
            ))}
          </div>

          {/* Description Sidebar - Animated */}
          <div 
            className="project-sidebar"
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
                className="project-description-label"
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
      className="project-description-grid"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(10px)',
        transition: `opacity 0.5s ease-out ${delay}s, transform 0.5s ease-out ${delay}s`
      }}
    >
      <div className="project-description-value">{label}</div>
      <div className="project-description-label">{value}</div>
    </div>
  );

  //Component Loading
  const ComponentLoading = () => (
    <div className="project-component-loading">
      <div className="mh1-loading-spinner" />
      <p>Loading Component...</p>
    </div>
  );