// src/components/project/ProjectComponents.jsx
import React, { useState } from 'react';
import TextType from '../../bits/TextType.jsx';

/* ───────────────────────────────────────────── */
/* HeroBackground                                 */
/* ───────────────────────────────────────────── */
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
      <div className="project-background-wrapper">
        <div
          className="project-background-image"
          style={{
            backgroundImage: `url('${imagePath}')`,
            opacity,
            transform: `scale(${scale})`
          }}
        >
          {/* Preload image */}
          <img
            src={imagePath}
            alt="Hero background"
            onLoad={handleImageLoad}
            onError={handleImageError}
            className="hidden-image"
          />
        </div>
      </div>

      {isLoading && (
        <div className="background-loading">
          Loading background...
        </div>
      )}

      {hasError && (
        <div className="background-error">
          Failed to load background image
        </div>
      )}
    </>
  );
};

/* ───────────────────────────────────────────── */
/* HeroContent                                   */
/* ───────────────────────────────────────────── */
export const HeroContent = ({
  titleTexts = [],
  subtitle,
  titleOpacity = 1,
  subtitleOpacity = 0,
  subtitleX = 40,
  showTitle = true,
}) => {
  return (
    <div className="hero-content-container">
      {/* TITLE (typing) */}
      {showTitle && (
        <h1
          className="hero-title"
          style={{ opacity: titleOpacity }}
        >
          <TextType
            text={titleTexts}
            typingSpeed={150}
            pauseDuration={1500}
            showCursor
            cursorCharacter="|"
          />
        </h1>
      )}

      {/* SUBTITLE */}
      <p
        className="hero-subtitle"
        style={{
          opacity: subtitleOpacity,
          transform: `translateX(${subtitleX}px)`,
        }}
      >
        {subtitle}
      </p>
    </div>
  );
};

/* ───────────────────────────────────────────── */
/* Default export (optional)                     */
/* ───────────────────────────────────────────── */
export default {
  HeroBackground,
  HeroContent
};
