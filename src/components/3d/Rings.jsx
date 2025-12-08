import gsap from 'gsap';
import { Center } from '@react-three/drei';
import { useCallback, useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { assetPath } from '../utils/assetPath.js'; 

// Custom hook to load texture without causing render-phase updates
const useTextureLoader = (path) => {
  const [texture, setTexture] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const loader = new THREE.TextureLoader();

    loader.load(
      path,
      (loadedTexture) => {
        if (mounted) {
          setTexture(loadedTexture);
          setLoading(false);
        }
      },
      undefined,
      (error) => {
        console.error('Error loading texture:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
    };
  }, [path]);

  return { texture, loading };
};

const Rings = ({ position }) => {
  const refList = useRef([]);
  const getRef = useCallback((mesh) => {
    if (mesh && !refList.current.includes(mesh)) {
      refList.current.push(mesh);
    }
  }, []);

  // Use custom texture loader instead of useTexture
  const { texture } = useTextureLoader(assetPath('textures/rings.png'));

  useEffect(() => {
    if (refList.current.length === 0) return;

    // Only update position if it actually changed
    refList.current.forEach((r) => {
      r.position.set(position[0], position[1], position[2]);
    });
  }, [position]);

  // Separate useEffect for the GSAP animation (runs only once)
  useEffect(() => {
    if (refList.current.length === 0) return;

    gsap
      .timeline({
        repeat: -1,
        repeatDelay: 0.5,
      })
      .to(
        refList.current.map((r) => r.rotation),
        {
          y: `+=${Math.PI * 2}`,
          x: `-=${Math.PI * 2}`,
          duration: 2.5,
          stagger: {
            each: 0.15,
          },
        },
      );
  }, []); // Empty array = runs only once on mount

  return (
    <Center>
      <group scale={0.5}>
        {Array.from({ length: 4 }, (_, index) => (
          <mesh key={index} ref={getRef}>
            <torusGeometry args={[(index + 1) * 0.5, 0.1]}></torusGeometry>
            {texture && (
              <meshMatcapMaterial matcap={texture} toneMapped={false} />
            )}
          </mesh>
        ))}
      </group>
    </Center>
  );
};

export default Rings;