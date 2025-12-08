// src/pages/projects/ProjectMH1.jsx
// Refactored version using new modular structure

import React, { Suspense, lazy } from 'react';
import ProjectLayout from '../../components/project/ProjectLayout.jsx';
import { HeroContent, HeroBackground, } from '../../components/project/ProjectComponents.jsx';
import { ScrollPrompt, MapSection, } from '../../components/common/LayoutComponents.jsx';

import Carousel from '../../sections/Carousel';

import { useProjectAnimation, useProjectNavigation, useNavbarControl } from '../../hooks/index.js';

import { getProjectById } from '../../constants/projectsData.js';
import { CAROUSEL_DATA } from '../../constants/carouselData.js';

// Lazy load MyMap to prevent early mounting
const MyMap = lazy(() => {
  console.log('Loading MyMap component...');
  return import('../../sections/MyMap.jsx').then(module => {
    console.log('MyMap loaded successfully');
    return module;
  }).catch(error => {
    console.error('Failed to load MyMap:', error);
    throw error;
  });
});

const Mh1 = () => {
  // Get project configuration
  const projectData = getProjectById('mh1');
  const totalSections = 3; // Hero, Map, Carousel

  console.log('🔵 Mh1 component mounted');
  console.log('🔵 Initial projectData:', projectData);

  // Custom hooks for state management
  const { 
    currentSection, 
    setCurrentSection,
    startMapAnimation,
    setStartMapAnimation 
  } = useProjectNavigation(totalSections, null, handleGoBack);

  console.log('🔵 currentSection from hook:', currentSection);

  const {
    animationPhase,
    titleOpacity,
    unlockProgress,
    gradientOpacity,
    backgroundFade,
    dragProgress,
    setAnimationPhase,
  } = useProjectAnimation(currentSection);

  const { hideNavbar, showNavbar } = useNavbarControl(currentSection, animationPhase);

  /**
   * Handle going back to previous section
   * Special handling for section 0 to reset animations
   */
  function handleGoBack(section, setSectionCallback) {
    if (section === 1) {
      // Going back from section 1 to section 0
      setStartMapAnimation(false);
      setBackgroundFade(0);
      setSectionCallback(0);
      
      setTimeout(() => {
        let reverseFade = 0;
        const reverseFadeInterval = setInterval(() => {
          reverseFade += 0.05;
          setBackgroundFade(Math.min(1, reverseFade));
          
          if (reverseFade >= 1) {
            clearInterval(reverseFadeInterval);
            setAnimationPhase('waiting');
            setTitleOpacity(1);
            setGradientOpacity(1);
          }
        }, 20);
      }, 500);
    } else {
      setSectionCallback(prev => prev - 1);
    }
  }

  // Prepare map section description
  const mapDescription = {
    title: 'Data Metrics',
    metrics: [
      { label: 'Collaborators', value: projectData.metadata.collaborators },
      { label: 'Type', value: projectData.metadata.type },
      { label: 'Description', value: projectData.metadata.description },
    ],
    disclaimer: projectData.metadata.disclaimer,
  };

  return (
    <ProjectLayout
      currentSection={currentSection}
      totalSections={totalSections}
      animationPhase={animationPhase}
      unlockProgress={unlockProgress}
      dragProgress={dragProgress}
      onSectionChange={setCurrentSection}
    >
      {/* ============================
          SECTION 0: HERO
          ============================ */}
      {currentSection === 0 && (
        <section className="mh1-section mh1-hero-section">
          {/* Background Image with Gradient */}
          <HeroBackground
            imagePath={projectData.assets.hero}
            backgroundFade={backgroundFade}
            gradientOpacity={gradientOpacity}
            visible={true}
          />

          {/* Hero Title & Subtitle */}
          <HeroContent
            title={projectData.sections.hero.title}
            subtitle={projectData.sections.hero.subtitle}
            titleOpacity={titleOpacity}
          />

          {/* Scroll Prompt (only during waiting phase) */}
          <ScrollPrompt
            dragProgress={dragProgress}
            visible={animationPhase === 'waiting'}
          />
        </section>
      )}

      {/* ============================
          SECTION 1: MAP
          ============================ */}
      {currentSection === 1 && (
        <MapSection
          logos={projectData.assets.logos  || []}
          MapComponent={<MyMap startAnimation={startMapAnimation} mapImages={projectData.assets.map} />}          
          description={mapDescription}
          visible={true}
        />
      )}

      {/* ============================
          SECTION 2: CAROUSEL
          ============================ */}
      {currentSection === 2 && (
        <section className="mh1-section mh1-carousel-section-wrapper">
          <Carousel 
            carouselData={CAROUSEL_DATA.mh1}
            title="Project Gallery"
            autoPlay={false}
            showControls={true}
            showIndicators={true}
            className="mh1-carousel"
          />
        </section>
      )}


      {/* ============================
          SECTION 3: CAROUSEL
          ============================ */}
      {currentSection === 3 && (
        <section className="mh1-section mh1-carousel-section-wrapper">
          Testing its the new one
        </section>
      )}
    </ProjectLayout>
  );
};

export default Mh1;