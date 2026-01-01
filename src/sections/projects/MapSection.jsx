// src/sections/projects/MapSection.jsx
// FIXED: Animation only triggers after section transition completes

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
  const [shouldAnimate, setShouldAnimate] = useState(false);
  
  const hasAnimatedRef = useRef(false);
  const masterTimelineRef = useRef(null);
  const sectionRef = useRef(null);

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

  const logosArray = React.useMemo(() => {
    if (!logos || typeof logos !== 'object') return [];
    return Object.entries(logos)
      .map(([id, data]) => ({ ...data, id }));
  }, [logos]);

  const metricsArray = description.metrics || [];

  const paths = {
    A: mapImages.A || '',
    B: mapImages.B || '',
    C: mapImages.C || '',
    D: mapImages.D || '',
    E: mapImages.E || ''
  };

  // Wait for section to be in view and centered before animating
  useEffect(() => {
    if (!visible || !sectionRef.current) return;

    const checkIfCentered = () => {
      const rect = sectionRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      
      // Check if section is centered (within 20% of viewport center)
      const sectionCenter = rect.top + rect.height / 2;
      const viewportCenter = viewportHeight / 2;
      const distance = Math.abs(sectionCenter - viewportCenter);
      const threshold = viewportHeight * 0.2;

      if (distance < threshold && !shouldAnimate) {
        console.log('🎬 MapSection: Section centered, starting animation');
        setShouldAnimate(true);
      }
    };

    const handleScroll = () => {
      if (!shouldAnimate) {
        checkIfCentered();
      }
    };

    // Check immediately and on scroll
    checkIfCentered();
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => window.removeEventListener('scroll', handleScroll);
  }, [visible, shouldAnimate]);

  // Main animation - only runs when shouldAnimate is true
  useEffect(() => {
    if (!visible || !shouldAnimate || hasAnimatedRef.current) return;

    console.log('🎬 MapSection: Starting animation sequence');
    hasAnimatedRef.current = true;

    // Wait for DOM to be ready
    requestAnimationFrame(() => {
      const mapImgs = mapImageRefs.current;
      const logoEls = logosArray.map(logo => logoRefs.current[logo.id]).filter(Boolean);
      const sidebar = sidebarRef.current;
      const title = titleRef.current;
      const metricEls = metricRefs.current.filter(Boolean);
      const disclaimer = disclaimerRef.current;

      if (!mapImgs.A || !sidebar) {
        console.error('❌ Missing essential elements');
        return;
      }

      if (masterTimelineRef.current) {
        masterTimelineRef.current.kill();
      }

      const allElements = [
        mapImgs.A, mapImgs.B, mapImgs.C, mapImgs.D, mapImgs.E,
        ...logoEls,
        sidebar, title, ...metricEls, disclaimer
      ].filter(Boolean);

      allElements.forEach(el => {
        if (el) el.style.willChange = 'transform, opacity';
      });

      const master = gsap.timeline({
        defaults: { 
          ease: 'power2.out',
          force3D: true
        },
        onComplete: () => {
          console.log('✅ MapSection: Animation complete');
          allElements.forEach(el => {
            if (el) el.style.willChange = 'auto';
          });
        }
      });

      masterTimelineRef.current = master;

      // Set initial states
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

      // Animation sequence
      master.to(mapImgs.A, {
        autoAlpha: 1,
        duration: 0.6,
        ease: 'power2.out',
      }, '+=0.2');

      master.to([mapImgs.B, mapImgs.C], {
        autoAlpha: 1,
        duration: 0.6,
        ease: 'power2.out',
      }, '+=0.15');

      master.to(mapImgs.A, {
        y: -100,
        duration: 1.0,
        ease: 'power3.inOut',
      }, '+=0.2');

      master.to(mapImgs.B, {
        y: -100,
        duration: 1.0,
        ease: 'power3.inOut'
      }, '<');

      master.to([mapImgs.C, mapImgs.D, mapImgs.E], {
        x: -350,
        y: 150,
        scale: 12,
        duration: 1.0,
        ease: 'power3.inOut'
      }, '<');

      master.to(mapImgs.D, {
        autoAlpha: 1,
        duration: 0.4,
        ease: 'power2.out',
      }, '-=0.7');

      master.to(mapImgs.E, {
        autoAlpha: 1,
        duration: 0.4,
        ease: 'power2.out',
      }, '-=0.35');

      if (logoEls.length > 0) {
        logoEls.forEach((logo, index) => {
          master.to(logo, {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            duration: 0.5,
            ease: 'back.out(1.5)',
          }, index === 0 ? '+=0.2' : '+=0.2');
        });
      }

      master.to(sidebar, {
        autoAlpha: 1,
        x: 0,
        duration: 0.7,
        ease: 'power3.out',
      }, '+=0.3');

      if (title) {
        master.to(title, {
          autoAlpha: 1,
          y: 0,
          duration: 0.5,
          ease: 'power2.out',
        }, '-=0.5');
      }

      metricEls.forEach((metric, index) => {
        master.to(metric, {
          autoAlpha: 1,
          y: 0,
          duration: 0.4,
          ease: 'power2.out',
        }, index === 0 ? '+=0.15' : '+=0.12');
      });

      if (disclaimer) {
        master.to(disclaimer, {
          autoAlpha: 1,
          y: 0,
          duration: 0.5,
          ease: 'power2.out',
        }, '+=0.2');
      }
    });

    return () => {
      if (masterTimelineRef.current) {
        masterTimelineRef.current.kill();
      }
      
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
        if (el) el.style.willChange = 'auto';
      });
    };
  }, [visible, shouldAnimate, logosArray, metricsArray.length, paths]);

  if (!visible) return null;

  return (
    <section ref={sectionRef} className="map-section-wrapper">
      <div className="map-flex-container">
        
        {/* COLUMN 1: MAP ANIMATION */}
        <div className="map-animation-container">
          <div className="my-map-main">
            
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