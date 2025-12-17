// src/components/project/ProjectLayout.jsx
// Reusable layout component for all project pages

import React from 'react';
import { NavigationDots } from '../common/LayoutComponents.jsx';

/**
 * ProjectLayout - Base layout for all project detail pages
 * 
 * @param {object} props
 * @param {number} props.currentSection - Current active section index
 * @param {number} props.totalSections - Total number of sections
 * @param {string} props.animationPhase - Animation phase state
 * @param {number} props.unlockProgress - Unlock animation progress (0-1)
 * @param {number} props.dragProgress - Drag progress (0-1)
 * @param {function} props.onSectionChange - Section change handler
 * @param {React.ReactNode} props.children - Section content
 * @param {string} props.className - Additional CSS classes
 */
const ProjectLayout = ({
  currentSection,
  totalSections,
  animationPhase,
  unlockProgress = 0,
  dragProgress = 0,
  onSectionChange,
  children,
  className = '',
}) => {
  
  // Determine if NavigationDots should be visible
  const shouldShowNavDots = totalSections > 1 && (
    animationPhase === 'completed' || 
    animationPhase === 'waiting' || 
    currentSection > 0
  );

  return (
    <div className={`project-base-container ${className}`}>
      {/* Navigation Dots - Conditional visibility */}
      {shouldShowNavDots && (
        <NavigationDots
          totalSections={totalSections}
          currentSection={currentSection}
          onSectionChange={onSectionChange}
          disabled={animationPhase === 'unlocking' || animationPhase === 'fadeout'}
        />
      )}

      {/* Main Content Container */}
      <div className="project-section-container">
        {children}
      </div>

      {/* Debug info - remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{
          position: 'fixed',
          bottom: '10px',
          left: '10px',
          background: 'rgba(0,0,0,0.7)',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '4px',
          fontSize: '11px',
          zIndex: 9999,
          fontFamily: 'monospace'
        }}>
          <div>Section: {currentSection + 1}/{totalSections}</div>
          <div>Phase: {animationPhase}</div>
          <div>Show Dots: {shouldShowNavDots ? 'Yes' : 'No'}</div>
        </div>
      )}
    </div>
  );
};

export default ProjectLayout;