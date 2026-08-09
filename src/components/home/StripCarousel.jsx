// src/components/home/StripCarousel.jsx
//
// 4 independent rolling-polaroid carousels, each mapped onto its OWN small
// hemisphere (not one shared sphere):
//   - 2 "vertical" strips   (2→12 and 14→24 on your grid) — meridian arcs,
//     cards roll top-to-bottom.
//   - 2 "horizontal" strips (8→10 and 18 on your grid)     — parallel arcs,
//     cards roll left-to-right.
//
// Each strip's sphere is offset from the shared origin so the 4 stay
// visually separated in roughly the same spatial arrangement the original
// "#" sketch implied — verticals to the left/right, horizontals above/
// below — without literally sharing one surface:
//
//         [H1: 8→10]
//   [V1: 2→12]  [V2: 14→24]
//         [H2: 18]
//
// MAPPING_DEGREES controls how much of each strip's 360° loop is actually
// "mapped" (visible) at once — this is the editable value from your point
// 5, out of 360°. Set to 180 = a hemisphere. Cards still cycle through the
// full 360° loop for the continuous rolling motion; MAPPING_DEGREES just
// governs how wide a slice of that loop is ever shown.
//
// Inside the mapped arc, opacity fades from 100% at dead-centre down to a
// floor of 50% at the arc's own edge (point 4); outside the mapped arc,
// cards are fully hidden.

import React, { useRef, useMemo, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html, useTexture } from '@react-three/drei';
import { Vector3 } from 'three';
import { meridianPoint, parallelPoint, tangentQuaternion, mappedOpacity } from '../../utils/sphereStrips.js';

// ── Tunable constants ──────────────────────────────────────────────────────
const SPHERE_RADIUS   = 1.15;  // radius of each strip's own little hemisphere
const SPHERE_GAP      = 1.5;   // distance of each sphere's centre from the shared origin
const MAPPING_DEGREES = 180;   // ← EDIT ME (0–360): how much of the loop is "mapped"/visible. 180 = hemisphere.
const IMG_SIZE   = 0.20;
const BORDER     = 0.02;
const CAPTION_H  = 0.06;
const BACKING_W  = IMG_SIZE + BORDER * 2;
const BACKING_H  = IMG_SIZE + BORDER + CAPTION_H;
const IMAGE_Y    = (CAPTION_H - BORDER) / 2;
const PIN_Y      = BACKING_H / 2 - BORDER / 2;

// 2 meridians (vertical) + 2 parallels (horizontal), each on its own sphere.
// longitudeDeg/latitudeDeg stay at 0 — every strip's t=0 already faces the
// camera dead-on (see sphereStrips.js) — so separation comes entirely from
// each strip's own `center`, arranged in a diamond around the origin.
const STRIP_DEFS = [
  { id: 'V1', label: '2\u219212',  type: 'meridian', center: new Vector3(-SPHERE_GAP, 0, 0), spinSpeed:  0.06  },
  { id: 'V2', label: '14\u219224', type: 'meridian', center: new Vector3( SPHERE_GAP, 0, 0), spinSpeed: -0.05  },
  { id: 'H1', label: '8\u219210',  type: 'parallel', center: new Vector3(0,  SPHERE_GAP, 0), spinSpeed:  0.045 },
  { id: 'H2', label: '18',         type: 'parallel', center: new Vector3(0, -SPHERE_GAP, 0), spinSpeed: -0.07  },
];

// World-space position + local outward normal for a strip at angle t.
const pointOnStrip = (def, t) => {
  const { position, normal } = def.type === 'meridian'
    ? meridianPoint(SPHERE_RADIUS, 0, t)
    : parallelPoint(SPHERE_RADIUS, 0, t);
  return { position: position.add(def.center), normal };
};

// ── One polaroid card: cream backing + photo + pin, tangent to its sphere ──
const StripCard = ({ item, def, baseAngle, dragOffsetRef, isSelected, isSameCountry, onSelect }) => {
  const groupRef   = useRef();
  const backingRef = useRef();
  const imageRef   = useRef();
  const pinRef     = useRef();
  const [hovered, setHovered] = useState(false);

  const texture = useTexture(item.heroImage);

  useFrame(({ camera, clock }) => {
    if (!groupRef.current) return;
    const angle = baseAngle + dragOffsetRef.current + clock.elapsedTime * def.spinSpeed;
    const { position, normal } = pointOnStrip(def, angle);

    groupRef.current.position.copy(position);
    groupRef.current.quaternion.copy(tangentQuaternion(normal));

    // Camera direction relative to THIS strip's own sphere centre, since
    // each strip now lives on an independent sphere.
    const cameraDir = camera.position.clone().sub(def.center).normalize();
    const opacity = mappedOpacity(normal, cameraDir, MAPPING_DEGREES);

    groupRef.current.visible = opacity > 0;
    if (backingRef.current) backingRef.current.opacity = opacity;
    if (imageRef.current)   imageRef.current.opacity   = opacity;
    if (pinRef.current)     pinRef.current.opacity      = opacity;
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

      {/* pin dot */}
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

// ── One strip: cards spread evenly around its circle, sharing one
//    drag-rotatable offset. Vertical (meridian) strips read drag Y —
//    horizontal (parallel) strips read drag X — so drag direction always
//    matches the strip's own roll direction. Uses window-level listeners
//    (not per-mesh) so a fast drag never "falls off" the strip mid-gesture.
const Strip = ({ def, items, selectedItemId, selectedCountry, onSelect }) => {
  const dragOffsetRef = useRef(0);
  const draggingRef   = useRef(null);
  const isVertical    = def.type === 'meridian';

  useEffect(() => {
    const handleMove = (e) => {
      if (!draggingRef.current) return;
      const raw   = isVertical ? e.clientY : e.clientX;
      const start = isVertical ? draggingRef.current.startY : draggingRef.current.startX;
      const delta = (raw - start) * 0.01;
      dragOffsetRef.current = draggingRef.current.base + delta;
    };
    const handleUp = () => { draggingRef.current = null; };
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, [isVertical]);

  const onPointerDown = (e) => {
    e.stopPropagation();
    draggingRef.current = { startX: e.clientX, startY: e.clientY, base: dragOffsetRef.current };
  };

  if (items.length === 0) return null;

  return (
    <group onPointerDown={onPointerDown}>
      {items.map((item, i) => (
        <StripCard
          key={item.id}
          item={item}
          def={def}
          baseAngle={(i / items.length) * Math.PI * 2}
          dragOffsetRef={dragOffsetRef}
          isSelected={selectedItemId === item.id}
          isSameCountry={selectedCountry === item.country}
          onSelect={onSelect}
        />
      ))}
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
      {/* No OrbitControls — every sphere is fixed in place. Only individual
          strips rotate (auto-spin + drag). */}
    </Canvas>
  );
};

export default StripCarousel;