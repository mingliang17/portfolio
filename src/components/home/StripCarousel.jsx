// src/components/home/StripCarousel.jsx
//
// 4 independent polaroid strips, each mapped onto its OWN small QUARTER-
// sphere (not a full sphere, not a hemisphere):
//
//   - 2 "vertical"   strips (meridian arcs) — cards roll top-to-bottom.
//   - 2 "horizontal" strips (parallel arcs) — cards roll left-to-right.
//
// ── PINWHEEL GRID CENTRES (point 6) ─────────────────────────────────────────
// Each strip's little sphere is centred on the shared 5×5 grid (1–25, row 1
// = top, col 1 = left, centre = row 3/col 3 = item 13) — see GRID_CELL /
// gridToWorld below — so the 4 strips sit in a pinwheel around the shared
// origin instead of straight up/down/left/right:
//
//                 [H1 — between 8 & 9]
//   [V1 — between 7 & 12]      [V2 — between 14 & 19]
//                 [H2 — between 17 & 18]
//
// ── QUARTER SPHERE, NOT A LOOP (points 2 & 4) ───────────────────────────────
// Every strip has a fixed START and END — it does NOT loop or auto-spin.
// t=0 is the end nearer the shared centre: the card there sits perfectly
// FLAT (identity tangent rotation, dead facing the camera). t=QUARTER_RAD
// (90°) is the far end: the card there is tangent to the sphere a full
// quarter-turn away, so it reads as fully curved/foreshortened. Cards in
// between interpolate smoothly from flat → curved.
//
// ── HOVER TO SCROLL (point 1) ───────────────────────────────────────────────
// There's no more click-and-drag. Each strip watches the mouse's position
// every frame (via the R3F raycaster, intersected with the world z=0 plane).
// Hovering anywhere near a strip's little sphere shifts a smoothly-eased
// "scroll window" that decides which items currently occupy the strip's
// fixed set of slots — like scrubbing a filmstrip. Scrolling is clamped at
// both ends (no wraparound — matches the fixed start/end from point 4).
//
// ── CLOTHESLINE (point 5) ───────────────────────────────────────────────────
// Each strip also renders a thin line threaded through every currently-
// visible card's pin, gently sagging between consecutive pins with a small
// deterministic (seeded, so it never flickers) random wobble — like a real
// clothesline the polaroids are pegged to.

import React, { useRef, useMemo, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html, useTexture } from '@react-three/drei';
import { Vector3, CatmullRomCurve3 } from 'three';
import { meridianPoint, parallelPoint, tangentQuaternion } from '../../utils/sphereStrips.js';

// ── Tunable constants ──────────────────────────────────────────────────────
const SPHERE_RADIUS  = 1.15;  // radius of each strip's own little quarter-sphere
const GRID_CELL       = 1.4;   // world-space size of one cell of the shared 5×5 grid
const QUARTER_DEG     = 90;    // ← EDIT ME: the strip is mapped across a quarter of a sphere
const QUARTER_RAD     = (QUARTER_DEG * Math.PI) / 180;
const ANGLE_STEP_DEG  = 12;    // ← EDIT ME: degrees between adjacent cards (smaller = closer together)
const ANGLE_STEP_RAD  = (ANGLE_STEP_DEG * Math.PI) / 180;
const MIN_OPACITY     = 0.45;  // opacity floor at the far/curved end of the arc
const HOVER_RADIUS    = GRID_CELL * 0.75; // how close the mouse must get to "hover near" a strip
const SCROLL_EASE     = 0.12;  // 0–1 — higher = snappier scroll easing

const IMG_SIZE   = 0.20;
const BORDER     = 0.02;
const CAPTION_H  = 0.06;
const BACKING_W  = IMG_SIZE + BORDER * 2;
const BACKING_H  = IMG_SIZE + BORDER + CAPTION_H;
const IMAGE_Y    = (CAPTION_H - BORDER) / 2;
const PIN_Y      = BACKING_H / 2 - BORDER / 2;

const clamp01 = (v) => Math.max(0, Math.min(1, v));

// Deterministic pseudo-random in [-1, 1] from a string seed — used for the
// clothesline's "marginally random" wobble so it stays stable frame-to-frame
// instead of jittering.
const seededRand = (seed) => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  const x = Math.sin(h) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1;
};

