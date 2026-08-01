import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Sphere, Text } from '@react-three/drei';
import * as THREE from 'three';

const DNATimeline = ({
  scrollScreens = 4,
  helixCycles = 1,
  numStages = 5,
  helixRadius = 2.5,
  strandThickness = 0.1,
  
  primaryColor = '#ff6b9d',
  secondaryColor = '#4dabf7',
  backgroundColor = '#0a0520',
  
  cameraDistance = 8,
  cameraFOV = 60,
}) => {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const container = document.getElementById('dna-container');
      if (!container) return;
      
      const rect = container.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      // Calculate progress based on container position in viewport
      const containerTop = rect.top;
      const containerBottom = rect.bottom;
      const containerHeight = rect.height;
      
      // 0% when container top reaches bottom of viewport
      // 100% when container bottom reaches top of viewport
      const start = windowHeight; // Container top at bottom of screen
      const end = -containerHeight; // Container bottom at top of screen
      
      // Calculate progress (0 to 1)
      const progress = 1 - Math.max(0, Math.min(1, (containerTop - end) / (start - end)));
      
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const stages = useMemo(() => [
    {
      name: 'Start',
      description: 'Beginning of the journey',
      emoji: '🚀',
      color: '#00ff88'
    },
    {
      name: 'Plan',
      description: 'Strategy and preparation phase',
      emoji: '📋',
      color: '#4dabf7'
    },
    {
      name: 'Build',
      description: 'Development and creation',
      emoji: '🔧',
      color: '#ffaa00'
    },
    {
      name: 'Test',
      description: 'Quality assurance and refinement',
      emoji: '🧪',
      color: '#ff6b9d'
    },
    {
      name: 'Launch',
      description: 'Release and deployment',
      emoji: '🏆',
      color: '#ff0088'
    }
  ], []);

  const CameraController = () => {
    useFrame(({ camera }) => {
      const totalHeight = helixCycles * 20;
      const targetY = totalHeight / 2 - (scrollProgress * totalHeight);
      
      camera.position.y = targetY;
      camera.lookAt(0, targetY, 0);
    });

    return null;
  };

  const DNAHelix = () => {
    const totalHeight = helixCycles * 20;
    const rotatingGroupRef = useRef();

    const { strand1Points, strand2Points, stagePositions } = useMemo(() => {
      const points1 = [];
      const points2 = [];
      const stagePos = [];
      
      const segments = 100;
      
      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const angle = t * Math.PI * 2 * helixCycles;
        const height = -totalHeight / 2 + (t * totalHeight);
        
        points1.push(
          new THREE.Vector3(
            Math.cos(angle) * helixRadius,
            height,
            Math.sin(angle) * helixRadius
          )
        );
        
        points2.push(
          new THREE.Vector3(
            Math.cos(angle + Math.PI) * helixRadius,
            height,
            Math.sin(angle + Math.PI) * helixRadius
          )
        );
      }
      
      for (let i = 0; i < numStages; i++) {
        const t = i / (numStages - 1);
        const angle = t * Math.PI * 2 * helixCycles;
        const height = -totalHeight / 2 + (t * totalHeight);
        
        const point1 = new THREE.Vector3(
          Math.cos(angle) * helixRadius,
          height,
          Math.sin(angle) * helixRadius
        );
        
        const point2 = new THREE.Vector3(
          Math.cos(angle + Math.PI) * helixRadius,
          height,
          Math.sin(angle + Math.PI) * helixRadius
        );
        
        stagePos.push({
          height,
          angle,
          point1,
          point2,
          center: new THREE.Vector3().lerpVectors(point1, point2, 0.5),
          t
        });
      }
      
      return { strand1Points: points1, strand2Points: points2, stagePositions: stagePos };
    }, [helixCycles, helixRadius, totalHeight, numStages]);

    const strand1Geometry = useMemo(() => {
      const curve = new THREE.CatmullRomCurve3(strand1Points);
      return new THREE.TubeGeometry(curve, strand1Points.length, strandThickness, 8, false);
    }, [strand1Points, strandThickness]);

    const strand2Geometry = useMemo(() => {
      const curve = new THREE.CatmullRomCurve3(strand2Points);
      return new THREE.TubeGeometry(curve, strand2Points.length, strandThickness, 8, false);
    }, [strand2Points, strandThickness]);

    useFrame(() => {
      if (rotatingGroupRef.current) {
        rotatingGroupRef.current.rotation.y = scrollProgress * Math.PI * 2 * helixCycles;
      }
    });

    return (
      <group ref={rotatingGroupRef} position={[0, 0, 0]}>
        {/* DNA Strand 1 */}
        <mesh geometry={strand1Geometry}>
          <meshBasicMaterial color={primaryColor} transparent opacity={0.9} />
        </mesh>

        {/* DNA Strand 2 */}
        <mesh geometry={strand2Geometry}>
          <meshBasicMaterial color={secondaryColor} transparent opacity={0.9} />
        </mesh>

        {/* Base pairs */}
        {Array.from({ length: 20 }).map((_, i) => {
          const t = i / 20;
          const angle = t * Math.PI * 2 * helixCycles;
          const height = -totalHeight / 2 + (t * totalHeight);
          
          const point1 = new THREE.Vector3(
            Math.cos(angle) * helixRadius,
            height,
            Math.sin(angle) * helixRadius
          );
          
          const point2 = new THREE.Vector3(
            Math.cos(angle + Math.PI) * helixRadius,
            height,
            Math.sin(angle + Math.PI) * helixRadius
          );
          
          const center = new THREE.Vector3().lerpVectors(point1, point2, 0.5);
          const length = point1.distanceTo(point2);
          
          return (
            <mesh key={i} position={center}>
              <cylinderGeometry args={[strandThickness * 0.3, strandThickness * 0.3, length, 6]} />
              <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
            </mesh>
          );
        })}

        {/* Center markers only - these rotate with DNA */}
        {stagePositions.map((stage, index) => {
          const stageData = stages[index];
          return (
            <Sphere key={index} args={[0.4, 16, 16]} position={stage.center}>
              <meshBasicMaterial color={stageData.color} transparent opacity={0.8} />
            </Sphere>
          );
        })}

        {/* Connection lines - these rotate with DNA */}
        {stagePositions.map((stage, index) => (
          <group key={index}>
            <mesh position={[
              Math.cos(stage.angle) * (helixRadius + 1.0),
              stage.height,
              Math.sin(stage.angle) * (helixRadius + 1.0)
            ]}>
              <cylinderGeometry args={[0.03, 0.03, 1.5, 6]} />
              <meshBasicMaterial color={primaryColor} transparent opacity={0.6} />
            </mesh>
            
            <mesh position={[
              Math.cos(stage.angle + Math.PI) * (helixRadius + 1.0),
              stage.height,
              Math.sin(stage.angle + Math.PI) * (helixRadius + 1.0)
            ]}>
              <cylinderGeometry args={[0.03, 0.03, 1.5, 6]} />
              <meshBasicMaterial color={secondaryColor} transparent opacity={0.6} />
            </mesh>
          </group>
        ))}
      </group>
    );
  };

  // Separate component for panels that DON'T rotate with DNA
  const StagePanels = () => {
    const { camera, size } = useThree();
    const totalHeight = helixCycles * 20;
    
    const stagePositions = useMemo(() => {
      const positions = [];
      for (let i = 0; i < numStages; i++) {
        const t = i / (numStages - 1);
        const angle = t * Math.PI * 2 * helixCycles;
        const height = -totalHeight / 2 + (t * totalHeight);
        
        const point1 = new THREE.Vector3(
          Math.cos(angle) * helixRadius,
          height,
          Math.sin(angle) * helixRadius
        );
        
        const point2 = new THREE.Vector3(
          Math.cos(angle + Math.PI) * helixRadius,
          height,
          Math.sin(angle + Math.PI) * helixRadius
        );
        
        positions.push({
          height,
          angle,
          point1,
          point2,
          center: new THREE.Vector3().lerpVectors(point1, point2, 0.5),
          t
        });
      }
      return positions;
    }, [helixCycles, helixRadius, totalHeight, numStages]);

    return (
      <group>
        {stagePositions.map((stage, index) => (
          <StagePanel
            key={index}
            stage={stage}
            stageData={stages[index]}
            scrollProgress={scrollProgress}
            camera={camera}
            size={size}
          />
        ))}
      </group>
    );
  };

  const StagePanel = ({ stage, stageData, scrollProgress, camera, size }) => {
    const panel1Ref = useRef();
    const panel2Ref = useRef();
    const glowRef = useRef();
    
    const [isOptimalView, setIsOptimalView] = useState(false);
    const [glowIntensity, setGlowIntensity] = useState(0);

    // Calculate world positions that account for DNA rotation
    const getRotatedPosition = (basePosition, rotationY) => {
      const position = new THREE.Vector3(...basePosition);
      const rotationMatrix = new THREE.Matrix4().makeRotationY(rotationY);
      return position.applyMatrix4(rotationMatrix);
    };

    useFrame(() => {
      if (!panel1Ref.current || !panel2Ref.current) return;

      // Calculate current DNA rotation
      const dnaRotation = scrollProgress * Math.PI * 2 * helixCycles;
      
      // Get rotated positions in world space
      const panelDistance = helixRadius + 2.5;
      const panel1BasePos = [
        Math.cos(stage.angle) * panelDistance,
        stage.height,
        Math.sin(stage.angle) * panelDistance
      ];
      const panel2BasePos = [
        Math.cos(stage.angle + Math.PI) * panelDistance,
        stage.height,
        Math.sin(stage.angle + Math.PI) * panelDistance
      ];

      const panel1WorldPos = getRotatedPosition(panel1BasePos, dnaRotation);
      const panel2WorldPos = getRotatedPosition(panel2BasePos, dnaRotation);

      // Update panel positions
      panel1Ref.current.position.copy(panel1WorldPos);
      panel2Ref.current.position.copy(panel2WorldPos);

      // Convert to 2D screen coordinates
      const panel1Screen = panel1WorldPos.clone().project(camera);
      const panel2Screen = panel2WorldPos.clone().project(camera);

      const panel1PixelX = (panel1Screen.x * 0.5 + 0.5) * size.width;
      const panel2PixelX = (panel2Screen.x * 0.5 + 0.5) * size.width;

      // Calculate how centered each panel is
      const centerX = size.width / 2;
      const panel1Centered = 1 - Math.min(1, Math.abs(panel1PixelX - centerX) / (centerX * 0.8));
      const panel2Centered = 1 - Math.min(1, Math.abs(panel2PixelX - centerX) / (centerX * 0.8));

      // Use the most centered panel for optimal view
      const maxCentered = Math.max(panel1Centered, panel2Centered);
      const optimal = maxCentered > 0.7;
      
      setIsOptimalView(optimal);
      setGlowIntensity(maxCentered);

      // Make panels face camera (true billboarding)
      panel1Ref.current.quaternion.copy(camera.quaternion);
      panel2Ref.current.quaternion.copy(camera.quaternion);

      // Update glow position and animation
      const centerWorldPos = getRotatedPosition([0, stage.height, 0], dnaRotation);
      if (glowRef.current) {
        glowRef.current.position.copy(centerWorldPos);
        if (optimal) {
          const pulse = Math.sin(Date.now() * 0.005) * 0.3 + 0.7;
          glowRef.current.scale.setScalar(1 + pulse * 0.2);
        }
      }
    });

    return (
      <group>
        {/* Purple glow ring - positioned independently */}
        {isOptimalView && (
          <mesh ref={glowRef} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.7, 0.05, 16, 32]} />
            <meshBasicMaterial
              color="#8b5cf6"
              transparent
              opacity={0.8 * glowIntensity}
            />
          </mesh>
        )}

        {/* Emoji panel - positioned and rotated independently */}
        <group ref={panel1Ref}>
          <mesh>
            <planeGeometry args={[1.8, 1.8]} />
            <meshBasicMaterial 
              color="#ffffff" 
              transparent 
              opacity={0.7 + glowIntensity * 0.3}
            />
          </mesh>
          
          {isOptimalView && (
            <mesh>
              <planeGeometry args={[2.0, 2.0]} />
              <meshBasicMaterial
                color="#8b5cf6"
                transparent
                opacity={0.6 * glowIntensity}
                side={THREE.BackSide}
              />
            </mesh>
          )}
          
          <Text
            position={[0, 0.3, 0.1]}
            fontSize={0.7}
            color="#000000"
            anchorX="center"
            anchorY="middle"
          >
            {stageData.emoji}
          </Text>
          <Text
            position={[0, -0.5, 0.1]}
            fontSize={0.2}
            color="#000000"
            anchorX="center"
            anchorY="top"
            maxWidth={1.6}
            textAlign="center"
            fontWeight="bold"
          >
            {stageData.name}
          </Text>
        </group>

        {/* Description panel - positioned and rotated independently */}
        <group ref={panel2Ref}>
          <mesh>
            <planeGeometry args={[2.2, 1.2]} />
            <meshBasicMaterial 
              color={stageData.color} 
              transparent 
              opacity={0.7 + glowIntensity * 0.3}
            />
          </mesh>
          
          {isOptimalView && (
            <mesh>
              <planeGeometry args={[2.4, 1.4]} />
              <meshBasicMaterial
                color="#8b5cf6"
                transparent
                opacity={0.6 * glowIntensity}
                side={THREE.BackSide}
              />
            </mesh>
          )}
          
          <Text
            position={[0, 0, 0.1]}
            fontSize={0.15}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            maxWidth={2.0}
            textAlign="center"
            fontWeight="bold"
          >
            {stageData.description}
          </Text>
        </group>

        {/* Active stage point light */}
        {isOptimalView && (
          <pointLight
            position={getRotatedPosition([0, stage.height, 0], scrollProgress * Math.PI * 2 * helixCycles)}
            color={stageData.color}
            intensity={glowIntensity * 2}
            distance={8}
          />
        )}
      </group>
    );
  };

  const currentStageIndex = Math.min(
    Math.floor(scrollProgress * stages.length),
    stages.length - 1
  );
  const currentStage = stages[currentStageIndex];

  return (
    <div 
      id="dna-container" 
      className="w-full relative"
      style={{ 
        height: `${scrollScreens * 100}vh`,
        backgroundColor: backgroundColor
      }}
    >
      {/* Progress indicator */}
      <div className="fixed top-4 left-4 z-10 bg-black/80 text-white p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">{currentStage?.emoji}</span>
          <div className="text-lg font-bold">{currentStage?.name}</div>
        </div>
        <div className="text-sm mb-3 max-w-xs">{currentStage?.description}</div>
        <div className="w-48 h-2 bg-gray-600 rounded-full">
          <div 
            className="h-full bg-gradient-to-r from-green-400 via-blue-400 to-pink-400 rounded-full transition-all duration-300"
            style={{ width: `${scrollProgress * 100}%` }}
          />
        </div>
        <div className="flex justify-between mt-1 text-sm">
          <span>Stage {currentStageIndex + 1}/5</span>
          <span>{Math.round(scrollProgress * 100)}%</span>
        </div>
      </div>

      {/* Canvas */}
      <div className="sticky top-0 left-0 w-full h-screen overflow-hidden">
        <Canvas
          camera={{
            position: [0, 0, cameraDistance],
            fov: cameraFOV,
            near: 0.1,
            far: 1000
          }}
        >
          <color attach="background" args={[backgroundColor]} />
          
          <CameraController />
          
          <ambientLight intensity={0.8} />
          <pointLight position={[10, 0, 10]} intensity={0.6} />
          <pointLight position={[-10, 0, -10]} intensity={0.4} />
          
          <DNAHelix />
          <StagePanels />
        </Canvas>
      </div>

      {/* Scroll hint */}
      <div className="fixed bottom-4 right-4 z-10 bg-black/80 text-white p-3 rounded-lg">
        <div className="flex items-center gap-2">
          <span className="text-xl">👇</span>
          <span>Scroll through 5 stages</span>
        </div>
      </div>

      {/* Stage dots */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-10">
        <div className="flex gap-3 bg-black/60 backdrop-blur-sm rounded-full p-3 border border-white/20">
          {stages.map((stage, index) => (
            <div
              key={index}
              className={`w-4 h-4 rounded-full transition-all duration-300 ${
                index <= currentStageIndex 
                  ? 'bg-gradient-to-r from-green-400 to-pink-400' 
                  : 'bg-gray-600'
              } ${
                index === currentStageIndex ? 'scale-125 ring-2 ring-white' : ''
              }`}
              title={stage.name}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default DNATimeline;