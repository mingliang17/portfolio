import { useState, useEffect, useRef } from 'react';

const MyMap = ({ startAnimation = false, mapImages = {}, defaultImagePath = null }) => {
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
  const [sidebarVisible, setSidebarVisible] = useState(false);
  
  const animationRef = useRef(null);
  const hasStartedRef = useRef(false);
  const isMountedRef = useRef(false);
  
  // Animation variables
  const zoomFactor = 12;
  const animationDuration = 3000;
  const targetPositionC = { x: -350, y: 150 };
  const moveDistanceA = 100;
  const moveDistanceB = moveDistanceA;

  // Image paths
  const imagePaths = mapImages || defaultImagePath || {
    A: '',
    B: '',
    C: '',
    D: '',
    E: '',
  };
  
  const runAnimation = () => {
    console.log('🎬 Starting MyMap animation');
    if (hasStartedRef.current) {
      console.log('⚠️ Animation already started, skipping');
      return;
    }
    hasStartedRef.current = true;
    
    // Reset everything
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
    setSidebarVisible(false);
    
    let startTime = null;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / animationDuration, 1);
      setAnimationProgress(progress);
      
      if (progress < 1) {
        // Phase 1 (0-25%): Fade in Image A
        if (progress < 0.25) {
          const fadeProgress = progress * 4;
          setOpacityA(fadeProgress);
          console.log(`📸 Phase 1: Image A opacity = ${fadeProgress.toFixed(2)}`);
        } 
        // Phase 2 (25-50%): Fade in Images B and C
        else if (progress < 0.5) {
          setOpacityA(1);
          const bcProgress = (progress - 0.25) * 4;
          setOpacityB(bcProgress);
          setOpacityC(bcProgress);
          console.log(`📸 Phase 2: Images B&C opacity = ${bcProgress.toFixed(2)}`);
        } 
        // Phase 3 (50-100%): Move and zoom, fade in D and E
        else {
          setOpacityA(1);
          setOpacityB(1);
          setOpacityC(1);
          
          const movementProgress = (progress - 0.5) * 2;
          const easeProgress = 1 - Math.pow(1 - movementProgress, 3);
          
          // Move images
          setPositionA(-easeProgress * moveDistanceA);
          setPositionB(-easeProgress * moveDistanceB);
          
          const currentX = easeProgress * targetPositionC.x;
          const currentY = easeProgress * targetPositionC.y;
          setPositionC({ x: currentX, y: currentY });
          setZoomC(1 + (easeProgress * (zoomFactor - 1)));
          
          // Fade in Image D (60-80%)
          if (movementProgress > 0.6) {
            const dProgress = Math.min(1, (movementProgress - 0.6) / 0.2);
            setOpacityD(dProgress);
            console.log(`📸 Phase 3a: Image D opacity = ${dProgress.toFixed(2)}`);
          }
          
          // Fade in Image E (80-100%)
          if (movementProgress > 0.8) {
            const eProgress = Math.min(1, (movementProgress - 0.8) / 0.2);
            setOpacityE(eProgress);
            console.log(`📸 Phase 3b: Image E opacity = ${eProgress.toFixed(2)}`);
          }
          
          // Show sidebar only after Image E reaches 80% opacity
          if (movementProgress > 0.92 && !sidebarVisible) {
            console.log('📊 Showing sidebar');
            setSidebarVisible(true);
          }
        }
        
        animationRef.current = requestAnimationFrame(animate);
      } else {
        // Animation complete
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
        setSidebarVisible(true);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  };

  // Mark component as mounted
  useEffect(() => {
    console.log('✅ MyMap component mounted');
    isMountedRef.current = true;
    
    return () => {
      console.log('❌ MyMap component unmounting');
      isMountedRef.current = false;
      hasStartedRef.current = false;
      setSidebarVisible(false);
    };
  }, []);

  // Trigger animation
  useEffect(() => {
    console.log('🔍 MyMap animation check:', { 
      startAnimation,
      isMounted: isMountedRef.current,
      hasStarted: hasStartedRef.current 
    });
    
    if (isMountedRef.current && startAnimation && !hasStartedRef.current) {
      console.log('🚀 Triggering animation after delay');
      const timeoutId = setTimeout(() => {
        runAnimation();
      }, 150);
      
      return () => clearTimeout(timeoutId);
    }
  }, [startAnimation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Emit sidebar visibility event for parent components
  useEffect(() => {
    if (sidebarVisible) {
      window.dispatchEvent(new CustomEvent('map-sidebar-visible'));
    }
  }, [sidebarVisible]);

  return (
    <div className="my-map-container">
      
      {/* Main container */}
      <div className="my-map-main">
        
        {/* Image A - Fades in first */}
        <div 
          className="my-map-image image-a"
          style={{
            transform: `translate(-50%, -50%) translateY(${positionA}px) scale(1)`,
            opacity: opacityA,
          }}
        >
          <img 
            src={imagePaths.A}
            alt="Image A"
            className="my-map-img"
            onError={(e) => {
              console.log('Image A failed to load');
              e.target.style.display = 'none';
            }}
          />
        </div>

        {/* Image B */}
        <div 
          className="my-map-image image-b"
          style={{
            transform: `translate(-50%, -50%) translateY(${positionB}px) scale(1)`,
            opacity: opacityB,
          }}
        >
          <img 
            src={imagePaths.B}
            alt="Image B"
            className="my-map-img"
            onError={(e) => {
              console.log('Image B failed to load');
              e.target.style.display = 'none';
            }}
          />
        </div>

        {/* Image C */}
        <div 
          className="my-map-image image-c"
          style={{
            transform: `translate(-50%, -50%) translate(${positionC.x}px, ${positionC.y}px) scale(${zoomC})`,
            opacity: opacityC,
          }}
        >
          <img 
            src={imagePaths.C}
            alt="Image C"
            className="my-map-img"
            onError={(e) => {
              console.log('Image C failed to load');
              e.target.style.display = 'none';
            }}
          />
        </div>

        {/* Image D */}
        <div 
          className="my-map-image image-d"
          style={{
            transform: `translate(-50%, -50%) translate(${positionC.x}px, ${positionC.y}px) scale(${zoomC})`,
            opacity: opacityD,
          }}
        >
          <img 
            src={imagePaths.D}
            alt="Image D"
            className="my-map-img"
            onError={(e) => {
              console.log('Image D failed to load');
              e.target.style.display = 'none';
            }}
          />
        </div>

        {/* Image E */}
        <div 
          className="my-map-image image-e"
          style={{
            transform: `translate(-50%, -50%) translate(${positionC.x}px, ${positionC.y}px) scale(${zoomC})`,
            opacity: opacityE,
          }}
        >
          <img 
            src={imagePaths.E}
            alt="Image E"
            className="my-map-img"
            onError={(e) => {
              console.log('Image E failed to load');
              e.target.style.display = 'none';
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default MyMap;