import React, { useRef, useState, useEffect, useMemo, forwardRef, useImperativeHandle } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { TextureLoader, ShaderMaterial, Vector2, Vector3, Quaternion } from 'three';
import * as solar from 'solar-calculator';
import { Html } from '@react-three/drei';
import { TEXTURES } from '../../assets/index.js';

// ── Shader ──────────────────────────────────────────────────────────────────
const dayNightShader = {
  vertexShader: `
    uniform float displaceAmount;
    uniform sampler2D normalMap;
    uniform float globalDisplacement;
    varying vec3 vNormal;
    varying vec2 vUv;
    varying vec3 vViewPosition;
    varying vec3 vWorldPosition;
    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPos.xyz;
      vec3 normalColor = texture2D(normalMap, uv).rgb;
      float height = (normalColor.r + normalColor.g + normalColor.b) / 3.0;
      vec3 newPosition = position + normal * (displaceAmount + (height * globalDisplacement));
      vec4 mvPosition = modelViewMatrix * vec4(newPosition, 1.0);
      vViewPosition = -mvPosition.xyz;
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    #define PI 3.141592653589793
    uniform sampler2D dayTexture;
    uniform sampler2D nightTexture;
    uniform sampler2D normalMap;
    uniform vec2 sunPosition;
    uniform vec2 globeRotation;
    uniform float normalScale;
    uniform float ambientLightIntensity;
    uniform float themeMode;
    varying vec3 vNormal;
    varying vec2 vUv;
    varying vec3 vViewPosition;
    varying vec3 vWorldPosition;
    float toRad(in float a) { return a * PI / 180.0; }
    vec3 Polar2Cartesian(in vec2 c) {
      float theta = toRad(90.0 - c.x);
      float phi   = toRad(90.0 - c.y);
      return vec3(sin(phi)*cos(theta), cos(phi), sin(phi)*sin(theta));
    }
    void main() {
      vec3 normalMapColor  = texture2D(normalMap, vUv).rgb;
      vec3 normalMapNormal = normalize(normalMapColor * 2.0 - 1.0);
      normalMapNormal.xy  *= normalScale;
      vec3 combinedNormal  = normalize(vNormal + normalMapNormal);
      float invLon = toRad(globeRotation.x);
      float invLat = -toRad(globeRotation.y);
      mat3 rotX = mat3(1,0,0, 0,cos(invLat),-sin(invLat), 0,sin(invLat),cos(invLat));
      mat3 rotY = mat3(cos(invLon),0,sin(invLon), 0,1,0, -sin(invLon),0,cos(invLon));
      vec3 rotatedSunDir = rotX * rotY * Polar2Cartesian(sunPosition);
      float intensity  = dot(combinedNormal, normalize(rotatedSunDir));
      vec4 dayColor   = texture2D(dayTexture,   vUv);
      vec4 nightColor = texture2D(nightTexture, vUv);
      float blendFactor = smoothstep(-0.1, 0.1, intensity);
      if      (themeMode > 1.5) blendFactor = 0.0;
      else if (themeMode > 0.5) blendFactor = 1.0;
      vec4 finalColor = mix(nightColor, dayColor, blendFactor);
      finalColor.rgb += ambientLightIntensity * 0.1;
      gl_FragColor = finalColor;
    }
  `
};

const sunPosAt = (dt) => {
  const day = new Date(+dt).setUTCHours(0, 0, 0, 0);
  const t   = solar.century(dt);
  const lon = (day - dt) / 864e5 * 360 - 180;
  return [lon - solar.equationOfTime(t) / 4, solar.declination(t)];
};

// Unit direction vector from lat/lon
const latLonToDir = (lat, lon) => {
  const phi   = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new Vector3(
    -(Math.sin(phi) * Math.cos(theta)),
    Math.cos(phi),
    Math.sin(phi) * Math.sin(theta)
  ).normalize();
};

