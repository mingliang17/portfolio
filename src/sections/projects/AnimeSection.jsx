// src/sections/projects/AnimeSection.jsx
// COMPLETE REWRITE - with embedded overflow detection
import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { createTimeline } from 'animejs';
import { assetPath } from '@/utils/assetPath.js';

// ===================================
// OVERFLOW CHECKER - Runs on mount
// ===================================
const checkParentOverflows = (element) => {
  if (!element) return [];
  
  const problems = [];
  let el = element;
  let level = 0;
  
  console.log('%c=== CHECKING PARENT OVERFLOWS ===', 'color: lime; font-size: 16px; font-weight: bold;');
  
  while (el = el.parentElement) {
    const styles = window.getComputedStyle(el);
    const overflow = styles.overflow;
    const overflowY = styles.overflowY;
    const overflowX = styles.overflowX;
    const className = el.className || el.tagName;
    
    const indent = '  '.repeat(level);
    
    const hasProblem = (overflow !== 'visible' && overflow !== 'clip') || 
                       (overflowY !== 'visible' && overflowY !== 'clip');
    
    if (hasProblem) {
      console.error(`${indent}❌ ${className}: overflow=${overflow}, overflowY=${overflowY}`);
      problems.push({
        element: el,
        className,
        overflow,
        overflowY,
        overflowX
      });
    } else {
      console.log(`${indent}✅ ${className}: overflow=${overflow || 'visible'}`);
    }
    
    level++;
    if (el === document.body) break;
  }
  
  if (problems.length > 0) {
    console.error('%c\n🚨 FOUND ' + problems.length + ' OVERFLOW PROBLEM(S) - STICKY WILL NOT WORK!', 'color: red; font-size: 16px; font-weight: bold;');
    problems.forEach((p, i) => {
      console.error(`\nProblem ${i + 1}: ${p.className}`);
      console.error('  overflow:', p.overflow);
      console.error('  overflowY:', p.overflowY);
    });
  }
  
  return problems;
};

