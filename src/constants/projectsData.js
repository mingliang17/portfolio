// src/constants/projectsData.js
// FIXED: Proper path construction without assetPath (which adds BASE_URL)

import { PROJECT_ASSETS } from '../assets/index.js';

// ===================================
// PROJECT MH1 CONFIGURATION
export const PROJECT_MH1 = {
  id: 'mh1',
  assets: {
    hero: PROJECT_ASSETS.mh1.hero,
    map: PROJECT_ASSETS.mh1.map,
    logos: PROJECT_ASSETS.mh1.logos,
    carousels: PROJECT_ASSETS.mh1.carousels,
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
      // CRITICAL: Path must be relative to public folder, BASE_URL is added automatically
      // If your file is at: public/assets/projects/mh1/models/computer.glb
      // Then use: 'assets/projects/mh1/models/computer.glb'
      modelUrl: '/assets/projects/mh1/models/computer.glb',
      modelType: 'glb', // 'fbx', 'gltf', or 'glb'
      modelScale: 0.5, // Adjust based on your model size
      modelPosition: [0, -0.5, 0],
      modelRotation: [0, 0, 0],
      cameraPosition: [0, 1, 3],
      cameraFov: 50,
      environment: 'city',
      backgroundColor: '#000000',
    },
    carousels: [
      {
        id: 'gallery',
        enabled: true,
        title: 'Renders',
        images: PROJECT_ASSETS.mh1.carousels,
        items: PROJECT_ASSETS.mh1.carousels.length,
      },
    ],
  },
  metadata: {
    collaborators: 'Meinhardt EPCM',
    type: 'Design and Preliminary Design',
    description:
      'A comprehensive genetic research project focused on developing sustainable agricultural solutions through innovative crop genetics.',
    disclaimer: '*Client Name and certain details have been omitted for confidentiality',
    duration: '2023-2024',
    status: 'Completed',
    tags: ['Biotechnology', 'Agriculture', 'Genetics', 'Sustainability'],
  },
};

// ===================================
// PROJECT MH2 CONFIGURATION
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
      enabled: false, // Set to true when you have a model
      title: '3D Model Visualization',
      modelUrl: 'assets/projects/mh2/models/building.glb',
      modelType: 'glb',
      modelScale: 1,
      modelPosition: [0, 0, 0],
      modelRotation: [0, 0, 0],
      cameraPosition: [0, 2, 6],
      cameraFov: 45,
      environment: 'city',
      backgroundColor: '#000000',
    },
    carousels: [
      {
        id: 'carousel1',
        enabled: true,
        title: 'Concept Phase',
        images: PROJECT_ASSETS.mh2.carousel1,
        items: PROJECT_ASSETS.mh2.carousel1.length,
      },
      {
        id: 'carousel2',
        enabled: true,
        title: 'Detail Phase',
        images: PROJECT_ASSETS.mh2.carousel2,
        items: PROJECT_ASSETS.mh2.carousel2.length,
      },
    ],
  },
  metadata: {
    collaborators: 'Internal R&D',
    type: 'Research & Prototype',
    description:
      'Demonstrates a flexible project layout with multiple carousels and layered map animation.',
    duration: '2024–Present',
    status: 'In Progress',
    tags: ['Infrastructure', 'Mapping', 'UI Systems'],
    budget: '$250k',
    locations: ['SEA', 'EU'],
    technologies: ['React', 'SVG', 'Animation'],
  },
};

// ===================================
// ALL PROJECTS REGISTRY
export const ALL_PROJECTS = {
  [PROJECT_MH1.id]: PROJECT_MH1,
  [PROJECT_MH2.id]: PROJECT_MH2,
};

// ===================================
// UTILITY FUNCTIONS
export const getProjectById = (projectId) => ALL_PROJECTS[projectId] || null;
export const getProjectIds = () => Object.keys(ALL_PROJECTS);
export const getProjectsByCategory = (category) =>
  Object.values(ALL_PROJECTS).filter((project) => project.category === category);
export const getProjectPreviews = () =>
  Object.values(ALL_PROJECTS).map((project) => ({
    id: project.id,
    title: project.sections.hero?.title || '',
    subtitle: project.sections.hero?.subtitle || '',
    category: project.category || '',
    thumbnail: project.assets.hero,
    tags: project.metadata.tags,
    status: project.metadata.status,
  }));

// ===================================
// DEFAULT EXPORT
export default {
  projects: ALL_PROJECTS,
  getProjectById,
  getProjectIds,
  getProjectsByCategory,
  getProjectPreviews,
};