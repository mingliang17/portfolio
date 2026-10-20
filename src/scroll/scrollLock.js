// src/scroll/scrollLock.js
//
// ONE place that is allowed to stop the page from scrolling (menus, modals).
//
// Previously Navbar, ProjectPage and core.css all wrote `body.style.overflow`
// and overwrote each other (closing the menu re-enabled page scroll under a
// "locked" project page). Locks are now ref-counted: scrolling is restored only
// when the LAST lock is released.
//
//   const unlock = lockScroll();   // ...later: unlock();
//   useScrollLock(isOpen);         // declarative form for React components

import { useEffect } from 'react';

let locks = 0;
let previousOverflow = '';

export function lockScroll() {
  if (typeof document === 'undefined') return () => {};
  const root = document.documentElement;
  if (locks === 0) {
    previousOverflow = root.style.overflow;
    root.style.overflow = 'hidden';
    root.setAttribute('data-scroll-locked', '');
  }
  locks += 1;

  let released = false;
  return () => {
    if (released) return;
    released = true;
    locks = Math.max(0, locks - 1);
    if (locks === 0) {
      root.style.overflow = previousOverflow;
      root.removeAttribute('data-scroll-locked');
    }
  };
}

export const isScrollLocked = () => locks > 0;

export function useScrollLock(active) {
  useEffect(() => {
    if (!active) return undefined;
    return lockScroll();
  }, [active]);
}
