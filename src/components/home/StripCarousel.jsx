// src/components/home/StripCarousel.jsx
//
// The polaroid menu: TWO ENDLESS vertical strips either side of the globe. Projects hang down the left, snaps down
// the right. Each strip runs off the top and bottom of the page and loops, so there is no end to reach.
//
//       ┌──┐             ┌──┐
//       │  │   (globe)   │  │        The cards are pinned up by hand: each is a little crooked (a small rotation,
//       └──┘             └──┘        a little drift sideways and up/down; see cardJitter in src/utils/stripFrame.js).
//
// WHEN A COUNTRY OR CONSTELLATION IS OPEN its own work comes first in the list (getSortedProjects / getSortedFotos)
// and is scrolled to the middle of the screen in full colour. Everything belonging to somewhere else stays in the
// strip but its PHOTO is drained of colour and made see-through. The polaroid itself (the white frame and its pin)
// is always solid white: only the photo within ever fades.
//
// SCROLLING a strip: the wheel while the pointer is over it, dragging it (mouse or finger), or resting the pointer
// near its top or bottom, which glides it. It never ends: the list comes round again.
//
// A clothesline threads through every visible card's pin. Click a card to open it. A card whose photo fails to
// load shows a plain card instead of taking the canvas down.
//
// The canvas ignores the pointer itself (so the globe underneath stays draggable); it listens to the page through
// `eventSource` instead, and tells the globe when the pointer is over a card (uiState.cardHover) and where the
// strips are (uiState.bands).
import React, { useRef, useMemo, useState, useEffect, Suspense } from 'react';
import { withBase } from '@/utils/assetPath.js';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, useTexture } from '@react-three/drei';
import { Vector3, CatmullRomCurve3 } from 'three';
import {
  columnLayout, columnBand, wrapOffset, lapOffsets, startScroll, edgeScrollSpeed, cardJitter, FRAME_CAMERA, CARD_ASPECT,
} from '@/utils/stripFrame.js';
import { uiState } from '@/globe/uiState.js';

const SCROLL_RATE = 9; // how quickly a strip catches up with where you scrolled it (higher = snappier)
const OTHER_GRAY = 1; // how much colour another place's PHOTO loses (1 = none left)
const OTHER_PHOTO_OPACITY = 0.5; // …and how see-through it is. The polaroid frame is never see-through.

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
      '#include <color_fragment>\n  float grayLuma = dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114));\n  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(grayLuma), uGray);',
    );
};
const GRAY_CACHE_KEY = () => 'polaroid-photo-gray';

