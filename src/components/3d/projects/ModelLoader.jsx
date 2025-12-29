// src/components/3d/projects/ModelLoader.jsx
import React, { forwardRef, lazy, Suspense, useEffect, useState } from 'react';
import { useFBX, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

// ============================================
// LAZY LOAD JSX COMPONENTS
// ============================================

const Mh1Model = lazy(() => import('./Mh1.jsx').then(module => {
  // Handle both export types
  const Component = module.default || module.Model || module.Mh1Model;
  return { default: Component };
}));

// ============================================
// COMPONENT MAPPER
// ============================================

const COMPONENT_MAP = {
  'Mh1Model': Mh1Model,
  // Add more as you create more JSX components:
  // 'Mh4Model': lazy(() => import('./Mh4.jsx')),
};

// ============================================
// MAIN MODEL LOADER COMPONENT
// ============================================

const ModelLoader = forwardRef(({ 
  // Identification
  projectId,
  componentName,
  
  // Generic model loading
  url,
  type = 'glb',
  
  // Display properties
  scale = 1,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  
  // Callbacks & flags
  onLoad,
  onError,
  debug = false,
  enableShadows = true,
  enableMaterials = true,
  
  // Animation
  animations = {},
  
  // Material overrides
  materialOverrides = {},
  
  // ...rest props
  ...rest
}, ref) => {
  
  const [loadError, setLoadError] = useState(null);
  
  if (debug) {
    console.log('🎨 ModelLoader called:', {
      projectId,
      componentName,
      url,
      type,
      scale,
      position,
      debug
    });
  }

  // ============================================
  // OPTION 1: LOAD CUSTOM JSX COMPONENT
  // ============================================
  if (componentName && COMPONENT_MAP[componentName]) {
    const LazyComponent = COMPONENT_MAP[componentName];
    
    if (debug) {
      console.log(`🔄 Loading JSX component: ${componentName} for project ${projectId}`);
    }
    
    return (
      <Suspense fallback={<FallbackComponent debug={debug} />}>
        <LazyComponent
          ref={ref}
          scale={scale}
          position={position}
          rotation={rotation}
          debug={debug}
          enableShadows={enableShadows}
          materialOverrides={materialOverrides}
          {...rest}
        />
      </Suspense>
    );
  }
  
  // ============================================
  // OPTION 2: LOAD GENERIC MODEL (GLTF/GLB/FBX)
  // ============================================
  if (url) {
    return (
      <GenericModelLoader
        ref={ref}
        url={url}
        type={type}
        scale={scale}
        position={position}
        rotation={rotation}
        onLoad={onLoad}
        onError={(err) => {
          setLoadError(err);
          if (onError) onError(err);
        }}
        debug={debug}
        enableShadows={enableShadows}
        enableMaterials={enableMaterials}
        animations={animations}
        materialOverrides={materialOverrides}
        {...rest}
      />
    );
  }
  
  // ============================================
  // ERROR: No valid configuration
  // ============================================
  const errorMsg = `No valid model configuration for project: ${projectId}`;
  console.error('❌ ModelLoader:', errorMsg);
  
  if (debug) {
    return <ErrorComponent message={errorMsg} />;
  }
  
  return null;
});

ModelLoader.displayName = 'ModelLoader';

// ============================================
// GENERIC MODEL LOADER SUB-COMPONENT
// ============================================

const GenericModelLoader = forwardRef(({
  url,
  type = 'glb',
  scale = 1,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  onLoad,
  onError,
  debug = false,
  enableShadows = true,
  enableMaterials = true,
  animations = {},
  materialOverrides = {},
  ...rest
}, ref) => {
  
  const [model, setModel] = useState(null);
  const [loadingError, setLoadingError] = useState(null);
  const [animationMixer, setAnimationMixer] = useState(null);
  
  // Clean URL
  const cleanUrl = url.replace(/([^:]\/)\/+/g, "$1");
  
  // Load model based on type
  useEffect(() => {
    if (!cleanUrl) {
      const error = new Error('No URL provided for generic model loading');
      setLoadingError(error);
      if (onError) onError(error);
      return;
    }
    
    try {
      let loadedModel = null;
      
      if (type === 'fbx') {
        // For FBX files
        loadedModel = useFBX(cleanUrl);
      } else if (type === 'gltf' || type === 'glb') {
        // For GLTF/GLB files
        const gltf = useGLTF(cleanUrl);
        loadedModel = gltf.scene;
        
        // Handle animations for GLTF/GLB
        if (animations.enabled && gltf.animations && gltf.animations.length > 0) {
          const mixer = new THREE.AnimationMixer(loadedModel);
          gltf.animations.forEach((clip) => {
            const action = mixer.clipAction(clip);
            if (animations.autoPlay) {
              action.play();
            }
          });
          setAnimationMixer(mixer);
        }
      }
      
      setModel(loadedModel);
      if (onLoad) onLoad(loadedModel);
      
    } catch (error) {
      console.error(`❌ Failed to load ${type} model:`, error);
      setLoadingError(error);
      if (onError) onError(error);
    }
  }, [cleanUrl, type, animations.enabled, animations.autoPlay, onLoad, onError]);

  // Update animation mixer
  useEffect(() => {
    if (!animationMixer || !animations.enabled) return;
    
    let frameId;
    const clock = new THREE.Clock();
    
    const animate = () => {
      const delta = clock.getDelta();
      animationMixer.update(delta);
      frameId = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      if (frameId) cancelAnimationFrame(frameId);
      if (animationMixer) animationMixer.stopAllAction();
    };
  }, [animationMixer, animations.enabled]);

  // Apply configurations when model loads
  useEffect(() => {
    if (model && !loadingError) {
      model.traverse((child) => {
        if (child.isMesh) {
          // Shadows
          if (enableShadows) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
          
          // Material updates
          if (enableMaterials && child.material) {
            child.material.needsUpdate = true;
            
            // Apply material overrides if specified
            const materialName = child.material.name || 'unnamed';
            if (materialOverrides[materialName]) {
              Object.assign(child.material, materialOverrides[materialName]);
              if (debug) console.log(`🎨 Overrode material: ${materialName}`);
            }
            
            // Ensure materials are properly configured
            if (child.material.map && !child.material.map.encoding) {
              child.material.map.encoding = THREE.sRGBEncoding;
            }
          }
        }
      });
      
      // Center and normalize model if needed
      if (animations.centerModel) {
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        model.position.x -= center.x;
        model.position.y -= center.y;
        model.position.z -= center.z;
        
        if (debug) {
          console.log(`📐 Model centered:`, { center, size });
        }
      }
      
      if (debug) {
        console.log(`✅ Loaded ${type.toUpperCase()} model:`, {
          url: cleanUrl,
          meshCount: model.children.length,
          hasAnimations: animationMixer !== null,
          position,
          scale
        });
      }
    }
  }, [model, loadingError, cleanUrl, type, debug, enableShadows, enableMaterials, materialOverrides, animations.centerModel, position, scale]);

  // Show error state
  if (loadingError && debug) {
    return <ErrorComponent message={`Failed to load ${type}: ${loadingError.message}`} />;
  }

  // Show loading state
  if (!model) {
    return debug ? <FallbackComponent debug={debug} /> : null;
  }

  // Return loaded model
  return (
    <primitive
      ref={ref}
      object={model}
      scale={scale}
      position={position}
      rotation={rotation}
      {...rest}
    />
  );
});

GenericModelLoader.displayName = 'GenericModelLoader';

// ============================================
// UTILITY COMPONENTS
// ============================================

const FallbackComponent = ({ debug }) => {
  if (!debug) return null;
  
  return (
    <mesh>
      <boxGeometry args={[0.5, 0.5, 0.5]} />
      <meshStandardMaterial 
        color="#666666" 
        emissive="#444444"
        emissiveIntensity={0.3}
        wireframe
      />
    </mesh>
  );
};

const ErrorComponent = ({ message }) => {
  return (
    <mesh position={[0, 1, 0]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial 
        color="#ff3333" 
        emissive="#ff0000"
        emissiveIntensity={0.5}
        wireframe
      />
      {message && (
        <mesh position={[0, 1.5, 0]}>
          <textBufferGeometry args={[message, { fontSize: 0.2, color: '#ffffff' }]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      )}
    </mesh>
  );
};

// ============================================
// PRELOAD UTILITIES
// ============================================

/**
 * Preload a generic model file
 */
export const preloadModel = (url, type = 'glb') => {
  const cleanUrl = url?.replace(/([^:]\/)\/+/g, "$1");
  
  if (!cleanUrl) {
    console.warn('⚠️ Cannot preload: No URL provided');
    return;
  }
  
  try {
    if (type === 'fbx') {
      useFBX.preload(cleanUrl);
    } else if (type === 'gltf' || type === 'glb') {
      useGLTF.preload(cleanUrl);
    }
    console.log(`📦 Preloaded: ${cleanUrl}`);
  } catch (error) {
    console.warn(`⚠️ Failed to preload ${cleanUrl}:`, error);
  }
};

/**
 * Preload JSX components by name
 */
export const preloadComponents = (componentNames = []) => {
  componentNames.forEach(name => {
    if (COMPONENT_MAP[name]) {
      // Trigger lazy import
      COMPONENT_MAP[name]._payload._status = 0; // Mark as loading
    }
  });
};

/**
 * Preload everything for a project
 */
export const preloadProjectModels = (projectConfigs = []) => {
  projectConfigs.forEach(config => {
    if (config.componentName) {
      preloadComponents([config.componentName]);
    }
    if (config.url) {
      preloadModel(config.url, config.type);
    }
  });
};

// ============================================
// EXPORT
// ============================================

export default ModelLoader;