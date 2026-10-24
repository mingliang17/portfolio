// src/projects/blocks/SplitSection.jsx — text beside an image or video.
//   { title, eyebrow?, body: string | string[], facts?: [{ label, value }], media, side: 'left' | 'right' }
// `side` is where the TEXT sits.
import React from 'react';
import Media from './Media.jsx';

export default function SplitSection({ eyebrow, title, body, facts, media, side = 'left', isActive, isVisible }) {
  const paragraphs = Array.isArray(body) ? body : body ? [body] : [];
  return (
    <section className={`blk blk-split blk-split--text-${side} ${isActive ? 'is-in' : ''}`}>
      <div className="blk-split__text">
        {eyebrow && <p className="blk-eyebrow" data-in style={{ '--i': 0 }}>{eyebrow}</p>}
        {title && <h2 className="blk-title" data-in style={{ '--i': 1 }}>{title}</h2>}
        {paragraphs.map((p, i) => (
          <p key={i} className="blk-body" data-in style={{ '--i': 2 + i }}>{p}</p>
        ))}
        {facts?.length > 0 && (
          <dl className="blk-facts" data-in style={{ '--i': 3 + paragraphs.length }}>
            {facts.map((f) => (
              <div key={f.label}>
                <dt>{f.label}</dt>
                <dd>{f.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
      <figure className="blk-split__media" data-in style={{ '--i': 2 }}>
        <Media media={media} play={!!isVisible} />
        {media?.caption && <figcaption>{media.caption}</figcaption>}
      </figure>
    </section>
  );
}
