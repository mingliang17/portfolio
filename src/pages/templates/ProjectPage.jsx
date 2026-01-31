// src/pages/templates/ProjectPage.jsx
// COMPLETE REWRITE - Premium glass-panel transition system

import React, { useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { getProjectById } from '@/constants/projectsData.js';
import { useUnifiedScroll } from '@/hooks/useUnifiedScroll.js';

// Section Components
import { HeroBackground, HeroContent } from '@/components/project/ProjectComponents.jsx';
import HeroSection from '@/sections/projects/HeroSection.jsx';
import MapSection from '@/sections/projects/MapSection.jsx';
import ModelSection from '@/sections/projects/ModelSection.jsx';
import SpinSection from '@/sections/projects/SpinSection.jsx';
import AnimeSection from '@/sections/projects/AnimeSection.jsx';
import Carousel from '@/sections/projects/Carousel.jsx';
import LongSectionWrapper from '@/components/project/LongSectionWrapper.jsx';

const ProjectPage = () => {
  const { project_id } = useParams();
  const project = getProjectById(project_id);

  // Build sections configuration
  const sectionsConfig = useMemo(() => {
    if (!project) return [];

    const sections = [];
    const { sections: projectSections, assets } = project;

    // Hero Section (always first)
    if (projectSections.hero?.enabled) {
      sections.push({
        id: 'hero',
        type: 'hero',
        component: 'HeroSection',
        config: projectSections.hero,
        assets: { hero: assets.hero }
      });
    }

    // Map Section
    if (projectSections.map?.enabled) {
      sections.push({
        id: 'map',
        type: 'normal',
        component: 'MapSection',
        config: projectSections.map,
        assets: {
          mapImages: assets.map,
          logos: assets.logos
        }
      });
    }

    // Model Section
    if (projectSections.model?.enabled) {
      sections.push({
        id: 'model',
        type: 'normal', // Model sections are typically scrollable
        component: 'ModelSection',
        config: projectSections.model,
        assets: {}
      });
    }

    // Anime Section
    if (projectSections.anime?.enabled) {
      sections.push({
        id: 'anime',
        type: 'long', // Anime sections are long
        component: 'AnimeSection',
        config: projectSections.anime,
        assets: {}
      });
    }

    // Spin Section
    if (projectSections.spin?.enabled) {
      sections.push({
        id: 'spin',
        type: 'long', // Spin sections are long
        component: 'SpinSection',
        config: projectSections.spin,
        assets: {}
      });
    }

    // Carousels
    if (projectSections.carousels) {
      projectSections.carousels.forEach((carousel) => {
        if (carousel.enabled) {
          sections.push({
            id: carousel.id,
            type: 'normal',
            component: 'Carousel',
            config: carousel,
            assets: { images: carousel.images }
          });
        }
      });
    }

    return sections;
  }, [project]);

  // Initialize unified scroll system
  const {
    containerRef,
    sectionRefs,
    currentSectionIndex,
    isTransitioning,
    transitionDirection,
    internalScrollProgress,
    goToSection,
    totalSections,
    isLongSection
  } = useUnifiedScroll(sectionsConfig, {
    transitionDuration: 1.2, // SLOWER TRANSITION (Req 2)
    easingFunction: 'power3.inOut', // LIQUID FEEL (Req 2)
    rotationDegrees: 15, // HORIZONTAL TILT (Req 2)
    enableDebug: true
  });

  // Listen for section changes to trigger animations
  useEffect(() => {
    const handleSectionChange = (e) => {
      const { index, section, direction } = e.detail;
      console.log(`📍 Section changed to: ${section?.id} (index: ${index})`);
    };

    window.addEventListener('sectionChanged', handleSectionChange);
    return () => window.removeEventListener('sectionChanged', handleSectionChange);
  }, []);

  // Prevent native scroll and add body class
  useEffect(() => {
    document.body.classList.add('unified-scroll-active');
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.classList.remove('unified-scroll-active');
      document.body.style.overflow = '';
    };
  }, []);

  if (!project) {
    return (
      <div className="project-error">
        <h1>Project not found</h1>
        <p>Project ID: {project_id}</p>
      </div>
    );
  }

  const renderSection = (section, index) => {
    const { component, config, assets } = section;

    const sectionProps = {
      ref: (el) => (sectionRefs.current[index] = el),
      key: section.id,
      className: `unified-section section-${section.id}`,
      'data-section-index': index,
      'data-section-type': section.type
    };

    switch (component) {
      case 'HeroSection':
        return (
          <section {...sectionProps}>
            <HeroSection
              imagePath={assets.hero}
              title={config.title}
              subtitle={config.subtitle}
              isActive={index === currentSectionIndex}
            />
          </section>
        );

      case 'MapSection':
        // REQ 1: Fix MapSection animation triggering
        // Using `key` to force remount if needed, or relying on `startAnimation` updates
        const isMapActive = index === currentSectionIndex;
        return (
          <section {...sectionProps}>
            <MapSection
              mapImages={assets.mapImages}
              logos={assets.logos}
              description={project.metadata}
              visible={isMapActive}
              startAnimation={isMapActive}
              // Force update when active state changes to ensure animation trigger
              key={`map-${index}-${isMapActive ? 'active' : 'inactive'}`} 
            />
          </section>
        );

      case 'ModelSection':
        return (
          <section {...sectionProps}>
            <LongSectionWrapper sectionId={section.id}>
              <ModelSection
                componentName={config.componentName}
                modelUrl={config.modelPath}
                modelType={config.modelType}
                scale={config.scale}
                position={config.position}
                rotation={config.rotation}
                cameraPosition={config.cameraPosition}
                cameraFov={config.cameraFov}
                environment={config.environment}
                backgroundColor={config.backgroundColor}
                enableShadows={config.enableShadows}
              />
            </LongSectionWrapper>
          </section>
        );

      case 'AnimeSection':
        return (
          <section {...sectionProps}>
            <LongSectionWrapper sectionId={section.id}>
              <AnimeSection
                modelPath={config.modelPath}
                checkpoints={config.checkpoints}
                debugMode={false}
                isActive={index === currentSectionIndex}
                scrollProgress={index === currentSectionIndex ? internalScrollProgress : 0}
              />
            </LongSectionWrapper>
          </section>
        );

      case 'SpinSection':
        return (
          <section {...sectionProps}>
            <LongSectionWrapper sectionId={section.id}>
              <SpinSection
                componentName={config.componentName}
                modelUrl={config.modelPath}
                modelType={config.modelType}
                scale={config.scale}
                position={config.position}
                rotation={config.rotation}
                cameraPosition={config.cameraPosition}
                cameraFov={config.cameraFov}
                environment={config.environment}
                backgroundColor={config.backgroundColor}
                enableShadows={config.enableShadows}
                checkpoints={config.checkpoints}
                rotationsPerScroll={config.rotationsPerScroll}
                isActive={index === currentSectionIndex}
                scrollProgress={index === currentSectionIndex ? internalScrollProgress : 0}
              />
            </LongSectionWrapper>
          </section>
        );

      case 'Carousel':
        return (
          <section {...sectionProps}>
            <Carousel
              carouselData={assets.images}
              title={config.title}
              autoPlay={false}
              showControls={true}
              showIndicators={true}
            />
          </section>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`unified-project-container ${process.env.NODE_ENV === 'development' ? 'debug-mode' : ''}`} ref={containerRef}>
      {/* Debug Overlay */}
      {process.env.NODE_ENV === 'development' && (
        <div className="debug-overlay">
          <div className="debug-panel">
            <h3>🔍 Section Debug</h3>
            <p><strong>Current:</strong> {currentSectionIndex + 1} / {totalSections}</p>
            <p><strong>ID:</strong> {sectionsConfig[currentSectionIndex]?.id}</p>
            <p><strong>Type:</strong> {sectionsConfig[currentSectionIndex]?.type}</p>
            <p><strong>Transitioning:</strong> {isTransitioning ? '⏳ Yes' : '✅ No'}</p>
            <p><strong>Direction:</strong> {transitionDirection || 'None'}</p>
            <p><strong>Is Long:</strong> {isLongSection ? '📜 Yes' : '📄 No'}</p>
            <p><strong>Scroll Progress:</strong> {(internalScrollProgress * 100).toFixed(1)}%</p>
            <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #0f0' }}>
              <p style={{ fontSize: '10px', color: '#0ff' }}>🎨 Glass Effect Active</p>
              <p style={{ fontSize: '10px', color: '#ff0' }}>Yellow = Animating</p>
              <p style={{ fontSize: '10px', color: '#0f0' }}>Green = Active</p>
              <p style={{ fontSize: '10px', color: '#f00' }}>Red = Hidden</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Dots */}
      <div className="unified-nav-dots">
        {sectionsConfig.map((section, idx) => (
          <button
            key={section.id}
            className={`unified-nav-dot ${idx === currentSectionIndex ? 'active' : ''}`}
            onClick={() => !isTransitioning && goToSection(idx)}
            disabled={isTransitioning}
            aria-label={`Go to ${section.id}`}
          >
            <span className="dot-label">{section.id}</span>
          </button>
        ))}
      </div>

      {/* Sections Container */}
      <div className="unified-content-container">
        {sectionsConfig.map((section, index) => renderSection(section, index))}
      </div>

      {/* Transition Indicator */}
      {isTransitioning && (
        <div className="transition-indicator">
          <div className={`transition-arrow ${transitionDirection}`}>
            {transitionDirection === 'down' ? '↓' : '↑'}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectPage;