// src/sections/projects/HeroSection.jsx
// Ironhill-inspired Premium Hero
import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';

export const HeroSection = ({ 
  imagePath, 
  title, 
  subtitle, 
  isActive 
}) => {
  const containerRef = useRef(null);
  const textRef = useRef(null);
  const imageRef = useRef(null);
  const subtitleRef = useRef(null);

  useEffect(() => {
    if (isActive) {
      // Reset
      gsap.set(textRef.current, { y: 100, opacity: 0 });
      gsap.set(subtitleRef.current, { y: 50, opacity: 0 });
      // Bokeh Entry: Start extremely blurry and larger (Req 3)
      gsap.set(imageRef.current, { scale: 1.5, opacity: 0, filter: 'blur(60px)' });
      
      // Animate In with Bokeh Effect
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      
      // Image sharpens and fades in (Slow, cinematic focus pull - Req 3)
      tl.to(imageRef.current, {
        opacity: 0.6,
        scale: 1,
        filter: 'blur(0px)', // Sharpen
        duration: 5.0, // Much slower for cinematic feel (Req 3)
        ease: 'power1.inOut'
      })
      .to(textRef.current, {
        y: 0,
        opacity: 1,
        duration: 1.5,
        stagger: 0.15
      }, '-=3.5') // Text enters as image sharpens
      .to(subtitleRef.current, {
        y: 0,
        opacity: 1,
        duration: 1.2
      }, '-=2.5');

    }
  }, [isActive]);

  return (
    <div 
      ref={containerRef}
      className="hero-section-container"
      style={{
        position: 'relative',
        width: '100%',
        height: '100vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000'
      }}
    >
      {/* Background Image with Parallax Potential */}
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0
        }}
      >
        <img
          ref={imageRef}
          src={imagePath}
          alt={title}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: 0.6
          }}
        />
        <div style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at center, transparent 0%, #000 100%)'
        }} />
      </div>

      {/* Content */}
      <div 
        style={{
          position: 'relative',
          zIndex: 10,
          textAlign: 'center',
          mixBlendMode: 'difference',
          color: 'white',
          padding: '0 2rem'
        }}
      >
        <h1 
          ref={textRef}
          style={{
            fontSize: 'clamp(3rem, 15vw, 12rem)', // Massive typography
            fontWeight: 900,
            lineHeight: 0.85,
            letterSpacing: '-0.02em',
            margin: 0,
            textTransform: 'uppercase',
            willChange: 'transform, opacity'
          }}
        >
          {title}
        </h1>
        
        {subtitle && (
          <p 
            ref={subtitleRef}
            style={{
              fontSize: 'clamp(1rem, 2vw, 1.5rem)',
              fontWeight: 400,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              marginTop: '2rem',
              color: 'rgba(255,255,255,0.8)'
            }}
          >
            {subtitle}
          </p>
        )}
      </div>

      {/* Scroll Indicator */}
      <div 
        style={{
          position: 'absolute',
          bottom: '2rem',
          left: '50%',
          transform: 'translateX(-50%)',
          color: 'white',
          opacity: 0.5,
          fontSize: '0.8rem',
          letterSpacing: '0.2em',
          textTransform: 'uppercase'
        }}
      >
        Scroll to Explore
      </div>
    </div>
  );
};

export default HeroSection;
