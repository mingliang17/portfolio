// src/globe/themes.js — palettes for the vector globe. Keys match the Day / Neutral / Night toggle.
// Colours are plain CSS hex strings; the globe shader reads them as raw sRGB so they look the same as in CSS.

export const GLOBE_THEMES = {
  // Calm slate-blue: the default, sits well on the dark site background.
  neutral: {
    oceanCenter: '#1d4670',
    oceanEdge: '#0b1f36',
    land: '#5f7b95',
    landContent: '#5fc4bb', // countries that have projects / photos
    border: '#e6eef6',
    borderAlpha: 0.6,
    coastAlpha: 0.32,
    graticule: '#a9c4de',
    graticuleAlpha: 0.1,
    rim: '#7db2ff',
    hover: '#ffffff',
    select: '#4d9eff',
  },
  // Light, amCharts-style: pale land on blue water.
  day: {
    oceanCenter: '#6fb4ea',
    oceanEdge: '#2c6fb0',
    land: '#e7eddc',
    landContent: '#f4c26b',
    border: '#ffffff',
    borderAlpha: 0.95,
    coastAlpha: 0.55,
    graticule: '#ffffff',
    graticuleAlpha: 0.16,
    rim: '#bfe0ff',
    hover: '#ffffff',
    select: '#e8554e',
  },
  night: {
    oceanCenter: '#0b1224',
    oceanEdge: '#04070f',
    land: '#1b2740',
    landContent: '#1f7f89',
    border: '#6fa3ff',
    borderAlpha: 0.6,
    coastAlpha: 0.4,
    graticule: '#4b6ca8',
    graticuleAlpha: 0.12,
    rim: '#3a6dff',
    hover: '#9cc4ff',
    select: '#ffd166',
  },
};

export const DEFAULT_THEME = 'neutral';

/** '#rrggbb' → [r, g, b] in 0..1, with no colour-space conversion. */
export const hexToRgb = (hex) => {
  const h = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
};
