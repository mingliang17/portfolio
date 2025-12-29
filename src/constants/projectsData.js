// src/constants/projectsData.js
import { PROJECT_ASSETS } from '../assets/index.js';

// ===================================
// PROJECT MH1 - Uses Custom JSX Component
// ===================================
export const PROJECT_MH1 = {
  id: 'mh1',
  assets: {
    hero: PROJECT_ASSETS.mh1.hero,
    map: PROJECT_ASSETS.mh1.map,
    logos: PROJECT_ASSETS.mh1.logos,
    carousel1: PROJECT_ASSETS.mh1.carousel1,
    carousel2: PROJECT_ASSETS.mh1.carousel2,
  },
  sections: {
    hero: {
      enabled: true,
      title: 'Project MH1',
      subtitle: 'Redefining Agriculture Through Genetic Innovation',
      animationType: 'unlock',
    },
    map: {
      enabled: true,
      title: 'Project Location',
      animateOnEntry: true,
    },
    model: {
      enabled: true,
      title: '3D Model Visualization',
      
      // OPTION 1: Custom JSX Component (your Mh1.jsx)
      componentName: 'Mh1Model',
      
      // Display settings
      scale: 0.01,
      position: [0, -0.5, 0],
      rotation: [0, Math.PI / 4, Math.PI / 2],
      
      // Camera & Environment
      cameraPosition: [0, 1, 4],
      cameraFov: 50,
      environment: 'city',
      backgroundColor: '#1a1a1a',
      
      // Debug
      debug: true,
      enableShadows: true,
    },
    carousels: [
      {
        id: 'carousel1',
        enabled: true,
        title: 'Concept Phase',
        images: PROJECT_ASSETS.mh1.carousel1,
        items: PROJECT_ASSETS.mh1.carousel1.length,
      },
      {
        id: 'carousel2',
        enabled: true,
        title: 'Detail Phase',
        images: PROJECT_ASSETS.mh1.carousel2,
        items: PROJECT_ASSETS.mh1.carousel2.length,
      },
    ],
  },
  metadata: {
    collaborators: 'Meinhardt EPCM',
    type: 'Design and Preliminary Design',
    description: 'A comprehensive genetic research project focused on developing sustainable agricultural solutions.',
    disclaimer: '*Client Name and certain details have been omitted for confidentiality',
    duration: '2023-2024',
    status: 'Completed',
    tags: ['Biotechnology', 'Agriculture', 'Genetics', 'Sustainability'],
  },
};

// ===================================
// PROJECT MH2 - Uses Generic GLTF File
// ===================================
export const PROJECT_MH2 = {
  id: 'mh2',
  assets: {
    hero: PROJECT_ASSETS.mh2.hero,
    map: PROJECT_ASSETS.mh2.map,
    logos: PROJECT_ASSETS.mh2.logos,
    carousel1: PROJECT_ASSETS.mh2.carousel1,
    carousel2: PROJECT_ASSETS.mh2.carousel2,
  },
  sections: {
    hero: {
      enabled: true,
      title: 'Project MH2',
      subtitle: 'Adaptive Spatial Infrastructure',
      animationType: 'fade',
    },
    map: {
      enabled: true,
      title: 'Spatial Analysis',
      animateOnEntry: true,
    },
    model: {
      enabled: true,
      title: '3D Model Visualization',
      
      // OPTION 2: Generic GLTF/GLB file path
      // Path relative to /public
      modelPath: 'assets/projects/mh2/models/building.glb',
      modelType: 'gltf', // 'gltf', 'glb', or 'fbx'
      
      // Display settings
      scale: 0.5,
      position: [0, -1, 0],
      rotation: [0, Math.PI / 3, 0],
      
      // Camera & Environment
      cameraPosition: [0, 2, 8],
      cameraFov: 45,
      environment: 'studio',
      backgroundColor: '#0a0a0a',
      
      debug: false,
      enableShadows: true,
    },
    carousels: [
      {
        id: 'carousel1',
        enabled: true,
        title: 'Concept Phase',
        images: PROJECT_ASSETS.mh2.carousel1,
        items: PROJECT_ASSETS.mh2.carousel1.length,
      },
    ],
  },
  metadata: {
    collaborators: 'Internal R&D',
    type: 'Research & Prototype',
    description: 'Flexible project layout with multiple carousels.',
    duration: '2024–Present',
    status: 'In Progress',
    tags: ['Infrastructure', 'Mapping', 'UI Systems'],
  },
};

// ===================================
// ALL PROJECTS REGISTRY
// ===================================
export const ALL_PROJECTS = {
  [PROJECT_MH1.id]: PROJECT_MH1,
  [PROJECT_MH2.id]: PROJECT_MH2,
};

// ===================================
// UTILITY FUNCTIONS
// ===================================
export const getProjectById = (projectId) => ALL_PROJECTS[projectId] || null;
export const getProjectIds = () => Object.keys(ALL_PROJECTS);
export const getModelConfig = (projectId) => {
  const project = getProjectById(projectId);
  return project?.sections?.model || null;
};

export default {
  projects: ALL_PROJECTS,
  getProjectById,
  getProjectIds,
  getModelConfig,
};