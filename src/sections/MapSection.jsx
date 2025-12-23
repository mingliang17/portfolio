// src/sections/MapSection.jsx
// ============================================
// MAP SECTION - 3-Column Flex Layout with Timeline Animation
// ============================================

import React, { useState, useEffect, Suspense, useRef, useCallback } from 'react';
import { ComponentLoading } from '../components/common/LayoutComponents.jsx';
import { ICONS } from '../assets/icons.js';
import gsap from 'gsap';

/**
 * Helper function to create logos object with proper className from icon names
 * @param {Array<string>} iconNames - Array of icon names to include
 * @param {string} classNamePrefix - Prefix for CSS class (default: 'logo-')
 * @returns {Object} Logos object with enhanced properties
 */
export const createProjectLogos = (iconNames, classNamePrefix = 'logo-') => {
  return iconNames.reduce((logos, iconName) => {
    if (ICONS[iconName]) {
      logos[iconName] = {
        ...ICONS[iconName],
        className: `${classNamePrefix}${iconName}`
      };
    }
    return logos;
  }, {});
};

/**
 * MapSection - 3-column layout with coordinated timeline animation
 */
export const MapSection = ({
  MapComponent,
  logos = {},
  description = {},
  visible = true,
  autoPlay = true,
  timelineStartDelay = 1000,
  animationIncrement = 0.2
}) => {
  const [hoveredLogo, setHoveredLogo] = useState(null);
  const timelineRef = useRef(null);
  const hasStartedRef = useRef(false);
  const animationTimers = useRef([]);

  // Refs for animation targets
  const logosColumnRef = useRef(null);
  const logoContainersRef = useRef([]);
  const sidebarRef = useRef(null);
  const titleRef = useRef(null);
  const metricItemsRef = useRef([]);
  const disclaimerRef = useRef(null);

  // Convert logos object to array
  const getLogosToRender = useCallback(() => {
    if (!logos || typeof logos !== 'object') return [];
    
    return Object.entries(logos).map(([id, data]) => ({
      ...data,
      id
    }));
  }, [logos]);

  const logosToRender = getLogosToRender();
  const metricsToRender = description.metrics || [];

  // Initialize ref arrays
  useEffect(() => {
    logoContainersRef.current = logoContainersRef.current.slice(0, logosToRender.length);
    metricItemsRef.current = metricItemsRef.current.slice(0, metricsToRender.length);
  }, [logosToRender.length, metricsToRender.length]);

  // Create and play GSAP timeline
  const startTimeline = useCallback(() => {
    if (hasStartedRef.current) {
      console.log('⚠️ Timeline already started, skipping');
      return;
    }
    
    console.log('🎬 Starting GSAP timeline');
    hasStartedRef.current = true;

    // Kill any existing timeline
    if (timelineRef.current) {
      timelineRef.current.kill();
    }

    // Create new timeline
    const tl = gsap.timeline({
      defaults: { ease: "power2.out" }
    });
    timelineRef.current = tl;

    console.log('🔧 Setting initial hidden state via GSAP');

    // Set initial hidden state via GSAP (not CSS)
    // This ensures elements are hidden before animation starts
    gsap.set(logosColumnRef.current, {
      opacity: 0,
      x: -50,
      scale: 0.9
    });

    logoContainersRef.current.forEach((logoEl, index) => {
      if (logoEl) {
        gsap.set(logoEl, {
          opacity: 0,
          y: 30,
          scale: 0.8
        });
      }
    });

    gsap.set(sidebarRef.current, {
      opacity: 0,
      x: 50
    });

    gsap.set(titleRef.current, {
      opacity: 0,
      y: -20
    });

    metricItemsRef.current.forEach((metricEl, index) => {
      if (metricEl) {
        gsap.set(metricEl, {
          opacity: 0,
          y: 20
        });
      }
    });

    if (disclaimerRef.current) {
      gsap.set(disclaimerRef.current, {
        opacity: 0,
        y: 20
      });
    }

    // 1. Animate logos column
    tl.to(logosColumnRef.current, {
      opacity: 1,
      x: 0,
      scale: 1,
      duration: 0.8,
      onStart: () => console.log('📊 Timeline: Logos column fade in')
    }, "+=0.5");

    // 2. Animate logos one by one
    logoContainersRef.current.forEach((logoEl, index) => {
      if (logoEl) {
        tl.to(logoEl, {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.6,
          delay: index * animationIncrement,
          onStart: () => console.log(`🎬 Animating logo ${index + 1}/${logosToRender.length}`)
        }, ">");
      }
    });

    // 3. Animate sidebar (after all logos)
    const logosDelay = Math.max(0, (logosToRender.length - 1) * animationIncrement);
    tl.to(sidebarRef.current, {
      opacity: 1,
      x: 0,
      duration: 0.8,
      onStart: () => console.log('📊 Timeline: Sidebar fade in')
    }, `+=${logosDelay + 0.3}`);

    // 4. Animate title
    tl.to(titleRef.current, {
      opacity: 1,
      y: 0,
      duration: 0.6,
      onStart: () => console.log('📊 Timeline: Title fade in')
    }, "+=0.2");

    // 5. Animate metrics one by one
    metricItemsRef.current.forEach((metricEl, index) => {
      if (metricEl) {
        tl.to(metricEl, {
          opacity: 1,
          y: 0,
          duration: 0.5,
          delay: index * animationIncrement * 0.7,
          onStart: () => console.log(`📊 Timeline: Metric ${index + 1} fade in`)
        }, ">");
      }
    });

    // 6. Animate disclaimer (after all metrics)
    if (description.disclaimer && disclaimerRef.current) {
      const metricsDelay = Math.max(0, (metricsToRender.length - 1) * animationIncrement * 0.7);
      tl.to(disclaimerRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        delay: 0.2,
        onStart: () => console.log('📊 Timeline: Disclaimer fade in')
      }, `+=${metricsDelay}`);
    }

    // Final callback
    tl.call(() => {
      console.log('✅ Timeline complete');
    });
  }, [logosToRender.length, metricsToRender.length, animationIncrement, description.disclaimer]);

  // Start timeline on mount
  useEffect(() => {
    if (!visible || !autoPlay) return;

    const timer = setTimeout(() => {
      startTimeline();
    }, timelineStartDelay);

    animationTimers.current.push(timer);

    return () => {
      animationTimers.current.forEach(timer => clearTimeout(timer));
      if (timelineRef.current) {
        timelineRef.current.kill();
      }
      hasStartedRef.current = false;
    };
  }, [visible, autoPlay, timelineStartDelay, startTimeline]);

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

        {/* MIDDLE: Logos Column - Initially hidden (GSAP will hide it) */}
        <div className="map-logos-column" ref={logosColumnRef}>
          {logosToRender.map((logo, index) => (
            <div
              key={logo.id}
              ref={el => { logoContainersRef.current[index] = el }}
              className={`map-logo-container ${hoveredLogo === logo.id ? 'logo-hovered' : ''}`}
              onMouseEnter={() => setHoveredLogo(logo.id)}
              onMouseLeave={() => setHoveredLogo(null)}
            >
              <img
                src={logo.src}
                alt={logo.alt}
                title={logo.title}
                className="map-logo-img"
                loading="lazy"
              />
            </div>
          ))}
        </div>

        {/* RIGHT: Description Sidebar - Initially hidden (GSAP will hide it) */}
        <div className="map-description-sidebar" ref={sidebarRef}>
          <div className="sidebar-section">
            <h2 className="map-sidebar-title" ref={titleRef}>
              {description.title || 'Project Details'}
            </h2>
          </div>
          
          {metricsToRender.length > 0 && (
            <div className="sidebar-section">
              <div className="map-metrics-list">
                {metricsToRender.map((metric, index) => (
                  <div
                    key={index}
                    ref={el => { metricItemsRef.current[index] = el }}
                    className="map-metric-item"
                  >
                    <div className="map-metric-label">{metric.label}</div>
                    <div className="map-metric-value">{metric.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {description.disclaimer && (
            <div className="sidebar-section">
              <p className="map-disclaimer" ref={disclaimerRef}>
                {description.disclaimer}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default MapSection;