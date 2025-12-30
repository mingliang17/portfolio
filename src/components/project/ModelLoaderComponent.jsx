// src/components/3d/projects/ModelLoader.jsx

import React, { forwardRef, Suspense, useEffect } from 'react'
import { useFBX, useGLTF } from '@react-three/drei'

import { Model as Mh1ModelComponent } from '../3d/Mh1.jsx'

// ===============================
// COMPONENT MAP
// ===============================
const COMPONENT_MAP = {
  Mh1Model: Mh1ModelComponent,
  Model: Mh1ModelComponent,
}

// ===============================
// GENERIC FILE MODEL
// ===============================
const GenericModel = forwardRef(
  ({ url, type, scale, position, rotation, enableShadows }, ref) => {
    const model =
      type === 'fbx' ? useFBX(url) : useGLTF(url)?.scene

    useEffect(() => {
      if (!model) return
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = enableShadows
          child.receiveShadow = enableShadows
        }
      })
    }, [model, enableShadows])

    if (!model) return null

    return (
      <primitive
        ref={ref}
        object={model}
        scale={scale}
        position={position}
        rotation={rotation}
      />
    )
  }
)

GenericModel.displayName = 'GenericModel'

// ===============================
// MAIN LOADER (SINGLE onLoad OWNER)
// ===============================
const ModelLoader = forwardRef((props, ref) => {
  const {
    componentName,
    url,
    type,
    scale,
    position,
    rotation,
    enableShadows = true,
    onLoad,
  } = props

  // 🔑 Call onLoad ONCE after first render
  useEffect(() => {
    if (onLoad) onLoad()
  }, [onLoad])

  // Custom JSX component
  if (componentName && COMPONENT_MAP[componentName]) {
    const Component = COMPONENT_MAP[componentName]
    return (
      <Suspense fallback={null}>
        <group ref={ref} scale={scale} position={position} rotation={rotation}>
          <Component enableShadows={enableShadows} />
        </group>
      </Suspense>
    )
  }

  // File-based model
  if (url) {
    return (
      <Suspense fallback={null}>
        <GenericModel
          ref={ref}
          url={url}
          type={type}
          scale={scale}
          position={position}
          rotation={rotation}
          enableShadows={enableShadows}
        />
      </Suspense>
    )
  }

  return null
})

ModelLoader.displayName = 'ModelLoader'
export default ModelLoader
