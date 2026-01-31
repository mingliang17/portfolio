import { Suspense, useState, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import Earth from '../components/home/Earth.jsx';
import { globeProjects } from '../constants/index.js';

import Projects from '../sections/Projects.jsx';
import Timeline from '../sections/Timeline.jsx';
import Experience from '../sections/Experience.jsx';
import Contact from '../sections/Contact.jsx';
import Footer from '../sections/Footer.jsx';

const Home = () => {
  const [showControls, setShowControls] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true); // Default to auto-rotate ON

  const handleResetDefaults = () => {
    setAutoRotate(true);
  };

  return (
    <main className="w-full relative">
      <section id="home" className="w-full h-screen bg-gradient-to-b from-slate-900 to-slate-800">
        <div className="absolute top-5 left-0 right-0 z-10 text-center text-white/50 pointer-events-none">
          If you are not embarrased by the launch of your product, you have launched too late -- LinkedIn Boss
        </div>

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
      </section>

      {/* Timeline / About Section */}
      <section id="about">
        <Timeline />
      </section>

      {/* Projects Section */}
      <Projects />

      {/* Work / Experience Section */}
      <Experience />

      {/* Contact Section */}
      <Contact />

      <Footer />
    </main>
  );
};

export default Home;