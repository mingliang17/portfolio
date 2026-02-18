// src/constants/index.js

// ─── Placeholder images (using picsum with stable seeds) ─────────────────────
const proj = (seed) => `https://picsum.photos/seed/prj${seed}/800/600`;
const foto = (seed) => `https://picsum.photos/seed/fot${seed}/600/800`;

// ─── 20 Placeholder Projects ─────────────────────────────────────────────────
const ALL_PROJECTS = [
  { id: 'proj-au-1', title: 'Sydney Cultural Hub',        country: 'Australia',      heroImage: proj(1),  link: '/projects/proj-au-1' },
  { id: 'proj-au-2', title: 'Melbourne Civic Tower',      country: 'Australia',      heroImage: proj(2),  link: '/projects/proj-au-2' },
  { id: 'proj-au-3', title: 'Brisbane River Precinct',    country: 'Australia',      heroImage: proj(3),  link: '/projects/proj-au-3' },
  { id: 'proj-cn-1', title: 'Shanghai Finance Centre',    country: 'China',          heroImage: proj(4),  link: '/projects/proj-cn-1' },
  { id: 'proj-cn-2', title: 'Beijing Olympic Village',    country: 'China',          heroImage: proj(5),  link: '/projects/proj-cn-2' },
  { id: 'proj-cn-3', title: 'Shenzhen Tech Campus',       country: 'China',          heroImage: proj(6),  link: '/projects/proj-cn-3' },
  { id: 'proj-us-1', title: 'New York Skybridge',         country: 'United States',  heroImage: proj(7),  link: '/projects/proj-us-1' },
  { id: 'proj-us-2', title: 'LA Performing Arts Centre',  country: 'United States',  heroImage: proj(8),  link: '/projects/proj-us-2' },
  { id: 'proj-us-3', title: 'Chicago Waterfront',         country: 'United States',  heroImage: proj(9),  link: '/projects/proj-us-3' },
  { id: 'proj-gb-1', title: 'London Bridge Quarter',      country: 'United Kingdom', heroImage: proj(10), link: '/projects/proj-gb-1' },
  { id: 'proj-gb-2', title: 'Manchester Arena Extension', country: 'United Kingdom', heroImage: proj(11), link: '/projects/proj-gb-2' },
  { id: 'proj-jp-1', title: 'Tokyo Mixed-Use Tower',      country: 'Japan',          heroImage: proj(12), link: '/projects/proj-jp-1' },
  { id: 'proj-jp-2', title: 'Osaka Cultural Park',        country: 'Japan',          heroImage: proj(13), link: '/projects/proj-jp-2' },
  { id: 'proj-br-1', title: 'São Paulo Vertical Garden',  country: 'Brazil',         heroImage: proj(14), link: '/projects/proj-br-1' },
  { id: 'proj-br-2', title: 'Rio Coastal Promenade',      country: 'Brazil',         heroImage: proj(15), link: '/projects/proj-br-2' },
  { id: 'proj-de-1', title: 'Berlin Media Quarter',       country: 'Germany',        heroImage: proj(16), link: '/projects/proj-de-1' },
  { id: 'proj-de-2', title: 'Munich Transport Hub',       country: 'Germany',        heroImage: proj(17), link: '/projects/proj-de-2' },
  { id: 'proj-za-1', title: 'Cape Town Harbour',          country: 'South Africa',   heroImage: proj(18), link: '/projects/proj-za-1' },
  { id: 'proj-za-2', title: 'Johannesburg Skyline',       country: 'South Africa',   heroImage: proj(19), link: '/projects/proj-za-2' },
  { id: 'proj-za-3', title: 'Durban Waterfront',          country: 'South Africa',   heroImage: proj(20), link: '/projects/proj-za-3' },
];

