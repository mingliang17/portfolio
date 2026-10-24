// Tests for project data → section configs (pure; no React). Run with `npm test`.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { normalizeSections, assignIds, findSection, projectTitle, projectCover, BUILT_IN_TYPES, LEGACY_ORDER } from './normalize.js';
import { PROJECT_ATLAS, PROJECT_LUMEN } from '../constants/showcaseProjects.js';
import { TYPE_PATTERNS } from '../sphere/config.js';
import { PATTERN_NAMES } from '../sphere/patterns.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(here, '../../public');

test('legacy object form normalises to the same order the page always used', () => {
  const project = {
    id: 'legacy',
    sections: {
      appear: { enabled: true },
      hero: { enabled: true, title: 'Hi' },
      map: { enabled: false },
      model: { enabled: true },
      carousels: [{ id: 'carousel1', enabled: true, images: [] }, { id: 'carousel2', enabled: false }],
    },
  };
  const out = normalizeSections(project);
  assert.deepEqual(out.map((e) => e.type), ['hero', 'model', 'appear', 'carousel']);
  assert.equal(out[0].title, 'Hi');
  assert.equal(out[3].id, 'carousel1');
  assert.deepEqual(LEGACY_ORDER.slice(0, 2), ['hero', 'map']);
});

test('array form is kept in order, repeats allowed, disabled entries dropped', () => {
  const out = normalizeSections({ sections: [{ type: 'split' }, { type: 'split', id: 'b' }, { type: 'gallery', enabled: false }, null, { type: 'media' }] });
  assert.deepEqual(out.map((e) => e.type), ['split', 'split', 'media']);
});

test('assignIds keeps explicit and legacy ids, and de-duplicates repeats', () => {
  const ids = assignIds([{ type: 'hero' }, { type: 'split' }, { type: 'split' }, { type: 'split', id: 'x' }, { type: 'split', id: 'x' }]).map((e) => e.id);
  assert.deepEqual(ids, ['hero', 'split', 'split-2', 'x', 'x-2']);
});

test('titles, covers and lookups fall back sensibly', () => {
  assert.equal(projectTitle({ id: 'ab', title: 'Named' }), 'Named');
  assert.equal(projectTitle({ id: 'ab', sections: [{ type: 'hero', title: 'From hero' }] }), 'From hero');
  assert.equal(projectTitle({ id: 'ab', sections: {} }), 'Project AB');
  assert.equal(projectCover({ cover: 'c.svg' }), 'c.svg');
  assert.equal(projectCover({ assets: { hero: 'h.jpg' }, sections: {} }), 'h.jpg');
  assert.equal(findSection({ sections: { spin: { enabled: true, a: 1 } } }, 'spin').a, 1);
  assert.equal(findSection({ sections: { spin: { enabled: false } } }, 'spin'), null);
  assert.equal(findSection(null, 'spin'), null);
});

test('every built-in type is implemented in sectionTypes.jsx and has a default sphere pattern', () => {
  const src = fs.readFileSync(path.join(here, 'sectionTypes.jsx'), 'utf8');
  for (const type of BUILT_IN_TYPES) {
    assert.match(src, new RegExp(`^  ${type}: \\(`, 'm'), `sectionTypes.jsx has no "${type}" entry`);
    assert.ok(PATTERN_NAMES.includes(TYPE_PATTERNS[type]), `no sphere pattern for type "${type}"`);
  }
});

// Collect every string in a project that looks like a public asset path.
const assetPaths = (value, out = new Set()) => {
  if (typeof value === 'string' && /^assets\/.+\.(svg|png|jpe?g|webp|mp4|webm)$/i.test(value)) out.add(value);
  else if (typeof value === 'string' && /^assets\/projects\/[a-z]+\/reel$/.test(value)) out.add(`${value}.mp4`).add(`${value}.webm`); // video base name
  else if (Array.isArray(value)) value.forEach((v) => assetPaths(v, out));
  else if (value && typeof value === 'object') Object.values(value).forEach((v) => assetPaths(v, out));
  return out;
};

for (const project of [PROJECT_ATLAS, PROJECT_LUMEN]) {
  test(`showcase "${project.id}": has an id, title, summary and cover`, () => {
    assert.ok(project.id && project.title && project.summary && project.cover);
  });

  test(`showcase "${project.id}": every referenced image/video exists in public/`, () => {
    const paths = [...assetPaths(project)];
    assert.ok(paths.length > 5);
    for (const p of paths) assert.ok(fs.existsSync(path.join(publicDir, p)), `missing public/${p}`);
  });
}

test('atlas (data-driven): known types only, unique ids, and it mixes templates with layout sections', () => {
  const entries = assignIds(normalizeSections(PROJECT_ATLAS));
  for (const e of entries) assert.ok(BUILT_IN_TYPES.includes(e.type), `unknown type ${e.type}`);
  assert.equal(new Set(entries.map((e) => e.id)).size, entries.length);
  const types = new Set(entries.map((e) => e.type));
  for (const t of ['hero', 'carousel', 'split', 'gallery', 'timeline', 'media', 'stats']) assert.ok(types.has(t), `atlas lacks a "${t}" section`);
  assert.ok(entries.filter((e) => e.type === 'split').length >= 2, 'split used twice, in both directions');
  assert.deepEqual(entries.filter((e) => e.type === 'split').map((e) => e.side).sort(), ['left', 'right']);
  assert.ok(entries.some((e) => e.media?.type === 'video'));
});

test('lumen (bespoke): names a page, and carries the copy and assets that page reads', () => {
  assert.equal(PROJECT_LUMEN.page, 'lumen');
  const src = fs.readFileSync(path.join(here, 'customPages.js'), 'utf8');
  assert.match(src, /lumen:\s*Lumen/);
  assert.equal(PROJECT_LUMEN.assets.gallery.length, 6);
  assert.equal(PROJECT_LUMEN.copy.study.length, 3);
});

test('timeline steps in atlas each carry media, and checkpoint count matches steps', () => {
  const tl = normalizeSections(PROJECT_ATLAS).find((e) => e.type === 'timeline');
  assert.ok(tl.steps.length >= 3);
  for (const s of tl.steps) assert.ok(s.media?.src && s.title && s.text);
});
