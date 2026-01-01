// src/sections/projects/SpinSection.jsx
// UPDATED: Show drag indicator at end of section

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera, Environment } from '@react-three/drei';
import ModelLoader from '../../components/project/ModelLoaderComponent.jsx';
import gsap from 'gsap';

const BASE_URL = import.meta.env.BASE_URL || '/';
const assetPath = (path) => `${BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;

const RotatingModel = ({ 
  componentName, 
  modelUrl, 
  modelType, 
  scale, 
  position, 
  rotation: initialRotation,
  scrollProgress,
  rotationsPerScroll = 2,
  enableShadows 
}) => {
  const modelRef = useRef();
  const processedUrl = modelUrl ? assetPath(modelUrl) : null;

  useFrame(() => {
    if (modelRef.current) {
      const targetRotationY = (initialRotation?.[1] || 0) + (scrollProgress * Math.PI * 2 * rotationsPerScroll);
      modelRef.current.rotation.y += (targetRotationY - modelRef.current.rotation.y) * 0.1;
    }
  });

  return (
    <group ref={modelRef}>
      <ModelLoader
        componentName={componentName}
        url={processedUrl}
        type={modelType}
        scale={scale}
        position={position}
        rotation={initialRotation}
        enableShadows={enableShadows}
      />
    </group>
  );
};

const Checkpoint = ({ 
  checkpoint, 
  index, 
  isActive, 
  isVisible,
  side 
}) => {
  const ref = useRef();

  useEffect(() => {
    if (ref.current) {
      if (isVisible) {
        gsap.to(ref.current, {
          opacity: isActive ? 1 : 0.3,
          x: 0,
          duration: 0.8,
          ease: 'power3.out'
        });
      } else {
        gsap.to(ref.current, {
          opacity: 0,
          x: side === 'left' ? -100 : 100,
          duration: 0.5,
          ease: 'power2.in'
        });
      }
    }
  }, [isActive, isVisible, side]);

  return (
    <div
      ref={ref}
      className={`checkpoint-card checkpoint-${side}`}
      style={{
        opacity: 0,
        transform: side === 'left' ? 'translateX(-100px)' : 'translateX(100px)'
      }}
    >
      <div className="checkpoint-number">{index + 1}</div>
      <h3 className="checkpoint-title">{checkpoint.title}</h3>
      <p className="checkpoint-description">{checkpoint.description}</p>
    </div>
  );
};

const SpinSection = ({
  componentName,
  modelUrl,
  modelType = 'gltf',
  scale = 1,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  cameraPosition = [0, 0, 8],
  cameraFov = 50,
  environment = 'city',
  backgroundColor = '#000000',
  enableShadows = true,
  checkpoints = [],
  rotationsPerScroll = 2,
  scrollMultiplier = 2
}) => {
  const containerRef = useRef();
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeCheckpoint, setActiveCheckpoint] = useState(0);
  const [isNearEnd, setIsNearEnd] = useState(false);

  const checkpointPositions = useMemo(() => {
    if (!checkpoints.length) return [];
    return checkpoints.map((_, index) => index / (checkpoints.length - 1 || 1));
  }, [checkpoints]);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const containerHeight = rect.height;
      const viewportHeight = window.innerHeight;
      
      const scrollStart = rect.top - viewportHeight;
      const scrollEnd = rect.bottom;
      const scrollRange = scrollEnd - scrollStart;
      const currentScroll = -scrollStart;
      
      const progress = Math.max(0, Math.min(1, currentScroll / scrollRange));
      setScrollProgress(progress);

      // Check if near end (last 10%)
      setIsNearEnd(progress > 0.9);

      const checkpoint = checkpointPositions.findIndex((pos, idx) => {
        const nextPos = checkpointPositions[idx + 1] || 1;
        return progress >= pos && progress < nextPos;
      });
      
      if (checkpoint !== -1 && checkpoint !== activeCheckpoint) {
        setActiveCheckpoint(checkpoint);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [checkpointPositions, activeCheckpoint]);

  const containerHeight = `${scrollMultiplier * 100}vh`;

  return (
    <div 
      ref={containerRef}
      className="spin-section-container"
      style={{ height: containerHeight }}
      data-near-end={isNearEnd}
    >
      {/* Sticky Canvas */}
      <div className="spin-canvas-wrapper">
        <Canvas shadows={enableShadows}>
          <PerspectiveCamera
            makeDefault
            position={cameraPosition}
            fov={cameraFov}
          />

          <ambientLight intensity={0.4} />
          <directionalLight
            position={[5, 10, 5]}
            intensity={1}
            castShadow={enableShadows}
          />

          <RotatingModel
            componentName={componentName}
            modelUrl={modelUrl}
            modelType={modelType}
            scale={scale}
            position={position}
            rotation={rotation}
            scrollProgress={scrollProgress}
            rotationsPerScroll={rotationsPerScroll}
            enableShadows={enableShadows}
          />

          <Environment preset={environment} />
          <color attach="background" args={[backgroundColor]} />
        </Canvas>
      </div>

      {/* Checkpoints */}
      <div className="spin-checkpoints-container">
        {checkpoints.map((checkpoint, index) => {
          const checkpointProgress = checkpointPositions[index];
          const nextProgress = checkpointPositions[index + 1] || 1;
          
          const isVisible = scrollProgress >= (checkpointProgress - 0.15) && 
                           scrollProgress <= (nextProgress + 0.15);
          const isActive = activeCheckpoint === index;
          const side = index % 2 === 0 ? 'left' : 'right';

          return (
            <div
              key={index}
              className="checkpoint-wrapper"
              style={{
                top: `${checkpointProgress * 100}%`,
              }}
            >
              <Checkpoint
                checkpoint={checkpoint}
                index={index}
                isActive={isActive}
                isVisible={isVisible}
                side={side}
              />
            </div>
          );
        })}
      </div>

      {/* Progress Indicator */}
      <div className="spin-progress-indicator">
        <div className="spin-progress-line">
          <div 
            className="spin-progress-fill"
            style={{ height: `${scrollProgress * 100}%` }}
          />
        </div>
        {checkpointPositions.map((pos, idx) => (
          <div
            key={idx}
            className={`spin-progress-dot ${activeCheckpoint === idx ? 'active' : ''}`}
            style={{ top: `${pos * 100}%` }}
          />
        ))}
      </div>

      {/* Scroll Hint */}
      {scrollProgress < 0.05 && (
        <div className="spin-scroll-hint">
          <div className="spin-scroll-arrow" />
          <p>Scroll to explore</p>
        </div>
      )}
    </div>
  );
};

export default SpinSection;