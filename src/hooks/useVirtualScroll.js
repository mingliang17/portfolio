// src/hooks/useVirtualScroll.js
// Virtual Scroll Engine inspired by Corn Revolution
// Converts physical scroll to animation timeline scrubbing

import { useState, useEffect, useRef, useCallback } from 'react';
import gsap from 'gsap';

export const useVirtualScroll = (sections = [], options = {}) => {
  const {
    dragThreshold = 150, // Distance to drag up for unlock
    scrollSpeed = 1,
    onSectionChange = null,
    enableHash = true
  } = options;

  // State
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [sectionProgress, setSectionProgress] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragProgress, setDragProgress] = useState(0);

  // Refs
  const virtualScrollY = useRef(0);
  const dragStartY = useRef(0);
  const dragCurrentY = useRef(0);
  const isTransitioning = useRef(false);
  const accumulatedDelta = useRef(0);
  const lastUpdateTime = useRef(Date.now());

  // Get current section config
  const currentSection = sections[currentSectionIndex] || {};
  const totalSections = sections.length;

  // Calculate total virtual height
  const totalDuration = sections.reduce((sum, s) => sum + (s.duration || 1000), 0);

  // Convert virtual scroll to section progress
  const updateProgress = useCallback(() => {
    if (!currentSection.duration) return;

    const progress = virtualScrollY.current / currentSection.duration;
    setSectionProgress(Math.max(0, Math.min(1, progress)));

    // Check if we've reached the end
    if (progress >= 1 && !isLocked) {
      setIsLocked(true);
    }
  }, [currentSection.duration, isLocked]);

  // Handle wheel scroll
  const handleWheel = useCallback((e) => {
    if (isTransitioning.current || isDragging) return;

    e.preventDefault();

    const delta = e.deltaY * scrollSpeed;
    const now = Date.now();
    const timeDelta = now - lastUpdateTime.current;

    // Smooth accumulation
    if (timeDelta < 50) {
      accumulatedDelta.current += delta;
    } else {
      accumulatedDelta.current = delta;
    }

    lastUpdateTime.current = now;

    // Apply scroll
    if (!isLocked) {
      virtualScrollY.current = Math.max(0, virtualScrollY.current + accumulatedDelta.current);
      updateProgress();
    }

    accumulatedDelta.current = 0;
  }, [scrollSpeed, isLocked, isDragging, updateProgress]);

  // Handle drag start
  const handleDragStart = useCallback((clientY) => {
    if (!isLocked || isTransitioning.current) return;

    setIsDragging(true);
    dragStartY.current = clientY;
    dragCurrentY.current = clientY;
    setDragProgress(0);
  }, [isLocked]);

  // Handle drag move
  const handleDragMove = useCallback((clientY) => {
    if (!isDragging || !isLocked) return;

    dragCurrentY.current = clientY;
    const deltaY = dragStartY.current - clientY;

    if (deltaY < 0) {
      // Dragging down - ignore
      setDragProgress(0);
      return;
    }

    const progress = Math.min(1, deltaY / dragThreshold);
    setDragProgress(progress);

    // If reached threshold, transition to next section
    if (progress >= 1) {
      transitionToNextSection();
    }
  }, [isDragging, isLocked, dragThreshold]);

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    if (!isDragging) return;

    setIsDragging(false);

    // Snap back if not completed
    if (dragProgress < 1) {
      gsap.to({}, {
        duration: 0.3,
        onUpdate: function() {
          setDragProgress(dragProgress * (1 - this.progress()));
        },
        onComplete: () => setDragProgress(0)
      });
    }
  }, [isDragging, dragProgress]);

  // Transition to next section
  const transitionToNextSection = useCallback(() => {
    if (isTransitioning.current) return;
    if (currentSectionIndex >= totalSections - 1) return;

    isTransitioning.current = true;
    const nextIndex = currentSectionIndex + 1;

    // Fade out current, fade in next
    gsap.to({}, {
      duration: 0.8,
      onUpdate: function() {
        setDragProgress(1 - this.progress());
      },
      onComplete: () => {
        // Switch section
        setCurrentSectionIndex(nextIndex);
        virtualScrollY.current = 0;
        setSectionProgress(0);
        setIsLocked(false);
        setDragProgress(0);
        setIsDragging(false);
        isTransitioning.current = false;

        // Update hash
        if (enableHash && sections[nextIndex]) {
          window.location.hash = sections[nextIndex].hash || `section-${nextIndex}`;
        }

        // Callback
        if (onSectionChange) {
          onSectionChange(nextIndex);
        }
      }
    });
  }, [currentSectionIndex, totalSections, sections, enableHash, onSectionChange]);

  // Go to specific section
  const goToSection = useCallback((index) => {
    if (index === currentSectionIndex || isTransitioning.current) return;
    if (index < 0 || index >= totalSections) return;

    isTransitioning.current = true;

    gsap.to({}, {
      duration: 0.6,
      onComplete: () => {
        setCurrentSectionIndex(index);
        virtualScrollY.current = 0;
        setSectionProgress(0);
        setIsLocked(false);
        setDragProgress(0);
        isTransitioning.current = false;

        // Update hash
        if (enableHash && sections[index]) {
          window.location.hash = sections[index].hash || `section-${index}`;
        }

        if (onSectionChange) {
          onSectionChange(index);
        }
      }
    });
  }, [currentSectionIndex, totalSections, sections, enableHash, onSectionChange]);

  // Handle hash changes
  useEffect(() => {
    if (!enableHash) return;

    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (!hash) return;

      const index = sections.findIndex(s => s.hash === hash);
      if (index !== -1 && index !== currentSectionIndex) {
        goToSection(index);
      }
    };

    // Check initial hash
    handleHashChange();

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [enableHash, sections, currentSectionIndex, goToSection]);

  // Set up event listeners
  useEffect(() => {
    const handleMouseDown = (e) => handleDragStart(e.clientY);
    const handleMouseMove = (e) => handleDragMove(e.clientY);
    const handleMouseUp = () => handleDragEnd();

    const handleTouchStart = (e) => handleDragStart(e.touches[0].clientY);
    const handleTouchMove = (e) => {
      e.preventDefault();
      handleDragMove(e.touches[0].clientY);
    };
    const handleTouchEnd = () => handleDragEnd();

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleWheel, handleDragStart, handleDragMove, handleDragEnd]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isTransitioning.current) return;

      if (e.key === 'ArrowDown' && isLocked && currentSectionIndex < totalSections - 1) {
        transitionToNextSection();
      } else if (e.key === 'ArrowUp' && currentSectionIndex > 0) {
        goToSection(currentSectionIndex - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLocked, currentSectionIndex, totalSections, transitionToNextSection, goToSection]);

  return {
    currentSectionIndex,
    sectionProgress,
    isLocked,
    isDragging,
    dragProgress,
    currentSection,
    totalSections,
    goToSection,
    transitionToNextSection
  };
};

export default useVirtualScroll;