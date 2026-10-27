// src/components/home/StripCarousel.jsx
//
// The polaroid frame. Four strips of polaroids form a slightly displaced rectangle around the globe that is
// mapped onto a sphere, so seen from the front it reads as an oval with some buffer on every side:
//
//        ┌── H1 (top, → clockwise) ──┐
//   V1 ↑ │                           │ ↓ V2          pinwheel: each strip owns one corner and stops one card
//        └── H2 (bottom, ←) ─────────┘               short of the next, so the four interlock
//
// All of the geometry is solved from the viewport in src/utils/stripFrame.js: the polaroids run along a rounded
// rectangle that leaves ~10% of the screen empty outside them on every side, whatever the aspect ratio, and the
// cards scale with the screen. Each card sits on a sphere behind its ring position, tangent to it (eased towards
// flat by CURVATURE so photos stay readable), upright, and gets dimmer and narrower as it curves away.
//
// BEHAVIOUR (unchanged from before)
//   - hover over or near a strip to scrub through it (no drag, no loop; clamped at both ends)
//   - a clothesline threads through every visible card's pin
//   - click a card to open it
// NEW
//   - cards fly in from outside the frame, staggered along each strip, whenever `visible` turns on
//   - with fewer cards than the strip has room for, they are spread out and centred, so the frame always reads
//   - a card whose photo fails to load shows a plain card instead of taking the canvas down
//
// The canvas ignores the pointer itself (so the globe underneath stays draggable); it listens to the page
// through `eventSource` instead, and tells the globe when the pointer is over a card (uiState.cardHover).
import React, { useRef, useMemo, useState, useEffect, Suspense } from 'react';
import { withBase } from '@/utils/assetPath.js';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, useTexture } from '@react-three/drei';
import { Vector3, Matrix4, Quaternion, CatmullRomCurve3 } from 'three';
import { solveFrame, stripLayout, ringAt, hitSphere, cardBasis, slotDistance, CURVATURE, FRAME_CAMERA, CARD_ASPECT } from '@/utils/stripFrame.js';
import { uiState } from '@/globe/uiState.js';

const SCROLL_EASE = 0.12; // 0–1, higher = snappier scrubbing
const BAND = 0.2; // how close (NDC) the pointer must be to a strip's line to scrub it

// A polaroid in card units: height 1, width CARD_ASPECT. Everything is scaled by the strip's card scale.
const BACKING_W = CARD_ASPECT;
const BACKING_H = 1;
const BORDER = 0.0714;
const IMG = 0.714;
const CAPTION_H = 0.214;
const IMAGE_Y = (CAPTION_H - BORDER) / 2;
const PIN_Y = BACKING_H / 2 - BORDER / 2;

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const ease = (t) => 1 - Math.pow(1 - clamp01(t), 3);

// Deterministic pseudo-random in [-1, 1] from a string: a stable wobble for the clothesline.
const seededRand = (seed) => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  const x = Math.sin(h) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1;
};

const _m = new Matrix4();
const _qFull = new Quaternion();
const _qId = new Quaternion();
const _x = new Vector3();
const _y = new Vector3();
const _z = new Vector3();
const _ndc = [0, 0];
const _hit = { p: [0, 0, 0], n: [0, 0, 1], depth: 0 };

