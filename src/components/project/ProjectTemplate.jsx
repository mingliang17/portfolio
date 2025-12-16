// src/components/project/ProjectTemplate.jsx
// ============================================
// UNIVERSAL PROJECT TEMPLATE - FIXED MAP SECTION
// ============================================

import React, { Suspense, useState, useCallback } from 'react';
import ProjectLayout from './ProjectLayout.jsx';
import { HeroContent, HeroBackground } from './ProjectComponents.jsx';
import { ScrollPrompt, ComponentLoading } from '../common/LayoutComponents.jsx';
import { useProjectAnimation, useProjectNavigation, useNavbarControl } from '../../hooks/index.js';

const ProjectTemplate = ({
  projectData,
  totalSections = 5,
  sections = [],
  mapDescription = null,
  enableNavbar = true,
  onSectionChange = null,
}) => {
  
  if (!projectData) {
    console.error('❌ ProjectTemplate: projectData is required');
    return <div style={{ color: 'white', padding: '2rem' }}>Error: Project data not found</div>;
  }

  if (!sections || sections.length === 0) {
    console.error('❌ ProjectTemplate: sections array is required');
    return <div style={{ color: 'white', padding: '2rem' }}>Error: No sections configured</div>;
  }

  const [animationPhase, setAnimationPhase] = useState('initial');
  const [currentSection, setCurrentSection] = useState(0);
  const [startMapAnimation, setStartMapAnimation] = useState(false);

  const handleAnimationComplete = useCallback(() => {
    console.log('🎉 Hero animation complete → Moving to section 1');
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

  const {
    titleOpacity,
    unlockProgress,
    gradientOpacity,
    backgroundFade,
    dragProgress,
    handleReturnToHero,
  } = useProjectAnimation(
    currentSection, 
    handleAnimationComplete, 
    setAnimationPhase
  );

  useProjectNavigation(
    totalSections, 
    animationPhase,
    handleGoBack,
    currentSection,
    setCurrentSection,
    startMapAnimation,
    setStartMapAnimation
  );

  if (enableNavbar) {
    useNavbarControl(currentSection, animationPhase, dragProgress);
  }

  // ========================================
  // SECTION RENDERER
  // ========================================
  const renderSection = (sectionConfig, index) => {
    if (currentSection !== index) return null;

    // ----------------------------------------
    // HERO SECTION
    // ----------------------------------------
    if (sectionConfig.type === 'hero') {
      return (
        <section key={index} className="project-section">
          <HeroBackground
            imagePath={sectionConfig.backgroundImage}
            backgroundFade={backgroundFade}
            gradientOpacity={gradientOpacity}
            visible={true}
          />

          <HeroContent
            title={sectionConfig.title}
            subtitle={sectionConfig.subtitle}
            titleOpacity={titleOpacity}
          />

          <ScrollPrompt
            dragProgress={dragProgress}
            visible={animationPhase === 'waiting'}
          />
        </section>
      );
    }

    // ----------------------------------------
    // MAP SECTION - FIXED
    // ----------------------------------------
    if (sectionConfig.type === 'map') {
      return (
        <section key={index} className="project-section">
          {/* Render the pre-configured MapSection component */}
          {sectionConfig.component}
        </section>
      );
    }

    // ----------------------------------------
    // CAROUSEL SECTION
    // ----------------------------------------
    if (sectionConfig.type === 'carousel') {
      return (
        <section key={index} className="project-section">
          {sectionConfig.component}
        </section>
      );
    }

    // ----------------------------------------
    // CUSTOM SECTION
    // ----------------------------------------
    if (sectionConfig.type === 'custom') {
      return (
        <section key={index} className={`project-section ${sectionConfig.className || ''}`}>
          {sectionConfig.component}
        </section>
      );
    }

    console.warn(`⚠️ Unknown section type: ${sectionConfig.type}`);
    return null;
  };

  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 ProjectTemplate State:', { 
      projectId: projectData.id,
      currentSection, 
      animationPhase,
      dragProgress: dragProgress?.toFixed(2),
    });
  }

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