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
      
      // Permanent elevation based on height map
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
      
      float baseBlend = smoothstep(-0.1, 0.1, intensity);
      float blendFactor = baseBlend;
      if (themeMode > 1.5) {
         blendFactor = 0.0;
      } else if (themeMode > 0.5) {
         blendFactor = 1.0;
      }
      
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
  countries = [],
  stars = [],
  globeTheme = 'neutral',
  onThemeChange,
  onItemSelect,
  onCountrySelect,
  selectedCountry,
  selectedItem,
  onCountryHover,
  onCountryHoverEnd,

  continentPopHeight = 0,
  hoverPopHeight = 0.4,
  animationSpeed = 0.001,
  normalMapStrength = 0,
  ambientBrightness = 0.3,

  pinColor = '#ffdd88',
  pinHoverColor = '#ffaa00',
  pinBaseRadius = 1.48, // Adjusted for 20% scale down (1.85 * 0.8)
  pinLength = 0.3,
  pinThickness = 0.006,
  pinTipSize = 0.033,
  pinSizeAddition = 0.012,
  pinHeightAddition = 0.12,
  showPins = true,

  starColor = '#88ccff',
  starHoverColor = '#00eeff',
  starSize = 0.06,
  showStars = true,

  autoRotate = false,
  onAutoRotateChange,
}, ref) => {

  const globeRef = useRef();
  const globeMeshRef = useRef();
  const starsRef = useRef();
  
  const [hoveredPin, setHoveredPin] = useState(null);
  const [hoveredStar, setHoveredStar] = useState(null);
  
  // Use a ref for time to allow smooth frame-by-frame updates without React state lag
  const timeRef = useRef(+new Date());
  const [globeRotation] = useState(new Vector2(0, 0));

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
      displaceAmount: { value: continentPopHeight },
      normalScale: { value: normalMapStrength },
      ambientLightIntensity: { value: ambientBrightness },
      globalDisplacement: { value: hoverPopHeight },
      themeMode: { value: 0.0 },
    },
    vertexShader: dayNightShader.vertexShader,
    fragmentShader: dayNightShader.fragmentShader,
  }), [dayTexture, nightTexture, normalMap, globeRotation, continentPopHeight, normalMapStrength, ambientBrightness, hoverPopHeight]);

  useEffect(() => {
    if (material) {
      if (globeTheme === 'night') material.uniforms.themeMode.value = 2.0;
      else if (globeTheme === 'day') material.uniforms.themeMode.value = 1.0;
      else material.uniforms.themeMode.value = 0.0;
    }
  }, [globeTheme, material]);

  useFrame((state, delta) => {
    // 1. Smooth Shade Orbit Calculation
    // Neutral mode orbits 4x faster. (delta is in seconds, we convert to ms)
    const speedMultiplier = globeTheme === 'neutral' ? 4 : 1;
    timeRef.current += delta * 1000 * 60 * speedMultiplier; 

    if (material) {
      const [lng, lat] = sunPosAt(timeRef.current);
      material.uniforms.sunPosition.value.set(lng, lat);
    }

    // 2. Rotate Globe
    if (globeRef.current && autoRotate) {
      globeRef.current.rotation.y += animationSpeed;
    }

    // 3. Independent Star Orbit (Now closer)
    if (starsRef.current) {
      starsRef.current.rotation.y += animationSpeed * 0.4;
    }

    // 4. Update Globe Rotation Uniform
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
      {/* Scaled down globe group (20% reduction: 2.0 -> 1.6) */}
      <group ref={globeRef} scale={0.8}>
        <mesh ref={globeMeshRef}>
          <sphereGeometry args={[2, 128, 128]} />
          <primitive object={material} attach="material" />
        </mesh>

        {showPins && countries.flatMap((country, countryIdx) => {
          const items = [
            ...(country.projects || []).map(p => ({ ...p, type: 'project' })),
            ...(country.fotos || []).map(f => ({ ...f, type: 'foto' }))
          ];
          const totalItems = items.length;
          
          if (totalItems === 0) return [];
          
          return items.map((item, itemIdx) => {
            // Offset logic for multiple items in the same country
            const offsetRadius = 0.8; // degrees
            let offsetLat = 0;
            let offsetLon = 0;
            
            if (totalItems > 1) {
              const angle = (itemIdx / totalItems) * Math.PI * 2;
              offsetLat = Math.sin(angle) * offsetRadius;
              offsetLon = Math.cos(angle) * offsetRadius;
            }
            
            const lat = country.lat + offsetLat;
            const lon = country.lon + offsetLon;
            
            const currentPinLength = pinLength; // Static length per pin
            const currentPinTipSize = pinTipSize;
            const currentPinThickness = pinThickness;
            
            const dir = latLonToVec3(lat, lon, 1).normalize();
            const tipPos  = dir.clone().multiplyScalar(pinBaseRadius + currentPinLength);
            const midPos  = dir.clone().multiplyScalar(pinBaseRadius + currentPinLength / 2);
            const q = alignCylinder(dir);
            const hov = hoveredPin === item.id;
            
            const isSelected = selectedItem === item.id;
            const isSameCountry = selectedCountry === country.country;
            
            let col;
            if (isSelected) {
              col = '#0088ff'; // blue highlight
            } else if (isSameCountry) {
              col = '#00ff88'; // green highlight
            } else if (hov) {
              col = pinHoverColor;
            } else {
              col = item.pinColor || (item.type === 'project' ? '#FF6B6B' : '#4ECDC4');
            }

            return (
              <group key={`pin-${item.id}`}>
                <mesh
                  position={tipPos.toArray()}
                  onPointerOver={e => { e.stopPropagation(); setHoveredPin(item.id); if (onCountryHover) onCountryHover(country); }}
                  onPointerOut={e => { e.stopPropagation(); setHoveredPin(null); if (onCountryHoverEnd) onCountryHoverEnd(); }}
                  onClick={e => { e.stopPropagation(); if (onItemSelect) onItemSelect(item); else if (onCountrySelect) onCountrySelect(country); }}
                >
                  <sphereGeometry args={[0.15, 8, 8]} />
                  <meshBasicMaterial transparent opacity={0} depthWrite={false} />
                </mesh>

                <mesh position={midPos.toArray()} quaternion={q}>
                  <cylinderGeometry args={[currentPinThickness, currentPinThickness, currentPinLength, 8]} />
                  <meshStandardMaterial color={col} emissive={col} emissiveIntensity={0.5} />
                </mesh>

                <mesh position={tipPos.toArray()} scale={hov || isSelected ? 2.0 : 1}>
                  <sphereGeometry args={[currentPinTipSize, 16, 16]} />
                  <meshStandardMaterial color={col} emissive={col} emissiveIntensity={(hov || isSelected) ? 2.0 : 0.8} />
                </mesh>

                {hov && (
                  <Html position={[tipPos.x, tipPos.y + 0.2, tipPos.z]} center distanceFactor={5.5}>
                    <div className="country-tooltip">
                      <img
                        className="country-flag"
                        src={`https://flagcdn.com/w80/${country.iso}.png`}
                        alt={country.country}
                      />
                      <div className="country-tooltip-body">
                        <span className="country-tooltip-name">{item.title}</span>
                        <span className="country-tooltip-stat" style={{ color: item.type === 'project' ? '#FF6B6B' : '#4ECDC4' }}>
                          {item.type === 'project' ? 'Project' : 'Snap'}
                        </span>
                      </div>
                    </div>
                  </Html>
                )}
              </group>
            );
          });
        })}
      </group>

      {/* Stars Orbit (Radius pulled closer to Earth) */}
      <group ref={starsRef}>
        {showStars && stars.map((star, idx) => {
          // Reduced base radius from 5.5 to 3.2 for a tighter orbit
          const r = 3.2 + (idx % 5) * 0.5;
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
              <mesh>
                <sphereGeometry args={[hov ? starSize * 1.6 : starSize, 12, 12]} />
                <meshStandardMaterial color={col} emissive={col} emissiveIntensity={hov ? 4 : 2} transparent opacity={0.9} />
              </mesh>
              <mesh
                onPointerOver={e => { e.stopPropagation(); setHoveredStar(idx); }}
                onPointerOut={e => { e.stopPropagation(); setHoveredStar(null); }}
                onClick={e => { e.stopPropagation(); if (star.link) window.location.href = star.link; }}
              >
                <sphereGeometry args={[0.3, 8, 8]} />
                <meshBasicMaterial transparent opacity={0} depthWrite={false} />
              </mesh>
              {hov && star.title && (
                <Html center distanceFactor={7}>
                  <div className="star-tooltip">
                    <span className="star-tooltip-title">{star.title}</span>
                  </div>
                </Html>
              )}
            </group>
          );
        })}
      </group>

      <Html fullscreen>
        <div className="earth-theme-toggle">
          <div className="theme-toggle-container">
            <button className={`theme-btn ${globeTheme === 'day' ? 'active' : ''}`} onClick={() => onThemeChange && onThemeChange('day')}>☀️ Day</button>
            <button className={`theme-btn ${globeTheme === 'neutral' ? 'active' : ''}`} onClick={() => onThemeChange && onThemeChange('neutral')}>🌗 Neutral</button>
            <button className={`theme-btn ${globeTheme === 'night' ? 'active' : ''}`} onClick={() => onThemeChange && onThemeChange('night')}>🌙 Night</button>
          </div>
        </div>
      </Html>
    </>
  );
});

Earth.displayName = 'Earth';
export default Earth;