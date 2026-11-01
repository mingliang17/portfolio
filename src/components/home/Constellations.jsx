// src/components/home/Constellations.jsx
//
// The constellations that drift around the globe. They lie flat on a plane behind it (facing the camera) and the
// whole ring turns anticlockwise in 2D (Earth.jsx drives the rotation). Each one is:
//   - stars: soft round points that glow (additive), a little brighter for brighter stars, gently twinkling
//   - lines: thin, glowing links between stars
//   - a faint halo of light around the whole figure
//   - an invisible hit disc, so it can be hovered and clicked like a country
// Those with projects / snaps glow warm and can be opened; the others glow cool and can only be hovered.
//
// Layout and sizes come from src/globe/constellationRing.js; the shapes from src/constants/constellations.js.

import React, { forwardRef, useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { AdditiveBlending, BufferGeometry, CanvasTexture, Color, Float32BufferAttribute, LineBasicMaterial, MeshBasicMaterial, ShaderMaterial } from 'three';
import { uiState } from '@/globe/uiState.js';
import { PLANE_Z, localRadius } from '@/globe/constellationRing.js';

const STAR_VERT = /* glsl */ `
  attribute float aSize;
  attribute float aPhase;
  uniform float uPx;
  uniform float uBoost;
  uniform float uTime;
  varying float vTwinkle;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    vTwinkle = 0.86 + 0.14 * sin(uTime * 1.4 + aPhase);
    gl_PointSize = (22.0 + aSize * 24.0) * uPx * uBoost * vTwinkle;
  }
`;
const STAR_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uAlpha;
  varying float vTwinkle;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float core = smoothstep(0.1, 0.0, d);          // the bright point
    float halo = exp(-d * d * 24.0) * 0.55;         // the light around it
    gl_FragColor = vec4(uColor, clamp(core + halo, 0.0, 1.0) * uAlpha * vTwinkle);
  }
`;

let glowTexture = null;
const getGlowTexture = () => {
  if (glowTexture || typeof document === 'undefined') return glowTexture;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255,255,255,0.85)');
  grad.addColorStop(0.4, 'rgba(255,255,255,0.22)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  glowTexture = new CanvasTexture(c);
  return glowTexture;
};

const WARM = new Color('#ffe3a8');
const COOL = new Color('#b4cdff');
const GOLD = new Color('#fff1c2');
const HALO_WARM = new Color('#ffc766');
const HALO_COOL = new Color('#6f9bff');
const _c = new Color();

const Constellation = ({ entry, item, hovered, selected, onHover, onSelect }) => {
  const hasContent = (entry.projects?.length || 0) + (entry.fotos?.length || 0) > 0;
  const gl = useThree((s) => s.gl);
  const lr = useMemo(() => localRadius(entry), [entry]);
  const motion = useRef({ h: 0, s: 0 });

  const { starGeo, lineGeo, starMat, lineMat, glowMat } = useMemo(() => {
    const n = entry.stars.length;
    const pos = new Float32Array(n * 3);
    const size = new Float32Array(n);
    const phase = new Float32Array(n);
    entry.stars.forEach((s, i) => {
      pos.set([s[0], s[1], 0], i * 3);
      size[i] = s[2];
      phase[i] = i * 1.7 + entry.id.length;
    });
    const starGeo = new BufferGeometry();
    starGeo.setAttribute('position', new Float32BufferAttribute(pos, 3));
    starGeo.setAttribute('aSize', new Float32BufferAttribute(size, 1));
    starGeo.setAttribute('aPhase', new Float32BufferAttribute(phase, 1));

    const seg = [];
    for (const [a, b] of entry.lines) seg.push(entry.stars[a][0], entry.stars[a][1], 0, entry.stars[b][0], entry.stars[b][1], 0);
    const lineGeo = new BufferGeometry();
    lineGeo.setAttribute('position', new Float32BufferAttribute(seg, 3));

    return {
      starGeo,
      lineGeo,
      starMat: new ShaderMaterial({
        vertexShader: STAR_VERT,
        fragmentShader: STAR_FRAG,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        uniforms: { uColor: { value: new Color() }, uBoost: { value: 1 }, uAlpha: { value: 1 }, uPx: { value: gl.getPixelRatio() }, uTime: { value: 0 } },
      }),
      lineMat: new LineBasicMaterial({ transparent: true, depthWrite: false, blending: AdditiveBlending }),
      glowMat: new MeshBasicMaterial({ map: getGlowTexture(), transparent: true, depthWrite: false, blending: AdditiveBlending }),
    };
  }, [entry, gl]);

  useEffect(() => () => { starGeo.dispose(); lineGeo.dispose(); starMat.dispose(); lineMat.dispose(); glowMat.dispose(); }, [starGeo, lineGeo, starMat, lineMat, glowMat]);

  useFrame((state, delta) => {
    const m = motion.current;
    const k = 1 - Math.exp(-Math.min(delta, 0.05) * 6);
    m.h += ((hovered ? 1 : 0) - m.h) * k;
    m.s += ((selected ? 1 : 0) - m.s) * k;
    const lift = Math.max(m.h * 0.6, m.s);

    _c.copy(hasContent ? WARM : COOL).lerp(GOLD, lift);
    starMat.uniforms.uColor.value.copy(_c);
    starMat.uniforms.uBoost.value = (hasContent ? 1.08 : 0.95) + 0.3 * m.h + 0.45 * m.s;
    starMat.uniforms.uAlpha.value = (hasContent ? 0.95 : 0.7) + 0.25 * lift;
    starMat.uniforms.uTime.value = state.clock.elapsedTime;

    lineMat.color.copy(_c);
    lineMat.opacity = (hasContent ? 0.5 : 0.3) + 0.3 * m.h + 0.3 * m.s;

    glowMat.color.copy(hasContent ? HALO_WARM : HALO_COOL).lerp(GOLD, m.s * 0.5);
    glowMat.opacity = (hasContent ? 0.2 : 0.11) + 0.2 * m.h + 0.25 * m.s;
  });

  const [x, y] = [item.ringR * Math.cos(item.angle), item.ringR * Math.sin(item.angle)];
  return (
    <group position={[x, y, 0]}>
      <group scale={item.scale}>
        <mesh material={glowMat} renderOrder={-2}>
          <planeGeometry args={[lr * 3.6, lr * 3.6]} />
        </mesh>
        <lineSegments geometry={lineGeo} material={lineMat} frustumCulled={false} />
        <points geometry={starGeo} material={starMat} frustumCulled={false} />
        {/* The invisible hit disc. */}
        <mesh
          onPointerOver={(e) => { e.stopPropagation(); onHover(entry.key); }}
          onPointerOut={(e) => { e.stopPropagation(); onHover(null); }}
          onClick={(e) => {
            e.stopPropagation();
            if (uiState.cardHover || e.delta > 6 || uiState.dragMoved > 6) return;
            onSelect(entry);
          }}
        >
          <circleGeometry args={[lr * 1.2, 28]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      </group>
    </group>
  );
};

/** The ring of constellations; `ref` is the group Earth turns about +Z. */
const ConstellationRing = forwardRef(({ entries, layout, hoverKey, selectedKey, onHover, onSelect }, ref) => (
  <group ref={ref} position={[0, 0, PLANE_Z]}>
    {layout.items.map((item, i) => (
      <Constellation
        key={item.key}
        entry={entries[i]}
        item={item}
        hovered={hoverKey === item.key}
        selected={selectedKey === item.key}
        onHover={onHover}
        onSelect={onSelect}
      />
    ))}
  </group>
));
ConstellationRing.displayName = 'ConstellationRing';

export default ConstellationRing;
