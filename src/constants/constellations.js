// src/constants/constellations.js
//
// The constellations that drift around the home-page globe, and some PLACEHOLDER work attached to a few of
// them for testing. A constellation behaves like a country: hover for a tooltip, and, if it has projects or
// snaps, click it to open the polaroid menu. Without any, it can only be hovered.
//
// Star coordinates are in a local square, x right, y up, roughly -1…1 (loosely traced from the real shapes).
// `mag` is brightness (bigger = brighter). `lines` are pairs of star indices.
//
// To give a constellation work, add items below whose `country` is the constellation's `name`
// (the same field the real projects and photos use for their country).
import { assetPath } from '../utils/assetPath.js';

export const CONSTELLATIONS = [
  {
    id: 'orion', name: 'Orion',
    stars: [[-0.5, 0.8, 1.0], [0.45, 0.72, 0.8], [-0.18, 0.02, 0.8], [0.02, 0.08, 0.9], [0.22, 0.14, 0.7], [-0.38, -0.78, 0.7], [0.5, -0.72, 1.0], [-0.02, 0.62, 0.5]],
    lines: [[0, 7], [7, 1], [0, 2], [1, 4], [2, 3], [3, 4], [2, 5], [4, 6]],
  },
  {
    id: 'ursa-major', name: 'Ursa Major',
    stars: [[0.55, 0.35, 0.8], [0.45, -0.05, 0.7], [0.05, -0.12, 0.7], [0.0, 0.22, 0.6], [-0.35, 0.28, 0.8], [-0.65, 0.2, 0.7], [-0.95, 0.0, 0.8]],
    lines: [[0, 1], [1, 2], [2, 3], [3, 0], [3, 4], [4, 5], [5, 6]],
  },
  {
    id: 'cassiopeia', name: 'Cassiopeia',
    stars: [[-0.9, 0.1, 0.8], [-0.45, -0.35, 0.7], [0.0, 0.1, 0.9], [0.45, -0.3, 0.7], [0.9, 0.25, 0.8]],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4]],
  },
  {
    id: 'cygnus', name: 'Cygnus',
    stars: [[0.0, 0.9, 1.0], [0.0, 0.1, 0.8], [0.0, -0.85, 0.8], [-0.7, 0.25, 0.6], [0.7, 0.3, 0.6]],
    lines: [[0, 1], [1, 2], [3, 1], [1, 4]],
  },
  {
    id: 'scorpius', name: 'Scorpius',
    stars: [[-0.55, 0.8, 0.6], [-0.45, 0.6, 0.6], [-0.2, 0.5, 1.0], [0.0, 0.2, 0.7], [0.2, -0.05, 0.6], [0.35, -0.35, 0.6], [0.3, -0.65, 0.7], [0.05, -0.85, 0.7], [-0.2, -0.8, 0.8]],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8]],
  },
  {
    id: 'lyra', name: 'Lyra',
    stars: [[0.0, 0.75, 1.0], [-0.3, 0.1, 0.6], [0.2, 0.15, 0.6], [0.3, -0.4, 0.6], [-0.2, -0.45, 0.6]],
    lines: [[0, 1], [0, 2], [1, 2], [2, 3], [3, 4], [4, 1]],
  },
  {
    id: 'crux', name: 'Crux',
    stars: [[0.0, 0.9, 0.9], [0.0, -0.9, 1.0], [-0.55, 0.1, 0.8], [0.55, -0.1, 0.7], [0.3, -0.45, 0.4]],
    lines: [[0, 1], [2, 3]],
  },
  {
    id: 'gemini', name: 'Gemini',
    stars: [[-0.4, 0.85, 0.9], [0.0, 0.8, 1.0], [-0.45, 0.3, 0.6], [-0.5, -0.3, 0.6], [-0.5, -0.85, 0.7], [0.1, 0.25, 0.6], [0.15, -0.35, 0.6], [0.35, -0.75, 0.7]],
    lines: [[0, 2], [2, 3], [3, 4], [1, 5], [5, 6], [6, 7], [2, 5]],
  },
];

// ─── Placeholder work (for testing the menu; replace with real items) ───────────────────────────────
const IMG = (file) => assetPath(`assets/constellations/${file}`);
const PIN = ['#FF6B6B', '#4ECDC4', '#FFE66D'];

// Projects open the two showcase project pages.
export const CONSTELLATION_PROJECTS = [
  { id: 'proj-orion-1', title: 'Betelgeuse Observatory', country: 'Orion', heroImage: IMG('orion-p1.svg'), link: '/projects/atlas', pinColor: PIN[0] },
  { id: 'proj-orion-2', title: 'Rigel Pavilion', country: 'Orion', heroImage: IMG('orion-p2.svg'), link: '/projects/lumen', pinColor: PIN[1] },
  { id: 'proj-ursa-major-1', title: 'Dipper Night Market', country: 'Ursa Major', heroImage: IMG('ursa-major-p1.svg'), link: '/projects/lumen', pinColor: PIN[2] },
  { id: 'proj-cygnus-1', title: 'Northern Cross Hall', country: 'Cygnus', heroImage: IMG('cygnus-p1.svg'), link: '/projects/atlas', pinColor: PIN[0] },
];

export const CONSTELLATION_FOTOS = [
  { id: 'foto-orion-1', title: 'The Belt at Midnight', country: 'Orion', heroImage: IMG('orion-f1.svg'), date: 'Jan 2024', caption: 'Three stars in a row', pinColor: PIN[0] },
  { id: 'foto-orion-2', title: 'Orion Nebula', country: 'Orion', heroImage: IMG('orion-f2.svg'), date: 'Feb 2024', caption: 'A stellar nursery' },
  { id: 'foto-orion-3', title: 'Winter Hunter', country: 'Orion', heroImage: IMG('orion-f3.svg'), date: 'Dec 2023', caption: 'Rising over the ridge' },
  { id: 'foto-ursa-major-1', title: 'Big Dipper Over the Lake', country: 'Ursa Major', heroImage: IMG('ursa-major-f1.svg'), date: 'Jul 2023', caption: 'Pouring into the water' },
  { id: 'foto-ursa-major-2', title: 'Pointer Stars', country: 'Ursa Major', heroImage: IMG('ursa-major-f2.svg'), date: 'Aug 2023', caption: 'Following them to the pole' },
  { id: 'foto-cassiopeia-1', title: 'The Queen’s Chair', country: 'Cassiopeia', heroImage: IMG('cassiopeia-f1.svg'), date: 'Oct 2023', caption: 'A W in the northern sky' },
  { id: 'foto-cassiopeia-2', title: 'Milky Way Crossing', country: 'Cassiopeia', heroImage: IMG('cassiopeia-f2.svg'), date: 'Nov 2023', caption: 'Through the galactic plane' },
].map((f) => ({ ...f, link: `/fotos/${f.id}` }));
