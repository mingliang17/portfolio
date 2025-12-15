// src/constants/projectsData.js
// Centralized project data structure for easy scaling

import { PROJECT_ASSETS } from '../assets/index.js';
// ===================================
// PROJECT MH1 CONFIGURATION
export const PROJECT_MH1 = {
  id: 'mh1',
  title: 'Project MH1',
  subtitle: 'Redefining Agriculture Tested 1 Through Genetic Innovation(Project Card/Listing Page',
  category: 'Biotechnology',
  
  assets: {
    hero: PROJECT_ASSETS.mh1.hero,
    map: {
        A: PROJECT_ASSETS.mh1.map.layer0,
        B: PROJECT_ASSETS.mh1.map.layer1,
        C: PROJECT_ASSETS.mh1.map.layer2,
        D: PROJECT_ASSETS.mh1.map.layer3,
        E: PROJECT_ASSETS.mh1.map.layer4,
      },
    
    logos: PROJECT_ASSETS.mh1.logos,
  },
  
  sections: {
    hero: {
      enabled: true,
      title: 'Project MH1',
      subtitle: 'Redefining Agriculture Tested 2 Through Genetic Innovation(Hero Section)',
      animationType: 'unlock', // 'unlock', 'fade', 'scroll'
    },
    
    map: {
      enabled: true,
      title: 'Project Location',
      component: 'MyMap', // Component name to load
      animateOnEntry: true,
    },
    
    carousel: {
      enabled: true,
      title: 'Project Gallery',
      items: 4, // Number of carousel items
    },
  },
  
  metadata: {
    collaborators: 'Meinhardt EPCM',
    type: 'Design and Preliminary Design',
    description: 'A comprehensive genetic research project focused on developing sustainable agricultural solutions through innovative crop genetics. The project encompasses research, development, and implementation of advanced genetic technologies.',
    disclaimer: '*Client Name and certain details have been omitted for confidentiality',
    
    // Additional metadata
    duration: '2023-2024',
    status: 'Completed',
    tags: ['Biotechnology', 'Agriculture', 'Genetics', 'Sustainability'],
  },
};

export const PROJECT_MH2 = {}

// ===================================
// ALL PROJECTS REGISTRY
// ===================================

/**
 * Central registry of all projects
 * Add new projects here as you create them
 */
export const ALL_PROJECTS = {
  mh1: PROJECT_MH1,
  mh2: PROJECT_MH2,
};
export const getProjectById = (projectId) => {
  return ALL_PROJECTS[projectId] || null;
};

export const getProjectIds = () => {
  return Object.keys(ALL_PROJECTS);
};

export const getProjectsByCategory = (category) => {
  return Object.values(ALL_PROJECTS).filter(
    project => project.category === category
  );
};

export const getProjectPreviews = () => {
  return Object.values(ALL_PROJECTS).map(project => ({
    id: project.id,
    title: project.title,
    subtitle: project.subtitle,
    category: project.category,
    thumbnail: project.assets.hero,
    tags: project.metadata.tags,
    status: project.metadata.status,
  }));
};

// ===================================
// DEFAULT EXPORT
// ===================================

export default {
  projects: ALL_PROJECTS,
  getProjectById,
  getProjectIds,
  getProjectsByCategory,
  getProjectPreviews,
};