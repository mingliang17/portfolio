// src/sections/projects/ExplodeSection.jsx
/**
 * ExplodeSection - 3D model explosion/reconstruction with scrollable stages
 * 
 * ULTRA-SMOOTH ANIMATIONS:
 * - Damped spring physics for natural movement
 * - Cubic ease-in-out for smooth acceleration/deceleration
 * - No jitter or stutter
 * - Buttery 60fps performance
 * 
 * COORDINATE SYSTEM (THREE.js standard):
 * - X-axis: Left (negative) to Right (positive)
 * - Y-axis: Down (negative) to Up (positive)
 * - Z-axis: Forward/closer (negative) to Back/farther (positive)
 * 
 * CHECKPOINT CONFIGURATION:
 * - title: string - Stage title text
 * - description: string - Stage description text
 * - cameraPos: [x, y, z] - Camera position
 * - modelPos: [x, y, z] - Model position (KEY for left-right movement)
 * - cameraLookAt: [x, y, z] - Where camera looks
 * - modelRot: [x, y, z] - Rotation in radians
 * - modelScale: number - Scale factor
 */
import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { createTimeline } from 'animejs';
import { assetPath } from '@/utils/assetPath.js';

// Advanced easing - cubic ease in-out for ultra-smooth transitions
const easeInOutCubic = (t) => {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

// Damped spring physics for natural, smooth movement
const dampedSpring = (current, target, velocity, deltaTime, stiffness = 0.2, damping = 0.7) => {
  const displacement = target - current;
  const springForce = displacement * stiffness;
  const dampingForce = -velocity * damping;
  const acceleration = springForce + dampingForce;
  
  const newVelocity = velocity + acceleration * deltaTime;
  const newValue = current + newVelocity * deltaTime;
  
  return { value: newValue, velocity: newVelocity };
};

const ReconstructingModel = ({ 
  modelPath, 
  scrollProgress = 0, 
  checkpoints = [], 
  modelAnimationSmoothing = 0.18
}) => {
  const groupRef = useRef();
  const meshesRef = useRef([]);
  const animationStateRef = useRef({ rotation: 0, meshes: [] });
  const timelineRef = useRef(null);
  const { scene } = useGLTF(assetPath(modelPath));
  
  // Damped animation state with velocity tracking
  const dampedStateRef = useRef({
    cameraPos: new THREE.Vector3(0, 5, 30),
    modelPos: new THREE.Vector3(0, -1, 0),
    lookAtPos: new THREE.Vector3(0, -1, 0),
    scale: 0.06,
    cameraVelocity: new THREE.Vector3(0, 0, 0),
    modelVelocity: new THREE.Vector3(0, 0, 0),
    lookAtVelocity: new THREE.Vector3(0, 0, 0),
    scaleVelocity: 0
  });

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

    groupRef.current.add(clonedScene);
    meshesRef.current = meshes;

    const initialState = { rotation: 0, meshes: meshes.map(() => ({ offset: { x: 0, y: 0, z: 0 }, opacity: 1 })) };
    animationStateRef.current = initialState;

    const timeline = createTimeline({ autoplay: false });

    const maxOffsetDistance = 15;
    const fadeOutStartFraction = 0.2;
    const fadeOutEndFraction = 0.5;
    const fadeInStartFraction = 0.5;
    const fadeInEndFraction = 0.8;

    timeline.add({
      targets: initialState,
      rotation: [0, Math.PI * 2],
      duration: 1000,
      easing: 'linear'
    });

    meshes.forEach((mesh, index) => {
      const origPos = mesh.userData.origPos;
      const direction = origPos.clone().normalize();
      const distance = origPos.length();
      const offsetFactor = 1 + distance / 10;
      const targetOffset = {
        x: direction.x * maxOffsetDistance * offsetFactor,
        y: direction.y * maxOffsetDistance * offsetFactor,
        z: direction.z * maxOffsetDistance * offsetFactor,
      };

      timeline.add({
        targets: initialState.meshes[index].offset,
        x: [0, targetOffset.x, 0],
        y: [0, targetOffset.y, 0],
        z: [0, targetOffset.z, 0],
        duration: 1000,
        easing: 'easeInOutQuad'
      }, 0);

      timeline.add({
        targets: initialState.meshes[index],
        opacity: [
          { value: 1, duration: 1000 * fadeOutStartFraction },
          { value: 0.3, duration: 1000 * (fadeOutEndFraction - fadeOutStartFraction) },
          { value: 0.3, duration: 1000 * (fadeInStartFraction - fadeOutEndFraction) },
          { value: 1, duration: 1000 * (fadeInEndFraction - fadeInStartFraction) },
          { value: 1, duration: 1000 * (1 - fadeInEndFraction) }
        ],
        easing: 'linear'
      }, 0);
    });

    timelineRef.current = timeline;

    return () => {
      if (groupRef.current) groupRef.current.clear();
    };
  }, [scene]);

  useEffect(() => {
    if (timelineRef.current) {
      const targetProgress = scrollProgress * 1000;
      timelineRef.current.seek(targetProgress);
    }
  }, [scrollProgress]);

  useFrame(({ camera }, deltaTime) => {
    if (!groupRef.current || meshesRef.current.length === 0) return;
    
    const state = animationStateRef.current;
    
    // Update mesh positions and opacity
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
    
    // Calculate current stage with smooth easing
    const progressIdx = scrollProgress * total;
    const lowerIdx = Math.floor(progressIdx);
    const upperIdx = Math.min(Math.ceil(progressIdx), total);
    const rawRatio = progressIdx - lowerIdx;
    
    // Apply cubic ease in-out for ultra-smooth transitions
    const ratio = easeInOutCubic(rawRatio);

    const cpA = checkpoints[lowerIdx] || {};
    const cpB = checkpoints[upperIdx] || {};

    // Calculate target positions with eased ratio
    const camPosA = cpA.cameraPos || [0, 5, 30];
    const camPosB = cpB.cameraPos || [0, 5, 30];
    const camA = new THREE.Vector3(...camPosA);
    const camB = new THREE.Vector3(...camPosB);
    const targetCamPos = camA.clone().lerp(camB, ratio);

    const modelPosA = cpA.modelPos || [0, -1, 0];
    const modelPosB = cpB.modelPos || [0, -1, 0];
    const posA = new THREE.Vector3(...modelPosA);
    const posB = new THREE.Vector3(...modelPosB);
    const targetModelPos = posA.clone().lerp(posB, ratio);

    const lookAtA = cpA.cameraLookAt ? new THREE.Vector3(...cpA.cameraLookAt) : targetModelPos.clone();
    const lookAtB = cpB.cameraLookAt ? new THREE.Vector3(...cpB.cameraLookAt) : targetModelPos.clone();
    const targetLookAt = lookAtA.clone().lerp(lookAtB, ratio);

    const scaleA = cpA.modelScale ?? 0.06;
    const scaleB = cpB.modelScale ?? 0.06;
    const targetScale = scaleA + (scaleB - scaleA) * ratio;

    // Use damped spring for buttery smooth movement
    const damped = dampedStateRef.current;
    const dt = Math.min(deltaTime, 0.1); // Cap delta time for stability
    
    // Camera position spring (smooth, natural movement)
    ['x', 'y', 'z'].forEach(axis => {
      const result = dampedSpring(
        damped.cameraPos[axis],
        targetCamPos[axis],
        damped.cameraVelocity[axis],
        dt,
        0.25,  // Spring stiffness - controls responsiveness
        0.8    // Damping - controls bounce/overshoot
      );
      damped.cameraPos[axis] = result.value;
      damped.cameraVelocity[axis] = result.velocity;
    });
    camera.position.copy(damped.cameraPos);

    // Model position spring (smooth, natural movement)
    ['x', 'y', 'z'].forEach(axis => {
      const result = dampedSpring(
        damped.modelPos[axis],
        targetModelPos[axis],
        damped.modelVelocity[axis],
        dt,
        0.25,
        0.8
      );
      damped.modelPos[axis] = result.value;
      damped.modelVelocity[axis] = result.velocity;
    });
    groupRef.current.position.copy(damped.modelPos);

    // Look-at position spring (smooth camera tracking)
    ['x', 'y', 'z'].forEach(axis => {
      const result = dampedSpring(
        damped.lookAtPos[axis],
        targetLookAt[axis],
        damped.lookAtVelocity[axis],
        dt,
        0.25,
        0.8
      );
      damped.lookAtPos[axis] = result.value;
      damped.lookAtVelocity[axis] = result.velocity;
    });
    camera.lookAt(damped.lookAtPos);

    // Scale spring (smooth size changes)
    const scaleResult = dampedSpring(
      damped.scale,
      targetScale,
      damped.scaleVelocity,
      dt,
      0.25,
      0.8
    );
    damped.scale = scaleResult.value;
    damped.scaleVelocity = scaleResult.velocity;
    groupRef.current.scale.setScalar(damped.scale);

    // Rotation interpolation (smooth slerp)
    const rotA = new THREE.Euler(...(cpA.modelRot || [0, 0, 0]));
    const rotB = new THREE.Euler(...(cpB.modelRot || [0, 0, 0]));
    const quatA = new THREE.Quaternion().setFromEuler(rotA);
    const quatB = new THREE.Quaternion().setFromEuler(rotB);
    const stageQuat = quatA.clone().slerp(quatB, ratio);
    
    const baseQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, state.rotation, 0));
    const finalQuat = baseQuat.multiply(stageQuat);
    groupRef.current.quaternion.slerp(finalQuat, modelAnimationSmoothing);
  });

  return <primitive ref={groupRef} object={new THREE.Group()} />;
};

