// src/assets/index.js
// Centralized asset path management for easy scaling
// 
// IMPORTANT: This file only contains PATHS to assets.
// The actual asset files (images, videos, models) are in public/ folder.
// 
// Structure:
//   public/assets/projects/mh1/hero.jpg  ← Actual file (in public/)
//   src/assets/index.js                   ← This file (path mapping)
//   Component: <img src={assets.hero} />  ← Usage in code

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

export const PROJECT_ASSETS = {
  mh1: {
    hero: assetPath('assets/projects/mh1/images/1.jpg'),
    
    carousel: [
      assetPath('assets/projects/mh1/images/1.jpg'),
      assetPath('assets/projects/mh1/images/2.jpg'),
      assetPath('assets/projects/mh1/images/3.jpg'),
      assetPath('assets/projects/mh1/images/4.jpg'),
      assetPath('assets/projects/mh1/images/5.jpg'),

    ],
    
    map: {
      layer0: assetPath('assets/projects/mh1/maps/0.svg'),
      layer1: assetPath('assets/projects/mh1/maps/1.svg'),
      layer2: assetPath('assets/projects/mh1/maps/2.svg'),
      layer3: assetPath('assets/projects/mh1/maps/3.svg'),
      layer4: assetPath('assets/projects/mh1/maps/4.svg'),
    },

    logos: {
      github: {
        src: ICONS.github,
        alt: "GitHub Repository",
        title: "View source code on GitHub",
        className: "logo-github"
      },
      twitter: {
        src: ICONS.twitter,
        alt: "Twitter Profile",
        title: "Follow on Twitter",
        className: "logo-twitter"
      },
      instagram: {
        src: ICONS.instagram,
        alt: "Instagram Profile",
        title: "Follow on Instagram",
        className: "logo-instagram"
      }
    },
  },
  
  // Example: Another project with dictionary logos
  project2: {
    logos: {
      companyA: {
        src: assetPath('assets/logos/company-a.svg'),
        alt: "Company A",
        title: "Client: Company A",
        className: "logo-company-a"
      },
      companyB: {
        src: assetPath('assets/logos/company-b.png'),
        alt: "Company B",
        title: "Partner: Company B",
        className: "logo-company-b"
      }
    }
  }
};

// ===================================
// HELPER FUNCTIONS
// ===================================

/**
 * Get project assets by ID
 * @param {string} projectId - The project identifier
 * @returns {object} Project-specific assets
 */
export const getProjectAssets = (projectId) => {
  return PROJECT_ASSETS[projectId] || null;
};

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
  projects: PROJECT_ASSETS,
  getProjectAssets,
  getProjectLogos,        // New: dictionary version
  getProjectCarousel,
  assetPath,
};