# 📖 Portfolio Website - Implementation Guide

## Table of Contents
1. [Overview](#overview)
2. [Project Structure](#project-structure)
3. [Adding a New Project](#adding-a-new-project)
4. [Asset Management](#asset-management)
5. [Customizing Components](#customizing-components)
6. [Best Practices](#best-practices)

---

## Overview

This refactored portfolio website uses a modular, scalable architecture that makes it easy to add new projects while maintaining consistency. All functionality from the original code is preserved.

### Key Improvements:
- ✅ **Centralized asset management** - All paths in one place
- ✅ **Reusable components** - DRY (Don't Repeat Yourself)
- ✅ **Consistent styling** - CSS variables for theming
- ✅ **Easy scaling** - Add projects in minutes, not hours
- ✅ **Type-safe** - Clear data structures

---

## Project Structure

```
src/
├── assets/
│   └── index.js                 # All asset paths exported here
│
├── components/
│   ├── common/
│   │   └── index.jsx           # Reusable UI components
│   ├── project/
│   │   ├── ProjectLayout.jsx   # Base layout for projects
│   │   └── ...                 # Project-specific components
│   └── 3d/                     # Three.js components
│
├── hooks/
│   └── index.js                # Custom hooks for logic reuse
│
├── constants/
│   └── projectsData.js         # All project configurations
│
├── pages/
│   └── projects/
│       ├── ProjectMH1.jsx      # Individual project pages
│       └── ...
│
└── styles/
    ├── variables.css           # CSS custom properties
    ├── base.css               # Global styles
    └── projects.css           # Project-specific styles
```

---

## Adding a New Project

### Step 1: Organize Project Assets

Create a folder structure for your new project:

```
public/assets/projects/mh2/
├── hero.jpg                    # Main hero image
├── image_1.jpg                 # Carousel images
├── image_2.jpg
├── image_3.jpg
├── map_0.svg                   # Map layers (if applicable)
├── map_1.svg
└── ...
```

### Step 2: Register Assets in `src/assets/index.js`

```javascript
export const PROJECT_ASSETS = {
  // ... existing projects
  
  mh2: {
    hero: assetPath('assets/projects/mh2/hero.jpg'),
    
    carousel: [
      assetPath('assets/projects/mh2/image_1.jpg'),
      assetPath('assets/projects/mh2/image_2.jpg'),
      assetPath('assets/projects/mh2/image_3.jpg'),
    ],
    
    map: {
      layer0: assetPath('assets/projects/mh2/map_0.svg'),
      layer1: assetPath('assets/projects/mh2/map_1.svg'),
    },
    
    logos: [
      { src: assetPath('assets/github.svg'), alt: 'GitHub', title: 'GitHub' },
    ],
  },
};
```

### Step 3: Create Project Configuration in `src/constants/projectsData.js`

```javascript
export const PROJECT_MH2 = {
  id: 'mh2',
  title: 'Project MH2',
  subtitle: 'Your Project Subtitle',
  category: 'Web Development',
  
  assets: {
    hero: PROJECT_ASSETS.mh2.hero,
    carousel: PROJECT_ASSETS.mh2.carousel.map((img, index) => ({
      id: index + 1,
      image: img,
      title: `Image ${index + 1}`,
      description: 'Your description here',
    })),
    map: PROJECT_ASSETS.mh2.map,
    logos: PROJECT_ASSETS.mh2.logos,
  },
  
  sections: {
    hero: {
      enabled: true,
      title: 'Project MH2',
      subtitle: 'Your Project Subtitle',
      animationType: 'unlock', // or 'fade'
    },
    
    map: {
      enabled: true,
      title: 'Project Location',
      component: 'YourMapComponent',
      animateOnEntry: true,
    },
    
    carousel: {
      enabled: true,
      title: 'Project Gallery',
      items: 3,
    },
  },
  
  metadata: {
    collaborators: 'Company Name',
    type: 'Project Type',
    description: 'Detailed project description...',
    disclaimer: '*Optional disclaimer',
    duration: '2024-2025',
    status: 'Ongoing',
    tags: ['React', 'Three.js', 'WebGL'],
  },
};

// Add to registry
export const ALL_PROJECTS = {
  mh1: PROJECT_MH1,
  mh2: PROJECT_MH2, // Add your new project here
};
```

### Step 4: Create Project Page Component

Create `src/pages/projects/ProjectMH2.jsx`:

```javascript
import React, { Suspense, lazy } from 'react';
import ProjectLayout from '../../components/project/ProjectLayout';
import { 
  ProjectBackground, 
  HeroContent, 
  ScrollPrompt,
  MapSection 
} from '../../components/common';
import Carousel from '../../sections/Carousel';
import { 
  useProjectAnimation, 
  useProjectNavigation, 
  useNavbarControl 
} from '../../hooks';
import { getProjectById } from '../../constants/projectsData';

// Lazy load your custom map component
const YourMapComponent = lazy(() => import('../../sections/YourMapComponent'));

const ProjectMH2 = () => {
  const projectData = getProjectById('mh2');
  const totalSections = 3; // Adjust based on your sections

  const { 
    currentSection, 
    setCurrentSection,
    startMapAnimation,
  } = useProjectNavigation(totalSections, null, handleGoBack);

  const {
    animationPhase,
    titleOpacity,
    unlockProgress,
    gradientOpacity,
    backgroundFade,
    dragProgress,
  } = useProjectAnimation(currentSection);

  useNavbarControl(currentSection, animationPhase);

  function handleGoBack(section, setSectionCallback) {
    // Handle back navigation logic
    setSectionCallback(prev => prev - 1);
  }

  return (
    <ProjectLayout
      currentSection={currentSection}
      totalSections={totalSections}
      animationPhase={animationPhase}
      unlockProgress={unlockProgress}
      dragProgress={dragProgress}
      onSectionChange={setCurrentSection}
    >
      {/* Section 0: Hero */}
      {currentSection === 0 && (
        <section className="project-section mh1-hero-section">
          <ProjectBackground
            imagePath={projectData.assets.hero}
            backgroundFade={backgroundFade}
            gradientOpacity={gradientOpacity}
          />
          <HeroContent
            title={projectData.sections.hero.title}
            subtitle={projectData.sections.hero.subtitle}
            titleOpacity={titleOpacity}
          />
          <ScrollPrompt
            dragProgress={dragProgress}
            visible={animationPhase === 'waiting'}
          />
        </section>
      )}

      {/* Section 1: Map (optional) */}
      {currentSection === 1 && projectData.sections.map.enabled && (
        <MapSection
          logos={projectData.assets.logos}
          MapComponent={<YourMapComponent startAnimation={startMapAnimation} />}
          description={{
            title: 'Project Details',
            metrics: [
              { label: 'Collaborators', value: projectData.metadata.collaborators },
              { label: 'Type', value: projectData.metadata.type },
            ],
          }}
        />
      )}

      {/* Section 2: Carousel */}
      {currentSection === 2 && (
        <section className="project-section carousel-wrapper-wrapper">
          <Carousel />
        </section>
      )}
    </ProjectLayout>
  );
};

export default ProjectMH2;
```

### Step 5: Add Route in `src/App.jsx`

```javascript
import ProjectMH2 from './sections/projects/ProjectMH2.jsx';

// In your Routes
<Route path="/projects/MH2" element={<ProjectMH2 />} />
```

---

## Asset Management

### Using the Asset System

```javascript
import { COMMON_ASSETS, MODELS, TEXTURES, getProjectAssets } from '../assets';

// Use common assets
<img src={COMMON_ASSETS.icons.github} alt="GitHub" />

// Use 3D models
<Model url={MODELS.cube} />

// Get project-specific assets
const projectAssets = getProjectAssets('mh1');
<img src={projectAssets.hero} alt="Hero" />
```

### Adding Custom Assets

For one-off assets not fitting the structure:

```javascript
import { assetPath } from '../assets';

const customImage = assetPath('assets/special/custom.jpg');
```

---

## Customizing Components

### Using Common Components

All common components are exported from `src/components/common/index.jsx`:

```javascript
import { 
  NavigationDots,
  UnlockOverlay,
  ProjectBackground,
  HeroContent,
  ScrollPrompt,
  MapSection 
} from '../../components/common';

// Use with custom props
<HeroContent 
  title="Custom Title"
  subtitle="Custom Subtitle"
  titleOpacity={0.8}
/>
```

### Creating Custom Section Components

```javascript
// src/components/project/CustomSection.jsx
const CustomSection = ({ data, visible }) => {
  if (!visible) return null;

  return (
    <section className="custom-section">
      <h2>{data.title}</h2>
      <p>{data.description}</p>
    </section>
  );
};

export default CustomSection;
```

---

## Best Practices

### 1. Asset Naming Convention
- Use descriptive names: `hero_background.jpg`, not `img1.jpg`
- Keep project assets in their own folders
- Use lowercase with underscores or hyphens

### 2. Component Organization
- Keep components small and focused
- Extract reusable logic into hooks
- Use lazy loading for heavy components

### 3. CSS Best Practices
- Use CSS variables from `variables.css`
- Follow the existing class naming pattern (`mh1-*`)
- Keep styles scoped to components

### 4. Performance
- Lazy load images and heavy components
- Use `React.memo()` for frequently re-rendered components
- Optimize images before adding (use WebP format)

### 5. Accessibility
- Always include `alt` text for images
- Use semantic HTML
- Ensure keyboard navigation works
- Test with screen readers

---

## Quick Reference

### Import Statements You'll Need

```javascript
// Assets
import { COMMON_ASSETS, getProjectAssets } from '../assets';

// Components
import { 
  NavigationDots,
  ProjectBackground,
  HeroContent 
} from '../components/common';

// Hooks
import { 
  useProjectAnimation, 
  useProjectNavigation 
} from '../hooks';

// Data
import { getProjectById } from '../constants/projectsData';
```

### Common Tasks

**Add a new carousel image:**
1. Add image to `public/assets/projects/[id]/`
2. Add path to `PROJECT_ASSETS` in `assets/index.js`
3. Add to carousel array in project config

**Change animation timing:**
- Edit values in `src/hooks/index.js`
- Look for `setTimeout` and interval values

**Add a new section type:**
1. Create component in `src/components/project/`
2. Add section config in project data
3. Use in project page component

---

## Need Help?

### Common Issues

**Assets not loading:**
- Check `BASE_URL` in `vite.config.js`
- Verify asset paths in browser DevTools

**Animations not working:**
- Check `animationPhase` state
- Verify event listeners are attaching

**Styles not applying:**
- Import CSS files in correct order
- Check for CSS specificity issues

### Debugging

Add this to any component to see state:

```javascript
console.log({ currentSection, animationPhase, dragProgress });
```

---

## Summary

With this refactored structure, adding a new project requires:

1. ✅ Add assets to `public/assets/projects/[id]/`
2. ✅ Register in `src/assets/index.js` (~10 lines)
3. ✅ Create config in `src/constants/projectsData.js` (~50 lines)
4. ✅ Create page component using template (~100 lines)
5. ✅ Add route in `App.jsx` (~1 line)

**Total time: ~15-30 minutes per project** (compared to hours before)

The modular structure ensures consistency while maintaining flexibility for unique project requirements.