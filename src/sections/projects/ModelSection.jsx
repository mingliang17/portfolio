// src/sections/projects/ModelSection.jsx
import React, { useState, useEffect } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import {
  OrbitControls,
  Environment,
  PerspectiveCamera,
} from '@react-three/drei'
import ModelLoader from '../../components/3d/projects/ModelLoader.jsx'

const BASE_URL = import.meta.env.BASE_URL || '/'
const assetPath = (path) =>
  `${BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`

// ===============================
// Controls Wrapper (IMPORTANT)
// ===============================
const Controls = ({ enabled }) => {
  const { invalidate } = useThree()

  if (!enabled) return null

  return (
    <OrbitControls
      makeDefault
      enableDamping
      dampingFactor={0.06}
      minDistance={1}
      maxDistance={20}
      minPolarAngle={0}
      maxPolarAngle={Math.PI / 1.8}
      onChange={invalidate}
    />
  )
}

const ModelSection = ({
  componentName,
  modelUrl,
  modelType = 'glb',
  
  // Camera settings
  cameraPosition = [0, 2, 6],
  cameraFov = 45,
  
  // Model transform settings
  modelScale = 1,
  modelPosition = [0, 0, 0],
  modelRotation = [0, 0, 0],
  
  // Environment settings
  environment = 'city',
  backgroundColor = '#000',
  
  // Control & Debug settings
  showControls = true,
  debug = false,
  
  // ✅ ADDED: Shadow settings
  enableShadows = true,
}) => {
  const [loaded, setLoaded] = useState(false)
  const processedUrl = modelUrl ? assetPath(modelUrl) : null

  useEffect(() => {
    setLoaded(false)
  }, [processedUrl, componentName])

  // Debug logging
  useEffect(() => {
    if (debug) {
      console.log('🎯 ModelSection Config:', {
        componentName,
        modelUrl,
        modelScale,
        modelPosition,
        modelRotation,
        cameraPosition,
        cameraFov,
        environment,
        backgroundColor,
        enableShadows,
      })
    }
  }, [debug, componentName, modelUrl, modelScale, modelPosition, modelRotation, cameraPosition, cameraFov, environment, backgroundColor, enableShadows])

  return (
    <div className="model-section-wrapper">
      <Canvas
        shadows={enableShadows}  // ✅ Use enableShadows prop
        className="w-full h-[600px]"
        frameloop={loaded ? 'demand' : 'demand'}
      >
        {/* ✅ Use camera settings from project data */}
        <PerspectiveCamera 
          makeDefault 
          position={cameraPosition} 
          fov={cameraFov} 
        />

        <ambientLight intensity={0.3} />
        <directionalLight 
          position={[10, 10, 5]} 
          intensity={1.2} 
          castShadow={enableShadows}
        />

        {/* ✅ ModelLoader receives ALL transform values */}
        <ModelLoader
          componentName={componentName}
          url={processedUrl}
          type={modelType}
          scale={modelScale}
          position={modelPosition}
          rotation={modelRotation}
          debug={debug}
          enableShadows={enableShadows}  // ✅ Pass to ModelLoader
          onLoad={() => setLoaded(true)}
        />

        {/* ✅ Use environment from project data */}
        <Environment preset={environment} />
        
        {/* ✅ Use background color from project data */}
        <color attach="background" args={[backgroundColor]} />

        <Controls enabled={showControls && loaded} />
      </Canvas>
    </div>
  )
}

export default ModelSection