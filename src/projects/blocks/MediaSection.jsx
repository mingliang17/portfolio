// src/projects/blocks/MediaSection.jsx — a full-bleed image or video with a caption.
//   { media, title?, caption?, eyebrow?, align: 'left' | 'right' | 'center' }
import React, { useState } from 'react';
import Media from './Media.jsx';

export default function MediaSection({ media, title, eyebrow, caption, align = 'left', isActive, isVisible }) {
  const [paused, setPaused] = useState(false);
  const isVideo = media?.type === 'video';
  return (
    <section className={`blk blk-media-full blk-media-full--${align} ${isActive ? 'is-in' : ''}`}>
      <Media media={media} play={!!isVisible && !paused} className="blk-media-full__bg" />
      <div className="blk-media-full__scrim" />
      <div className="blk-media-full__copy">
        {eyebrow && <p className="blk-eyebrow" data-in style={{ '--i': 0 }}>{eyebrow}</p>}
        {title && <h2 className="blk-title" data-in style={{ '--i': 1 }}>{title}</h2>}
        {caption && <p className="blk-body" data-in style={{ '--i': 2 }}>{caption}</p>}
      </div>
      {isVideo && (
        <button type="button" className="blk-media-full__toggle" onClick={() => setPaused((p) => !p)} aria-label={paused ? 'Play video' : 'Pause video'}>
          {paused ? '▶' : '❚❚'}
        </button>
      )}
    </section>
  );
}
