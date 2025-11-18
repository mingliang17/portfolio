import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Text, OrbitControls, useTexture, Float } from '@react-three/drei';
import * as THREE from 'three';

// Helix configuration
const HELIX_CONFIG = {
  radius: 4,
  heightMultiplier: 2,
  rotations: 2,
  cameraSpeed: 4,
  strandOpacity: 0.9,
  lineWidth: 4
};

// Timeline data - everything in one file
const TIMELINE_DATA = [
  {
    id: 1,
    title: "DISCOVERY",
    description: "Research & Analysis",
    color: "#FF6B6B",
    strandColor: "#FF6B6B",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80"
  },
  {
    id: 2,
    title: "STRATEGY", 
    description: "Planning & Roadmap",
    color: "#4ECDC4",
    strandColor: "#4ECDC4",
    image: "https://images.unsplash.com/photo-1559028012-481c04fa702d?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80"
  },
  {
    id: 3,
    title: "DESIGN",
    description: "UI/UX & Prototyping", 
    color: "#45B7D1",
    strandColor: "#45B7D1",
    image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80"
  },
  {
    id: 4,
    title: "DEVELOPMENT",
    description: "Building & Coding",
    color: "#96CEB4",
    strandColor: "#96CEB4",
    image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80"
  },
  {
    id: 5,
    title: "TESTING",
    description: "QA & Optimization",
    color: "#FFEAA7",
    strandColor: "#FFEAA7",
    image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80"
  },
  {
    id: 6,
    title: "LAUNCH",
    description: "Deployment & Growth",
    color: "#DDA0DD", 
    strandColor: "#DDA0DD",
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80"
  }
];

const CONTENT_SECTIONS = [
  { phase: 1, title: "Discovery Phase", depth: "Surface Level" },
  { phase: 2, title: "Strategy Phase", depth: "Shallow Dive" },
  { phase: 3, title: "Design Phase", depth: "Mid Level" },
  { phase: 4, title: "Development Phase", depth: "Deep Dive" },
  { phase: 5, title: "Testing Phase", depth: "Core Level" },
  { phase: 6, title: "Launch Phase", depth: "Foundation" }
];

// Enhanced Helix with visible spiral strands
const EnhancedHelixTimeline = ({ scrollProgress, activePhase }) => {
  const helixRef = useRef();
  const { camera } = useThree();
  
  const phases = useMemo(() => {
    return TIMELINE_DATA.map((phase, i) => {
      const total = TIMELINE_DATA.length;
      const angle = (i / total) * Math.PI * HELIX_CONFIG.rotations * 2;
      const radius = HELIX_CONFIG.radius;
      const height = (i - total / 2) * HELIX_CONFIG.heightMultiplier;
      
      return {
        ...phase,
        position: [Math.cos(angle) * radius, height, Math.sin(angle) * radius],
        rotation: [0, -angle, 0]
      };
    });
  }, []);

  useFrame((state, delta) => {
    if (helixRef.current) {
      // Smooth helix rotation
      helixRef.current.rotation.y = scrollProgress * Math.PI * HELIX_CONFIG.rotations * 2;
      
      // Camera positioned in center, moving downward
      const cameraProgress = scrollProgress * TIMELINE_DATA.length;
      const cameraHeight = -cameraProgress * HELIX_CONFIG.cameraSpeed;
      
      // Camera stays in center, moves downward
      camera.position.set(0, cameraHeight, 0);
      
      // Look slightly forward in the direction of movement
      camera.lookAt(0, cameraHeight - 2, 1);
    }
  });

  return (
    <group ref={helixRef}>
      {/* Main spiral structure - much more visible */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[HELIX_CONFIG.radius, 0.05, 16, 200, Math.PI * HELIX_CONFIG.rotations * 2]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.3} />
      </mesh>

      {/* Individual colored strands for each phase - THICKER and MORE VISIBLE */}
      {TIMELINE_DATA.map((phase, i) => {
        const points = [];
        const totalPoints = 80;
        
        for (let j = 0; j <= totalPoints; j++) {
          const progress = j / totalPoints;
          const angle = progress * Math.PI * HELIX_CONFIG.rotations * 2;
          const radius = HELIX_CONFIG.radius;
          const height = (progress * TIMELINE_DATA.length - TIMELINE_DATA.length / 2) * HELIX_CONFIG.heightMultiplier;
          
          points.push(new THREE.Vector3(
            Math.cos(angle) * radius,
            height,
            Math.sin(angle) * radius
          ));
        }
        
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        
        return (
          <line key={`strand-${i}`} geometry={geometry}>
            <lineBasicMaterial 
              color={phase.strandColor} 
              linewidth={HELIX_CONFIG.lineWidth}
              transparent
              opacity={HELIX_CONFIG.strandOpacity}
            />
          </line>
        );
      })}

      {/* Additional guide rings at key heights */}
      {[-6, -3, 0, 3, 6].map((height, i) => (
        <mesh key={`ring-${i}`} position={[0, height, 0]}>
          <ringGeometry args={[HELIX_CONFIG.radius - 0.2, HELIX_CONFIG.radius + 0.2, 32]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.1} side={THREE.DoubleSide} />
        </mesh>
      ))}

      {/* Central axis line - more visible */}
      <mesh>
        <cylinderGeometry args={[0.03, 0.03, 25, 8]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.3} />
      </mesh>

      {/* Phase nodes */}
      {phases.map((phase, i) => (
        <Float key={phase.id} speed={1.5} rotationIntensity={0.3} floatIntensity={0.3}>
          <EnhancedPhaseNode
            phase={phase}
            isActive={activePhase === i}
            index={i}
          />
        </Float>
      ))}
    </group>
  );
};

