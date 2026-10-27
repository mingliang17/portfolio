// scripts/build-globe-data.mjs
//
// Builds public/data/countries-50m.json, the country borders the home-page globe draws and picks from.
//
// Source: Natural Earth 1:50m admin-0 (public domain), via the `world-atlas` npm package (ISC).
// The output is a TopoJSON file: every shared border is stored once, which keeps it small (~700 KB) and
// lets the globe tell borders (arcs shared by two countries) from coastlines (arcs used by one).
//
// What this script adds to the stock file:
//   - properties: { name, iso }   iso = ISO 3166-1 alpha-2, lower case (matches constants/index.js, flagcdn)
//   - drops the unused `land` object and the numeric ids
//
// It is only needed to REGENERATE the data (the generated file is committed):
//   npm i --no-save world-atlas i18n-iso-countries
//   node scripts/build-globe-data.mjs
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(path.join(process.cwd(), 'package.json'));
const countriesLib = require('i18n-iso-countries');
countriesLib.registerLocale(require('i18n-iso-countries/langs/en.json'));

const outArg = process.argv.indexOf('--out');
const out = outArg > 0 ? process.argv[outArg + 1] : 'public/data/countries-50m.json';
const src = JSON.parse(fs.readFileSync(require.resolve('world-atlas/countries-50m.json'), 'utf8'));

// Natural Earth entries with no ISO numeric code.
const EXTRA_ISO = { Kosovo: 'xk' };

// Names the library gets wrong for a tooltip (ambiguous or too formal).
const NAME_OVERRIDES = {
  cd: 'DR Congo', cg: 'Republic of the Congo', kr: 'South Korea', sy: 'Syria', la: 'Laos', fm: 'Micronesia',
  va: 'Vatican City', fk: 'Falkland Islands', gs: 'South Georgia & S. Sandwich Is.', hm: 'Heard & McDonald Islands',
  io: 'British Indian Ocean Terr.', vc: 'St Vincent & the Grenadines',
};

const geometries = src.objects.countries.geometries.map((g) => {
  const neName = g.properties?.name ?? 'Unknown';
  const alpha2 = g.id != null ? countriesLib.numericToAlpha2(String(g.id).padStart(3, '0')) : null;
  const iso = alpha2 ? alpha2.toLowerCase() : EXTRA_ISO[neName] ?? null;
  // Prefer the common name ("Russia") over the formal one ("Russian Federation"), unless it is just an abbreviation ("UK").
  const official = alpha2 && countriesLib.getName(alpha2, 'en', { select: 'official' });
  const alias = alpha2 && countriesLib.getName(alpha2, 'en', { select: 'alias' });
  const name = NAME_OVERRIDES[iso] ?? ((alias && alias.length > 3 ? alias : official) || neName);
  const geometry = { type: g.type, arcs: g.arcs, properties: { name, iso } };
  return geometry;
});

// Natural Earth lists a few countries twice (Australia has an outlying territory as its own entry). Merge
// entries that share an ISO code, so each country is one selectable shape and one key, and so the edge
// between the two parts is not drawn as a border.
const asMulti = (g) => (g.type === 'Polygon' ? [g.arcs] : g.arcs);
const merged = [];
const byIso = new Map();
for (const g of geometries) {
  const hit = g.properties.iso && byIso.get(g.properties.iso);
  if (hit) {
    hit.arcs = [...asMulti(hit), ...asMulti(g)];
    hit.type = 'MultiPolygon';
    continue;
  }
  const copy = { ...g, arcs: g.arcs };
  merged.push(copy);
  if (copy.properties.iso) byIso.set(copy.properties.iso, copy);
}

const topology = {
  type: 'Topology',
  transform: src.transform,
  arcs: src.arcs,
  objects: { countries: { type: 'GeometryCollection', geometries: merged } },
};

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(topology));
const noIso = merged.filter((g) => !g.properties.iso).map((g) => g.properties.name);
console.log(`wrote ${out}: ${merged.length} countries/territories (${geometries.length - merged.length} merged), ${src.arcs.length} arcs, ${(fs.statSync(out).size / 1024).toFixed(0)} KB`);
console.log(`without an ISO code: ${noIso.join(', ') || 'none'}`);
