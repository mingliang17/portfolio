import { forwardRef, useEffect } from 'react'
import { useFBX } from '@react-three/drei'

const Mh1 = forwardRef(({ 
  url = '../../../assets/projects/mh1/Mh1.fbx',
  scale = 1,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
}, ref) => {
  const model = useFBX(url)

  useEffect(() => {
    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })
  }, [model])

  return (
    <primitive
      ref={ref}
      object={model}
      scale={scale}
      position={position}
      rotation={rotation}
    />
  )
})

export default Mh1;
