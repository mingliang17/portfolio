import { useRef, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { useMediaQuery } from 'react-responsive';
import { PerspectiveCamera } from '@react-three/drei';
import { CanvasLoader } from '../components/common/LayoutComponents.jsx';
import HackerRoom from '../components/HackerRoom.jsx';
import { calculateSizes } from '../constants/index.js';
import Target from '../components/Target.jsx';
import ReactLogo from '../components/ReactLogo.jsx';
import Cube from '../components/Cube.jsx';
import Rings from '../components/Rings.jsx';
import HeroCamera from '../components/HeroCamera.jsx';
import Button from '../components/Button.jsx';

import { assetPath } from '../utils/assetPath.js'; 

const Hero = () => {
  // Media queries
  const isSmall = useMediaQuery({ query: '(max-width: 440px)' });
  const isMobile = useMediaQuery({ query: '(max-width: 768px)' });
  const isTablet = useMediaQuery({ query: '(min-width: 768px) and (max-width: 1024px)' });

  // Calculate sizes for responsive scaling
  const sizes = calculateSizes(isSmall, isMobile, isTablet);

  const hackerRef = useRef();

  return (
    <section className="w-full flex flex-col relative box-border" id="home">
      {/* Hero Text */}
      <div className="w-full flex flex-col gap-3 mt-20 box-border">
        <p className="sm:text-3xl text-2xl font-medium text-white text-center font-generalsans">
          Hi, I am Kaden<span className="waving-hand"> 🏔️</span>
        </p>
        <p className="hero_tag text-gray_gradient text-center">
          Experiential Design & Development
        </p>
      </div>

      {/* 3D Canvas */}
      <div className="w-full h-[400px] box-border">
        <Canvas className="w-full h-full">
          <Suspense fallback={<CanvasLoader />}>
            <PerspectiveCamera makeDefault position={[0, 0, 20]} />
            <ambientLight intensity={3} />
            <directionalLight position={[10, 10, 10]} intensity={0.5} />

            <HeroCamera isMobile={isMobile}>
              <HackerRoom
                ref={hackerRef}
                position={sizes.deskPosition}
                rotation={[0, -Math.PI, 0]}
                scale={sizes.deskScale}
              />
            </HeroCamera>

            <group>
              <Target position={sizes.targetPosition} />
              <ReactLogo position={sizes.reactLogoPosition} />
              <Cube position={sizes.cubePosition} />
              <Rings position={sizes.ringPosition} />
            </group>
          </Suspense>
        </Canvas>
      </div>

      {/* Call to Action */}
      <div className="relative w-full z-10 c-space">
        <a href="#projects" className="w-fit">
          <Button 
            name="Let's work together" 
            isBeam 
            containerClass="sm:w-fit w-full sm:min-w-[24rem]" 
          />
        </a>
      </div>
    </section>
  );
};

export default Hero;
