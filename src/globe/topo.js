// src/globe/topo.js
//
// Turns the TopoJSON country file (public/data/countries-50m.json) into the structures the globe
// draws and picks from. Pure: no DOM, no three.js, so it is unit-tested in Node.
//
// Why not a plain GeoJSON → three.js conversion? The source follows the d3 "spherical" convention, which
// is not planar-friendly in three places, all handled here:
//   1. A few polygons cross the antimeridian (Russia's Chukotka, Fiji). Their longitudes jump by ~360°
//      between two neighbouring vertices. We UNWRAP them (add/subtract 360 so the ring is continuous),
//      which leaves some longitudes outside [-180, 180]. Everything downstream accepts that.
//   2. Antarctica's coastline is an open ring that runs from -180° to +180° and encloses the south pole.
//      We CLOSE it through the pole so it is an ordinary planar polygon.
//   3. Antarctica also carries a degenerate "ring" lying along latitude -90°. We DROP it.
//
// Coordinates are [lon, lat] in degrees, stored flat: Float64Array [lon0, lat0, lon1, lat1, …].

const ABS = Math.abs;

/** Decode every arc of a (quantised, delta-encoded) TopoJSON topology into absolute lon/lat. */
export function decodeArcs(topology) {
  const { arcs, transform } = topology;
  const [sx, sy] = transform?.scale ?? [1, 1];
  const [tx, ty] = transform?.translate ?? [0, 0];
  return arcs.map((arc) => {
    const out = new Float64Array(arc.length * 2);
    let x = 0;
    let y = 0;
    for (let i = 0; i < arc.length; i++) {
      if (transform) {
        x += arc[i][0];
        y += arc[i][1];
        out[i * 2] = x * sx + tx;
        out[i * 2 + 1] = y * sy + ty;
      } else {
        out[i * 2] = arc[i][0];
        out[i * 2 + 1] = arc[i][1];
      }
    }
    return out;
  });
}

/** Concatenate arcs (negative ids are reversed) into one flat ring/line. */
export function stitch(decoded, ids) {
  const parts = [];
  let total = 0;
  ids.forEach((id, k) => {
    const rev = id < 0;
    const arc = decoded[rev ? ~id : id];
    const n = arc.length / 2;
    const from = k === 0 ? 0 : 1; // the first point of each later arc repeats the previous arc's last point
    parts.push({ arc, rev, n, from });
    total += n - from;
  });
  const out = new Float64Array(total * 2);
  let o = 0;
  for (const { arc, rev, n, from } of parts) {
    for (let j = from; j < n; j++) {
      const src = rev ? n - 1 - j : j;
      out[o++] = arc[src * 2];
      out[o++] = arc[src * 2 + 1];
    }
  }
  return out;
}

/** Make longitudes continuous: whenever two neighbours differ by more than 180°, shift the rest by ±360°. */
export function unwrap(flat) {
  const out = new Float64Array(flat.length);
  if (!flat.length) return out;
  let off = 0;
  out[0] = flat[0];
  out[1] = flat[1];
  for (let i = 1; i < flat.length / 2; i++) {
    const d = flat[i * 2] - flat[(i - 1) * 2];
    if (d > 180) off -= 360;
    else if (d < -180) off += 360;
    out[i * 2] = flat[i * 2] + off;
    out[i * 2 + 1] = flat[i * 2 + 1];
  }
  return out;
}

const isPoleLine = (flat) => {
  for (let i = 1; i < flat.length; i += 2) if (ABS(flat[i]) < 89.99) return false;
  return flat.length > 0;
};

/**
 * Prepare one ring: unwrap it and, if it winds once around a pole (Antarctica), close it through the pole.
 * Returns null for degenerate rings.
 */
export function prepareRing(flat) {
  if (flat.length < 6 || isPoleLine(flat)) return null;
  let ring = unwrap(flat);
  const n = ring.length / 2;
  const span = ring[(n - 1) * 2] - ring[0];
  if (ABS(span) > 180) {
    let meanLat = 0;
    for (let i = 0; i < n; i++) meanLat += ring[i * 2 + 1];
    const pole = meanLat < 0 ? -90 : 90;
    const closed = new Float64Array(ring.length + 4);
    closed.set(ring);
    closed.set([ring[(n - 1) * 2], pole, ring[0], pole], ring.length);
    ring = closed;
  }
  return ring;
}

const ringBBox = (r) => {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < r.length; i += 2) {
    if (r[i] < minX) minX = r[i];
    if (r[i] > maxX) maxX = r[i];
    if (r[i + 1] < minY) minY = r[i + 1];
    if (r[i + 1] > maxY) maxY = r[i + 1];
  }
  return [minX, minY, maxX, maxY];
};

