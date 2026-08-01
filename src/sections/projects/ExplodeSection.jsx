// src/sections/projects/ExplodeSection.jsx
// VERTICAL EXPLOSION: Meshes explode downwards in sequence with camera control
import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { assetPath } from '@/utils/assetPath.js';

const ExplodingModel = ({ 
  modelPath, 
  scrollProgress = 0, 
  checkpoints = [],
  explosionDistance = 5,  // Base distance each mesh travels downward
  explosionIncrement = 2   // Additional distance for each subsequent mesh
}) => {
  const groupRef = useRef();
  const { scene } = useGLTF(assetPath(modelPath));
  const { camera } = useThree();

  // Reusable scratch objects to avoid Garbage Collection in the render loop
  const scratch = useRef({
    vec3A: new THREE.Vector3(),
    vec3B: new THREE.Vector3(),
    eulerA: new THREE.Euler(),
    eulerB: new THREE.Euler(),
    targetPos: new THREE.Vector3(),
    targetCamPos: new THREE.Vector3(),
    dummyVec: new THREE.Vector3()
  });

  // Smooth state for model transforms and camera
  const smoothState = useRef({
    position: new THREE.Vector3(0, 0, 0),
    rotation: new THREE.Euler(0, 0, 0),
    scale: 1,
    baseRotation: 0,
    cameraPosition: new THREE.Vector3(0, 0, 30)
  });

  // Memoize model setup so it only runs when scene loads
  const { meshes, originalPositions } = useMemo(() => {
    if (!scene) return { meshes: [], originalPositions: [] };

    console.log('🎨 ExplodeSection: Initializing model...');
    const meshes = [];
    const originalPositions = [];
    
    // Clone scene to avoid mutating the cached GLTF
    const clonedScene = scene.clone(true);

    clonedScene.traverse((child) => {
      if (child.isMesh) {
        child.material = child.material.clone();
        child.material.transparent = true;
        // Store original local position
        originalPositions.push(child.position.clone());
        meshes.push(child);
      }
    });

    console.log(`✅ ExplodeSection: Loaded ${meshes.length} meshes`);
    return { meshes, originalPositions, sceneRoot: clonedScene };
  }, [scene]);

  // Attach the cloned scene to the group
  useEffect(() => {
    if (groupRef.current && scene) {
      groupRef.current.clear();
      
      const cleanRoot = scene.clone(true);
      groupRef.current.add(cleanRoot);
      
      // Update our refs to point to the *new* clones in the scene graph
      const newMeshes = [];
      const newOrigs = [];
      cleanRoot.traverse((c) => {
         if(c.isMesh) {
            c.material = c.material.clone();
            c.material.transparent = true;
            newMeshes.push(c);
            newOrigs.push(c.position.clone());
         }
      });
      // Update the memoized references used in the loop
      meshes.length = 0; 
      originalPositions.length = 0;
      newMeshes.forEach(m => meshes.push(m));
      newOrigs.forEach(p => originalPositions.push(p));
    }
  }, [scene]);

  useFrame(() => {
    if (!groupRef.current || meshes.length === 0) return;

    const smooth = smoothState.current;
    const { vec3A, vec3B, targetPos, targetCamPos } = scratch.current;

    // --- 1. Calculate Explosion Phase (0 to 1 based on scroll progress) ---
    // Map scroll progress to explosion phase
    // At scrollProgress = 0: explosionPhase = 0 (together)
    // At scrollProgress = 1: explosionPhase = 1 (fully exploded)
    
    const explosionPhase = Math.min(Math.max(scrollProgress, 0), 1);

    // Smooth easing for the explosion
    const easedPhase = explosionPhase < 0.5
      ? 2 * explosionPhase * explosionPhase
      : 1 - Math.pow(-2 * explosionPhase + 2, 2) / 2;

    // Opacity: fade slightly during mid-explosion for effect (optional)
    const targetOpacity = easedPhase > 0.3 && easedPhase < 0.7 ? 0.85 : 1.0;

    // --- 2. Update Meshes (Vertical Downward Explosion) ---
    for (let i = 0; i < meshes.length; i++) {
      const mesh = meshes[i];
      const original = originalPositions[i];
      
      // Calculate downward offset based on mesh index
      // Each mesh travels: baseDistance + (index * increment)
      const meshExplosionDistance = explosionDistance + (i * explosionIncrement);
      
      // Vertical offset (downward is negative Y)
      const yOffset = -meshExplosionDistance * easedPhase;
      
      // Calculate final position: original + vertical offset
      vec3A.copy(original);
      vec3A.y += yOffset;
      
      mesh.position.copy(vec3A);
      
      // Opacity Lerp (smooth transition)
      mesh.material.opacity += (targetOpacity - mesh.material.opacity) * 0.1;
    }

    // --- 3. Calculate Global Transforms (Checkpoints) ---
    smooth.baseRotation = scrollProgress * Math.PI * 4;

    if (checkpoints.length > 0) {
      const total = checkpoints.length - 1;
      let ratio = 0;
      let cpA, cpB;

      if (total <= 0) {
        cpA = cpB = checkpoints[0];
      } else {
        const progressIdx = scrollProgress * total;
        const lowerIdx = Math.floor(progressIdx);
        const upperIdx = Math.min(Math.ceil(progressIdx), total);
        ratio = progressIdx - lowerIdx;
        cpA = checkpoints[lowerIdx] || checkpoints[0];
        cpB = checkpoints[upperIdx] || checkpoints[0];
      }

      // Position Interpolation
      const posArrA = cpA.position || [0, 0, 0];
      const posArrB = cpB.position || [0, 0, 0];
      vec3A.set(posArrA[0], posArrA[1], posArrA[2]);
      vec3B.set(posArrB[0], posArrB[1], posArrB[2]);
      targetPos.copy(vec3A).lerp(vec3B, ratio);

      // Rotation Interpolation
      const rotArrA = cpA.rotation || [0, 0, 0];
      const rotArrB = cpB.rotation || [0, 0, 0];
      
      const targetRotX = rotArrA[0] + (rotArrB[0] - rotArrA[0]) * ratio;
      const targetRotY = rotArrA[1] + (rotArrB[1] - rotArrA[1]) * ratio + smooth.baseRotation;
      const targetRotZ = rotArrA[2] + (rotArrB[2] - rotArrA[2]) * ratio;

      // Scale Interpolation
      const scaleA = cpA.scale ?? 1;
      const scaleB = cpB.scale ?? 1;
      const targetScale = scaleA + (scaleB - scaleA) * ratio;

      // Camera Position Interpolation
      const camPosA = cpA.cameraPosition || [0, 0, 30];
      const camPosB = cpB.cameraPosition || [0, 0, 30];
      vec3A.set(camPosA[0], camPosA[1], camPosA[2]);
      vec3B.set(camPosB[0], camPosB[1], camPosB[2]);
      targetCamPos.copy(vec3A).lerp(vec3B, ratio);

      // --- 4. Apply Smooth Dampening to Group and Camera ---
      const damping = 0.08;
      
      smooth.position.lerp(targetPos, damping);
      
      smooth.rotation.x += (targetRotX - smooth.rotation.x) * damping;
      smooth.rotation.y += (targetRotY - smooth.rotation.y) * damping;
      smooth.rotation.z += (targetRotZ - smooth.rotation.z) * damping;
      
      smooth.scale += (targetScale - smooth.scale) * damping;

      // Smooth camera position
      smooth.cameraPosition.lerp(targetCamPos, damping);

      groupRef.current.position.copy(smooth.position);
      groupRef.current.rotation.copy(smooth.rotation);
      groupRef.current.scale.setScalar(smooth.scale);
      
      // Apply camera position
      camera.position.copy(smooth.cameraPosition);
      camera.lookAt(groupRef.current.position);
    }
  });

  return <group ref={groupRef} />;
};

