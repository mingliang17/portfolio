// src/components/project/ProjectComponents.jsx
import React, { useState } from 'react';

// HeroBackground component
export const HeroBackground = ({ 
  imagePath, 
  opacity = 0,
  scale = 1.1
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  
  const handleImageLoad = () => {
    console.log('✅ Hero image loaded');
    setIsLoading(false);
  };

  const handleImageError = () => {
    console.error('❌ Hero image failed to load:', imagePath);
    setIsLoading(false);
    setHasError(true);
  };

  return (
    <>  
      <div className="project-background-wrapper" style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        pointerEvents: 'none'
      }}>
        {/* Background Image */}
        <div 
          className="project-background-image"
          style={{ 
            backgroundImage: `url('${imagePath}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            opacity: opacity,
            transform: `scale(${scale})`,
            transition: 'opacity 0.3s ease, transform 0.3s ease'
          }}
        >
          {/* Hidden image for preloading */}
          <img
            src={imagePath}
            alt="Hero background"
            onLoad={handleImageLoad}
            onError={handleImageError}
            style={{ display: 'none' }}
          />
        </div>
      </div>

      {isLoading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: '#000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          zIndex: 5
        }}>
          Loading background...
        </div>
      )}

      {hasError && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: '#333',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          zIndex: 5
        }}>
          Failed to load background image
        </div>
      )}
    </>
  );
};

// HeroContent component
export const HeroContent = ({ 
  title, 
  subtitle,
  opacity = 0,
  subtitleOpacity = 0,
  translateY = 30,
  subtitleTranslateY = 30
}) => {
  return (
    <div style={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      textAlign: 'center',
      color: 'white',
      zIndex: 10,
      width: '100%',
      padding: '0 2rem',
      pointerEvents: 'none'
    }}>
      <h1 
        style={{
          opacity: opacity,
          transform: `translateY(${translateY}px)`,
          transition: 'opacity 0.3s ease, transform 0.3s ease',
          fontSize: '3rem',
          fontWeight: 'bold',
          marginBottom: '1rem',
          textShadow: '0 2px 10px rgba(0,0,0,0.5)'
        }}
      >
        {title}
      </h1>
      <p 
        style={{
          opacity: subtitleOpacity,
          transform: `translateY(${subtitleTranslateY}px)`,
          transition: 'opacity 0.3s ease, transform 0.3s ease',
          fontSize: '1.5rem',
          fontWeight: '300',
          maxWidth: '600px',
          margin: '0 auto',
          textShadow: '0 1px 5px rgba(0,0,0,0.5)'
        }}
      >
        {subtitle}
      </p>
    </div>
  );
};

