import React, { useRef, useState } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { TextureLoader } from 'three';
import { Html } from '@react-three/drei';
import { assetPath } from '../utils/assetPath.js';

const Globe = ({ projects }) => {
  const globeRef = useRef();
  const [hoveredPin, setHoveredPin] = useState(null);
  
  // Load Earth texture
  const earthTexture = useLoader(TextureLoader, assetPath('textures/earth_day.jpg'));

  // Auto-rotate the globe horizontally
  useFrame(() => {
    if (globeRef.current) {
      globeRef.current.rotation.y += 0.001; // Slow rotation
    }
  });

  // Convert lat/long to 3D coordinates on sphere
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
      {/* The Globe */}
      <mesh>
        <sphereGeometry args={[2, 64, 64]} />
        <meshStandardMaterial 
          map={earthTexture}
          metalness={0.1}
          roughness={0.7}
        />
      </mesh>

      {/* Project Pins */}
      {projects.map((project, index) => {
        const [x, y, z] = latLongToVector3(project.lat, project.lon, 2.05);
        
        return (
          <group key={index} position={[x, y, z]}>
            {/* Pin Marker */}
            <mesh
              onPointerOver={() => setHoveredPin(index)}
              onPointerOut={() => setHoveredPin(null)}
              onClick={() => window.location.href = project.link}
              scale={hoveredPin === index ? 1.3 : 1}
            >
              <sphereGeometry args={[0.05, 16, 16]} />
              <meshStandardMaterial 
                color={hoveredPin === index ? '#ffcc00' : '#ff0000'}
                emissive={hoveredPin === index ? '#ffcc00' : '#ff0000'}
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

export default Globe;