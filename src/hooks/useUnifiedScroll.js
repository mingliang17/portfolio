// src/hooks/useUnifiedScroll.js
//
// Rebuilt on top of GSAP's ScrollTrigger instead of hand-rolled wheel/inertia
// math. Each section is pinned in real document flow and given real scroll
// height (long/checkpoint sections get extra height so the user actually
// scrolls through their internal progress). A single top-level ScrollTrigger
// snaps to each section's start position, replacing the old manual
// threshold/accumulator logic. This means real trackpad, touch, and
// keyboard scrolling all work for free — no custom key handler needed.
//
// Public API is kept the same shape as before so ProjectPage.jsx barely
// has to change, EXCEPT `internalScrollProgress` is now an array (one 0-1
// value per section) instead of a single number, since with real pinning
// multiple sections can technically be mid-transition. See Step 3.2.

import { useEffect, useRef, useState, useCallback, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

export const useUnifiedScroll = (sections = [], options = {}) => {
  const {
    transitionDuration = 0.6,
    enableDebug = false,
  } = options;

  const containerRef = useRef(null);
  const sectionRefs = useRef([]);
  const triggersRef = useRef([]);

  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState(null);
  const [sectionProgress, setSectionProgress] = useState(() => sections.map(() => 0));

  const totalSections = sections.length;
  const currentSection = sections[currentSectionIndex] || {};

  // How many "screens" of extra scroll distance a section needs.
  // Long/checkpoint sections (AnimeSection, SpinSection, ExplodeSection,
  // AppearSection) get one screen per checkpoint so scrolling through them
  // feels proportional to their content; everything else is a single screen.
  const getScreens = useCallback((section) => {
    const checkpoints = section?.config?.checkpoints?.length ?? section?.checkpoints?.length;
    if (checkpoints && checkpoints > 1) return checkpoints;
    return section?.type === 'long' ? 3 : 1;
  }, []);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const sectionEls = sectionRefs.current.filter(Boolean);
    if (!container || sectionEls.length === 0) return;

    const ctx = gsap.context(() => {
      // Give each section real scrollable height via a CSS custom property
      // (see .unified-section in unifiedScroll.css) instead of display:none
      // swapping — the browser now does the actual scrolling.
      sectionEls.forEach((el, i) => {
        el.style.setProperty('--section-screens', getScreens(sections[i]));
      });

      // One ScrollTrigger per section: pins it while the user scrolls
      // through its own height, and reports local progress (0-1) which
      // drives internal checkpoint animations (see SectionRenderer).
      triggersRef.current = sectionEls.map((el, i) =>
        ScrollTrigger.create({
          id: `section-${i}`,
          trigger: el,
          start: 'top top',
          end: 'bottom top',
          pin: true,
          pinSpacing: true,
          scrub: true,
          onUpdate: (self) => {
            setSectionProgress((prev) => {
              if (prev[i] === self.progress) return prev;
              const next = prev.slice();
              next[i] = self.progress;
              return next;
            });
          },
          onToggle: (self) => {
            if (!self.isActive) return;
            setIsTransitioning(true);
            setTransitionDirection(self.direction === 1 ? 'down' : 'up');
            setCurrentSectionIndex(i);
            if (enableDebug) console.log('🚀 Section active:', i, sections[i]?.id);
            clearTimeout(el._transitionTimeout);
            el._transitionTimeout = setTimeout(() => setIsTransitioning(false), transitionDuration * 1000);
          },
        })
      );

      // Snap to each section's start position once layout has settled.
      // Computed from real offsets, so it works even though "long" sections
      // are taller than "normal" ones.
      requestAnimationFrame(() => {
        ScrollTrigger.refresh();
        const scrollEnd = ScrollTrigger.maxScroll(window);
        if (scrollEnd <= 0) return;

        const snapPoints = sectionEls.map((el) => Math.min(el.offsetTop / scrollEnd, 1));

        ScrollTrigger.create({
          id: 'unified-scroll-snap',
          trigger: container,
          start: 'top top',
          end: 'bottom bottom',
          snap: {
            snapTo: snapPoints,
            duration: { min: 0.2, max: transitionDuration },
            ease: 'power2.inOut',
          },
        });
      });
    }, containerRef);

    return () => {
      ctx.revert();
      triggersRef.current = [];
    };
  }, [sections, transitionDuration, enableDebug, getScreens]);

  const goToSection = useCallback((index) => {
    const el = sectionRefs.current[index];
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY;
    gsap.to(window, { duration: transitionDuration, scrollTo: y, ease: 'power2.inOut' });
  }, [transitionDuration]);

  return {
    containerRef,
    sectionRefs,
    currentSectionIndex,
    isTransitioning,
    transitionDirection,
    // Array of per-section 0-1 progress values, replacing the old single
    // `internalScrollProgress` number. sectionProgress[currentSectionIndex]
    // is the equivalent of the old value for the active section.
    sectionProgress,
    goToSection,
    currentSection,
    totalSections,
  };
};

export default useUnifiedScroll;