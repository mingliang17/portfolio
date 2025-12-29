// src/constants/projectsData.js
import { PROJECT_ASSETS } from '../assets/index.js';

// ===================================
// PROJECT MH1 CONFIGURATION (USES JSX)
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
      
      // JSX Component Configuration
      componentName: 'Mh1Model', // Uses the gltfjsx component
      
      // Display settings
      scale: 0.05,
      position: [0, -0.5, 0],
      rotation: [0, Math.PI / 4, 0],
      
      // Camera & Environment
      cameraPosition: [0, 1, 4],
      cameraFov: 50,
      environment: 'city',
      backgroundColor: '#1a1a1a',
      
      // Optional settings
      debug: false,
      enableShadows: true,
      enableMaterials: true,
      
      // Optional: Material overrides
      // materialOverrides: {
      //   'Reflective_glass_Glass': { opacity: 0.8, roughness: 0.1 },
      //   'Aluminium_panel_fix_Box2': { metalness: 0.9, roughness: 0.4 }
      // }
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
    description:
      'A comprehensive genetic research project focused on developing sustainable agricultural solutions through innovative crop genetics.',
    disclaimer: '*Client Name and certain details have been omitted for confidentiality',
    duration: '2023-2024',
    status: 'Completed',
    tags: ['Biotechnology', 'Agriculture', 'Genetics', 'Sustainability'],
  },
};

// ===================================
// PROJECT MH2 CONFIGURATION (USES FBX)
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
      enabled: true, // Changed to true for FBX loading
      title: '3D Model Visualization',
      
      // Generic FBX Model Configuration
      url: 'assets/projects/mh2/models/building.fbx', // FBX file
      type: 'fbx',
      
      // Display settings
      scale: 0.5,
      position: [0, -1, 0],
      rotation: [0, Math.PI / 3, 0],
      
      // Camera & Environment
      cameraPosition: [0, 2, 8],
      cameraFov: 45,
      environment: 'studio',
      backgroundColor: '#0a0a0a',
      
      // Generic loader options
      enableShadows: true,
      enableMaterials: true,
      debug: false,
      
      // FBX specific settings
      animations: {
        enabled: false,
        autoPlay: false,
        animationName: 'Idle',
      }
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
// PROJECT MH3 CONFIGURATION (USES GLB)
// ===================================
// export const PROJECT_MH3 = {
//   id: 'mh3',
//   assets: {
//     hero: PROJECT_ASSETS.mh3.hero,
//     map: PROJECT_ASSETS.mh3.map,
//     logos: PROJECT_ASSETS.mh3.logos,
//     carousel1: PROJECT_ASSETS.mh3.carousel1,
//     carousel2: PROJECT_ASSETS.mh3.carousel2,
//   },
//   sections: {
//     hero: {
//       enabled: true,
//       title: 'Project MH3',
//       subtitle: 'Advanced Urban Development',
//       animationType: 'slide',
//     },
//     map: {
//       enabled: true,
//       title: 'Urban Analysis',
//       animateOnEntry: true,
//     },
//     model: {
//       enabled: true,
//       title: '3D Model Visualization',
      
//       // Generic GLB Model Configuration
//       url: 'assets/projects/mh3/models/building.glb',
//       type: 'glb',
      
//       // Display settings
//       scale: 0.8,
//       position: [0, -0.5, 0],
//       rotation: [0, Math.PI / 6, 0],
      
//       // Camera & Environment
//       cameraPosition: [0, 3, 10],
//       cameraFov: 40,
//       environment: 'apartment',
//       backgroundColor: '#1a1a1a',
      
//       // Generic loader options
//       enableShadows: true,
//       enableMaterials: true,
//       debug: false,
      
//       // GLB specific settings (can contain animations)
//       animations: {
//         enabled: true,
//         autoPlay: true,
//         loop: true,
//       }
//     },
//     carousels: [
//       {
//         id: 'carousel1',
//         enabled: true,
//         title: 'Design Phase',
//         images: PROJECT_ASSETS.mh3.carousel1,
//         items: PROJECT_ASSETS.mh3.carousel1.length,
//       },
//       {
//         id: 'carousel2',
//         enabled: true,
//         title: 'Construction Phase',
//         images: PROJECT_ASSETS.mh3.carousel2,
//         items: PROJECT_ASSETS.mh3.carousel2.length,
//       },
//     ],
//   },
//   metadata: {
//     collaborators: 'Urban Solutions Group',
//     type: 'Urban Development',
//     description:
//       'A cutting-edge urban development project focusing on sustainable architecture and smart city integration.',
//     disclaimer: '*Project details under NDA',
//     duration: '2024–2025',
//     status: 'In Progress',
//     tags: ['Urban Planning', 'Sustainable Design', 'Smart Cities', 'Architecture'],
//     budget: '$1.2M',
//     locations: ['Global'],
//     technologies: ['BIM', 'Parametric Design', 'IoT Integration'],
//   },
// };

// ===================================
// ALL PROJECTS REGISTRY
// ===================================
export const ALL_PROJECTS = {
  [PROJECT_MH1.id]: PROJECT_MH1,
  [PROJECT_MH2.id]: PROJECT_MH2,
  // [PROJECT_MH3.id]: PROJECT_MH3,
};

// ===================================
// UTILITY FUNCTIONS
// ===================================
export const getProjectById = (projectId) => ALL_PROJECTS[projectId] || null;
export const getProjectIds = () => Object.keys(ALL_PROJECTS);

// Helper to get model configuration
export const getModelConfig = (projectId) => {
  const project = getProjectById(projectId);
  return project?.sections?.model || null;
};

// Helper to check model type
export const hasCustomComponent = (projectId) => {
  const config = getModelConfig(projectId);
  return config?.componentName && !config?.url;
};

// Helper to get project assets
export const getProjectAssets = (projectId) => {
  const project = getProjectById(projectId);
  return project?.assets || {};
};

export const getProjectPreviews = () =>
  Object.values(ALL_PROJECTS).map((project) => ({
    id: project.id,
    title: project.sections.hero?.title || '',
    subtitle: project.sections.hero?.subtitle || '',
    thumbnail: project.assets.hero,
    tags: project.metadata.tags,
    status: project.metadata.status,
  }));

// ===================================
// DEFAULT EXPORT
// ===================================
export default {
  projects: ALL_PROJECTS,
  getProjectById,
  getProjectIds,
  getModelConfig,
  getProjectAssets,
  hasCustomComponent,
  getProjectPreviews,
};