// src/components/home/globe/GlobeParts.jsx
//
// The pieces the vector globe is made of (all drawn by us, from our own country data):
//   GlobeBody       the sphere: ocean gradient + land fill (a canvas texture) + faint graticule + rim light
//   Atmosphere      the soft glow around the limb
//   CountryBorders  every border and coastline, as crisp fixed-width lines
//   CountryOverlay  a country filled and outlined on top of the globe (hover / selected)
import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import {
  ShaderMaterial, CanvasTexture, BufferGeometry, BufferAttribute, Vector3,
  BackSide, AdditiveBlending, DoubleSide, LinearFilter, LinearMipmapLinearFilter, RepeatWrapping, NoColorSpace,
} from 'three';
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';

import { drawLand } from '@/globe/landCanvas.js';
import { lineToSegments } from '@/globe/geo.js';
import { tessellateCountry } from '@/globe/tessellate.js';
import { GLOBE_THEMES, hexToRgb } from '@/globe/themes.js';
import { GLOBE_RADIUS } from '@/globe/constants.js';

const TEXTURE_W = 4096;
const TEXTURE_H = 2048;

// ── Body ─────────────────────────────────────────────────────────────────────────────────────
const bodyVertex = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormalView;
  varying vec3 vToCamera;
  void main() {
    vUv = uv;
    vNormalView = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vToCamera = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

// Longitude wraps from 1 back to 0 at the texture seam, which makes the GPU's mip/derivative estimate jump and
// draws a seam line. We fix the derivatives by hand and sample with textureGrad.
const bodyFragment = /* glsl */ `
  uniform sampler2D landMap;
  uniform vec3 oceanCenter;
  uniform vec3 oceanEdge;
  uniform vec3 rimColor;
  uniform vec3 gratColor;
  uniform float gratAlpha;
  uniform float landFade;
  varying vec2 vUv;
  varying vec3 vNormalView;
  varying vec3 vToCamera;

  void main() {
    float facing = clamp(dot(normalize(vNormalView), normalize(vToCamera)), 0.0, 1.0);

    vec2 dx = dFdx(vUv);
    vec2 dy = dFdy(vUv);
    if (abs(dx.x) > 0.5) dx.x -= sign(dx.x);
    if (abs(dy.x) > 0.5) dy.x -= sign(dy.x);

    vec3 ocean = mix(oceanEdge, oceanCenter, pow(facing, 0.65));

    // The texture is premultiplied, so land.rgb already includes its alpha.
    vec4 land = textureGrad(landMap, vUv, dx, dy) * landFade;
    float shade = 0.72 + 0.28 * pow(facing, 0.8);
    vec3 col = ocean * (1.0 - land.a) + land.rgb * shade;

    // Graticule every 15°, anti-aliased by the (corrected) derivatives.
    vec2 g = vec2(vUv.x * 24.0, vUv.y * 12.0);
    vec2 fw = (abs(dx) + abs(dy)) * vec2(24.0, 12.0);
    vec2 gd = abs(fract(g - 0.5) - 0.5) / max(fw, vec2(1e-5));
    float grat = 1.0 - min(min(gd.x, gd.y), 1.0);
    col = mix(col, gratColor, grat * gratAlpha * mix(1.0, 0.45, land.a));

    col += rimColor * pow(1.0 - facing, 3.0) * 0.55;
    gl_FragColor = vec4(col, 1.0);
  }
`;

export function GlobeBody({ world, theme, contentKeys, landFadeTarget = 1, ...pointerProps }) {
  const gl = useThree((s) => s.gl);
  const canvas = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = TEXTURE_W;
    c.height = TEXTURE_H;
    return c;
  }, []);

  const texture = useMemo(() => {
    const t = new CanvasTexture(canvas);
    t.colorSpace = NoColorSpace; // raw sRGB values, the shader outputs them untouched
    t.premultiplyAlpha = true; // so mip-mapping does not darken coastlines
    t.wrapS = RepeatWrapping;
    t.minFilter = LinearMipmapLinearFilter;
    t.magFilter = LinearFilter;
    t.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
    return t;
  }, [canvas, gl]);

  const material = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          landMap: { value: texture },
          oceanCenter: { value: new Vector3() },
          oceanEdge: { value: new Vector3() },
          rimColor: { value: new Vector3() },
          gratColor: { value: new Vector3() },
          gratAlpha: { value: 0.1 },
          landFade: { value: 0 },
        },
        vertexShader: bodyVertex,
        fragmentShader: bodyFragment,
      }),
    [texture],
  );

  const palette = GLOBE_THEMES[theme] ?? GLOBE_THEMES.neutral;

  // Colours for the shader.
  useEffect(() => {
    const u = material.uniforms;
    u.oceanCenter.value.set(...hexToRgb(palette.oceanCenter));
    u.oceanEdge.value.set(...hexToRgb(palette.oceanEdge));
    u.rimColor.value.set(...hexToRgb(palette.rim));
    u.gratColor.value.set(...hexToRgb(palette.graticule));
    u.gratAlpha.value = palette.graticuleAlpha;
  }, [material, palette]);

  // Repaint the land when the world loads or the theme changes.
  useEffect(() => {
    if (!world) return;
    drawLand(canvas.getContext('2d'), world.countries, {
      width: TEXTURE_W,
      height: TEXTURE_H,
      fill: palette.land,
      contentFill: palette.landContent,
      contentKeys,
    });
    texture.needsUpdate = true;
  }, [world, palette, contentKeys, canvas, texture]);

  // Land fades in once the data is there.
  useFrame((_, dt) => {
    const u = material.uniforms.landFade;
    const target = world ? landFadeTarget : 0;
    u.value += (target - u.value) * (1 - Math.exp(-dt * 3));
  });

  useEffect(() => () => { texture.dispose(); material.dispose(); }, [texture, material]);

  return (
    <mesh {...pointerProps}>
      <sphereGeometry args={[GLOBE_RADIUS, 128, 96]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

// ── Atmosphere ───────────────────────────────────────────────────────────────────────────────
export function Atmosphere({ theme }) {
  const palette = GLOBE_THEMES[theme] ?? GLOBE_THEMES.neutral;
  const material = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: { glow: { value: new Vector3(0.4, 0.6, 1) } },
        vertexShader: `varying vec3 vN; void main(){ vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: `uniform vec3 glow; varying vec3 vN; void main(){ float i = pow(max(0.0, 0.72 - dot(vN, vec3(0.0, 0.0, 1.0))), 3.0); gl_FragColor = vec4(glow, 1.0) * i; }`,
        side: BackSide,
        blending: AdditiveBlending,
        transparent: true,
        depthWrite: false,
      }),
    [],
  );
  useEffect(() => { material.uniforms.glow.value.set(...hexToRgb(palette.rim)); }, [material, palette]);
  useEffect(() => () => material.dispose(), [material]);
  return (
    <mesh scale={1.16} raycast={() => null}>
      <sphereGeometry args={[GLOBE_RADIUS, 64, 48]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

// ── Borders and coastlines ───────────────────────────────────────────────────────────────────
const BORDER_RADIUS = GLOBE_RADIUS * 1.0018;

function useLineObject(positions) {
  return useMemo(() => {
    if (!positions || positions.length === 0) return null;
    const geometry = new LineSegmentsGeometry();
    geometry.setPositions(positions);
    const material = new LineMaterial({ linewidth: 1, transparent: true, depthWrite: false });
    const line = new LineSegments2(geometry, material);
    line.frustumCulled = false;
    return line;
  }, [positions]);
}

export function CountryBorders({ lines, theme }) {
  const size = useThree((s) => s.size);
  const palette = GLOBE_THEMES[theme] ?? GLOBE_THEMES.neutral;

  const { borders, coasts } = useMemo(() => {
    const b = [];
    const c = [];
    for (const line of lines ?? []) lineToSegments(line.coords, BORDER_RADIUS, 1, line.kind === 'border' ? b : c);
    return { borders: Float32Array.from(b), coasts: Float32Array.from(c) };
  }, [lines]);

  const borderLine = useLineObject(borders);
  const coastLine = useLineObject(coasts);

  useEffect(() => {
    for (const [obj, width, alpha] of [[borderLine, 1.25, palette.borderAlpha], [coastLine, 1.05, palette.coastAlpha]]) {
      if (!obj) continue;
      obj.material.color.set(palette.border);
      obj.material.opacity = alpha;
      obj.material.linewidth = width;
      obj.material.resolution.set(size.width, size.height);
      obj.renderOrder = 3;
    }
  }, [borderLine, coastLine, palette, size]);

  useEffect(() => () => {
    for (const obj of [borderLine, coastLine]) { obj?.geometry.dispose(); obj?.material.dispose(); }
  }, [borderLine, coastLine]);

  return (
    <>
      {coastLine && <primitive object={coastLine} />}
      {borderLine && <primitive object={borderLine} />}
    </>
  );
}

// ── Highlight overlay ────────────────────────────────────────────────────────────────────────
const OVERLAY_RADIUS = GLOBE_RADIUS * 1.0009;
const OUTLINE_RADIUS = GLOBE_RADIUS * 1.0026;
const overlayCache = new Map(); // country key → { fill: BufferGeometry, outline: Float32Array }

function overlayFor(country) {
  let entry = overlayCache.get(country.key);
  if (!entry) {
    const fill = new BufferGeometry();
    fill.setAttribute('position', new BufferAttribute(tessellateCountry(country, OVERLAY_RADIUS, 2), 3));
    const outline = [];
    for (const poly of country.polygons) for (const ring of poly.rings) lineToSegments(ring, OUTLINE_RADIUS, 1, outline);
    entry = { fill, outline: Float32Array.from(outline) };
    overlayCache.set(country.key, entry);
  }
  return entry;
}

/** A country filled + outlined on the globe. Fades in whenever `country` changes. */
export function CountryOverlay({ country, color = '#ffffff', fillOpacity = 0.25, lineWidth = 1.8, lineOpacity = 1 }) {
  const size = useThree((s) => s.size);
  const entry = useMemo(() => (country ? overlayFor(country) : null), [country]);
  const fillRef = useRef();
  const fade = useRef(0);

  const outline = useLineObject(entry?.outline);
  useEffect(() => {
    if (!outline) return;
    outline.material.color.set(color);
    outline.material.linewidth = lineWidth;
    outline.material.resolution.set(size.width, size.height);
    outline.renderOrder = 4;
  }, [outline, color, lineWidth, size]);
  useEffect(() => () => { outline?.geometry.dispose(); outline?.material.dispose(); }, [outline]);

  useEffect(() => { fade.current = 0; }, [country]);
  useFrame((_, dt) => {
    fade.current = Math.min(1, fade.current + dt * 5);
    if (fillRef.current) fillRef.current.opacity = fillOpacity * fade.current;
    if (outline) outline.material.opacity = lineOpacity * fade.current;
  });

  if (!entry) return null;
  return (
    <>
      <mesh geometry={entry.fill} renderOrder={2} raycast={() => null}>
        <meshBasicMaterial ref={fillRef} color={color} transparent opacity={0} depthWrite={false} side={DoubleSide} toneMapped={false} polygonOffset polygonOffsetFactor={-2} />
      </mesh>
      {outline && <primitive object={outline} />}
    </>
  );
}
