// src/pages/templates/ProjectPage.jsx
import React, { useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { getProjectById } from '@/constants/projectsData.js';
import { useUnifiedScroll } from '@/hooks/useUnifiedScroll.js';

// Section Components
import HeroSection from '@/sections/projects/HeroSection.jsx';
import MapSection from '@/sections/projects/MapSection.jsx';
import ModelSection from '@/sections/projects/ModelSection.jsx';
import SpinSection from '@/sections/projects/SpinSection.jsx';
import AnimeSection from '@/sections/projects/AnimeSection.jsx';
import ExplodeSection from '@/sections/projects/ExplodeSection.jsx';
import CarouselSection from '@/sections/projects/CarouselSection.jsx';
import AppearSection from '@/sections/projects/AppearSection.jsx';
import LongSectionWrapper from '@/components/project/LongSectionWrapper.jsx';

// --- SUB-COMPONENT: CLEANER RENDER LOGIC ---
const SectionRenderer = React.forwardRef(({ section, index, isActive, progress, projectMetadata }, ref) => {
  const { component, config, assets, type, id } = section;
  
  const content = (() => {
    switch (component) {
      case 'HeroSection':
        return <HeroSection imagePath={assets.hero} title={config.title} subtitle={config.subtitle} isActive={isActive} />;
      
      case 'MapSection':
        return <MapSection mapImages={assets.mapImages} logos={assets.logos} description={projectMetadata} visible={isActive} startAnimation={isActive} key={`map-${isActive}`} />;
      
      case 'ModelSection':
        return <ModelSection {...config} isActive={isActive} scrollProgress={progress} />;
      
      case 'AnimeSection':
        return <AnimeSection {...config} isActive={isActive} scrollProgress={progress} />;
      
      case 'SpinSection':
        return <SpinSection {...config} isActive={isActive} scrollProgress={progress} enableDebug={false} />;

      case 'AppearSection':
        return <AppearSection {...config} isActive={isActive} scrollProgress={progress} />;
      
      case 'ExplodeSection':
        return <ExplodeSection {...config} isActive={isActive} scrollProgress={progress} />;
      
      case 'Carousel':
        return <CarouselSection carouselData={assets.images} title={config.title} autoPlay={false} showControls showIndicators />;
      
      default: return null;
    }
  })();

  const sectionProps = {
    ref,
    className: `unified-section section-${id}`,
    'data-section-index': index,
    'data-section-type': type
  };

  return (
    <section {...sectionProps}>
      {type === 'long' ? <LongSectionWrapper sectionId={id}>{content}</LongSectionWrapper> : content}
    </section>
  );
});

const ProjectPage = () => {
  const { project_id } = useParams();
  const project = getProjectById(project_id);

  const sectionsConfig = useMemo(() => {
    if (!project) return [];
    const { sections: s, assets: a } = project;
    const config = [];

    if (s.hero?.enabled)    config.push({ id: 'hero', type: 'hero', component: 'HeroSection', config: s.hero, assets: { hero: a.hero } });
    if (s.map?.enabled)     config.push({ id: 'map', type: 'normal', component: 'MapSection', config: s.map, assets: { mapImages: a.map, logos: a.logos } });
    if (s.model?.enabled)   config.push({ id: 'model', type: 'normal', component: 'ModelSection', config: s.model, assets: {} });
    if (s.anime?.enabled)   config.push({ id: 'anime', type: 'long', component: 'AnimeSection', config: s.anime, assets: {} });
    if (s.spin?.enabled)    config.push({ id: 'spin', type: 'long', component: 'SpinSection', config: s.spin, assets: {} });
    if (s.explode?.enabled) config.push({ id: 'explode', type: 'long', component: 'ExplodeSection', config: s.explode, assets: {} });
    if (s.appear?.enabled)  config.push({ id: 'appear', type: 'long', component: 'AppearSection', config: s.appear, assets: {} });
    
    s.carousels?.forEach(c => {
      if (c.enabled) config.push({ id: c.id, type: 'normal', component: 'Carousel', config: c, assets: { images: c.images } });
    });

    return config;
  }, [project]);

  const {
    containerRef, sectionRefs, currentSectionIndex, isTransitioning,
    transitionDirection, internalScrollProgress, goToSection, totalSections
  } = useUnifiedScroll(sectionsConfig, {
    transitionDuration: 1.2, easingFunction: 'power3.inOut', rotationDegrees: 15
  });

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  if (!project) return <div className="project-error"><h1>Project not found</h1></div>;

  return (
    <div className="unified-project-container" ref={containerRef}>
      {/* Nav Dots */}
      <div className="unified-nav-dots">
        {sectionsConfig.map((s, idx) => (
          <button key={s.id} className={`unified-nav-dot ${idx === currentSectionIndex ? 'active' : ''}`} 
                  onClick={() => !isTransitioning && goToSection(idx)}>
            <span className="dot-label">{s.id}</span>
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="unified-content-container">
        {sectionsConfig.map((section, index) => {
          // Simplified progress logic
          const progress = index < currentSectionIndex ? 0.999 : index > currentSectionIndex ? 0 : Math.min(internalScrollProgress, 0.999);
          
          return (
            <SectionRenderer 
              key={section.id}
              ref={el => (sectionRefs.current[index] = el)}
              section={section}
              index={index}
              isActive={index === currentSectionIndex}
              progress={progress}
              projectMetadata={project.metadata}
            />
          );
        })}
      </div>

      {/* Transition Arrow */}
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