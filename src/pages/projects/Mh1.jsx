// src/pages/projects/Mh1.jsx
// ============================================
// MH1 PROJECT - ALL YOUR EDITS GO HERE
// ============================================
// ✏️ EDIT THIS FILE to customize your project
// Change titles, images, sections, etc.
// The ProjectTemplate.jsx handles all the logic
// ============================================

import React, { lazy } from 'react';
import ProjectTemplate from '../../components/project/ProjectTemplate.jsx';
import { getProjectById } from '../../constants/projectsData.js';
import Carousel from '../../sections/Carousel.jsx';
import { MapSection } from '../../sections/MapSection.jsx';

// Lazy load heavy components for better performance
const MyMap = lazy(() => import('../../sections/MyMap.jsx'));

// ============================================
// 📝 STEP 1: SET PROJECT ID
// ============================================
// Change this to match your project in projectsData.js
const PROJECT_ID = 'mh1';

// ============================================
// 📝 STEP 2: CONFIGURE YOUR SECTIONS
// ============================================
// Add, remove, or reorder sections as needed
// Each section is an object with a 'type' and configuration

const Mh1 = () => {
  // ========================================
  // LOAD PROJECT DATA
  // ========================================
  const projectData = getProjectById(PROJECT_ID);

  // Handle missing project data
  if (!projectData) {
    console.error(`❌ Project not found: ${PROJECT_ID}`);
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        color: 'white',
        fontSize: '1.5rem',
      }}>
        ❌ Project "{PROJECT_ID}" not found
      </div>
    );
  }

  // ========================================
  // CONFIGURE MAP DESCRIPTION (Optional)
  // ========================================
  // Edit this if you have a map section
  const mapDescription = {
    title: 'Data Metrics',
    metrics: [
      { 
        label: 'Collaborators',
        value: projectData.metadata.collaborators 
      },
      { 
        label: 'Type',
        value: projectData.metadata.type 
      },
      { 
        label: 'Description',
        value: projectData.metadata.description 
      },
    ],
    disclaimer: projectData.metadata.disclaimer,
  };

  // ========================================
  // CONFIGURE SECTIONS
  // ========================================
  // This array defines your project structure
  // Section order matters: [0] = first, [1] = second, etc.

  const sections = [
    
    // ----------------------------------------
    // SECTION 0: HERO (Required - Must be first)
    // ----------------------------------------
    // Animated landing section with drag-to-unlock
    // 
    // EDIT THESE:
    // - title: Main heading text
    // - subtitle: Secondary text below title
    // - backgroundImage: Path to background image
    {
      type: 'hero',
      title: projectData.sections.hero.title,           // e.g., "Amazing Project"
      subtitle: projectData.sections.hero.subtitle,     // e.g., "Building the future"
      backgroundImage: projectData.assets.hero,         // e.g., "/images/hero.jpg"
    },

    // ----------------------------------------
    // SECTION 1: MAP (Optional)
    // ----------------------------------------
    // Interactive map with logos and metrics
    // 
    // EDIT THESE:
    // - component: Your map component
    // - logos: Array of logo image paths
    // - description: Uses mapDescription defined above
    {
    type: 'map',
    component: (
      <MapSection
        // Pass the actual MyMap component here
        MapComponent={<MyMap mapImages={projectData.assets.map} />}
        
        // Logos should be an array of objects with src, alt, title
        logos={projectData.assets.logos || []}
        
        // Description from your configuration
        description={mapDescription}
        
        // Optional: control visibility
        visible={true}
      />
    ),
  },

    // ----------------------------------------
    // SECTION 2: CAROUSEL (Optional)
    // ----------------------------------------
    // 3D image gallery with navigation
    // 
    // EDIT THESE:
    // - carouselData: Array of images with titles/descriptions
    // - title: Carousel section title
    // - autoPlay: true/false
    // - showControls: true/false (arrow buttons)
    // - showIndicators: true/false (dots)
    // - className: Custom CSS class
    {
      type: 'carousel',
      component: (
        <Carousel 
          carouselData={projectData.assets.carousel}    // Image data array
          title="Project Gallery"                       // Section title
          autoPlay={false}                              // Auto-advance slides?
          showControls={true}                           // Show arrow buttons?
          showIndicators={true}                         // Show dots?
          className="mh1-carousel"                      // Custom CSS class
          projectID={PROJECT_ID}
        />
      ),
    },

    // ----------------------------------------
    // ADD MORE SECTIONS HERE
    // ----------------------------------------
    // Copy one of the sections above or create a custom one
    
    // EXAMPLE: Custom section
    // {
    //   type: 'custom',
    //   className: 'my-custom-section',
    //   component: (
    //     <div>
    //       <h2>My Custom Content</h2>
    //       <p>Add any React component here!</p>
    //     </div>
    //   ),
    // },

    // EXAMPLE: Another carousel
    // {
    //   type: 'carousel',
    //   component: (
    //     <Carousel 
    //       carouselData={[
    //         { id: 1, image: '/img1.jpg', title: 'Image 1', description: 'Desc 1' },
    //         { id: 2, image: '/img2.jpg', title: 'Image 2', description: 'Desc 2' },
    //       ]}
    //       title="Behind the Scenes"
    //       autoPlay={true}
    //     />
    //   ),
    // },
  ];

  // ========================================
  // BUILD CONFIGURATION OBJECT
  // ========================================
  // This is what gets passed to ProjectTemplate
  const config = {
    // Project data from projectsData.js
    projectData,
    
    // Total sections (auto-calculated)
    totalSections: sections.length,
    
    // Sections array defined above
    sections,
      
    // Map description (used by map section)
    mapDescription,
    
    // Show/hide navbar (true = show, false = hide)
    enableNavbar: true,
    
    // Callback when section changes (optional)
    onSectionChange: (sectionIndex) => {
      console.log(`📍 MH1: Moved to section ${sectionIndex}`);
      
      // Add analytics tracking here if needed:
      // analytics.track('Project Section Viewed', {
      //   project: PROJECT_ID,
      //   section: sectionIndex
      // });
    },
  };

  // ========================================
  // RENDER
  // ========================================
  // Pass configuration to ProjectTemplate
  // The template handles all animations and logic
  return <ProjectTemplate {...config} />;
};

