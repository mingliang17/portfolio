// Tests for the constellation data and their placeholder work. Run with `npm test`.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CONSTELLATIONS, CONSTELLATION_PROJECTS, CONSTELLATION_FOTOS } from '../constants/constellations.js';
import { constellationEntries, getSortedProjects, getSortedFotos, globeProjects } from '../constants/index.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(here, '../../public');

test('every constellation is well formed: unique id and name, enough stars, valid lines, sensible coordinates', () => {
  assert.ok(CONSTELLATIONS.length >= 6);
  assert.equal(new Set(CONSTELLATIONS.map((c) => c.id)).size, CONSTELLATIONS.length);
  assert.equal(new Set(CONSTELLATIONS.map((c) => c.name)).size, CONSTELLATIONS.length);
  for (const c of CONSTELLATIONS) {
    assert.ok(c.stars.length >= 4, `${c.name}: stars`);
    for (const [x, y, mag] of c.stars) {
      assert.ok(Math.abs(x) <= 1.05 && Math.abs(y) <= 1.05, `${c.name}: star at ${x},${y} is outside the local square`);
      assert.ok(mag > 0 && mag <= 1.2);
    }
    assert.ok(c.lines.length >= 2);
    for (const [a, b] of c.lines) {
      assert.ok(Number.isInteger(a) && Number.isInteger(b) && a !== b && a >= 0 && b >= 0 && a < c.stars.length && b < c.stars.length, `${c.name}: line ${a}-${b}`);
    }
    // every star is part of the figure, except at most one faint one (like Crux's fifth star)
    const used = new Set(c.lines.flat());
    const loose = c.stars.map((s, i) => [s, i]).filter(([, i]) => !used.has(i));
    assert.ok(loose.length <= 1 && loose.every(([s]) => s[2] <= 0.5), `${c.name}: loose stars ${JSON.stringify(loose)}`);
  }
});

test('some constellations have work, some do not (so both behaviours can be tested)', () => {
  const withWork = constellationEntries.filter((c) => c.projects.length + c.fotos.length > 0);
  const without = constellationEntries.filter((c) => c.projects.length + c.fotos.length === 0);
  assert.ok(withWork.length >= 3, `${withWork.length} with work`);
  assert.ok(without.length >= 3, `${without.length} without`);
  assert.ok(withWork.some((c) => c.projects.length > 0 && c.fotos.length > 0), 'one has both');
  assert.ok(withWork.some((c) => c.projects.length === 0), 'one has only snaps');
  assert.ok(withWork.some((c) => c.fotos.length === 0), 'one has only projects');
  assert.deepEqual([...new Set(constellationEntries.map((c) => c.key))].length, constellationEntries.length);
  assert.ok(constellationEntries.every((c) => c.key.startsWith('const:') && c.country === c.name));
});

test('placeholder work belongs to a real constellation, has unique ids, a link, and an image that exists', () => {
  const names = new Set(CONSTELLATIONS.map((c) => c.name));
  const all = [...CONSTELLATION_PROJECTS, ...CONSTELLATION_FOTOS];
  assert.equal(new Set(all.map((i) => i.id)).size, all.length, 'unique ids');
  for (const item of all) {
    assert.ok(names.has(item.country), `${item.id}: unknown constellation "${item.country}"`);
    assert.ok(item.title && item.link && item.heroImage);
    const file = item.heroImage.replace(/^.*?(assets\/constellations\/[^/]+\.svg)$/, '$1');
    assert.ok(fs.existsSync(path.join(publicDir, file)), `missing public/${file}`);
  }
  for (const f of CONSTELLATION_FOTOS) assert.equal(f.link, `/fotos/${f.id}`, 'snaps open their own page');
  for (const p of CONSTELLATION_PROJECTS) assert.ok(['/projects/atlas', '/projects/lumen'].includes(p.link), 'projects open a real project page');
});

test('selecting a constellation puts its own work first (the rest follows, to be greyed out)', () => {
  const orionP = getSortedProjects('Orion');
  const orionF = getSortedFotos('Orion');
  assert.deepEqual(orionP.slice(0, 2).map((p) => p.country), ['Orion', 'Orion']);
  assert.deepEqual(orionF.slice(0, 3).map((p) => p.country), ['Orion', 'Orion', 'Orion']);
  assert.ok(orionP.some((p) => p.country !== 'Orion'), 'other places are still in the list');
  assert.ok(orionP.length > 2 && orionF.length > 3);
  // a constellation name never collides with a country that has work
  const countryNames = new Set(globeProjects.map((c) => c.country));
  for (const c of CONSTELLATIONS) assert.ok(!countryNames.has(c.name), c.name);
});
