import { Suspense, useState, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import Earth from '../components/3d/Earth.jsx';
import { globeProjects } from '../constants/index.js';

const Home = () => {
  const [showControls, setShowControls] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true); // Default to auto-rotate ON

  const handleResetDefaults = () => {
    setAutoRotate(true);
  };

  return (
    <div>
      <div className="text-center">If you are not embarrased by the launch of your product, you have launched too late -- LinkedIn Boss
      </div>  

      <div className="w-full h-screen bg-gradient-to-b from-slate-900 to-slate-800">
        <Canvas>
          <PerspectiveCamera makeDefault position={[0, 0, 6]} />
          
          <ambientLight intensity={0.3} />
          <directionalLight position={[5, 3, 5]} intensity={0.5} />

          <Suspense fallback={null}>
            <Earth 
              projects={globeProjects}
              showControls={showControls}
              onToggleControls={() => setShowControls(!showControls)}
              onResetDefaults={handleResetDefaults}
              autoRotate={autoRotate}
              onAutoRotateChange={setAutoRotate}
            />
          </Suspense>

          {/* OrbitControls are always enabled - they'll work with or without auto-rotate */}
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            minPolarAngle={0}
            maxPolarAngle={Math.PI}
            rotateSpeed={0.5}
            enableDamping={true}
            dampingFactor={0.1}
          />
        </Canvas>
      </div>
    </div>
  );
};

export default Home;  