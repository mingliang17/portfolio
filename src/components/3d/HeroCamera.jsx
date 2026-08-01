import React from 'react'
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { easing } from 'maath'
import { assetPath } from '../utils/assetPath.js'; 

const HeroCamera = ({children, isMobile}) => {
    const groupRef = useRef();
useFrame((state) => {
    easing.damp3(state.camera.position, [0, 0, isMobile ? 25 : 30], 0.25, state.delta);

    easing.dampE(
        groupRef.current.rotation, 
        [
            -state.pointer.y / (isMobile ? 5 : 2),  // smaller movement on mobile
            -state.pointer.x / (isMobile ? 10 : 0.5),
            0
        ],
        0.25,
        state.delta
    );
    
})
    return (
        <group ref={groupRef} scale={isMobile ? 1 : 1.3}>{children}</group>
    )
}

export default HeroCamera