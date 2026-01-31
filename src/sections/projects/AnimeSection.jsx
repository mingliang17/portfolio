// src/sections/projects/AnimeSection.jsx
// COMPLETE REWRITE - Controlled Component Version
import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { createTimeline } from 'animejs';
import { assetPath } from '@/utils/assetPath.js';

// ===================================
// MODEL COMPONENT
// ===================================
const ReconstructingModel = ({ modelPath, onMeshCountDetected, scrollProgress = 0 }) => {
  const groupRef = useRef();
  const meshesRef = useRef([]);
  const animationStateRef = useRef({
    rotation: 0,
    meshes: []
  });
  
  // Keep track of internal timeline progress
  const timelineRef = useRef(null);

  const { scene } = useGLTF(assetPath(modelPath));

  useEffect(() => {
    if (!scene || !groupRef.current) return;

    console.log('🎨 Loading model:', modelPath);

    groupRef.current.clear();
    const clonedScene = scene.clone(true);
    const meshes = [];

    clonedScene.traverse((child) => {
      if (child.isMesh) {
        child.material = child.material.clone();
        child.material.transparent = true;
        child.userData.originalPosition = child.position.clone();
        meshes.push(child);
      }
    });

    console.log(`✅ Loaded ${meshes.length} meshes`);
    meshesRef.current = meshes;
    groupRef.current.add(clonedScene);

    animationStateRef.current.meshes = meshes.map(() => ({
      scatterOffset: { x: 0, y: 0, z: 0 },
      opacity: 1
    }));

    groupRef.current.userData.animationState = animationStateRef.current;
    
    // Create timeline
    const tl = createTimeline({ autoplay: false });
    const phaseDur = 1000;
    
    // Global Rotation
    tl.add(animationStateRef.current, {
        rotation: Math.PI * 8,
        duration: phaseDur * 6,
        ease: 'linear'
      }, 0);

    meshes.forEach((m, i) => {
      const delay = (i / meshes.length) * 1000;
      const mState = animationStateRef.current.meshes[i];
      
      // Explosion
      tl.add(mState.scatterOffset, {
        x: (Math.random() - 0.5) * 60,
        y: (Math.random() - 0.5) * 60,
        z: (Math.random() - 0.5) * 60,
        duration: phaseDur,
        ease: 'outExpo'
      }, phaseDur + delay);

      tl.add(mState, {
        opacity: 0.3,
        duration: phaseDur * 0.5,
      }, phaseDur + delay);

      // Reconstruction
      tl.add(mState.scatterOffset, {
        x: 0, y: 0, z: 0,
        duration: phaseDur,
        ease: 'outElastic(1, .8)'
      }, phaseDur * 4 + delay);

      tl.add(mState, {
        opacity: 1,
        duration: phaseDur * 0.5,
      }, phaseDur * 4 + delay);
    });

    timelineRef.current = tl;
    if (onMeshCountDetected) onMeshCountDetected(meshes.length);
    
  }, [scene, modelPath, onMeshCountDetected]);

  // Sync timeline with scroll prop
  useEffect(() => {
    if (timelineRef.current) {
        const duration = timelineRef.current.duration;
        // Clamp progress
        const p = Math.max(0, Math.min(1, scrollProgress));
        timelineRef.current.seek(p * duration);
    }
  }, [scrollProgress]);

  useFrame(() => {
    if (meshesRef.current.length === 0) return;
    const state = animationStateRef.current;
    
    // Apply state to actual meshes
    groupRef.current.rotation.y = state.rotation;

    meshesRef.current.forEach((mesh, i) => {
      const mState = state.meshes[i];
      if (!mState) return;
      const orig = mesh.userData.originalPosition;
      
      mesh.position.set(
        orig.x + mState.scatterOffset.x,
        orig.y + mState.scatterOffset.y,
        orig.z + mState.scatterOffset.z
      );
      mesh.material.opacity = mState.opacity;
    });
  });

  return <group ref={groupRef} scale={0.06} position={[0, -1, 0]} />;
};