// ─── 20 Placeholder Fotos ────────────────────────────────────────────────────
const ALL_FOTOS = [
  { id: 'foto-au-1', title: 'Sydney Opera House',   country: 'Australia',      heroImage: foto(1),  link: '/fotos/foto-au-1', date: 'Mar 2023', caption: 'Golden hour at the harbour' },
  { id: 'foto-au-2', title: 'Great Barrier Reef',   country: 'Australia',      heroImage: foto(2),  link: '/fotos/foto-au-2', date: 'Jun 2023', caption: 'Underwater wonder' },
  { id: 'foto-cn-1', title: 'Shanghai Bund',         country: 'China',          heroImage: foto(3),  link: '/fotos/foto-cn-1', date: 'Aug 2023', caption: 'Skyline at night' },
  { id: 'foto-cn-2', title: 'Great Wall',            country: 'China',          heroImage: foto(4),  link: '/fotos/foto-cn-2', date: 'Oct 2022', caption: 'Autumn at Mutianyu' },
  { id: 'foto-cn-3', title: 'Li River Karst',        country: 'China',          heroImage: foto(5),  link: '/fotos/foto-cn-3', date: 'Apr 2023', caption: 'Mist over the peaks' },
  { id: 'foto-us-1', title: 'Manhattan Skyline',     country: 'United States',  heroImage: foto(6),  link: '/fotos/foto-us-1', date: 'Dec 2022', caption: 'Christmas in New York' },
  { id: 'foto-us-2', title: 'Grand Canyon Rim',      country: 'United States',  heroImage: foto(7),  link: '/fotos/foto-us-2', date: 'Jul 2023', caption: 'Sunrise over the abyss' },
  { id: 'foto-us-3', title: 'Yosemite Valley',       country: 'United States',  heroImage: foto(8),  link: '/fotos/foto-us-3', date: 'May 2023', caption: 'Valley floor at dawn' },
  { id: 'foto-gb-1', title: 'London at Dusk',        country: 'United Kingdom', heroImage: foto(9),  link: '/fotos/foto-gb-1', date: 'May 2023', caption: 'Thames at twilight' },
  { id: 'foto-gb-2', title: 'Scottish Highlands',    country: 'United Kingdom', heroImage: foto(10), link: '/fotos/foto-gb-2', date: 'Sep 2022', caption: 'Misty glens' },
  { id: 'foto-jp-1', title: 'Mount Fuji Winter',     country: 'Japan',          heroImage: foto(11), link: '/fotos/foto-jp-1', date: 'Nov 2022', caption: 'First snow of winter' },
  { id: 'foto-jp-2', title: 'Kyoto Cherry Blossoms', country: 'Japan',          heroImage: foto(12), link: '/fotos/foto-jp-2', date: 'Apr 2023', caption: 'Sakura season' },
  { id: 'foto-jp-3', title: 'Shibuya Crossing',      country: 'Japan',          heroImage: foto(13), link: '/fotos/foto-jp-3', date: 'Feb 2023', caption: 'Urban choreography' },
  { id: 'foto-br-1', title: 'Amazon Canopy',         country: 'Brazil',         heroImage: foto(14), link: '/fotos/foto-br-1', date: 'Jan 2023', caption: 'Above the jungle' },
  { id: 'foto-br-2', title: 'Iguazu Falls',          country: 'Brazil',         heroImage: foto(15), link: '/fotos/foto-br-2', date: 'Mar 2023', caption: 'Power of water' },
  { id: 'foto-de-1', title: 'Neuschwanstein Castle', country: 'Germany',        heroImage: foto(16), link: '/fotos/foto-de-1', date: 'Dec 2022', caption: 'Winter fairy tale' },
  { id: 'foto-de-2', title: 'Berlin Brutalism',      country: 'Germany',        heroImage: foto(17), link: '/fotos/foto-de-2', date: 'Oct 2022', caption: 'Raw concrete' },
  { id: 'foto-za-1', title: 'Cape of Good Hope',     country: 'South Africa',   heroImage: foto(18), link: '/fotos/foto-za-1', date: 'Feb 2023', caption: 'Two oceans meet' },
  { id: 'foto-za-2', title: 'Kruger Sunrise',        country: 'South Africa',   heroImage: foto(19), link: '/fotos/foto-za-2', date: 'Aug 2022', caption: 'Safari dawn' },
  { id: 'foto-za-3', title: 'Table Mountain Clouds', country: 'South Africa',   heroImage: foto(20), link: '/fotos/foto-za-3', date: 'Sep 2022', caption: 'Tablecloth mist' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const projectsFor = (country) => ALL_PROJECTS.filter(p => p.country === country);
const fotosFor    = (country) => ALL_FOTOS.filter(f => f.country === country);

// ─── Globe: country-based structure ─────────────────────────────────────────
export const globeProjects = [
  { country: 'Australia',      iso: 'au', lat: -25.27, lon: 133.78, projects: projectsFor('Australia'),      fotos: fotosFor('Australia') },
  { country: 'China',          iso: 'cn', lat:  35.86, lon: 104.20, projects: projectsFor('China'),          fotos: fotosFor('China') },
  { country: 'United States',  iso: 'us', lat:  37.09, lon: -95.71, projects: projectsFor('United States'),  fotos: fotosFor('United States') },
  { country: 'United Kingdom', iso: 'gb', lat:  55.38, lon:  -3.44, projects: projectsFor('United Kingdom'), fotos: fotosFor('United Kingdom') },
  { country: 'Japan',          iso: 'jp', lat:  36.20, lon: 138.25, projects: projectsFor('Japan'),          fotos: fotosFor('Japan') },
  { country: 'Brazil',         iso: 'br', lat: -14.24, lon: -51.93, projects: projectsFor('Brazil'),         fotos: fotosFor('Brazil') },
  { country: 'Germany',        iso: 'de', lat:  51.17, lon:  10.45, projects: projectsFor('Germany'),        fotos: fotosFor('Germany') },
  { country: 'South Africa',   iso: 'za', lat: -30.56, lon:  22.94, projects: projectsFor('South Africa'),   fotos: fotosFor('South Africa') },
];

// ─── Sorted accessors (selected country first) ────────────────────────────────
export const getSortedProjects = (selectedCountry) => {
  const same  = ALL_PROJECTS.filter(p => p.country === selectedCountry).sort((a,b) => a.title.localeCompare(b.title));
  const other = ALL_PROJECTS.filter(p => p.country !== selectedCountry).sort((a,b) => a.country.localeCompare(b.country) || a.title.localeCompare(b.title));
  return [...same, ...other];
};

export const getSortedFotos = (selectedCountry) => {
  const same  = ALL_FOTOS.filter(f => f.country === selectedCountry).sort((a,b) => a.title.localeCompare(b.title));
  const other = ALL_FOTOS.filter(f => f.country !== selectedCountry).sort((a,b) => a.country.localeCompare(b.country) || a.title.localeCompare(b.title));
  return [...same, ...other];
};

export const getFotoById     = (id) => ALL_FOTOS.find(f => f.id === id) || null;
export const getProjectById  = (id) => ALL_PROJECTS.find(p => p.id === id) || null;
export const allProjects     = ALL_PROJECTS;
export const allFotos        = ALL_FOTOS;

// ─── Other existing exports ────────────────────────────────────────────────
export const navLinks = [
  { id: 1, name: 'Home',    href: '#home'    },
  { id: 2, name: 'About',   href: '#about'   },
  { id: 3, name: 'Work',    href: '#work'    },
  { id: 4, name: 'Contact', href: '/portfolio/ProjectOne' },
];

export const workExperiences = [
  { id: 1, name: 'Framer', pos: 'Lead Web Developer',   duration: '2022 - Present', title: 'Framer serves as my go-to tool.', icon: '/assets/framer.svg', animation: 'idle' },
  { id: 2, name: 'Figma',  pos: 'Web Developer',         duration: '2020 - 2022',   title: 'Figma is my collaborative platform.', icon: '/assets/figma.svg', animation: 'dancing' },
  { id: 3, name: 'Notion', pos: 'Junior Web Developer',  duration: '2019 - 2020',   title: 'Notion helps organise my projects.', icon: '/assets/notion.svg', animation: 'thankful' },
];