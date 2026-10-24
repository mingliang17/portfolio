// src/projects/customPages.js — bespoke project pages.
//
// A project whose data says `page: 'lumen'` renders CUSTOM_PAGES.lumen instead of the generic
// data-driven page. The component receives `{ project }` and returns whatever it likes —
// usually a <ProjectStage> that mixes ready-made `section(...)` templates with its own sections.
//
// To add one: create src/projects/pages/MyProject.jsx, import it here, and add `page: 'myProject'`
// to the project's data entry. (Data files stay free of React so Next can read them at build time.)
import Lumen from './pages/Lumen.jsx';

export const CUSTOM_PAGES = {
  lumen: Lumen,
};
