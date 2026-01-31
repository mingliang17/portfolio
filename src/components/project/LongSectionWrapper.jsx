// src/components/project/LongSectionWrapper.jsx
// Wrapper for long sections to preserve sticky behavior

import React from 'react';

/**
 * LongSectionWrapper - Preserves sticky positioning for child elements
 * Used for sections like AnimeSection and SpinSection that need sticky viewports
 */
const LongSectionWrapper = ({ 
  children, 
  className = '',
  sectionId = '',
  style = {} 
}) => {
  return (
    <div 
      className={`long-section-wrapper ${className}`}
      data-section-id={sectionId}
      style={{
        position: 'relative',
        width: '100%',
        height: 'auto',
        minHeight: '100vh',
        overflow: 'visible', // CRITICAL for sticky children
        ...style
      }}
    >
      {children}
    </div>
  );
};

export default LongSectionWrapper;