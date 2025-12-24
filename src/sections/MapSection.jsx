// src/sections/MapSection.jsx
// ============================================
// MAP SECTION - UNIFIED SINGLE TIMELINE
// Everything in one component, one timeline
// MyMap + Logos + Sidebar all controlled together
// ============================================

import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ICONS } from '../assets/icons.js';

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

export const MapSection = ({
  mapImages = {},
  logos = {},
  description = {},
  visible = true,
  startAnimation = false
}) => {
  const [hoveredLogo, setHoveredLogo] = useState(null);
  
  const hasAnimatedRef = useRef(false);
  const masterTimelineRef = useRef(null);

  // Refs for ALL elements
  const mapContainerRef = useRef(null);
  const mapImageRefs = useRef({
    A: null,
    B: null,
    C: null,
    D: null,
    E: null
  });
  
  const logoRefs = useRef({});
  
  const sidebarRef = useRef(null);
  const titleRef = useRef(null);
  const metricRefs = useRef([]);
  const disclaimerRef = useRef(null);

  // Convert logos to array
  const logosArray = React.useMemo(() => {
    if (!logos || typeof logos !== 'object') return [];
    return Object.entries(logos)
      .map(([id, data]) => ({ ...data, id }));
  }, [logos]);

  const metricsArray = description.metrics || [];

  // Image paths
  const paths = {
    A: mapImages.A || '',
    B: mapImages.B || '',
    C: mapImages.C || '',
    D: mapImages.D || '',
    E: mapImages.E || ''
  };

  // Main animation - ONE timeline for everything
  useEffect(() => {
    if (!visible || !startAnimation || hasAnimatedRef.current) return;

    console.log('🎬 MapSection: Starting unified animation');
    hasAnimatedRef.current = true;

    // Wait for DOM to be ready
    requestAnimationFrame(() => {
      const mapImgs = mapImageRefs.current;
      
      // Get all logo refs in the correct order
      const logoEls = logosArray.map(logo => logoRefs.current[logo.id]).filter(Boolean);
      
      const sidebar = sidebarRef.current;
      const title = titleRef.current;
      const metricEls = metricRefs.current.filter(Boolean);
      const disclaimer = disclaimerRef.current;

      console.log('📊 Elements check:', {
        mapA: !!mapImgs.A,
        mapB: !!mapImgs.B,
        mapC: !!mapImgs.C,
        mapD: !!mapImgs.D,
        mapE: !!mapImgs.E,
        logos: logoEls.length,
        sidebar: !!sidebar,
        title: !!title,
        metrics: metricEls.length,
        disclaimer: !!disclaimer
      });

      // Verify we have the essential elements
      if (!mapImgs.A || !sidebar) {
        console.error('❌ Missing essential elements');
        return;
      }

      // Kill existing timeline
      if (masterTimelineRef.current) {
        masterTimelineRef.current.kill();
      }

      // Create ONE master timeline
      const master = gsap.timeline({
        defaults: { ease: 'power2.out' },
        onComplete: () => {
          console.log('✅ MapSection: Complete animation finished');
        }
      });

      masterTimelineRef.current = master;

      // ========================================
      // INITIAL STATE: HIDE EVERYTHING
      // ========================================
      console.log('🔧 Setting initial hidden states');

      // Hide all map images
      gsap.set([mapImgs.A, mapImgs.B, mapImgs.C, mapImgs.D, mapImgs.E], {
        autoAlpha: 0
      });

      // Reset map positions
      gsap.set(mapImgs.A, { y: 0 });
      gsap.set(mapImgs.B, { y: 0 });
      gsap.set([mapImgs.C, mapImgs.D, mapImgs.E], { x: 0, y: 0, scale: 1 });

      // Hide all logos
      if (logoEls.length > 0) {
        gsap.set(logoEls, {
          autoAlpha: 0,
          y: 30,
          scale: 0.8
        });
      }

      // Hide sidebar
      gsap.set(sidebar, {
        autoAlpha: 0,
        x: 50
      });

      // Hide title
      if (title) {
        gsap.set(title, {
          autoAlpha: 0,
          y: -20
        });
      }

      // Hide metrics
      metricEls.forEach(metric => {
        gsap.set(metric, {
          autoAlpha: 0,
          y: 20
        });
      });

      // Hide disclaimer
      if (disclaimer) {
        gsap.set(disclaimer, {
          autoAlpha: 0,
          y: 20
        });
      }

      // ========================================
      // COLUMN 1: MYMAP ANIMATION
      // ========================================
      console.log('📊 COLUMN 1: Starting MyMap animation');

      // Phase 1: Fade in Map Image A
      master.to(mapImgs.A, {
        autoAlpha: 1,
        duration: 0.8,
        ease: 'power2.out',
        onStart: () => console.log('  🗺️ Map image A fade in')
      }, '+=0.3');

      // Phase 2: Fade in Map Images B & C
      master.to([mapImgs.B, mapImgs.C], {
        autoAlpha: 1,
        duration: 0.8,
        ease: 'power2.out',
        onStart: () => console.log('  🗺️ Map images B & C fade in')
      }, '+=0.2');

      // Phase 3: Move and zoom
      master.to(mapImgs.A, {
        y: -100,
        duration: 1.5,
        ease: 'power2.inOut',
        onStart: () => console.log('  🗺️ Map movement & zoom')
      }, '+=0.3');

      master.to(mapImgs.B, {
        y: -100,
        duration: 1.5,
        ease: 'power2.inOut'
      }, '<');

      master.to([mapImgs.C, mapImgs.D, mapImgs.E], {
        x: -350,
        y: 150,
        scale: 12,
        duration: 1.5,
        ease: 'power2.inOut'
      }, '<');

      // Phase 4: Fade in Map Image D
      master.to(mapImgs.D, {
        autoAlpha: 1,
        duration: 0.5,
        ease: 'power2.out',
        onStart: () => console.log('  🗺️ Map image D fade in')
      }, '-=0.9');

      // Phase 5: Fade in Map Image E
      master.to(mapImgs.E, {
        autoAlpha: 1,
        duration: 0.5,
        ease: 'power2.out',
        onStart: () => console.log('  🗺️ Map image E fade in')
      }, '-=0.5');

      // ========================================
      // COLUMN 2: LOGOS ANIMATION - SMOOTH & COMPLETE
      // ========================================
      console.log('📊 COLUMN 2: Starting Logos animation');

      // Animate logos one by one with smooth timing
      if (logoEls.length > 0) {
        // Create a smooth sequential animation for logos
        const logoStagger = 0.3; // Time between each logo starts
        const logoDuration = 0.8; // Duration of each logo animation
        
        logoEls.forEach((logo, index) => {
          master.to(logo, {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            duration: logoDuration,
            ease: 'back.out(1.2)',
            onStart: () => console.log(`  🎨 Logo ${index + 1}/${logoEls.length} animating`)
          }, `+=${index === 0 ? 0.3 : logoStagger}`); // First logo after 0.3s, then spaced
        });

        // Add a pause after all logos complete
        const totalLogoTime = 0.3 + (logoEls.length * logoDuration) + ((logoEls.length - 1) * logoStagger);
        console.log(`  ⏱️ Total logo animation time: ${totalLogoTime.toFixed(2)}s`);
      }

      // ========================================
      // COLUMN 3: SIDEBAR ANIMATION - AFTER LOGOS
      // ========================================
      console.log('📊 COLUMN 3: Starting Sidebar animation');

      // Fade in sidebar container (wait for logos to complete)
      master.to(sidebar, {
        autoAlpha: 1,
        x: 0,
        duration: 1.0,
        ease: 'power2.out',
        onStart: () => console.log('  📄 Sidebar container fade in')
      }, '+=0.5'); // Wait 0.5s after last logo completes

      // Fade in title (slight delay after sidebar appears)
      if (title) {
        master.to(title, {
          autoAlpha: 1,
          y: 0,
          duration: 0.8,
          ease: 'power2.out',
          onStart: () => console.log('  📄 Title fade in')
        }, '-=0.7');
      }

      // Animate each metric with smooth spacing
      metricEls.forEach((metric, index) => {
        master.to(metric, {
          autoAlpha: 1,
          y: 0,
          duration: 0.6,
          ease: 'power2.out',
          onStart: () => console.log(`  📄 Metric ${index + 1} fade in`)
        }, `+=${index === 0 ? 0.2 : 0.15}`); // First metric after 0.2s, then spaced
      });

      // Fade in disclaimer (after metrics)
      if (disclaimer) {
        master.to(disclaimer, {
          autoAlpha: 1,
          y: 0,
          duration: 0.8,
          ease: 'power2.out',
          onStart: () => console.log('  📄 Disclaimer fade in')
        }, '+=0.3');
      }

      console.log('🚀 Master timeline started');
    });

    return () => {
      if (masterTimelineRef.current) {
        masterTimelineRef.current.kill();
      }
    };
  }, [visible, startAnimation, logosArray, metricsArray.length, paths]);

  if (!visible) return null;

  return (
    <section className="map-section-wrapper">
      <div className="map-flex-container">
        
        {/* COLUMN 1: MAP ANIMATION */}
        <div className="map-animation-container" ref={mapContainerRef}>
          <div className="my-map-main">
            
            {/* Map Image A */}
            <div 
              ref={el => mapImageRefs.current.A = el}
              className="my-map-image"
            >
              {paths.A && (
                <img 
                  src={paths.A}
                  alt="Map Layer A"
                  className="my-map-img"
                />
              )}
            </div>

            {/* Map Image B */}
            <div 
              ref={el => mapImageRefs.current.B = el}
              className="my-map-image"
            >
              {paths.B && (
                <img 
                  src={paths.B}
                  alt="Map Layer B"
                  className="my-map-img"
                />
              )}
            </div>

            {/* Map Image C */}
            <div 
              ref={el => mapImageRefs.current.C = el}
              className="my-map-image"
            >
              {paths.C && (
                <img 
                  src={paths.C}
                  alt="Map Layer C"
                  className="my-map-img"
                />
              )}
            </div>

            {/* Map Image D */}
            <div 
              ref={el => mapImageRefs.current.D = el}
              className="my-map-image"
            >
              {paths.D && (
                <img 
                  src={paths.D}
                  alt="Map Layer D"
                  className="my-map-img"
                />
              )}
            </div>

            {/* Map Image E */}
            <div 
              ref={el => mapImageRefs.current.E = el}
              className="my-map-image"
            >
              {paths.E && (
                <img 
                  src={paths.E}
                  alt="Map Layer E"
                  className="my-map-img"
                />
              )}
            </div>
          </div>
        </div>

        {/* COLUMN 2: LOGOS */}
        <div className="map-logos-column">
          {logosArray.map((logo) => (
            <div
              key={logo.id}
              ref={el => logoRefs.current[logo.id] = el}
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

        {/* COLUMN 3: SIDEBAR */}
        <div className="map-description-sidebar" ref={sidebarRef}>
          <div className="sidebar-section">
            <h2 className="map-sidebar-title" ref={titleRef}>
              {description.title || 'Project Details'}
            </h2>
          </div>
          
          {metricsArray.length > 0 && (
            <div className="sidebar-section">
              <div className="map-metrics-list">
                {metricsArray.map((metric, index) => (
                  <div
                    key={index}
                    ref={el => metricRefs.current[index] = el}
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