// src/pages/projects/Mh1.jsx
// ============================================
// MH1 PROJECT - FIXED MAP SECTION
// ============================================

import React, { lazy, Suspense } from 'react';
import ProjectTemplate from '../../components/project/ProjectTemplate.jsx';
import { getProjectById } from '../../constants/projectsData.js';
import Carousel from '../../sections/Carousel.jsx';
import { MapSection } from '../../sections/MapSection.jsx';
import { ComponentLoading } from '../../components/common/LayoutComponents.jsx';

// Lazy load MyMap component
const MyMap = lazy(() => import('../../sections/MyMap.jsx'));

const PROJECT_ID = 'mh1';

const Mh1 = () => {
  const projectData = getProjectById(PROJECT_ID);

  if (!projectData) {
    console.error(`❌ Project not found: ${PROJECT_ID}`);
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        color: 'white',
        fontSize: '1.5rem',
      }}>
        ❌ Project "{PROJECT_ID}" not found
      </div>
    );
  }

  // ========================================
  // MAP DESCRIPTION CONFIGURATION
  // ========================================
  const mapDescription = {
    title: 'Data Metrics',
    metrics: [
      { 
        label: 'Collaborators',
        value: projectData.metadata.collaborators 
      },
      { 
        label: 'Type',
        value: projectData.metadata.type 
      },
      { 
        label: 'Description',
        value: projectData.metadata.description 
      },
    ],
    disclaimer: projectData.metadata.disclaimer,
  };

  // ========================================
  // LOGOS CONFIGURATION
  // ========================================
  const logos = [
    {
      src: '/path/to/logo1.png', // Replace with actual logo paths
      alt: 'Logo 1',
      title: 'Partner 1',
      className: 'map-logo-item'
    },
    {
      src: '/path/to/logo2.png',
      alt: 'Logo 2',
      title: 'Partner 2',
      className: 'map-logo-item'
    },
    // Add more logos as needed
  ];

  // ========================================
  // SECTIONS CONFIGURATION
  // ========================================
  const sections = [
    
    // SECTION 0: HERO
    {
      type: 'hero',
      title: projectData.sections.hero.title,
      subtitle: projectData.sections.hero.subtitle,
      backgroundImage: projectData.assets.hero,
    },

    // SECTION 1: MAP - FIXED
    {
      type: 'map',
      component: (
        <MapSection
          // Pass MyMap as a rendered component with Suspense
          MapComponent={
            <Suspense fallback={<ComponentLoading />}>
              <MyMap 
                startAnimation={true}
                mapImages={projectData.assets.map}
              />
            </Suspense>
          }
          
          // Pass logos array
          logos={logos}
          
          // Pass description object
          description={mapDescription}
          
          // Control visibility
          visible={true}
        />
      ),
    },

    // SECTION 2: CAROUSEL
    {
      type: 'carousel',
      component: (
        <Carousel 
          carouselData={projectData.assets.carousel}
          title="Project Gallery"
          autoPlay={false}
          showControls={true}
          showIndicators={true}
          className="mh1-carousel"
          projectID={PROJECT_ID}
        />
      ),
    },
  ];

  // ========================================
  // CONFIGURATION OBJECT
  // ========================================
  const config = {
    projectData,
    totalSections: sections.length,
    sections,
    mapDescription,
    enableNavbar: true,
    
    onSectionChange: (sectionIndex) => {
      console.log(`📍 MH1: Moved to section ${sectionIndex}`);
    },
  };

  return <ProjectTemplate {...config} />;
};

export default Mh1;