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

  // ⭐ Get animation state from hook
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

  // ⭐ Go back handler
  const handleGoBack = useCallback((section, setSectionCallback) => {
    console.log('⬅️ Going back from section', section);
    
    if (section === 1) {
      // Reset map animation
      setStartMapAnimation(false);
      
      // Reset animation states
      handleReturnToHero();
      
      // Set section to 0 (hero)
      setCurrentSection(0);
    } else {
      setSectionCallback(prev => prev - 1);
    }
  }, [handleReturnToHero, setCurrentSection]);

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

  // ⭐ Navbar control - TEMPORARILY COMMENTED FOR DEBUGGING
  // useNavbarControl(currentSection, animationPhase, dragProgress);

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
    titleOpacity: titleOpacity?.toFixed(2),
    backgroundFade: backgroundFade?.toFixed(2),
    gradientOpacity: gradientOpacity?.toFixed(2)
  });

  return (
    <>
      {/* Debug overlay - ALWAYS VISIBLE */}
      <div style={{
        position: 'fixed',
        top: '10px',
        left: '10px',
        zIndex: 99999,
        background: 'rgba(0, 0, 0, 0.85)',
        color: 'white',
        padding: '15px',
        borderRadius: '8px',
        fontFamily: 'monospace',
        fontSize: '14px',
        pointerEvents: 'none',
        maxWidth: '300px',
        border: '2px solid #00ff00'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#00ff00' }}>
          🔧 DEBUG OVERLAY
        </div>
        <div>Section: <strong>{currentSection}</strong></div>
        <div>Phase: <strong>{animationPhase}</strong></div>
        <div>Title Opacity: <strong>{titleOpacity?.toFixed(3)}</strong></div>
        <div>Background Fade: <strong>{backgroundFade?.toFixed(3)}</strong></div>
        <div>Gradient Opacity: <strong>{gradientOpacity?.toFixed(3)}</strong></div>
        <div>Drag Progress: <strong>{dragProgress?.toFixed(3)}</strong></div>
        <div style={{ marginTop: '8px', fontSize: '12px', color: '#aaa' }}>
          Check console for detailed logs
        </div>
      </div>

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
          <section className="project-section" style={{ position: 'relative', zIndex: 1 }}>
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
            
            {/* Visual indicator of background fade */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: 'white',
              fontSize: '24px',
              fontWeight: 'bold',
              opacity: 0.7,
              pointerEvents: 'none'
            }}>
              Background: {backgroundFade?.toFixed(2)}
            </div>
          </section>
        )}

        {/* SECTION 1: MAP */}
        {currentSection === 1 && (
          <MapSection
            logos={projectData.assets.logos || []}
            MapComponent={
              <Suspense fallback={<div className="project-map-loading">Loading Map...</div>}>
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
          <section className="project-section carousel-wrapper-wrapper">
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
    </>
  );
};

export default Mh1;