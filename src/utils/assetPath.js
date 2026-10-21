// src/utils/assetPath.js
// Turns a path inside public/ into a URL that respects an optional sub-path deployment
// (NEXT_PUBLIC_BASE_PATH, e.g. "/portfolio"). Next.js prefixes <Link> and routes with its
// `basePath` automatically, but NOT plain strings handed to <img>, useGLTF, fetch, etc.
const BASE = (process.env.NEXT_PUBLIC_BASE_PATH || '').replace(/\/$/, '');

export function assetPath(path) {
  if (/^(https?:)?\/\//.test(path)) return path; // already absolute
  return `${BASE}/${path}`.replace(/\/{2,}/g, '/');
}

/** Same idea for an in-app page URL used outside <Link> (e.g. window.location.href = ...). */
export function withBase(href) {
  if (/^(https?:)?\/\//.test(href)) return href;
  return `${BASE}${href.startsWith('/') ? '' : '/'}${href}`;
}
