import React from 'react';
import myImage from './images/my-image.jpg';
import myImageWebp from './images/my-image.webp';

const OptimizedImage = () => (
  <picture>
    <source srcSet={myImageWebp} type="image/webp" />
    <source srcSet={myImage} type="image/jpeg" />
    <img 
      src={myImage} 
      alt="Description" 
      loading="lazy"
      width="800"
      height="600"
    />
  </picture>
);

Use Squoosh
