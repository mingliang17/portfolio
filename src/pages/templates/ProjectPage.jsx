import React from 'react';
import { useParams } from 'react-router-dom';
import ProjectTemplate from './ProjectTemplate.jsx';
import { getProjectById, getModelConfig, getSpinConfig } from '../../constants/projectsData.js';
import { PROJECT_ASSETS, getProjectLogos } from '../../assets/index.js';
import { MapSection } from '../../sections/projects/MapSection.jsx';
import ModelSection from '../../sections/projects/ModelSection.jsx';
import SpinSection from '../../sections/projects/SpinSection.jsx';
import Carousel from '../../sections/projects/Carousel.jsx';
import AnimeSection from '../../sections/projects/AnimeSection.jsx';

const ProjectPage = () => {
  const { project_id } = useParams();
  
  const projectData = getProjectById(project_id);
  const modelConfig = getModelConfig(project_id);
  const spinConfig = getSpinConfig(project_id);

  if (!projectData) {
    return (
      <div className="flex items-center justify-center h-screen text-white text-2xl">
        Project "{project_id}" not found
      </div>
    );
  }

  const projectAssets = PROJECT_ASSETS[project_id];
  
  if (!projectAssets) {
    console.error('❌ No assets found for project:', project_id);
    return (
      <div className="flex items-center justify-center h-screen text-white text-xl">
        Project assets not configured for "{project_id}"
      </div>
    );
  }

  const mapDescription = {
    title: 'Data Metrics',
    metrics: [
      { label: 'Collaborators', value: projectData.metadata?.collaborators || 'N/A' },
      { label: 'Type', value: projectData.metadata?.type || 'N/A' },
      { label: 'Description', value: projectData.metadata?.description || 'N/A' },
      { label: 'Duration', value: projectData.metadata?.duration || 'N/A' },
      { label: 'Status', value: projectData.metadata?.status || 'N/A' },
    ],
    disclaimer: projectData.metadata?.disclaimer || '',
  };

  // Build sections array with snap configuration
  const sections = [
    // HERO SECTION
    projectData.sections.hero?.enabled && {
      type: 'hero',
      title: projectData.sections.hero.title,
      subtitle: projectData.sections.hero.subtitle,
      backgroundImage: projectAssets.hero,
      snapToTop: projectData.sections.hero.snapToTop !== false,
      fitInViewport: true,
    },

    // MODEL SECTION
    projectData.sections.model?.enabled && {
      type: 'model',
      snapToTop: modelConfig?.snapToTop !== false,
      fitInViewport: modelConfig?.fitInViewport !== false,
      component: (
        <ModelSection
          componentName={modelConfig?.componentName}
          modelUrl={modelConfig?.modelPath}
          modelType={modelConfig?.modelType || 'gltf'}
          modelScale={modelConfig?.scale || 1}
          modelPosition={modelConfig?.position || [0, 0, 0]}
          modelRotation={modelConfig?.rotation || [0, 0, 0]}
          cameraPosition={modelConfig?.cameraPosition || [0, 2, 6]}
          cameraFov={modelConfig?.cameraFov || 50}
          environment={modelConfig?.environment || 'city'}
          backgroundColor={modelConfig?.backgroundColor || '#000000'}
          showControls={true}
          enableShadows={modelConfig?.enableShadows ?? true}
        />
      ),
    },

    // MAP SECTION
    projectData.sections.map?.enabled && {
      type: 'map',
      snapToTop: projectData.sections.map.snapToTop !== false,
      fitInViewport: projectData.sections.map.fitInViewport !== false,
      component: (
        <MapSection
          mapImages={projectAssets.map || {}}
          logos={getProjectLogos(project_id)}
          description={mapDescription}
          visible={true}
          startAnimation={true}
        />
      ),
    },

    // ANIME SECTION - NEW (Based on Spin structure)
    projectData.sections.anime?.enabled && {
      type: 'anime',
      snapToTop: false,      // Don't snap - natural scroll like Spin
      fitInViewport: false,  // Overflows - long section
      component: (
        <AnimeSection
          modelPath={projectData.sections.anime.modelPath || 'assets/projects/mh1/models/gltf/mh1_2.gltf'}
          checkpoints={projectData.sections.anime.checkpoints || [
            {
              title: 'Initial State',
              description: 'Model fully assembled and ready for analysis'
            },
            {
              title: 'Structural Scan',
              description: 'Analyzing component architecture and relationships'
            },
            {
              title: 'Deconstruction',
              description: 'Breaking down into individual mesh elements'
            },
            {
              title: 'Scattered State',
              description: 'All components separated and visible'
            },
            {
              title: 'Reassembly',
              description: 'Reconstructing piece by piece with precision'
            },
            {
              title: 'Complete',
              description: 'Model fully reconstructed and operational'
            }
          ]}
        />
      ),
    },
    // SPIN SECTION
    spinConfig?.enabled && {
      type: 'spin',
      snapToTop: spinConfig.snapToTop !== false,
      fitInViewport: spinConfig.fitInViewport !== false,
      component: (
        <SpinSection
          componentName={spinConfig.componentName}
          modelUrl={spinConfig.modelPath}
          modelType={spinConfig.modelType || 'gltf'}
          scale={spinConfig.scale || 1}
          position={spinConfig.position || [0, 0, 0]}
          rotation={spinConfig.rotation || [0, 0, 0]}
          cameraPosition={spinConfig.cameraPosition || [0, 0, 8]}
          cameraFov={spinConfig.cameraFov || 50}
          environment={spinConfig.environment || 'city'}
          backgroundColor={spinConfig.backgroundColor || '#000000'}
          enableShadows={spinConfig.enableShadows ?? true}
          checkpoints={spinConfig.checkpoints || []}
          rotationsPerScroll={spinConfig.rotationsPerScroll || 2}
          scrollMultiplier={spinConfig.scrollMultiplier || 2}
        />
      ),
    },

    // CAROUSEL SECTIONS
    ...(projectData.sections.carousels || []).map((carouselSection, index) => {
      if (!carouselSection.enabled) return null;
      return {
        type: 'carousel',
        snapToTop: carouselSection.snapToTop !== false,
        fitInViewport: carouselSection.fitInViewport !== false,
        component: (
          <Carousel
            key={carouselSection.id || index}
            carouselData={carouselSection.images || []}
            title={carouselSection.title || `Gallery ${index + 1}`}
            autoPlay={false}
            showControls={true}
            showIndicators={true}
          />
        ),
      };
    }),



    
  ].filter(Boolean);


  

  return (
    <ProjectTemplate
      projectData={projectData}
      sections={sections}
    />
  );
};

export default ProjectPage;