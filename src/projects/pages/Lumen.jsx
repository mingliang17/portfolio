// src/projects/pages/Lumen.jsx — a BESPOKE project page.
//
// Same scroll system, transitions and sphere background as every other project, but the page is
// written by hand: ready-made sections come from `section(type, config)`, and sections that exist
// only for this project are plain objects with a `render` function. Order here = order on the page.
//
// Section spec (see docs/ProjectPages.md):
//   { id, label, kind: 'page' | 'long', length?, checkpoints?, sphere?, render: (scene) => JSX }
//   scene = { isActive, isVisible, progress (0..1, long sections), … }
import React, { useMemo } from 'react';
import { ProjectStage, section } from '@/projects/index.js';

// ── Section written only for Lumen: a typographic overture ───────────────────────────────────
function Overture({ words, active }) {
  return (
    <div className={`lumen-overture ${active ? 'is-in' : ''}`}>
      {words.map((w, i) => (
        <span key={w} className="lumen-overture__word" style={{ '--i': i }}>{w}</span>
      ))}
      <p className="lumen-overture__note">Three movements. One lamp. Scroll to turn it up.</p>
    </div>
  );
}

// ── Long section written only for Lumen: scroll turns the lamp up ───────────────────────────
// `progress` runs 0 → 1; the three checkpoints are the three captions.
function LightStudy({ steps, progress }) {
  const active = Math.min(steps.length - 1, Math.round(progress * (steps.length - 1)));
  const warm = 30 + progress * 25; // hue: ember → daylight-ish gold
  return (
    <div className="lumen-study" style={{ '--glow': progress, '--hue': warm }}>
      <svg className="lumen-study__lamp" viewBox="0 0 200 260" role="img" aria-label="A lamp growing brighter">
        <defs>
          <radialGradient id="lumen-glow" cx="50%" cy="42%" r="55%">
            <stop offset="0" stopColor={`hsl(${warm} 95% ${55 + progress * 20}%)`} stopOpacity={0.25 + progress * 0.75} />
            <stop offset="1" stopColor={`hsl(${warm} 90% 40%)`} stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="100" cy="110" r={70 + progress * 55} fill="url(#lumen-glow)" />
        <path d="M70 150 Q100 40 130 150 Z" fill="none" stroke="#eceef2" strokeOpacity="0.8" strokeWidth="2" />
        <circle cx="100" cy="112" r={8 + progress * 10} fill={`hsl(${warm} 95% ${60 + progress * 25}%)`} />
        <rect x="94" y="150" width="12" height="70" fill="#eceef2" fillOpacity="0.7" />
        <rect x="70" y="220" width="60" height="8" rx="3" fill="#eceef2" fillOpacity="0.7" />
      </svg>
      <ol className="lumen-study__captions">
        {steps.map((s, i) => (
          <li key={s.title} className={i === active ? 'is-active' : ''}>
            <h3>{s.title}</h3>
            <p>{s.text}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function Lumen({ project }) {
  const sections = useMemo(() => {
    const { assets, copy } = project;
    return [
      // 1. Ready-made: the camera-viewfinder hero
      section('hero', { title: 'Lumen', subtitle: 'A light installation in three movements', image: assets.hero }, project),

      // 2. Bespoke page section
      {
        id: 'overture',
        label: 'Overture',
        kind: 'page',
        sphere: 'globe',
        render: (sc) => <Overture words={copy.overture} active={sc.isActive} />,
      },

      // 3. Ready-made: full-bleed video, text on the right
      section('media', {
        id: 'reel',
        align: 'right',
        eyebrow: 'The installation',
        title: 'Light you can walk through',
        caption: 'Placeholder video (a looping colour field).',
        media: {
          type: 'video',
          poster: assets.reelPoster,
          alt: 'Placeholder video',
          sources: [
            { src: `${assets.reel}.webm`, type: 'video/webm' },
            { src: `${assets.reel}.mp4`, type: 'video/mp4' },
          ],
        },
      }),

      // 4. Bespoke LONG section: scroll-driven, three checkpoints
      {
        id: 'study',
        label: 'Light study',
        kind: 'long',
        length: 3.5,
        checkpoints: 3,
        sphere: 'rhombus',
        render: (sc) => <LightStudy steps={copy.study} progress={sc.progress} />,
      },

      // 5. Ready-made: mosaic gallery (first image double size). 2×2 + five singles = 9 cells = a 3×3 grid
      section('gallery', {
        id: 'details',
        layout: 'mosaic',
        columns: 3,
        eyebrow: 'Details',
        title: 'Materials & fixtures',
        items: assets.gallery.map((src, i) => ({ src, alt: `Placeholder detail ${i + 1}`, caption: `Detail ${i + 1}` })),
      }),

      // 6. Ready-made: the 3D carousel with this project's sketches
      section('carousel', {
        id: 'sketches',
        title: 'Process sketches',
        images: assets.sketches.map((image, i) => ({
          id: i + 1,
          image,
          title: ['First idea', 'Reflector study', 'Final layout'][i],
          description: 'Placeholder sketch.',
          information: 'Placeholder details.',
        })),
      }),

      // 7. Ready-made: closing numbers
      section('stats', {
        id: 'numbers',
        eyebrow: 'By the numbers',
        statement: 'Seventy-two lamps. One continuous glow.',
        stats: [
          { value: '72', label: 'Lamps' },
          { value: '3', label: 'Movements' },
          { value: '14 m', label: 'Corridor' },
        ],
      }),
    ];
  }, [project]);

  return <ProjectStage id={project.id} sections={sections} />;
}
