// src/pages/templates/ProjectPage.jsx
//
// A project is an ordered list of sections. Each is either:
//   kind: 'page' — one resting screen (hero, map, carousel, ...)
//   kind: 'long' — scrolled through continuously; receives `progress` 0..1
// <ScrollStage> turns that list into one coherent scroll experience.
// To add a section: write a component, add one entry below. Nothing else.
//
// Debug: append ?scrolldebug to the URL for a live HUD.

import React, { useMemo } from 'react';
import { getProjectById } from '@/constants/projectsData.js';
import { ScrollStage, SectionNav } from '@/scroll/index.js';

import HeroSection from '@/sections/projects/HeroSection.jsx';
import MapSection from '@/sections/projects/MapSection.jsx';
import ModelSection from '@/sections/projects/ModelSection.jsx';
import SpinSection from '@/sections/projects/SpinSection.jsx';
import AnimeSection from '@/sections/projects/AnimeSection.jsx';
import ExplodeSection from '@/sections/projects/ExplodeSection.jsx';
import CarouselSection from '@/sections/projects/CarouselSection.jsx';
import AppearSection from '@/sections/projects/AppearSection.jsx';

// How many screens of scrolling each segment between two checkpoints gets.
const SCREENS_PER_SEGMENT = 1.25;
const lengthFor = (config) =>
  config.length ?? Math.max(2, ((config.checkpoints?.length ?? 2) - 1) * SCREENS_PER_SEGMENT);

/**
 * Turn project data into ScrollStage sections.
 * `sc` (passed to each render) = { isActive, isNear, isVisible, progress, progressRef }
 */
function buildSections(project) {
  const { sections: s, assets: a, metadata } = project;
  const out = [];

  if (s.hero?.enabled) {
    out.push({
      id: 'hero', label: s.hero.title ?? 'Intro', kind: 'page',
      render: (sc) => <HeroSection imagePath={a.hero} title={s.hero.title} subtitle={s.hero.subtitle} isActive={sc.isActive} />,
    });
  }

  if (s.map?.enabled) {
    out.push({
      id: 'map', label: s.map.title ?? 'Map', kind: 'page',
      render: (sc) => (
        <MapSection mapImages={a.map} logos={a.logos} description={metadata} visible={sc.isNear} startAnimation={sc.isActive} />
      ),
    });
  }

  if (s.model?.enabled) {
    out.push({
      id: 'model', label: s.model.title ?? 'Model', kind: 'page',
      render: (sc) => <ModelSection {...s.model} isVisible={sc.isVisible} scrollProgress={sc.progress} />,
    });
  }

  // Long sections. `checkpoints` makes the stage gently pull scrolling toward each
  // checkpoint ('proximity'); omit it for continuous animations like `anime`.
  if (s.anime?.enabled) {
    out.push({
      id: 'anime', label: s.anime.title ?? 'Anime', kind: 'long', length: lengthFor(s.anime),
      render: (sc) => <AnimeSection {...s.anime} isVisible={sc.isVisible} scrollProgress={sc.progress} />,
    });
  }

  if (s.spin?.enabled) {
    out.push({
      id: 'spin', label: s.spin.title ?? 'Spin', kind: 'long', length: lengthFor(s.spin),
      checkpoints: s.spin.checkpoints?.length, snap: s.spin.snap,
      render: (sc) => <SpinSection {...s.spin} isVisible={sc.isVisible} scrollProgress={sc.progress} enableDebug={false} />,
    });
  }

  if (s.explode?.enabled) {
    out.push({
      id: 'explode', label: s.explode.title ?? 'Explode', kind: 'long', length: lengthFor(s.explode),
      checkpoints: s.explode.checkpoints?.length, snap: s.explode.snap,
      render: (sc) => <ExplodeSection {...s.explode} isVisible={sc.isVisible} scrollProgress={sc.progress} />,
    });
  }

  if (s.appear?.enabled) {
    out.push({
      id: 'appear', label: s.appear.title ?? 'Appear', kind: 'long', length: lengthFor(s.appear),
      checkpoints: s.appear.checkpoints?.length, snap: s.appear.snap,
      render: (sc) => <AppearSection {...s.appear} isVisible={sc.isVisible} scrollProgress={sc.progress} />,
    });
  }

  s.carousels?.forEach((c) => {
    if (!c.enabled) return;
    out.push({
      id: c.id, label: c.title ?? c.id, kind: 'page',
      render: (sc) => (
        <CarouselSection carouselData={c.images} title={c.title} autoPlay={false} showControls showIndicators isActive={sc.isActive} />
      ),
    });
  });

  return out;
}

const ProjectPage = ({ projectId }) => {
  const project = getProjectById(projectId);
  const sections = useMemo(() => (project ? buildSections(project) : []), [project]);
  const debug = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('scrolldebug');

  if (!project) return <div className="project-error"><h1>Project not found</h1></div>;

  return (
    <ScrollStage key={project.id} sections={sections} syncHash debug={debug}>
      <SectionNav />
    </ScrollStage>
  );
};

export default ProjectPage;
