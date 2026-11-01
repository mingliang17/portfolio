// src/components/home/StripCarousel.jsx
//
// The polaroid menu: TWO straight vertical columns either side of the globe. Projects hang down the left, snaps
// down the right. Cards are pinned up by hand, so each is a little crooked: a small rotation, a small drift sideways
// and up/down, a hair bigger or smaller (deterministic per card, see cardJitter in src/utils/stripFrame.js).
//
//       ┌──┐             ┌──┐
//       │  │   (globe)   │  │        10% of the screen is left empty outside the columns; the cards scale with
//       └──┘             └──┘        the screen; each column scrolls when it holds more cards than fit.
//
// WHEN A COUNTRY OR CONSTELLATION IS SELECTED its own work comes first (see getSortedProjects / getSortedFotos);
// everything belonging to somewhere else stays in the columns but is lightly greyed out.
//
// SCROLLING a column: move the mouse up and down along it, or use the wheel while the pointer is over it, or drag
// it with a finger. There is no looping; it stops at both ends.
//
// A clothesline threads through every visible card's pin. Click a card to open it. A card whose photo fails to
// load shows a plain card instead of taking the canvas down.
//
// The canvas ignores the pointer itself (so the globe underneath stays draggable); it listens to the page through
// `eventSource` instead, and tells the globe when the pointer is over a card (uiState.cardHover) and where the
// columns are (uiState.bands).
import React, { useRef, useMemo, useState, useEffect, Suspense } from 'react';
import { withBase } from '@/utils/assetPath.js';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, useTexture } from '@react-three/drei';
import { Vector3, CatmullRomCurve3 } from 'three';
import { columnLayout, slotY, cardJitter, columnBand, FRAME_CAMERA, CARD_ASPECT } from '@/utils/stripFrame.js';
import { uiState } from '@/globe/uiState.js';

const SCROLL_EASE = 0.14; // 0–1, higher = snappier scrolling
const GRAY_AMOUNT = 0.78; // how far other places' cards are drained of colour
const GRAY_DIM = 0.86; // …and how much of their opacity they keep

// A polaroid in card units: height 1, width CARD_ASPECT. Everything is scaled per frame.
const BACKING_W = CARD_ASPECT;
const BACKING_H = 1;
const BORDER = 0.0714;
const IMG = 0.714;
const CAPTION_H = 0.214;
const IMAGE_Y = (CAPTION_H - BORDER) / 2;
const PIN_Y = BACKING_H / 2 - BORDER / 2;

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const ease = (t) => 1 - Math.pow(1 - clamp01(t), 3);

/** Lets a MeshBasicMaterial be drained of colour by a uniform (0 = as is, 1 = fully grey). */
const makeGrayPatch = (uniform) => (shader) => {
  shader.uniforms.uGray = uniform;
  shader.fragmentShader = shader.fragmentShader
    .replace('void main() {', 'uniform float uGray;\nvoid main() {')
    .replace(
      '#include <color_fragment>',
      '#include <color_fragment>\n  float grayLuma = dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114));\n  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(grayLuma) * 0.94, uGray);',
    );
};
const GRAY_CACHE_KEY = () => 'polaroid-gray';

