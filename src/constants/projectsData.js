// src/constants/projectsData.js
import { PROJECT_ASSETS } from '../assets/index.js';

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
      enabled: false,
      title: 'Project MH1',
      subtitle: 'Redefining Agriculture Through Genetic Innovation',
      animationType: 'unlock',
      snapToTop: true,
    },
    model: {
      enabled: false,
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
      snapToTop: false,
      fitInViewport: true,
    },
    map: {
      enabled: false,
      title: 'Project Location',
      animateOnEntry: true,
      snapToTop: true,
      fitInViewport: true,
    },
    anime: {
      enabled: false,
      title: 'Interactive Reconstruction',
      modelPath: 'assets/projects/mh1/models/gltf/mh1_2.gltf',
      snapToTop: true,
      fitInViewport: true,
      checkpoints: [
        { title: 'Initial State', description: 'Model fully assembled.' },
        { title: 'Structural Scan', description: 'Analyzing component architecture.' },
        { title: 'Deconstruction', description: 'Breaking down into mesh elements.' },
        { title: 'Scattered State', description: 'All components separated.' },
        { title: 'Reassembly', description: 'Reconstructing piece by piece.' },
        { title: 'Complete', description: 'Model fully reconstructed.' }
      ]
    },
    spin: {
      enabled: false,
      title: 'Design Evolution',
      componentName: 'Mh1Model',
      modelUrl: 'assets/projects/mh1/models/gltf/mh1_2.gltf',
      scale: 0.04,
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      cameraPosition: [0, 0, 30],
      cameraFov: 50,
      environment: 'city',
      backgroundColor: '#0a1929',
      enableShadows: true,
      rotationsPerScroll: 1, 
      shiftConfig: {
        xOffset: 3.5,
        yOffset: 0,
        lerpSpeed: 0.04 
      },
      checkpoints: [
        { 
          title: 'Conceptual Phase', 
          description: 'Initial design concepts focused on sustainability.',
          cameraPos: [0.5, 0, 5], 
          modelRot: [0.25, 0.75, 0],
          modelPos: [0, 0, 0] 
        },
        { 
          title: 'Structural Analysis', 
          description: 'Ensuring maximum efficiency and integration.',
          cameraPos: [-1.5, 0, 6],
          modelRot: [Math.PI / 4, Math.PI, 0],
          modelPos: [0, 0, 0]
        },
        { 
          title: 'Material Selection', 
          description: 'Eco-friendly materials chosen for durability.',
          cameraPos: [2, 0, 7], 
          modelRot: [0, Math.PI, 0],
          modelPos: [0, 0, 0]
        },
        { 
          title: 'Integration Design', 
          description: 'Optimizing workflow and research capabilities.',
          cameraPos: [0, -1, 5], 
          modelRot: [Math.PI / 2, 0, 0],
          modelPos: [0, 0.5, 0]
        },
        { 
          title: 'Final Implementation', 
          description: 'Complete realization of the vision.',
          cameraPos: [0, 0, 8], 
          modelRot: [0, Math.PI * 2, 0],
          modelPos: [0, 0, 0]
        }
      ]
    },
    explode: {
  enabled: true,
  title: 'Interactive Reconstruction',
  modelPath: 'assets/projects/mh1/models/gltf/mh1_2.gltf',
  snapToTop: true,
  fitInViewport: true,
  checkpoints: [
    { 
      title: 'Initial State',
      description: 'Model fully assembled at center.',
      cameraPos: [0, 5, 30],
      modelPos: [0, -1, 0],
      modelRot: [0, 0, 0],
      modelScale: 0.06,
      cameraLookAt: [0, -1, 0]
    },
    { 
      title: 'Structural Analysis',
      description: 'Examining architectural components.',
      cameraPos: [5, 5, 25],
      modelPos: [-3, -1, 0],
      modelRot: [0, Math.PI / 6, 0],
      modelScale: 0.06,
      cameraLookAt: [-3, -1, 0]
    },
    { 
      title: 'Deconstruction Phase',
      description: 'Breaking down into mesh elements.',
      cameraPos: [-5, 5, 25],
      modelPos: [3, -1, 0],
      modelRot: [0, -Math.PI / 6, 0],
      modelScale: 0.06,
      cameraLookAt: [3, -1, 0]
    },
    { 
      title: 'Scattered Components',
      description: 'All elements separated and analyzed.',
      cameraPos: [0, 8, 28],
      modelPos: [-2, 1, 0],
      modelRot: [0, Math.PI / 4, 0],
      modelScale: 0.055,
      cameraLookAt: [-2, 1, 0]
    },
    { 
      title: 'Reassembly Process',
      description: 'Reconstructing piece by piece.',
      cameraPos: [0, 5, 28],
      modelPos: [2, -2, 0],
      modelRot: [0, -Math.PI / 4, 0],
      modelScale: 0.055,
      cameraLookAt: [2, -2, 0]
    },
    { 
      title: 'Reconstruction Complete',
      description: 'Model fully reconstructed and optimized.',
      cameraPos: [0, 5, 30],
      modelPos: [0, -1, 0],
      modelRot: [0, Math.PI * 2, 0],
      modelScale: 0.06,
      cameraLookAt: [0, -1, 0]
    }
  ]
},
    carousels: [
      { id: 'carousel1', enabled: true, title: 'Concept Phase', images: PROJECT_ASSETS.mh1.carousel1, snapToTop: true, fitInViewport: true },
      { id: 'carousel2', enabled: true, title: 'Detail Phase', images: PROJECT_ASSETS.mh1.carousel2, snapToTop: true, fitInViewport: true },
    ],
  },
  metadata: {
    collaborators: 'Meinhardt EPCM',
    type: 'Design and Preliminary Design',
    description: 'Comprehensive genetic research project.',
    duration: '2023-2024',
    status: 'Completed',
    tags: ['Biotechnology', 'Agriculture', 'Genetics', 'Sustainability'],
  },
};

