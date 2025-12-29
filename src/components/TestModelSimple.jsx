// src/components/TestModelSimple.jsx
import React, { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Environment } from '@react-three/drei'

// 👉 Import the gltfjsx-generated component
import { Mh1Model as MH1Model } from './3d/projects/Mh1.jsx'

export default function TestModelSimple() {
  return (
    <div className="w-full min-h-screen bg-black">
      <Canvas shadows>
        {/* Camera */}
        <PerspectiveCamera
          makeDefault
          position={[0, 2, 6]}
          fov={50}
        />

        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[10, 15, 10]}
          intensity={1}
          castShadow
        />

        {/* Environment lighting (VERY important for UE models) */}
        <Environment preset="city" />

        {/* Model */}
        <Suspense fallback={null}>
          <group
            scale={0.05}
            position={[0, -1, 0]}
            rotation={[0, Math.PI / 4, 0]}
          >
            <MH1Model />
          </group>
        </Suspense>

        {/* Controls */}
        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          minDistance={2}
          maxDistance={12}
        />
      </Canvas>
    </div>
  )
}
