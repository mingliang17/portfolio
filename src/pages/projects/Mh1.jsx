// src/pages/projects/Mh1.jsx
// FIXED VERSION - Proper navbar visibility control

import React, { Suspense, lazy, useState, useCallback } from 'react';
import ProjectLayout from '../../components/project/ProjectLayout.jsx';
import { HeroContent, HeroBackground } from '../../components/project/ProjectComponents.jsx';
import { ScrollPrompt, MapSection } from '../../components/common/LayoutComponents.jsx';
import Carousel from '../../sections/Carousel.jsx';
import { useProjectAnimation, useProjectNavigation, useNavbarControl } from '../../hooks/index.js';
import { getProjectById } from '../../constants/projectsData.js';

const MyMap = lazy(() => import('../../sections/MyMap.jsx'));

const Mh1 = () => {
  const projectData = getProjectById('mh1');
  const totalSections = 3;

  console.log('🔵 Mh1 component rendered');

  // ⭐ State initialization
  const [animationPhase, setAnimationPhase] = useState('initial');
  const [currentSection, setCurrentSection] = useState(0);
  const [startMapAnimation, setStartMapAnimation] = useState(false);

  // ⭐ Animation completion callback
  const handleAnimationComplete = useCallback(() => {
    console.log('🎉 Animation complete, transitioning to section 1');
    setCurrentSection(1);
  }, []);

  // ⭐ Go back handler
  const handleGoBack = useCallback((section, setSectionCallback) => {
    console.log('⬅️ Going back from section', section);
    
    if (section === 1) {
      // Reset map animation
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
  }, []);

  // ⭐ Get animation state from hook
  const {
    titleOpacity,
    unlockProgress,
    gradientOpacity,
    backgroundFade,
    dragProgress,
    setBackgroundFade,
    setTitleOpacity,
    setGradientOpacity,
  } = useProjectAnimation(currentSection, handleAnimationComplete, setAnimationPhase);

  // ⭐ Navigation hook
  useProjectNavigation(
    totalSections, 
    animationPhase,
    handleGoBack,
    currentSection,
    setCurrentSection,
    startMapAnimation,
    setStartMapAnimation
  );

  // ⭐ FIXED: Pass dragProgress to navbar control
  useNavbarControl(currentSection, animationPhase, dragProgress);

  // Map description
  const mapDescription = {
    title: 'Data Metrics',
    metrics: [
      { label: 'Collaborators', value: projectData.metadata.collaborators },
      { label: 'Type', value: projectData.metadata.type },
      { label: 'Description', value: projectData.metadata.description },
    ],
    disclaimer: projectData.metadata.disclaimer,
  };

  console.log('🔍 Current State:', { 
    currentSection, 
    animationPhase,
    dragProgress: dragProgress?.toFixed(2),
    titleOpacity: titleOpacity?.toFixed(2)
  });

  return (
    <ProjectLayout
      currentSection={currentSection}
      totalSections={totalSections}
      animationPhase={animationPhase}
      unlockProgress={unlockProgress}
      dragProgress={dragProgress}
      onSectionChange={setCurrentSection}
    >
      {/* SECTION 0: HERO */}
      {currentSection === 0 && (
        <section className="mh1-section mh1-hero-section">
          <HeroBackground
            imagePath={projectData.assets.hero}
            backgroundFade={backgroundFade}
            gradientOpacity={gradientOpacity}
            visible={true}
          />


          <HeroContent
            title={projectData.sections.hero.title}
            subtitle={projectData.sections.hero.subtitle}
            titleOpacity={titleOpacity}
          />

          <ScrollPrompt
            dragProgress={dragProgress}
            visible={animationPhase === 'waiting'}
          />
        </section>
      )}

      {/* SECTION 1: MAP */}
      {currentSection === 1 && (
        <MapSection
          logos={projectData.assets.logos || []}
          MapComponent={
            <Suspense fallback={<div className="mh1-map-loading">Loading Map...</div>}>
              <MyMap 
                startAnimation={startMapAnimation} 
                mapImages={projectData.assets.map}
              />
            </Suspense>
          }          
          description={mapDescription}
          visible={true}
        />
      )}

      {/* SECTION 2: CAROUSEL */}
      {currentSection === 2 && (
        <section className="mh1-section mh1-carousel-section-wrapper">
          <Carousel 
            carouselData={projectData.assets.carousel}
            title="Project Gallery"
            autoPlay={false}
            showControls={true}
            showIndicators={true}
            className="mh1-carousel"
          />
        </section>
      )}
    </ProjectLayout>
  );
};

export default Mh1;