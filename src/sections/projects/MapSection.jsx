// src/sections/MapSection.jsx
// OPTIMIZED: Delta-based timing, will-change optimization, smoother animations

import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ICONS } from '../../assets/icons.js';

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
  const animationStartTimeRef = useRef(null);

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

  // Main animation - OPTIMIZED with will-change and better timing
  useEffect(() => {
    if (!visible || !startAnimation || hasAnimatedRef.current) return;

    console.log('🎬 MapSection: Starting optimized animation');
    hasAnimatedRef.current = true;
    animationStartTimeRef.current = performance.now();

    // Wait for DOM to be ready
    requestAnimationFrame(() => {
      const mapImgs = mapImageRefs.current;
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

      if (!mapImgs.A || !sidebar) {
        console.error('❌ Missing essential elements');
        return;
      }

      // Kill existing timeline
      if (masterTimelineRef.current) {
        masterTimelineRef.current.kill();
      }

      // Set will-change for performance optimization
      const allElements = [
        mapImgs.A, mapImgs.B, mapImgs.C, mapImgs.D, mapImgs.E,
        ...logoEls,
        sidebar, title, ...metricEls, disclaimer
      ].filter(Boolean);

      allElements.forEach(el => {
        if (el) {
          el.style.willChange = 'transform, opacity';
        }
      });

      // Create optimized timeline with better easing
      const master = gsap.timeline({
        defaults: { 
          ease: 'power2.out',
          force3D: true // Force GPU acceleration
        },
        onComplete: () => {
          console.log('✅ MapSection: Animation complete');
          const duration = performance.now() - animationStartTimeRef.current;
          console.log(`⏱️ Total animation time: ${(duration / 1000).toFixed(2)}s`);
          
          // Remove will-change after animation completes
          allElements.forEach(el => {
            if (el) {
              el.style.willChange = 'auto';
            }
          });
        }
      });

      masterTimelineRef.current = master;

      // ========================================
      // INITIAL STATE: HIDE EVERYTHING
      // ========================================
      console.log('🔧 Setting initial states');

      gsap.set([mapImgs.A, mapImgs.B, mapImgs.C, mapImgs.D, mapImgs.E], {
        autoAlpha: 0,
        force3D: true
      });

      gsap.set(mapImgs.A, { y: 0 });
      gsap.set(mapImgs.B, { y: 0 });
      gsap.set([mapImgs.C, mapImgs.D, mapImgs.E], { x: 0, y: 0, scale: 1 });

      if (logoEls.length > 0) {
        gsap.set(logoEls, {
          autoAlpha: 0,
          y: 30,
          scale: 0.8,
          force3D: true
        });
      }

      gsap.set(sidebar, {
        autoAlpha: 0,
        x: 50,
        force3D: true
      });

      if (title) {
        gsap.set(title, {
          autoAlpha: 0,
          y: -20,
          force3D: true
        });
      }

      metricEls.forEach(metric => {
        gsap.set(metric, {
          autoAlpha: 0,
          y: 20,
          force3D: true
        });
      });

      if (disclaimer) {
        gsap.set(disclaimer, {
          autoAlpha: 0,
          y: 20,
          force3D: true
        });
      }

      // ========================================
      // COLUMN 1: MYMAP ANIMATION - OPTIMIZED
      // ========================================
      console.log('📊 COLUMN 1: MyMap animation');

      // Phase 1: Fade in Map A (faster)
      master.to(mapImgs.A, {
        autoAlpha: 1,
        duration: 0.6,
        ease: 'power2.out',
        onStart: () => console.log('  🗺️ Map A fade in')
      }, '+=0.2'); // Reduced delay

      // Phase 2: Fade in Maps B & C (faster)
      master.to([mapImgs.B, mapImgs.C], {
        autoAlpha: 1,
        duration: 0.6,
        ease: 'power2.out',
        onStart: () => console.log('  🗺️ Maps B & C fade in')
      }, '+=0.15'); // Reduced delay

      // Phase 3: Movement and zoom (smoother, faster)
      master.to(mapImgs.A, {
        y: -100,
        duration: 1.0, // Reduced from 1.5s
        ease: 'power3.inOut', // Smoother easing
        onStart: () => console.log('  🗺️ Map movement')
      }, '+=0.2');

      master.to(mapImgs.B, {
        y: -100,
        duration: 1.0,
        ease: 'power3.inOut'
      }, '<'); // Start at same time

      master.to([mapImgs.C, mapImgs.D, mapImgs.E], {
        x: -350,
        y: 150,
        scale: 12,
        duration: 1.0,
        ease: 'power3.inOut'
      }, '<');

      // Phase 4: Fade in Map D (faster)
      master.to(mapImgs.D, {
        autoAlpha: 1,
        duration: 0.4,
        ease: 'power2.out',
        onStart: () => console.log('  🗺️ Map D fade in')
      }, '-=0.7'); // Better overlap

      // Phase 5: Fade in Map E (faster)
      master.to(mapImgs.E, {
        autoAlpha: 1,
        duration: 0.4,
        ease: 'power2.out',
        onStart: () => console.log('  🗺️ Map E fade in')
      }, '-=0.35'); // Better overlap

      // ========================================
      // COLUMN 2: LOGOS ANIMATION - OPTIMIZED
      // ========================================
      console.log('📊 COLUMN 2: Logos animation');

      if (logoEls.length > 0) {
        // Faster, smoother logo animations
        logoEls.forEach((logo, index) => {
          master.to(logo, {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            duration: 0.5, // Faster
            ease: 'back.out(1.5)', // Bouncier
            onStart: () => console.log(`  🎨 Logo ${index + 1} animating`)
          }, index === 0 ? '+=0.2' : '+=0.2'); // Consistent spacing
        });
      }

      // ========================================
      // COLUMN 3: SIDEBAR ANIMATION - OPTIMIZED
      // ========================================
      console.log('📊 COLUMN 3: Sidebar animation');

      // Sidebar container (faster)
      master.to(sidebar, {
        autoAlpha: 1,
        x: 0,
        duration: 0.7, // Faster
        ease: 'power3.out',
        onStart: () => console.log('  📄 Sidebar fade in')
      }, '+=0.3');

      // Title (faster)
      if (title) {
        master.to(title, {
          autoAlpha: 1,
          y: 0,
          duration: 0.5,
          ease: 'power2.out',
          onStart: () => console.log('  📄 Title fade in')
        }, '-=0.5');
      }

      // Metrics (faster, better stagger)
      metricEls.forEach((metric, index) => {
        master.to(metric, {
          autoAlpha: 1,
          y: 0,
          duration: 0.4, // Faster
          ease: 'power2.out',
          onStart: () => console.log(`  📄 Metric ${index + 1} fade in`)
        }, index === 0 ? '+=0.15' : '+=0.12'); // Tighter spacing
      });

      // Disclaimer (faster)
      if (disclaimer) {
        master.to(disclaimer, {
          autoAlpha: 1,
          y: 0,
          duration: 0.5,
          ease: 'power2.out',
          onStart: () => console.log('  📄 Disclaimer fade in')
        }, '+=0.2');
      }

      console.log('🚀 Master timeline started');
    });

    return () => {
      if (masterTimelineRef.current) {
        masterTimelineRef.current.kill();
      }
      
      // Clean up will-change
      const allRefs = [
        mapImageRefs.current.A,
        mapImageRefs.current.B,
        mapImageRefs.current.C,
        mapImageRefs.current.D,
        mapImageRefs.current.E,
        sidebarRef.current,
        titleRef.current,
        ...metricRefs.current,
        disclaimerRef.current,
        ...Object.values(logoRefs.current)
      ].filter(Boolean);
      
      allRefs.forEach(el => {
        if (el) {
          el.style.willChange = 'auto';
        }
      });
    };
  }, [visible, startAnimation, logosArray, metricsArray.length, paths]);

  if (!visible) return null;

  return (
    <section className="map-section-wrapper">
      <div className="map-flex-container">
        
        {/* COLUMN 1: MAP ANIMATION */}
        <div className="map-animation-container" ref={mapContainerRef}>
          <div className="my-map-main">
            
            {/* Map Images */}
            <div ref={el => mapImageRefs.current.A = el} className="my-map-image">
              {paths.A && (
                <img 
                  src={paths.A}
                  alt="Map Layer A"
                  className="my-map-img"
                />
              )}
            </div>

            <div ref={el => mapImageRefs.current.B = el} className="my-map-image">
              {paths.B && (
                <img 
                  src={paths.B}
                  alt="Map Layer B"
                  className="my-map-img"
                />
              )}
            </div>

            <div ref={el => mapImageRefs.current.C = el} className="my-map-image">
              {paths.C && (
                <img 
                  src={paths.C}
                  alt="Map Layer C"
                  className="my-map-img"
                />
              )}
            </div>

            <div ref={el => mapImageRefs.current.D = el} className="my-map-image">
              {paths.D && (
                <img 
                  src={paths.D}
                  alt="Map Layer D"
                  className="my-map-img"
                />
              )}
            </div>

            <div ref={el => mapImageRefs.current.E = el} className="my-map-image">
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