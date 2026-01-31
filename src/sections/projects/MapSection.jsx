// src/sections/projects/MapSection.jsx
// UPDATED: Properly handles animation reset, triggers, and metadata mapping

import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ICONS } from '../../assets/icons.js';

export const MapSection = ({
  mapImages = {},
  logos = {},
  description = {},
  visible = true,
  startAnimation = false
}) => {
  const [hoveredLogo, setHoveredLogo] = useState(null);
  const masterTimelineRef = useRef(null);
  const sectionRef = useRef(null);

  const mapImageRefs = useRef({
    A: null, B: null, C: null, D: null, E: null
  });
  
  const logoRefs = useRef({});
  const sidebarRef = useRef(null);
  const titleRef = useRef(null);
  const metricRefs = useRef([]);
  const disclaimerRef = useRef(null);

  const logosArray = React.useMemo(() => {
    if (!logos || typeof logos !== 'object') return [];
    return Object.entries(logos).map(([id, data]) => ({ ...data, id }));
  }, [logos]);

  const metricsArray = React.useMemo(() => {
    // If metrics are explicitly provided, use them
    if (description.metrics && Array.isArray(description.metrics)) {
      return description.metrics;
    }
    
    // Otherwise, convert other metadata fields into metrics
    const blacklist = ['title', 'description', 'disclaimer', 'metrics', 'tags'];
    return Object.entries(description)
      .filter(([key]) => !blacklist.includes(key))
      .map(([key, value]) => ({
        label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
        value: Array.isArray(value) ? value.join(', ') : value
      }));
  }, [description]);

  const paths = {
    A: mapImages.A || '', B: mapImages.B || '', C: mapImages.C || '', D: mapImages.D || '', E: mapImages.E || ''
  };

  useEffect(() => {
    if (!visible) {
      if (masterTimelineRef.current) masterTimelineRef.current.kill();
      masterTimelineRef.current = null;
      return;
    }

    if (!startAnimation) return;

    if (masterTimelineRef.current && masterTimelineRef.current.isActive()) return;

    console.log('🗺️ MapSection: Starting animation sequence');
    if (masterTimelineRef.current) masterTimelineRef.current.kill();

    const animationTimeout = setTimeout(() => {
      const mapImgs = mapImageRefs.current;
      const logoEls = logosArray.map(logo => logoRefs.current[logo.id]).filter(Boolean);
      const sidebar = sidebarRef.current;
      const title = titleRef.current;
      const metricEls = metricRefs.current.filter(Boolean);
      const disclaimer = disclaimerRef.current;

      if (!mapImgs.A || !sidebar) return;

      const allElements = [
        mapImgs.A, mapImgs.B, mapImgs.C, mapImgs.D, mapImgs.E,
        ...logoEls, sidebar, title, ...metricEls, disclaimer
      ].filter(Boolean);

      const master = gsap.timeline({
        defaults: { ease: 'power2.out', force3D: true },
        onComplete: () => {
          allElements.forEach(el => { if (el) el.style.willChange = 'auto'; });
        }
      });

      masterTimelineRef.current = master;

      // Set initial states
      gsap.set([mapImgs.A, mapImgs.B, mapImgs.C, mapImgs.D, mapImgs.E], { autoAlpha: 0, scale: 1, y: 0, x: 0 });
      if (logoEls.length > 0) gsap.set(logoEls, { autoAlpha: 0, y: 30, scale: 0.8 });
      gsap.set(sidebar, { autoAlpha: 0, x: 50 });
      if (title) gsap.set(title, { autoAlpha: 0, y: -20 });
      metricEls.forEach(metric => gsap.set(metric, { autoAlpha: 0, y: 20 }));
      if (disclaimer) gsap.set(disclaimer, { autoAlpha: 0, y: 20 });

      // Sequence
      master.to(mapImgs.A, { autoAlpha: 1, duration: 0.6 }, '+=0.2')
            .to([mapImgs.B, mapImgs.C], { autoAlpha: 1, duration: 0.6 }, '+=0.1');

      master.to(mapImgs.A, { y: -100, duration: 1.0, ease: 'power3.inOut' }, '+=0.1')
            .to(mapImgs.B, { y: -100, duration: 1.0, ease: 'power3.inOut' }, '<')
            .to([mapImgs.C, mapImgs.D, mapImgs.E], { x: -350, y: 150, scale: 12, duration: 1.0, ease: 'power3.inOut' }, '<');

      master.to(mapImgs.D, { autoAlpha: 1, duration: 0.4 }, '-=0.5')
            .to(mapImgs.E, { autoAlpha: 1, duration: 0.4 }, '-=0.2');

      if (logoEls.length > 0) {
        master.to(logoEls, { autoAlpha: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.1, ease: 'back.out(1.5)' }, '-=0.5');
      }

      master.to(sidebar, { autoAlpha: 1, x: 0, duration: 0.7, ease: 'power3.out' }, '-=0.3');
      if (title) master.to(title, { autoAlpha: 1, y: 0, duration: 0.5 }, '-=0.4');
      if (metricEls.length) master.to(metricEls, { autoAlpha: 1, y: 0, duration: 0.4, stagger: 0.05 }, '-=0.3');
      if (disclaimer) master.to(disclaimer, { autoAlpha: 1, y: 0, duration: 0.5 }, '-=0.2');

    }, 50);

    return () => {
      clearTimeout(animationTimeout);
      if (masterTimelineRef.current) masterTimelineRef.current.kill();
    };
  }, [visible, startAnimation, logosArray.length, metricsArray.length, paths]);

  if (!visible) return null;

  return (
    <section ref={sectionRef} className="map-section-wrapper">
      <div className="map-flex-container">
        <div className="map-animation-container">
          <div className="my-map-main">
            {['A', 'B', 'C', 'D', 'E'].map(layer => (
              <div key={layer} ref={el => mapImageRefs.current[layer] = el} className={`my-map-image layer-${layer}`}>
                {paths[layer] && <img src={paths[layer]} alt={`Map ${layer}`} className="my-map-img" />}
              </div>
            ))}
          </div>
        </div>

        <div className="map-logos-column">
          {logosArray.map((logo) => (
            <div
              key={logo.id}
              ref={el => logoRefs.current[logo.id] = el}
              className={`map-logo-container ${hoveredLogo === logo.id ? 'logo-hovered' : ''}`}
              onMouseEnter={() => setHoveredLogo(logo.id)}
              onMouseLeave={() => setHoveredLogo(null)}
            >
              <img src={logo.src} alt={logo.alt} title={logo.title} className="map-logo-img" loading="lazy" />
            </div>
          ))}
        </div>

        <div className="map-description-sidebar" ref={sidebarRef}>
          <div className="sidebar-section">
            <h2 className="map-sidebar-title" ref={titleRef}>
              {description.title || 'Project Details'}
            </h2>
            {description.description && (
              <p className="map-sidebar-desc" style={{ marginTop: '1rem', fontSize: '1rem', color: 'rgba(255,255,255,0.7)', lineHeight: '1.6' }}>
                {description.description}
              </p>
            )}
          </div>
          
          {metricsArray.length > 0 && (
            <div className="sidebar-section">
              <div className="map-metrics-list">
                {metricsArray.map((metric, index) => (
                  <div key={index} ref={el => metricRefs.current[index] = el} className="map-metric-item">
                    <div className="map-metric-label">{metric.label}</div>
                    <div className="map-metric-value">{metric.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {description.disclaimer && (
            <div className="sidebar-section">
              <p className="map-disclaimer" ref={disclaimerRef}>{description.disclaimer}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default MapSection;