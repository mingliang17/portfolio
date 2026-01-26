import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera, Environment, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { createTimeline } from 'animejs'; 
import { assetPath } from '@/utils/assetPath.js';

const ModelEngine = ({ animationState, onLoaded }) => {
  const groupRef = useRef();
  const { scene } = useGLTF(assetPath('assets/projects/mh1/models/gltf/mh1_2.gltf'));
  const meshesRef = useRef([]);

  useEffect(() => {
    if (!scene) return;
    const meshes = [];
    const clonedScene = scene.clone(true);
    clonedScene.traverse((child) => {
      if (child.isMesh) {
        child.material = child.material.clone();
        child.material.transparent = true;
        meshes.push(child);
      }
    });
    meshesRef.current = meshes;
    groupRef.current.add(clonedScene);
    if (onLoaded) onLoaded(meshes.length);
  }, [scene, onLoaded]);

  useFrame(() => {
    if (!animationState.current || meshesRef.current.length === 0) return;
    const state = animationState.current;
    groupRef.current.rotation.y = state.rotation;
    meshesRef.current.forEach((mesh, i) => {
      const pos = state.meshPositions[i];
      const opacityObj = state.meshOpacity[i];
      if (pos) mesh.position.set(pos.x, pos.y, pos.z);
      if (opacityObj) mesh.material.opacity = opacityObj.value;
    });
  });

  return <group ref={groupRef} scale={0.06} position={[0, -1, 0]} />;
};

const AnimeSection = () => {
  // We don't need a local trackRef anymore, we use the one provided by ProjectTemplate
  const [meshCount, setMeshCount] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [currentPhase, setCurrentPhase] = useState(1);
  const timelineRef = useRef(null);

  const animationState = useRef({
    rotation: 0,
    meshPositions: [], 
    meshOpacity: []   
  });

  const phases = [
    { id: 1, title: "Structural Scan", color: "#667eea" },
    { id: 2, title: "Deconstruction", color: "#f59e0b" },
    { id: 3, title: "Reassembly", color: "#10b981" },
    { id: 4, title: "Complete", color: "#8b5cf6" }
  ];

  const handleModelLoaded = useCallback((count) => {
    animationState.current.meshPositions = Array.from({ length: count }, () => ({ x: 0, y: 0, z: 0 }));
    animationState.current.meshOpacity = Array.from({ length: count }, () => ({ value: 1 }));
    setMeshCount(count);
  }, []);

  useEffect(() => {
    if (meshCount === 0) return;
    const tl = createTimeline({ autoplay: false, duration: 10000 });
    const state = animationState.current;

    // Timeline Definition
    tl.add(state, { rotation: Math.PI * 2, duration: 2000 }, 0);
    const step = 4000 / meshCount;
    for (let i = 0; i < meshCount; i++) {
      const start = 2000 + (i * step);
      tl.add(state.meshPositions[i], {
        x: (Math.random() - 0.5) * 40, y: (Math.random() - 0.5) * 40, z: (Math.random() - 0.5) * 40,
        duration: 2000, ease: 'outExpo'
      }, start);
      tl.add(state.meshOpacity[i], { value: 0, duration: 1000 }, start + 500);
    }
    // Reassembly
    tl.add(state, { rotation: Math.PI * 8, duration: 4000 }, 6000);
    state.meshPositions.forEach((pos, i) => {
        tl.add(pos, { x: 0, y: 0, z: 0, duration: 2000 }, 6500 + (i * (2000/meshCount)));
        tl.add(animationState.current.meshOpacity[i], { value: 1, duration: 1000 }, 7000 + (i * (1000/meshCount)));
    });

    timelineRef.current = tl;
  }, [meshCount]);

  useEffect(() => {
    const handleScroll = () => {
      // Find the parent section created by ProjectTemplate
      const parentSection = document.querySelector('.overflow-section'); 
      if (!parentSection || !timelineRef.current) return;

      const rect = parentSection.getBoundingClientRect();
      const windowH = window.innerHeight;
      
      // Calculate how far we have scrolled into the 800vh parent
      const totalScrollable = rect.height - windowH;
      const progress = Math.min(Math.max(-rect.top / totalScrollable, 0), 1);
      
      timelineRef.current.seek(progress * timelineRef.current.duration);
      setScrollProgress(progress);
      
      if (progress < 0.2) setCurrentPhase(1);
      else if (progress < 0.6) setCurrentPhase(2);
      else if (progress < 0.85) setCurrentPhase(3);
      else setCurrentPhase(4);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [meshCount]);

  return (
    <div style={{ 
      position: 'sticky', 
      top: 0, 
      height: '100vh', 
      width: '100%', 
      background: '#050a0f',
      overflow: 'hidden' 
    }}>
      <div style={{ position: 'absolute', inset: 0 }}>
        <Canvas shadows>
          <PerspectiveCamera makeDefault position={[0, 1, 18]} fov={30} />
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1.5} />
          <ModelEngine animationState={animationState} onLoaded={handleModelLoaded} />
          <Environment preset="city" />
        </Canvas>
      </div>

      <div style={{ position: 'relative', zIndex: 10, padding: '10vh 10%', color: 'white', pointerEvents: 'none' }}>
        <p style={{ color: phases[currentPhase-1].color, fontWeight: 'bold' }}>PHASE 0{currentPhase}</p>
        <h2 style={{ fontSize: '4rem', margin: 0 }}>{phases[currentPhase-1].title}</h2>
        <div style={{ width: '300px', height: '2px', background: 'rgba(255,255,255,0.1)', marginTop: '20px' }}>
          <div style={{ height: '100%', width: `${scrollProgress * 100}%`, background: phases[currentPhase-1].color }} />
        </div>
      </div>
    </div>
  );
};

export default AnimeSection;