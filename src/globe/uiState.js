// src/globe/uiState.js — tiny shared flags between the two WebGL canvases on the home page (globe below,
// polaroid frame above). Both listen to the same pointer events, so the globe needs to know when the pointer
// is actually on a polaroid (to ignore the click) and how far the last drag travelled (to tell click from drag).
export const uiState = {
  cardHover: false,
  dragMoved: 0, // px the pointer travelled during the last press
};
