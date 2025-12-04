import React, { useState, useEffect, useRef } from 'react';

// ============================================
// MYMAP COMPONENT WITH EXTERNAL TRIGGER
// ============================================
const MyMap = ({ startAnimation = false }) => {
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
  const hasStartedRef = useRef(false);
  const prevStartAnimationRef = useRef(startAnimation);
  
  const zoomFactor = 10;
  const globalScale = 1.5;
  const animationDuration = 3000;
  const targetPositionC = { x: -300, y: 150 };
  const moveDistanceA = 100;
  const moveDistanceB = moveDistanceA;

  const imagePaths = {
    A: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop',
    B: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&h=200&fit=crop',
    C: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=300&h=200&fit=crop',
    D: 'https://images.unsplash.com/photo-1574169208507-84376144848b?w=300&h=200&fit=crop',
    E: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=300&h=200&fit=crop',
  };

  const runAnimation = () => {
    console.log('🎬 Starting MyMap animation');
    if (hasStartedRef.current) {
      console.log('⚠️ Animation already started, skipping');
      return;
    }
    hasStartedRef.current = true;

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
        console.log('✅ MyMap animation complete');
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

  // Watch for changes in startAnimation prop
  useEffect(() => {
    console.log('🔍 MyMap prop changed:', { 
      startAnimation, 
      prevValue: prevStartAnimationRef.current,
      hasStarted: hasStartedRef.current 
    });
    
    // Trigger animation when prop changes from false to true
    if (startAnimation && !prevStartAnimationRef.current && !hasStartedRef.current) {
      console.log('🚀 Triggering animation from prop change');
      // Small delay to ensure component is mounted
      setTimeout(() => {
        runAnimation();
      }, 100);
    }
    
    prevStartAnimationRef.current = startAnimation;
  }, [startAnimation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div style={{
      width: '100%',
      height: '100%',
      backgroundColor: '#1a1a1a',
      position: 'relative',
      overflow: 'hidden',
    }}>
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
            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
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
            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
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
            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
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
            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
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
            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
          />
        </div>
      </div>

      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        color: 'white',
        backgroundColor: 'rgba(0,0,0,0.7)',
        padding: '12px',
        borderRadius: '4px',
        fontSize: '12px',
        zIndex: 100,
        fontFamily: 'monospace',
        minWidth: '250px'
      }}>
        <div><strong>MAP ANIMATION</strong></div>
        <div>Progress: {(animationProgress * 100).toFixed(0)}%</div>
        <div>Status: {animationProgress >= 1 ? 'Complete' : 'Animating'}</div>
      </div>
    </div>
  );
};
export default MyMap;