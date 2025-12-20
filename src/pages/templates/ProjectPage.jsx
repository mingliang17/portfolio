// src/pages/projects/ProjectPage.jsx
import React, { lazy, Suspense } from 'react';
import ProjectTemplate from './ProjectTemplate.jsx';
import { getProjectById } from '../../constants/projectsData.js';
import { getProjectLogos } from '../../assets/index.js';
import { useParams } from 'react-router-dom';
import Carousel from '../../sections/projects/Carousel.jsx';
import { MapSection } from '../../sections/MapSection.jsx';
import { ComponentLoading } from '../../components/common/LayoutComponents.jsx';

// Lazy load MyMap component for performance
const MyMap = lazy(() => import('../../components/project/MapComponent.jsx'));

const ProjectPage = () => {
  const { project_id } = useParams();
  const projectData = getProjectById(project_id);

  if (!projectData) {
    return <div style={{ color: 'white' }}>It's cooking as we speak :0</div>;
  }

  // Map description
  const mapDescription = {
    title: 'Data Metrics',
    metrics: [
      { label: 'Collaborators', value: projectData.metadata.collaborators },
      { label: 'Type', value: projectData.metadata.type },
      { label: 'Description', value: projectData.metadata.description },
    ],
    disclaimer: projectData.metadata.disclaimer || '',
  };

  // Sections configuration
  const sections = [
    // HERO
    projectData.sections.hero?.enabled && {
      type: 'hero',
      title: projectData.sections.hero.title,
      subtitle: projectData.sections.hero.subtitle,
      backgroundImage: projectData.assets.hero,
    },

    // MAP
    projectData.sections.map?.enabled && {
      type: 'map',
      component: (
        <MapSection
          MapComponent={
            <Suspense fallback={<ComponentLoading />}>
              <MyMap startAnimation={true} mapImages={projectData.assets.map} />
            </Suspense>
          }
          logos={getProjectLogos(project_id)}
          description={mapDescription}
          visible={true}
        />
      ),
    },

    // CAROUSEL(S) - Handle both single carousel and multiple carousels
    ...(projectData.sections.carousels || []).map((carouselSection, index) => {
      if (!carouselSection.enabled) return null;

      // Get the images array from the carousel section configuration
      const images = carouselSection.images || [];

      return {
        type: 'carousel',
        component: (
          <Carousel
            key={carouselSection.id || index}
            carouselData={images}
            title={carouselSection.title || `Gallery ${index + 1}`}
            autoPlay={false}
            showControls={true}
            showIndicators={true}
          />
        ),
      };
    }),
  ].filter(Boolean); // remove falsy entries

  return (
    <ProjectTemplate
      projectData={projectData}
      sections={sections}
      totalSections={sections.length}
      enableNavbar={true}
      onSectionChange={(sectionIndex) =>
        console.log(`📍 ${project_id}: Moved to section ${sectionIndex}`)
      }
    />
  );
};

export default ProjectPage;