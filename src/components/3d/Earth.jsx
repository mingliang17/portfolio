import React, { useRef, useState, useEffect, useMemo, forwardRef, useImperativeHandle } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { TextureLoader, ShaderMaterial, Vector2, Vector3, Quaternion } from 'three';
import * as solar from 'solar-calculator';
import { Html } from '@react-three/drei';
import { TEXTURES } from '../../assets/index.js';

const VELOCITY = 1; // minutes per frame

// Enhanced shader with localized displacement
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
      
      // Calculate world position
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPos.xyz;
      
      // Sample normal map for displacement
      vec3 normalColor = texture2D(normalMap, uv).rgb;
      float height = (normalColor.r + normalColor.g + normalColor.b) / 3.0;
      
      // Calculate distance from hover point
      float dist = distance(normalize(worldPos.xyz), normalize(hoverPoint));
      float influence = smoothstep(hoverRadius, 0.0, dist);
      
      // Apply localized displacement only where hovering
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
    
    varying vec3 vNormal;
    varying vec2 vUv;
    varying vec3 vViewPosition;
    varying vec3 vWorldPosition;

    float toRad(in float a) {
      return a * PI / 180.0;
    }

    vec3 Polar2Cartesian(in vec2 c) {
      float theta = toRad(90.0 - c.x);
      float phi = toRad(90.0 - c.y);
      return vec3(
        sin(phi) * cos(theta),
        cos(phi),
        sin(phi) * sin(theta)
      );
    }

    void main() {
      // Sample normal map
      vec3 normalMapColor = texture2D(normalMap, vUv).rgb;
      vec3 normalMapNormal = normalize(normalMapColor * 2.0 - 1.0);
      normalMapNormal.xy *= normalScale;
      
      // Combine with vertex normal
      vec3 combinedNormal = normalize(vNormal + normalMapNormal);
      
      // Calculate sun direction
      float invLon = toRad(globeRotation.x);
      float invLat = -toRad(globeRotation.y);
      mat3 rotX = mat3(
        1, 0, 0,
        0, cos(invLat), -sin(invLat),
        0, sin(invLat), cos(invLat)
      );
      mat3 rotY = mat3(
        cos(invLon), 0, sin(invLon),
        0, 1, 0,
        -sin(invLon), 0, cos(invLon)
      );
      vec3 rotatedSunDirection = rotX * rotY * Polar2Cartesian(sunPosition);
      
      // Calculate lighting intensity with normal map
      float intensity = dot(combinedNormal, normalize(rotatedSunDirection));
      
      // Sample day and night textures
      vec4 dayColor = texture2D(dayTexture, vUv);
      vec4 nightColor = texture2D(nightTexture, vUv);
      
      // Blend between day and night
      float blendFactor = smoothstep(-0.1, 0.1, intensity);
      vec4 finalColor = mix(nightColor, dayColor, blendFactor);
      
      // Add ambient lighting
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

const Earth = forwardRef(({ 
  projects,
  // Animation Controls
  continentPopHeight = 0,
  hoverPopHeight = 0.4,
  hoverRadius = 0.3,
  animationSpeed = 0.001,
  timeSpeed = 1,
  autoRotate = true,
  
  // Visual Controls
  normalMapStrength = 0,
  ambientBrightness = 0.3,
  
  // Pin Controls
  pinColor = '#ffffff',
  pinHoverColor = '#ffcc00',
  pinBaseRadius = 1.8,
  pinLength = 0.5, // Changed from 0.05 to 0.5
  pinThickness = 0.01,
  pinTipSize = 0.03,
  showPins = true,
  
  // Controls Panel
  showControls = false,
  onToggleControls,
  onResetDefaults,
  onAutoRotateChange
}, ref) => {
  const globeRef = useRef();
  const globeMeshRef = useRef();
  const [hoveredPin, setHoveredPin] = useState(null);
  const [hoverPoint, setHoverPoint] = useState(new Vector3(0, 0, 0));
  const [isHovering, setIsHovering] = useState(false);
  const [dt, setDt] = useState(+new Date());
  const [globeRotation] = useState(new Vector2(0, 0));
  
  // Local state for controls
  const [localContinentHeight, setLocalContinentHeight] = useState(continentPopHeight);
  const [localHoverHeight, setLocalHoverHeight] = useState(hoverPopHeight);
  const [localHoverRadius, setLocalHoverRadius] = useState(hoverRadius);
  const [localNormalStrength, setLocalNormalStrength] = useState(normalMapStrength);
  const [localRotationSpeed, setLocalRotationSpeed] = useState(animationSpeed);
  const [localPinLength, setLocalPinLength] = useState(pinLength); // This should match the prop default
  const [localAutoRotate, setLocalAutoRotate] = useState(autoRotate);

  // Expose the globe ref to parent
  useImperativeHandle(ref, () => ({
    getGlobe: () => globeRef.current,
    getGlobeMesh: () => globeMeshRef.current
  }));

  // Load textures
  const dayTexture = useLoader(TextureLoader, TEXTURES.earth.day);
  const nightTexture = useLoader(TextureLoader, TEXTURES.earth.night);
  const normalMap = useLoader(TextureLoader, TEXTURES.earth.normal);

  // Create shader material
  const material = useMemo(() => {
    return new ShaderMaterial({
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
        maxDisplacement: { value: localHoverHeight }
      },
      vertexShader: dayNightShader.vertexShader,
      fragmentShader: dayNightShader.fragmentShader
    });
  }, [dayTexture, nightTexture, normalMap, globeRotation, localContinentHeight, localNormalStrength, ambientBrightness, localHoverRadius, localHoverHeight]);

  // Update time
  useEffect(() => {
    const interval = setInterval(() => {
      setDt(prevDt => prevDt + timeSpeed * 60 * 1000);
    }, 16);
    return () => clearInterval(interval);
  }, [timeSpeed]);

  // Update sun position
  useEffect(() => {
    if (material) {
      const [lng, lat] = sunPosAt(dt);
      material.uniforms.sunPosition.value.set(lng, lat);
    }
  }, [dt, material]);

  // Update material uniforms when local state changes
  useEffect(() => {
    if (material) {
      material.uniforms.displaceAmount.value = localContinentHeight;
      material.uniforms.normalScale.value = localNormalStrength;
      material.uniforms.hoverRadius.value = localHoverRadius;
      material.uniforms.maxDisplacement.value = localHoverHeight;
    }
  }, [material, localContinentHeight, localNormalStrength, localHoverRadius, localHoverHeight]);

  // Handle globe hover
  const handleGlobeHover = (event) => {
    if (event.intersections.length > 0) {
      const point = event.intersections[0].point;
      setHoverPoint(point);
      setIsHovering(true);
      if (material) {
        material.uniforms.hoverPoint.value.copy(point);
      }
    }
  };

  const handleGlobeLeave = () => {
    setIsHovering(false);
  };

  // Auto-rotate if enabled
  useFrame(() => {
    if (globeRef.current && localAutoRotate) {
      globeRef.current.rotation.y += localRotationSpeed;
    }
    
    // Always update globe rotation for shader
    if (globeRef.current) {
      const lng = (globeRef.current.rotation.y * 180 / Math.PI) % 360;
      const lat = (globeRef.current.rotation.x * 180 / Math.PI) % 360;
      globeRotation.set(lng, lat);
    }
  });

  // Convert lat/long to 3D coordinates
  const latLongToVector3 = (lat, lon, radius) => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    
    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);
    
    return [x, y, z];
  };

  // Function to align cylinder along a direction vector (from origin to point)
  const alignCylinderToDirection = (direction) => {
    // Default up vector for cylinder (Y-axis)
    const up = new Vector3(0, 1, 0);
    // Normalize the direction
    const dir = direction.clone().normalize();
    
    // Calculate the rotation quaternion
    const quaternion = new Quaternion();
    quaternion.setFromUnitVectors(up, dir);
    
    return quaternion;
  };

  // Reset to defaults
  const handleResetDefaults = () => {
    setLocalContinentHeight(continentPopHeight);
    setLocalHoverHeight(hoverPopHeight);
    setLocalHoverRadius(hoverRadius);
    setLocalNormalStrength(normalMapStrength);
    setLocalRotationSpeed(animationSpeed);
    setLocalPinLength(pinLength); // Reset to the prop value, not a hardcoded value
    setLocalAutoRotate(autoRotate);
    if (onResetDefaults) onResetDefaults();
  };

  // Handle auto-rotate toggle
  const handleAutoRotateToggle = (e) => {
    const newValue = e.target.checked;
    setLocalAutoRotate(newValue);
    if (onAutoRotateChange) {
      onAutoRotateChange(newValue);
    }
  };

  return (
    <>
      <group ref={globeRef}>
        {/* The Earth Globe */}
        <mesh
          ref={globeMeshRef}
          onPointerMove={handleGlobeHover}
          onPointerLeave={handleGlobeLeave}
        >
          <sphereGeometry args={[2, 128, 128]} />
          <primitive object={material} attach="material" />
        </mesh>

        {/* Project Pins - Radially Extruding from Center */}
        {showPins && projects && projects.map((project, index) => {
          const [x, y, z] = latLongToVector3(project.lat, project.lon, 1);
          const direction = new Vector3(x, y, z);
          const normalizedDir = direction.clone().normalize();
          
          // Pin positions - extending from Earth's surface outward
          const basePos = normalizedDir.clone().multiplyScalar(pinBaseRadius);
          const tipPos = normalizedDir.clone().multiplyScalar(pinBaseRadius + localPinLength);
          const midPos = normalizedDir.clone().multiplyScalar(pinBaseRadius + localPinLength / 2);
          
          // Calculate rotation quaternion to align cylinder along radial direction
          const quaternion = alignCylinderToDirection(direction);

          return (
            <group key={index}>
              {/* Pin Cylinder - positioned at midpoint and aligned radially */}
              <mesh
                position={[midPos.x, midPos.y, midPos.z]}
                quaternion={quaternion}
                onPointerOver={() => setHoveredPin(index)}
                onPointerOut={() => setHoveredPin(null)}
                onClick={() => window.location.href = project.link}
              >
                <cylinderGeometry args={[pinThickness, pinThickness, localPinLength, 8]} />
                <meshStandardMaterial 
                  color={hoveredPin === index ? pinHoverColor : pinColor}
                  emissive={hoveredPin === index ? pinHoverColor : pinColor}
                  emissiveIntensity={0.3}
                />
              </mesh>

              {/* Pin Tip Sphere */}
              <mesh
                position={[tipPos.x, tipPos.y, tipPos.z]}
                scale={hoveredPin === index ? 1.5 : 1}
                onPointerOver={() => setHoveredPin(index)}
                onPointerOut={() => setHoveredPin(null)}
                onClick={() => window.location.href = project.link}
              >
                <sphereGeometry args={[pinTipSize, 16, 16]} />
                <meshStandardMaterial 
                  color={hoveredPin === index ? pinHoverColor : pinColor}
                  emissive={hoveredPin === index ? pinHoverColor : pinColor}
                  emissiveIntensity={0.5}
                />
              </mesh>

              {/* Tooltip */}
              {hoveredPin === index && (
                <Html position={[tipPos.x, tipPos.y, tipPos.z]} center distanceFactor={8}>
                  <div className="bg-black/90 text-white px-4 py-2 rounded-lg whitespace-nowrap pointer-events-none shadow-lg">
                    <p className="font-bold text-lg">{project.title}</p>
                    <p className="text-sm text-gray-300">{project.description}</p>
                  </div>
                </Html>
              )}
            </group>
          );
        })}
      </group>

      {/* HTML Overlays */}
      <Html fullscreen>
        <button
          onClick={onToggleControls}
          className="absolute top-8 right-8 bg-white/10 text-white px-4 py-2 rounded-lg hover:bg-white/20 transition z-10"
        >
          {showControls ? 'Hide' : 'Show'} Controls
        </button>

        {showControls && (
          <div className="absolute bottom-8 right-8 bg-black/80 text-white p-6 rounded-lg space-y-4 z-10 min-w-[300px] max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Globe Controls</h3>
            
            <div>
              <label className="block text-sm mb-2">
                Base Height: {localContinentHeight.toFixed(2)}
              </label>
              <input 
                type="range" 
                min="0" 
                max="0.2" 
                step="0.01" 
                value={localContinentHeight}
                onChange={(e) => setLocalContinentHeight(parseFloat(e.target.value))} 
                className="w-full" 
              />
            </div>

            <div>
              <label className="block text-sm mb-2">
                Hover Pop: {localHoverHeight.toFixed(2)}
              </label>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.05" 
                value={localHoverHeight}
                onChange={(e) => setLocalHoverHeight(parseFloat(e.target.value))} 
                className="w-full" 
              />
            </div>

            <div>
              <label className="block text-sm mb-2">
                Hover Radius: {localHoverRadius.toFixed(2)}
              </label>
              <input 
                type="range" 
                min="0.1" 
                max="1" 
                step="0.05" 
                value={localHoverRadius}
                onChange={(e) => setLocalHoverRadius(parseFloat(e.target.value))} 
                className="w-full" 
              />
            </div>

            <div>
              <label className="block text-sm mb-2">
                Pin Length: {localPinLength.toFixed(2)}
              </label>
              <input 
                type="range" 
                min="0.05"  // Changed from 0.1 to 0.05 to match the default value
                max="0.8" 
                step="0.05" 
                value={localPinLength}
                onChange={(e) => setLocalPinLength(parseFloat(e.target.value))} 
                className="w-full" 
              />
            </div>

            <div>
              <label className="block text-sm mb-2">
                Normal Strength: {localNormalStrength.toFixed(2)}
              </label>
              <input 
                type="range" 
                min="0" 
                max="2" 
                step="0.1" 
                value={localNormalStrength}
                onChange={(e) => setLocalNormalStrength(parseFloat(e.target.value))} 
                className="w-full" 
              />
            </div>

            <div>
              <label className="block text-sm mb-2">
                Rotation Speed: {localRotationSpeed.toFixed(4)}
              </label>
              <input 
                type="range" 
                min="0" 
                max="0.005" 
                step="0.0001" 
                value={localRotationSpeed}
                onChange={(e) => setLocalRotationSpeed(parseFloat(e.target.value))} 
                className="w-full" 
              />
            </div>

            <div>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={localAutoRotate}
                  onChange={handleAutoRotateToggle}
                  className="w-4 h-4 cursor-pointer"
                />
                <span className="text-sm">Auto Rotate</span>
              </label>
              <p className="text-xs text-gray-400 mt-1">
                Auto-rotate will continue until you drag the globe
              </p>
            </div>

            <button
              onClick={handleResetDefaults}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition"
            >
              Reset Defaults
            </button>
          </div>
        )}
      </Html>
    </>
  );
});

Earth.displayName = 'Earth';
export default Earth;