const ExplodeSection = ({ 
  modelPath, 
  checkpoints = [], 
  isActive, 
  scrollProgress,
  modelAnimationSmoothing = 0.18
}) => {
  
  // Dynamic height calculation - creates scrollable area
  // 300vh per checkpoint transition = leisurely scroll pace
  const sectionHeight = `${(Math.max(checkpoints.length, 1) - 0.5) * 300}vh`;
  
  // Calculate smooth fade with cubic easing
  const calculateTextOpacity = (stageIndex) => {
    if (checkpoints.length <= 1) return 1;
    
    const stageProgress = stageIndex / (checkpoints.length - 1);
    const distance = Math.abs(scrollProgress - stageProgress);
    const fadeRange = 0.18; // Wide fade range for ultra-smooth transitions
    
    const normalizedDistance = Math.min(distance / fadeRange, 1);
    const smoothFade = 1 - easeInOutCubic(normalizedDistance);
    
    return Math.max(0, smoothFade);
  };

  // Calculate vertical offset with cubic easing
  const calculateVerticalOffset = (stageIndex) => {
    if (checkpoints.length <= 1) return 0;
    
    const stageProgress = stageIndex / (checkpoints.length - 1);
    const distance = scrollProgress - stageProgress;
    
    // Cubic easing for buttery smooth vertical movement
    const easedDistance = distance < 0 
      ? -easeInOutCubic(Math.abs(distance)) 
      : easeInOutCubic(distance);
    
    return easedDistance * 120;
  };

  return (
    <section className="explode-section" style={{ height: sectionHeight }}>
      <div className="explode-sticky-viewport" style={{ position: 'sticky', top: 0 }}>
        {/* 3D Canvas */}
        <div className="explode-canvas-container">
          <Canvas
            camera={{ position: [0, 5, 30], fov: 45 }}
            style={{ background: 'transparent' }}
            gl={{ 
              alpha: true, 
              antialias: true,
              powerPreference: "high-performance",
              stencil: false,
              depth: true
            }}
            dpr={[1, 2]}
            frameloop="always"
          >
            <ambientLight intensity={0.6} />
            <directionalLight position={[10, 10, 5]} intensity={1.2} />
            <directionalLight position={[-10, -10, -5]} intensity={0.5} />
            <Environment preset="city" />
            <React.Suspense fallback={null}>
              <ReconstructingModel 
                modelPath={modelPath} 
                scrollProgress={scrollProgress}
                checkpoints={checkpoints}
                modelAnimationSmoothing={modelAnimationSmoothing}
              />
            </React.Suspense>
          </Canvas>
        </div>

        {/* Text Overlays */}
        {checkpoints.map((cp, idx) => {
          const textOpacity = calculateTextOpacity(idx);
          const verticalOffset = calculateVerticalOffset(idx);
          
          if (textOpacity < 0.01) return null;
          
          const stageIsLeftAligned = idx % 2 === 0;
          
          return (
            <div 
              key={idx}
              className={`stage-text-overlay ${stageIsLeftAligned ? 'align-left' : 'align-right'}`}
              style={{
                position: 'absolute',
                zIndex: 10,
                color: 'white',
                pointerEvents: 'none',
                maxWidth: '500px',
                padding: '2rem',
                top: '50%',
                transform: `translateY(calc(-50% - ${verticalOffset}vh))`,
                left: stageIsLeftAligned ? '5%' : 'auto',
                right: stageIsLeftAligned ? 'auto' : '5%',
                textAlign: stageIsLeftAligned ? 'left' : 'right',
                opacity: textOpacity,
                willChange: 'opacity, transform'
              }}
            >
              <h2 className="stage-title">{cp.title}</h2>
              <p className="stage-description">{cp.description}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default ExplodeSection;