// Convert a (row, col) position on the shared 1–25 grid (row 1 = top,
// col 1 = left, grid centre = row 3 / col 3 = item 13) into a world-space
// offset from the shared origin. Half-steps (e.g. row 3.5) land exactly
// between two grid cells, e.g. gridToWorld(2, 3.5) = "between 8 and 9".
const gridToWorld = (row, col) => new Vector3(
  (col - 3) * GRID_CELL,
  (3 - row) * GRID_CELL, // row grows downward on the grid; +Y is "up" in world space
  0,
);

// 2 meridians (vertical) + 2 parallels (horizontal), each on its own little
// quarter-sphere, centred on the shared 5×5 grid in a pinwheel arrangement.
// `poleSign` picks which of the two possible sweep directions (north/south
// for meridians, east/west for parallels) the arc curls toward — chosen so
// each strip's curved far end continues the pinwheel outward, away from the
// shared centre (see the header comment for the layout).
const STRIP_DEFS = [
  // was dead-centre above the origin — now between grid cells 8 & 9
  { id: 'H1', label: '8\u21949',   type: 'parallel', center: gridToWorld(2,   3.5), poleSign:  1 },
  // was dead-centre left of the origin — now between grid cells 7 & 12
  { id: 'V1', label: '7\u219412',  type: 'meridian', center: gridToWorld(2.5, 2),   poleSign:  1 },
  // was dead-centre below the origin — now between grid cells 17 & 18
  { id: 'H2', label: '17\u219418', type: 'parallel', center: gridToWorld(4,   2.5), poleSign: -1 },
  // was dead-centre right of the origin — now between grid cells 14 & 19
  { id: 'V2', label: '14\u219419', type: 'meridian', center: gridToWorld(3.5, 4),   poleSign: -1 },
];

// ── One polaroid card: cream backing + photo + pin, tangent to its strip's
//    quarter-sphere. Position/rotation/opacity/visibility are all driven by
//    `scrollRef` (shared, eased scroll-window position owned by the parent
//    Strip) so every card in a strip reads from one continuously-updated
//    value instead of each managing its own drag state.
const StripCard = ({ item, index, def, scrollRef, pinPositionsRef, isSelected, isSameCountry, onSelect }) => {
  const groupRef   = useRef();
  const backingRef = useRef();
  const imageRef   = useRef();
  const pinRef     = useRef();
  const [hovered, setHovered] = useState(false);

  const texture = useTexture(item.heroImage);

  useFrame(() => {
    if (!groupRef.current) return;

    // Continuous (fractional) slot position — as scrollRef eases, cards
    // glide smoothly along the arc rather than snapping between slots.
    const localSlot = index - scrollRef.current;
    const t = localSlot * ANGLE_STEP_RAD;

    // Fixed start (t=0) and end (t=QUARTER_RAD) — no looping. Anything
    // outside that window is simply hidden rather than wrapped around.
    if (t < -0.001 || t > QUARTER_RAD + 0.001) {
      groupRef.current.visible = false;
      if (pinPositionsRef.current) pinPositionsRef.current[index] = null;
      return;
    }

    const effectiveT = t * def.poleSign;
    const { position, normal } = def.type === 'meridian'
      ? meridianPoint(SPHERE_RADIUS, 0, effectiveT)
      : parallelPoint(SPHERE_RADIUS, 0, effectiveT);
    const worldPos = position.add(def.center);

    groupRef.current.visible = true;
    groupRef.current.position.copy(worldPos);
    // At t=0 `normal` is exactly (0,0,1), so this is the identity rotation —
    // literally flat. As t grows toward QUARTER_RAD the card tilts up to a
    // full quarter-turn, reading as increasingly curved.
    groupRef.current.quaternion.copy(tangentQuaternion(normal));

    // Flat (t=0) → fully opaque. Curved far end (t=QUARTER_RAD) → floor opacity.
    const opacity = 1 - (t / QUARTER_RAD) * (1 - MIN_OPACITY);
    if (backingRef.current) backingRef.current.opacity = opacity;
    if (imageRef.current)   imageRef.current.opacity   = opacity;
    if (pinRef.current)     pinRef.current.opacity      = opacity;

    // Publish this card's current pin position (world-space) so the strip's
    // clothesline can thread through it.
    if (pinPositionsRef.current) {
      const pinWorld = new Vector3(0, PIN_Y, 0.008)
        .applyQuaternion(groupRef.current.quaternion)
        .add(groupRef.current.position);
      pinPositionsRef.current[index] = pinWorld;
    }
  });

  const tint = isSelected ? '#bcd8ff' : isSameCountry ? '#c8f5d9' : '#ffffff';

  return (
    <group
      ref={groupRef}
      scale={hovered ? 1.22 : 1}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
      onPointerOut={(e)  => { e.stopPropagation(); setHovered(false); }}
      onClick={(e) => { e.stopPropagation(); onSelect?.(item); }}
    >
      {/* cream backing — the polaroid "frame" */}
      <mesh position={[0, 0, 0]}>
        <planeGeometry args={[BACKING_W, BACKING_H]} />
        <meshBasicMaterial ref={backingRef} color="#f5f0e8" transparent opacity={0} toneMapped={false} />
      </mesh>

      {/* photo, sitting slightly proud of the backing so it doesn't z-fight */}
      <mesh position={[0, IMAGE_Y, 0.004]}>
        <planeGeometry args={[IMG_SIZE, IMG_SIZE]} />
        <meshBasicMaterial ref={imageRef} map={texture} color={tint} transparent opacity={0} toneMapped={false} />
      </mesh>

      {/* pin dot — the clothesline threads through this exact point */}
      <mesh position={[0, PIN_Y, 0.008]}>
        <circleGeometry args={[0.008, 20]} />
        <meshBasicMaterial ref={pinRef} color={item.pinColor || '#eb4034'} transparent opacity={0} toneMapped={false} />
      </mesh>

      {hovered && (
        <Html center distanceFactor={2.2} zIndexRange={[60, 0]} style={{ pointerEvents: 'none' }}>
          <div className="strip-card-tooltip">{item.title}</div>
        </Html>
      )}
    </group>
  );
};

