// src/pages/projects/Mh1.jsx
// ============================================
// MH1 PROJECT - YOUR WORKING FILE (EDIT THIS)
// ============================================
// This file contains project-specific configuration.
// Edit the sections, data mapping, and component props here.
// Keep ProjectTemplate.jsx untouched for reuse across projects.
// ============================================

import React, { lazy, Suspense } from 'react';
import ProjectTemplate from '../../components/project/ProjectTemplate.jsx';
import { getProjectById } from '../../constants/projectsData.js';
import Carousel from '../../sections/projects/Carousel.jsx';
import { MapSection } from '../../sections/MapSection.jsx';
import { getProjectLogos } from '../../assets/index.js';
import { ComponentLoading } from '../../components/common/LayoutComponents.jsx';

// Lazy load MyMap component for performance
const MyMap = lazy(() => import('../../components/project/MapComponent.jsx'));

// Project ID - Change this for different projects
const PROJECT_ID = 'mh1';

// ============================================
// MH1 COMPONENT - Main project page
// ============================================
const Mh1 = () => {
  // 1. Fetch project data from constants
  const projectData = getProjectById(PROJECT_ID);

  // ============================================
  // MAP DESCRIPTION CONFIGURATION
  // ============================================
  // Edit this to customize what metrics appear in the map section
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

  // ============================================
  // SECTIONS CONFIGURATION
  // ============================================
  // Add, remove, or reorder sections here
  // Each section corresponds to a step in the project presentation
  const sections = [
    
    // SECTION 0: HERO (Introductory section)
    {
      type: 'hero',
      title: projectData.sections.hero.title,
      subtitle: projectData.sections.hero.subtitle,
      backgroundImage: projectData.assets.hero,
    },

    // SECTION 1: MAP (Interactive map visualization)
    {
      type: 'map',
      component: (
        <MapSection
          // MapComponent is wrapped in Suspense for lazy loading
          MapComponent={
            <Suspense fallback={<ComponentLoading />}>
              <MyMap 
                startAnimation={true}
                mapImages={projectData.assets.map}
              />
            </Suspense>
          }
          
          logos={getProjectLogos(PROJECT_ID)}
          description={mapDescription}
          visible={true}
        />
      ),
    },

    // SECTION 2: CAROUSEL (Image gallery)
    {
      type: 'carousel',
      component: (
        <Carousel 
          carouselData={projectData.assets.carousel}
          title="Project Gallery"
          autoPlay={false}
          showControls={true}
          showIndicators={true}
          projectID={PROJECT_ID}
        />
      ),
    },

    // ============================================
    // ADD MORE SECTIONS HERE (if needed)
    // ============================================
    // Example:
    // {
    //   type: 'custom',
    //   component: <YourCustomComponent />,
    //   className: 'custom-section-class'
    // }
  ];

  // ============================================
  // PROJECT TEMPLATE CONFIGURATION
  // ============================================
  // Pass all configuration to the reusable ProjectTemplate
  const config = {
    projectData,
    totalSections: sections.length,
    sections,
    enableNavbar: true,
    
    // Optional callback for tracking section changes
    onSectionChange: (sectionIndex) => {
      console.log(`📍 MH1: Moved to section ${sectionIndex}`);
    },
  };

  return <ProjectTemplate {...config} />;
};

export default Mh1;