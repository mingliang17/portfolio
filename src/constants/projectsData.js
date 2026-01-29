// src/constants/projectsData.js
import { PROJECT_ASSETS } from '../assets/index.js';

// ===================================
// PROJECT MH1 - Complete Configuration
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
      snapToTop: true, // Enable smooth snap
    },
    model: {
    enabled: true,
      title: '3D Model Visualization',
      componentName: 'Mh1Model',
      scale: 0.06,
      position: [0, 0, 0],
      rotation: [0, Math.PI / 4, 0],
      cameraPosition: [0, 2, 6],
      cameraFov: 50,
      environment: 'city',
      backgroundColor: '#1a1a1a',
      debug: true,
      enableShadows: true,
      snapToTop: false,  // No snap for model section
      fitInViewport: true, // Allow scrolling through model
    },
    map: {
      enabled: true,
      title: 'Project Location',
      animateOnEntry: true,
      snapToTop: true, // Enable smooth snap
      fitInViewport: true, // Section fits in one viewport
    },
 anime: {
      enabled: true,
      title: 'Interactive Reconstruction',
      modelPath: 'assets/projects/mh1/models/gltf/mh1_2.gltf',
      snapToTop: true,  // Natural scroll like Spin
      fitInViewport: true,  // Long section
      checkpoints: [
        {
          title: 'Initial State',
          description: 'Model fully assembled and ready for detailed analysis of all components'
        },
        {
          title: 'Structural Scan',
          description: 'Analyzing component architecture, relationships, and structural integrity'
        },
        {
          title: 'Deconstruction',
          description: 'Breaking down into individual mesh elements with precise separation'
        },
        {
          title: 'Scattered State',
          description: 'All components separated and visible for individual inspection'
        },
        {
          title: 'Reassembly',
          description: 'Reconstructing piece by piece with precision and attention to detail'
        },
        {
          title: 'Complete',
          description: 'Model fully reconstructed and operational, ready for final review'
        }
      ]
    },
    spin: {
      enabled: true,
      title: 'Design Evolution',
      
      // Model configuration
      componentName: 'Mh1Model',
      scale: 0.04,
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      
      // Camera settings
      cameraPosition: [0, 0, 8],
      cameraFov: 50,
      
      // Environment
      environment: 'city',
      backgroundColor: '#0a1929',
      enableShadows: true,
      
      // Scroll & Rotation settings
      rotationsPerScroll: 2,
      scrollMultiplier: 2.5, // 250vh tall
      
      // IMPORTANT: Spin section doesn't snap
      snapToTop: false,
      fitInViewport: false, // Overflows beyond one viewport
      
      // Checkpoints
      checkpoints: [
        {
          title: 'Conceptual Phase',
          description: 'Initial design concepts focused on sustainable agricultural infrastructure with cutting-edge genetic research facilities.'
        },
        {
          title: 'Structural Analysis',
          description: 'Advanced structural engineering ensuring maximum efficiency and environmental integration with local ecosystems.'
        },
        {
          title: 'Material Selection',
          description: 'Eco-friendly materials chosen for durability, sustainability, and minimal environmental impact throughout the lifecycle.'
        },
        {
          title: 'Integration Design',
          description: 'Seamless integration of laboratory spaces with agricultural zones, optimizing workflow and research capabilities.'
        },
        {
          title: 'Final Implementation',
          description: 'Complete realization of the vision with state-of-the-art facilities ready for groundbreaking genetic research.'
        }
      ]
    },
    carousels: [
      {
        id: 'carousel1',
        enabled: true,
        title: 'Concept Phase',
        images: PROJECT_ASSETS.mh1.carousel1,
        items: PROJECT_ASSETS.mh1.carousel1.length,
        snapToTop: true, // Enable smooth snap
        fitInViewport: true,
      },
      {
        id: 'carousel2',
        enabled: true,
        title: 'Detail Phase',
        images: PROJECT_ASSETS.mh1.carousel2,
        items: PROJECT_ASSETS.mh1.carousel2.length,
        snapToTop: true, // Enable smooth snap
        fitInViewport: true,
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
// PROJECT MH2
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
      snapToTop: true,
    },
    map: {
      enabled: true,
      title: 'Spatial Analysis',
      animateOnEntry: true,
      snapToTop: true,
      fitInViewport: true,
    },
    model: {
      enabled: true,
      title: '3D Model Visualization',
      modelPath: 'assets/projects/mh2/models/building.glb',
      modelType: 'gltf',
      scale: 0.5,
      position: [0, -1, 0],
      rotation: [0, Math.PI / 3, 0],
      cameraPosition: [0, 2, 8],
      cameraFov: 45,
      environment: 'studio',
      backgroundColor: '#0a0a0a',
      debug: false,
      enableShadows: true,
      snapToTop: true,
      fitInViewport: true,
    },
    spin: {
      enabled: false,
    },
    carousels: [
      {
        id: 'carousel1',
        enabled: true,
        title: 'Concept Phase',
        images: PROJECT_ASSETS.mh2.carousel1,
        items: PROJECT_ASSETS.mh2.carousel1.length,
        snapToTop: true,
        fitInViewport: true,
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
export const getSpinConfig = (projectId) => {
  const project = getProjectById(projectId);
  return project?.sections?.spin || null;
};

export default {
  projects: ALL_PROJECTS,
  getProjectById,
  getProjectIds,
  getModelConfig,
  getSpinConfig,
};