// ── One polaroid ──────────────────────────────────────────────────────────────────────────────
const CardBody = ({ item, texture, tint, groupRef, backingRef, imageRef, pinRef, hovered, setHovered, onSelect }) => (
  <group
    ref={groupRef}
    visible={false}
    onPointerOver={(e) => { e.stopPropagation(); uiState.cardHover = true; setHovered(true); }}
    onPointerOut={(e) => { e.stopPropagation(); uiState.cardHover = false; setHovered(false); }}
    onClick={(e) => { e.stopPropagation(); onSelect?.(item); }}
  >
    <mesh>
      <planeGeometry args={[BACKING_W, BACKING_H]} />
      <meshBasicMaterial ref={backingRef} color="#f5f0e8" transparent opacity={0} toneMapped={false} />
    </mesh>
    <mesh position={[0, IMAGE_Y, 0.004]}>
      <planeGeometry args={[IMG, IMG]} />
      <meshBasicMaterial ref={imageRef} map={texture ?? null} color={texture ? tint : '#9aa3ad'} transparent opacity={0} toneMapped={false} />
    </mesh>
    <mesh position={[0, PIN_Y, 0.008]}>
      <circleGeometry args={[0.03, 20]} />
      <meshBasicMaterial ref={pinRef} color={item.pinColor || '#eb4034'} transparent opacity={0} toneMapped={false} />
    </mesh>
    {hovered && (
      <Html center position={[0, 0.72, 0]} zIndexRange={[60, 0]} style={{ pointerEvents: 'none' }}>
        <div className="strip-card-tooltip">{item.title}</div>
      </Html>
    )}
  </group>
);

class CardBoundary extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

const Textured = ({ src, children }) => children(useTexture(src));

/**
 * Position, orientation, fade and fly-in of one card, every frame.
 * `slot` is fractional while the strip scrolls, so cards glide along the arc.
 */
const StripCard = ({ item, index, strip, frame, itemCount, scrollRef, revealRef, pinPositionsRef, isSelected, isSameCountry, onSelect }) => {
  const groupRef = useRef();
  const backingRef = useRef();
  const imageRef = useRef();
  const pinRef = useRef();
  const [hovered, setHovered] = useState(false);
  const tint = isSelected ? '#bcd8ff' : isSameCountry ? '#c8f5d9' : '#ffffff';

  useEffect(() => () => { if (hovered) uiState.cardHover = false; }, [hovered]);

  useFrame(() => {
    const g = groupRef.current;
    if (!g) return;
    const d = slotDistance(strip, index - scrollRef.current, itemCount); // pixels along the ring
    const along = d - strip.from; // 0 at the strip's first slot, strip.span at its last
    const half = strip.pitch * 0.5;
    if (revealRef.current < 0.001 || along < -half || along > strip.span + half) {
      g.visible = false;
      if (pinPositionsRef.current) pinPositionsRef.current[index] = null;
      return;
    }

    // Fly in from outside the frame, staggered along the strip.
    const r = ease(revealRef.current * 1.7 - clamp01(along / Math.max(strip.span, 1e-6)) * 0.7);
    const edge = clamp01(1 - Math.max(-along, along - strip.span) / half); // fade out over half a pitch at either end

    // Ring position on screen → the point of the sphere behind it, and which way the sphere faces there.
    const ndc = ringAt(frame, d, _ndc);
    const hit = hitSphere(frame, ndc[0], ndc[1], _hit);
    const lift = 1 + (1 - r) * 0.45;
    g.visible = r > 0.002 && edge > 0.002;
    g.position.set(hit.p[0] * lift, hit.p[1] * lift, hit.p[2] * lift);

    const b = cardBasis(hit.n);
    _m.makeBasis(_x.set(...b.x), _y.set(...b.y), _z.set(...b.z));
    _qFull.setFromRotationMatrix(_m);
    g.quaternion.copy(_qId.identity()).slerp(_qFull, CURVATURE);

    // Size: the card is as tall on screen as the frame metrics say, wherever it sits (a card turned away is
    // compensated in height, not in width, so it narrows like a surface curving away).
    const up = Math.max(0.4, Math.abs(_y.set(0, 1, 0).applyQuaternion(g.quaternion).y));
    const worldPerPx = (2 * hit.depth * frame.tanH) / frame.H;
    g.scale.setScalar(((frame.metrics.cardH * worldPerPx) / up) * (0.6 + 0.4 * r) * (hovered ? 1.12 : 1));

    // Cards that curve further from the viewer are dimmer.
    const facing = clamp01((hit.n[2] - 0.15) / 0.75);
    const opacity = (0.5 + 0.5 * facing) * r * edge;
    if (backingRef.current) backingRef.current.opacity = opacity;
    if (imageRef.current) imageRef.current.opacity = opacity;
    if (pinRef.current) pinRef.current.opacity = opacity;

    if (pinPositionsRef.current) {
      pinPositionsRef.current[index] = new Vector3(0, PIN_Y, 0.008).multiplyScalar(g.scale.x).applyQuaternion(g.quaternion).add(g.position);
    }
  });

  const body = (texture) => (
    <CardBody
      item={item} texture={texture} tint={tint} groupRef={groupRef} backingRef={backingRef} imageRef={imageRef} pinRef={pinRef}
      hovered={hovered} setHovered={setHovered} onSelect={onSelect}
    />
  );
  return (
    <CardBoundary fallback={body(null)}>
      <Suspense fallback={body(null)}>
        <Textured src={item.heroImage}>{(texture) => body(texture)}</Textured>
      </Suspense>
    </CardBoundary>
  );
};

