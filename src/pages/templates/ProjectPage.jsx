// src/pages/templates/ProjectPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ProjectTemplate from './ProjectTemplate.jsx';
import { getProjectById, getModelConfig } from '../../constants/projectsData.js';
import { PROJECT_ASSETS, getProjectLogos } from '../../assets/index.js';
import { MapSection } from '../../sections/projects/MapSection.jsx';
import ModelSection from '../../sections/projects/ModelSection.jsx';
import Carousel from '../../sections/projects/Carousel.jsx';

const ProjectPage = () => {
  const { project_id } = useParams();
  const [startMapAnimation, setStartMapAnimation] = useState(false);
  
  const projectData = getProjectById(project_id);
  const modelConfig = getModelConfig(project_id);

  // Start map animation after component mounts
  useEffect(() => {
    console.log('🎬 ProjectPage mounted for:', project_id);
    const timer = setTimeout(() => {
      setStartMapAnimation(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [project_id]);

  if (!projectData) {
    return (
      <div className="flex items-center justify-center h-screen text-white text-2xl">
        Project "{project_id}" not found
      </div>
    );
  }

  // Get project assets
  const projectAssets = PROJECT_ASSETS[project_id];
  
  if (!projectAssets) {
    console.error('❌ No assets found for project:', project_id);
    return (
      <div className="flex items-center justify-center h-screen text-white text-xl">
        Project assets not configured for "{project_id}"
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
      { 
        label: 'Duration', 
        value: projectData.metadata?.duration || 'N/A' 
      },
      { 
        label: 'Status', 
        value: projectData.metadata?.status || 'N/A' 
      },
    ],
    disclaimer: projectData.metadata?.disclaimer || '',
    additionalInfo: projectData.metadata?.budget || projectData.metadata?.technologies ? {
      budget: projectData.metadata?.budget,
      technologies: projectData.metadata?.technologies,
      locations: projectData.metadata?.locations,
    } : null,
  };

  // Build sections array
  const sections = [
    // HERO SECTION
    projectData.sections.hero?.enabled && {
      type: 'hero',
      title: projectData.sections.hero.title,
      subtitle: projectData.sections.hero.subtitle,
      backgroundImage: projectAssets.hero,
      animationType: projectData.sections.hero.animationType,
    },

    // MODEL SECTION - using ModelSection component
    projectData.sections.model?.enabled && {
      type: 'model',
      title: projectData.sections.model.title || '3D Model Visualization',
      component: (
        <ModelSection
          // ✅ CORRECTED: Match ModelSection prop names exactly
          componentName={modelConfig?.componentName}
          modelUrl={modelConfig?.modelPath}  // Not modelUrl
          modelType={modelConfig?.modelType || 'glb'}
          
          // ✅ CORRECTED: Use correct property names from projectsData.js
          modelScale={modelConfig?.scale || 1}           // Was modelConfig.modelScale
          modelPosition={modelConfig?.position || [0, 0, 0]}  // Was modelConfig.modelPosition
          modelRotation={modelConfig?.rotation || [0, 0, 0]}  // Was modelConfig.modelRotation
          
          // Camera settings
          cameraPosition={modelConfig?.cameraPosition || [0, 2, 6]}
          cameraFov={modelConfig?.cameraFov || 50}
          
          // Environment settings
          environment={modelConfig?.environment || 'city'}
          backgroundColor={modelConfig?.backgroundColor || '#000000'}
          
          // Debug & Controls
          showControls={true}
          debug={modelConfig?.debug || false}
          
          // ✅ ADDED: enableShadows prop
          enableShadows={modelConfig?.enableShadows ?? true}
          
          // Note: These are not used by ModelSection but passed for reference
          title={modelConfig?.title || '3D Model'}
          materialOverrides={modelConfig?.materialOverrides || {}}
          animations={modelConfig?.animations || {}}
          enableMaterials={modelConfig?.enableMaterials ?? true}
        />
      ),
    },

    // MAP SECTION
    projectData.sections.map?.enabled && {
      type: 'map',
      title: projectData.sections.map.title || 'Project Map',
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

      const images = carouselSection.images || [];

      return {
        type: 'carousel',
        title: carouselSection.title || `Gallery ${index + 1}`,
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

  // Debug logging
  console.log('📊 ProjectPage Data Flow:', {
    project_id,
    modelConfig: modelConfig ? {
      // From projectsData.js
      hasComponentName: !!modelConfig.componentName,
      hasModelPath: !!modelConfig.modelPath,
      scale: modelConfig.scale,
      position: modelConfig.position,
      rotation: modelConfig.rotation,
      cameraPosition: modelConfig.cameraPosition,
      cameraFov: modelConfig.cameraFov,
      environment: modelConfig.environment,
      backgroundColor: modelConfig.backgroundColor,
    } : 'No model config',
  });

  return (
    <ProjectTemplate
      projectData={projectData}
      sections={sections}
      totalSections={sections.length}
      enableNavbar={true}
      onSectionChange={(sectionIndex) =>
        console.log(`📍 ${project_id}: Navigated to section ${sectionIndex}`)
      }
    />
  );
};

export default ProjectPage;