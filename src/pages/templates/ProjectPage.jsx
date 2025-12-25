// src/pages/templates/ProjectPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ProjectTemplate from './ProjectTemplate.jsx';
import { getProjectById } from '../../constants/projectsData.js';
import { PROJECT_ASSETS, getProjectLogos } from '../../assets/index.js';
import { MapSection } from '../../sections/MapSection.jsx';
import ModelSection from '../../sections/projects/ModelSection.jsx';
import Carousel from '../../sections/projects/Carousel.jsx';

const ProjectPage = () => {
  const { project_id } = useParams();
  const [startMapAnimation, setStartMapAnimation] = useState(false);
  
  const projectData = getProjectById(project_id);

  // Start map animation after component mounts
  useEffect(() => {
    console.log('ProjectPage: Mounted, triggering map animation');
    const timer = setTimeout(() => {
      setStartMapAnimation(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  if (!projectData) {
    return (
      <div style={{ 
        color: 'white', 
        padding: '2rem',
        textAlign: 'center',
        fontSize: '1.5rem'
      }}>
        Project not found
      </div>
    );
  }

  // Get project assets
  const projectAssets = PROJECT_ASSETS[project_id];
  
  if (!projectAssets) {
    console.error('No assets found for project:', project_id);
    return (
      <div style={{ 
        color: 'white', 
        padding: '2rem',
        textAlign: 'center'
      }}>
        Project assets not configured
      </div>
    );
  }

  // Prepare map description
  const mapDescription = {
    title: 'Data Metrics',
    metrics: [
      { 
        label: 'Collaborators', 
        value: projectData.metadata?.collaborators || 'N/A' 
      },
      { 
        label: 'Type', 
        value: projectData.metadata?.type || 'N/A' 
      },
      { 
        label: 'Description', 
        value: projectData.metadata?.description || 'N/A' 
      },
    ],
    disclaimer: projectData.metadata?.disclaimer || '',
  };

  // Build sections array
  const sections = [
    // HERO SECTION
    projectData.sections.hero?.enabled && {
      type: 'hero',
      title: projectData.sections.hero.title,
      subtitle: projectData.sections.hero.subtitle,
      backgroundImage: projectAssets.hero,
    },

        // MODEL SECTION
    projectData.sections.model?.enabled && {
      type: 'model',
      component: (
        <ModelSection
          modelUrl={projectData.sections.model.modelUrl}
          modelScale={projectData.sections.model.modelScale}
          modelPosition={projectData.sections.model.modelPosition}
          modelRotation={projectData.sections.model.modelRotation}
          cameraPosition={projectData.sections.model.cameraPosition}
          cameraFov={projectData.sections.model.cameraFov}
          title={projectData.sections.model.title}
          environment={projectData.sections.model.environment}
          backgroundColor={projectData.sections.model.backgroundColor}
          showControls={true}
        />
      ),
    },

    // MAP SECTION
    projectData.sections.map?.enabled && {
      type: 'map',
      component: (
        <MapSection
          mapImages={projectAssets.map || {}}
          logos={getProjectLogos(project_id)}
          description={mapDescription}
          visible={true}
          startAnimation={startMapAnimation}
        />
      ),
    },

    // CAROUSEL SECTIONS
    ...(projectData.sections.carousels || []).map((carouselSection, index) => {
      if (!carouselSection.enabled) return null;

      // Get the images array from the carousel section configuration
      const images = carouselSection.images || [];

      return {
        type: 'carousel',
        component: (
          <Carousel
            key={carouselSection.id || index}
            carouselData={images}
            title={carouselSection.title || `Gallery ${index + 1}`}
            autoPlay={false}
            showControls={true}
            showIndicators={true}
          />
        ),
      };
    }),
  ].filter(Boolean); // Remove null entries

  console.log('ProjectPage: Rendering with sections', {
    project_id,
    totalSections: sections.length,
    sectionTypes: sections.map(s => s.type),
    startMapAnimation,
    modelEnabled: projectData.sections.model?.enabled
  });

  return (
    <ProjectTemplate
      projectData={projectData}
      sections={sections}
      totalSections={sections.length}
      enableNavbar={true}
      onSectionChange={(sectionIndex) =>
        console.log(`📍 ${project_id}: Moved to section ${sectionIndex}`)
      }
    />
  );
};

export default ProjectPage;