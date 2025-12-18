// src/hooks/index.js
// FULLY FIXED VERSION - Proper state management and dependencies
/**
 * useProjectNavigation - Manages section navigation
 * Handles scroll, drag, and keyboard navigation between sections
 * 
 * @param {number} totalSections - Total number of sections
 * @param {string} animationPhase - Current animation phase
 * @param {function} onGoBack - Callback for backward navigation
 * @param {number} currentSection - Current section index
 * @param {function} setCurrentSection - Section state setter
 * @param {boolean} startMapAnimation - Map animation state
 * @param {function} setStartMapAnimation - Map animation state setter * 
 * @param {React.RefObject} navRef - Reference to navbar element
 * @param {number} updateDelay - Delay before calculating (default: 100ms)
 */

// ===================================
export { useProjectAnimation } from './useProjectAnimation.js';
export { useProjectNavigation } from './useProjectNavigation.js';
export { useNavbarHeight } from './useNavbarHeight.js';

// Default export for convenience