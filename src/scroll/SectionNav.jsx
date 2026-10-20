// src/scroll/SectionNav.jsx
// Dot navigation. Reads the active section from the stage and scrolls via goTo().
// Because the active section is *derived from scroll position*, the dots can never
// disagree with what is on screen (no separate "currentSectionIndex" state to drift).
import React from 'react';
import { useStage } from './context.js';

export default function SectionNav({ className = '' }) {
  const { sections, activeIndex, goTo } = useStage();
  if (sections.length < 2) return null;

  return (
    <nav className={`scroll-nav ${className}`} aria-label="Sections">
      {sections.map((s, i) => (
        <button
          key={s.id}
          type="button"
          className={`scroll-nav-dot ${i === activeIndex ? 'active' : ''}`}
          aria-label={s.label}
          aria-current={i === activeIndex ? 'true' : undefined}
          onClick={() => goTo(s.id)}
        >
          <span className="scroll-nav-label">{s.label}</span>
        </button>
      ))}
    </nav>
  );
}
