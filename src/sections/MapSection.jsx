// src/sections/MapSection.jsx
// ============================================
// MAP SECTION - 3-Column Flex Layout with Timeline Animation
// ============================================

import React, { useState, useEffect, Suspense, useRef } from 'react';
import { ComponentLoading } from '../components/common/LayoutComponents.jsx';

/**
 * MapSection - 3-column layout with coordinated timeline animation
 * 
 * @param {React.Component} MapComponent - The MyMap component to render
 * @param {Object} logos - Dictionary of logo objects {key: {src, alt, title, className}}
 * @param {Object} description - Description data {title, metrics, disclaimer}
 * @param {boolean} visible - Control visibility
 * @param {boolean} autoPlay - Whether to auto-play animations (default: true)
 * @param {number} timelineStartDelay - Delay before starting timeline (ms)
 * @param {number} animationIncrement - Delay between animations (ms, default: 300)
 */
export const MapSection = ({ 
  MapComponent,
  logos = {},
  description = {},
  visible = true,
  autoPlay = true,
  timelineStartDelay = 1000,
  animationIncrement = 300 // 0.3s between animations
}) => {
  const [timelinePhase, setTimelinePhase] = useState('idle');
  const [animatedLogos, setAnimatedLogos] = useState([]);
  const [animatedMetrics, setAnimatedMetrics] = useState([]);
  const [hoveredLogo, setHoveredLogo] = useState(null);
  const animationTimers = useRef([]);
  const isAnimating = useRef(false);
  const logoAnimationIndex = useRef(0);
  const metricAnimationIndex = useRef(0);

  // Convert logos dictionary to array
  const getLogosToRender = () => {
    if (!logos || typeof logos !== 'object') return [];
    
    if (Array.isArray(logos)) {
      return logos.map((logo, index) => ({
        ...logo,
        id: logo.id || `logo-${index}`
      }));
    } else {
      return Object.entries(logos).map(([key, logoData]) => ({
        ...logoData,
        id: key
      }));
    }
  };

  const logosToRender = getLogosToRender();
  const metricsToRender = description.metrics || [];

  // Logo hover handlers
  const handleLogoMouseEnter = (logoId) => {
    setHoveredLogo(logoId);
  };

  const handleLogoMouseLeave = () => {
    setHoveredLogo(null);
  };

  // Animate logos one by one
  const animateNextLogo = () => {
    if (logoAnimationIndex.current < logosToRender.length) {
      const currentLogo = logosToRender[logoAnimationIndex.current];
      console.log(`🎬 Animating logo ${logoAnimationIndex.current + 1}/${logosToRender.length}: ${currentLogo.id}`);
      
      setAnimatedLogos(prev => [...prev, currentLogo.id]);
      
      // Schedule next logo animation
      const timer = setTimeout(() => {
        logoAnimationIndex.current += 1;
        animateNextLogo();
      }, animationIncrement);
      
      animationTimers.current.push(timer);
    } else {
      // All logos animated, move to sidebar phase
      console.log('✅ All logos animation complete');
      const sidebarTimer = setTimeout(() => {
        setTimelinePhase('sidebar');
        console.log('📊 Timeline: Moving to Sidebar Phase');
        
        // Start sidebar animations after a brief pause
        const sidebarStartTimer = setTimeout(() => {
          startSidebarAnimations();
        }, 200);
        animationTimers.current.push(sidebarStartTimer);
      }, 500);
      
      animationTimers.current.push(sidebarTimer);
    }
  };

  // Animate sidebar content sequentially
  const startSidebarAnimations = () => {
    console.log('📊 Timeline: Starting sidebar content animations');
    
    // Start with title animation
    const titleTimer = setTimeout(() => {
      console.log('📊 Sidebar: Title animating');
      
      // Start metrics animations after title
      const metricsStartTimer = setTimeout(() => {
        animateNextMetric();
      }, animationIncrement);
      
      animationTimers.current.push(metricsStartTimer);
    }, animationIncrement);
    
    animationTimers.current.push(titleTimer);
  };

  // Animate metrics one by one
  const animateNextMetric = () => {
    if (metricAnimationIndex.current < metricsToRender.length) {
      const currentMetric = metricsToRender[metricAnimationIndex.current];
      console.log(`📊 Animating metric ${metricAnimationIndex.current + 1}/${metricsToRender.length}`);
      
      setAnimatedMetrics(prev => [...prev, metricAnimationIndex.current]);
      
      // Schedule next metric animation
      const timer = setTimeout(() => {
        metricAnimationIndex.current += 1;
        animateNextMetric();
      }, animationIncrement);
      
      animationTimers.current.push(timer);
    } else {
      // All metrics animated, move to disclaimer
      console.log('✅ All metrics animation complete');
      const disclaimerTimer = setTimeout(() => {
        setTimelinePhase('disclaimer');
        console.log('📊 Timeline: Moving to Disclaimer Phase');
        
        // Final completion
        const completeTimer = setTimeout(() => {
          setTimelinePhase('complete');
          isAnimating.current = false;
          console.log('✅ Timeline: All animations complete');
        }, animationIncrement * 2);
        
        animationTimers.current.push(completeTimer);
      }, animationIncrement);
      
      animationTimers.current.push(disclaimerTimer);
    }
  };

  // Start the timeline animation
  const startTimeline = () => {
    if (isAnimating.current) return;
    
    isAnimating.current = true;
    logoAnimationIndex.current = 0;
    metricAnimationIndex.current = 0;
    setAnimatedLogos([]);
    setAnimatedMetrics([]);
    setHoveredLogo(null);
    console.log(`🎬 MapSection: Starting timeline animation with ${logosToRender.length} logos, ${metricsToRender.length} metrics`);
    
    // Clear any existing timers
    animationTimers.current.forEach(timer => clearTimeout(timer));
    animationTimers.current = [];
    
    // Phase 1: Logo column entrance
    const columnTimer = setTimeout(() => {
      setTimelinePhase('column-entrance');
      console.log('📊 Timeline: Phase 1 - Logo Column Entrance');
      
      // Start logo animations after column entrance completes
      const logoStartTimer = setTimeout(() => {
        setTimelinePhase('logos-animating');
        console.log('📊 Timeline: Phase 2 - Starting individual logo animations');
        animateNextLogo();
      }, 2500);
      
      animationTimers.current.push(logoStartTimer);
    }, 500);
    
    animationTimers.current.push(columnTimer);
  };

  // Listen for map animation completion
  useEffect(() => {
    const handleSidebarShow = () => {
      console.log('📊 MapSection: Received map animation complete event');
      
      if (autoPlay) {
        setTimeout(startTimeline, timelineStartDelay);
      }
    };

    window.addEventListener('map-sidebar-visible', handleSidebarShow);
    
    // Auto-start if no event is expected
    if (autoPlay) {
      const autoStartTimer = setTimeout(startTimeline, timelineStartDelay);
      animationTimers.current.push(autoStartTimer);
    }
    
    // Cleanup
    return () => {
      window.removeEventListener('map-sidebar-visible', handleSidebarShow);
      animationTimers.current.forEach(timer => clearTimeout(timer));
      isAnimating.current = false;
      logoAnimationIndex.current = 0;
      metricAnimationIndex.current = 0;
      setAnimatedLogos([]);
      setAnimatedMetrics([]);
      setHoveredLogo(null);
    };
  }, [autoPlay, timelineStartDelay]);

  if (!visible) return null;
  
  // Determine CSS classes based on timeline phase
  const getLogosColumnClass = () => {
    if (timelinePhase === 'column-entrance' || timelinePhase === 'logos-animating' || 
        timelinePhase === 'sidebar' || timelinePhase === 'disclaimer' || 
        timelinePhase === 'complete') {
      return 'map-logos-column timeline-started ' + 
             (timelinePhase === 'column-entrance' ? 'timeline-phase-1' : '');
    }
    return 'map-logos-column';
  };
  
  const getSidebarClass = () => {
    if (timelinePhase === 'sidebar' || timelinePhase === 'disclaimer' || timelinePhase === 'complete') {
      return 'map-description-sidebar timeline-phase-2 ' +
             (timelinePhase === 'disclaimer' || timelinePhase === 'complete' ? 'timeline-phase-3' : '');
    }
    return 'map-description-sidebar';
  };

  // Determine animation state for each logo
  const getLogoAnimationClass = (logoId) => {
    if (timelinePhase === 'logos-animating' || timelinePhase === 'sidebar' || 
        timelinePhase === 'disclaimer' || timelinePhase === 'complete') {
      return animatedLogos.includes(logoId) ? 'logo-animated' : '';
    }
    return '';
  };

  // Determine animation state for each metric
  const getMetricAnimationClass = (index) => {
    if (timelinePhase === 'sidebar' || timelinePhase === 'disclaimer' || timelinePhase === 'complete') {
      return animatedMetrics.includes(index) ? 'metric-animated' : '';
    }
    return '';
  };

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
        <div className={getLogosColumnClass()}>
          {logosToRender.length > 0 ? (
            logosToRender.map((logo, index) => {
              const isHovered = hoveredLogo === logo.id;
              const isAnimated = animatedLogos.includes(logo.id);
              
              return (
                <div 
                  key={logo.id}
                  className={`map-logo-container ${getLogoAnimationClass(logo.id)} ${isHovered ? 'logo-hovered' : ''}`}
                  onMouseEnter={() => handleLogoMouseEnter(logo.id)}
                  onMouseLeave={handleLogoMouseLeave}
                >
                  <img 
                    src={logo.src} 
                    alt={logo.alt || `Logo ${index + 1}`} 
                    title={logo.title || ''}
                    className="map-logo-img"
                    loading="lazy"
                  />
                </div>
              );
            })
          ) : (
            <p className="map-no-logos">No software available</p>
          )}
          
          {/* Timeline debug info */}
          {process.env.NODE_ENV === 'development' && (
            <div className="timeline-debug-info">
              <div>Phase: {timelinePhase}</div>
              <div>Logos: {animatedLogos.length}/{logosToRender.length}</div>
              <div>Metrics: {animatedMetrics.length}/{metricsToRender.length}</div>
              <div>Hovered: {hoveredLogo || 'none'}</div>
            </div>
          )}
        </div>

        {/* RIGHT: Description Sidebar */}
        <div className={getSidebarClass()}>
          <h2 className={`map-sidebar-title ${timelinePhase === 'sidebar' || timelinePhase === 'disclaimer' || timelinePhase === 'complete' ? 'title-animated' : ''}`}>
            {description.title || 'Project Details'}
          </h2>
          
          {/* Metrics List */}
          {metricsToRender.length > 0 && (
            <div className="map-metrics-list">
              {metricsToRender.map((metric, index) => (
                <div key={index} className={`map-metric-item ${getMetricAnimationClass(index)}`}>
                  <div className="map-metric-label">{metric.label}</div>
                  <div className="map-metric-value">{metric.value}</div>
                </div>
              ))}
            </div>
          )}
          
          {/* Disclaimer */}
          {description.disclaimer && (
            <p className={`map-disclaimer ${timelinePhase === 'disclaimer' || timelinePhase === 'complete' ? 'disclaimer-animated' : ''}`}>
              {description.disclaimer}
            </p>
          )}
        </div>
      </div>
    </section>
  );
};

export default MapSection;