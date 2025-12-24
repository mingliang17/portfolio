import { Canvas } from '@react-three/fiber'
import { Suspense, useRef } from 'react'
import { OrbitControls, Environment } from '@react-three/drei'
import Mh1 from '../../components/3d/projects/Mh1.jsx'

export default function Scene() {
  const fbxRef = useRef()

  return (
    <Canvas shadows camera={{ position: [0, 2, 6], fov: 45 }}>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={1} castShadow />

      <Suspense fallback={null}>
        <Mh1
          ref={fbxRef}
          scale={0.01}       // FBX models are often HUGE
          position={[0, -1, 0]}
        />
      </Suspense>

      <OrbitControls />
      <Environment preset="city" />
    </Canvas>
  )
}
