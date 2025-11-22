import React, { useState, useEffect, useRef } from 'react';

const MyMap = () => {
  const [opacityA, setOpacityA] = useState(0);
  const [opacityB, setOpacityB] = useState(0);
  const [opacityC, setOpacityC] = useState(0);
  const [opacityD, setOpacityD] = useState(0);
  const [opacityE, setOpacityE] = useState(0);
  const [positionA, setPositionA] = useState(0);
  const [positionB, setPositionB] = useState(0);
  const [positionC, setPositionC] = useState({ x: 0, y: 0 });
  const [zoomC, setZoomC] = useState(1);
  const [animationProgress, setAnimationProgress] = useState(0);
  const animationRef = useRef(null);
  
  // Animation variables
  const zoomFactor = 10 ;
  const globalScale = 1.5;
  const animationDuration = 3000;
  const targetPositionC = { x: -300, y: 150 };
  const moveDistanceA = 100;
  const moveDistanceB = moveDistanceA;

  // Image paths
  const imagePaths = {
    A: 'assets/projects/projectMH1/map_0.svg',
    B: 'assets/projects/projectMH1/map_1.svg', 
    C: 'assets/projects/projectMH1/map_2.svg',
    D: 'assets/projects/projectMH1/map_3.svg',
    E: 'assets/projects/projectMH1/map_4.svg',
  };

  useEffect(() => {
    startAnimation();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const startAnimation = () => {
    setOpacityA(0);
    setOpacityB(0);
    setOpacityC(0);
    setOpacityD(0);
    setOpacityE(0);
    setPositionA(0);
    setPositionB(0);
    setPositionC({ x: 0, y: 0 });
    setZoomC(1);
    setAnimationProgress(0);
    
    let startTime = null;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = (timestamp - startTime) / animationDuration;
      setAnimationProgress(progress);
      
      if (progress < 1) {
        if (progress < 0.25) {
          setOpacityA(progress * 4);
        } else if (progress < 0.5) {
          setOpacityA(1);
          const bcProgress = (progress - 0.25) * 4;
          setOpacityB(bcProgress);
          setOpacityC(bcProgress);
        } else {
          const movementProgress = (progress - 0.5) * 2;
          const easeProgress = 1 - Math.pow(1 - movementProgress, 3);
          
          setPositionA(-easeProgress * moveDistanceA);
          setPositionB(-easeProgress * moveDistanceB);
          
          const currentX = easeProgress * targetPositionC.x;
          const currentY = easeProgress * targetPositionC.y;
          setPositionC({ x: currentX, y: currentY });
          setZoomC(1 + (easeProgress * (zoomFactor - 1)));
          
          if (movementProgress > 0.6) {
            const dProgress = (movementProgress - 0.6) / 0.2;
            setOpacityD(Math.min(1, dProgress));
          }
          
          if (movementProgress > 0.8) {
            const eProgress = (movementProgress - 0.8) / 0.2;
            setOpacityE(Math.min(1, eProgress));
          }
        }
        
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setOpacityA(1);
        setOpacityB(1);
        setOpacityC(1);
        setOpacityD(1);
        setOpacityE(1);
        setPositionA(-moveDistanceA);
        setPositionB(-moveDistanceB);
        setPositionC(targetPositionC);
        setZoomC(zoomFactor);
        setAnimationProgress(1);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  };

  return (
    <div style={{
      width: '100%',
      height: '100%',
      backgroundColor: 'transparent',
      position: 'relative',
      overflow: 'hidden',
    }}>
      
      {/* Main container */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        zIndex: 1
      }}>
        
        {/* Image A */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateY(${positionA}px) scale(${globalScale})`,
          width: '300px',
          height: '200px',
          opacity: opacityA,
          zIndex: 1,
          transformOrigin: 'center center',
          willChange: 'transform'
        }}>
          <img 
            src={imagePaths.A}
            alt="Image A"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
            onError={(e) => {
              console.log('Image A failed to load');
              e.target.style.display = 'none';
            }}
          />
        </div>

        {/* Image B */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateY(${positionB}px) scale(${globalScale})`,
          width: '300px',
          height: '200px',
          opacity: opacityB,
          zIndex: 2,
          transformOrigin: 'center center',
          willChange: 'transform'
        }}>
          <img 
            src={imagePaths.B}
            alt="Image B"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
            onError={(e) => {
              console.log('Image B failed to load');
              e.target.style.display = 'none';
            }}
          />
        </div>

        {/* Image C */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translate(${positionC.x}px, ${positionC.y}px) scale(${zoomC * globalScale})`,
          width: '300px',
          height: '200px',
          opacity: opacityC,
          zIndex: 3,
          transformOrigin: 'center center',
          willChange: 'transform'
        }}>
          <img 
            src={imagePaths.C}
            alt="Image C"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
            onError={(e) => {
              console.log('Image C failed to load');
              e.target.style.display = 'none';
            }}
          />
        </div>

        {/* Image D */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translate(${positionC.x}px, ${positionC.y}px) scale(${zoomC * globalScale})`,
          width: '300px',
          height: '200px',
          opacity: opacityD,
          zIndex: 4,
          transformOrigin: 'center center',
          willChange: 'transform'
        }}>
          <img 
            src={imagePaths.D}
            alt="Image D"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
            onError={(e) => {
              console.log('Image D failed to load');
              e.target.style.display = 'none';
            }}
          />
        </div>

        {/* Image E */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translate(${positionC.x}px, ${positionC.y}px) scale(${zoomC * globalScale})`,
          width: '300px',
          height: '200px',
          opacity: opacityE,
          zIndex: 5,
          transformOrigin: 'center center',
          willChange: 'transform'
        }}>
          <img 
            src={imagePaths.E}
            alt="Image E"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
            onError={(e) => {
              console.log('Image E failed to load');
              e.target.style.display = 'none';
            }}
          />
        </div>

      </div>

      {/* Debug info overlay - KEPT */}
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        color: 'white',
        backgroundColor: 'rgba(0,0,0,0.3)',
        padding: '12px',
        borderRadius: '4px',
        fontSize: '12px',
        zIndex: 100,
        fontFamily: 'monospace',
        minWidth: '250px'
      }}>
        <div><strong>ANIMATION DEBUG</strong></div>
        <div>Progress: {(animationProgress * 100).toFixed(0)}%</div>
        <div>Zoom C: {zoomC.toFixed(1)}x</div>
        <div>Global Scale: {globalScale}x</div>
        <div>Total Zoom: {(zoomC * globalScale).toFixed(1)}x</div>
        <div>Position C: {positionC.x.toFixed(0)}, {positionC.y.toFixed(0)}</div>
        <div>Position A: {positionA.toFixed(0)}px</div>
        <div>Position B: {positionB.toFixed(0)}px</div>
        <div style={{marginTop: '8px'}}>
          <div style={{ color: opacityA > 0 ? '#3b82f6' : '#666' }}>● A: {(opacityA * 100).toFixed(0)}%</div>
          <div style={{ color: opacityB > 0 ? '#22c55e' : '#666' }}>● B: {(opacityB * 100).toFixed(0)}%</div>
          <div style={{ color: opacityC > 0 ? '#ef4444' : '#666' }}>● C: {(opacityC * 100).toFixed(0)}%</div>
          <div style={{ color: opacityD > 0 ? '#a855f7' : '#666' }}>● D: {(opacityD * 100).toFixed(0)}%</div>
          <div style={{ color: opacityE > 0 ? '#f59e0b' : '#666' }}>● E: {(opacityE * 100).toFixed(0)}%</div>
        </div>
      </div>
    </div>
  );
};

export default MyMap;