// src/sections/projects/ExplodeSection.jsx
// FULLY IMPROVED: Ultra-smooth animations, alternating text, fully flexible positioning
import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { assetPath } from '@/utils/assetPath.js';

const ExplodingModel = ({ modelPath, scrollProgress = 0, checkpoints = [] }) => {
  const groupRef = useRef();
  const meshesRef = useRef([]);
  const originalPositions = useRef([]);
  const { scene } = useGLTF(assetPath(modelPath));
  
  // Animation state with RAF-based smoothing
  const animationState = useRef({
    meshOffsets: [],
    meshOpacities: [],
    baseRotation: 0
  });
  
  // Smooth camera/model state
  const smoothState = useRef({
    cameraPos: new THREE.Vector3(0, 5, 30),
    modelPos: new THREE.Vector3(0, -1, 0),
    lookAtPos: new THREE.Vector3(0, -1, 0),
    modelRot: new THREE.Euler(0, 0, 0),
    scale: 0.06
  });
  
  // Target state for smooth interpolation
  const targetState = useRef({
    cameraPos: new THREE.Vector3(0, 5, 30),
    modelPos: new THREE.Vector3(0, -1, 0),
    lookAtPos: new THREE.Vector3(0, -1, 0),
    modelRot: new THREE.Euler(0, 0, 0),
    scale: 0.06
  });

  // Initialize model
  useEffect(() => {
    if (!scene || !groupRef.current) return;

    console.log('🎨 ExplodeSection: Initializing model...');
    groupRef.current.clear();
    const clonedScene = scene.clone(true);
    const meshes = [];
    const origPos = [];

    clonedScene.traverse((child) => {
      if (child.isMesh) {
        child.material = child.material.clone();
        child.material.transparent = true;
        origPos.push(child.position.clone());
        meshes.push(child);
      }
    });

    meshesRef.current = meshes;
    originalPositions.current = origPos;
    groupRef.current.add(clonedScene);

    // Initialize animation arrays
    animationState.current.meshOffsets = meshes.map(() => new THREE.Vector3(0, 0, 0));
    animationState.current.meshOpacities = meshes.map(() => 1);

    console.log(`✅ ExplodeSection: Loaded ${meshes.length} meshes`);
  }, [scene, modelPath]);

  // Smooth explosion animation using scroll progress
  useEffect(() => {
    const meshes = meshesRef.current;
    const origPos = originalPositions.current;
    if (meshes.length === 0 || origPos.length === 0) return;

    // Map scroll progress to explosion phases
    let explosionPhase = 0;
    
    if (scrollProgress <= 0.2) {
      // Assembled (0-20%)
      explosionPhase = 0;
    } else if (scrollProgress <= 0.4) {
      // Exploding (20-40%)
      explosionPhase = (scrollProgress - 0.2) / 0.2;
    } else if (scrollProgress <= 0.6) {
      // Fully exploded (40-60%)
      explosionPhase = 1;
    } else if (scrollProgress <= 0.8) {
      // Reassembling (60-80%)
      explosionPhase = 1 - ((scrollProgress - 0.6) / 0.2);
    } else {
      // Assembled (80-100%)
      explosionPhase = 0;
    }

    // Smooth easing
    const easedPhase = explosionPhase < 0.5
      ? 2 * explosionPhase * explosionPhase
      : 1 - Math.pow(-2 * explosionPhase + 2, 2) / 2;

    // Update mesh offsets and opacities
    meshes.forEach((mesh, i) => {
      const original = origPos[i];
      if (!original) return;

      const direction = original.clone().normalize();
      const distance = original.length();
      const spreadFactor = 20 * (1 + distance / 10);
      
      const offset = direction.multiplyScalar(spreadFactor * easedPhase);
      animationState.current.meshOffsets[i].copy(offset);
      
      // Opacity: dim during explosion
      const opacityTarget = easedPhase > 0.3 && easedPhase < 0.7 ? 0.4 : 1.0;
      animationState.current.meshOpacities[i] = opacityTarget;
    });

    // Base rotation
    animationState.current.baseRotation = scrollProgress * Math.PI * 4;

  }, [scrollProgress]);

  // Update targets based on checkpoints
  useEffect(() => {
    if (checkpoints.length === 0) return;

    const total = checkpoints.length - 1;
    if (total <= 0) {
      // Single checkpoint
      const cp = checkpoints[0];
      targetState.current.cameraPos.set(...(cp.cameraPos || [0, 5, 30]));
      targetState.current.modelPos.set(...(cp.modelPos || [0, -1, 0]));
      targetState.current.lookAtPos.set(...(cp.cameraLookAt || cp.modelPos || [0, -1, 0]));
      targetState.current.modelRot.set(...(cp.modelRot || [0, 0, 0]));
      targetState.current.scale = cp.modelScale ?? 0.06;
      return;
    }

    const progressIdx = scrollProgress * total;
    const lowerIdx = Math.floor(progressIdx);
    const upperIdx = Math.min(Math.ceil(progressIdx), total);
    const ratio = progressIdx - lowerIdx;

    const cpA = checkpoints[lowerIdx] || checkpoints[0];
    const cpB = checkpoints[upperIdx] || checkpoints[0];

    // Interpolate camera position
    const camA = new THREE.Vector3(...(cpA.cameraPos || [0, 5, 30]));
    const camB = new THREE.Vector3(...(cpB.cameraPos || [0, 5, 30]));
    targetState.current.cameraPos.lerpVectors(camA, camB, ratio);

    // Interpolate model position
    const posA = new THREE.Vector3(...(cpA.modelPos || [0, -1, 0]));
    const posB = new THREE.Vector3(...(cpB.modelPos || [0, -1, 0]));
    targetState.current.modelPos.lerpVectors(posA, posB, ratio);

    // Interpolate look-at
    const lookA = cpA.cameraLookAt ? new THREE.Vector3(...cpA.cameraLookAt) : posA.clone();
    const lookB = cpB.cameraLookAt ? new THREE.Vector3(...cpB.cameraLookAt) : posB.clone();
    targetState.current.lookAtPos.lerpVectors(lookA, lookB, ratio);

    // Interpolate scale
    const scaleA = cpA.modelScale ?? 0.06;
    const scaleB = cpB.modelScale ?? 0.06;
    targetState.current.scale = scaleA + (scaleB - scaleA) * ratio;

    // Interpolate rotation
    const rotA = new THREE.Euler(...(cpA.modelRot || [0, 0, 0]));
    const rotB = new THREE.Euler(...(cpB.modelRot || [0, 0, 0]));
    targetState.current.modelRot.set(
      rotA.x + (rotB.x - rotA.x) * ratio,
      rotA.y + (rotB.y - rotA.y) * ratio,
      rotA.z + (rotB.z - rotA.z) * ratio
    );

  }, [scrollProgress, checkpoints]);

  // SMOOTH RENDER LOOP - 60fps
  useFrame(({ camera }) => {
    if (!groupRef.current || meshesRef.current.length === 0) return;

    const meshes = meshesRef.current;
    const origPos = originalPositions.current;
    const state = animationState.current;
    const smooth = smoothState.current;
    const target = targetState.current;

    // Apply mesh offsets and opacities
    meshes.forEach((mesh, i) => {
      const original = origPos[i];
      if (!original) return;
      
      const offset = state.meshOffsets[i];
      mesh.position.set(
        original.x + offset.x,
        original.y + offset.y,
        original.z + offset.z
      );
      
      // Smooth opacity transition
      const currentOpacity = mesh.material.opacity;
      const targetOpacity = state.meshOpacities[i];
      mesh.material.opacity = currentOpacity + (targetOpacity - currentOpacity) * 0.1;
    });

    // Smooth camera position (lerp factor 0.05-0.15 for butter-smooth movement)
    smooth.cameraPos.lerp(target.cameraPos, 0.08);
    camera.position.copy(smooth.cameraPos);

    // Smooth model position
    smooth.modelPos.lerp(target.modelPos, 0.08);
    groupRef.current.position.copy(smooth.modelPos);

    // Smooth look-at
    smooth.lookAtPos.lerp(target.lookAtPos, 0.08);
    camera.lookAt(smooth.lookAtPos);

    // Smooth scale
    smooth.scale += (target.scale - smooth.scale) * 0.08;
    groupRef.current.scale.setScalar(smooth.scale);

    // Smooth rotation (checkpoint + base rotation)
    const targetRot = target.modelRot.clone();
    targetRot.y += state.baseRotation;
    
    smooth.modelRot.x += (targetRot.x - smooth.modelRot.x) * 0.08;
    smooth.modelRot.y += (targetRot.y - smooth.modelRot.y) * 0.08;
    smooth.modelRot.z += (targetRot.z - smooth.modelRot.z) * 0.08;
    
    groupRef.current.rotation.copy(smooth.modelRot);
  });

  return <group ref={groupRef} />;
};

