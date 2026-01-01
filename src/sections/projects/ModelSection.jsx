// src/sections/projects/ModelSection.jsx
// FIXED: Model stays centered, proper height calculation

import React, { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import {
  OrbitControls,
  Environment,
  PerspectiveCamera,
} from '@react-three/drei';
import ModelLoader from '../../components/project/ModelLoaderComponent.jsx';

const BASE_URL = import.meta.env.BASE_URL || '/';
const assetPath = (path) =>
  `${BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;

const Controls = ({ enabled }) => {
  if (!enabled) return null;
  return (
    <OrbitControls
      makeDefault
      enableDamping
      dampingFactor={0.06}
      minDistance={1}
      maxDistance={50}
      maxPolarAngle={Math.PI / 1.8}
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
  const sectionRef = useRef(null);
  const canvasWrapperRef = useRef(null);
  
  const processedUrl = modelUrl ? assetPath(modelUrl) : null;

  useEffect(() => {
    setLoaded(false);
  }, [processedUrl, componentName]);

  // Keep canvas centered as section scrolls
  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current || !canvasWrapperRef.current) return;

      const sectionRect = sectionRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      // Calculate how much of the section is visible
      const visibleTop = Math.max(0, sectionRect.top);
      const visibleBottom = Math.min(viewportHeight, sectionRect.bottom);
      const visibleHeight = visibleBottom - visibleTop;

      // Only apply sticky positioning if section is visible
      if (visibleHeight > 0 && sectionRect.top <= 0 && sectionRect.bottom >= viewportHeight) {
        canvasWrapperRef.current.style.position = 'sticky';
        canvasWrapperRef.current.style.top = '0';
      } else if (sectionRect.bottom < viewportHeight && sectionRect.bottom > 0) {
        // At bottom of section - keep canvas at bottom
        canvasWrapperRef.current.style.position = 'absolute';
        canvasWrapperRef.current.style.top = 'auto';
        canvasWrapperRef.current.style.bottom = '0';
      } else {
        canvasWrapperRef.current.style.position = 'sticky';
        canvasWrapperRef.current.style.top = '0';
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div ref={sectionRef} className="model-section-wrapper">
      <div ref={canvasWrapperRef} className="model-canvas-sticky">
        <Canvas
          shadows={enableShadows}
          className="w-full h-full"
          frameloop="always"
        >
          <PerspectiveCamera
            makeDefault
            position={cameraPosition}
            fov={cameraFov}
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

          <Controls enabled={showControls && loaded} />
        </Canvas>
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