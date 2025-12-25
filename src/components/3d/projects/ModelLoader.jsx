// src/components/3d/projects/ModelLoader.jsx
import { forwardRef, useEffect, useState, useCallback } from 'react';
import { useFBX, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

const ModelLoader = forwardRef(({ 
  url,
  type = 'glb', // 'fbx', 'gltf', or 'glb'
  scale = 1.0,
  position = [0, -1, 0],
  rotation = [0, 0, 0],
  onLoad,
  onError,
}, ref) => {
  const [model, setModel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get base URL and build correct path
  const baseUrl = import.meta.env.BASE_URL || '';
  const fullUrl = url.startsWith('/') 
    ? `${baseUrl}${url.substring(1)}` // Remove leading slash and add baseUrl
    : `${baseUrl}${url}`;

  console.log('🔍 ModelLoader path resolution:', {
    original: url,
    baseUrl,
    fullUrl,
    windowOrigin: window.location.origin
  });

  // Load model based on type
  let loadedData = null;
  
  try {
    if (type === 'fbx') {
      loadedData = useFBX(fullUrl);
    } else if (type === 'gltf' || type === 'glb') {
      const { scene } = useGLTF(fullUrl);
      loadedData = scene;
    }
  } catch (err) {
    // Catch the error but don't set state here to avoid re-renders
    console.error('❌ Model loading error caught:', err);
    // We'll handle the error in useEffect
  }

  // Process the loaded model
  const processModel = useCallback((data) => {
    if (!data) return null;

    console.log('🎨 Processing 3D model...');
    
    // Clone the model
    const modelClone = data.clone();
    
    // Set up shadows and materials
    modelClone.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => {
              mat.needsUpdate = true;
              mat.side = THREE.DoubleSide;
            });
          } else {
            child.material.needsUpdate = true;
            child.material.side = THREE.DoubleSide;
          }
        }
      }
    });

    // Apply transformations
    modelClone.scale.set(scale, scale, scale);
    modelClone.position.set(...position);
    modelClone.rotation.set(...rotation);

    return modelClone;
  }, [scale, position, rotation]);

  // Handle loading and errors
  useEffect(() => {
    if (error) {
      // Already in error state
      return;
    }

    if (loadedData) {
      try {
        const processedModel = processModel(loadedData);
        if (processedModel) {
          setModel(processedModel);
          setLoading(false);
          
          console.log(`✅ ${type.toUpperCase()} Model loaded successfully!`);
          
          if (onLoad) {
            onLoad(processedModel);
          }
        }
      } catch (err) {
        console.error('❌ Error processing model:', err);
        setError(err);
        setLoading(false);
        
        if (onError) {
          onError(err);
        }
      }
    }
  }, [loadedData, error, processModel, type, onLoad, onError]);

  // Test file accessibility on mount
  useEffect(() => {
    const testFile = async () => {
      try {
        console.log('📁 Testing file access:', fullUrl);
        const response = await fetch(fullUrl);
        console.log('📁 File test result:', {
          ok: response.ok,
          status: response.status,
          url: response.url
        });
        
        if (!response.ok) {
          throw new Error(`File not found: ${response.status} ${response.statusText}`);
        }
      } catch (err) {
        console.error('📁 File test failed:', err);
        setError(err);
        setLoading(false);
        
        if (onError) {
          onError(err);
        }
      }
    };

    testFile();
  }, [fullUrl, onError]);

  // Loading state
  if (loading && !error) {
    return (
      <mesh position={position} scale={Math.max(scale * 0.3, 0.3)}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="gray" wireframe />
      </mesh>
    );
  }

  // Error state
  if (error) {
    console.warn('⚠️ ModelLoader in error state:', error.message);
    return (
      <group position={position}>
        <mesh scale={Math.max(scale * 0.5, 0.5)}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="red" />
        </mesh>
        <mesh scale={Math.max(scale * 0.5, 0.5)}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="red" wireframe />
        </mesh>
      </group>
    );
  }

  // Success - render the model
  return model ? (
    <primitive
      ref={ref}
      object={model}
      dispose={null}
    />
  ) : null;
});

ModelLoader.displayName = 'ModelLoader';

export default ModelLoader;