// src/components/3d/projects/ModelLoader.jsx
// FINAL FIX: Proper hook usage without try-catch

import { forwardRef, useEffect } from 'react';
import { useFBX, useGLTF } from '@react-three/drei';

const ModelLoader = forwardRef(({ 
  url,
  type = 'glb',
  scale = 1,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  onLoad,
}, ref) => {
  
  // Clean the URL - remove double slashes
  const cleanUrl = url.replace(/([^:]\/)\/+/g, "$1");
  
  console.log('🔍 ModelLoader loading:', {
    originalUrl: url,
    cleanedUrl: cleanUrl,
    type: type
  });

  // Load model based on type - NO TRY-CATCH AROUND HOOKS!
  let model = null;
  
  if (type === 'fbx') {
    model = useFBX(cleanUrl);
  } else if (type === 'gltf' || type === 'glb') {
    // useGLTF returns the entire GLTF object with scene, animations, etc.
    const gltf = useGLTF(cleanUrl);
    model = gltf.scene;
  }

  // Setup model after it loads
  useEffect(() => {
    if (model) {
      // Traverse and configure the model
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          
          if (child.material) {
            child.material.needsUpdate = true;
          }
        }
      });
      
      console.log(`✅ ${type.toUpperCase()} Model loaded successfully:`, cleanUrl);
      
      // Callback when model is ready
      if (onLoad) {
        onLoad(model);
      }
    }
  }, [model, cleanUrl, type, onLoad]);

  // If no model yet, return null - Suspense will handle loading state
  if (!model) {
    return null;
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
export const preloadModel = (url, type = 'glb') => {
  const cleanUrl = url.replace(/([^:]\/)\/+/g, "$1");
  
  if (type === 'fbx') {
    useFBX.preload(cleanUrl);
  } else if (type === 'gltf' || type === 'glb') {
    useGLTF.preload(cleanUrl);
  }
};

export default ModelLoader;