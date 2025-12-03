// src/sections/projects/ProjectMH1.jsx - REFACTORED VERSION
import React, { lazy } from 'react';
import Carousel from '../Carousel.jsx';
import { logoMH1 } from '/src/constants/projects.js';
import { 
  useProjectAnimation, 
  useSectionNavigation, 
  useNavbarControl 
} from '../../hooks/useProjectAnimation.js';
import {
  NavigationDots,
  UnlockOverlay,
  DragProgressIndicator,
  HeroBackground,
  HeroContent,
  ScrollPrompt,
  MapSection
} from '../../components/ProjectComponents.jsx';

// Lazy load heavy components
const MyMap = lazy(() => import('../MyMap.jsx'));

const TOTAL_SECTIONS = 5;
const HERO_IMAGE = 'assets/projects/projectMH1/imageMH1_1.jpg';

const ProjectMH1 = () => {
  // Custom hooks for all logic
  const {
    animationPhase,
    titleOpacity,
    unlockProgress,
    gradientOpacity,
    backgroundFade,
    dragProgressRef,
    setAnimationPhase,
    setTitleOpacity,
    setGradientOpacity,
    setBackgroundFade,
    setUnlockProgress,
    scrollAccumulator
  } = useProjectAnimation(0);

  const handleGoBack = (currentSection, setCurrentSection) => {
    if (currentSection === 1) {
      setBackgroundFade(0);
      setCurrentSection(0);
      
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
            setUnlockProgress(0);
            scrollAccumulator.current = 0;
            dragProgressRef.current = 0;
          }
        }, 20);
      }, 500);
    } else {
      setCurrentSection(prev => prev - 1);
    }
  };

  const { currentSection, setCurrentSection } = useSectionNavigation(
    TOTAL_SECTIONS,
    animationPhase,
    handleGoBack
  );

  const { hideNavbar, showNavbar } = useNavbarControl(currentSection, animationPhase);

  return (
    <div className="mh1-base-container">
      {/* UI Overlays */}
      <NavigationDots 
        totalSections={TOTAL_SECTIONS}
        currentSection={currentSection}
        onSectionChange={setCurrentSection}
        disabled={animationPhase !== 'completed'}
      />
      
      <UnlockOverlay 
        unlockProgress={unlockProgress}
        visible={animationPhase === 'unlocking' && currentSection === 0}
      />
      
      <DragProgressIndicator 
        progress={dragProgressRef.current}
        visible={currentSection === 0 && animationPhase === 'waiting'}
      />

      {/* Background (Section 0 only) */}
      {currentSection === 0 && (
        <HeroBackground 
          backgroundFade={backgroundFade}
          gradientOpacity={gradientOpacity}
          imagePath={HERO_IMAGE}
        />
      )}

      {/* Sections Container */}
      <div className="mh1-section-container">
        {/* Section 0: Hero */}
        {currentSection === 0 && (
          <section className="mh1-section mh1-hero-section">
            <HeroContent 
              titleOpacity={titleOpacity}
              title="Project MH1"
              subtitle="Redefining Agriculture Through Genetic Innovation"
            />
            
            <ScrollPrompt 
              dragProgress={dragProgressRef.current}
              visible={animationPhase === 'waiting'}
            />
          </section>
        )}

        {/* Section 1: Map */}
        {currentSection === 1 && (
          <MapSection 
            logos={logoMH1}
            MapComponent={MyMap}
            visible={true}
          />
        )}

        {/* Section 2: Carousel */}
        {currentSection === 2 && (
          <section className="mh1-section mh1-carousel-section-wrapper">
            <Carousel />
          </section>
        )}

        {/* Section 3: Stats (placeholder) */}
        {currentSection === 3 && (
          <section className="mh1-section">
            <div className="mh1-content-center">
              <h2>Section 3: Statistics</h2>
            </div>
          </section>
        )}

        {/* Section 4: Contact (placeholder) */}
        {currentSection === 4 && (
          <section className="mh1-section">
            <div className="mh1-content-center">
              <h2>Section 4: Contact</h2>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default ProjectMH1;