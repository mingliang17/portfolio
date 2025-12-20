// src/components/project/ProjectTemplate.jsx
import React, { useCallback, useState, useEffect, useRef } from 'react';
import ProjectLayout from './ProjectLayout.jsx';
import { HeroContent, HeroBackground } from '../../components/project/ProjectComponents.jsx';
import { ScrollPrompt } from '../../components/common/LayoutComponents.jsx';
import { useProjectAnimation } from '../../hooks/useProjectAnimation.js';
import { useProjectNavigation } from '../../hooks/useProjectNavigation.js';

const ProjectTemplate = ({
  projectData,
  sections = [],
  totalSections = 5,
  onSectionChange = null,
}) => {
  if (!projectData) return <div className="project-error">Error: Project data not found</div>;
  if (!sections.length) return <div className="project-error">Error: No sections configured</div>;

  const [currentSection, setCurrentSection] = useState(0);
  const [startMapAnimation, setStartMapAnimation] = useState(false);
  const heroRef = useRef(null);

  const handleAnimationComplete = useCallback(() => {
    setCurrentSection(1);
    onSectionChange?.(1);
  }, [onSectionChange]);

  const handleGoBack = useCallback((section, setSectionCallback) => {
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
    animationStatus,
    gradientOpacity,
    bgOpacity,
    bgScale,
    titleOpacity,
    titleY,
    subtitleOpacity,
    subtitleY,
    dragComponentOpacity,
    dragProgress,
    isHeroUnlocked,
    setHeroSectionRef,
    handleReturnToHero,
  } = useProjectAnimation(currentSection, handleAnimationComplete);

  const showDragUI = animationStatus === 'complete' && !isHeroUnlocked;

  useEffect(() => {
    if (heroRef.current) setHeroSectionRef(heroRef.current);
  }, [setHeroSectionRef]);

  useProjectNavigation(
    totalSections,
    animationStatus,
    handleGoBack,
    currentSection,
    setCurrentSection,
    startMapAnimation,
    setStartMapAnimation
  );

  const renderSection = (sectionConfig, index) => {
    if (currentSection !== index) return null;

    if (sectionConfig.type === 'hero') {
      return (
        <section
          key={index}
          ref={heroRef}
          className="project-section hero-section"
          style={{
            cursor: isHeroUnlocked || animationStatus !== 'complete' ? 'default' : 'grab',
            touchAction: 'pan-y',
            userSelect: 'none',
          }}
        >
          {/* Drag debug */}
          <div className="drag-debug">
            Drag: {Math.round(dragProgress * 100)}% | Status: {animationStatus} | {Math.round(dragProgress * 300)}px/300px
          </div>

          {/* Gradient overlay */}
          <div 
            className="hero-gradient" 
            style={{ opacity: gradientOpacity }} 
          />

          <HeroBackground imagePath={sectionConfig.backgroundImage} opacity={bgOpacity} scale={bgScale} />
          <HeroContent
            title={sectionConfig.title}
            subtitle={sectionConfig.subtitle}
            opacity={titleOpacity}
            subtitleOpacity={subtitleOpacity}
            translateY={titleY}
            subtitleTranslateY={subtitleY}
          />

          <ScrollPrompt dragProgress={dragProgress} visible={showDragUI} />
        </section>
      );
    }

    return (
      <section key={index} className={`project-section ${sectionConfig.className || ''}`}>
        {sectionConfig.component}
      </section>
    );
  };

  return (
    <ProjectLayout
      currentSection={currentSection}
      totalSections={totalSections}
      animationStatus={animationStatus}
      dragProgress={dragProgress}
      onSectionChange={setCurrentSection}
    >
      {sections.map(renderSection)}
    </ProjectLayout>
  );
};

export default ProjectTemplate;
