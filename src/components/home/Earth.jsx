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
    uniform vec3 hoverPoint;
    uniform float hoverRadius;
    uniform float maxDisplacement;
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
      float dist = distance(normalize(worldPos.xyz), normalize(hoverPoint));
      float influence = smoothstep(hoverRadius, 0.0, dist);
      float localDisplace = height * maxDisplacement * influence;
      vec3 newPosition = position + normal * (displaceAmount + localDisplace);
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
    uniform float nightMode;
    varying vec3 vNormal;
    varying vec2 vUv;
    varying vec3 vViewPosition;
    varying vec3 vWorldPosition;
    float toRad(in float a) { return a * PI / 180.0; }
    vec3 Polar2Cartesian(in vec2 c) {
      float theta = toRad(90.0 - c.x);
      float phi = toRad(90.0 - c.y);
      return vec3(sin(phi)*cos(theta), cos(phi), sin(phi)*sin(theta));
    }
    void main() {
      vec3 normalMapColor = texture2D(normalMap, vUv).rgb;
      vec3 normalMapNormal = normalize(normalMapColor * 2.0 - 1.0);
      normalMapNormal.xy *= normalScale;
      vec3 combinedNormal = normalize(vNormal + normalMapNormal);
      float invLon = toRad(globeRotation.x);
      float invLat = -toRad(globeRotation.y);
      mat3 rotX = mat3(1,0,0, 0,cos(invLat),-sin(invLat), 0,sin(invLat),cos(invLat));
      mat3 rotY = mat3(cos(invLon),0,sin(invLon), 0,1,0, -sin(invLon),0,cos(invLon));
      vec3 rotatedSunDir = rotX * rotY * Polar2Cartesian(sunPosition);
      float intensity = dot(combinedNormal, normalize(rotatedSunDir));
      vec4 dayColor = texture2D(dayTexture, vUv);
      vec4 nightColor = texture2D(nightTexture, vUv);
      // nightMode=1 → full night texture; nightMode=0 → normal day/night blend
      float blendFactor = mix(smoothstep(-0.1, 0.1, intensity), 0.0, nightMode);
      vec4 finalColor = mix(nightColor, dayColor, blendFactor);
      finalColor.rgb += ambientLightIntensity * 0.1;
      gl_FragColor = finalColor;
    }
  `
};

const sunPosAt = (dt) => {
  const day = new Date(+dt).setUTCHours(0, 0, 0, 0);
  const t = solar.century(dt);
  const longitude = (day - dt) / 864e5 * 360 - 180;
  return [longitude - solar.equationOfTime(t) / 4, solar.declination(t)];
};

const latLonToVec3 = (lat, lon, radius) => {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new Vector3(
    -(radius * Math.sin(phi) * Math.cos(theta)),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
};

// ── Component ────────────────────────────────────────────────────────────────
const Earth = forwardRef(({
  countries = [],           // Array of { country, iso, lat, lon, projects:[], fotos:[] }
  stars = [],               // Star nav points { title, description, lat, lon, link }
  isDayMode = true,         // Day/Night toggle from parent
  onDayNightToggle,         // Callback to flip day/night
  onCountrySelect,          // Callback when country pin clicked
  onCountryHover,           // Callback when country pin hovered
  onCountryHoverEnd,        // Callback when country pin unhovered

  // Visual
  continentPopHeight = 0,
  hoverPopHeight = 0.4,
  hoverRadius = 0.3,
  animationSpeed = 0.001,
  normalMapStrength = 0,
  ambientBrightness = 0.3,

  // Pins
  pinColor = '#ffdd88',
  pinHoverColor = '#ffaa00',
  pinBaseRadius = 1.85,
  pinLength = 0.38,
  pinThickness = 0.008,
  pinTipSize = 0.042,
  showPins = true,

  // Stars
  starColor = '#88ccff',
  starHoverColor = '#00eeff',
  starSize = 0.18,
  showStars = true,

  // Controls
  autoRotate = false,
  onAutoRotateChange,
}, ref) => {

  const globeRef = useRef();
  const globeMeshRef = useRef();
  const [hoveredPin, setHoveredPin] = useState(null);
  const [hoveredStar, setHoveredStar] = useState(null);
  const [dt, setDt] = useState(+new Date());
  const [globeRotation] = useState(new Vector2(0, 0));

  const [localContinentHeight] = useState(continentPopHeight);
  const [localHoverHeight] = useState(hoverPopHeight);
  const [localHoverRadius] = useState(hoverRadius);
  const [localNormalStrength] = useState(normalMapStrength);

  useImperativeHandle(ref, () => ({
    getGlobe: () => globeRef.current,
    getGlobeMesh: () => globeMeshRef.current,
  }));

  const dayTexture = useLoader(TextureLoader, TEXTURES.earth.day);
  const nightTexture = useLoader(TextureLoader, TEXTURES.earth.night);
  const normalMap = useLoader(TextureLoader, TEXTURES.earth.normal);

  const material = useMemo(() => new ShaderMaterial({
    uniforms: {
      dayTexture: { value: dayTexture },
      nightTexture: { value: nightTexture },
      normalMap: { value: normalMap },
      sunPosition: { value: new Vector2() },
      globeRotation: { value: globeRotation },
      displaceAmount: { value: localContinentHeight },
      normalScale: { value: localNormalStrength },
      ambientLightIntensity: { value: ambientBrightness },
      hoverPoint: { value: new Vector3(0, 0, 0) },
      hoverRadius: { value: localHoverRadius },
      maxDisplacement: { value: localHoverHeight },
      nightMode: { value: isDayMode ? 0.0 : 1.0 },
    },
    vertexShader: dayNightShader.vertexShader,
    fragmentShader: dayNightShader.fragmentShader,
  }), [dayTexture, nightTexture, normalMap, globeRotation]);

  // Update nightMode uniform when prop changes
  useEffect(() => {
    if (material) material.uniforms.nightMode.value = isDayMode ? 0.0 : 1.0;
  }, [isDayMode, material]);

  // Advance time slowly (or freeze — user can pause via toggle)
  useEffect(() => {
    const interval = setInterval(() => setDt(d => d + 60 * 1000), 200);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (material) {
      const [lng, lat] = sunPosAt(dt);
      material.uniforms.sunPosition.value.set(lng, lat);
    }
  }, [dt, material]);

  useFrame(() => {
    if (globeRef.current && autoRotate) globeRef.current.rotation.y += animationSpeed;
    if (globeRef.current) {
      globeRotation.set(
        (globeRef.current.rotation.y * 180 / Math.PI) % 360,
        (globeRef.current.rotation.x * 180 / Math.PI) % 360
      );
    }
  });

  const alignCylinder = (dir) => {
    const q = new Quaternion();
    q.setFromUnitVectors(new Vector3(0, 1, 0), dir.clone().normalize());
    return q;
  };

  return (
    <>
      <group ref={globeRef}>
        {/* Globe mesh */}
        <mesh
          ref={globeMeshRef}
          onPointerMove={e => {
            if (e.intersections[0] && material)
              material.uniforms.hoverPoint.value.copy(e.intersections[0].point);
          }}
        >
          <sphereGeometry args={[2, 128, 128]} />
          <primitive object={material} attach="material" />
        </mesh>

        {/* ── Country Pins ── */}
        {showPins && countries.map((country, idx) => {
          const dir = latLonToVec3(country.lat, country.lon, 1).normalize();
          const basePos = dir.clone().multiplyScalar(pinBaseRadius);
          const tipPos  = dir.clone().multiplyScalar(pinBaseRadius + pinLength);
          const midPos  = dir.clone().multiplyScalar(pinBaseRadius + pinLength / 2);
          const q = alignCylinder(dir);
          const hov = hoveredPin === idx;
          const hasItems = (country.projects?.length || 0) + (country.fotos?.length || 0) > 0;
          const col = hov ? pinHoverColor : hasItems ? pinColor : '#aaaaaa';

          return (
            <group key={`country-${idx}`}>
              {/* Invisible large hitbox */}
              <mesh
                position={tipPos.toArray()}
                onPointerOver={e => { e.stopPropagation(); setHoveredPin(idx); if (onCountryHover) onCountryHover(country); }}
                onPointerOut={e => { e.stopPropagation(); setHoveredPin(null); if (onCountryHoverEnd) onCountryHoverEnd(); }}
                onClick={e => { e.stopPropagation(); if (onCountrySelect) onCountrySelect(country); }}
              >
                <sphereGeometry args={[0.18, 8, 8]} />
                <meshBasicMaterial transparent opacity={0} depthWrite={false} />
              </mesh>

              {/* Stem */}
              <mesh position={midPos.toArray()} quaternion={q}>
                <cylinderGeometry args={[pinThickness, pinThickness, pinLength, 8]} />
                <meshStandardMaterial color={col} emissive={col} emissiveIntensity={0.5} />
              </mesh>

              {/* Tip sphere */}
              <mesh position={tipPos.toArray()} scale={hov ? 2.0 : 1}>
                <sphereGeometry args={[pinTipSize, 16, 16]} />
                <meshStandardMaterial color={col} emissive={col} emissiveIntensity={hov ? 2.0 : 0.8} />
              </mesh>

              {/* Glow ring when hovered */}
              {hov && (
                <mesh position={tipPos.toArray()}>
                  <ringGeometry args={[pinTipSize * 1.8, pinTipSize * 3.2, 32]} />
                  <meshBasicMaterial color={col} transparent opacity={0.4} side={2} />
                </mesh>
              )}

              {/* Country tooltip */}
              {hov && (
                <Html position={[tipPos.x, tipPos.y + 0.28, tipPos.z]} center distanceFactor={5.5} zIndexRange={[200, 0]}>
                  <div className="country-tooltip">
                    <img
                      className="country-flag"
                      src={`https://flagcdn.com/w80/${country.iso}.png`}
                      alt={country.country}
                      onError={e => e.target.style.display = 'none'}
                    />
                    <div className="country-tooltip-body">
                      <span className="country-tooltip-name">{country.country}</span>
                      <span className="country-tooltip-stat">📐 {country.projects?.length || 0} projects</span>
                      <span className="country-tooltip-stat">📷 {country.fotos?.length || 0} snaps</span>
                    </div>
                  </div>
                </Html>
              )}
            </group>
          );
        })}
      </group>

      {/* ── Stars (fixed, outside globe group so they don't rotate) ── */}
      {showStars && stars.map((star, idx) => {
        const r = 5.5 + (idx % 5) * 0.9;
        const phi = ((star.lat || 30) + 90) * (Math.PI / 180);
        const theta = ((star.lon || 0) + 180) * (Math.PI / 180);
        const pos = new Vector3(
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.cos(phi),
          r * Math.sin(phi) * Math.sin(theta)
        );
        const hov = hoveredStar === idx;
        const col = hov ? starHoverColor : starColor;

        return (
          <group key={`star-${idx}`} position={pos.toArray()}>
            {/* Visible star */}
            <mesh>
              <sphereGeometry args={[hov ? starSize * 1.6 : starSize, 12, 12]} />
              <meshStandardMaterial color={col} emissive={col} emissiveIntensity={hov ? 4 : 2} transparent opacity={hov ? 1 : 0.9} />
            </mesh>
            {/* Large invisible hitbox for easy clicking */}
            <mesh
              onPointerOver={e => { e.stopPropagation(); setHoveredStar(idx); }}
              onPointerOut={e => { e.stopPropagation(); setHoveredStar(null); }}
              onClick={e => { e.stopPropagation(); if (star.link) window.location.href = star.link; }}
            >
              <sphereGeometry args={[0.5, 8, 8]} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>
            {hov && star.title && (
              <Html center distanceFactor={7} zIndexRange={[200, 0]}>
                <div className="star-tooltip">
                  <span className="star-tooltip-title">{star.title}</span>
                  {star.description && <span className="star-tooltip-desc">{star.description}</span>}
                </div>
              </Html>
            )}
          </group>
        );
      })}

      {/* ── Day/Night Toggle ── */}
      <Html fullscreen>
        <div className="earth-daynight-toggle">
          <button
            className={`daynight-toggle-btn ${isDayMode ? 'daynight-day' : 'daynight-night'}`}
            onClick={onDayNightToggle}
            title={isDayMode ? 'Switch to Night Mode' : 'Switch to Day Mode'}
          >
            <span className="daynight-track">
              <span className="daynight-thumb">{isDayMode ? '☀️' : '🌙'}</span>
            </span>
            <span className="daynight-label">{isDayMode ? 'Day' : 'Night'}</span>
          </button>
        </div>
      </Html>
    </>
  );
});

Earth.displayName = 'Earth';
export default Earth;