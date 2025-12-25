// src/sections/ModelSection.jsx
// FIXED: Proper URL construction with BASE_URL handling

import React, { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, PerspectiveCamera } from '@react-three/drei';
import ModelLoader from '../../components/3d/projects/ModelLoader.jsx';

const ModelSection = ({ 
  modelUrl,
  modelType = 'glb', // 'fbx', 'gltf', or 'glb'
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
  const [error, setError] = useState(null);
  
  // CRITICAL: Construct the full URL with BASE_URL
  const BASE_URL = import.meta.env.BASE_URL || '/';
  
  // Clean and construct the path
  const constructModelPath = (path) => {
    // Remove leading slash if present
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    
    // Combine BASE_URL with path
    const fullPath = `${BASE_URL}${cleanPath}`.replace(/([^:]\/)\/+/g, "$1");
    
    return fullPath;
  };
  
  const fullModelUrl = constructModelPath(modelUrl);
  
  console.log('🎨 ModelSection Debug:', {
    providedUrl: modelUrl,
    baseUrl: BASE_URL,
    constructedUrl: fullModelUrl,
    type: modelType
  });
  
  const handleModelLoad = (model) => {
    console.log('✅ ModelSection: Model loaded successfully');
    setIsLoading(false);
    setError(null);
  };
  
  const handleModelError = (err) => {
    console.error('❌ ModelSection: Model loading failed', err);
    setIsLoading(false);
    setError(err.message || 'Failed to load model');
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
        {/* Error Display */}
        {error && (
          <div className="model-error-overlay">
            <div className="model-error-content">
              <h3>⚠️ Model Loading Failed</h3>
              <p>{error}</p>
              <p className="model-error-path">Path: {fullModelUrl}</p>
              <p className="model-error-hint">
                Check that the file exists at: <code>public/{modelUrl}</code>
              </p>
            </div>
          </div>
        )}
        
        <Canvas shadows>
          <PerspectiveCamera 
            makeDefault 
            position={cameraPosition} 
            fov={cameraFov} 
          />
          
          {/* Lighting */}
          <ambientLight intensity={0.6} />
          <directionalLight 
            position={[5, 5, 5]} 
            intensity={1.2} 
            castShadow 
          />
          <pointLight position={[-5, 3, -5]} intensity={0.5} />
          <pointLight position={[5, 3, 5]} intensity={0.3} />

          {/* 3D Model - Generic Loader */}
          <Suspense fallback={null}>
            <ModelLoader
              url={fullModelUrl}
              type={modelType}
              scale={modelScale}
              position={modelPosition}
              rotation={modelRotation}
              onLoad={handleModelLoad}
              onError={handleModelError}
            />
          </Suspense>

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
        {isLoading && !error && (
          <div className="model-loading-hint">
            Loading 3D model...
          </div>
        )}
        
        {!isLoading && !error && (
          <div className="model-loading-hint">
            Use mouse to rotate • Scroll to zoom
          </div>
        )}
      </div>

      {/* Instructions */}
      {!error && (
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