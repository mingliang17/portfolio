// src/sphere/config.js — which pattern appears where. Edit these tables to re-assign patterns.
//
// Resolution order for the pattern behind a project section:
//   1. the section's own `sphere` field (ProjectPage sections / bespoke pages)  — passed as `override`
//   2. SECTION_PATTERNS, by section id (older pages that don't set `sphere`)
//   3. ROUTE_PATTERNS, by Next.js route
//   4. DEFAULT_PATTERN

import { PATTERN_NAMES } from './patterns.js';

/** Default pattern for each project section TYPE (src/projects/sectionTypes.jsx reads this). */
export const TYPE_PATTERNS = {
  hero: 'radial',
  map: 'hex',
  model: 'geodesic',
  anime: 'latlong',
  spin: 'rhombus',
  explode: 'globe',
  appear: 'scan',
  carousel: 'dust',
  split: 'hex',
  gallery: 'latlong',
  media: 'dust',
  stats: 'globe',
  timeline: 'geodesic',
  custom: 'geodesic',
};

/** Fallback by section id, for pages whose sections do not set `sphere`. */
export const SECTION_PATTERNS = {
  hero: 'radial',
  map: 'hex',
  model: 'geodesic',
  anime: 'latlong',
  spin: 'rhombus',
  explode: 'globe',
  appear: 'scan',
};

/** Carousel sections have free-form ids ('carousel1', ...). */
export const CAROUSEL_PATTERN = 'dust';

/** Next.js route patterns (router.pathname) used when no section is active. */
export const ROUTE_PATTERNS = {
  '/': 'dust', // the home page has a globe of its own: keep what is behind it quiet
  '/home': 'dust',
  '/contact': 'scan',
  '/fotos/[fotoId]': 'dust',
  '/projects': 'hex',
  '/projects/[project_id]': 'geodesic',
};

export const DEFAULT_PATTERN = 'geodesic';

/** Cross-fade time (seconds) when the pattern changes. */
export const FADE_SECONDS = 0.7;

export function resolvePattern(route, sectionId, override) {
  let name = override;
  if (!PATTERN_NAMES.includes(name) && sectionId) {
    name = SECTION_PATTERNS[sectionId] ?? (/^carousel/i.test(sectionId) ? CAROUSEL_PATTERN : undefined);
  }
  if (!PATTERN_NAMES.includes(name)) name = ROUTE_PATTERNS[route] ?? DEFAULT_PATTERN;
  return PATTERN_NAMES.includes(name) ? name : DEFAULT_PATTERN;
}
