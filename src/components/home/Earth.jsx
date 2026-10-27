// src/components/home/Earth.jsx
//
// The home-page globe: a vector globe in the spirit of a rotating-globe map. Flat-coloured countries with
// visible borders on a blue sphere, drag to spin (with inertia), a slow idle spin, hover to highlight,
// click ANY country to select it.
//
// On selection the globe turns to centre that country and the camera dollies in until the country fills the
// opening that the polaroid frame (StripCarousel) leaves around it. Clicking the sea, pressing Esc or the
// badge's ✕ (see Home.jsx) zooms back out.
//
// Countries that have projects or photos (constants/index.js → globeProjects) keep their pins, are tinted, and
// show their counts on hover; every other country is selectable too (and simply has no polaroids).
//
// Everything on the globe is ours: country data is public/data/countries-50m.json (scripts/build-globe-data.mjs),
// drawn by src/globe/*. See docs/Globe.md.
import React, { useRef, useState, useEffect, useMemo, forwardRef, useImperativeHandle } from 'react';
import { withBase } from '@/utils/assetPath.js';
import { useFrame, useThree } from '@react-three/fiber';
import { Quaternion, Vector3 } from 'three';
import { Html } from '@react-three/drei';

import { useWorld } from '@/globe/useWorld.js';
import { findCountryAt } from '@/globe/topo.js';
import { dirToLonLat, lonLatToDir, focusOf, viewFor, distanceForRadius, fitDistance, DEG } from '@/globe/geo.js';
import { GLOBE_THEMES, DEFAULT_THEME } from '@/globe/themes.js';
import { GLOBE_RADIUS, GROUP_SCALE, WORLD_RADIUS, GLOBE_FOV, BASE_SILHOUETTE } from '@/globe/constants.js';
import { uiState } from '@/globe/uiState.js';
import { frameMetrics } from '@/utils/stripFrame.js';
import { GlobeBody, Atmosphere, CountryBorders, CountryOverlay } from './globe/GlobeParts.jsx';

