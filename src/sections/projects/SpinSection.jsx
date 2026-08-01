import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera, Environment } from '@react-three/drei';
import * as THREE from 'three';
import ModelLoader from '../../components/project/ModelLoaderComponent.jsx';
import { assetPath } from '@/utils/assetPath.js';

const RotatingModel = ({ config, rawProgress, modelAnimationSmoothing = 0.08 }) => {
  const groupRef = useRef();
  const { camera } = useThree();
  const checkpoints = config.checkpoints || [];

  useFrame(() => {
    if (!groupRef.current || checkpoints.length === 0) return;

    const total = checkpoints.length - 1;
    const progressIdx = rawProgress * total;
    const lowerIdx = Math.floor(progressIdx);
    const upperIdx = Math.ceil(progressIdx);
    const ratio = progressIdx - lowerIdx;

    const cpA = checkpoints[lowerIdx] || {};
    const cpB = checkpoints[upperIdx] || {};

    // Camera Zoom/Pos Interpolation
    const camA = new THREE.Vector3(...(cpA.cameraPos || [0, 0, 8]));
    const camB = new THREE.Vector3(...(cpB.cameraPos || [0, 0, 8]));
    camera.position.lerp(camA.clone().lerp(camB, ratio), modelAnimationSmoothing);

    // Rotation Interpolation
    const quatA = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(...(cpA.modelRot || [0, 0, 0]))
    );
    const quatB = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(...(cpB.modelRot || [0, 0, 0]))
    );
    groupRef.current.quaternion.slerp(quatA.clone().slerp(quatB, ratio), modelAnimationSmoothing);

    // Side-Shift Interpolation
    const xOffset = 3.5;
    const shiftA = lowerIdx % 2 === 0 ? xOffset : -xOffset;
    const shiftB = upperIdx % 2 === 0 ? xOffset : -xOffset;
    const posA = new THREE.Vector3(shiftA, 0, 0);
    const posB = new THREE.Vector3(shiftB, 0, 0);
    groupRef.current.position.lerp(posA.lerp(posB, ratio), modelAnimationSmoothing);
  });

  return (
    <group ref={groupRef}>
      <ModelLoader {...config} url={assetPath(config.modelUrl)} />
    </group>
  );
};