// ── One polaroid ──────────────────────────────────────────────────────────────────────────────
const CardBody = ({ item, texture, tint, grayUniform, groupRef, imageRef, hovered, setHovered, onSelect }) => {
  const patch = useMemo(() => makeGrayPatch(grayUniform), [grayUniform]);
  return (
    <group
      ref={groupRef}
      visible={false}
      onPointerOver={(e) => { e.stopPropagation(); uiState.cardHover = true; setHovered(true); }}
      onPointerOut={(e) => { e.stopPropagation(); uiState.cardHover = false; setHovered(false); }}
      onClick={(e) => { e.stopPropagation(); if (e.delta > 6) return; onSelect?.(item); }} // a drag along the strip is not a click
    >
      {/* The polaroid: solid white, never see-through. */}
      <mesh>
        <planeGeometry args={[BACKING_W, BACKING_H]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </mesh>
      {/* The photo: the only part that is drained of colour and made see-through. */}
      <mesh position={[0, IMAGE_Y, 0.004]}>
        <planeGeometry args={[IMG, IMG]} />
        <meshBasicMaterial ref={imageRef} map={texture ?? null} color={texture ? tint : '#9aa3ad'} transparent toneMapped={false} onBeforeCompile={patch} customProgramCacheKey={GRAY_CACHE_KEY} />
      </mesh>
      <mesh position={[0, PIN_Y, 0.008]}>
        <circleGeometry args={[0.03, 20]} />
        <meshBasicMaterial color={item.pinColor || '#eb4034'} toneMapped={false} />
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
 * One item at one lap of the loop: where it sits, how it is tilted, how it flies in. Runs every frame.
 * `index` is the item's place in the list; its distance from the middle of the screen comes from the scroll position.
 */
const StripCard = ({ item, index, lap, N, col, frame, scrollRef, revealRef, pinsRef, isSelected, isOther, onSelect }) => {
  const groupRef = useRef();
  const imageRef = useRef();
  const [hovered, setHovered] = useState(false);
  const hoverAmt = useRef(0);
  const otherAmt = useRef(isOther ? 1 : 0);
  const grayUniform = useMemo(() => ({ value: isOther ? OTHER_GRAY : 0 }), []); // eslint-disable-line react-hooks/exhaustive-deps
  const jitter = useMemo(() => cardJitter(item.id), [item.id]);
  const pinKey = `${index}:${lap}`;
  const tint = isSelected ? '#bcd8ff' : '#ffffff';

  useEffect(() => () => { if (hovered) uiState.cardHover = false; }, [hovered]);
  useEffect(() => () => { pinsRef.current.delete(pinKey); }, [pinsRef, pinKey]);

  useFrame((_, delta) => {
    const g = groupRef.current;
    if (!g) return;
    const m = frame.layout.metrics;
    const d = wrapOffset(index, scrollRef.current, N) + lap * N; // card-slots from the middle of the screen
    const off = d * col.pitch; // px from the middle
    if (revealRef.current < 0.001 || Math.abs(off) > col.reach) {
      g.visible = false;
      pinsRef.current.delete(pinKey);
      return;
    }

    const dt = Math.min(delta, 0.05);
    hoverAmt.current += ((hovered ? 1 : 0) - hoverAmt.current) * (1 - Math.exp(-dt * 9));
    otherAmt.current += ((isOther ? 1 : 0) - otherAmt.current) * (1 - Math.exp(-dt * 5));
    grayUniform.value = otherAmt.current * OTHER_GRAY;

    // Fly in from the side of the screen, the middle first.
    const r = ease(revealRef.current * 1.6 - clamp01(Math.abs(off) / col.reach) * 0.6);
    const side = col.side === 'left' ? -1 : 1;
    const fly = (1 - r) * 0.45 * frame.W * side;

    // Hand-made: a little off the line, a little crooked (it straightens up when you point at it).
    const px = col.x + jitter.dx * m.cardW + fly;
    const py = col.yMid + off + jitter.dy * m.cardH;

    // Cards overlap a little, and the frames are solid, so each needs its own depth: lower on the page = in front.
    // Position and size are corrected for the depth so it does not change how big the card looks.
    const z = (off / frame.H) * 0.35 + hoverAmt.current * 0.7;
    const persp = (FRAME_CAMERA.distance - z) / FRAME_CAMERA.distance;
    g.position.set((px - frame.W / 2) * frame.wpp * persp, (frame.H / 2 - py) * frame.wpp * persp, z);
    g.rotation.z = jitter.rot * (1 - 0.85 * hoverAmt.current);
    const scale = m.cardH * frame.wpp * jitter.scale * (0.85 + 0.15 * r) * (1 + 0.12 * hoverAmt.current) * persp;
    g.scale.setScalar(scale);
    g.visible = r > 0.002;

    // Only the photo changes opacity.
    if (imageRef.current) imageRef.current.opacity = 1 - (1 - OTHER_PHOTO_OPACITY) * otherAmt.current;

    const c = Math.cos(g.rotation.z);
    const s = Math.sin(g.rotation.z);
    const ly = PIN_Y * scale;
    pinsRef.current.set(pinKey, new Vector3(g.position.x - s * ly, g.position.y + c * ly, g.position.z + 0.008 * scale));
  });

  const body = (texture) => (
    <CardBody
      item={item} texture={texture} tint={tint} grayUniform={grayUniform}
      groupRef={groupRef} imageRef={imageRef}
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
const ClothesLine = ({ col, pinsRef, revealRef }) => {
  const lineRef = useRef();
  const geometryRef = useRef();
  const inward = col.side === 'left' ? 1 : -1; // the string sags towards the globe

  useFrame(() => {
    if (!lineRef.current || !geometryRef.current) return;
    const visible = [...pinsRef.current.values()].sort((a, b) => b.y - a.y); // top to bottom
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

// ── One strip ─────────────────────────────────────────────────────────────────────────────────
const Column = ({ col, frame, items, revealRef, selectedItemId, selectedCountry, onSelect }) => {
  const N = items.length;
  const scrollRef = useRef(0); // the list position that is at the middle of the screen (fractional while it glides)
  const targetRef = useRef(0);
  const pinsRef = useRef(new Map());
  const pointer = useRef({ x: -1, y: -1, type: 'mouse' });
  const dragRef = useRef(null);
  const eventTarget = useThree((s) => s.events.connected);
  const band = useMemo(() => columnBand(col, frame.H), [col, frame.H]);
  const laps = useMemo(() => lapOffsets(N, col.slots), [N, col.slots]);
  const signature = useMemo(() => items.map((i) => i.id).join('|'), [items]);

  // When a place opens (or the list changes), put its own cards in the middle of the screen.
  useEffect(() => {
    scrollRef.current = targetRef.current = startScroll(items, selectedCountry);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, selectedCountry]);

  // Scrolling by wheel, by dragging (mouse or finger), and by resting the pointer near the top or bottom.
  useEffect(() => {
    if (!eventTarget || N === 0) return undefined;
    const inBand = (x, y) => x >= band.x0 && x <= band.x1 && y >= band.y0 && y <= band.y1;
    const onDown = (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (inBand(e.clientX, e.clientY)) dragRef.current = { y: e.clientY, start: targetRef.current };
    };
    const onMove = (e) => {
      pointer.current = { x: e.clientX, y: e.clientY, type: e.pointerType };
      if (dragRef.current) targetRef.current = dragRef.current.start - (e.clientY - dragRef.current.y) / col.pitch;
    };
    const onUp = () => { dragRef.current = null; };
    const onWheel = (e) => {
      if (inBand(e.clientX, e.clientY)) targetRef.current += e.deltaMode === 1 ? e.deltaY : e.deltaY / (col.pitch * 1.1);
    };
    eventTarget.addEventListener('pointerdown', onDown);
    eventTarget.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    eventTarget.addEventListener('wheel', onWheel, { passive: true });
    return () => {
      eventTarget.removeEventListener('pointerdown', onDown);
      eventTarget.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      eventTarget.removeEventListener('wheel', onWheel);
    };
  }, [eventTarget, band, col.pitch, N]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const p = pointer.current;
    if (!dragRef.current && p.type === 'mouse' && revealRef.current > 0.5 && p.x >= band.x0 && p.x <= band.x1) {
      targetRef.current += edgeScrollSpeed(p.y, frame.H) * dt; // rest the pointer near the top/bottom to glide
    }
    scrollRef.current += (targetRef.current - scrollRef.current) * (1 - Math.exp(-dt * SCROLL_RATE));
  });

  if (N === 0) return null;
  return (
    <group>
      {items.map((item, i) =>
        laps.map((lap) => (
          <StripCard
            key={`${item.id}:${lap}`}
            item={item}
            index={i}
            lap={lap}
            N={N}
            col={col}
            frame={frame}
            scrollRef={scrollRef}
            revealRef={revealRef}
            pinsRef={pinsRef}
            isSelected={selectedItemId === item.id}
            isOther={!!selectedCountry && item.country !== selectedCountry}
            onSelect={onSelect}
          />
        )),
      )}
      <ClothesLine col={col} pinsRef={pinsRef} revealRef={revealRef} />
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

  // Tell the globe where the strips are (so a drag on one scrolls it rather than turning the globe).
  useEffect(() => {
    uiState.bands = visible ? frame.layout.columns.map((c) => columnBand(c, frame.H)) : [];
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
