// src/constants/projectsData.js
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
    // Model path
    model: '/assets/projects/mh1/models/computer.glb', // Update this path to your actual FBX file
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
      title: '3D Visualization',
      modelUrl: '/assets/projects/mh1/models/computer.glb', // Path to your FBX file
      modelScale: 0.01,
      modelPosition: [0, -1, 0],
      modelRotation: [0, 0, 0],
      cameraPosition: [0, 2, 6],
      cameraFov: 45,
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
    model: '/assets/projects/mh2/Mh2.fbx', // Add model path if needed
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
      enabled: false, // Set to true when you have a model ready
      title: '3D Model Visualization',
      modelUrl: '/assets/projects/mh2/Mh2.fbx',
      modelScale: 0.01,
      modelPosition: [0, -1, 0],
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