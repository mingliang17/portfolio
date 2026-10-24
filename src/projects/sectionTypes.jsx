// src/projects/sectionTypes.jsx
//
// The section-type REGISTRY: every kind of section a project page can use.
//
//   type  →  (config, project) => partial ScrollStage section spec
//
// `config` is the entry from the project's `sections` array (everything except `type` is yours to
// define per type); `project` is the whole project object (for shared `assets` / `metadata`).
// The returned spec says how the section behaves in the scroll timeline:
//   { kind: 'page' | 'long', length, checkpoints, snap, label, render(scene) }
// `buildSections` fills in the rest (id, label, sphere pattern, transition overrides).
//
// To add your own reusable section type, write the component and add one `registerSectionType(...)`
// call (see docs/ProjectPages.md).

import React from 'react';
import { assetPath } from '@/utils/assetPath.js';
import { TYPE_PATTERNS } from '@/sphere/config.js';

import HeroSection from '@/sections/projects/HeroSection.jsx';
import MapSection from '@/sections/projects/MapSection.jsx';
import ModelSection from '@/sections/projects/ModelSection.jsx';
import SpinSection from '@/sections/projects/SpinSection.jsx';
import AnimeSection from '@/sections/projects/AnimeSection.jsx';
import ExplodeSection from '@/sections/projects/ExplodeSection.jsx';
import CarouselSection from '@/sections/projects/CarouselSection.jsx';
import AppearSection from '@/sections/projects/AppearSection.jsx';

import SplitSection from './blocks/SplitSection.jsx';
import GallerySection from './blocks/GallerySection.jsx';
import MediaSection from './blocks/MediaSection.jsx';
import StatsSection from './blocks/StatsSection.jsx';
import TimelineSection from './blocks/TimelineSection.jsx';

// How many screens of scrolling each segment between two checkpoints gets.
const SCREENS_PER_SEGMENT = 1.25;
const lengthFor = (cfg) => cfg.length ?? Math.max(2, ((cfg.checkpoints?.length ?? 2) - 1) * SCREENS_PER_SEGMENT);

/** A `long` section whose length and checkpoint snapping come from its `checkpoints` array. */
const checkpointed = (cfg) => ({
  kind: 'long',
  length: lengthFor(cfg),
  checkpoints: cfg.checkpoints?.length,
  snap: cfg.snap,
});

