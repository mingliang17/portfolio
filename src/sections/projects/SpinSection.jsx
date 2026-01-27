import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera, Environment } from '@react-three/drei';
import * as THREE from 'three';
import ModelLoader from '../../components/project/ModelLoaderComponent.jsx';

const BASE_URL = import.meta.env.BASE_URL || '/';
const assetPath = (path) =>
  `${BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;

const RotatingModel = ({
  componentName,
  modelUrl,
  modelType,
  scale,
  position,
  rotation: initialRotation,
  scrollProgress,
  rotationsPerScroll = 1,
  enableShadows,
  checkpointPositions
}) => {
  const ref = useRef();
  const processedUrl = modelUrl ? assetPath(modelUrl) : null;

  useFrame(() => {
    if (!ref.current) return;

    const targetY = (initialRotation?.[1] || 0) + scrollProgress * Math.PI * 2 * rotationsPerScroll;
    ref.current.rotation.y = THREE.MathUtils.lerp(ref.current.rotation.y, targetY, 0.1);

    if (checkpointPositions.length > 0) {
      const nearestIndex = checkpointPositions.reduce((closest, cp, i) => {
        return Math.abs(cp - scrollProgress) < Math.abs(checkpointPositions[closest] - scrollProgress) ? i : closest;
      }, 0);

      const isEven = nearestIndex % 2 === 0;
      const targetShiftX = isEven ? -0.7 : 0.7;
      const targetShiftY = isEven ? 0.5 : -0.5;

      ref.current.position.x = THREE.MathUtils.lerp(ref.current.position.x, position[0] + targetShiftX, 0.05);
      ref.current.position.y = THREE.MathUtils.lerp(ref.current.position.y, position[1] + targetShiftY, 0.05);
    }
  });

  return (
    <group ref={ref}>
      <ModelLoader
        componentName={componentName}
        url={processedUrl}
        type={modelType}
        scale={scale}
        position={[0, 0, 0]} 
        rotation={initialRotation}
        enableShadows={enableShadows}
      />
    </group>
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
  backgroundColor = '#000',
  enableShadows = true,
  checkpoints = [],
  rotationsPerScroll = 2
}) => {
  const containerRef = useRef();
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isAtEnd, setIsAtEnd] = useState(false);

  const sectionHeightVh = (checkpoints.length * 100) - 100;

  const checkpointPositions = useMemo(() => {
    if (!checkpoints.length) return [];
    return checkpoints.map((_, i) => i / (checkpoints.length - 1 || 1));
  }, [checkpoints]);

  useEffect(() => {
    const onScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      const totalHeight = rect.height - viewportHeight;
      const scrolled = Math.min(Math.max(-rect.top, 0), totalHeight);
      const progress = totalHeight > 0 ? scrolled / totalHeight : 0;
      setScrollProgress(progress);

      // 1) REQ 1: Visible as soon as the top of section hits top of viewport
      const isVisible = rect.top <= 10 && rect.bottom >= viewportHeight;
      setIsActive(isVisible);

      // 2) REQ 2: Detect if we've reached the absolute bottom
      // Using a small threshold (0.99) for better UX
      setIsAtEnd(progress >= 0.99);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleNextSection = () => {
    if (!containerRef.current) return;
    const nextY = window.pageYOffset + containerRef.current.getBoundingClientRect().bottom;
    window.scrollTo({ top: nextY, behavior: 'smooth' });
  };

  return (
    <section ref={containerRef} className="spin-section-container" style={{ height: `${sectionHeightVh}vh` }}>
      
      <div className={`spin-canvas-fixed-wrapper ${isActive ? 'active' : ''}`}>
        <Canvas shadows={enableShadows}>
          <PerspectiveCamera makeDefault position={cameraPosition} fov={cameraFov} />
          <ambientLight intensity={0.4} />
          <directionalLight position={[5, 10, 5]} intensity={1} castShadow={enableShadows} />

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
            checkpointPositions={checkpointPositions}
          />

          <Environment preset={environment} />
          <color attach="background" args={[backgroundColor]} />
        </Canvas>

        {/* REQ 2: LOCK BUTTON */}
        <div className={`lock-overlay ${isAtEnd ? 'visible' : ''}`}>
             <button className="continue-btn" onClick={handleNextSection}>
                Continue to Next Section
                <span className="btn-arrow">↓</span>
             </button>
        </div>
      </div>

      <div className="spin-checkpoints-container">
        {checkpoints.map((checkpoint, index) => (
          <div 
            key={index} 
            className="checkpoint-wrapper" 
            style={{ top: `${checkpointPositions[index] * 100}%` }}
          >
            <div className={`checkpoint-card checkpoint-${index % 2 === 0 ? 'left' : 'right'}`}>
              <div className="checkpoint-number">{index + 1}</div>
              <h3 className="checkpoint-title">{checkpoint.title}</h3>
              <p className="checkpoint-description">{checkpoint.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default SpinSection;