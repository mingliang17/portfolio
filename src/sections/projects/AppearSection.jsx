// src/sections/projects/AppearSection.jsx
// REVERSE EXPLOSION: Meshes start fully exploded and hidden, then fade in and reassemble
import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { assetPath } from '@/utils/assetPath.js';

const AppearingModel = ({ 
  modelPath, 
  scrollProgress = 0, 
  checkpoints = [],
  explosionDistance = 5,
  explosionIncrement = 2
}) => {
  const groupRef = useRef();
  const { scene } = useGLTF(assetPath(modelPath));
  const { camera } = useThree();

  // Reusable scratch objects to avoid Garbage Collection
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

  // Memoize model setup
  const { meshes, originalPositions } = useMemo(() => {
    if (!scene) return { meshes: [], originalPositions: [] };

    console.log('🎨 AppearSection: Initializing model...');
    const meshes = [];
    const originalPositions = [];
    
    const clonedScene = scene.clone(true);

    clonedScene.traverse((child) => {
      if (child.isMesh) {
        child.material = child.material.clone();
        child.material.transparent = true;
        child.material.opacity = 0; // Start hidden
        originalPositions.push(child.position.clone());
        meshes.push(child);
      }
    });

    console.log(`✅ AppearSection: Loaded ${meshes.length} meshes`);
    return { meshes, originalPositions, sceneRoot: clonedScene };
  }, [scene]);

  // Attach the cloned scene to the group
  useEffect(() => {
    if (groupRef.current && scene) {
      groupRef.current.clear();
      
      const cleanRoot = scene.clone(true);
      groupRef.current.add(cleanRoot);
      
      const newMeshes = [];
      const newOrigs = [];
      cleanRoot.traverse((c) => {
         if(c.isMesh) {
            c.material = c.material.clone();
            c.material.transparent = true;
            c.material.opacity = 0; // Start hidden
            newMeshes.push(c);
            newOrigs.push(c.position.clone());
         }
      });
      
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

    // --- 1. Calculate Global Transforms (Checkpoints) FIRST ---
    // This is the key: we apply group transforms before mesh calculations
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

      // --- Apply Smooth Dampening to Group and Camera ---
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
      camera.lookAt(0, 0, 0); // Look at world origin
    }

    // --- 2. Calculate Explosion Phase ---
    // REVERSE ANIMATION: 
    // At scrollProgress = 0: fully exploded and hidden (explosionPhase = 1)
    // At scrollProgress = 1: fully assembled and visible (explosionPhase = 0)
    
    const explosionPhase = 1 - Math.min(Math.max(scrollProgress, 0), 1);

    // Smooth easing for the explosion
    const easedPhase = explosionPhase < 0.5
      ? 2 * explosionPhase * explosionPhase
      : 1 - Math.pow(-2 * explosionPhase + 2, 2) / 2;

    // Calculate total stages based on checkpoints
    const totalStages = Math.max(checkpoints.length, 1);
    const meshesPerStage = Math.ceil(meshes.length / totalStages);

    // --- 3. Update Meshes (Vertical Explosion in LOCAL SPACE) ---
    // These positions are RELATIVE to the group position
    for (let i = 0; i < meshes.length; i++) {
      const mesh = meshes[i];
      const original = originalPositions[i];
      
      // Determine which stage this mesh appears in
      const meshStage = Math.floor(i / meshesPerStage);
      const stageProgress = scrollProgress * totalStages;
      
      // Calculate mesh appearance progress (0 = hidden, 1 = fully visible)
      const meshAppearStart = meshStage;
      const meshAppearEnd = meshStage + 1;
      const meshAppearProgress = Math.max(0, Math.min(1, (stageProgress - meshAppearStart) / (meshAppearEnd - meshAppearStart)));
      
      // Ease the appearance
      const easedAppearance = meshAppearProgress < 0.5
        ? 2 * meshAppearProgress * meshAppearProgress
        : 1 - Math.pow(-2 * meshAppearProgress + 2, 2) / 2;
      
      // Calculate downward offset IN LOCAL SPACE
      const meshExplosionDistance = explosionDistance + (i * explosionIncrement);
      
      // Interpolate from exploded position to original position
      const yOffset = -meshExplosionDistance * (1 - easedAppearance);
      
      vec3A.copy(original);
      vec3A.y += yOffset;
      
      mesh.position.copy(vec3A);
      
      // Opacity: fade in as mesh appears
      const targetOpacity = easedAppearance;
      mesh.material.opacity += (targetOpacity - mesh.material.opacity) * 0.1;
    }
  });

  return <group ref={groupRef} />;
};

const AppearSection = ({ 
  modelPath, 
  checkpoints = [], 
  isActive, 
  scrollProgress,
  explosionDistance = 5,
  explosionIncrement = 2
}) => {
  const progressIdx = scrollProgress * Math.max(checkpoints.length - 1, 0);
  
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
    <section className="appear-section" style={sectionStyle}>
      <div className="appear-sticky-viewport" style={stickyStyle}>
        
        {/* 3D CANVAS */}
        <div className="appear-canvas-container" style={canvasContainerStyle}>
          <Canvas 
            camera={{ position: [0, 0, 30], fov: 45, near: 0.1, far: 1000 }}
            gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
            dpr={[1, 2]}
          >
            <ambientLight intensity={0.6} />
            <directionalLight position={[10, 10, 5]} intensity={1.2} />
            <directionalLight position={[-10, -10, -5]} intensity={0.5} />
            <React.Suspense fallback={null}>
              <AppearingModel 
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
              className="appear-text-overlay"
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
                textShadow: `0 0 ${20 + opacity * 20}px rgba(255, 0, 204, ${0.3 + opacity * 0.4})`,
                lineHeight: 1.1
              }}>
                {cp.title}
              </h2>
              <p style={{ 
                fontSize: 'clamp(1rem, 1.5vw, 1.3rem)', 
                color: '#ff00cc',
                margin: 0,
                textShadow: `0 0 ${10 + opacity * 15}px rgba(255, 0, 204, ${0.2 + opacity * 0.3})`,
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
                  background: isActiveIdx ? 'linear-gradient(90deg, #ff00cc, #ff0088)' : `rgba(255, 255, 255, ${opacity * 0.5})`,
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: isActiveIdx ? '0 0 20px rgba(255, 0, 204, 0.7)' : 'none'
                }}
              />
            );
          })}
        </div>

        {/* PROGRESS PERCENTAGE */}
        <div style={{
          position: 'absolute', top: '2rem', right: '2rem',
          color: 'rgba(255, 0, 204, 0.6)', fontSize: 'clamp(0.9rem, 1.2vw, 1.1rem)',
          fontWeight: 600, fontFamily: 'monospace', zIndex: 20, pointerEvents: 'none'
        }}>
          {Math.floor(scrollProgress * 100)}%
        </div>
      </div>
    </section>
  );
};

export default AppearSection;