// src/utils/assetPath.js
export function assetPath(path) {
  // Ensures that all asset URLs respect Vite's base path
  return `${import.meta.env.BASE_URL}${path}`.replace(/\/+/, '/');
}

  