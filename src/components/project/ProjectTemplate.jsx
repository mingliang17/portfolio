import React, { Suspense, useState, useCallback } from 'react';
import ProjectLayout from './ProjectLayout.jsx';
import { HeroContent, HeroBackground } from './ProjectComponents.jsx';
import { ScrollPrompt, ComponentLoading } from '../common/LayoutComponents.jsx';
import { useProjectAnimation, useProjectNavigation, useNavbarControl } from '../../hooks/index.js';

// ====================================================
// PROJECT TEMPLATE - REUSABLE COMPONENT (DO NOT EDIT)
// ====================================================
// This is a generic template that handles:
// 1. Animation states and transitions
// 2. Navigation between sections
// 3. Section rendering logic
// 4. Error handling
//
// Project-specific content should be passed via props
// from individual project files (e.g., Mh1.jsx)
// ====================================================

const ProjectTemplate = ({
  projectData,
  totalSections = 5,
  sections = [],
  enableNavbar = true,
  onSectionChange = null,
}) => {
  
  // ====================================================
  // ERROR HANDLING - Validate required props
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
  // STATE MANAGEMENT - Animation and navigation states
  // ====================================================
  const [animationPhase, setAnimationPhase] = useState('initial');
  const [currentSection, setCurrentSection] = useState(0);
  const [startMapAnimation, setStartMapAnimation] = useState(false);

  // ====================================================
  // EVENT HANDLERS - Navigation callbacks
  // ====================================================
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

  // ====================================================
  // CUSTOM HOOKS - Animation, navigation, and UI controls
  // ====================================================
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

  // ====================================================
  // SECTION RENDERER - Renders sections based on type
  // ====================================================
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

  // ====================================================
  // DEVELOPMENT LOGS - Only in development mode
  // ====================================================
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 ProjectTemplate State:', { 
      projectId: projectData.id,
      currentSection, 
      animationPhase,
      dragProgress: dragProgress?.toFixed(2),
    });
  }

  // ====================================================
  // MAIN RENDER - ProjectLayout with all sections
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