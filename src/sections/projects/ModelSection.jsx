// src/sections/projects/ModelSection.jsx
// FIXED: Model moves with scroll, dynamic height

import React, { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
  Environment,
  PerspectiveCamera,
} from '@react-three/drei';
import ModelLoader from '../../components/project/ModelLoaderComponent.jsx';
import { assetPath } from '@/utils/assetPath.js';

// Scrolling Camera Component
const ScrollingCamera = ({ 
  basePosition = [0, 2, 6], 
  scrollProgress = 0,
  verticalRange = 4 // How much camera moves vertically
}) => {
  const cameraRef = useRef();

  useFrame(({ camera }) => {
    if (cameraRef.current) {
      // Move camera down as we scroll
      const targetY = basePosition[1] - (scrollProgress * verticalRange);
      camera.position.y = targetY;
      camera.position.x = basePosition[0];
      camera.position.z = basePosition[2];
      camera.lookAt(0, targetY, 0);
    }
  });

  return (
    <PerspectiveCamera
      ref={cameraRef}
      makeDefault
      position={basePosition}
      fov={50}
    />
  );
};

const ModelSection = ({
  componentName,
  modelUrl,
  modelType = 'glb',

  cameraPosition = [0, 2, 6],
  cameraFov = 45,

  modelScale = 1,
  modelPosition = [0, 0, 0],
  modelRotation = [0, 0, 0],

  environment = 'city',
  backgroundColor = '#000',

  showControls = true,
  enableShadows = true,
  
  // Controlled props
  isActive = false,
  scrollProgress = 0
}) => {
  const [loaded, setLoaded] = useState(false);
  const sectionRef = useRef(null);
  
  const processedUrl = modelUrl ? assetPath(modelUrl) : null;

  useEffect(() => {
    setLoaded(false);
  }, [processedUrl, componentName]);

  return (
    <div ref={sectionRef} className="model-section-wrapper">
      {/* Sticky canvas container */}
      <div className="model-canvas-sticky">
        <Canvas
          shadows={enableShadows}
          frameloop="always"
        >
          <ScrollingCamera 
            basePosition={cameraPosition} 
            scrollProgress={scrollProgress}
            verticalRange={6}
          />

          <ambientLight intensity={0.4} />
          <directionalLight
            position={[5, 10, 5]}
            intensity={1}
            castShadow={enableShadows}
          />

          <ModelLoader
            componentName={componentName}
            url={processedUrl}
            type={modelType}
            scale={modelScale}
            position={modelPosition}
            rotation={modelRotation}
            enableShadows={enableShadows}
            onLoad={() => setLoaded(true)}
          />

          <Environment preset={environment} />
          <color attach="background" args={[backgroundColor]} />
        </Canvas>

        {/* Scroll progress indicator */}
        <div className="model-scroll-indicator">
          <div className="model-scroll-progress" style={{ height: `${scrollProgress * 100}%` }} />
        </div>
      </div>

      {!loaded && (
        <div className="model-loading-overlay">
          <div className="text-white">Loading model…</div>
        </div>
      )}
    </div>
  );
};

export default ModelSection;