export const SECTION_TYPES = {
  // ── Template sections that already existed (same behaviour as before) ─────────────────────────

  hero: (cfg, project) => ({
    kind: 'page',
    label: cfg.title ?? 'Intro',
    render: (sc) => (
      <HeroSection
        imagePath={cfg.image ? assetPath(cfg.image) : project?.assets?.hero}
        title={cfg.title}
        subtitle={cfg.subtitle}
        isActive={sc.isActive}
        apertureVideoPath={cfg.apertureVideo ? assetPath(cfg.apertureVideo) : null}
        overlayVideoPath={cfg.overlayVideo ? assetPath(cfg.overlayVideo) : null}
      />
    ),
  }),

  map: (cfg, project) => ({
    kind: 'page',
    label: cfg.title ?? 'Map',
    render: (sc) => (
      <MapSection
        mapImages={cfg.images ?? project?.assets?.map}
        logos={cfg.logos ?? project?.assets?.logos}
        description={cfg.description ?? project?.metadata}
        visible={sc.isNear}
        startAnimation={sc.isActive}
      />
    ),
  }),

  model: (cfg) => ({
    kind: 'page',
    label: cfg.title ?? 'Model',
    render: (sc) => <ModelSection {...cfg} isVisible={sc.isVisible} scrollProgress={sc.progress} />,
  }),

  // `checkpoints` makes the stage gently pull scrolling toward each checkpoint ('proximity');
  // `anime` has none: it is a continuous animation.
  anime: (cfg) => ({
    kind: 'long',
    length: lengthFor(cfg),
    label: cfg.title ?? 'Anime',
    render: (sc) => <AnimeSection {...cfg} isVisible={sc.isVisible} scrollProgress={sc.progress} />,
  }),

  spin: (cfg) => ({
    ...checkpointed(cfg),
    label: cfg.title ?? 'Spin',
    render: (sc) => <SpinSection {...cfg} isVisible={sc.isVisible} scrollProgress={sc.progress} enableDebug={false} />,
  }),

  explode: (cfg) => ({
    ...checkpointed(cfg),
    label: cfg.title ?? 'Explode',
    render: (sc) => <ExplodeSection {...cfg} isVisible={sc.isVisible} scrollProgress={sc.progress} />,
  }),

  appear: (cfg) => ({
    ...checkpointed(cfg),
    label: cfg.title ?? 'Appear',
    render: (sc) => <AppearSection {...cfg} isVisible={sc.isVisible} scrollProgress={sc.progress} />,
  }),

  // `images`: [{ id, image, title, description, information }] — `image` may be public-relative.
  carousel: (cfg) => {
    const items = (cfg.images ?? []).map((item) => ({ ...item, image: assetPath(item.image) }));
    return {
      kind: 'page',
      label: cfg.title ?? 'Gallery',
      render: (sc) => <CarouselSection carouselData={items} title={cfg.title} autoPlay={false} showControls showIndicators isActive={sc.isActive} />,
    };
  },

  // ── Layout sections for individually designed pages ───────────────────────────────────────────

  /** Text beside an image or video. { title, eyebrow, body, facts, media, side: 'left'|'right' } */
  split: (cfg) => ({
    kind: 'page',
    label: cfg.title ?? 'Story',
    render: (sc) => <SplitSection {...cfg} isActive={sc.isActive} isVisible={sc.isVisible} />,
  }),

  /** A grid of images/videos. { title, items: [{ src, alt, caption, type }], layout: 'grid'|'mosaic', columns } */
  gallery: (cfg) => ({
    kind: 'page',
    label: cfg.title ?? 'Gallery',
    render: (sc) => <GallerySection {...cfg} isActive={sc.isActive} isVisible={sc.isVisible} />,
  }),

  /** Full-bleed image or video with a caption. { media, title, caption, align: 'left'|'right'|'center' } */
  media: (cfg) => ({
    kind: 'page',
    label: cfg.title ?? 'Media',
    render: (sc) => <MediaSection {...cfg} isActive={sc.isActive} isVisible={sc.isVisible} />,
  }),

  /** A statement and key figures. { eyebrow, statement, stats: [{ value, label }] } */
  stats: (cfg) => ({
    kind: 'page',
    label: cfg.title ?? cfg.eyebrow ?? 'Numbers',
    render: (sc) => <StatsSection {...cfg} isActive={sc.isActive} />,
  }),

  /** Scroll-driven steps, each with its own media. { title, steps: [{ title, text, media }] } */
  timeline: (cfg) => {
    const n = cfg.steps?.length ?? 0;
    return {
      kind: 'long',
      length: cfg.length ?? Math.max(2, n * 1.1),
      checkpoints: n > 1 ? n : undefined,
      snap: cfg.snap,
      label: cfg.title ?? 'Process',
      render: (sc) => <TimelineSection {...cfg} isVisible={sc.isVisible} scrollProgress={sc.progress} />,
    };
  },

  /**
   * Your own component, inside the same scroll system. It receives the whole `scene`
   * ({ isActive, isVisible, progress, … }) plus `props`.
   *   { type: 'custom', id: 'intro', kind: 'page' | 'long', length: 3, Component: MyComponent, props: { … } }
   * Components cannot live in the JSON-like project data files, so this is for bespoke pages (see Lumen).
   */
  custom: (cfg) => ({
    kind: cfg.kind === 'long' ? 'long' : 'page',
    length: cfg.length,
    checkpoints: cfg.checkpoints,
    snap: cfg.snap,
    label: cfg.label ?? cfg.title ?? cfg.id ?? 'Section',
    render: (sc) => {
      const Component = cfg.Component;
      return Component ? <Component {...cfg.props} scene={sc} isActive={sc.isActive} isVisible={sc.isVisible} progress={sc.progress} /> : null;
    },
  }),
};

/** Add (or replace) a section type at runtime. Same signature as the entries above. */
export function registerSectionType(type, build) {
  if (typeof build !== 'function') throw new TypeError(`registerSectionType("${type}"): second argument must be a function (config, project) => spec`);
  SECTION_TYPES[type] = build;
}

export const sectionTypeNames = () => Object.keys(SECTION_TYPES);

/**
 * One ready-to-use ScrollStage section spec.
 * @param {string} type   a key of SECTION_TYPES
 * @param {object} [cfg]  the section's config (see each type above); `id`, `label`, `sphere`,
 *                        `transition`, `transitionStyle`, `keepMounted` apply to every type
 * @param {object} [project]  the project object, for types that fall back on shared assets
 */
export function section(type, cfg = {}, project = null) {
  const build = SECTION_TYPES[type];
  if (!build) throw new Error(`Unknown section type "${type}". Known types: ${sectionTypeNames().join(', ')}`);
  const spec = build(cfg, project);
  return {
    ...spec,
    id: cfg.id ?? type,
    label: cfg.label ?? spec.label ?? type,
    sphere: cfg.sphere ?? TYPE_PATTERNS[type] ?? TYPE_PATTERNS.custom,
    transition: cfg.transition,
    transitionStyle: cfg.transitionStyle,
    keepMounted: cfg.keepMounted,
  };
}