// ── Clothesline: a thin string threaded through every visible card's pin,
//    with a gentle sag and a small deterministic wobble between each pair
//    of pins so it reads as a real hung line rather than a rigid rod.
const ClothesLine = ({ def, items, pinPositionsRef }) => {
  const lineRef     = useRef();
  const geometryRef = useRef();

  useFrame(() => {
    if (!lineRef.current || !geometryRef.current) return;
    const pins = pinPositionsRef.current || [];

    const visible = [];
    for (let i = 0; i < items.length; i++) {
      const p = pins[i];
      if (p) visible.push({ pos: p, id: items[i].id });
    }

    if (visible.length < 2) {
      lineRef.current.visible = false;
      return;
    }
    lineRef.current.visible = true;

    // Thread through every pin, inserting a sagging (+ slightly wobbled)
    // midpoint between each consecutive pair so the fitted curve droops
    // like a real clothesline instead of connecting pins with straight,
    // perfectly even segments.
    const controlPts = [visible[0].pos.clone()];
    for (let i = 0; i < visible.length - 1; i++) {
      const a = visible[i].pos;
      const b = visible[i + 1].pos;
      const mid = a.clone().add(b).multiplyScalar(0.5);
      const segLen = a.distanceTo(b);

      const wobble = seededRand(`${def.id}-${visible[i].id}-${visible[i + 1].id}`);
      mid.y -= segLen * 0.22;            // gravity sag
      mid.x += wobble * segLen * 0.15;   // marginal random wobble
      mid.z += wobble * segLen * 0.05;

      controlPts.push(mid, b.clone());
    }

    const curve  = new CatmullRomCurve3(controlPts, false, 'catmullrom', 0.5);
    const points = curve.getPoints(Math.max(16, controlPts.length * 6));

    geometryRef.current.setFromPoints(points);
  });

  return (
    <line ref={lineRef}>
      <bufferGeometry ref={geometryRef} />
      <lineBasicMaterial color="#cbb994" transparent opacity={0.5} toneMapped={false} />
    </line>
  );
};