const EnhancedPhaseNode = ({ phase, isActive, index }) => {
  const meshRef = useRef();
  const groupRef = useRef();
  const texture = useTexture(phase.image);
  
  useFrame((state) => {
    if (groupRef.current) {
      // Make content always face camera
      groupRef.current.rotation.y = Math.atan2(
        state.camera.position.x - groupRef.current.position.x,
        state.camera.position.z - groupRef.current.position.z
      );
    }
    
    if (meshRef.current && isActive) {
      // Active phase pulses
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.5;
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.1;
      meshRef.current.scale.set(pulse, pulse, pulse);
    }
  });

  return (
    <group ref={groupRef} position={phase.position}>
      {/* Main orb - larger and more visible */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial 
          color={phase.color}
          emissive={phase.color}
          emissiveIntensity={isActive ? 1 : 0.3}
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>

      {/* Enhanced glow for active phase */}
      {isActive && (
        <mesh>
          <sphereGeometry args={[0.8, 16, 16]} />
          <meshBasicMaterial 
            color={phase.color}
            transparent
            opacity={0.4}
          />
        </mesh>
      )}

      {/* Connection line to center - more visible */}
      <mesh>
        <cylinderGeometry args={[0.02, 0.02, HELIX_CONFIG.radius, 8]} />
        <meshBasicMaterial color={phase.color} transparent opacity={0.4} />
      </mesh>

      {/* Image plane */}
      <mesh position={[2, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[1.5, 1]} />
        <meshBasicMaterial map={texture} transparent opacity={0.9} />
        <mesh position={[0, 0, -0.01]}>
          <planeGeometry args={[1.6, 1.1]} />
          <meshBasicMaterial color={phase.color} transparent opacity={0.3} />
        </mesh>
      </mesh>

      {/* Text content */}
      <Text
        position={[0, 1.2, 0]}
        fontSize={0.3}
        color="white"
        anchorX="center"
        anchorY="middle"
        font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeAmM.woff"
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        {phase.title}
      </Text>
      
      <Text
        position={[0, -1, 0]}
        fontSize={0.2}
        color="#cccccc"
        anchorX="center"
        anchorY="middle"
        maxWidth={2}
        outlineWidth={0.01}
        outlineColor="#000000"
      >
        {phase.description}
      </Text>
    </group>
  );
};

const Timeline = () => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activePhase, setActivePhase] = useState(0);

  React.useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      const progress = scrollTop / (documentHeight - windowHeight);
      setScrollProgress(progress);
      setActivePhase(Math.min(TIMELINE_DATA.length - 1, Math.floor(progress * TIMELINE_DATA.length)));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-[400vh] bg-gradient-to-b from-gray-900 to-black">
      {/* Hero */}
      <div className="h-screen flex items-center justify-center text-white">
        <div className="text-center">
          <h1 className="text-6xl font-bold mb-6">3D Helix Timeline</h1>
          <p className="text-xl text-gray-400 mb-4">Scroll to descend through the spiral</p>
          <p className="text-lg text-gray-500">Watch the colored strands wrap around you</p>
        </div>
      </div>

      {/* 3D Canvas */}
      <div className="sticky top-0 h-screen">
        <Canvas
          camera={{ 
            position: [0, 0, 0],
            fov: 75,
            near: 0.1,
            far: 100
          }}
          gl={{ 
            antialias: true,
            alpha: false
          }}
        >
          <color attach="background" args={['#111111']} />
          
          {/* Enhanced lighting */}
          <ambientLight intensity={0.8} />
          <directionalLight position={[5, 10, 5]} intensity={1.2} />
          <pointLight position={[-5, -5, -5]} color="#4ECDC4" intensity={0.4} />
          <pointLight position={[0, -10, 0]} color="#ffffff" intensity={0.3} />
          
          <EnhancedHelixTimeline 
            scrollProgress={scrollProgress}
            activePhase={activePhase}
          />
          
          <OrbitControls 
            enableZoom={true}
            enablePan={false}
            maxPolarAngle={Math.PI}
            minPolarAngle={0}
          />
        </Canvas>

        {/* Progress UI */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="bg-black/90 backdrop-blur-xl rounded-3xl p-6 border border-white/30 shadow-2xl min-w-[250px]">
            <div className="text-white text-center mb-4">
              <div className="text-2xl font-bold mb-2">Phase {activePhase + 1}</div>
              <div className="text-gray-400 text-sm mb-1">Depth</div>
              <div className="text-xl font-mono font-semibold text-cyan-400">
                {Math.round(scrollProgress * 100)}%
              </div>
            </div>
            
            <div className="flex gap-2 justify-center">
              {TIMELINE_DATA.map((phase, i) => (
                <div
                  key={phase.id}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    i === activePhase 
                      ? 'scale-150 ring-2 ring-white' 
                      : i < activePhase 
                        ? 'scale-110' 
                        : 'scale-100 opacity-50'
                  }`}
                  style={{ backgroundColor: phase.color }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content sections */}
      <div className="relative z-10 text-white">
        {CONTENT_SECTIONS.map((section) => (
          <div key={section.phase} className="h-screen flex items-center justify-center">
            <div className="text-center max-w-4xl mx-auto px-4">
              <div className="text-cyan-400 text-lg font-mono mb-2">Depth: {section.depth}</div>
              <h2 className="text-4xl font-bold mb-6">{section.title}</h2>
              <p className="text-lg text-gray-300 leading-relaxed">
                This phase represents a crucial milestone in our journey. As you descend deeper 
                into the spiral, each colored strand tells the story of progress and innovation.
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Final section */}
      <div className="h-screen flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-4xl font-bold mb-4">Journey Complete</h2>
          <p className="text-gray-400">You've reached the end of the spiral</p>
        </div>
      </div>
    </div>
  );
};

export default Timeline;