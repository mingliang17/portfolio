// src/components/3d/projects/ModelLoader.jsx
import React, { forwardRef, Suspense, useEffect } from 'react'
import { useFBX, useGLTF } from '@react-three/drei'
import { Mh1Model as Mh1ModelComponent } from './Mh1.jsx'

// ============================================
// COMPONENT MAP
// ============================================

const COMPONENT_MAP = {
  Mh1Model: Mh1ModelComponent,
  Model: Mh1ModelComponent,
}

// ============================================
// FALLBACKS
// ============================================

const LoadingSpinner = () => (
  <mesh>
    <boxGeometry args={[0.5, 0.5, 0.5]} />
    <meshStandardMaterial color="#888" wireframe />
  </mesh>
)

const ErrorFallback = () => (
  <mesh>
    <boxGeometry args={[1, 1, 1]} />
    <meshStandardMaterial color="red" wireframe />
  </mesh>
)

// ============================================
// GENERIC MODEL (HOOK-SAFE)
// ============================================

const GenericModel = forwardRef(
  (
    {
      url,
      type = 'glb',
      scale,
      position,
      rotation,
      enableShadows,
      materialOverrides,
      debug,
      onLoad,
      ...rest
    },
    ref
  ) => {
    // ✅ Hooks at top level
    const fbx = type === 'fbx' ? useFBX(url) : null
    const gltf = type !== 'fbx' ? useGLTF(url) : null
    const model = fbx || gltf?.scene

    useEffect(() => {
      if (!model) return

      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = enableShadows
          child.receiveShadow = enableShadows

          if (child.material && materialOverrides[child.material.name]) {
            Object.assign(child.material, materialOverrides[child.material.name])
            child.material.needsUpdate = true
          }
        }
      })

      if (debug) {
        console.log('✅ Model loaded:', url)
      }

      onLoad?.(model)
    }, [model])

    if (!model) return null

    return (
      <primitive
        ref={ref}
        object={model}
        scale={scale}
        position={position}
        rotation={rotation}
        {...rest}
      />
    )
  }
)

GenericModel.displayName = 'GenericModel'

// ============================================
// MAIN LOADER
// ============================================

const ModelLoader = forwardRef((props, ref) => {
  const {
    componentName,
    url,
    type,
    scale,
    position,
    rotation,
    debug,
    enableShadows = true,
    materialOverrides = {},
    onLoad,
    ...rest
  } = props

  // JSX MODEL
  if (componentName && COMPONENT_MAP[componentName]) {
    const Component = COMPONENT_MAP[componentName]
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <Component
          ref={ref}
          scale={scale}
          position={position}
          rotation={rotation}
          onLoad={onLoad}
          {...rest}
        />
      </Suspense>
    )
  }

  // GENERIC MODEL
  if (url) {
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <GenericModel
          ref={ref}
          url={url}
          type={type}
          scale={scale}
          position={position}
          rotation={rotation}
          enableShadows={enableShadows}
          materialOverrides={materialOverrides}
          debug={debug}
          onLoad={onLoad}
          {...rest}
        />
      </Suspense>
    )
  }

  return <ErrorFallback />
})

ModelLoader.displayName = 'ModelLoader'
export default ModelLoader
