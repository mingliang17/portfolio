// src/utils/sphereStrips.js
//
// Pure geometry helpers for mapping a "strip" of cards onto the surface of a
// sphere. Two strip types are supported:
//   - 'meridian' — a great circle running pole-to-pole at a fixed longitude
//                  offset from the camera-facing direction. Reads as a
//                  "vertical" strip — its cards roll top-to-bottom.
//   - 'parallel' — a small circle running around the sphere at a fixed
//                  latitude offset from the camera-facing direction. Reads
//                  as a "horizontal" strip — its cards roll left-to-right.
//
// Both are parameterised by a single angle `t` (0 → 2π) so a strip can be
// "rotated" simply by adding an offset to `t`.
//
// IMPORTANT: `longitudeDeg` / `latitudeDeg` of 0 puts the strip's t=0 point
// exactly on the camera-facing axis (+Z). That's what makes small offsets
// (e.g. ±10°) land the strip clearly in view — offsetting from +X (a
// naive "longitude 0 = equator" convention) instead would bury a
// small-offset strip near the sphere's limb, barely visible.

import { Vector3, Quaternion } from 'three';

const toRad = (deg) => (deg * Math.PI) / 180;

/**
 * Point + outward normal (LOCAL — relative to a sphere centred at the
 * origin; translate by the strip's own sphere centre yourself) for a
 * meridian (vertical) strip. t=0 sits on the camera-facing axis when
 * longitudeDeg=0; t=π/2 is the north pole; t=π is the far side; t=3π/2 is
 * the south pole — so the strip loops continuously through both poles.
 */
export function meridianPoint(radius, longitudeDeg, t) {
  const lon0 = toRad(longitudeDeg);
  const eqDir = new Vector3(Math.sin(lon0), 0, Math.cos(lon0)); // +Z (camera) at lon0=0
  const poleDir = new Vector3(0, 1, 0);
  const normal = eqDir
    .multiplyScalar(Math.cos(t))
    .add(poleDir.multiplyScalar(Math.sin(t)))
    .normalize();
  return { position: normal.clone().multiplyScalar(radius), normal };
}

/**
 * Point + outward normal (LOCAL, see above) for a parallel (horizontal)
 * strip. t=0 sits on the camera-facing axis when latitudeDeg=0.
 */
export function parallelPoint(radius, latitudeDeg, t) {
  const lat = toRad(latitudeDeg);
  const normal = new Vector3(
    Math.cos(lat) * Math.sin(t),
    Math.sin(lat),
    Math.cos(lat) * Math.cos(t), // +Z (camera) at t=0, lat=0
  ).normalize();
  return { position: normal.clone().multiplyScalar(radius), normal };
}

/** Quaternion that rotates a plane's default +Z face to point along `normal`,
 *  so a card sits tangent to the sphere at its current position. */
export function tangentQuaternion(normal) {
  return new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), normal);
}

/**
 * Opacity for a point on a sphere, driven by its ANGULAR distance from the
 * point that directly faces the camera (0° = dead centre of the visible
 * cap, 180° = the far pole of the sphere).
 *
 * `mappingDegrees` is the full width (out of 360°) of the arc that's
 * considered "mapped" at all — this is the editable value from point 5.
 * 180 = a hemisphere: anything beyond ±90° from the camera-facing centre
 * is unmapped and fully hidden (opacity 0).
 *
 * Inside the mapped arc, opacity fades linearly from 1 at dead-centre down
 * to `minOpacity` at the arc's own edge — the "100% → 50%" radial gradient
 * from point 4.
 *
 * `cameraDir` must already be relative to THIS sphere's own centre (i.e.
 * normalize(camera.position - sphereCentre)) since every strip now lives
 * on its own independent sphere.
 */
export function mappedOpacity(normal, cameraDir, mappingDegrees = 20, minOpacity = 0.5) {
  const facing = Math.max(-1, Math.min(1, normal.dot(cameraDir)));
  const angleFromCenter = Math.acos(facing) * (180 / Math.PI);
  const halfMapped = mappingDegrees / 2;
  if (angleFromCenter >= halfMapped) return 0;
  const t = 1 - angleFromCenter / halfMapped;
  return minOpacity + t * (1 - minOpacity);
}