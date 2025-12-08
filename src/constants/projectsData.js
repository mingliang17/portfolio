// src/constants/projectsData.js
// Centralized project data structure for easy scaling

import { PROJECT_ASSETS } from '../assets/index.js';

// ===================================
// PROJECT CONFIGURATION TEMPLATE
// ===================================

/**
 * Project Data Structure Template
 * 
 * Each project should follow this structure for consistency:
 * {
 *   id: string,              // Unique identifier (used in URLs)
 *   title: string,           // Project display name
 *   subtitle: string,        // Hero subtitle
 *   category: string,        // Project category/type
 *   
 *   assets: {
 *     hero: string,         // Hero background image
 *     carousel: array,      // Carousel images
 *     map: object,          // Map layers (if applicable)
 *     logos: array,         // Technology/partner logos
 *   },
 *   
 *   sections: {
 *     hero: object,         // Hero section config
 *     map: object,          // Map section config
 *     carousel: object,     // Carousel section config
 *     timeline: object,     // Timeline section config (optional)
 *   },
 *   
 *   metadata: {
 *     collaborators: string,
 *     type: string,
 *     description: string,
 *     disclaimer: string,
 *   }
 * }
 */

// ===================================
// PROJECT: MH1
// ===================================

export const PROJECT_MH1 = {
  id: 'mh1',
  title: 'Project MH1',
  subtitle: 'Redefining Agriculture Tested 1 Through Genetic Innovation(Project Card/Listing Page',
  category: 'Biotechnology',
  
  assets: {
    hero: PROJECT_ASSETS.mh1.hero,
    carousel: PROJECT_ASSETS.mh1.carousel.map((img, index) => ({
      id: index + 1,
      image: img,
      title: [
        'Innovation in Agriculture',
        'Sustainable Farming',
        'Genetic Excellence',
        'Future Harvest',
      ][index] || `Image ${index + 1}`,
      description: [
        'Pioneering genetic research for sustainable farming solutions.',
        'Environmentally conscious methods preserving resources.',
        'Advanced crop genetics for climate challenges.',
        'Breakthrough developments in crop science.',
      ][index] || '',
    })),
    map: PROJECT_ASSETS.mh1.map,
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

// ===================================
// PROJECT TEMPLATE FOR NEW PROJECTS
// ===================================

export const PROJECT_TEMPLATE = {
  id: 'project-id',
  title: 'Project Title',
  subtitle: 'Project Subtitle',
  category: 'Category',
  
  assets: {
    hero: '/path/to/hero.jpg',
    carousel: [],
    map: null,
    logos: [],
  },
  
  sections: {
    hero: {
      enabled: true,
      title: 'Project Title',
      subtitle: 'Project Subtitle',
      animationType: 'fade',
    },
    map: {
      enabled: false,
      title: 'Project Location',
      component: null,
      animateOnEntry: false,
    },
    carousel: {
      enabled: true,
      title: 'Project Gallery',
      items: 0,
    },
  },
  
  metadata: {
    collaborators: 'Collaborator Name',
    type: 'Project Type',
    description: 'Project description',
    disclaimer: '',
    duration: 'YYYY-YYYY',
    status: 'Ongoing/Completed',
    tags: [],
  },
};

// ===================================
// ALL PROJECTS REGISTRY
// ===================================

/**
 * Central registry of all projects
 * Add new projects here as you create them
 */
export const ALL_PROJECTS = {
  mh1: PROJECT_MH1,
  // mh2: PROJECT_MH2,
  // Add more projects here...
};

/**
 * Get project configuration by ID
 * @param {string} projectId - Project identifier
 * @returns {object|null} Project configuration or null if not found
 */
export const getProjectById = (projectId) => {
  return ALL_PROJECTS[projectId] || null;
};

/**
 * Get all project IDs
 * @returns {array} Array of project IDs
 */
export const getProjectIds = () => {
  return Object.keys(ALL_PROJECTS);
};

/**
 * Get projects by category
 * @param {string} category - Category name
 * @returns {array} Array of projects in that category
 */
export const getProjectsByCategory = (category) => {
  return Object.values(ALL_PROJECTS).filter(
    project => project.category === category
  );
};

/**
 * Get project preview data for listings
 * @returns {array} Array of project preview objects
 */
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