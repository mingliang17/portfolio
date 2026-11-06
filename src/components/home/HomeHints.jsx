// src/components/home/HomeHints.jsx
//
// A small hint bar that teaches the home page's controls. It changes with what the visitor is doing:
//   - looking at the globe  → how to spin it and how to open a place
//   - a place is open       → how to scroll the polaroids, open one, and get back out
// It can be dismissed (✕) and brought back (?); the choice is remembered in this browser.
// The bar itself never takes the pointer, so it cannot get in the way of dragging the globe or the strips.
import React, { useEffect, useState } from 'react';

const STORAGE_KEY = 'hp-hints-dismissed';

// [action, what it does]. `touch` is the wording for phones and tablets, where there is no hover or keyboard.
const HINTS = {
  globe: [
    { icon: '✥', mouse: ['Drag', 'to spin the globe'], touch: ['Drag', 'to spin the globe'] },
    { icon: '◉', mouse: ['Click', 'a teal country or glowing pin to open it'], touch: ['Tap', 'a teal country or glowing pin to open it'] },
    { icon: '✦', mouse: ['Hover', 'a country or constellation to preview it'], touch: ['Tap', 'a constellation to open its work'] },
  ],
  country: [
    { icon: '↕', mouse: ['Scroll', 'or drag a strip, or rest the mouse near its top or bottom edge'], touch: ['Swipe', 'a strip up or down to browse'] },
    { icon: '▣', mouse: ['Click', 'a polaroid to open it'], touch: ['Tap', 'a polaroid to open it'] },
    { icon: '↩', mouse: ['Esc', 'or ✕, or click empty space, to go back'], touch: ['✕', 'or tap empty space to go back'] },
  ],
};

const readDismissed = () => {
  try { return window.localStorage.getItem(STORAGE_KEY) === '1'; } catch { return false; }
};
const writeDismissed = (value) => {
  try { window.localStorage.setItem(STORAGE_KEY, value ? '1' : '0'); } catch { /* storage blocked: the choice just won't persist */ }
};

const HomeHints = ({ placeOpen }) => {
  const [dismissed, setDismissed] = useState(false);
  const [touch, setTouch] = useState(false);

  // Read the browser-only bits after mount so the server and first client render agree.
  useEffect(() => {
    setDismissed(readDismissed());
    setTouch(window.matchMedia('(hover: none)').matches);
  }, []);

  const toggle = (next) => { setDismissed(next); writeDismissed(next); };

  if (dismissed) {
    return (
      <button type="button" className="hp-hints-toggle" onClick={() => toggle(false)} aria-label="Show hints" title="Show hints">?</button>
    );
  }

  const mode = placeOpen ? 'country' : 'globe';
  return (
    <aside key={mode} className="hp-hints" aria-label="How to use this page">
      <ul className="hp-hints-list">
        {HINTS[mode].map(({ icon, mouse, touch: touchText }) => {
          const [action, text] = touch ? touchText : mouse;
          return (
            <li key={icon} className="hp-hint">
              <span className="hp-hint-icon" aria-hidden="true">{icon}</span>
              <span><strong>{action}</strong> {text}</span>
            </li>
          );
        })}
      </ul>
      <button type="button" className="hp-hints-close" onClick={() => toggle(true)} aria-label="Hide hints" title="Hide hints">✕</button>
    </aside>
  );
};

export default HomeHints;