const IDLE_SPEED = 0.11; // rad/s of idle spin
const IDLE_DELAY = 1.8; // seconds without interaction before the idle spin resumes
const DRAG_SPEED = 0.0042; // rad per px at the default distance
const MAX_PITCH = 1.35;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// ── A pin: a thin stem + glowing tip standing on the surface, taller for countries with more work ──
const Pin = ({ country, viewRef, isSelected, isHovered, onHover, onSelect }) => {
  const stemRef = useRef();
  const tipRef = useRef();
  const hitRef = useRef();
  const total = (country.projects?.length || 0) + (country.fotos?.length || 0);
  const stemHeight = 0.2 + total * 0.15; // above the surface
  const stemRadius = 0.006 + total * 0.004;
  const tipRadius = 0.022 + total * 0.009;

  const dir = useMemo(() => new Vector3(...lonLatToDir(country.lon, country.lat)), [country.lon, country.lat]);
  const quat = useMemo(() => new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), dir), [dir]);
  const base = useMemo(() => dir.clone().multiplyScalar(GLOBE_RADIUS), [dir]);

  const active = isSelected || isHovered;
  const colour = isSelected ? '#4d9eff' : isHovered ? '#ffffff' : '#4ECDC4';

  // The pin sinks into the globe as the camera comes in, so it never fills the screen.
  useFrame(() => {
    const f = viewRef.current.focus;
    const s = isSelected ? 1 - f : 1 - 0.7 * f;
    const h = stemHeight * Math.max(0.001, s);
    if (stemRef.current) {
      stemRef.current.scale.y = Math.max(0.001, s);
      stemRef.current.position.y = h / 2;
    }
    for (const r of [tipRef, hitRef]) if (r.current) r.current.position.y = h;
    // The tip shrinks too (the chosen country's disappears entirely), or it would fill the screen at close range.
    if (tipRef.current) tipRef.current.scale.setScalar(Math.max(0.001, isSelected ? 1 - f : 1 - 0.55 * f) * (active ? 1.4 : 1));
  });

  return (
    <group position={base.toArray()} quaternion={quat}>
      <mesh ref={stemRef}>
        <cylinderGeometry args={[stemRadius, stemRadius, stemHeight, 8]} />
        <meshStandardMaterial color={colour} emissive={colour} emissiveIntensity={active ? 2 : 0.8} />
      </mesh>
      <mesh ref={tipRef}>
        <sphereGeometry args={[tipRadius, 12, 12]} />
        <meshStandardMaterial color={colour} emissive={colour} emissiveIntensity={active ? 5 : 2.5} />
      </mesh>
      <mesh
        ref={hitRef}
        onPointerOver={(e) => { e.stopPropagation(); onHover(country.iso); }}
        onPointerOut={(e) => { e.stopPropagation(); onHover(null); }}
        onClick={(e) => { e.stopPropagation(); if (uiState.cardHover || uiState.dragMoved > 6) return; onSelect(country); }}
      >
        <sphereGeometry args={[tipRadius * 4, 6, 6]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
const Earth = forwardRef(({
  countries = [], // countries with content: { country, iso, lat, lon, projects, fotos }
  stars = [],
  globeTheme = DEFAULT_THEME,
  onThemeChange,
  onCountrySelect, // ({ country, iso, key, lat, lon, hasContent })
  onDeselect,
  onHover, // ({ name, iso, projects, fotos, hasContent } | null)
  selectedKey = null,
  showPins = true,
  showStars = true,
  autoRotate = true,
}, ref) => {
  const { camera, gl, size } = useThree();
  const world = useWorld();
  const groupRef = useRef();
  const starsRef = useRef();
  const [hoverKey, setHoverKey] = useState(null);
  const [hoveredStar, setHoveredStar] = useState(null);

  useImperativeHandle(ref, () => ({ getGlobe: () => groupRef.current }));

  const contentByKey = useMemo(() => new Map(countries.map((c) => [c.iso, c])), [countries]);
  const contentKeys = useMemo(() => new Set(countries.map((c) => c.iso)), [countries]);
  const worldByKey = useMemo(() => new Map((world?.countries ?? []).map((c) => [c.key, c])), [world]);

  // Camera distance when nothing is selected: the whole globe, never wider than the screen allows.
  const baseDist = useMemo(
    () => fitDistance({ globeRadius: WORLD_RADIUS, fovDeg: GLOBE_FOV, ndcRadius: Math.min(BASE_SILHOUETTE, 0.8 * (size.width / size.height)) }),
    [size.width, size.height],
  );

  // ── Motion state (refs: it changes every frame and must not re-render React) ──
  const initial = useMemo(() => viewFor(15, 22), []);
  const view = useRef({
    yaw: initial.yaw, pitch: initial.pitch, vYaw: 0, vPitch: 0,
    dist: baseDist, targetDist: baseDist, targetView: null,
    dragging: false, lastInteract: -10, focus: 0, now: 0,
  });
  const selectedRef = useRef(selectedKey);
  const hoverRef = useRef(hoverKey);
  selectedRef.current = selectedKey;
  hoverRef.current = hoverKey;

  // ── Selection → turn to the country and zoom in; deselection → zoom back out ──
  useEffect(() => {
    const v = view.current;
    if (!selectedKey) {
      v.targetView = null;
      v.targetDist = baseDist;
      v.lastInteract = v.now;
      return;
    }
    const wc = worldByKey.get(selectedKey);
    const content = contentByKey.get(selectedKey);
    const focus = wc ? focusOf(wc) : content ? { lon: content.lon, lat: content.lat, radius: 8 * DEG } : null;
    if (!focus) return;
    const m = frameMetrics(size.width, size.height);
    v.targetView = viewFor(focus.lon, focus.lat, v.yaw);
    v.targetDist = distanceForRadius(Math.max(focus.radius, 4 * DEG), {
      globeRadius: WORLD_RADIUS,
      fovDeg: GLOBE_FOV,
      targetNdc: (0.94 * m.openingRadius) / (size.height / 2), // fill the opening the polaroids frame
      min: WORLD_RADIUS + 0.55,
      max: 9.5,
    });
    v.vYaw = 0;
    v.vPitch = 0;
  }, [selectedKey, worldByKey, contentByKey, baseDist, size.width, size.height]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const v = view.current;
    v.now = state.clock.elapsedTime;

    if (v.dragging) v.lastInteract = v.now;
    else {
      if (v.targetView) {
        const k = 1 - Math.exp(-dt * 3.4);
        v.yaw += (v.targetView.yaw - v.yaw) * k;
        v.pitch += (v.targetView.pitch - v.pitch) * k;
        if (Math.abs(v.targetView.yaw - v.yaw) < 0.0008 && Math.abs(v.targetView.pitch - v.pitch) < 0.0008) v.targetView = null;
      } else {
        v.yaw += v.vYaw * dt;
        v.pitch = clamp(v.pitch + v.vPitch * dt, -MAX_PITCH, MAX_PITCH);
        const decay = Math.exp(-dt * 3.2);
        v.vYaw *= decay;
        v.vPitch *= decay;
        // Idle spin: only when nothing is selected, nobody is hovering or dragging, and it has been quiet a while.
        if (autoRotate && !selectedRef.current && hoverRef.current == null && v.now - v.lastInteract > IDLE_DELAY) {
          v.yaw += IDLE_SPEED * dt;
        }
      }
    }

    // Camera dolly + how "zoomed" we are (0 → 1) for things that must get out of the way.
    v.dist += (v.targetDist - v.dist) * (1 - Math.exp(-dt * 2.4));
    camera.position.set(0, 0, v.dist);
    v.focus += ((selectedRef.current ? 1 : 0) - v.focus) * (1 - Math.exp(-dt * 3));

    if (groupRef.current) groupRef.current.rotation.set(v.pitch, v.yaw, 0);
    if (starsRef.current) {
      starsRef.current.rotation.y += IDLE_SPEED * 0.35 * dt;
      starsRef.current.visible = v.focus < 0.05;
    }
  });

  // ── Dragging ──
  useEffect(() => {
    const el = gl.domElement;
    const v = view.current;
    let lastX = 0;
    let lastY = 0;
    let startX = 0;
    let startY = 0;
    let lastT = 0;

    const down = (e) => {
      if (e.button !== 0 || uiState.cardHover) return;
      v.dragging = true;
      v.targetView = null;
      v.vYaw = 0;
      v.vPitch = 0;
      lastX = startX = e.clientX;
      lastY = startY = e.clientY;
      lastT = performance.now();
      uiState.dragMoved = 0;
      el.style.cursor = 'grabbing';
    };
    const move = (e) => {
      if (!v.dragging) return;
      const k = DRAG_SPEED * (v.dist / 6);
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      const t = performance.now();
      const sec = Math.max(0.001, (t - lastT) / 1000);
      v.yaw += dx * k;
      v.pitch = clamp(v.pitch + dy * k, -MAX_PITCH, MAX_PITCH);
      // smoothed release velocity
      v.vYaw = v.vYaw * 0.6 + ((dx * k) / sec) * 0.4;
      v.vPitch = v.vPitch * 0.6 + ((dy * k) / sec) * 0.4;
      lastX = e.clientX;
      lastY = e.clientY;
      lastT = t;
      uiState.dragMoved = Math.hypot(e.clientX - startX, e.clientY - startY);
    };
    const up = () => {
      if (!v.dragging) return;
      v.dragging = false;
      v.lastInteract = v.now; // restart the idle timer
      if (performance.now() - lastT > 90) { v.vYaw = 0; v.vPitch = 0; } // a held pause is not a fling
      el.style.cursor = hoverRef.current ? 'pointer' : 'grab';
    };
    el.addEventListener('pointerdown', down);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => {
      el.removeEventListener('pointerdown', down);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
  }, [gl]);

  useEffect(() => { gl.domElement.style.cursor = hoverKey ? 'pointer' : 'grab'; }, [gl, hoverKey]);

  // ── Picking ──
  const pick = (e) => {
    if (!world || !groupRef.current) return null;
    const p = groupRef.current.worldToLocal(e.point.clone());
    const { lon, lat } = dirToLonLat(p.x, p.y, p.z);
    return findCountryAt(world.countries, lon, lat);
  };

  const select = (c) => {
    const content = contentByKey.get(c.key);
    const focus = c.polygons?.length ? focusOf(c) : { lat: 0, lon: 0 };
    onCountrySelect?.({
      country: content?.country ?? c.name,
      iso: c.iso,
      key: c.key,
      lat: content?.lat ?? focus.lat,
      lon: content?.lon ?? focus.lon,
      hasContent: !!content,
    });
  };

  const handleMove = (e) => {
    e.stopPropagation();
    if (uiState.cardHover || view.current.dragging) return;
    const c = pick(e);
    const key = c?.key ?? null;
    if (key !== hoverRef.current) setHoverKey(key);
  };
  const handleOut = () => { if (hoverRef.current != null && !view.current.dragging) setHoverKey(null); };
  const handleClick = (e) => {
    e.stopPropagation();
    if (uiState.cardHover || e.delta > 6 || uiState.dragMoved > 6) return;
    const c = pick(e);
    if (c) select(c);
    else if (selectedRef.current) onDeselect?.();
  };

  // Tell the page what is under the pointer (for its tooltip).
  useEffect(() => {
    if (!onHover) return;
    if (!hoverKey) { onHover(null); return; }
    const wc = worldByKey.get(hoverKey);
    const content = contentByKey.get(hoverKey);
    onHover({
      name: content?.country ?? wc?.name ?? hoverKey,
      iso: wc?.iso ?? content?.iso ?? null,
      projects: content?.projects?.length ?? 0,
      fotos: content?.fotos?.length ?? 0,
      hasContent: !!content,
    });
  }, [hoverKey, worldByKey, contentByKey, onHover]);

  const palette = GLOBE_THEMES[globeTheme] ?? GLOBE_THEMES[DEFAULT_THEME];
  const hoverCountry = hoverKey && hoverKey !== selectedKey ? worldByKey.get(hoverKey) : null;
  const selectedCountryObj = selectedKey ? worldByKey.get(selectedKey) : null;

  return (
    <>
      <group ref={groupRef} scale={GROUP_SCALE}>
        <Atmosphere theme={globeTheme} />
        <GlobeBody
          world={world}
          theme={globeTheme}
          contentKeys={contentKeys}
          onPointerMove={handleMove}
          onPointerOut={handleOut}
          onClick={handleClick}
        />
        {world && <CountryBorders lines={world.lines} theme={globeTheme} />}
        <CountryOverlay country={hoverCountry} color={palette.hover} fillOpacity={0.22} lineWidth={1.8} />
        <CountryOverlay country={selectedCountryObj} color={palette.select} fillOpacity={0.5} lineWidth={2.4} />

        {showPins && countries.map((country) => {
          if ((country.projects?.length || 0) + (country.fotos?.length || 0) === 0) return null;
          return (
            <Pin
              key={`pin-${country.iso}`}
              country={country}
              viewRef={view}
              isSelected={selectedKey === country.iso}
              isHovered={hoverKey === country.iso}
              onHover={setHoverKey}
              onSelect={() => select(worldByKey.get(country.iso) ?? { key: country.iso, name: country.country, iso: country.iso, polygons: [] })}
            />
          );
        })}
      </group>

      {/* Stars orbit — a separate group, not inside the globe group. They step aside while zoomed in. */}
      <group ref={starsRef}>
        {showStars && stars.map((star, idx) => {
          const r = 3.2 + (idx % 5) * 0.5;
          const phi = ((star.lat || 30) + 90) * (Math.PI / 180);
          const theta = ((star.lon || 0) + 180) * (Math.PI / 180);
          const pos = new Vector3(r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
          const hov = hoveredStar === idx;
          const col = hov ? '#00eeff' : '#88ccff';
          const sizeFactor = 0.55 + ((r - 3.2) / 2.5) * 0.9;
          const dotSize = 0.048 * sizeFactor * (hov ? 1.9 : 1);
          return (
            <group key={`star-${idx}`} position={pos.toArray()}>
              <mesh>
                <sphereGeometry args={[dotSize, 10, 10]} />
                <meshStandardMaterial color={col} emissive={col} emissiveIntensity={hov ? 5 : 2.5} transparent opacity={0.92} />
              </mesh>
              <mesh
                onPointerOver={(e) => { e.stopPropagation(); setHoveredStar(idx); }}
                onPointerOut={(e) => { e.stopPropagation(); setHoveredStar(null); }}
                onClick={(e) => { e.stopPropagation(); if (star.link) window.location.href = withBase(star.link); }}
              >
                <sphereGeometry args={[0.28, 6, 6]} />
                <meshBasicMaterial transparent opacity={0} depthWrite={false} />
              </mesh>
              {hov && star.title && (
                <Html center distanceFactor={7}>
                  <div className="star-tooltip" style={{ fontSize: `${(0.52 + sizeFactor * 0.26).toFixed(2)}rem` }}>
                    <span className="star-tooltip-title">{star.title}</span>
                  </div>
                </Html>
              )}
            </group>
          );
        })}
      </group>

      {/* Day / Neutral / Night */}
      <Html fullscreen>
        <div className="earth-theme-toggle">
          <div className="theme-toggle-container">
            <button className={`theme-btn ${globeTheme === 'day' ? 'active' : ''}`} onClick={() => onThemeChange?.('day')}>☀️ Day</button>
            <button className={`theme-btn ${globeTheme === 'neutral' ? 'active' : ''}`} onClick={() => onThemeChange?.('neutral')}>🌗 Neutral</button>
            <button className={`theme-btn ${globeTheme === 'night' ? 'active' : ''}`} onClick={() => onThemeChange?.('night')}>🌙 Night</button>
          </div>
        </div>
      </Html>
    </>
  );
});

Earth.displayName = 'Earth';
export default Earth;
