// src/constants/showcaseProjects.js
//
// Two placeholder projects that show how project pages are put together (docs/ProjectPages.md).
// Replace the text and the files in public/assets/projects/<id>/ with real content.
//
// Paths are relative to public/ ("assets/projects/atlas/hero.svg"); components resolve them with
// assetPath(), so they keep working when the site is hosted in a sub-folder.
// This file must stay free of React so Next can read it at build time (getStaticPaths).

const A = (file) => `assets/projects/atlas/${file}`;
const L = (file) => `assets/projects/lumen/${file}`;

// A video offered as MP4 (Safari, most phones) and WebM (everything else).
const video = (base, poster, alt) => ({
  type: 'video',
  poster,
  alt,
  sources: [
    { src: `${base}.webm`, type: 'video/webm' },
    { src: `${base}.mp4`, type: 'video/mp4' },
  ],
});

// ─────────────────────────────────────────────────────────────────────────────────────────────
// 1) ATLAS — DATA-DRIVEN. The whole page is the `sections` array below: reorder, repeat, delete
//    or add entries and the page changes. No component code.
// ─────────────────────────────────────────────────────────────────────────────────────────────
export const PROJECT_ATLAS = {
  id: 'atlas',
  title: 'Atlas',
  tag: 'Data-driven page',
  summary: 'An interactive atlas of a city’s changing shoreline. Built entirely from the sections array: hero, split, gallery, timeline, video, carousel and stats.',
  cover: A('cover.svg'),
  metadata: { collaborators: 'Placeholder Studio', type: 'Interactive atlas', duration: '2025', status: 'Concept' },

  sections: [
    // Template that already existed (camera-viewfinder hero → polaroid)
    { type: 'hero', title: 'Atlas', subtitle: 'Mapping a changing shoreline', image: A('hero.svg') },

    // Layout: text left, image right
    {
      type: 'split',
      id: 'brief',
      side: 'left',
      eyebrow: 'The brief',
      title: 'A coastline that will not stay put',
      body: [
        'Placeholder copy. Atlas turns decades of survey data into a single scrolling map, so planners can see how the shoreline moved and where it is likely to move next.',
        'Swap this text, the image and the facts below. Everything on this page comes from the project data file.',
      ],
      facts: [
        { label: 'Client', value: 'City Council' },
        { label: 'Role', value: 'Design lead' },
        { label: 'Year', value: '2025' },
      ],
      media: { type: 'image', src: A('brief.svg'), alt: 'Placeholder: the brief', caption: 'Placeholder image: replace with a site photo' },
    },

    // Layout: 3-column image grid
    {
      type: 'gallery',
      id: 'surveys',
      layout: 'grid',
      columns: 3,
      eyebrow: 'Field surveys',
      title: 'Six surveys, one timeline',
      items: [
        { src: A('gallery-1.svg'), alt: 'Placeholder survey 1', caption: '1990 · aerial' },
        { src: A('gallery-2.svg'), alt: 'Placeholder survey 2', caption: '1998 · tide gauge' },
        { src: A('gallery-3.svg'), alt: 'Placeholder survey 3', caption: '2006 · lidar' },
        { src: A('gallery-4.svg'), alt: 'Placeholder survey 4', caption: '2012 · drone' },
        { src: A('gallery-5.svg'), alt: 'Placeholder survey 5', caption: '2018 · satellite' },
        { src: A('gallery-6.svg'), alt: 'Placeholder survey 6', caption: '2024 · ground truth' },
      ],
    },

    // Layout: scroll-driven (a LONG section): scroll moves through the steps
    {
      type: 'timeline',
      id: 'process',
      eyebrow: 'Process',
      title: 'From raw data to a readable map',
      steps: [
        { title: 'Collect', text: 'Placeholder: gather thirty years of survey tiles from four agencies.', media: { type: 'image', src: A('step-1.svg'), alt: 'Collect' } },
        { title: 'Align', text: 'Placeholder: register every survey to one coordinate system.', media: { type: 'image', src: A('step-2.svg'), alt: 'Align' } },
        { title: 'Model', text: 'Placeholder: fit erosion curves and project them forward.', media: { type: 'image', src: A('step-3.svg'), alt: 'Model' } },
        { title: 'Publish', text: 'Placeholder: ship it as a public, scrollable atlas.', media: { type: 'image', src: A('step-4.svg'), alt: 'Publish' } },
      ],
    },

    // Layout: full-bleed video
    {
      type: 'media',
      id: 'reel',
      align: 'left',
      eyebrow: 'In motion',
      title: 'Thirty years in four seconds',
      caption: 'Placeholder video (a looping colour field). Drop real clips at public/assets/projects/atlas/reel.webm and reel.mp4.',
      media: video(A('reel'), A('reel-poster.svg'), 'Placeholder video'),
    },

    // Layout: text right, video left, mirrored from the first split
    {
      type: 'split',
      id: 'field',
      side: 'right',
      eyebrow: 'On site',
      title: 'Walking the line',
      body: 'Placeholder copy. The same split layout, mirrored, with a video instead of an image. Video plays only while its section is on screen.',
      media: video(A('reel'), A('field.svg'), 'Placeholder video'),
    },

    // Template that already existed (3D carousel)
    {
      type: 'carousel',
      id: 'renders',
      title: 'Renders',
      images: [
        { id: 1, image: A('carousel-1.svg'), title: 'Harbour edge', description: 'Placeholder render one.', information: 'Placeholder details.' },
        { id: 2, image: A('carousel-2.svg'), title: 'Tidal flats', description: 'Placeholder render two.', information: 'Placeholder details.' },
        { id: 3, image: A('carousel-3.svg'), title: 'Dune line', description: 'Placeholder render three.', information: 'Placeholder details.' },
        { id: 4, image: A('carousel-4.svg'), title: 'Seawall', description: 'Placeholder render four.', information: 'Placeholder details.' },
      ],
    },

    // Layout: statement + numbers
    {
      type: 'stats',
      id: 'numbers',
      eyebrow: 'Impact',
      statement: 'A map that planners actually open every morning.',
      stats: [
        { value: '30', label: 'Years of surveys' },
        { value: '4', label: 'Agencies, one view' },
        { value: '12k', label: 'Monthly visitors' },
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────────────────────
// 2) LUMEN — BESPOKE. `page: 'lumen'` hands the layout to src/projects/pages/Lumen.jsx, which
//    mixes ready-made sections with sections written just for this project. The data here is
//    what the page and the /projects index read (title, summary, cover, shared copy).
// ─────────────────────────────────────────────────────────────────────────────────────────────
export const PROJECT_LUMEN = {
  id: 'lumen',
  title: 'Lumen',
  tag: 'Bespoke page',
  summary: 'A light installation in three movements. A hand-written page that mixes template sections with sections made only for this project.',
  cover: L('cover.svg'),
  page: 'lumen',
  metadata: { collaborators: 'Placeholder Studio', type: 'Installation', duration: '2024', status: 'Built' },
  assets: {
    hero: L('hero.svg'),
    gallery: [1, 2, 3, 4, 5, 6].map((n) => L(`gallery-${n}.svg`)),
    sketches: [1, 2, 3].map((n) => L(`sketch-${n}.svg`)),
    reel: L('reel'), // base name: reel.webm + reel.mp4
    reelPoster: L('reel-poster.svg'),
  },
  copy: {
    overture: ['Warm', 'Pulse', 'Fade'],
    study: [
      { title: 'Ember', text: 'Placeholder: a low, warm glow, like a hearth seen through frosted glass.' },
      { title: 'Daylight', text: 'Placeholder: the colour opens up and cools as the afternoon arrives.' },
      { title: 'Blaze', text: 'Placeholder: full intensity. The room becomes the lamp.' },
    ],
  },
  // Not used by the bespoke page (it builds its own sections) but kept so tools that expect the
  // array form (the index, titles, deep links) see a valid project.
  sections: [],
};
