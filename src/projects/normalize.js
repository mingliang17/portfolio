// src/projects/normalize.js
//
// Pure helpers (no React, no DOM) that turn a project's data into an ordered list of section configs.
// Unit-tested with `npm test`.
//
// A project's `sections` can be written two ways:
//
//   1. ARRAY (preferred): ordered, any type, repeats allowed, custom ids.
//        sections: [
//          { type: 'hero', title: 'Atlas', image: 'assets/projects/atlas/hero.svg' },
//          { type: 'split', side: 'left', title: '…', media: { type: 'image', src: '…' } },
//          { type: 'carousel', id: 'renders', images: [...] },
//        ]
//   2. OBJECT (legacy, still supported — MH1/MH2 use it): fixed order, one of each.
//        sections: { hero: { enabled: true, … }, map: { enabled: true, … }, carousels: [ … ] }
//
// Both normalise to the array form: `[{ type, id?, …config }]`.

/** Every section type shipped in sectionTypes.jsx (kept here so pure tests can check data against it). */
export const BUILT_IN_TYPES = [
  'hero', 'map', 'model', 'anime', 'spin', 'explode', 'appear', 'carousel',
  'split', 'gallery', 'media', 'stats', 'timeline', 'custom',
];

/** Order of the legacy object form. */
export const LEGACY_ORDER = ['hero', 'map', 'model', 'anime', 'spin', 'explode', 'appear'];

export function normalizeSections(project) {
  const s = project?.sections;
  if (Array.isArray(s)) return s.filter((entry) => entry && entry.enabled !== false);
  if (!s || typeof s !== 'object') return [];

  const out = [];
  for (const type of LEGACY_ORDER) {
    if (s[type]?.enabled) out.push({ ...s[type], type });
  }
  for (const c of s.carousels ?? []) {
    if (c?.enabled) out.push({ ...c, type: 'carousel' });
  }
  return out;
}

/** First section config of a type (e.g. the hero), or null. */
export const findSection = (project, type) => normalizeSections(project).find((e) => e.type === type) ?? null;

/** Display title: explicit `title`, else the hero's, else "Project <ID>". */
export function projectTitle(project) {
  return project?.title ?? findSection(project, 'hero')?.title ?? `Project ${String(project?.id ?? '').toUpperCase()}`;
}

/** Cover image (public-relative path or URL) for index cards. */
export const projectCover = (project) => project?.cover ?? findSection(project, 'hero')?.image ?? project?.assets?.hero ?? null;

/**
 * Give every entry a unique, stable id: its own `id`, else its type, and `-2`, `-3`… for repeats.
 * (Ids are used for #deep-links, the nav dots and `goTo`.)
 */
export function assignIds(entries) {
  const seen = new Map();
  return entries.map((entry) => {
    const base = entry.id ?? entry.type;
    const n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    return { ...entry, id: n === 1 ? base : `${base}-${n}` };
  });
}