// ── Clothesline: a thin string through every visible card's pin, drooping a little between pins ──
const ClothesLine = ({ strip, items, pinPositionsRef, revealRef }) => {
  const lineRef = useRef();
  const geometryRef = useRef();
  const horizontal = strip.horizontal;

  useFrame(() => {
    if (!lineRef.current || !geometryRef.current) return;
    const pins = pinPositionsRef.current || [];
    const visible = [];
    for (let i = 0; i < items.length; i++) if (pins[i]) visible.push({ pos: pins[i], id: items[i].id });
    if (visible.length < 2 || revealRef.current < 0.4) {
      lineRef.current.visible = false;
      return;
    }
    lineRef.current.visible = true;

    const pts = [visible[0].pos.clone()];
    for (let i = 0; i < visible.length - 1; i++) {
      const a = visible[i].pos;
      const b = visible[i + 1].pos;
      const mid = a.clone().add(b).multiplyScalar(0.5);
      const len = a.distanceTo(b);
      const wobble = seededRand(`${strip.id}-${visible[i].id}-${visible[i + 1].id}`);
      if (horizontal) mid.y -= len * 0.18; // gravity
      else mid.x -= Math.sign(mid.x || 1) * len * 0.12; // sides sag towards the middle of the frame
      mid.z += wobble * len * 0.04;
      pts.push(mid, b.clone());
    }
    const curve = new CatmullRomCurve3(pts, false, 'catmullrom', 0.5);
    geometryRef.current.setFromPoints(curve.getPoints(Math.max(16, pts.length * 6)));
  });

  return (
    <line ref={lineRef} frustumCulled={false}>
      <bufferGeometry ref={geometryRef} />
      <lineBasicMaterial color="#cbb994" transparent opacity={0.55} toneMapped={false} />
    </line>
  );
};

