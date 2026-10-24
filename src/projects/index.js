// src/projects/index.js — public API for project pages. See docs/ProjectPages.md.
//
//   import { ProjectStage, section, Media } from '@/projects';
export { default as ProjectStage } from './ProjectStage.jsx';
export { section, registerSectionType, SECTION_TYPES, sectionTypeNames } from './sectionTypes.jsx';
export { buildSections } from './buildSections.js';
export { normalizeSections, findSection, projectTitle, projectCover, BUILT_IN_TYPES } from './normalize.js';
export { default as Media } from './blocks/Media.jsx';
