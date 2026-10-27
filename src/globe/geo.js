// src/globe/geo.js
//
// Pure sphere geometry for the globe (no DOM, no scene): lon/lat ↔ 3D, which way to turn the globe to face a
// country, how far to put the camera to frame it, and densified lines. Unit-tested in Node.
//
// Conventions (identical to three.js's SphereGeometry, so a texture or a hit point lines up with them):
//   lon  -180…180, east positive      lat  -90…90, north positive
//   lon 0, lat 0 is +X;  lon -90 is +Z (the default camera side);  lon +90 is -Z;  north is +Y.

export const DEG = Math.PI / 180;
export const RAD = 180 / Math.PI;

/** Unit direction for lon/lat degrees, scaled by `r`. */
export function lonLatToDir(lon, lat, r = 1) {
  const phi = (90 - lat) * DEG;
  const theta = (lon + 180) * DEG;
  const s = Math.sin(phi);
  return [-s * Math.cos(theta) * r, Math.cos(phi) * r, s * Math.sin(theta) * r];
}

/** Inverse of lonLatToDir (any length). Longitude is returned in (-180, 180]. */
export function dirToLonLat(x, y, z) {
  const len = Math.hypot(x, y, z) || 1;
  const lat = 90 - Math.acos(Math.max(-1, Math.min(1, y / len))) * RAD;
  let lon = Math.atan2(z, -x) * RAD - 180;
  if (lon <= -180) lon += 360;
  return { lon, lat };
}

/** Wrap a longitude into (-180, 180]. */
export function wrapLon(lon) {
  const l = ((((lon + 180) % 360) + 360) % 360) - 180;
  return l === -180 ? 180 : l;
}

/** Angle in radians between two lon/lat points. */
export function angularDistance(lon1, lat1, lon2, lat2) {
  const a = lonLatToDir(lon1, lat1);
  const b = lonLatToDir(lon2, lat2);
  return Math.acos(Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2])));
}

/**
 * The rotation that brings (lon, lat) to the centre of the screen (the +Z axis, towards the camera).
 * Use it as `group.rotation.set(pitch, yaw, 0)`: Euler order XYZ is Rx(pitch)·Ry(yaw), i.e. turn about the
 * globe's own vertical axis, then tilt about the screen's horizontal axis, so north always stays up.
 * `currentYaw` (optional) picks the equivalent yaw nearest to it so the globe never spins the long way round.
 */
export function viewFor(lon, lat, currentYaw = null) {
  const [dx, dy, dz] = lonLatToDir(lon, lat);
  let yaw = Math.atan2(-dx, dz);
  if (currentYaw != null) {
    const TAU = Math.PI * 2;
    yaw += Math.round((currentYaw - yaw) / TAU) * TAU;
  }
  return { yaw, pitch: Math.atan2(dy, Math.hypot(dx, dz)) };
}

// ── Framing a country ───────────────────────────────────────────────────────────────────────────

/**
 * Where to look and how big a country is: the centre and the angular radius (radians) of the cap that holds
 * its main land. Far-flung pieces (Alaska, Hawaii, overseas territories) are ignored.
 * @param {import('./topo.js').Country} country
 */
export function focusOf(country) {
  const main = country.polygons[0];
  if (!main) return { lon: 0, lat: 0, radius: 0.05 };
  const boxCentre = (p) => [(p.bbox[0] + p.bbox[2]) / 2, (p.bbox[1] + p.bbox[3]) / 2];
  const [mx, my] = boxCentre(main);

  // The body of the country: the main polygon and anything centred within 30° of it.
  const body = country.polygons.filter((p) => {
    if (p === main) return true;
    const [cx, cy] = boxCentre(p);
    return angularDistance(cx, cy, mx, my) < 30 * DEG;
  });

  // Centre = mean direction of the outline vertices, weighted per polygon so a long, detailed coastline
  // does not drag the centre towards itself.
  let sx = 0;
  let sy = 0;
  let sz = 0;
  for (const p of body) {
    const ring = p.rings[0];
    const n = ring.length / 2;
    const w = p.area / n;
    for (let i = 0; i < n; i++) {
      const [x, y, z] = lonLatToDir(ring[i * 2], ring[i * 2 + 1]);
      sx += x * w;
      sy += y * w;
      sz += z * w;
    }
  }
  const centre = Math.hypot(sx, sy, sz) > 1e-9 ? dirToLonLat(sx, sy, sz) : { lon: mx, lat: my };

  let radius = 0;
  for (const p of body) {
    const ring = p.rings[0];
    for (let i = 0; i < ring.length; i += 2) radius = Math.max(radius, angularDistance(centre.lon, centre.lat, ring[i], ring[i + 1]));
  }
  return { lon: wrapLon(centre.lon), lat: centre.lat, radius: Math.max(radius, 0.01) };
}

/**
 * Camera distance at which a cap of angular radius `rho` around the screen centre reaches `targetNdc` of the
 * half-height of the screen (perspective camera on the axis, sphere of `globeRadius`):
 *   ndc = R·sin ρ / ((d − R·cos ρ)·tan(fov/2))   ⇒   d = R·cos ρ + R·sin ρ / (ndc·tan(fov/2))
 */
export function distanceForRadius(rho, { globeRadius, fovDeg, targetNdc, min = 0, max = Infinity }) {
  const tanH = Math.tan((fovDeg * DEG) / 2);
  const d = globeRadius * Math.cos(rho) + (globeRadius * Math.sin(rho)) / (targetNdc * tanH);
  return Math.min(max, Math.max(min, d));
}

/** Camera distance at which the whole sphere's silhouette reaches `ndcRadius` of the half-height of the screen. */
export function fitDistance({ globeRadius, fovDeg, ndcRadius }) {
  const tanH = Math.tan((fovDeg * DEG) / 2);
  const k = globeRadius / (ndcRadius * tanH);
  return Math.sqrt(globeRadius * globeRadius + k * k);
}

// ── Lines ───────────────────────────────────────────────────────────────────────────────────────

/**
 * Append a lon/lat polyline to `out` as LineSegments positions on a sphere: pairs of xyz points, split so no
 * segment is longer than `stepDeg` (a long chord would cut through the sphere and disappear into it).
 * @param {ArrayLike<number>} coords  flat lon/lat, unwrapped
 * @param {number[]} out              receives x0,y0,z0, x1,y1,z1 per segment
 */
export function lineToSegments(coords, radius, stepDeg, out) {
  const n = coords.length / 2;
  for (let i = 1; i < n; i++) {
    const x0 = coords[(i - 1) * 2];
    const y0 = coords[(i - 1) * 2 + 1];
    const x1 = coords[i * 2];
    const y1 = coords[i * 2 + 1];
    const parts = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) / stepDeg));
    let [px, py, pz] = lonLatToDir(x0, y0, radius);
    for (let k = 1; k <= parts; k++) {
      const t = k / parts;
      const [qx, qy, qz] = lonLatToDir(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, radius);
      out.push(px, py, pz, qx, qy, qz);
      px = qx;
      py = qy;
      pz = qz;
    }
  }
  return out;
}
