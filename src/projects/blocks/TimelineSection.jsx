// src/projects/blocks/TimelineSection.jsx — a LONG section: scroll drives which step is shown.
//   { title?, steps: [{ title, text, media? }] }
// `scrollProgress` runs 0 → 1 across the section; steps sit at evenly spaced checkpoints.
import React from 'react';
import Media from './Media.jsx';

export default function TimelineSection({ title, eyebrow, steps = [], isVisible, scrollProgress = 0 }) {
  const n = steps.length;
  const active = n > 1 ? Math.round(scrollProgress * (n - 1)) : 0;

  return (
    <section className="blk blk-timeline is-in">
      <div className="blk-timeline__text">
        {eyebrow && <p className="blk-eyebrow">{eyebrow}</p>}
        {title && <h2 className="blk-title">{title}</h2>}
        <ol className="blk-timeline__steps">
          {steps.map((step, i) => (
            <li key={step.title} className={i === active ? 'is-active' : i < active ? 'is-done' : ''}>
              <span className="blk-timeline__num">{String(i + 1).padStart(2, '0')}</span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="blk-timeline__rail" aria-hidden="true">
          <div style={{ transform: `scaleX(${scrollProgress})` }} />
        </div>
      </div>
      <div className="blk-timeline__media">
        {steps.map((step, i) => (
          <div key={step.title} className={`blk-timeline__frame ${i === active ? 'is-active' : ''}`}>
            <Media media={step.media} play={!!isVisible && i === active} />
          </div>
        ))}
      </div>
    </section>
  );
}