// ── One strip: cards occupy a fixed set of slots across a quarter-sphere
//    arc, sliding smoothly as the shared `scrollRef` eases toward whatever
//    the mouse's hover position (near this strip) currently targets. Also
//    owns the clothesline that threads through every visible card's pin.
const Strip = ({ def, items, selectedItemId, selectedCountry, onSelect }) => {
  const scrollRef       = useRef(0);   // current eased scroll-window position
  const scrollTargetRef = useRef(0);   // target scroll-window position
  const pinPositionsRef = useRef([]);  // shared pin world-positions, read by the clothesline

  const slots     = Math.floor(QUARTER_DEG / ANGLE_STEP_DEG) + 1; // fixed slots across the quarter arc
  const maxScroll = Math.max(0, items.length - slots);
  const outwardAxis = useMemo(() => def.center.clone().normalize(), [def.center]);

  useEffect(() => {
    pinPositionsRef.current = new Array(items.length).fill(null);
  }, [items]);

  useFrame((state) => {
    if (maxScroll > 0) {
      // Intersect the mouse ray with the world z=0 plane (where every
      // strip lives) to get the mouse's current world-space position.
      const ray = state.raycaster.ray;
      if (Math.abs(ray.direction.z) > 1e-6) {
        const tPlane = -ray.origin.z / ray.direction.z;
        const worldMouse = ray.origin.clone().addScaledVector(ray.direction, tPlane);
        const toMouse = worldMouse.sub(def.center);
        const dist = toMouse.length();

        // "Hovering over OR NEAR the strip" — a generous radius around its
        // little sphere's centre, not just the exact card pixels.
        if (dist < HOVER_RADIUS) {
          const proj = toMouse.dot(outwardAxis);
          const progress = clamp01((proj + HOVER_RADIUS) / (2 * HOVER_RADIUS));
          scrollTargetRef.current = progress * maxScroll;
        }
      }
    }

    // Clamp (start/end, no wraparound) and smoothly ease toward the target.
    scrollTargetRef.current = Math.min(Math.max(scrollTargetRef.current, 0), maxScroll);
    scrollRef.current += (scrollTargetRef.current - scrollRef.current) * SCROLL_EASE;
    scrollRef.current = Math.min(Math.max(scrollRef.current, 0), maxScroll);
  });

  if (items.length === 0) return null;

  return (
    <group>
      {items.map((item, i) => (
        <StripCard
          key={item.id}
          item={item}
          index={i}
          def={def}
          scrollRef={scrollRef}
          pinPositionsRef={pinPositionsRef}
          isSelected={selectedItemId === item.id}
          isSameCountry={selectedCountry === item.country}
          onSelect={onSelect}
        />
      ))}
      <ClothesLine def={def} items={items} pinPositionsRef={pinPositionsRef} />
    </group>
  );
};

// Split a pool of items into 2 interleaved halves (even/odd index) so both
// resulting strips stay populated with a mix rather than being front- and
// back-loaded.
const splitEvenOdd = (arr) => [
  arr.filter((_, i) => i % 2 === 0),
  arr.filter((_, i) => i % 2 === 1),
];

const StripCarousel = ({ projects = [], fotos = [], selectedCountry, selectedItem }) => {
  const [projectsA, projectsB] = useMemo(() => splitEvenOdd(projects), [projects]);
  const [fotosC, fotosD]       = useMemo(() => splitEvenOdd(fotos), [fotos]);

  const stripItems = { V1: projectsA, V2: projectsB, H1: fotosC, H2: fotosD };

  const handleSelect = (item) => {
    if (item?.link) window.location.href = item.link;
  };

  return (
    <Canvas className="strip-carousel-canvas" camera={{ position: [0, 0, 6.5], fov: 50 }}>
      <ambientLight intensity={0.85} />
      <directionalLight position={[4, 3, 5]} intensity={0.55} />
      <Suspense fallback={null}>
        {STRIP_DEFS.map((def) => (
          <Strip
            key={def.id}
            def={def}
            items={stripItems[def.id]}
            selectedItemId={selectedItem}
            selectedCountry={selectedCountry}
            onSelect={handleSelect}
          />
        ))}
      </Suspense>
      {/* No OrbitControls, no drag — every strip is fixed in place.
          Hovering over or near a strip (see Strip's useFrame) scrubs
          smoothly through its cards; nothing loops. */}
    </Canvas>
  );
};

export default StripCarousel;