// src/globe/uiState.js — tiny shared flags between the two WebGL canvases on the home page (globe below,
// polaroid columns above). Both listen to the same pointer events, so the globe needs to know when the pointer
// is actually on a polaroid (to ignore the click), how far the last drag travelled (to tell click from drag), and
// where the polaroid columns are (so a finger on a column scrolls it instead of turning the globe).
export const uiState = {
  cardHover: false,
  dragMoved: 0, // px the pointer travelled during the last press
  bands: [], // [{ x0, x1, y0, y1 }] in CSS px: where the polaroid columns can be scrolled (empty when hidden)
};

/** Is the point (CSS px) inside one of the polaroid columns' scroll areas? */
export const inBands = (x, y) => uiState.bands.some((b) => x >= b.x0 && x <= b.x1 && y >= b.y0 && y <= b.y1);
