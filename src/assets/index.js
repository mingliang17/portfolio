// src/assets/index.js
import { ICONS } from "./icons.js";
import { assetPath } from "@/utils/assetPath.js";

// ===================================
// 3D MODELS & TEXTURES
export const MODELS = {
  human: {
    developer: assetPath('models/human/developer.glb'),
    waving: assetPath('models/human/waving.fbx'),
    idle: assetPath('models/human/idle.fbx'),
    dancing: assetPath('models/human/dancing.fbx'),
    thankful: assetPath('models/human/thankful.fbx'),
  },
  earth: { model: assetPath('models/earth/custom.geo.json') },
};

export const TEXTURES = {
  earth: {
    day: assetPath('textures/earth-day.jpg'),
    night: assetPath('textures/earth-night.jpg'),
    normal: assetPath('textures/earth-normal.jpg'),
  },
};

// MH1 Carousel Items
const MH1_CAROUSEL_1_ITEMS = [
  {
    id: 1,
    image: assetPath('assets/projects/mh1/images/render1.jpg'),
    title: 'Innovation in Agriculture',
    description: 'Pioneering genetic research for sustainable farming solutions.',
    information: 'Date: January 2024\nLocation: Research Lab A\nClient: AgriTech Corp\n',
  },
  {
    id: 2,
    image: assetPath('assets/projects/mh1/images/render2.jpg'),
    title: 'Sustainable Farming',
    description: 'Environmentally conscious methods preserving resources.',
    information: 'Additional details about Sustainable Farming.',
  },
  {
    id: 3,
    image: assetPath('assets/projects/mh1/images/3.jpg'),
    title: 'Genetic Excellence',
    description: 'Advanced crop genetics for climate challenges.',
    information: 'Additional details about Genetic Excellence.',
  },
  {
    id: 4,
    image: assetPath('assets/projects/mh1/images/4.jpg'),
    title: 'Future Harvest',
    description: 'Breakthrough developments in crop science.',
    information: 'Additional details about Future Harvest.',
  },
  {
    id: 5,
    image: assetPath('assets/projects/mh1/images/5.jpg'),
    title: 'Climate Resilience',
    description: 'Engineering crops for diverse conditions.',
    information: 'Additional details about Climate Resilience.',
  },
];

const MH1_CAROUSEL_2_ITEMS = [
  {
    id: 1,
    image: assetPath('assets/projects/mh1/images/floor1.jpg'),
    title: 'Floor Plan 1',
    description: 'First floor layout and design.',
    information: 'Date: January 2024\nLocation: Research Lab A',
  },
  {
    id: 2,
    image: assetPath('assets/projects/mh1/images/floor2.jpg'),
    title: 'Floor Plan 2',
    description: 'Second floor layout and design.',
    information: 'Additional details about Floor Plan 2.',
  },
  {
    id: 3,
    image: assetPath('assets/projects/mh1/images/floor3.jpg'),
    title: 'Floor Plan 3',
    description: 'Third floor layout and design.',
    information: 'Additional details about Floor Plan 3.',
  },
  {
    id: 4,
    image: assetPath('assets/projects/mh1/images/floor4.jpg'),
    title: 'Floor Plan 4',
    description: 'Fourth floor layout and design.',
    information: 'Additional details about Floor Plan 4.',
  },
  {
    id: 5,
    image: assetPath('assets/projects/mh1/images/site1.jpg'),
    title: 'Site Plan',
    description: 'Overall site layout and planning.',
    information: 'Additional details about Site Plan.',
  },
];

// MH2 Carousel Items
const MH2_CAROUSEL_PRIMARY_ITEMS = [
  {
    id: 1,
    image: assetPath('assets/projects/mh2/images/1.jpg'),
    title: 'Concept Phase - Initial Design',
    description: 'Initial architectural concepts and spatial planning.',
  },
  {
    id: 2,
    image: assetPath('assets/projects/mh2/images/2.jpg'),
    title: 'Concept Phase - 3D Visualization',
    description: 'Three-dimensional renderings of proposed infrastructure.',
  },
  {
    id: 3,
    image: assetPath('assets/projects/mh2/images/3.jpg'),
    title: 'Concept Phase - Site Analysis',
    description: 'Geographic and environmental analysis of project location.',
  },
];

const MH2_CAROUSEL_SECONDARY_ITEMS = [
  {
    id: 4,
    image: assetPath('assets/projects/mh2/images/4.jpg'),
    title: 'Detail Phase - Structural Engineering',
    description: 'Detailed structural analysis and engineering drawings.',
  },
  {
    id: 5,
    image: assetPath('assets/projects/mh2/images/5.jpg'),
    title: 'Detail Phase - Material Specifications',
    description: 'Material selections and technical specifications.',
  },
  {
    id: 6,
    image: assetPath('assets/projects/mh2/images/6.jpg'),
    title: 'Detail Phase - Final Integration',
    description: 'Complete project integration and system optimization.',
  },
];

// ===================================
// PROJECT ASSETS EXPORT
export const PROJECT_ASSETS = {
  mh1: {
    hero: assetPath('assets/projects/mh1/images/render1.jpg'),
    // ✅ FIXED: Separate carousel properties
    carousel1: MH1_CAROUSEL_1_ITEMS,
    carousel2: MH1_CAROUSEL_2_ITEMS,
    map: {
      A: assetPath('assets/projects/mh1/maps/0.svg'),
      B: assetPath('assets/projects/mh1/maps/1.svg'),
      C: assetPath('assets/projects/mh1/maps/2.svg'),
      D: assetPath('assets/projects/mh1/maps/3.svg'),
      E: assetPath('assets/projects/mh1/maps/4.svg'),
    },
    logos: {
      rhino: ICONS.indesign,
      twinmotion: ICONS.aftereffects,
      revit: ICONS.lightroom,
      a: ICONS.lumion,
      b: ICONS.adobe,
    },
  },
  mh2: {
    hero: assetPath('assets/projects/mh2/images/1.jpg'),
    carousel1: MH2_CAROUSEL_PRIMARY_ITEMS,
    carousel2: MH2_CAROUSEL_SECONDARY_ITEMS,
    map: {
      A: assetPath('assets/projects/mh2/maps/0.svg'),
      B: assetPath('assets/projects/mh2/maps/1.svg'),
      C: assetPath('assets/projects/mh2/maps/2.svg'),
      D: assetPath('assets/projects/mh2/maps/3.svg'),
      E: assetPath('assets/projects/mh2/maps/4.svg'),
    },
    logos: {
      github: ICONS.github,
      twitter: ICONS.twitter,
      instagram: ICONS.instagram,
    },
  },
};

// ===================================
// HELPER FUNCTIONS
export const getProjectAssets = (projectId) => PROJECT_ASSETS[projectId] || null;
export const getProjectLogos = (projectId) => PROJECT_ASSETS[projectId]?.logos || {};

// ===================================
// DEFAULT EXPORT (Only one export default!)
export default {
  MODELS,
  TEXTURES,
  PROJECT_ASSETS,
  getProjectAssets,
  getProjectLogos,
  assetPath,
};