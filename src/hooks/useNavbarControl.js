// src/hooks/useNavbarControl.js
// FIXED: Only controls navbar in section 0, then leaves to hover system

import { useEffect, useCallback } from 'react';

/**
 * useNavbarControl - Controls navbar ONLY in section 0
 * After section 0, navbar uses hover-based system
 * 
 * @param {number} currentSection - Current section index
 * @param {string} animationPhase - Current animation phase
 * @param {number} dragProgress - Drag progress (0-1)
 * @param {boolean} enabled - Whether navbar control is enabled
 */
export const useNavbarControl = (
  currentSection, 
  animationPhase, 
  dragProgress = 0,
  enabled = true
) => {
  const hideNavbar = useCallback(() => {
    if (!enabled) return;
    console.log('🔒 Hiding navbar');
    window.dispatchEvent(new CustomEvent('projectMH1-navbar-hide'));
  }, [enabled]);

  const showNavbar = useCallback(() => {
    if (!enabled) return;
    console.log('🔓 Showing navbar');
    window.dispatchEvent(new CustomEvent('projectMH1-navbar-show'));
  }, [enabled]);

  // FIXED: Only control navbar in section 0
  useEffect(() => {
    if (!enabled) return;
    
    // CRITICAL: Only control navbar in section 0
    if (currentSection !== 0) {
      console.log('📍 Not in section 0, releasing navbar control (hover-based now)');
      // Show navbar and release control
      showNavbar();
      return;
    }

    console.log('🎮 Navbar control active (Section 0):', { 
      animationPhase, 
      dragProgress: dragProgress?.toFixed(2) 
    });

    switch (animationPhase) {
      case 'initial':
        // Hide during initial fade-in
        hideNavbar();
        break;
        
      case 'waiting':
        // Show when ready for interaction (unless dragging)
        if (dragProgress === 0) {
          showNavbar();
        } else {
          // Hide when dragging
          hideNavbar();
        }
        break;
        
      case 'unlocking':
      case 'fadeout':
        // Hide during unlock and fadeout
        hideNavbar();
        break;
        
      case 'completed':
        // Keep hidden during transition
        hideNavbar();
        break;
    }
  }, [currentSection, animationPhase, dragProgress, hideNavbar, showNavbar, enabled]);

  // Handle drag progress affecting navbar (only in section 0)
  useEffect(() => {
    if (!enabled || currentSection !== 0 || animationPhase !== 'waiting') return;

    if (dragProgress > 0.1) {
      hideNavbar();
    } else if (dragProgress === 0) {
      showNavbar();
    }
  }, [currentSection, animationPhase, dragProgress, hideNavbar, showNavbar, enabled]);

  return { hideNavbar, showNavbar };
};

export default useNavbarControl;