const ExplodeSection = ({ modelPath, checkpoints = [], isActive, scrollProgress }) => {
  // Calculate current position in checkpoint sequence
  const progressIdx = scrollProgress * Math.max(checkpoints.length - 1, 0);
  
  // Get text opacity for each checkpoint (smooth fading)
  const getTextOpacity = (idx) => {
    if (checkpoints.length <= 1) return idx === 0 ? 1 : 0;
    
    const distance = Math.abs(progressIdx - idx);
    const fadeRange = 0.6; // Wider range = smoother fade
    
    if (distance > fadeRange) return 0;
    
    // Smooth cubic easing
    const normalized = 1 - (distance / fadeRange);
    return normalized * normalized * (3 - 2 * normalized);
  };

  return (
    <section 
      className="explode-section"
      style={{ 
        height: `${Math.max(checkpoints.length, 1) * 120}vh`, 
        backgroundColor: '#050505', 
        position: 'relative',
        overflow: 'visible'
      }}
    >
      <div 
        className="explode-sticky-viewport"
        style={{
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
        }}
      >
        {/* 3D CANVAS */}
        <div className="explode-canvas-container" style={{ position: 'absolute', inset: 0 }}>
          <Canvas 
            camera={{ position: [0, 5, 30], fov: 45 }}
            gl={{ 
              antialias: true, 
              alpha: true,
              powerPreference: "high-performance",
              stencil: false,
              depth: true
            }}
            dpr={[1, 2]}
            performance={{ min: 0.5 }}
          >
            <ambientLight intensity={0.6} />
            <directionalLight position={[10, 10, 5]} intensity={1.2} castShadow />
            <directionalLight position={[-10, -10, -5]} intensity={0.5} />
            <React.Suspense fallback={null}>
              <ExplodingModel 
                modelPath={modelPath} 
                scrollProgress={scrollProgress} 
                checkpoints={checkpoints} 
              />
            </React.Suspense>
            <Environment preset="city" />
          </Canvas>
        </div>

        {/* ALTERNATING TEXT OVERLAYS */}
        {checkpoints.map((cp, idx) => {
          const opacity = getTextOpacity(idx);
          if (opacity < 0.02) return null;

          // Alternate sides: even index = left, odd index = right
          const isLeft = idx % 2 === 0;
          
          // Vertical parallax offset for smooth transition
          const yOffset = (progressIdx - idx) * 30;
          
          // Scale effect based on opacity
          const scale = 0.95 + (opacity * 0.05);

          return (
            <div 
              key={idx}
              className="explode-text-overlay"
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
                pointerEvents: 'none',
                willChange: 'transform, opacity',
                transition: 'none' // Smooth via inline style updates
              }}
            >
              <h2 style={{ 
                fontSize: 'clamp(2rem, 5vw, 4.5rem)', 
                fontWeight: 900,
                margin: '0 0 1rem 0',
                textShadow: `0 0 ${20 + opacity * 20}px rgba(0, 255, 204, ${0.3 + opacity * 0.4})`,
                lineHeight: 1.1,
                letterSpacing: '-0.02em'
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
          position: 'absolute',
          bottom: '2rem',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '0.6rem',
          zIndex: 20,
          alignItems: 'center'
        }}>
          {checkpoints.map((_, idx) => {
            const distance = Math.abs(progressIdx - idx);
            const isActive = distance < 0.5;
            const width = isActive ? 32 : 10;
            const opacity = Math.max(0.3, 1 - distance * 0.5);
            
            return (
              <div
                key={idx}
                style={{
                  width: `${width}px`,
                  height: '10px',
                  borderRadius: '5px',
                  background: isActive 
                    ? 'linear-gradient(90deg, #00ffcc, #00ff88)' 
                    : `rgba(255, 255, 255, ${opacity * 0.5})`,
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: isActive 
                    ? '0 0 20px rgba(0, 255, 204, 0.7)' 
                    : 'none'
                }}
              />
            );
          })}
        </div>

        {/* PROGRESS NUMBER (optional) */}
        <div style={{
          position: 'absolute',
          top: '2rem',
          right: '2rem',
          color: 'rgba(0, 255, 204, 0.6)',
          fontSize: 'clamp(0.9rem, 1.2vw, 1.1rem)',
          fontWeight: 600,
          fontFamily: 'monospace',
          zIndex: 20,
          pointerEvents: 'none'
        }}>
          {Math.floor(scrollProgress * 100)}%
        </div>
      </div>
    </section>
  );
};

export default ExplodeSection;