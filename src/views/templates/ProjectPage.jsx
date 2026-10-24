// src/views/templates/ProjectPage.jsx
//
// One route ("/projects/:id") renders every project, in one of two ways:
//
//   1. Data-driven (default): the project's `sections` array — ordered, any mix of types, repeats
//      allowed — becomes the page. Edit the data; no component code needed.
//   2. Bespoke: the project names a hand-written page (`page: 'lumen'`, see projects/customPages.js)
//      that composes ready-made sections with its own.
//
// Either way the page is a <ScrollStage>: the same scroll, transitions and sphere background.
// Full guide: docs/ProjectPages.md.

import React, { useMemo } from 'react';
import { getProjectById } from '@/constants/projectsData.js';
import { buildSections } from '@/projects/buildSections.js';
import ProjectStage from '@/projects/ProjectStage.jsx';
import { CUSTOM_PAGES } from '@/projects/customPages.js';

const ProjectPage = ({ projectId }) => {
  const project = getProjectById(projectId);
  const Custom = project?.page ? CUSTOM_PAGES[project.page] : null;
  if (project?.page && !Custom) console.error(`[projects] "${project.id}" asks for page "${project.page}", which is not in customPages.js — using its data sections instead.`);

  const sections = useMemo(() => (project && !Custom ? buildSections(project) : []), [project, Custom]);

  if (!project) return <div className="project-error"><h1>Project not found</h1></div>;
  if (Custom) return <Custom project={project} />;
  return <ProjectStage id={project.id} sections={sections} />;
};

export default ProjectPage;
