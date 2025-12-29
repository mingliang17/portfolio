// src/pages/templates/ProjectPage.jsx
import React, { useState, useEffect, Suspense } from 'react';
import { useParams } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { Environment, PerspectiveCamera, OrbitControls } from '@react-three/drei';
import ProjectTemplate from './ProjectTemplate.jsx';
import { getProjectById, getModelConfig } from '../../constants/projectsData.js';
import { PROJECT_ASSETS, getProjectLogos } from '../../assets/index.js';
import { MapSection } from '../../sections/projects/MapSection.jsx';
import ModelLoader from '../../components/3d/projects/ModelLoader.jsx';
import Carousel from '../../sections/projects/Carousel.jsx';

const ProjectPage = () => {
  const { project_id } = useParams();
  const [startMapAnimation, setStartMapAnimation] = useState(false);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  
  const projectData = getProjectById(project_id);
  const modelConfig = getModelConfig(project_id);

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

  // Build 3D Model Canvas Component
  const ModelCanvas = () => {
    if (!modelConfig?.enabled) {
      return (
        <div className="w-full h-[600px] bg-gray-900 flex items-center justify-center rounded-lg">
          <p className="text-white text-lg">3D model not available for this project</p>
        </div>
      );
    }

    const handleModelLoad = (model) => {
      console.log(`✅ Model loaded successfully for ${project_id}:`, model);
      setIsModelLoaded(true);
    };

    const handleModelError = (error) => {
      console.error(`❌ Failed to load model for ${project_id}:`, error);
      setIsModelLoaded(false);
    };

    return (
      <div className="w-full h-[600px] bg-gray-900 rounded-lg overflow-hidden relative">
        <Canvas shadows>
          {/* Camera */}
          <PerspectiveCamera
            makeDefault
            position={modelConfig.cameraPosition}
            fov={modelConfig.cameraFov}
          />
          
          {/* Lighting & Environment */}
          <Environment preset={modelConfig.environment} />
          <ambientLight intensity={0.6} />
          <directionalLight 
            position={[10, 10, 5]} 
            intensity={1} 
            castShadow
            shadow-mapSize={[1024, 1024]}
          />
          
          {/* Model Loader - handles all three types */}
          <Suspense fallback={null}>
            <ModelLoader
              projectId={project_id}
              componentName={modelConfig.componentName}
              url={modelConfig.url}
              type={modelConfig.type}
              scale={modelConfig.scale}
              position={modelConfig.position}
              rotation={modelConfig.rotation}
              debug={modelConfig.debug || false}
              enableShadows={modelConfig.enableShadows ?? true}
              enableMaterials={modelConfig.enableMaterials ?? true}
              animations={modelConfig.animations || {}}
              materialOverrides={modelConfig.materialOverrides || {}}
              onLoad={handleModelLoad}
              onError={handleModelError}
            />
          </Suspense>
          
          {/* Controls */}
          <OrbitControls 
            enableDamping 
            dampingFactor={0.05}
            minDistance={2}
            maxDistance={20}
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
          />
        </Canvas>
        
        {/* Loading indicator */}
        {!isModelLoaded && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
              <p>Loading 3D model...</p>
            </div>
          </div>
        )}
        
        {/* Debug info */}
        {modelConfig.debug && (
          <div className="absolute top-4 left-4 bg-black/70 text-white p-3 rounded text-sm">
            <div><strong>Project:</strong> {project_id}</div>
            <div><strong>Type:</strong> {modelConfig.componentName ? 'JSX Component' : `${modelConfig.type.toUpperCase()}`}</div>
            <div><strong>Scale:</strong> {modelConfig.scale}</div>
            <div><strong>Status:</strong> {isModelLoaded ? '✓ Loaded' : '⏳ Loading'}</div>
          </div>
        )}
      </div>
    );
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

    // MODEL SECTION
    projectData.sections.model?.enabled && {
      type: 'model',
      title: projectData.sections.model.title,
      component: <ModelCanvas />,
    },

    // MAP SECTION
    projectData.sections.map?.enabled && {
      type: 'map',
      title: projectData.sections.map.title,
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
        title: carouselSection.title,
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

  console.log('ProjectPage: Rendering', {
    project_id,
    totalSections: sections.length,
    sectionTypes: sections.map(s => s.type),
    modelEnabled: projectData.sections.model?.enabled,
    modelType: modelConfig?.componentName ? 'JSX' : modelConfig?.type || 'none',
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