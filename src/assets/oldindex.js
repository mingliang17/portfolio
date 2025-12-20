const BASE_URL = import.meta.env.BASE_URL;

// Helper function to construct asset paths
// Converts: 'assets/image.jpg' → '/portfolio/assets/image.jpg' (production)
//        or 'assets/image.jpg' → '/assets/image.jpg' (development)
const assetPath = (path) => `${BASE_URL}${path}`.replace(/\/+/g, '/');

// ===================================
// ICONS
// ===================================

export const ICONS = {
  github: assetPath('assets/icons/github.svg'),
  twitter: assetPath('assets/icons/twitter.svg'),
  instagram: assetPath('assets/icons/instagram.svg'),
  menu: assetPath('assets/icons/menu.svg'),
  close: assetPath('assets/icons/close.svg'),
  arrowUp: assetPath('assets/icons/arrow-up.png'),
  leftArrow: assetPath('assets/icons/left-arrow.png'),
  rightArrow: assetPath('assets/icons/right-arrow.png'),
  star: assetPath('assets/icons/star.png'),
  copy: assetPath('assets/icons/copy.svg'),
  tick: assetPath('assets/icons/tick.svg'),
};

// ===================================
// 3D MODELS & TEXTURES
// ===================================

export const MODELS = {
  human: {
    developer: assetPath('models/human/developer.glb'),
    waving: assetPath('models/human/waving.fbx'),
    idle: assetPath('models/human/idle.fbx'),
    dancing: assetPath('models/human/dancing.fbx'),
    thankful: assetPath('models/human/thankful.fbx'),
  },
  earth: {
    model: assetPath('models/earth/custom.geo.json'),
  }
};

export const TEXTURES = {
  earth: {
    day: assetPath('textures/earth-day.jpg'),
    night: assetPath('textures/earth-night.jpg'),
    normal: assetPath('textures/earth-normal.jpg'),
  },
};

// ===================================
// PROJECT-SPECIFIC ASSETS
// ===================================

// ===================================
// PROJECT MH1 CONFIGURATION
export const PROJECT_MH1 = {
  id: 'mh1',
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
    carousel: PROJECT_ASSETS.mh1.carousel,
  },

  sections: {
    hero: {
      enabled: true,
      title: 'Project MH1',
      subtitle: 'Redefining Agriculture Tested 2 Through Genetic Innovation (Hero Section)',
      animationType: 'unlock', // 'unlock', 'fade', 'scroll'
    },
    map: {
      enabled: true,
      title: 'Project Location',
      animateOnEntry: true,
    },
    carousel: [
      {
        enabled: true,
        title: 'Project Gallery',
        items: 6,
        images: PROJECT_ASSETS.mh1.carousel,
      },
    ],
  },

  metadata: {
    collaborators: 'Meinhardt EPCM',
    type: 'Design and Preliminary Design',
    description: 'A comprehensive genetic research project focused on developing sustainable agricultural solutions through innovative crop genetics. The project encompasses research, development, and implementation of advanced genetic technologies.',
    disclaimer: '*Client Name and certain details have been omitted for confidentiality',
    duration: '2023-2024',
    status: 'Completed',
    tags: ['Biotechnology', 'Agriculture', 'Genetics', 'Sustainability'],
  },
};

// ===================================
// PROJECT MH2 CONFIGURATION (Example Dynamic)
// ===================================
export const PROJECT_MH2 = {
  id: 'mh2',
  assets: {
    hero: PROJECT_ASSETS.mh2.hero,
    map: PROJECT_ASSETS.mh2.map,
    logos: PROJECT_ASSETS.mh2.logos,
    carousel: PROJECT_ASSETS.mh2.carousel,
  },

  sections: {
    hero: {
      enabled: true,
      title: 'Project MH2',
      subtitle: 'Exploring Dynamic Project Pages with Multiple Sections',
      animationType: 'fade',
    },
    map: {
      enabled: true,
      title: 'Project Map & Metrics',
      animateOnEntry: false,
    },
    carousel: [
      {
        enabled: true,
        title: 'Gallery 1',
        items: 3,
        images: PROJECT_ASSETS.mh2.carousel,
      },
      {
        enabled: true,
        title: 'Gallery 2',
        items: 3,
        images: PROJECT_ASSETS.mh2.carousel, // duplicate just as example
      },
    ],
  },

  metadata: {
    collaborators: 'Dynamic Team Inc.',
    type: 'Concept & Development',
    description: 'MH2 demonstrates a flexible project structure with multiple carousels, toggleable sections, and unique metadata.',
    disclaimer: 'All data is sample content for demonstration purposes.',
    duration: '2024-Present',
    status: 'In Progress',
    tags: ['Dynamic', 'Flexible', 'React', 'Projects'],
    extra: {
      budget: '$500,000',
      location: 'Virtual Lab',
      client: 'Example Corp',
    },
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
export const getProjectsByCategory = (category) =>
  Object.values(ALL_PROJECTS).filter((project) => project.category === category);
export const getProjectPreviews = () =>
  Object.values(ALL_PROJECTS).map((project) => ({
    id: project.id,
    title: project.title,
    subtitle: project.subtitle,
    category: project.category,
    thumbnail: project.assets.hero,
    tags: project.metadata.tags,
    status: project.metadata.status,
  }));

// ===================================
// HELPER FUNCTIONS
// ===================================
/**
 * Get project logos as dictionary (recommended)
 * @param {string} projectId - The project identifier
 * @returns {object} Dictionary of logos
 */
export const getProjectLogos = (projectId) => {
  const project = PROJECT_ASSETS[projectId];
  return project?.logos || {};
};

/**
 * Dynamic asset loader for project carousels
 * @param {string} projectId - The project identifier
 * @param {number} count - Number of carousel images
 * @returns {array} Array of image paths
 */
export const getProjectCarousel = (projectId, count) => {
  return Array.from({ length: count }, (_, i) => 
    assetPath(`assets/projects/${projectId}/image_${i + 1}.jpg`)
  );
};

/**
 * Get all assets for a model with its animations
 * @param {string} modelName - Name of the model
 * @returns {object} Model and animation paths
 */
export const getModelWithAnimations = (modelName) => {
  return {
    model: assetPath(`models/${modelName}/${modelName}.glb`),
    animations: {
      idle: assetPath(`models/${modelName}/idle.fbx`),
      walk: assetPath(`models/${modelName}/walk.fbx`),
      run: assetPath(`models/${modelName}/run.fbx`),
    },
  };
};

// Export the base assetPath function for custom paths
export { assetPath };

// Default export for convenience
export default {
  icons: ICONS,
  models: MODELS,
  textures: TEXTURES,
  getProjectLogos,        // New: dictionary version
  getProjectCarousel,
  assetPath,
  projects: ALL_PROJECTS,
  getProjectById,
  getProjectIds,
  getProjectsByCategory,
  getProjectPreviews,
};
