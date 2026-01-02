// src/sections/projects/ModelSection.jsx
// FIXED: Model moves with scroll, dynamic height

import React, { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
  Environment,
  PerspectiveCamera,
} from '@react-three/drei';
import ModelLoader from '../../components/project/ModelLoaderComponent.jsx';

const BASE_URL = import.meta.env.BASE_URL || '/';
const assetPath = (path) =>
  `${BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;

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
}) => {
  const [loaded, setLoaded] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const sectionRef = useRef(null);
  
  const processedUrl = modelUrl ? assetPath(modelUrl) : null;

  useEffect(() => {
    setLoaded(false);
  }, [processedUrl, componentName]);

  // Calculate scroll progress through this section
  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;

      const rect = sectionRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const sectionHeight = rect.height;

      // Calculate how far through the section we've scrolled
      const scrollStart = rect.top;
      const scrollEnd = rect.bottom - viewportHeight;
      const scrollRange = sectionHeight - viewportHeight;

      // Progress from 0 (top of section at top of viewport) to 1 (bottom of section at bottom of viewport)
      const progress = Math.max(0, Math.min(1, -scrollStart / scrollRange));
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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