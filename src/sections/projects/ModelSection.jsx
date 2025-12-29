// src/sections/ModelSection.jsx
// FIXED: Proper cleanup and reset when navigating away

import React, { Suspense, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, PerspectiveCamera } from '@react-three/drei';
import ModelLoader from '../../components/3d/projects/ModelLoader.jsx';
import ModelErrorBoundary from '../../components/3d/projects/ModelErrorBoundary.jsx';

// Loading Fallback Component - animated
const LoadingFallback = () => {
  return (
    <group>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial color="#4dabf7" transparent opacity={0.6} />
      </mesh>
      <mesh position={[0, 0, 0]} rotation={[0, Math.PI / 4, 0]}>
        <boxGeometry args={[0.6, 0.6, 0.6]} />
        <meshStandardMaterial color="#4dabf7" wireframe />
      </mesh>
    </group>
  );
};

const ModelSection = ({ 
  modelUrl,
  modelType = 'glb',
  modelScale = 1,
  modelPosition = [0, 0, 0],
  modelRotation = [0, 0, 0],
  cameraPosition = [0, 2, 6],
  cameraFov = 45,
  title = '3D Model',
  showControls = true,
  environment = 'city',
  backgroundColor = '#000000'
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [key, setKey] = useState(0); // Force remount on navigation
  
  // Construct the full path
  const BASE_URL = import.meta.env.BASE_URL || '/';
  
  // Remove leading slash if present
  const cleanModelUrl = modelUrl.startsWith('/') ? modelUrl.slice(1) : modelUrl;
  
  // Build full path
  let fullPath = `${BASE_URL}${cleanModelUrl}`;
  
  // Remove double slashes except after protocol
  fullPath = fullPath.replace(/([^:]\/)\/+/g, "$1");
  
  console.log('🎨 ModelSection initialized:', {
    providedUrl: modelUrl,
    baseUrl: BASE_URL,
    finalPath: fullPath,
    type: modelType,
    key: key
  });
  
  // Reset state when section becomes active
  useEffect(() => {
    console.log('🔄 ModelSection mounted/updated');
    setIsLoading(true);
    setLoadError(false);
    
    // Force Canvas remount by changing key
    setKey(prev => prev + 1);
    
    return () => {
      console.log('🧹 ModelSection cleanup');
    };
  }, [fullPath]);
  
  const handleModelLoad = (model) => {
    console.log('✅ ModelSection: Model loaded and ready');
    setIsLoading(false);
    setLoadError(false);
  };
  
  const handleError = () => {
    console.error('❌ ModelSection: Failed to load model');
    setIsLoading(false);
    setLoadError(true);
  };
  
  return (
    <div className="model-section-wrapper">
      {/* Title */}
      {title && (
        <div className="model-section-header">
          <h2 className="model-section-title">{title}</h2>
        </div>
      )}

      {/* Canvas Container */}
      <div className="model-canvas-container">
        {/* Error Overlay */}
        {loadError && (
          <div className="model-error-overlay">
            <div className="model-error-content">
              <h3>⚠️ Model Loading Failed</h3>
              <p>Unable to load the 3D model</p>
              <p className="model-error-path">Path: {fullPath}</p>
              <p className="model-error-hint">
                Check console for details and verify file exists at:
                <br />
                <code>public/{cleanModelUrl}</code>
              </p>
            </div>
          </div>
        )}
        
        {/* FIXED: Add key prop to force remount */}
        <Canvas 
          key={key}
          shadows 
          onError={handleError}
          onCreated={() => console.log('🎨 Canvas created successfully')}
        >
          <PerspectiveCamera 
            makeDefault 
            position={cameraPosition} 
            fov={cameraFov} 
          />
          
          {/* Lighting */}
          <ambientLight intensity={0.01} />

          {/* Model with Error Boundary and Suspense */}
          <ModelErrorBoundary position={modelPosition}>
            <Suspense fallback={<LoadingFallback />}>
              <ModelLoader
                url={fullPath}
                type={modelType}
                scale={modelScale}
                position={modelPosition}
                rotation={modelRotation}
                onLoad={handleModelLoad}
              />
            </Suspense>
          </ModelErrorBoundary>

          {/* Controls */}
          {showControls && (
            <OrbitControls
              enableDamping
              dampingFactor={0.05}
              rotateSpeed={0.5}
              minDistance={1}
              maxDistance={20}
              minPolarAngle={0}
              maxPolarAngle={Math.PI / 1.5}
            />
          )}

          {/* Environment */}
          {environment && <Environment preset={environment} />}
          
          {/* Background Color */}
          <color attach="background" args={[backgroundColor]} />
        </Canvas>

        {/* Loading Hint */}
        {!loadError && (
          <div 
            className="model-loading-hint" 
            style={{ 
              opacity: isLoading ? 1 : 0.8,
              transition: 'opacity 0.5s ease'
            }}
          >
            {isLoading ? 'Loading 3D model...' : 'Use mouse to rotate • Scroll to zoom'}
          </div>
        )}
      </div>

      {/* Instructions */}
      {!loadError && (
        <div className="model-instructions">
          <div className="model-instruction-item">
            <span className="model-instruction-icon">🖱️</span>
            <span>Drag to rotate</span>
          </div>
          <div className="model-instruction-item">
            <span className="model-instruction-icon">⚲</span>
            <span>Scroll to zoom</span>
          </div>
          <div className="model-instruction-item">
            <span className="model-instruction-icon">👆</span>
            <span>Right-click drag to pan</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelSection;