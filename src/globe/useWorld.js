// src/globe/useWorld.js — loads and builds the country data once, on the client.
import { useEffect, useState } from 'react';
import { assetPath } from '@/utils/assetPath.js';
import { buildCountries, buildLines } from './topo.js';

let worldPromise = null;

/** @returns {Promise<{ countries: (import('./topo.js').Country & { key: string })[], lines: { coords: Float64Array, kind: string }[] }>} */
export function loadWorld() {
  if (!worldPromise) {
    worldPromise = fetch(assetPath('data/countries-50m.json'))
      .then((r) => {
        if (!r.ok) throw new Error(`countries-50m.json: HTTP ${r.status}`);
        return r.json();
      })
      .then((topology) => ({
        // `key` identifies a country everywhere (selection, highlights): its ISO code, or its name if it has none.
        countries: buildCountries(topology).map((c) => ({ ...c, key: c.iso ?? c.name })),
        lines: buildLines(topology),
      }));
    worldPromise.catch(() => { worldPromise = null; }); // allow a retry on the next mount
  }
  return worldPromise;
}

/** The world once it has loaded, else null (the globe still renders, just without countries). */
export function useWorld() {
  const [world, setWorld] = useState(null);
  useEffect(() => {
    let alive = true;
    loadWorld().then((w) => alive && setWorld(w)).catch((e) => console.warn('[globe] could not load country data:', e.message));
    return () => { alive = false; };
  }, []);
  return world;
}
