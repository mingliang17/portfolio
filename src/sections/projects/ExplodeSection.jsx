// src/sections/projects/ExplodeSection.jsx
import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { createTimeline } from 'animejs';
import { assetPath } from '@/utils/assetPath.js';
import './ExplodeSection.css';

const ReconstructingModel = ({ 
  modelPath, 
  scrollProgress = 0, 
  checkpoints = [], 
  modelAnimationSmoothing = 0.08 
}) => {
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

    animationStateRef.current.meshes = meshes.map(() => ({
      offset: { x: 0, y: 0, z: 0 },
      opacity: 1
    }));

    const tl = createTimeline({ autoplay: false, loop: false });
    const phase = 1000;
    
    tl.add(animationStateRef.current, {
      rotation: Math.PI * 8,
      duration: phase * 10,
      ease: 'linear'
    }, 0);

    meshes.forEach((m, i) => {
      const mState = animationStateRef.current.meshes[i];
      const delay = (i / meshes.length) * 1000;
      
      tl.add(mState.offset, {
        x: (Math.random() - 0.5) * 60,
        y: (Math.random() - 0.5) * 60,
        z: (Math.random() - 0.5) * 60,
        duration: phase,
        ease: 'outExpo'
      }, phase + delay);

      tl.add(mState, { opacity: 0.3, duration: phase * 0.5 }, phase + delay);

      tl.add(mState.offset, {
        x: 0, y: 0, z: 0,
        duration: phase,
        ease: 'outElastic(1, .8)'
      }, phase * 4 + delay);

      tl.add(mState, { opacity: 1, duration: phase * 0.5 }, phase * 4 + delay);
    });

    timelineRef.current = tl;
  }, [scene, modelPath]);

  useEffect(() => {
    if (timelineRef.current) {
      const tl = timelineRef.current;
      const totalDur = tl.duration;
      const clampedProgress = Math.min(Math.max(scrollProgress, 0), 1);
      tl.seek(clampedProgress * (totalDur * 0.95)); 
    }
  }, [scrollProgress]);

  useFrame(({ camera }) => {
    if (!groupRef.current || meshesRef.current.length === 0) return;
    
    const state = animationStateRef.current;
    
    meshesRef.current.forEach((mesh, i) => {
      const mState = state.meshes[i];
      if (!mState) return;
      const o = mesh.userData.origPos;
      mesh.position.set(o.x + mState.offset.x, o.y + mState.offset.y, o.z + mState.offset.z);
      mesh.material.opacity = mState.opacity;
    });

    if (checkpoints.length === 0) return;
    
    const total = checkpoints.length - 1;
    if (total <= 0) return;
    
    const progressIdx = scrollProgress * total;
    const lowerIdx = Math.floor(progressIdx);
    const upperIdx = Math.ceil(progressIdx);
    const ratio = progressIdx - lowerIdx;

    const cpA = checkpoints[lowerIdx] || {};
    const cpB = checkpoints[upperIdx] || {};

    const camA = new THREE.Vector3(...(cpA.cameraPos || [0, 5, 30]));
    const camB = new THREE.Vector3(...(cpB.cameraPos || [0, 5, 30]));
    const targetCamPos = camA.clone().lerp(camB, ratio);
    camera.position.lerp(targetCamPos, modelAnimationSmoothing);
    camera.lookAt(0, 0, 0);

    const rotA = new THREE.Euler(...(cpA.modelRot || [0, 0, 0]));
    const rotB = new THREE.Euler(...(cpB.modelRot || [0, 0, 0]));
    const quatA = new THREE.Quaternion().setFromEuler(rotA);
    const quatB = new THREE.Quaternion().setFromEuler(rotB);
    const stageQuat = quatA.clone().slerp(quatB, ratio);
    
    const baseQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, state.rotation, 0));
    const finalQuat = baseQuat.multiply(stageQuat);
    groupRef.current.quaternion.slerp(finalQuat, modelAnimationSmoothing);

    const posA = new THREE.Vector3(...(cpA.modelPos || [0, -1, 0]));
    const posB = new THREE.Vector3(...(cpB.modelPos || [0, -1, 0]));
    const targetPos = posA.clone().lerp(posB, ratio);
    groupRef.current.position.lerp(targetPos, modelAnimationSmoothing);

    const scaleA = cpA.modelScale ?? 0.06;
    const scaleB = cpB.modelScale ?? 0.06;
    const targetScale = scaleA + (scaleB - scaleA) * ratio;
    
    const currentScale = groupRef.current.scale.x;
    const newScale = currentScale + (targetScale - currentScale) * modelAnimationSmoothing;
    groupRef.current.scale.setScalar(newScale);
    
    camera.lookAt(groupRef.current.position);
  });

  return <group ref={groupRef} />;
};

const ExplodeSection = ({ 
  modelPath, 
  checkpoints = [], 
  isActive, 
  scrollProgress,
  modelAnimationSmoothing = 0.08
}) => {
  const activeIdx = Math.min(
    Math.floor(scrollProgress * checkpoints.length),
    checkpoints.length - 1
  );

  const isLeftAligned = activeIdx % 2 === 0;

  return (
    <section className="explode-section" style={{ height: `${checkpoints.length * 120}vh` }}>
      <div className={`explode-sticky-viewport ${isActive ? 'active' : ''}`}>
        <div className="explode-canvas-container">
          <Canvas shadows camera={{ position: [0, 5, 30], fov: 45 }}>
            <ambientLight intensity={0.5} />
            <ReconstructingModel 
              modelPath={modelPath} 
              scrollProgress={scrollProgress} 
              checkpoints={checkpoints}
              modelAnimationSmoothing={modelAnimationSmoothing}
            />
            <Environment preset="city" />
          </Canvas>
        </div>

        <div className={`explode-ui-overlay ${isLeftAligned ? 'align-left' : 'align-right'}`}>
          <h2 className="stage-title">
            {checkpoints[activeIdx]?.title}
          </h2>
          <p className="stage-description">
            {checkpoints[activeIdx]?.description}
          </p>
        </div>
      </div>
    </section>
  );
};

export default ExplodeSection;