// ── One polaroid ──────────────────────────────────────────────────────────────────────────────
const CardBody = ({ item, texture, tint, grayUniform, groupRef, backingRef, imageRef, pinRef, hovered, setHovered, onSelect }) => {
  const patch = useMemo(() => makeGrayPatch(grayUniform), [grayUniform]);
  return (
    <group
      ref={groupRef}
      visible={false}
      onPointerOver={(e) => { e.stopPropagation(); uiState.cardHover = true; setHovered(true); }}
      onPointerOut={(e) => { e.stopPropagation(); uiState.cardHover = false; setHovered(false); }}
      onClick={(e) => { e.stopPropagation(); onSelect?.(item); }}
    >
      <mesh>
        <planeGeometry args={[BACKING_W, BACKING_H]} />
        <meshBasicMaterial ref={backingRef} color="#f5f0e8" transparent opacity={0} toneMapped={false} onBeforeCompile={patch} customProgramCacheKey={GRAY_CACHE_KEY} />
      </mesh>
      <mesh position={[0, IMAGE_Y, 0.004]}>
        <planeGeometry args={[IMG, IMG]} />
        <meshBasicMaterial ref={imageRef} map={texture ?? null} color={texture ? tint : '#9aa3ad'} transparent opacity={0} toneMapped={false} onBeforeCompile={patch} customProgramCacheKey={GRAY_CACHE_KEY} />
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
};

class CardBoundary extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

const Textured = ({ src, children }) => children(useTexture(src));

/**
 * Position, tilt, fade and fly-in of one card, every frame.
 * `slot` is fractional while the column scrolls, so cards glide.
 */
const StripCard = ({ item, index, col, frame, itemCount, scrollRef, revealRef, pinPositionsRef, isSelected, isOther, onSelect }) => {
  const groupRef = useRef();
  const backingRef = useRef();
  const imageRef = useRef();
  const pinRef = useRef();
  const [hovered, setHovered] = useState(false);
  const hoverAmt = useRef(0);
  const grayUniform = useMemo(() => ({ value: 0 }), []);
  const jitter = useMemo(() => cardJitter(item.id), [item.id]);
  const tint = isSelected ? '#bcd8ff' : '#ffffff';
  const grayTarget = isOther ? 1 : 0;

  useEffect(() => () => { if (hovered) uiState.cardHover = false; }, [hovered]);

  useFrame((_, delta) => {
    const g = groupRef.current;
    if (!g) return;
    const m = frame.layout.metrics;
    const y = slotY(col, index - scrollRef.current, itemCount); // px, y down
    const along = y - col.y0; // 0 at the column's first slot, col.span at its last
    const half = col.pitch * 0.5;
    if (revealRef.current < 0.001 || along < -half || along > col.span + half) {
      g.visible = false;
      if (pinPositionsRef.current) pinPositionsRef.current[index] = null;
      return;
    }

    const k = 1 - Math.exp(-Math.min(delta, 0.05) * 9);
    hoverAmt.current += ((hovered ? 1 : 0) - hoverAmt.current) * k;
    grayUniform.value += (grayTarget * GRAY_AMOUNT - grayUniform.value) * (1 - Math.exp(-Math.min(delta, 0.05) * 5));

    // Fly in from the side of the screen, staggered down the column.
    const r = ease(revealRef.current * 1.7 - clamp01(along / Math.max(col.span, 1e-6)) * 0.7);
    const edge = clamp01(1 - Math.max(-along, along - col.span) / half); // fade over half a pitch at either end

    // Hand-made: a little off the line, a little crooked (it straightens up when you point at it).
    const px = col.x + jitter.dx * m.cardW;
    const py = y + jitter.dy * m.cardH;
    const side = col.side === 'left' ? -1 : 1;
    const fly = (1 - r) * 0.35 * frame.W * side;
    g.position.set((px + fly - frame.W / 2) * frame.wpp, (frame.H / 2 - py) * frame.wpp, hoverAmt.current * 0.4 + index * 0.0015);
    g.rotation.z = jitter.rot * (1 - 0.85 * hoverAmt.current);
    const scale = m.cardH * frame.wpp * jitter.scale * (0.6 + 0.4 * r) * (1 + 0.12 * hoverAmt.current);
    g.scale.setScalar(scale);
    g.visible = r > 0.002 && edge > 0.002;

    const opacity = r * edge * (1 - (1 - GRAY_DIM) * (grayUniform.value / GRAY_AMOUNT));
    if (backingRef.current) backingRef.current.opacity = opacity;
    if (imageRef.current) imageRef.current.opacity = opacity;
    if (pinRef.current) pinRef.current.opacity = opacity;

    if (pinPositionsRef.current) {
      const c = Math.cos(g.rotation.z);
      const s = Math.sin(g.rotation.z);
      const ly = PIN_Y * scale;
      pinPositionsRef.current[index] = new Vector3(g.position.x - s * ly, g.position.y + c * ly, g.position.z + 0.008 * scale);
    }
  });

  const body = (texture) => (
    <CardBody
      item={item} texture={texture} tint={tint} grayUniform={grayUniform}
      groupRef={groupRef} backingRef={backingRef} imageRef={imageRef} pinRef={pinRef}
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
const ClothesLine = ({ col, items, pinPositionsRef, revealRef }) => {
  const lineRef = useRef();
  const geometryRef = useRef();
  const inward = col.side === 'left' ? 1 : -1; // the string sags towards the globe

  useFrame(() => {
    if (!lineRef.current || !geometryRef.current) return;
    const pins = pinPositionsRef.current || [];
    const visible = [];
    for (let i = 0; i < items.length; i++) if (pins[i]) visible.push(pins[i]);
    if (visible.length < 2 || revealRef.current < 0.4) {
      lineRef.current.visible = false;
      return;
    }
    lineRef.current.visible = true;

    const pts = [visible[0].clone()];
    for (let i = 0; i < visible.length - 1; i++) {
      const a = visible[i];
      const b = visible[i + 1];
      const mid = a.clone().add(b).multiplyScalar(0.5);
      mid.x += inward * a.distanceTo(b) * 0.08;
      pts.push(mid, b.clone());
    }
    const curve = new CatmullRomCurve3(pts, false, 'catmullrom', 0.5);
    geometryRef.current.setFromPoints(curve.getPoints(Math.max(16, pts.length * 6)));
  });

  return (
    <line ref={lineRef} frustumCulled={false}>
      <bufferGeometry ref={geometryRef} />
      <lineBasicMaterial color="#cbb994" transparent opacity={0.5} toneMapped={false} />
    </line>
  );
};

// ── One column ────────────────────────────────────────────────────────────────────────────────
const Column = ({ col, frame, items, revealRef, selectedItemId, selectedCountry, onSelect }) => {
  const scrollRef = useRef(0);
  const targetRef = useRef(0);
  const pinPositionsRef = useRef([]);
  const eventTarget = useThree((s) => s.events.connected);
  const maxScroll = Math.max(0, items.length - col.count);
  const band = useMemo(() => columnBand(col), [col]);

  useEffect(() => { pinPositionsRef.current = new Array(items.length).fill(null); }, [items]);
  useEffect(() => { targetRef.current = Math.min(targetRef.current, maxScroll); }, [maxScroll]);

  // Scrolling by mouse (glide along the column), wheel, or touch (drag). Pointer coordinates are CSS px, like the layout.
  useEffect(() => {
    if (!eventTarget || maxScroll <= 0) return undefined;
    const inBand = (x, y) => x >= band.x0 && x <= band.x1 && y >= band.y0 && y <= band.y1;
    const setTarget = (v) => { targetRef.current = Math.min(Math.max(v, 0), maxScroll); };
    let touch = null;

    const onMove = (e) => {
      if (e.pointerType === 'touch' || e.pointerType === 'pen') {
        if (touch) setTarget(touch.start - (e.clientY - touch.y) / col.pitch);
        return;
      }
      if (inBand(e.clientX, e.clientY)) setTarget(clamp01((e.clientY - col.y0) / Math.max(col.span, 1)) * maxScroll);
    };
    const onDown = (e) => {
      if ((e.pointerType === 'touch' || e.pointerType === 'pen') && inBand(e.clientX, e.clientY)) touch = { y: e.clientY, start: targetRef.current };
    };
    const onUp = () => { touch = null; };
    const onWheel = (e) => {
      if (!inBand(e.clientX, e.clientY)) return;
      setTarget(targetRef.current + (e.deltaMode === 1 ? e.deltaY : e.deltaY / (col.pitch * 1.1)));
    };
    eventTarget.addEventListener('pointermove', onMove);
    eventTarget.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    eventTarget.addEventListener('wheel', onWheel, { passive: true });
    return () => {
      eventTarget.removeEventListener('pointermove', onMove);
      eventTarget.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      eventTarget.removeEventListener('wheel', onWheel);
    };
  }, [eventTarget, band, col, maxScroll]);

  useFrame(() => {
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
          col={col}
          frame={frame}
          itemCount={items.length}
          scrollRef={scrollRef}
          revealRef={revealRef}
          pinPositionsRef={pinPositionsRef}
          isSelected={selectedItemId === item.id}
          isOther={!!selectedCountry && item.country !== selectedCountry}
          onSelect={onSelect}
        />
      ))}
      <ClothesLine col={col} items={items} pinPositionsRef={pinPositionsRef} revealRef={revealRef} />
    </group>
  );
};

const Frame = ({ projects, fotos, visible, selectedCountry, selectedItem, onSelect }) => {
  const { width, height } = useThree((s) => s.size);
  const frame = useMemo(() => {
    const tanH = Math.tan((FRAME_CAMERA.fovDeg * Math.PI) / 360);
    return { W: width, H: height, wpp: (2 * FRAME_CAMERA.distance * tanH) / height, layout: columnLayout(width, height) };
  }, [width, height]);
  const [left, right] = frame.layout.columns;

  const revealRef = useRef(0);
  const rootRef = useRef();
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    revealRef.current += ((visible ? 1 : 0) - revealRef.current) * (1 - Math.exp(-dt * (visible ? 2.1 : 4)));
    if (revealRef.current < 0.002 && !visible) revealRef.current = 0;
    if (rootRef.current) rootRef.current.visible = revealRef.current > 0;
    if (!visible && uiState.cardHover) uiState.cardHover = false;
  });

  // Tell the globe where the columns are (so a finger on one scrolls it rather than turning the globe).
  useEffect(() => {
    uiState.bands = visible ? frame.layout.columns.map(columnBand) : [];
    return () => { uiState.bands = []; };
  }, [visible, frame]);

  return (
    <group ref={rootRef} visible={false}>
      <Column col={left} frame={frame} items={projects} revealRef={revealRef} selectedItemId={selectedItem} selectedCountry={selectedCountry} onSelect={onSelect} />
      <Column col={right} frame={frame} items={fotos} revealRef={revealRef} selectedItemId={selectedItem} selectedCountry={selectedCountry} onSelect={onSelect} />
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
      <Suspense fallback={null}>
        <Frame projects={projects} fotos={fotos} visible={visible} selectedCountry={selectedCountry} selectedItem={selectedItem} onSelect={handleSelect} />
      </Suspense>
    </Canvas>
  );
};

export default StripCarousel;
