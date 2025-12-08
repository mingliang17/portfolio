// src/components/project/ProjectLayout.jsx
// Reusable layout component for all project pages

import React from 'react';
import { NavigationDots, UnlockOverlay, DragProgressIndicator } from '../common/LayoutComponents.jsx';

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
  return (
    <div className={`mh1-base-container ${className}`}>
      {/* Navigation Dots - Always visible */}
      <NavigationDots
        totalSections={totalSections}
        currentSection={currentSection}
        onSectionChange={onSectionChange}
        disabled={animationPhase !== 'completed'}
      />

      {/* Unlock Animation Overlay - Shows during unlock phase */}
      <UnlockOverlay
        unlockProgress={unlockProgress}
        visible={animationPhase === 'unlocking' && currentSection === 0}
      />

      {/* Drag Progress Indicator - Shows during waiting phase */}
      <DragProgressIndicator
        progress={dragProgress}
        visible={currentSection === 0 && animationPhase === 'waiting' && dragProgress > 0}
      />

      {/* Main Content Container */}
      <div className="mh1-section-container">
        {children}
      </div>
    </div>
  );
};

export default ProjectLayout;