export const PROJECT_MH2 = {
  id: 'mh2',
  assets: {
    hero: PROJECT_ASSETS.mh2.hero,
    map: PROJECT_ASSETS.mh2.map,
    logos: PROJECT_ASSETS.mh2.logos,
    carousel1: PROJECT_ASSETS.mh2.carousel1,
  },
  sections: {
    hero: { enabled: true, title: 'Project MH2', snapToTop: true },
    map: { enabled: true, title: 'Spatial Analysis', snapToTop: true, fitInViewport: true },
    model: { enabled: true, title: '3D Model', scale: 0.5, position: [0, -1, 0], snapToTop: true, fitInViewport: true },
    spin: { enabled: false },
    explode: { enabled: false, stages: [] },
    carousels: [{ id: 'carousel1', enabled: true, title: 'Concept Phase', images: PROJECT_ASSETS.mh2.carousel1, snapToTop: true, fitInViewport: true }],
  },
  metadata: {
    collaborators: 'Internal R&D',
    type: 'Research & Prototype',
    duration: '2024–Present',
    status: 'In Progress',
    tags: ['Infrastructure', 'Mapping'],
  },
};

export const ALL_PROJECTS = { 
  [PROJECT_MH1.id]: PROJECT_MH1, 
  [PROJECT_MH2.id]: PROJECT_MH2 
};

export const getProjectById = (id) => ALL_PROJECTS[id] || null;
export const getProjectIds = () => Object.keys(ALL_PROJECTS);
export const getModelConfig = (id) => getProjectById(id)?.sections?.model || null;
export const getSpinConfig = (id) => getProjectById(id)?.sections?.spin || null;
export const getExplodeConfig = (id) => getProjectById(id)?.sections?.explode || null;

export default { 
  projects: ALL_PROJECTS, 
  getProjectById, 
  getProjectIds, 
  getModelConfig, 
  getSpinConfig, 
  getExplodeConfig 
};