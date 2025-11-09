import { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import Earth from '../components/Earth';
import { globeProjects } from '../constants/index.js';

const Home = () => {
  // Control states
  const [continentHeight, setContinentHeight] = useState(0.15);
  const [normalStrength, setNormalStrength] = useState(1.0);
  const [rotationSpeed, setRotationSpeed] = useState(0.001);
  const [showControls, setShowControls] = useState(false);

  return (
    <div className="w-full h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 6]} />
        
        {/* Lighting */}
        <ambientLight intensity={0.3} />
        <directionalLight position={[5, 3, 5]} intensity={0.5} />

        {/* Earth Globe */}
        <Suspense fallback={null}>
          <Earth 
            projects={globeProjects}
            continentPopHeight={continentHeight}
            animationSpeed={rotationSpeed}
            timeSpeed={1}
            normalMapStrength={normalStrength}
            ambientBrightness={0.3}
            pinColor="#ff0000"
            pinHoverColor="#ffcc00"
            pinSize={0.05}
            showPins={true}
          />
        </Suspense>

        {/* Controls */}
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI / 2}
          maxPolarAngle={Math.PI / 2}
          rotateSpeed={0.5}
        />
      </Canvas>

      {/* UI Overlay */}
      <div className="absolute top-8 left-8 text-white z-10">
        <h1 className="text-4xl font-bold mb-2">My Projects</h1>
        <p className="text-gray-300">Explore the interactive globe</p>
      </div>

      {/* Control Panel */}
      <button
        onClick={() => setShowControls(!showControls)}
        className="absolute top-8 right-8 bg-white/10 text-white px-4 py-2 rounded-lg hover:bg-white/20 transition z-10"
      >
        {showControls ? 'Hide' : 'Show'} Controls
      </button>

      {showControls && (
        <div className="absolute bottom-8 right-8 bg-black/80 text-white p-6 rounded-lg space-y-4 z-10 min-w-[300px]">
          <h3 className="text-xl font-bold mb-4">Globe Controls</h3>
          
          {/* Continent Pop Height */}
          <div>
            <label className="block text-sm mb-2">
              Continent Height: {continentHeight.toFixed(2)}
            </label>
            <input
              type="range"
              min="0"
              max="0.5"
              step="0.01"
              value={continentHeight}
              onChange={(e) => setContinentHeight(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Normal Map Strength */}
          <div>
            <label className="block text-sm mb-2">
              Normal Strength: {normalStrength.toFixed(2)}
            </label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={normalStrength}
              onChange={(e) => setNormalStrength(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Rotation Speed */}
          <div>
            <label className="block text-sm mb-2">
              Rotation Speed: {rotationSpeed.toFixed(4)}
            </label>
            <input
              type="range"
              min="0"
              max="0.005"
              step="0.0001"
              value={rotationSpeed}
              onChange={(e) => setRotationSpeed(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Reset Button */}
          <button
            onClick={() => {
              setContinentHeight(0.15);
              setNormalStrength(1.0);
              setRotationSpeed(0.001);
            }}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition"
          >
            Reset to Defaults
          </button>
        </div>
      )}
    </div>
  );
};

export default Home;