export default Mh1;

/*
 * ============================================
 * CUSTOMIZATION GUIDE
 * ============================================
 * 
 * QUICK CHECKLIST:
 * ----------------
 * [ ] Change PROJECT_ID at top
 * [ ] Edit hero title and subtitle
 * [ ] Update hero background image
 * [ ] Add/remove/reorder sections
 * [ ] Configure each section's props
 * [ ] Set enableNavbar (true/false)
 * 
 * SECTION TYPES:
 * --------------
 * 
 * 1. HERO (Required, must be first)
 *    {
 *      type: 'hero',
 *      title: 'Title',
 *      subtitle: 'Subtitle',
 *      backgroundImage: '/path.jpg'
 *    }
 * 
 * 2. MAP (Optional)
 *    {
 *      type: 'map',
 *      component: <MyMap />,
 *      logos: ['/logo1.png', '/logo2.png'],
 *      description: { title: '...', metrics: [...] }
 *    }
 * 
 * 3. CAROUSEL (Optional)
 *    {
 *      type: 'carousel',
 *      component: <Carousel carouselData={[...]} />
 *    }
 * 
 * 4. CUSTOM (Optional)
 *    {
 *      type: 'custom',
 *      className: 'my-class',
 *      component: <YourComponent />
 *    }
 * 
 * TO CREATE A NEW PROJECT:
 * ------------------------
 * 1. Copy this file (e.g., Mh2.jsx)
 * 2. Change PROJECT_ID = 'mh2'
 * 3. Customize sections array
 * 4. Done! ProjectTemplate handles the rest
 * 
 * TIPS:
 * -----
 * - Hero section is always first (index 0)
 * - Add unlimited sections of any type
 * - totalSections is auto-calculated
 * - enableNavbar controls navbar visibility
 * - onSectionChange is optional for tracking
 * 
 * ============================================
 */