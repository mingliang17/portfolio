import { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import Earth from '../components/Earth';
import { globeProjects } from '../constants/index.js';

const Home = () => {
  const [continentHeight, setContinentHeight] = useState(0.05);
  const [hoverHeight, setHoverHeight] = useState(0.3);
  const [hoverRadius, setHoverRadius] = useState(0.3);
  const [normalStrength, setNormalStrength] = useState(1.0);
  const [rotationSpeed, setRotationSpeed] = useState(0.001);
  const [pinLength, setPinLength] = useState(0.3);
  const [showControls, setShowControls] = useState(false);

  return (
    <div className="w-full h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 6]} />
        
        <ambientLight intensity={0.3} />
        <directionalLight position={[5, 3, 5]} intensity={0.5} />

        <Suspense fallback={null}>
          <Earth 
            projects={globeProjects}
            continentPopHeight={continentHeight}
            hoverPopHeight={hoverHeight}
            hoverRadius={hoverRadius}
            animationSpeed={rotationSpeed}
            timeSpeed={1}
            normalMapStrength={normalStrength}
            ambientBrightness={0.3}
            pinColor="#ff0000"
            pinHoverColor="#ffcc00"
            pinBaseRadius={1.8}
            pinLength={pinLength}
            pinThickness={0.02}
            pinTipSize={0.05}
            showPins={true}
          />
        </Suspense>

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          minPolarAngle={0}
          maxPolarAngle={Math.PI }
          rotateSpeed={0.5}
        />
      </Canvas>

      <div className="absolute top-8 left-8 text-white z-10">
        <h1 className="text-4xl font-bold mb-2">My Projects</h1>
        <p className="text-gray-300">Hover over continents to explore</p>
      </div>

      <button
        onClick={() => setShowControls(!showControls)}
        className="absolute top-8 right-8 bg-white/10 text-white px-4 py-2 rounded-lg hover:bg-white/20 transition z-10"
      >
        {showControls ? 'Hide' : 'Show'} Controls
      </button>

      {showControls && (
        <div className="absolute bottom-8 right-8 bg-black/80 text-white p-6 rounded-lg space-y-4 z-10 min-w-[300px] max-h-[80vh] overflow-y-auto">
          <h3 className="text-xl font-bold mb-4">Globe Controls</h3>
          
          <div>
            <label className="block text-sm mb-2">
              Base Height: {continentHeight.toFixed(2)}
            </label>
            <input type="range" min="0" max="0.2" step="0.01" value={continentHeight}
              onChange={(e) => setContinentHeight(parseFloat(e.target.value))} className="w-full" />
          </div>

          <div>
            <label className="block text-sm mb-2">
              Hover Pop: {hoverHeight.toFixed(2)}
            </label>
            <input type="range" min="0" max="1" step="0.05" value={hoverHeight}
              onChange={(e) => setHoverHeight(parseFloat(e.target.value))} className="w-full" />
          </div>

          <div>
            <label className="block text-sm mb-2">
              Hover Radius: {hoverRadius.toFixed(2)}
            </label>
            <input type="range" min="0.1" max="1" step="0.05" value={hoverRadius}
              onChange={(e) => setHoverRadius(parseFloat(e.target.value))} className="w-full" />
          </div>

          <div>
            <label className="block text-sm mb-2">
              Pin Length: {pinLength.toFixed(2)}
            </label>
            <input type="range" min="0.1" max="0.8" step="0.05" value={pinLength}
              onChange={(e) => setPinLength(parseFloat(e.target.value))} className="w-full" />
          </div>

          <div>
            <label className="block text-sm mb-2">
              Normal Strength: {normalStrength.toFixed(2)}
            </label>
            <input type="range" min="0" max="2" step="0.1" value={normalStrength}
              onChange={(e) => setNormalStrength(parseFloat(e.target.value))} className="w-full" />
          </div>

          <div>
            <label className="block text-sm mb-2">
              Rotation Speed: {rotationSpeed.toFixed(4)}
            </label>
            <input type="range" min="0" max="0.005" step="0.0001" value={rotationSpeed}
              onChange={(e) => setRotationSpeed(parseFloat(e.target.value))} className="w-full" />
          </div>

          <button
            onClick={() => {
              setContinentHeight(0.05);
              setHoverHeight(0.3);
              setHoverRadius(0.3);
              setNormalStrength(1.0);
              setRotationSpeed(0.001);
              setPinLength(0.3);
            }}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition"
          >
            Reset Defaults
          </button>
        </div>
      )}
    </div>
  );
};

export default Home;