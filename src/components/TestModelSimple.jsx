// src/components/TestModelSimple.jsx
import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment } from '@react-three/drei';
import { Mh1Model } from './3d/projects/Mh1.jsx';

export default function TestModelSimple() {
  return (
    <div className="w-full min-h-screen bg-black">
      <div className="absolute top-4 left-4 z-10 bg-black/80 text-white p-4 rounded-lg">
        <h2 className="text-xl font-bold mb-2">🎨 Model Test Page</h2>
        <p className="text-sm">Testing: Mh1Model</p>
        <p className="text-xs text-gray-400">Path: /assets/projects/mh1/models/gltf/mh1_2.gltf</p>
      </div>

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

        {/* Environment */}
        <Environment preset="city" />

        {/* Model */}
        <Suspense fallback={null}>
          <Mh1Model
            scale={0.05}
            position={[0, -1, 0]}
            rotation={[0, Math.PI / 4, 0]}
            debug={true}
          />
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
  );
}