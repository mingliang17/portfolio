import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera, Environment, Grid } from '@react-three/drei';
import anime from 'animejs';
import { ReconstructingModel } from '/3d/Mh1Reconstructed.jsx';

const SpinSection = ({ checkpoints = [] }) => {
  const containerRef = useRef();
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeIdx, setActiveIdx] = useState(0);

  const checkpointPositions = useMemo(() => 
    checkpoints.map((_, i) => i / (checkpoints.length - 1 || 1)), 
  [checkpoints]);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const totalHeight = rect.height - window.innerHeight;
      const scrolled = Math.min(Math.max(-rect.top, 0), totalHeight);
      const progress = totalHeight > 0 ? scrolled / totalHeight : 0;
      
      setScrollProgress(progress);

      const nearest = checkpointPositions.reduce((closest, cp, i) => 
        Math.abs(cp - progress) < Math.abs(checkpointPositions[closest] - progress) ? i : closest, 0);
      
      if (nearest !== activeIdx) {
        setActiveIdx(nearest);
        // Anime.js text transition
        anime({
          targets: `.checkpoint-card-${nearest} > *`,
          opacity: [0, 1],
          translateY: [20, 0],
          delay: anime.stagger(100),
          easing: 'easeOutExpo'
        });
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeIdx, checkpointPositions]);

  return (
    <section ref={containerRef} className="anime-section" style={{ height: `${checkpoints.length * 150}vh` }}>
      <div className="sticky-wrapper">
        <Canvas shadows camera={{ position: [0, 5, 20], fov: 45 }}>
          <color attach="background" args={['#0f1011']} />
          <Grid infiniteGrid sectionSize={1.5} sectionThickness={1} fadeDistance={40} cellColor="#222" sectionColor="#444" />
          
          <ReconstructingModel 
            scrollProgress={scrollProgress} 
            activeIdx={activeIdx}
            checkpointPositions={checkpointPositions}
            scale={0.05} // Adjust based on your model size
            rotation={[0, Math.PI / 4, 0]}
          />
          
          <Environment preset="city" />
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 20, 10]} intensity={1.5} castShadow />
        </Canvas>

        <div className="overlay-ui">
          {checkpoints.map((cp, i) => (
            <div key={i} className={`checkpoint-card-container ${activeIdx === i ? 'active' : ''}`}>
              <div className={`checkpoint-card checkpoint-card-${i} ${i % 2 === 0 ? 'left' : 'right'}`}>
                <span className="line-decor"></span>
                <small>PHASE_0{i + 1}</small>
                <h2>{cp.title}</h2>
                <p>{cp.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SpinSection;