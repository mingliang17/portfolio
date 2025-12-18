// src/components/project/ProjectTemplate.jsx
// UPDATED: GSAP integration + simplified navbar

import React, { useCallback, useState } from 'react';
import ProjectLayout from './ProjectLayout.jsx';
import { HeroContent, HeroBackground } from './ProjectComponents.jsx';
import { ScrollPrompt } from '../common/LayoutComponents.jsx';
import { useProjectAnimation, useProjectNavigation } from '../../hooks/index.js';

const ProjectTemplate = ({
  projectData,
  totalSections = 5,
  sections = [],
  onSectionChange = null,
}) => {
  
  // ====================================================
  // VALIDATION
  // ====================================================
  if (!projectData) {
    console.error('❌ ProjectTemplate: projectData is required');
    return <div style={{ color: 'white', padding: '2rem' }}>Error: Project data not found</div>;
  }

  if (!sections || sections.length === 0) {
    console.error('❌ ProjectTemplate: sections array is required');
    return <div style={{ color: 'white', padding: '2rem' }}>Error: No sections configured</div>;
  }

  // ====================================================
  // STATE
  // ====================================================
  const [animationPhase, setAnimationPhase] = useState('initial');
  const [currentSection, setCurrentSection] = useState(0);
  const [startMapAnimation, setStartMapAnimation] = useState(false);

  // ====================================================
  // EVENT HANDLERS
  // ====================================================
  const handleAnimationComplete = useCallback(() => {
    console.log('🎉 Hero animation complete → Section 1');
    setCurrentSection(1);
    onSectionChange?.(1);
  }, [onSectionChange]);

  const handleGoBack = useCallback((section, setSectionCallback) => {
    console.log(`⬅️ Going back from section ${section}`);
    
    if (section === 1) {
      setStartMapAnimation(false);
      handleReturnToHero();
      setCurrentSection(0);
      onSectionChange?.(0);
    } else {
      const newSection = Math.max(0, section - 1);
      setSectionCallback(newSection);
      onSectionChange?.(newSection);
    }
  }, [onSectionChange]);

  // ====================================================
  // CUSTOM HOOKS
  // ====================================================
  const {
    titleShouldAnimate,  // CHANGED: Now controls GSAP trigger
    unlockProgress,
    backgroundFade,
    dragProgress,
    handleReturnToHero,
  } = useProjectAnimation(
    currentSection, 
    handleAnimationComplete, 
    setAnimationPhase
  );

  // REMOVED: useNavbarControl (navbar is now always visible)

  useProjectNavigation(
    totalSections, 
    animationPhase,
    handleGoBack,
    currentSection,
    setCurrentSection,
    startMapAnimation,
    setStartMapAnimation
  );

  // ====================================================
  // SECTION RENDERER
  // ====================================================
  const renderSection = (sectionConfig, index) => {
    if (currentSection !== index) return null;

    switch(sectionConfig.type) {
      case 'hero':
        return (
          <section key={index} className="project-section">
            <HeroBackground
              imagePath={sectionConfig.backgroundImage}
              backgroundFade={backgroundFade}
            />
            <HeroContent
              title={sectionConfig.title}
              subtitle={sectionConfig.subtitle}
              shouldAnimate={titleShouldAnimate}  // CHANGED: Trigger GSAP
            />
            <ScrollPrompt
              dragProgress={dragProgress}
              visible={animationPhase === 'waiting'}
            />
          </section>
        );

      case 'map':
      case 'carousel':
      case 'custom':
        return (
          <section 
            key={index} 
            className={`project-section ${sectionConfig.className || ''}`}
          >
            {sectionConfig.component}
          </section>
        );

      default:
        console.warn(`⚠️ Unknown section type: ${sectionConfig.type}`);
        return null;
    }
  };

  // ====================================================
  // RENDER
  // ====================================================
  return (
    <ProjectLayout
      currentSection={currentSection}
      totalSections={totalSections}
      animationPhase={animationPhase}
      unlockProgress={unlockProgress}
      dragProgress={dragProgress}
      onSectionChange={setCurrentSection}
    >
      {sections.map((sectionConfig, index) => 
        renderSection(sectionConfig, index)
      )}
    </ProjectLayout>
  );
};

export default ProjectTemplate;