const ExplodeSection = ({ 
  modelPath, 
  checkpoints = [], 
  isActive, 
  scrollProgress,
  explosionDistance = 5,      // Control base downward distance
  explosionIncrement = 2       // Control spacing between meshes
}) => {
  const progressIdx = scrollProgress * Math.max(checkpoints.length - 1, 0);
  
  // Style objects (Static/Memoized to reduce inline object creation)
  const sectionStyle = {
    height: `${Math.max(checkpoints.length, 1) * 120}vh`, 
    backgroundColor: '#050505', 
    position: 'relative',
    overflow: 'visible'
  };

  const stickyStyle = {
    position: 'sticky', 
    top: 0, 
    height: '100vh', 
    width: '100%',
    overflow: 'hidden', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center',
    opacity: isActive ? 1 : 0, 
    transition: 'opacity 0.8s ease'
  };

  const canvasContainerStyle = { position: 'absolute', inset: 0 };
  
  return (
    <section className="explode-section" style={sectionStyle}>
      <div className="explode-sticky-viewport" style={stickyStyle}>
        
        {/* 3D CANVAS */}
        <div className="explode-canvas-container" style={canvasContainerStyle}>
          <Canvas 
            camera={{ position: [0, 0, 30], fov: 45, near: 0.1, far: 1000 }}
            gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
            dpr={[1, 2]}
          >
            <ambientLight intensity={0.6} />
            <directionalLight position={[10, 10, 5]} intensity={1.2} />
            <directionalLight position={[-10, -10, -5]} intensity={0.5} />
            <React.Suspense fallback={null}>
              <ExplodingModel 
                modelPath={modelPath} 
                scrollProgress={scrollProgress} 
                checkpoints={checkpoints}
                explosionDistance={explosionDistance}
                explosionIncrement={explosionIncrement}
              />
            </React.Suspense>
            <Environment preset="city" />
          </Canvas>
        </div>

        {/* TEXT OVERLAYS */}
        {checkpoints.map((cp, idx) => {
          // Opacity Calculation Logic inline to avoid function overhead
          const distance = Math.abs(progressIdx - idx);
          let opacity = 0;
          if (distance <= 0.6) {
             const normalized = 1 - (distance / 0.6);
             opacity = normalized * normalized * (3 - 2 * normalized);
          }

          if (opacity < 0.02) return null;

          const isLeft = idx % 2 === 0;
          const yOffset = (progressIdx - idx) * 30;
          const scale = 0.95 + (opacity * 0.05);

          return (
            <div 
              key={idx}
              style={{
                position: 'absolute',
                top: '50%',
                left: isLeft ? '5%' : 'auto',
                right: isLeft ? 'auto' : '5%',
                transform: `translateY(calc(-50% + ${yOffset}vh)) scale(${scale})`,
                maxWidth: '500px',
                padding: '2rem',
                color: 'white',
                textAlign: isLeft ? 'left' : 'right',
                opacity: opacity,
                zIndex: 10,
                pointerEvents: 'none'
              }}
            >
              <h2 style={{ 
                fontSize: 'clamp(2rem, 5vw, 4.5rem)', 
                fontWeight: 900,
                margin: '0 0 1rem 0',
                textShadow: `0 0 ${20 + opacity * 20}px rgba(0, 255, 204, ${0.3 + opacity * 0.4})`,
                lineHeight: 1.1
              }}>
                {cp.title}
              </h2>
              <p style={{ 
                fontSize: 'clamp(1rem, 1.5vw, 1.3rem)', 
                color: '#00ffcc',
                margin: 0,
                textShadow: `0 0 ${10 + opacity * 15}px rgba(0, 255, 204, ${0.2 + opacity * 0.3})`,
                lineHeight: 1.5,
                opacity: opacity * 0.9
              }}>
                {cp.description}
              </p>
            </div>
          );
        })}

        {/* PROGRESS DOTS */}
        <div style={{
          position: 'absolute', bottom: '2rem', left: '50%', transform: 'translateX(-50%)',
          display: 'flex', gap: '0.6rem', zIndex: 20
        }}>
          {checkpoints.map((_, idx) => {
            const distance = Math.abs(progressIdx - idx);
            const isActiveIdx = distance < 0.5;
            const width = isActiveIdx ? 32 : 10;
            const opacity = Math.max(0.3, 1 - distance * 0.5);
            
            return (
              <div
                key={idx}
                style={{
                  width: `${width}px`, height: '10px', borderRadius: '5px',
                  background: isActiveIdx ? 'linear-gradient(90deg, #00ffcc, #00ff88)' : `rgba(255, 255, 255, ${opacity * 0.5})`,
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: isActiveIdx ? '0 0 20px rgba(0, 255, 204, 0.7)' : 'none'
                }}
              />
            );
          })}
        </div>

        {/* PROGRESS PERCENTAGE */}
        <div style={{
          position: 'absolute', top: '2rem', right: '2rem',
          color: 'rgba(0, 255, 204, 0.6)', fontSize: 'clamp(0.9rem, 1.2vw, 1.1rem)',
          fontWeight: 600, fontFamily: 'monospace', zIndex: 20, pointerEvents: 'none'
        }}>
          {Math.floor(scrollProgress * 100)}%
        </div>
      </div>
    </section>
  );
};

export default ExplodeSection;