// ===================================
// MAIN ANIME SECTION
// ===================================
const AnimeSection = ({
  modelPath = 'assets/projects/mh1/models/gltf/mh1_2.gltf',
  checkpoints = [
    { title: 'System Offline', description: 'Initializing core systems...' },
    { title: 'Structural Analysis', description: 'Scanning geometry architecture.' },
    { title: 'Deconstruction', description: 'Separating mesh components.' },
    { title: 'Data Cloud', description: 'Processing vertex data streams.' },
    { title: 'Re-Materializing', description: 'Compiling structure patterns.' },
    { title: 'System Restored', description: 'Reconstruction complete.' }
  ],
  debugMode = false,
  isActive = false,
  scrollProgress = 0 // Controlled prop (0 to 1)
}) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const [meshCount, setMeshCount] = useState(0);
  
  // Calculate active checkpoint based on scroll progress
  useEffect(() => {
    const total = checkpoints.length;
    if (total === 0) return;
    
    // Simple even distribution
    const step = 1 / (total - 1 || 1);
    
    // Find closest checkpoint
    let closestIdx = 0;
    let minDiff = Infinity;
    
    checkpoints.forEach((_, idx) => {
        const cpPos = idx * step;
        const diff = Math.abs(scrollProgress - cpPos);
        if (diff < minDiff) {
            minDiff = diff;
            closestIdx = idx;
        }
    });
    
    setActiveIdx(closestIdx);
  }, [scrollProgress, checkpoints.length]);

  const sectionHeightVh = checkpoints.length * 120 + 100;

  return (
    <section 
      style={{ 
        position: 'relative',
        width: '100%',
        height: `${sectionHeightVh}vh`, // This ensures physical scroll space
        backgroundColor: '#050505',
        color: 'white'
      }}
    >
      {/* STICKY CONTAINER */}
      <div 
        style={{
          position: 'sticky',
          top: 0,
          left: 0,
          height: '100vh',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          zIndex: 10,
          backgroundColor: '#0a0a0a',
          opacity: isActive ? 1 : 0, // Fade out if not active section
          transition: 'opacity 0.5s ease'
        }}
      >
        {/* CANVAS - Only render if relevant to save resources */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
             {/* Always render canvas to maintain state, but maybe lower priority if !isActive? 
                Actually, keeping it rendered prevents flash of reload. */}
          <Canvas camera={{ position: [0, 5, 30], fov: 45 }} dpr={[1, 2]}>
            <color attach="background" args={['#0a0a0a']} />
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1.5} />
            
            <ReconstructingModel 
                modelPath={modelPath}
                onMeshCountDetected={setMeshCount}
                scrollProgress={scrollProgress}
            />
            
            <Environment preset="city" />
          </Canvas>
        </div>

        {/* UI OVERLAY */}
        <div style={{ 
          position: 'relative', 
          zIndex: 10, 
          textAlign: 'center', 
          pointerEvents: 'none',
          maxWidth: '90%',
          padding: '2rem'
        }}>
          <h2 style={{ 
            fontSize: 'clamp(2rem, 6vw, 5rem)', 
            margin: 0, 
            fontWeight: 900, 
            textTransform: 'uppercase',
            textShadow: '0 0 20px rgba(0, 255, 204, 0.5)',
            lineHeight: 1.2
          }}>
            {checkpoints[activeIdx]?.title}
          </h2>
          <p style={{ 
            fontSize: 'clamp(1rem, 2vw, 1.5rem)', 
            color: '#00ffcc',
            marginTop: '1rem'
          }}>
            {checkpoints[activeIdx]?.description}
          </p>
        </div>

        {/* PROGRESS BAR */}
        <div style={{
          position: 'absolute',
          bottom: '2rem',
          width: 'min(300px, 80%)',
          height: '6px',
          background: 'rgba(255,255,255,0.2)',
          borderRadius: '3px',
          overflow: 'hidden'
        }}>
          <div style={{
            height: '100%',
            width: `${scrollProgress * 100}%`,
            background: '#00ffcc',
            transition: 'width 0.1s linear'
          }} />
        </div>

        {/* CHECKPOINT DOTS */}
        <div style={{
          position: 'absolute',
          bottom: '4rem',
          display: 'flex',
          gap: '10px'
        }}>
          {checkpoints.map((_, idx) => (
            <div
              key={idx}
              style={{
                width: idx === activeIdx ? '28px' : '12px',
                height: '12px',
                borderRadius: '6px',
                background: idx === activeIdx ? '#00ffcc' : 'rgba(255,255,255,0.3)',
                transition: 'all 0.3s ease'
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

useGLTF.preload(assetPath('assets/projects/mh1/models/gltf/mh1_2.gltf'));

export default AnimeSection;