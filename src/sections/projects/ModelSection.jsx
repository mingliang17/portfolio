// src/sections/projects/ModelSection.jsx
import React, { useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import {
  OrbitControls,
  Environment,
  PerspectiveCamera,
} from '@react-three/drei'
import ModelLoader from '../../components/project/ModelLoaderComponent.jsx'

const BASE_URL = import.meta.env.BASE_URL || '/'
const assetPath = (path) =>
  `${BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`

const Controls = ({ enabled }) => {
  if (!enabled) return null
  return (
    <OrbitControls
      makeDefault
      enableDamping
      dampingFactor={0.06}
      minDistance={1}
      maxDistance={50}
      maxPolarAngle={Math.PI / 1.8}
    />
  )
}

const ModelSection = ({
  componentName,
  modelUrl,
  modelType = 'glb',

  cameraPosition = [0, 2, 6],
  cameraFov = 45,

  modelScale = 1,
  modelPosition = [0, 0, 0],
  modelRotation = [0, 0, 0],

  environment = 'city',
  backgroundColor = '#000',

  showControls = true,
  enableShadows = true,
}) => {
  const [loaded, setLoaded] = useState(false)
  const processedUrl = modelUrl ? assetPath(modelUrl) : null

  useEffect(() => {
    setLoaded(false)
  }, [processedUrl, componentName])

  return (
    <div className="model-section-wrapper relative">
      <Canvas
        shadows={enableShadows}
        className="w-full h-[600px]"
        frameloop="always"
      >
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

        <ModelLoader
          componentName={componentName}
          url={processedUrl}
          type={modelType}
          scale={modelScale}
          position={modelPosition}
          rotation={modelRotation}
          enableShadows={enableShadows}
          onLoad={() => setLoaded(true)}
        />

        <Environment preset={environment} />
        <color attach="background" args={[backgroundColor]} />

        <Controls enabled={showControls && loaded} />
      </Canvas>

      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
          <div className="text-white">Loading model…</div>
        </div>
      )}
    </div>
  )
}

export default ModelSection
