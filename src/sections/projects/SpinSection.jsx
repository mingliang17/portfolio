import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera, Environment } from '@react-three/drei';
import * as THREE from 'three';
import ModelLoader from '../../components/project/ModelLoaderComponent.jsx';
import { assetPath } from '@/utils/assetPath.js';

const RotatingModel = ({ config, easedProgress }) => {
  const groupRef = useRef();
  const { camera } = useThree();
  const checkpoints = config.checkpoints || [];
  const lerpSpeed = 0.08;

  useFrame(() => {
    if (!groupRef.current || checkpoints.length === 0) return;

    const total = checkpoints.length - 1;
    const progressIdx = easedProgress * total;
    const lowerIdx = Math.floor(progressIdx);
    const upperIdx = Math.ceil(progressIdx);
    const ratio = progressIdx - lowerIdx;

    const cpA = checkpoints[lowerIdx] || {};
    const cpB = checkpoints[upperIdx] || {};

    // Camera Zoom/Pos Interpolation
    const camA = new THREE.Vector3(...(cpA.cameraPos || [0, 0, 8]));
    const camB = new THREE.Vector3(...(cpB.cameraPos || [0, 0, 8]));
    camera.position.lerp(camA.clone().lerp(camB, ratio), lerpSpeed);

    // Rotation Interpolation
    const quatA = new THREE.Quaternion().setFromEuler(new THREE.Euler(...(cpA.modelRot || [0, 0, 0])));
    const quatB = new THREE.Quaternion().setFromEuler(new THREE.Euler(...(cpB.modelRot || [0, 0, 0])));
    groupRef.current.quaternion.slerp(quatA.clone().slerp(quatB, ratio), lerpSpeed);

    // Side-Shift Interpolation
    const xOffset = 3.5;
    const shiftA = lowerIdx % 2 === 0 ? xOffset : -xOffset;
    const shiftB = upperIdx % 2 === 0 ? xOffset : -xOffset;
    const posA = new THREE.Vector3(shiftA, 0, 0);
    const posB = new THREE.Vector3(shiftB, 0, 0);
    groupRef.current.position.lerp(posA.lerp(posB, ratio), lerpSpeed);
  });

  return (
    <group ref={groupRef}>
      <ModelLoader {...config} url={assetPath(config.modelUrl)} />
    </group>
  );
};

const SpinSection = ({ checkpoints = [], isActive = false, scrollProgress = 0, ...props }) => {
  // Determine active index for UI elements like the connector line
  const activeIdx = Math.round(scrollProgress * (checkpoints.length - 1));
  const isEven = activeIdx % 2 === 0;
  const lineX2 = isEven ? "10%" : "90%";

  const getCardOpacity = (index) => {
    const total = checkpoints.length - 1;
    if (total === 0) return 1;

    const target = index / total;
    const distance = Math.abs(scrollProgress - target);
    
    // Cards fade out when the scroll is 40% of the way to the next checkpoint
    const fadeRange = 1 / total * 0.4; 
    let opacity = 1 - (distance / fadeRange);

    // Stay visible at boundaries
    if (index === 0 && scrollProgress <= 0.02) return 1;
    if (index === total && scrollProgress >= 0.98) return 1;

    return Math.max(0, Math.min(1, opacity));
  };

  return (
    <section 
      className="spin-section-container" 
      style={{ 
        height: `${checkpoints.length * 100}vh`,
        backgroundColor: props.backgroundColor || '#000'
      }}
    >
      <div 
        className={`spin-canvas-fixed-wrapper ${isActive ? 'active' : ''}`} 
        style={{ 
          position: 'sticky', 
          top: 0, 
          height: '100vh', 
          opacity: isActive ? 1 : 0,
          zIndex: 1
        }}
      >
        <svg className="connector-svg">
          <line x1="50%" y1="50%" x2={lineX2} y2="50%" className="connector-line" />
          <circle cx={lineX2} cy="50%" r="3" fill="#fff" className="connector-dot" />
        </svg>

        <Canvas shadows>
          <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={50} />
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          <RotatingModel config={{ ...props, checkpoints }} easedProgress={scrollProgress} />
          <Environment preset="city" />
        </Canvas>
      </div>

      <div className="spin-checkpoints-container" style={{ position: 'absolute', top: 0, width: '100%' }}>
        {checkpoints.map((cp, i) => {
          const opacity = getCardOpacity(i);
          return (
            <div key={i} className="checkpoint-wrapper" style={{ height: '100vh', display: 'flex', alignItems: 'center' }}>
              <div 
                className={`checkpoint-card ${i % 2 === 0 ? 'card-left' : 'card-right'} ${activeIdx === i ? 'active' : ''}`}
                style={{ 
                  opacity: opacity,
                  transform: `translateY(${(1 - opacity) * 40}px)`,
                  backgroundColor: props.backgroundColor || '#000',
                  pointerEvents: opacity > 0.8 ? 'auto' : 'none'
                }}
              >
                <div className="card-inner">
                  <div className="card-top">
                    <div className="checkpoint-number-circle">{`0${i + 1}`}</div>
                    <h3 className="checkpoint-title">{cp.title}</h3>
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