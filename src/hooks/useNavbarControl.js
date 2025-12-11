// src/hooks/useNavbarControl.js
// Extracted and fixed navbar control logic

import { useEffect, useCallback } from 'react';

/**
 * useNavbarControl - Manages navbar visibility based on project state
 * 
 * @param {number} currentSection - Current section index
 * @param {string} animationPhase - Current animation phase
 * @param {number} dragProgress - Drag progress (0-1)
 * @returns {object} - Navbar control functions
 */
export const useNavbarControl = (currentSection, animationPhase, dragProgress = 0) => {
  const hideNavbar = useCallback(() => {
    console.log('🔒 Hiding navbar');
    window.dispatchEvent(new CustomEvent('projectMH1-navbar-hide'));
  }, []);

  const showNavbar = useCallback(() => {
    console.log('🔓 Showing navbar');
    window.dispatchEvent(new CustomEvent('projectMH1-navbar-show'));
  }, []);

  // Main navbar visibility control
  useEffect(() => {
    console.log('🎮 Navbar control check:', { 
      currentSection, 
      animationPhase, 
      dragProgress: dragProgress?.toFixed(2) 
    });

    // Section 0 logic
    if (currentSection === 0) {
      switch (animationPhase) {
        case 'initial':
          // Hide navbar during initial fade-in
          hideNavbar();
          break;
          
        case 'waiting':
          // Show navbar when waiting for user interaction
          if (dragProgress === 0) {
            showNavbar();
          }
          break;
          
        case 'unlocking':
        case 'fadeout':
          // Hide navbar during unlock and fadeout animations
          hideNavbar();
          break;
          
        case 'completed':
          // Keep navbar hidden after completion
          hideNavbar();
          break;
          
        default:
          break;
      }
    } 
    // Other sections: navbar controlled by scroll/hover (handled in Navbar.jsx)
    else {
      // Ensure navbar can respond to hover on other sections
      // Don't force hide/show here, let Navbar.jsx handle it
    }
  }, [currentSection, animationPhase, dragProgress, hideNavbar, showNavbar]);

  // Handle drag progress affecting navbar
  useEffect(() => {
    if (currentSection === 0 && animationPhase === 'waiting') {
      if (dragProgress > 0.1) {
        // Start hiding navbar as user drags
        hideNavbar();
      } else if (dragProgress === 0) {
        // Show navbar when drag is released/reset
        showNavbar();
      }
    }
  }, [currentSection, animationPhase, dragProgress, hideNavbar, showNavbar]);

  return { hideNavbar, showNavbar };
};

export default useNavbarControl;