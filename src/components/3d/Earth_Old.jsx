import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { TextureLoader, ShaderMaterial, Vector2, Vector3 } from 'three';
import * as solar from 'solar-calculator';
import { Html } from '@react-three/drei';
import { assetPath } from '../utils/assetPath.js';

const VELOCITY = 1; // minutes per frame

// Enhanced shader with normal mapping and displacement
const dayNightShader = {
  vertexShader: `
    uniform float displaceAmount;
    uniform sampler2D normalMap;
    varying vec3 vNormal;
    varying vec2 vUv;
    varying vec3 vViewPosition;
    
    void main() {
      vUv = uv;
      
      // Sample normal map for displacement
      vec3 normalColor = texture2D(normalMap, uv).rgb;
      float height = (normalColor.r + normalColor.g + normalColor.b) / 3.0;
      
      // Displace vertices based on normal map
      vec3 newPosition = position + normal * height * displaceAmount;
      
      vec4 mvPosition = modelViewMatrix * vec4(newPosition, 1.0);
      vViewPosition = -mvPosition.xyz;
      vNormal = normalize(normalMatrix * normal);
      
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
  continentPopHeight = 0.15,        // How much continents pop out (0-1)
  animationSpeed = 0.001,            // Auto-rotation speed
  timeSpeed = 1,                     // Day/night cycle speed (minutes per frame)
  
  // Visual Controls
  normalMapStrength = 1.0,           // Normal map intensity (0-2)
  ambientBrightness = 0.3,           // Overall brightness (0-1)
  dayNightBlendSharpness = 0.1,      // Transition sharpness (-0.5 to 0.5)
  
  // Pin Controls
  pinColor = '#ff0000',              // Default pin color
  pinHoverColor = '#ffcc00',         // Hover pin color
  pinSize = 0.05,                    // Pin sphere size
  showPins = true                    // Toggle pins on/off
}) => {
  const globeRef = useRef();
  const [hoveredPin, setHoveredPin] = useState(null);
  const [dt, setDt] = useState(+new Date());
  const [globeRotation] = useState(new Vector2(0, 0));

  // Load textures
  const dayTexture = useLoader(TextureLoader, assetPath('textures/earth-day.jpg'));
  const nightTexture = useLoader(TextureLoader, assetPath('textures/earth-night.jpg'));
  const normalMap = useLoader(TextureLoader, assetPath('textures/earth-normal.jpg'));

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
        ambientLightIntensity: { value: ambientBrightness }
      },
      vertexShader: dayNightShader.vertexShader,
      fragmentShader: dayNightShader.fragmentShader
    });
  }, [dayTexture, nightTexture, normalMap, globeRotation, continentPopHeight, normalMapStrength, ambientBrightness]);

  // Update time
  useEffect(() => {
    const interval = setInterval(() => {
      setDt(prevDt => prevDt + timeSpeed * 60 * 1000);
    }, 16); // ~60fps

    return () => clearInterval(interval);
  }, [timeSpeed]);

  // Update sun position
  useEffect(() => {
    if (material) {
      const [lng, lat] = sunPosAt(dt);
      material.uniforms.sunPosition.value.set(lng, lat);
    }
  }, [dt, material]);

  // Update material uniforms when props change
  useEffect(() => {
    if (material) {
      material.uniforms.displaceAmount.value = continentPopHeight;
      material.uniforms.normalScale.value = normalMapStrength;
      material.uniforms.ambientLightIntensity.value = ambientBrightness;
    }
  }, [material, continentPopHeight, normalMapStrength, ambientBrightness]);

  // Auto-rotate and update shader
  useFrame(() => {
    if (globeRef.current) {
      globeRef.current.rotation.y += animationSpeed;
      
      // Update globe rotation for shader
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
      {/* The Earth Globe with Day/Night Shader and Normal Mapping */}
      <mesh>
        <sphereGeometry args={[2, 128, 128]} /> {/* Higher resolution for better displacement */}
        <primitive object={material} attach="material" />
      </mesh>

      {/* Project Pins */}
      {showPins && projects && projects.map((project, index) => {
        const [x, y, z] = latLongToVector3(project.lat, project.lon, 2.05 + continentPopHeight);
        
        return (
          <group key={index} position={[x, y, z]}>
            {/* Pin Marker */}
            <mesh
              onPointerOver={() => setHoveredPin(index)}
              onPointerOut={() => setHoveredPin(null)}
              onClick={() => window.location.href = project.link}
              scale={hoveredPin === index ? 1.3 : 1}
            >
              <sphereGeometry args={[pinSize, 16, 16]} />
              <meshStandardMaterial 
                color={hoveredPin === index ? pinHoverColor : pinColor}
                emissive={hoveredPin === index ? pinHoverColor : pinColor}
                emissiveIntensity={0.5}
              />
            </mesh>

            {/* Pin Stick */}
            <mesh position={[0, 0.05, 0]}>
              <cylinderGeometry args={[0.01, 0.01, 0.1]} />
              <meshStandardMaterial color="#ffffff" />
            </mesh>

            {/* Tooltip on Hover */}
            {hoveredPin === index && (
              <Html center distanceFactor={10}>
                <div className="bg-black/80 text-white px-3 py-2 rounded-lg whitespace-nowrap pointer-events-none">
                  <p className="font-bold">{project.title}</p>
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