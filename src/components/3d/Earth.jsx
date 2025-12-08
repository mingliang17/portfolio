import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { TextureLoader, ShaderMaterial, Vector2, Vector3, Euler } from 'three';
import * as solar from 'solar-calculator';
import { Html } from '@react-three/drei';

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

const Earth = ({ 
  projects,
  // Animation Controls
  continentPopHeight = 0.05,
  hoverPopHeight = 0.3,
  hoverRadius = 0.3,
  animationSpeed = 0.001,
  timeSpeed = 1,
  
  // Visual Controls
  normalMapStrength = 1.0,
  ambientBrightness = 0.3,
  
  // Pin Controls
  pinColor = '#ff0000',
  pinHoverColor = '#ffcc00',
  pinBaseRadius = 1.8,
  pinLength = 0.3,
  pinThickness = 0.02,
  pinTipSize = 0.05,
  showPins = true
}) => {
  const globeRef = useRef();
  const globeMeshRef = useRef();
  const [hoveredPin, setHoveredPin] = useState(null);
  const [hoverPoint, setHoverPoint] = useState(new Vector3(0, 0, 0));
  const [isHovering, setIsHovering] = useState(false);
  const [dt, setDt] = useState(+new Date());
  const [globeRotation] = useState(new Vector2(0, 0));

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
        displaceAmount: { value: continentPopHeight },
        normalScale: { value: normalMapStrength },
        ambientLightIntensity: { value: ambientBrightness },
        hoverPoint: { value: new Vector3(0, 0, 0) },
        hoverRadius: { value: hoverRadius },
        maxDisplacement: { value: hoverPopHeight }
      },
      vertexShader: dayNightShader.vertexShader,
      fragmentShader: dayNightShader.fragmentShader
    });
  }, [dayTexture, nightTexture, normalMap, globeRotation, continentPopHeight, normalMapStrength, ambientBrightness, hoverRadius, hoverPopHeight]);

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

  // Update material uniforms
  useEffect(() => {
    if (material) {
      material.uniforms.displaceAmount.value = continentPopHeight;
      material.uniforms.normalScale.value = normalMapStrength;
      material.uniforms.ambientLightIntensity.value = ambientBrightness;
      material.uniforms.hoverRadius.value = hoverRadius;
      material.uniforms.maxDisplacement.value = hoverPopHeight;
    }
  }, [material, continentPopHeight, normalMapStrength, ambientBrightness, hoverRadius, hoverPopHeight]);

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

  // Auto-rotate
  useFrame(() => {
    if (globeRef.current) {
      globeRef.current.rotation.y += animationSpeed;
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

  return (
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
        const direction = new Vector3(x, y, z).normalize();
        
        // Pin positions
        const startPos = direction.clone().multiplyScalar(pinBaseRadius);
        const endPos = direction.clone().multiplyScalar(pinBaseRadius + pinLength);
        const midPos = direction.clone().multiplyScalar(pinBaseRadius + pinLength / 2);
        
        // Calculate rotation to align cylinder radially
        const rotationX = Math.acos(direction.y);
        const rotationY = Math.atan2(direction.x, direction.z);

        return (
          <group key={index}>
            {/* Pin Cylinder */}
            <mesh
              position={[midPos.x, midPos.y, midPos.z]}
              rotation={[rotationX, rotationY, 0]}
              onPointerOver={() => setHoveredPin(index)}
              onPointerOut={() => setHoveredPin(null)}
              onClick={() => window.location.href = project.link}
            >
              <cylinderGeometry args={[pinThickness, pinThickness, pinLength, 8]} />
              <meshStandardMaterial 
                color={hoveredPin === index ? pinHoverColor : pinColor}
                emissive={hoveredPin === index ? pinHoverColor : pinColor}
                emissiveIntensity={0.3}
              />
            </mesh>

            {/* Pin Tip Sphere */}
            <mesh
              position={[endPos.x, endPos.y, endPos.z]}
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
              <Html position={[endPos.x, endPos.y, endPos.z]} center distanceFactor={8}>
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
  );
};

export default Earth;