// ═══════════════════════════════════════════════════════════════════════════
const Earth = forwardRef(({
  countries = [],
  stars     = [],
  globeTheme       = 'neutral',
  onThemeChange,
  onItemSelect,
  onCountrySelect,
  selectedCountry,
  selectedItem,
  onCountryHover,
  onCountryHoverEnd,
  continentPopHeight = 0,
  hoverPopHeight     = 0.4,
  animationSpeed     = 0.001,
  normalMapStrength  = 0,
  ambientBrightness  = 0.3,
  showPins   = true,
  showStars  = true,
  autoRotate = false,
}, ref) => {

  const globeRef     = useRef();
  const globeMeshRef = useRef();
  const starsRef     = useRef();

  const [hoveredPin,  setHoveredPin]  = useState(null);
  const [hoveredStar, setHoveredStar] = useState(null);

  const timeRef         = useRef(+new Date());
  const [globeRotation] = useState(new Vector2(0, 0));

  useImperativeHandle(ref, () => ({
    getGlobe:     () => globeRef.current,
    getGlobeMesh: () => globeMeshRef.current,
  }));

  const dayTexture   = useLoader(TextureLoader, TEXTURES.earth.day);
  const nightTexture = useLoader(TextureLoader, TEXTURES.earth.night);
  const normalMap    = useLoader(TextureLoader, TEXTURES.earth.normal);

  const material = useMemo(() => new ShaderMaterial({
    uniforms: {
      dayTexture:            { value: dayTexture   },
      nightTexture:          { value: nightTexture },
      normalMap:             { value: normalMap    },
      sunPosition:           { value: new Vector2()       },
      globeRotation:         { value: globeRotation       },
      displaceAmount:        { value: continentPopHeight  },
      normalScale:           { value: normalMapStrength   },
      ambientLightIntensity: { value: ambientBrightness   },
      globalDisplacement:    { value: hoverPopHeight      },
      themeMode:             { value: 0.0                 },
    },
    vertexShader:   dayNightShader.vertexShader,
    fragmentShader: dayNightShader.fragmentShader,
  }), [dayTexture, nightTexture, normalMap, globeRotation,
       continentPopHeight, normalMapStrength, ambientBrightness, hoverPopHeight]);

  useEffect(() => {
    if (!material) return;
    material.uniforms.themeMode.value =
      globeTheme === 'night' ? 2.0 : globeTheme === 'day' ? 1.0 : 0.0;
  }, [globeTheme, material]);

  useFrame((_, delta) => {
    const speedMult = globeTheme === 'neutral' ? 4 : 1;
    timeRef.current += delta * 1000 * 60 * speedMult;

    if (material) {
      const [lng, lat] = sunPosAt(timeRef.current);
      material.uniforms.sunPosition.value.set(lng, lat);
    }
    if (globeRef.current && autoRotate) globeRef.current.rotation.y += animationSpeed;
    if (starsRef.current)               starsRef.current.rotation.y  += animationSpeed * 0.4;
    if (globeRef.current) {
      globeRotation.set(
        (globeRef.current.rotation.y * 180 / Math.PI) % 360,
        (globeRef.current.rotation.x * 180 / Math.PI) % 360,
      );
    }
  });

  // Quaternion that rotates the cylinder's Y-axis to point along `dir`
  const alignToDir = (dir) => {
    const q = new Quaternion();
    q.setFromUnitVectors(new Vector3(0, 1, 0), dir.clone().normalize());
    return q;
  };

  return (
    <>
      {/* Globe group — scale 0.8 — pins are children so they auto-rotate */}
      <group ref={globeRef} scale={0.8}>

        <mesh ref={globeMeshRef}>
          <sphereGeometry args={[2, 128, 128]} />
          <primitive object={material} attach="material" />
        </mesh>

        {/* ── Country Pins ── */}
        {showPins && countries.map((country, ci) => {
          const numProjects = country.projects?.length || 0;
          const numFotos = country.fotos?.length || 0;
          const totalItems = numProjects + numFotos;
          
          if (totalItems === 0) return null;

          // Make the size differences highly significant.
          // The base radius of the globe is 2, so anything below 2.0 is inside the earth.
          const pinHeight = 2.2 + (totalItems * 0.15); 
          const stemRadius = 0.012 + (totalItems * 0.008);
          const tipRadius = 0.03 + (totalItems * 0.015);

          const dir = latLonToDir(country.lat, country.lon);
          const q   = alignToDir(dir);

          const midPos = dir.clone().multiplyScalar(pinHeight / 2);  
          const tipPos = dir.clone().multiplyScalar(pinHeight);      

          const isSelected = selectedCountry === country.country;
          const isHovered  = hoveredPin === country.country;

          const col = isSelected ? '#4d9eff' : isHovered ? '#ffffff' : '#4ECDC4';
          const stemEmissive = isSelected || isHovered ? 2.0 : 0.8;
          const tipEmissive  = isSelected || isHovered ? 5.0 : 2.5;
          const tipScale     = isSelected || isHovered ? 1.4 : 1.0;

          return (
            <group key={`country-pin-${ci}`}>
              
              {/* ── STEM: starts from center (0,0,0) ── */}
              {/* Note: Standard depth buffer applies, so the bottom half inside the sphere is hidden */}
              <mesh
                position={midPos.toArray()}
                quaternion={q}
              >
                <cylinderGeometry args={[stemRadius, stemRadius, pinHeight, 8]} />
                <meshStandardMaterial
                  color={col}
                  emissive={col}
                  emissiveIntensity={stemEmissive}
                />
              </mesh>

              {/* ── TIP: glowing sphere resting on top of the stem ── */}
              <mesh
                position={tipPos.toArray()}
                scale={tipScale}
              >
                <sphereGeometry args={[tipRadius, 12, 12]} />
                <meshStandardMaterial
                  color={col}
                  emissive={col}
                  emissiveIntensity={tipEmissive}
                />
              </mesh>

              {/* ── HITBOX: larger invisible sphere at the tip ── */}
              <mesh
                position={tipPos.toArray()}
                onPointerOver={e => {
                  e.stopPropagation();
                  setHoveredPin(country.country);
                  onCountryHover?.(country);
                }}
                onPointerOut={e => {
                  e.stopPropagation();
                  setHoveredPin(null);
                  onCountryHoverEnd?.();
                }}
                onClick={e => {
                  e.stopPropagation();
                  onCountrySelect?.(country);
                }}
              >
                <sphereGeometry args={[tipRadius * 4, 6, 6]} />
                <meshBasicMaterial transparent opacity={0} depthWrite={false} />
              </mesh>

              {/* ── TOOLTIP ── */}
              {isHovered && (
                <Html
                  position={[tipPos.x, tipPos.y + (tipRadius * 4), tipPos.z]}
                  center
                  distanceFactor={5.5}
                  zIndexRange={[200, 100]}
                >
                  <div className="country-tooltip">
                    <img
                      className="country-flag"
                      src={`https://flagcdn.com/w80/${country.iso}.png`}
                      alt={country.country}
                      onError={e => e.target.style.display = 'none'}
                    />
                    <div className="country-tooltip-body">
                      <span className="country-tooltip-name">{country.country}</span>
                      <span className="country-tooltip-stat" style={{ color: '#FF6B6B' }}>
                        📐 {numProjects} {numProjects === 1 ? 'project' : 'projects'}
                      </span>
                      <span className="country-tooltip-stat" style={{ color: '#4ECDC4' }}>
                        📷 {numFotos} {numFotos === 1 ? 'snap' : 'snaps'}
                      </span>
                    </div>
                  </div>
                </Html>
              )}
            </group>
          );
        })}

      </group>

      {/* Stars orbit — separate group, not inside globe group */}
      <group ref={starsRef}>
        {showStars && stars.map((star, idx) => {
          const r     = 3.2 + (idx % 5) * 0.5;
          const phi   = ((star.lat || 30) + 90)  * (Math.PI / 180);
          const theta = ((star.lon ||  0) + 180) * (Math.PI / 180);
          const pos   = new Vector3(
            r * Math.sin(phi) * Math.cos(theta),
            r * Math.cos(phi),
            r * Math.sin(phi) * Math.sin(theta)
          );

          const hov        = hoveredStar === idx;
          const col        = hov ? '#00eeff' : '#88ccff';
          const sizeFactor = 0.55 + ((r - 3.2) / 2.5) * 0.9;
          const dotSize    = 0.048 * sizeFactor * (hov ? 1.9 : 1);

          return (
            <group key={`star-${idx}`} position={pos.toArray()}>
              <mesh>
                <sphereGeometry args={[dotSize, 10, 10]} />
                <meshStandardMaterial
                  color={col} emissive={col}
                  emissiveIntensity={hov ? 5 : 2.5}
                  transparent opacity={0.92}
                />
              </mesh>

              {/* Wide hitbox */}
              <mesh
                onPointerOver={e => { e.stopPropagation(); setHoveredStar(idx); }}
                onPointerOut={e  => { e.stopPropagation(); setHoveredStar(null); }}
                onClick={e => { e.stopPropagation(); if (star.link) window.location.href = star.link; }}
              >
                <sphereGeometry args={[0.28, 6, 6]} />
                <meshBasicMaterial transparent opacity={0} depthWrite={false} />
              </mesh>

              {/* Star Tooltip */}
              {hov && star.title && (
                <Html center distanceFactor={7}>
                  <div
                    className="star-tooltip"
                    style={{ fontSize: `${(0.52 + sizeFactor * 0.26).toFixed(2)}rem` }}
                  >
                    <span className="star-tooltip-title">{star.title}</span>
                  </div>
                </Html>
              )}
            </group>
          );
        })}
      </group>

      {/* Day/Night toggle */}
      <Html fullscreen>
        <div className="earth-theme-toggle">
          <div className="theme-toggle-container">
            <button className={`theme-btn ${globeTheme === 'day'     ? 'active' : ''}`} onClick={() => onThemeChange?.('day')}>☀️ Day</button>
            <button className={`theme-btn ${globeTheme === 'neutral' ? 'active' : ''}`} onClick={() => onThemeChange?.('neutral')}>🌗 Neutral</button>
            <button className={`theme-btn ${globeTheme === 'night'   ? 'active' : ''}`} onClick={() => onThemeChange?.('night')}>🌙 Night</button>
          </div>
        </div>
      </Html>
    </>
  );
});

Earth.displayName = 'Earth';
export default Earth;