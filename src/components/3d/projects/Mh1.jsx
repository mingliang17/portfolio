// src/components/3d/projects/Mh1.jsx
import { forwardRef, useEffect } from 'react';
import { useFBX } from '@react-three/drei';

const Mh1 = forwardRef(({ 
  url = 'assets/projects/mh1/models/computer.glb',
  scale = 0.01,
  position = [0, -1, 0],
  rotation = [0, 0, 0],
}, ref) => {
  const model = useFBX(url);

  useEffect(() => {
    if (model) {
      // Traverse and set up shadows
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
      
      console.log('✅ Model loaded:', url);
    }
  }, [model, url]);

  if (!model) {
    console.warn('⚠️ Model not loaded');
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

Mh1.displayName = 'Mh1';

export default Mh1;