// src/components/3d/projects/ModelLoader.jsx
// FIXED: Proper path handling and error catching

import { forwardRef, useEffect, useState } from 'react';
import { useFBX, useGLTF } from '@react-three/drei';

const ModelLoader = forwardRef(({ 
  url,
  type = 'gltf', // 'fbx', 'gltf', or 'glb'
  scale = 1,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  onLoad,
  onError,
}, ref) => {
  const [error, setError] = useState(null);
  
  // CRITICAL: Clean the URL - remove any double slashes except after http:
  const cleanUrl = url.replace(/([^:]\/)\/+/g, "$1");
  
  console.log('🔍 ModelLoader Debug:', {
    originalUrl: url,
    cleanedUrl: cleanUrl,
    type: type,
    baseUrl: import.meta.env.BASE_URL
  });

  let model = null;
  let loadError = null;

  // Load based on type with error handling
  try {
    if (type === 'fbx') {
      model = useFBX(cleanUrl);
    } else if (type === 'gltf' || type === 'glb') {
      const gltfData = useGLTF(cleanUrl);
      model = gltfData.scene;
      
      // Check if scene is valid
      if (!gltfData.scene) {
        console.error('❌ GLTF/GLB scene not found in loaded data');
        setError('Model scene not found');
      }
    }
  } catch (err) {
    console.error('❌ Model loading error caught:', err);
    loadError = err;
    setError(err.message || 'Failed to load model');
    
    if (onError) {
      onError(err);
    }
  }

  useEffect(() => {
    if (model) {
      // Traverse and set up the model
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          
          // Ensure materials are visible
          if (child.material) {
            child.material.needsUpdate = true;
          }
        }
      });
      
      console.log(`✅ ${type.toUpperCase()} Model loaded successfully:`, cleanUrl);
      
      // Callback when model loads
      if (onLoad) {
        onLoad(model);
      }
    }
  }, [model, cleanUrl, type, onLoad]);

  // If there's an error, show error message in 3D space
  if (error || loadError) {
    console.error('❌ Model Error State:', { error, loadError, url: cleanUrl });
    return (
      <mesh position={position}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="red" wireframe />
      </mesh>
    );
  }

  if (!model) {
    console.warn(`⚠️ ${type.toUpperCase()} Model not loaded yet from:`, cleanUrl);
    // Show loading placeholder
    return (
      <mesh position={position}>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial color="gray" />
      </mesh>
    );
  }

  return (
    <primitive
      ref={ref}
      object={model}
      scale={scale}
      position={position}
      rotation={rotation}
    />
  );
});

ModelLoader.displayName = 'ModelLoader';

// Preload function for optimization
export const preloadModel = (url, type = 'gltf') => {
  const cleanUrl = url.replace(/([^:]\/)\/+/g, "$1");
  
  if (type === 'fbx') {
    useFBX.preload(cleanUrl);
  } else if (type === 'gltf' || type === 'glb') {
    useGLTF.preload(cleanUrl);
  }
};

export default ModelLoader;