// ── One strip ─────────────────────────────────────────────────────────────────────────────────
const Strip = ({ strip, frame, items, revealRef, selectedItemId, selectedCountry, onSelect }) => {
  const scrollRef = useRef(0);
  const targetRef = useRef(0);
  const pinPositionsRef = useRef([]);
  const _a = useMemo(() => [0, 0], []);
  const _b = useMemo(() => [0, 0], []);
  const maxScroll = Math.max(0, items.length - strip.count);
  const a = useMemo(() => new Vector3(), []);
  const b = useMemo(() => new Vector3(), []);

  useEffect(() => { pinPositionsRef.current = new Array(items.length).fill(null); }, [items]);

  useFrame((state) => {
    if (maxScroll > 0) {
      // Where the strip's first and last slots are on screen (NDC) → a line to scrub along.
      ringAt(frame, strip.from, _a);
      ringAt(frame, strip.limit, _b);
      a.set(_a[0], _a[1], 0);
      b.set(_b[0], _b[1], 0);
      const ax = b.x - a.x;
      const ay = b.y - a.y;
      const len2 = ax * ax + ay * ay || 1;
      const px = state.pointer.x - a.x;
      const py = state.pointer.y - a.y;
      const u = (px * ax + py * ay) / len2;
      const dist = Math.abs(px * ay - py * ax) / Math.sqrt(len2);
      if (dist < BAND && u > -0.12 && u < 1.12) targetRef.current = clamp01(u) * maxScroll;
    }
    targetRef.current = Math.min(Math.max(targetRef.current, 0), maxScroll);
    scrollRef.current += (targetRef.current - scrollRef.current) * SCROLL_EASE;
  });

  if (items.length === 0) return null;
  return (
    <group>
      {items.map((item, i) => (
        <StripCard
          key={item.id}
          item={item}
          index={i}
          strip={strip}
          frame={frame}
          itemCount={items.length}
          scrollRef={scrollRef}
          revealRef={revealRef}
          pinPositionsRef={pinPositionsRef}
          isSelected={selectedItemId === item.id}
          isSameCountry={selectedCountry === item.country}
          onSelect={onSelect}
        />
      ))}
      <ClothesLine strip={strip} items={items} pinPositionsRef={pinPositionsRef} revealRef={revealRef} />
    </group>
  );
};

// Split a pool into two interleaved halves so both strips stay populated with a mix.
const splitEvenOdd = (arr) => [arr.filter((_, i) => i % 2 === 0), arr.filter((_, i) => i % 2 === 1)];

const Frame = ({ projects, fotos, visible, selectedCountry, selectedItem, onSelect }) => {
  const { width, height } = useThree((s) => s.size);
  const frame = useMemo(() => solveFrame(width, height), [width, height]);
  const strips = useMemo(() => stripLayout(frame), [frame]);
  const [projectsA, projectsB] = useMemo(() => splitEvenOdd(projects), [projects]);
  const [fotosC, fotosD] = useMemo(() => splitEvenOdd(fotos), [fotos]);
  const stripItems = { V1: projectsA, V2: projectsB, H1: fotosC, H2: fotosD };

  const revealRef = useRef(0);
  const rootRef = useRef();
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    revealRef.current += ((visible ? 1 : 0) - revealRef.current) * (1 - Math.exp(-dt * (visible ? 2.1 : 4)));
    if (revealRef.current < 0.002 && !visible) revealRef.current = 0;
    if (rootRef.current) rootRef.current.visible = revealRef.current > 0;
    if (!visible && uiState.cardHover) uiState.cardHover = false;
  });

  return (
    <group ref={rootRef} visible={false}>
      {strips.map((strip) => (
        <Strip
          key={strip.id}
          strip={strip}
          frame={frame}
          items={stripItems[strip.id]}
          revealRef={revealRef}
          selectedItemId={selectedItem}
          selectedCountry={selectedCountry}
          onSelect={onSelect}
        />
      ))}
    </group>
  );
};

const StripCarousel = ({ projects = [], fotos = [], visible = true, selectedCountry, selectedItem, eventSource }) => {
  const handleSelect = (item) => { if (item?.link) window.location.href = withBase(item.link); };
  return (
    <Canvas
      className="strip-carousel-canvas"
      camera={{ position: [0, 0, FRAME_CAMERA.distance], fov: FRAME_CAMERA.fovDeg, near: 1, far: 40 }}
      dpr={[1, 2]}
      gl={{ alpha: true, antialias: true }}
      eventSource={eventSource}
      eventPrefix="client"
    >
      <ambientLight intensity={0.85} />
      <directionalLight position={[4, 3, 5]} intensity={0.55} />
      <Suspense fallback={null}>
        <Frame projects={projects} fotos={fotos} visible={visible} selectedCountry={selectedCountry} selectedItem={selectedItem} onSelect={handleSelect} />
      </Suspense>
    </Canvas>
  );
};

export default StripCarousel;