// ===================================
// DEBUG PANEL
// ===================================
const DebugPanel = ({ 
  scrollProgress, 
  activeIdx, 
  meshCount, 
  sectionMetrics,
  timelineProgress,
  stickyMetrics,
  overflowProblems
}) => {
  const [expanded, setExpanded] = useState(true);

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      background: overflowProblems.length > 0 ? 'rgba(255, 0, 0, 0.95)' : 'rgba(0, 255, 0, 0.95)',
      color: overflowProblems.length > 0 ? 'white' : 'black',
      padding: '15px',
      borderRadius: '8px',
      fontFamily: 'monospace',
      fontSize: '11px',
      zIndex: 10000,
      minWidth: '320px',
      maxWidth: '400px',
      border: `3px solid ${overflowProblems.length > 0 ? 'red' : 'lime'}`,
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5)',
      maxHeight: '90vh',
      overflowY: 'auto'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '10px',
        borderBottom: `2px solid ${overflowProblems.length > 0 ? 'white' : 'black'}`,
        paddingBottom: '8px'
      }}>
        <strong style={{ fontSize: '16px' }}>
          {overflowProblems.length > 0 ? '🚨 BROKEN' : '🐛 DEBUG'}
        </strong>
        <button 
          onClick={() => setExpanded(!expanded)}
          style={{
            background: overflowProblems.length > 0 ? 'white' : 'black',
            color: overflowProblems.length > 0 ? 'red' : 'lime',
            border: 'none',
            padding: '4px 10px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          {expanded ? '−' : '+'}
        </button>
      </div>

      {expanded && (
        <>
          {/* OVERFLOW PROBLEMS - SHOW FIRST */}
          {overflowProblems.length > 0 && (
            <div style={{ 
              marginBottom: '15px', 
              padding: '12px', 
              background: 'rgba(255,255,255,0.2)', 
              borderRadius: '6px',
              border: '2px solid white'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>
                🚨 OVERFLOW PROBLEMS
              </div>
              <div style={{ fontSize: '12px', marginBottom: '8px', lineHeight: 1.4 }}>
                Found {overflowProblems.length} parent(s) with overflow: hidden/auto.
                <strong> Sticky WILL NOT work!</strong>
              </div>
              {overflowProblems.map((p, i) => (
                <div key={i} style={{ 
                  background: 'rgba(0,0,0,0.3)', 
                  padding: '6px', 
                  borderRadius: '4px',
                  marginTop: '6px',
                  fontSize: '10px'
                }}>
                  <div><strong>Element:</strong> {p.className}</div>
                  <div><strong>overflow:</strong> {p.overflow}</div>
                  <div><strong>overflowY:</strong> {p.overflowY}</div>
                </div>
              ))}
            </div>
          )}

          {/* SCROLL PROGRESS */}
          <div style={{ marginBottom: '12px', padding: '8px', background: 'rgba(0,0,0,0.15)', borderRadius: '4px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>📊 SCROLL</div>
            <div><strong>Section:</strong> {(scrollProgress * 100).toFixed(1)}%</div>
            <div><strong>Timeline:</strong> {(timelineProgress * 100).toFixed(1)}%</div>
            <div style={{ 
              width: '100%', 
              height: '8px', 
              background: 'rgba(0,0,0,0.3)', 
              borderRadius: '4px',
              marginTop: '6px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${scrollProgress * 100}%`,
                height: '100%',
                background: 'linear-gradient(90deg, yellow, red)',
                transition: 'width 0.05s linear'
              }} />
            </div>
          </div>

          {/* CHECKPOINT */}
          <div style={{ marginBottom: '12px', padding: '8px', background: 'rgba(0,0,0,0.15)', borderRadius: '4px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>📍 CHECKPOINT</div>
            <div><strong>Active:</strong> {activeIdx + 1} / {sectionMetrics.checkpointCount}</div>
            <div><strong>Meshes:</strong> {meshCount}</div>
          </div>

          {/* SECTION METRICS */}
          <div style={{ marginBottom: '12px', padding: '8px', background: 'rgba(0,0,0,0.15)', borderRadius: '4px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '4px', color: overflowProblems.length > 0 ? 'white' : 'red' }}>
              🔴 SECTION (Red)
            </div>
            <div><strong>Height:</strong> {Math.round(sectionMetrics.height)}px</div>
            <div><strong>Top:</strong> {Math.round(sectionMetrics.top)}px</div>
            <div><strong>In View:</strong> <span style={{ 
              color: 'white', 
              background: sectionMetrics.inView ? 'green' : 'red',
              padding: '2px 6px',
              borderRadius: '3px',
              fontWeight: 'bold'
            }}>{sectionMetrics.inView ? '✓' : '✗'}</span></div>
          </div>

          {/* STICKY METRICS */}
          <div style={{ 
            marginBottom: '12px', 
            padding: '10px', 
            background: overflowProblems.length > 0 ? 'rgba(255,255,255,0.2)' : 'rgba(0,255,0,0.2)',
            borderRadius: '4px',
            border: overflowProblems.length > 0 ? '2px solid white' : '2px solid green'
          }}>
            <div style={{ 
              fontWeight: 'bold', 
              marginBottom: '6px',
              color: overflowProblems.length > 0 ? 'white' : 'darkgreen'
            }}>
              🟢 STICKY (Lime)
            </div>
            <div><strong>Position:</strong> {stickyMetrics.position}</div>
            <div><strong>Top:</strong> {Math.round(stickyMetrics.top)}px</div>
            <div><strong>Stuck:</strong> <span style={{ 
              color: 'white', 
              background: stickyMetrics.isStuck ? 'green' : 'red',
              padding: '2px 6px',
              borderRadius: '3px',
              fontWeight: 'bold'
            }}>{stickyMetrics.isStuck ? '✓' : '✗'}</span></div>
            <div><strong>Visible:</strong> <span style={{ 
              color: 'white', 
              background: stickyMetrics.isVisible ? 'green' : 'red',
              padding: '2px 6px',
              borderRadius: '3px',
              fontWeight: 'bold'
            }}>{stickyMetrics.isVisible ? '✓' : '✗'}</span></div>
          </div>

          {/* WINDOW */}
          <div style={{ padding: '8px', background: 'rgba(0,0,0,0.15)', borderRadius: '4px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>🪟 WINDOW</div>
            <div><strong>Scroll:</strong> {Math.round(sectionMetrics.scrollY)}px</div>
            <div><strong>Height:</strong> {sectionMetrics.viewportHeight}px</div>
          </div>
        </>
      )}
    </div>
  );
};

// ===================================
// MODEL COMPONENT
// ===================================
const ReconstructingModel = ({ modelPath, onMeshCountDetected }) => {
  const groupRef = useRef();
  const meshesRef = useRef([]);
  const animationStateRef = useRef({
    rotation: 0,
    meshes: []
  });

  const { scene } = useGLTF(assetPath(modelPath));

  useEffect(() => {
    if (!scene || !groupRef.current) return;

    console.log('🎨 Loading model:', modelPath);

    groupRef.current.clear();
    const clonedScene = scene.clone(true);
    const meshes = [];

    clonedScene.traverse((child) => {
      if (child.isMesh) {
        child.material = child.material.clone();
        child.material.transparent = true;
        child.userData.originalPosition = child.position.clone();
        meshes.push(child);
      }
    });

    console.log(`✅ Loaded ${meshes.length} meshes`);
    meshesRef.current = meshes;
    groupRef.current.add(clonedScene);

    animationStateRef.current.meshes = meshes.map(() => ({
      scatterOffset: { x: 0, y: 0, z: 0 },
      opacity: 1
    }));

    groupRef.current.userData.animationState = animationStateRef.current;
    if (onMeshCountDetected) onMeshCountDetected(meshes.length);
  }, [scene, modelPath, onMeshCountDetected]);

  useFrame(() => {
    if (meshesRef.current.length === 0) return;
    const state = animationStateRef.current;
    groupRef.current.rotation.y = state.rotation;

    meshesRef.current.forEach((mesh, i) => {
      const mState = state.meshes[i];
      if (!mState) return;
      const orig = mesh.userData.originalPosition;
      mesh.position.set(
        orig.x + mState.scatterOffset.x,
        orig.y + mState.scatterOffset.y,
        orig.z + mState.scatterOffset.z
      );
      mesh.material.opacity = mState.opacity;
    });
  });

  return <group ref={groupRef} scale={0.06} position={[0, -1, 0]} />;
};

// ===================================
// MAIN ANIME SECTION
// ===================================
const AnimeSection = ({
  modelPath = 'assets/projects/mh1/models/gltf/mh1_2.gltf',
  checkpoints = [
    { title: 'System Offline', description: 'Initializing core systems...' },
    { title: 'Structural Analysis', description: 'Scanning geometry architecture.' },
    { title: 'Deconstruction', description: 'Separating mesh components.' },
    { title: 'Data Cloud', description: 'Processing vertex data streams.' },
    { title: 'Re-Materializing', description: 'Compiling structure patterns.' },
    { title: 'System Restored', description: 'Reconstruction complete.' }
  ],
  debugMode = true 
}) => {
  const sectionRef = useRef();
  const stickyRef = useRef();
  const canvasGroupRef = useRef();
  
  const [scrollProgress, setScrollProgress] = useState(0);
  const [timelineProgress, setTimelineProgress] = useState(0);
  const [activeIdx, setActiveIdx] = useState(0);
  const [meshCount, setMeshCount] = useState(0);
  const [overflowProblems, setOverflowProblems] = useState([]);
  
  const [sectionMetrics, setSectionMetrics] = useState({
    height: 0,
    top: 0,
    bottom: 0,
    scrollY: 0,
    viewportHeight: 0,
    inView: false,
    checkpointCount: checkpoints.length
  });

  const [stickyMetrics, setStickyMetrics] = useState({
    position: 'unknown',
    top: 0,
    isStuck: false,
    isVisible: false
  });

  const timelineRef = useRef(null);
  const visibilityRef = useRef(false);

  // Section height
  const sectionHeightVh = useMemo(() => {
    return checkpoints.length * 120 + 100;
  }, [checkpoints.length]);

  const checkpointPositions = useMemo(() => 
    checkpoints.map((_, i) => i / (checkpoints.length - 1 || 1)), 
    [checkpoints]
  );

  // Check for overflow problems on mount
  useEffect(() => {
    if (!stickyRef.current) return;
    
    setTimeout(() => {
      const problems = checkParentOverflows(stickyRef.current);
      setOverflowProblems(problems);
      
      if (problems.length > 0) {
        console.error('%c⚠️ STICKY WILL NOT WORK - PARENT OVERFLOW PROBLEMS DETECTED', 'color: red; font-size: 18px; font-weight: bold;');
      }
    }, 1000);
  }, []);

  // ANIME.JS TIMELINE
  useEffect(() => {
    if (meshCount === 0 || !canvasGroupRef.current) return;

    const animState = canvasGroupRef.current.children[0]?.userData?.animationState;
    if (!animState) return;

    console.log('🎬 Creating timeline');

    const tl = createTimeline({ autoplay: false });
    const phaseDur = 1000;

    tl.add(animState, {
      rotation: Math.PI * 8,
      duration: phaseDur * 6,
      ease: 'linear'
    }, 0);

    animState.meshes.forEach((m, i) => {
      const delay = (i / meshCount) * 1000;
      
      tl.add(m.scatterOffset, {
        x: (Math.random() - 0.5) * 60,
        y: (Math.random() - 0.5) * 60,
        z: (Math.random() - 0.5) * 60,
        duration: phaseDur,
        ease: 'outExpo'
      }, phaseDur + delay);

      tl.add(m, {
        opacity: 0.3,
        duration: phaseDur * 0.5,
      }, phaseDur + delay);

      tl.add(m.scatterOffset, {
        x: 0, y: 0, z: 0,
        duration: phaseDur,
        ease: 'outElastic(1, .8)'
      }, phaseDur * 4 + delay);

      tl.add(m, {
        opacity: 1,
        duration: phaseDur * 0.5,
      }, phaseDur * 4 + delay);
    });

    timelineRef.current = tl;
    console.log('✅ Timeline ready');

    return () => {
      if (timelineRef.current) {
        timelineRef.current.pause();
      }
    };
  }, [meshCount]);

  // INTERSECTION OBSERVER - Accurate visibility
  useEffect(() => {
    if (!stickyRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          visibilityRef.current = entry.isIntersecting;
          setStickyMetrics(prev => ({
            ...prev,
            isVisible: entry.isIntersecting
          }));
          
          if (debugMode) {
            console.log('👁️ Sticky:', entry.isIntersecting ? 'VISIBLE' : 'HIDDEN', 
                       '(intersection ratio:', (entry.intersectionRatio * 100).toFixed(1) + '%)');
          }
        });
      },
      {
        threshold: [0, 0.01, 0.1, 0.5, 0.9, 0.99, 1],
        rootMargin: '0px'
      }
    );

    observer.observe(stickyRef.current);
    return () => observer.disconnect();
  }, [debugMode]);

  // SCROLL HANDLER
  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current || !stickyRef.current || !timelineRef.current) return;

      const sectionRect = sectionRef.current.getBoundingClientRect();
      const stickyRect = stickyRef.current.getBoundingClientRect();
      const vh = window.innerHeight;
      const scrollY = window.scrollY || window.pageYOffset;
      
      const stickyStyles = window.getComputedStyle(stickyRef.current);
      
      // Calculate progress
      const sectionTop = sectionRect.top + scrollY;
      const scrolledIntoSection = scrollY - sectionTop + vh;
      const progress = Math.max(0, Math.min(1, scrolledIntoSection / sectionRect.height));

      setScrollProgress(progress);
      
      // Update timeline
      const timelinePos = progress * timelineRef.current.duration;
      timelineRef.current.seek(timelinePos);
      setTimelineProgress(timelinePos / timelineRef.current.duration);

      // Check if sticky is stuck
      const isStuck = stickyStyles.position === 'sticky' && Math.abs(stickyRect.top) < 2;

      // Update metrics
      setSectionMetrics({
        height: sectionRect.height,
        top: sectionRect.top,
        bottom: sectionRect.bottom,
        scrollY: scrollY,
        viewportHeight: vh,
        inView: sectionRect.top < vh && sectionRect.bottom > 0,
        checkpointCount: checkpoints.length
      });

      setStickyMetrics(prev => ({
        ...prev,
        position: stickyStyles.position,
        top: stickyRect.top,
        isStuck: isStuck
      }));

      // Update checkpoint
      const nearest = checkpointPositions.reduce((prev, curr, idx) => 
        Math.abs(curr - progress) < Math.abs(checkpointPositions[prev] - progress) ? idx : prev, 0);
      
      if (nearest !== activeIdx) {
        setActiveIdx(nearest);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    setTimeout(handleScroll, 100);
    setTimeout(handleScroll, 500);
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeIdx, checkpointPositions, checkpoints.length]);

  return (
    <section 
      ref={sectionRef}
      style={{ 
        position: 'relative',
        width: '100%',
        height: `${sectionHeightVh}vh`,
        backgroundColor: '#050505',
        overflow: 'visible',
        WebkitOverflowScrolling: 'touch',
        ...(debugMode && { 
          outline: '5px solid red',
          outlineOffset: '-5px'
        })
      }}
    >
      {/* DEBUG PANEL */}
      {debugMode && (
        <DebugPanel
          scrollProgress={scrollProgress}
          activeIdx={activeIdx}
          meshCount={meshCount}
          sectionMetrics={sectionMetrics}
          timelineProgress={timelineProgress}
          stickyMetrics={stickyMetrics}
          overflowProblems={overflowProblems}
        />
      )}

      {/* STICKY VIEWPORT */}
      <div 
        ref={stickyRef}
        style={{
          position: 'sticky',
          top: 0,
          left: 0,
          height: '100vh',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          zIndex: 10,
          backgroundColor: '#0a0a0a',
          WebkitOverflowScrolling: 'touch',
          ...(debugMode && { 
            outline: '5px solid lime',
            outlineOffset: '-5px'
          })
        }}
      >
        {/* CANVAS */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          <Canvas camera={{ position: [0, 5, 30], fov: 45 }}>
            <color attach="background" args={['#0a0a0a']} />
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1.5} />
            <group ref={canvasGroupRef}>
              <ReconstructingModel 
                modelPath={modelPath}
                onMeshCountDetected={setMeshCount}
              />
            </group>
            <Environment preset="city" />
          </Canvas>
        </div>

        {/* UI */}
        <div style={{ 
          position: 'relative', 
          zIndex: 10, 
          color: 'white', 
          textAlign: 'center', 
          pointerEvents: 'none',
          maxWidth: '90%',
          padding: '2rem'
        }}>
          <h2 style={{ 
            fontSize: 'clamp(2rem, 6vw, 5rem)', 
            margin: 0, 
            fontWeight: 900, 
            textTransform: 'uppercase',
            textShadow: '0 0 20px rgba(0, 255, 204, 0.5)',
            lineHeight: 1.2
          }}>
            {checkpoints[activeIdx].title}
          </h2>
          <p style={{ 
            fontSize: 'clamp(1rem, 2vw, 1.5rem)', 
            color: '#00ffcc',
            marginTop: '1rem'
          }}>
            {checkpoints[activeIdx].description}
          </p>
        </div>

        {/* PROGRESS */}
        <div style={{
          position: 'absolute',
          bottom: '2rem',
          width: 'min(300px, 80%)',
          height: '6px',
          background: 'rgba(255,255,255,0.2)',
          borderRadius: '3px',
          overflow: 'hidden'
        }}>
          <div style={{
            height: '100%',
            width: `${scrollProgress * 100}%`,
            background: '#00ffcc',
            transition: 'width 0.05s linear'
          }} />
        </div>

        {/* CHECKPOINTS */}
        <div style={{
          position: 'absolute',
          bottom: '4rem',
          display: 'flex',
          gap: '10px'
        }}>
          {checkpoints.map((_, idx) => (
            <div
              key={idx}
              style={{
                width: idx === activeIdx ? '28px' : '12px',
                height: '12px',
                borderRadius: '6px',
                background: idx === activeIdx ? '#00ffcc' : 'rgba(255,255,255,0.3)',
                transition: 'all 0.3s ease'
              }}
            />
          ))}
        </div>

        {/* HIDDEN INDICATOR */}
        {debugMode && !visibilityRef.current && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '120px',
            opacity: 0.5,
            color: 'red',
            fontWeight: 'bold',
            pointerEvents: 'none'
          }}>
            HIDDEN
          </div>
        )}
      </div>

      {/* MARKERS */}
      {debugMode && (
        <>
          <div style={{
            position: 'absolute',
            top: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(255,0,0,0.9)',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '6px',
            fontWeight: 'bold',
            zIndex: 9999
          }}>
            ⬇ SECTION START
          </div>
          <div style={{
            position: 'absolute',
            bottom: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(255,0,0,0.9)',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '6px',
            fontWeight: 'bold',
            zIndex: 9999
          }}>
            ⬆ SECTION END
          </div>
        </>
      )}
    </section>
  );
};

useGLTF.preload(assetPath('assets/projects/mh1/models/gltf/mh1_2.gltf'));

export default AnimeSection;