/** Planar ring area in square degrees, scaled by cos(latitude) so high-latitude shapes are not overweighted. */
const ringArea = (r) => {
  let a = 0;
  const n = r.length / 2;
  for (let i = 0, j = n - 1; i < n; j = i++) a += (r[j * 2] - r[i * 2]) * (r[j * 2 + 1] + r[i * 2 + 1]);
  const midLat = ((ringBBox(r)[1] + ringBBox(r)[3]) / 2) * (Math.PI / 180);
  return ABS(a / 2) * Math.max(0.05, Math.cos(midLat));
};

/**
 * @typedef {Object} Polygon
 * @property {Float64Array[]} rings  rings[0] is the outer ring, the rest are holes
 * @property {number[]} bbox         [minLon, minLat, maxLon, maxLat] of the outer ring (unwrapped)
 * @property {number} area           outer area − holes, latitude-weighted square degrees
 *
 * @typedef {Object} Country
 * @property {number} index
 * @property {string} name
 * @property {string|null} iso       ISO 3166-1 alpha-2, lower case
 * @property {Polygon[]} polygons    largest first
 * @property {number[]} bbox         union of the polygon boxes
 * @property {number} area
 */

/** Build the countries from a topology. `objectName` defaults to "countries". */
export function buildCountries(topology, objectName = 'countries') {
  const decoded = decodeArcs(topology);
  const geometries = topology.objects[objectName].geometries;

  const countries = geometries.map((g, index) => {
    const polyArcs = g.type === 'Polygon' ? [g.arcs] : g.type === 'MultiPolygon' ? g.arcs : [];
    const polygons = [];
    for (const rings of polyArcs) {
      const prepared = rings.map((ids) => prepareRing(stitch(decoded, ids))).filter(Boolean);
      if (!prepared.length) continue;
      const [outer, ...holes] = prepared;
      const area = Math.max(1e-9, ringArea(outer) - holes.reduce((s, h) => s + ringArea(h), 0));
      polygons.push({ rings: prepared, bbox: ringBBox(outer), area });
    }
    polygons.sort((a, b) => b.area - a.area);

    const bbox = polygons.length
      ? polygons.reduce(
          (b, p) => [Math.min(b[0], p.bbox[0]), Math.min(b[1], p.bbox[1]), Math.max(b[2], p.bbox[2]), Math.max(b[3], p.bbox[3])],
          [Infinity, Infinity, -Infinity, -Infinity],
        )
      : [0, 0, 0, 0];
    return {
      index,
      name: g.properties?.name ?? 'Unknown',
      iso: g.properties?.iso ?? null,
      polygons,
      bbox,
      area: polygons.reduce((s, p) => s + p.area, 0),
    };
  });
  return countries;
}

/**
 * Every arc that should be drawn as a line, once: `border` if two or more countries use it, otherwise `coast`.
 * (Arcs lying along a pole are skipped.) Each `coords` is unwrapped, flat lon/lat.
 */
export function buildLines(topology, objectName = 'countries') {
  const decoded = decodeArcs(topology);
  const users = new Map(); // arc index → Set of geometry indices
  topology.objects[objectName].geometries.forEach((g, gi) => {
    const polys = g.type === 'Polygon' ? [g.arcs] : g.type === 'MultiPolygon' ? g.arcs : [];
    for (const rings of polys) for (const ids of rings) for (const id of ids) {
      const a = id < 0 ? ~id : id;
      if (!users.has(a)) users.set(a, new Set());
      users.get(a).add(gi);
    }
  });
  const lines = [];
  users.forEach((set, a) => {
    if (isPoleLine(decoded[a])) return;
    lines.push({ coords: unwrap(decoded[a]), kind: set.size > 1 ? 'border' : 'coast' });
  });
  return lines;
}

// ── Point in polygon ────────────────────────────────────────────────────────────────────────────

/** Ray casting against one flat ring. */
export function pointInRing(ring, x, y) {
  let inside = false;
  const n = ring.length / 2;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = ring[i * 2];
    const yi = ring[i * 2 + 1];
    const xj = ring[j * 2];
    const yj = ring[j * 2 + 1];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** Even-odd across a polygon's rings, so holes (lakes, Lesotho in South Africa) work whatever the winding. */
export function pointInPolygon(polygon, x, y) {
  const [minX, minY, maxX, maxY] = polygon.bbox;
  if (y < minY || y > maxY || x < minX || x > maxX) return false;
  let hits = 0;
  for (const ring of polygon.rings) if (pointInRing(ring, x, y)) hits++;
  return hits % 2 === 1;
}

/** The country containing (lon, lat), or null. Longitudes are tried at ±360° too (unwrapped polygons). */
export function findCountryAt(countries, lon, lat) {
  let best = null;
  for (const c of countries) {
    const [minX, minY, maxX, maxY] = c.bbox;
    if (lat < minY || lat > maxY) continue;
    for (const dx of [0, -360, 360]) {
      const x = lon + dx;
      if (x < minX || x > maxX) continue;
      for (const poly of c.polygons) {
        if (pointInPolygon(poly, x, lat)) {
          if (!best || c.area < best.area) best = c;
          break;
        }
      }
    }
  }
  return best;
}
