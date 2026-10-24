// src/projects/ProjectStage.jsx — the scroll stage + section dots every project page sits in.
// Data-driven pages get it from ProjectPage; bespoke pages render it themselves:
//
//   <ProjectStage id="lumen" sections={[section('hero', {...}), { id: 'x', kind: 'page', render }, ...]} />
//
// Debug: append ?scrolldebug to the URL for a live HUD.
import React from 'react';
import { ScrollStage, SectionNav } from '@/scroll/index.js';

export default function ProjectStage({ id, sections }) {
  const debug = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('scrolldebug');
  return (
    <ScrollStage key={id} sections={sections} syncHash debug={debug}>
      <SectionNav />
    </ScrollStage>
  );
}
