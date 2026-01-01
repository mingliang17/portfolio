// src/pages/templates/ProjectLayout.jsx
// SIMPLIFIED: Just a wrapper now, no navigation logic

import React from 'react';

const ProjectLayout = ({ children }) => {
  return (
    <div className="project-layout-wrapper">
      {children}
    </div>
  );
};

export default ProjectLayout;