const SpinSection = ({ 
  checkpoints = [], 
  isActive = false, 
  scrollProgress = 0,
  enableDebug = false,
  modelAnimationSmoothing = 0.08,
  blurAmount = 8,
  ...props 
}) => {
  const easedProgress = useMemo(() => {
    if (checkpoints.length === 0) return 0;

    const numCheckpoints = checkpoints.length;
    const totalSegments = numCheckpoints - 1;
    if (totalSegments === 0) return 0;
    
    const PAUSE_ZONE = 0.15;
    const totalCheckpoints = Math.max(1, numCheckpoints);
    const segmentSize = 1 / (totalCheckpoints - 1);

    for (let i = 0; i < numCheckpoints; i++) {
        const target = i * segmentSize;
        const low = target - PAUSE_ZONE * segmentSize;
        const high = target + PAUSE_ZONE * segmentSize;

        if (scrollProgress >= low && scrollProgress <= high) {
            return target;
        }
    }

    for (let i = 0; i < numCheckpoints - 1; i++) {
        const startTarget = i * segmentSize;
        const endTarget = (i + 1) * segmentSize;
        
        const pauseEnd = startTarget + PAUSE_ZONE * segmentSize;
        const nextPauseStart = endTarget - PAUSE_ZONE * segmentSize;

        if (scrollProgress > pauseEnd && scrollProgress < nextPauseStart) {
            const range = nextPauseStart - pauseEnd;
            const progressInOut = (scrollProgress - pauseEnd) / range;
            return startTarget + progressInOut * (endTarget - startTarget);
        }
    }
    
    return scrollProgress;
  }, [scrollProgress, checkpoints.length]);

  useEffect(() => {
    if (enableDebug) {
      console.log('📊 SpinSection Progress:', {
        raw: scrollProgress.toFixed(3),
        eased: easedProgress.toFixed(3),
        active: isActive
      });
    }
  }, [scrollProgress, easedProgress, isActive, enableDebug]);

  const activeIdx = Math.round(easedProgress * (checkpoints.length - 1));
  const isEven = activeIdx % 2 === 0;

  // Calculate background transition progress
  const transitionProgress = easedProgress * (checkpoints.length - 1) - activeIdx;

  const getCardBlur = (index) => {
    const total = checkpoints.length - 1;
    if (total === 0) return 0;

    const target = index / total;
    const distance = Math.abs(easedProgress - target);
    
    const blurRange = (1 / total) * 0.35;
    let blur = (distance / blurRange) * blurAmount;
    
    if (index === 0 && easedProgress <= 0.05) return 0;
    if (index === total && easedProgress >= 0.95) return 0;

    return Math.min(blurAmount, Math.max(0, blur));
  };

  const getCardOpacity = (index) => {
    const blur = getCardBlur(index);
    const minOpacity = 0.3;
    return minOpacity + (1 - minOpacity) * (1 - blur / blurAmount);
  };

  const getCardTransform = (index) => {
    const blur = getCardBlur(index);
    const opacity = getCardOpacity(index);
    const isActive = blur < 0.1;
    
    return {
      blur,
      opacity,
      isActive
    };
  };

  // Get background styles for current and next stage
  const getCurrentBackground = () => {
    const current = checkpoints[activeIdx];
    if (!current || !current.background) return null;
    
    if (current.background.type === 'color') {
      return {
        background: current.background.value || '#000'
      };
    } else if (current.background.type === 'image') {
      return {
        backgroundImage: `url(${current.background.value})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      };
    } else if (current.background.type === 'gradient') {
      return {
        background: current.background.value || 'linear-gradient(to bottom, #000, #333)'
      };
    }
    return null;
  };

  const getNextBackground = () => {
    if (activeIdx >= checkpoints.length - 1) return null;
    const next = checkpoints[activeIdx + 1];
    if (!next || !next.background) return null;
    
    if (next.background.type === 'color') {
      return {
        background: next.background.value || '#000'
      };
    } else if (next.background.type === 'image') {
      return {
        backgroundImage: `url(${next.background.value})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      };
    } else if (next.background.type === 'gradient') {
      return {
        background: next.background.value || 'linear-gradient(to bottom, #000, #333)'
      };
    }
    return null;
  };

  const currentBg = getCurrentBackground();
  const nextBg = getNextBackground();

  return (
    <section 
      className="spin-section-container" 
      style={{ 
        height: `${checkpoints.length * 100}vh`,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Current Background Layer */}
      <div 
        className="spin-background-layer current"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          opacity: 1 - transitionProgress,
          transition: 'opacity 0.5s ease',
          ...(currentBg || { background: props.backgroundColor || '#000' })
        }}
      />

      {/* Next Background Layer with 5-degree tilt */}
      {nextBg && (
        <div 
          className="spin-background-layer next"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1,
            opacity: transitionProgress,
            transition: 'opacity 0.5s ease',
            transformOrigin: 'top left',
            transform: `rotate(-5deg) scale(1.2)`,
            ...nextBg
          }}
        />
      )}

      {/* Debug Overlay */}
      {enableDebug && (
        <div style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          background: 'rgba(0,0,0,0.8)',
          color: '#0f0',
          padding: '10px',
          fontFamily: 'monospace',
          fontSize: '12px',
          zIndex: 9999,
          borderRadius: '4px',
          maxWidth: '250px'
        }}>
          <div>Raw Progress: {scrollProgress.toFixed(4)}</div>
          <div>Eased Progress: {easedProgress.toFixed(4)}</div>
          <div>Active Card: {activeIdx}</div>
          <div>Total Cards: {checkpoints.length}</div>
          <div>Model Checkpoint: {(scrollProgress * (checkpoints.length - 1)).toFixed(2)}</div>
          <div>Is Active: {isActive ? 'YES' : 'NO'}</div>
          <div>Transition: {(transitionProgress * 100).toFixed(1)}%</div>
        </div>
      )}

      {/* Fixed 3D Canvas */}
      <div 
        className={`spin-canvas-fixed-wrapper ${isActive ? 'active' : ''}`} 
        style={{ 
          position: 'sticky', 
          top: 0, 
          height: '100vh', 
          opacity: isActive ? 1 : 0,
          zIndex: 2
        }}
      >
        <Canvas shadows>
          <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={50} />
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          <RotatingModel 
            config={{ ...props, checkpoints }} 
            rawProgress={scrollProgress}
            modelAnimationSmoothing={modelAnimationSmoothing}
          />
          <Environment preset="city" />
        </Canvas>
      </div>

      {/* Checkpoint Cards */}
      <div className="spin-checkpoints-container" style={{ zIndex: 3 }}>
        {checkpoints.map((cp, i) => {
          const cardTransform = getCardTransform(i);
          
          return (
            <div 
              key={i} 
              className="checkpoint-wrapper" 
            >
              <div 
                className={`checkpoint-card ${
                  i % 2 === 0 ? 'card-left' : 'card-right'
                } ${cardTransform.isActive ? 'active' : ''}`}
                style={{ 
                  filter: `blur(${cardTransform.blur}px)`,
                  opacity: cardTransform.opacity,
                  pointerEvents: cardTransform.isActive ? 'auto' : 'none'
                }}
              >
                <div className="card-inner">
                  <div className="card-top">
                    <div className="checkpoint-number-circle flex-center">
                      {`0${i + 1}`}
                    </div>
                    <div className="checkpoint-title">{cp.title}</div>
                  </div>
                  <div className="checkpoint-center-marker" />
                  <div className="card-bottom">
                    <p className="checkpoint-description">{cp.description}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default SpinSection;