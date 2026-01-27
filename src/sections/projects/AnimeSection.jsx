// src/sections/projects/AnimeSection.jsx
import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
// UPDATED: Anime.js v4 functional imports
import { createTimeline, animate } from 'animejs'; 
import { assetPath } from '@/utils/assetPath.js';

// ===================================
// RECONSTRUCTION MODEL
// ===================================
const ReconstructingModel = ({ 
  modelPath, 
  onMeshCountDetected 
}) => {
  const groupRef = useRef();
  const meshesRef = useRef([]);
  const animationStateRef = useRef({
    rotation: 0,
    meshes: []
  });

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
        child.userData.originalPosition = child.position.clone();
        meshes.push(child);
      }
    });

    meshesRef.current = meshes;
    groupRef.current.add(clonedScene);

    animationStateRef.current.meshes = meshes.map(() => ({
      scatterOffset: { x: 0, y: 0, z: 0 },
      opacity: 1
    }));

    groupRef.current.userData.animationState = animationStateRef.current;
    if (onMeshCountDetected) onMeshCountDetected(meshes.length);
  }, [scene, onMeshCountDetected]);

  useFrame(() => {
    if (meshesRef.current.length === 0) return;
    const state = animationStateRef.current;
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
  debugMode = true 
}) => {
  const trackRef = useRef(); 
  const canvasGroupRef = useRef();
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeIdx, setActiveIdx] = useState(0);
  const [meshCount, setMeshCount] = useState(0);
  const timelineRef = useRef(null);

  const checkpointPositions = useMemo(() => 
    checkpoints.map((_, i) => i / (checkpoints.length - 1 || 1)), 
    [checkpoints]
  );

  // UPDATED: Anime.js v4 Timeline creation
  useEffect(() => {
    if (meshCount === 0 || !canvasGroupRef.current) return;
    const animState = canvasGroupRef.current.children[0]?.userData?.animationState;
    if (!animState) return;

    // Use v4 createTimeline
    const tl = createTimeline({
      autoplay: false,
    });

    const phaseDur = 1000;

    // Phase: Rotation (Applied across the whole timeline)
    tl.add(animState, {
      rotation: Math.PI * 8,
      duration: phaseDur * 6,
      ease: 'linear'
    }, 0);

    // Phase: Deconstruction & Reassembly
    animState.meshes.forEach((m, i) => {
      const delay = (i / meshCount) * 1000;
      
      // Explode
      tl.add(m.scatterOffset, {
        x: (Math.random() - 0.5) * 60,
        y: (Math.random() - 0.5) * 60,
        z: (Math.random() - 0.5) * 60,
        duration: phaseDur,
        ease: 'outExpo'
      }, phaseDur + delay);

      tl.add(m, {
        opacity: 0.3,
        duration: phaseDur * 0.5,
      }, phaseDur + delay);

      // Reassemble
      tl.add(m.scatterOffset, {
        x: 0, y: 0, z: 0,
        duration: phaseDur,
        ease: 'outElastic(1, .8)'
      }, phaseDur * 4 + delay);

      tl.add(m, {
        opacity: 1,
        duration: phaseDur * 0.5,
      }, phaseDur * 4 + delay);
    });

    timelineRef.current = tl;
  }, [meshCount]);

  useEffect(() => {
    const handleScroll = () => {
      if (!trackRef.current || !timelineRef.current) return;

      const rect = trackRef.current.getBoundingClientRect();
      const trackHeight = rect.height;
      const vh = window.innerHeight;
      
      const progress = Math.max(0, Math.min(1, -rect.top / (trackHeight - vh)));

      setScrollProgress(progress);
      // v4 Seek uses milliseconds (progress * total duration)
      timelineRef.current.seek(progress * timelineRef.current.duration);

      const nearest = checkpointPositions.reduce((prev, curr, idx) => 
        Math.abs(curr - progress) < Math.abs(checkpointPositions[prev] - progress) ? idx : prev, 0);
      
      if (nearest !== activeIdx) setActiveIdx(nearest);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeIdx, checkpointPositions]);

  return (
    <section 
      ref={trackRef}
      style={{ 
        position: 'relative',
        width: '100%',
        height: '600vh', 
        backgroundColor: '#050505',
        ...(debugMode && { border: '5px solid red' }) // TRACK
      }}
    >
      <div 
        style={{
          position: 'sticky',
          top: 0,
          height: '100vh',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          zIndex: 10,
          ...(debugMode && { border: '5px solid lime' }) // VIEWPORT
        }}
      >
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          <Canvas camera={{ position: [0, 5, 30], fov: 45 }}>
            <color attach="background" args={['#0a0a0a']} />
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1.5} />
            <group ref={canvasGroupRef}>
              <ReconstructingModel 
                modelPath={modelPath}
                onMeshCountDetected={setMeshCount}
              />
            </group>
            <Environment preset="city" />
          </Canvas>
        </div>

        {/* UI Overlay */}
        <div style={{ position: 'relative', zIndex: 10, color: 'white', textAlign: 'center', pointerEvents: 'none' }}>
          <h2 style={{ fontSize: 'clamp(3rem, 8vw, 6rem)', margin: 0, fontWeight: 900, textTransform: 'uppercase' }}>
            {checkpoints[activeIdx].title}
          </h2>
          <p style={{ fontSize: 'clamp(1rem, 2vw, 1.5rem)', color: '#00ffcc' }}>
            {checkpoints[activeIdx].description}
          </p>
        </div>

        {/* Progress Bar */}
        <div style={{
          position: 'absolute',
          bottom: '2rem',
          width: '300px',
          height: '4px',
          background: 'rgba(255,255,255,0.2)',
          borderRadius: '2px',
          overflow: 'hidden'
        }}>
          <div style={{
            height: '100%',
            width: `${scrollProgress * 100}%`,
            background: '#00ffcc',
            transition: 'width 0.1s linear'
          }} />
        </div>

        {debugMode && (
          <div style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(0,255,0,0.2)', padding: '10px', border: '1px solid lime', color: 'lime', fontFamily: 'monospace', fontSize: '12px' }}>
            <div>PROG: {(scrollProgress * 100).toFixed(2)}%</div>
            <div>MESH: {meshCount}</div>
            <div style={{ color: 'red' }}>RED = TRACK</div>
            <div style={{ color: 'lime' }}>LIME = STICKY</div>
          </div>
        )}
      </div>
    </section>
  );
};

useGLTF.preload(assetPath('assets/projects/mh1/models/gltf/mh1_2.gltf'));

export default AnimeSection;