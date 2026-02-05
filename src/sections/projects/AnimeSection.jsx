// src/sections/projects/AnimeSection.jsx
import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { createTimeline } from 'animejs';
import { assetPath } from '@/utils/assetPath.js';

const ReconstructingModel = ({ modelPath, scrollProgress = 0 }) => {
  const groupRef = useRef();
  const meshesRef = useRef([]);
  const animationStateRef = useRef({ rotation: 0, meshes: [] });
  const timelineRef = useRef(null);
  const { scene } = useGLTF(assetPath(modelPath));

  useEffect(() => {
    if (!scene || !groupRef.current) return;

    groupRef.current.clear();
    const clonedScene = scene.clone(true);
    const meshes = [];

    clonedScene.traverse((child) => {
      if (child.isMesh) {
        child.material = child.material.clone();
        child.material.transparent = true;
        child.userData.origPos = child.position.clone();
        meshes.push(child);
      }
    });

    meshesRef.current = meshes;
    groupRef.current.add(clonedScene);

    // Initialize state
    animationStateRef.current.meshes = meshes.map(() => ({
      offset: { x: 0, y: 0, z: 0 },
      opacity: 1
    }));

    // 1. CREATE TIMELINE WITH BUFFER
    // We make the timeline longer than the scroll range to "park" the playhead
    const tl = createTimeline({ autoplay: false, loop: false });
    const phase = 1000;
    
    // Global Rotation
    tl.add(animationStateRef.current, {
      rotation: Math.PI * 8,
      duration: phase * 10, // Longer duration
      ease: 'linear'
    }, 0);

    meshes.forEach((m, i) => {
      const mState = animationStateRef.current.meshes[i];
      const delay = (i / meshes.length) * 1000;
      
      // Explosion
      tl.add(mState.offset, {
        x: (Math.random() - 0.5) * 60,
        y: (Math.random() - 0.5) * 60,
        z: (Math.random() - 0.5) * 60,
        duration: phase,
        ease: 'outExpo'
      }, phase + delay);

      tl.add(mState, { opacity: 0.3, duration: phase * 0.5 }, phase + delay);

      // Reconstruction (Ends at phase * 6)
      tl.add(mState.offset, {
        x: 0, y: 0, z: 0,
        duration: phase,
        ease: 'outElastic(1, .8)'
      }, phase * 4 + delay);

      tl.add(mState, { opacity: 1, duration: phase * 0.5 }, phase * 4 + delay);
    });

    timelineRef.current = tl;
  }, [scene, modelPath]);

  // 2. BULLETPROOF SEEK LOGIC
  useEffect(() => {
    if (timelineRef.current) {
      const tl = timelineRef.current;
      // We limit the seek range to 95% of the timeline. 
      // The model is fully reconstructed by 80%, so it stays "parked" 
      // in the assembled state for the final 15% of the scroll.
      const totalDur = tl.duration;
      const clampedProgress = Math.min(Math.max(scrollProgress, 0), 1);
      tl.seek(clampedProgress * (totalDur * 0.95)); 
    }
  }, [scrollProgress]);

  useFrame(() => {
    if (!groupRef.current || meshesRef.current.length === 0) return;
    const state = animationStateRef.current;
    groupRef.current.rotation.y = state.rotation;

    meshesRef.current.forEach((mesh, i) => {
      const mState = state.meshes[i];
      if (!mState) return;
      const o = mesh.userData.origPos;
      mesh.position.set(o.x + mState.offset.x, o.y + mState.offset.y, o.z + mState.offset.z);
      mesh.material.opacity = mState.opacity;
    });
  });

  return <group ref={groupRef} scale={0.06} position={[0, -1, 0]} />;
};

const AnimeSection = ({ modelPath, checkpoints = [], isActive, scrollProgress }) => {
  const activeIdx = Math.min(
    Math.floor(scrollProgress * checkpoints.length),
    checkpoints.length - 1
  );

  return (
    <section style={{ height: `${checkpoints.length * 120}vh`, backgroundColor: '#050505', position: 'relative' }}>
      <div style={{
        position: 'sticky', top: 0, height: '100vh', width: '100%',
        overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: isActive ? 1 : 0, transition: 'opacity 0.8s ease'
      }}>
        <div style={{ position: 'absolute', inset: 0 }}>
          <Canvas camera={{ position: [0, 5, 30], fov: 45 }}>
            <ambientLight intensity={0.5} />
            <ReconstructingModel modelPath={modelPath} scrollProgress={scrollProgress} />
            <Environment preset="city" />
          </Canvas>
        </div>

        <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', pointerEvents: 'none', color: 'white' }}>
          <h2 style={{ fontSize: 'clamp(2rem, 6vw, 5rem)', fontWeight: 900 }}>{checkpoints[activeIdx]?.title}</h2>
          <p style={{ color: '#00ffcc' }}>{checkpoints[activeIdx]?.description}</p>
        </div>
      </div>
    </section>
  );
};

export default AnimeSection;