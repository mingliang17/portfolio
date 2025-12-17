import React, { Suspense, useState, useCallback, useEffect } from 'react';
import ProjectLayout from './ProjectLayout.jsx';
import { HeroContent, HeroBackground } from './ProjectComponents.jsx';
import { ScrollPrompt, ComponentLoading } from '../common/LayoutComponents.jsx';
import { useProjectAnimation, useProjectNavigation, useNavbarControl } from '../../hooks/index.js';

// ====================================================
// PROJECT TEMPLATE - REUSABLE COMPONENT (DO NOT EDIT)
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
  // NAVBAR CONTROL FOR PROJECT MH1
  // ====================================================
  useEffect(() => {
    if (!enableNavbar) return;
    
    // Hide navbar when past section 1 (Map section)
    const shouldHideNavbar = currentSection > 1;
    
    if (shouldHideNavbar) {
      // Dispatch event to hide navbar
      window.dispatchEvent(new CustomEvent('projectMH1-navbar-hide'));
    } else {
      // Show navbar for sections 0 and 1
      window.dispatchEvent(new CustomEvent('projectMH1-navbar-show'));
    }

    // Cleanup when component unmounts or section changes
    return () => {
      if (shouldHideNavbar) {
        window.dispatchEvent(new CustomEvent('projectMH1-navbar-show'));
      }
    };
  }, [currentSection, enableNavbar]);

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

  // ALWAYS call this hook - condition is handled inside
  const navbarControlResult = useNavbarControl(
    currentSection, 
    animationPhase, 
    dragProgress,
    enableNavbar // Pass enableNavbar as a parameter instead of conditionally calling
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

  // ====================================================
  // SECTION RENDERER - Renders sections based on type
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