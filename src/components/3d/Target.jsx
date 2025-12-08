import React, { useRef, useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { gsap } from 'gsap';  // Import GSAP for animation
import { assetPath } from '../utils/assetPath.js'; 

const Target = (props) => {
  const targetRef = useRef();  // Creating a reference to the mesh object
  const { scene } = useGLTF(assetPath('models/target.gltf'));  // Load the GLTF model

  // Using useEffect to trigger GSAP animation
  useEffect(() => {
    // This will run once when the component mounts
    gsap.to(targetRef.current.position, {
      y: targetRef.current.position.y + 0.5,  // Move it up by 0.5
      duration: 1.5,  // Animation duration of 1.5 seconds
      repeat: -1,  // Repeat infinitely
      yoyo: true,  // Make the movement reverse back and forth
    });
  }, []);  // Empty dependency array to ensure the effect runs only once

  return (
    <mesh {...props} ref={targetRef} rotation = {[0, Math.PI/5,0]} scale ={1.5}>  {/* Bind mesh ref */}
      <primitive object={scene} />  {/* Render the loaded model */}
    </mesh>
  );
};

export default Target;