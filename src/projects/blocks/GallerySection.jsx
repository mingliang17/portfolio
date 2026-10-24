// src/projects/blocks/GallerySection.jsx — a grid of images/videos that always fits one screen.
//   { title?, items: [{ src, type?, alt?, caption?, span?: [cols, rows] }], columns?: 3, rows?, layout?: 'grid' | 'mosaic' }
// 'mosaic' makes the first item twice as large unless an item sets its own `span`.
import React from 'react';
import Media from './Media.jsx';

export default function GallerySection({ title, eyebrow, items = [], columns = 3, rows, layout = 'grid', isActive, isVisible }) {
  const spans = items.map((item, i) => item.span ?? (layout === 'mosaic' && i === 0 ? [2, 2] : [1, 1]));
  const cells = spans.reduce((n, [c, r]) => n + c * r, 0);
  const rowCount = rows ?? Math.max(1, Math.ceil(cells / columns));

  return (
    <section className={`blk blk-gallery ${isActive ? 'is-in' : ''}`}>
      {(title || eyebrow) && (
        <header className="blk-gallery__head" data-in style={{ '--i': 0 }}>
          {eyebrow && <p className="blk-eyebrow">{eyebrow}</p>}
          {title && <h2 className="blk-title">{title}</h2>}
        </header>
      )}
      <div className="blk-gallery__grid" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${rowCount}, minmax(0, 1fr))` }}>
        {items.map((item, i) => (
          <figure
            key={item.src + i}
            className="blk-gallery__item"
            data-in
            style={{ '--i': 1 + i, gridColumn: `span ${spans[i][0]}`, gridRow: `span ${spans[i][1]}` }}
          >
            <Media media={{ type: item.type ?? 'image', ...item }} play={!!isVisible} />
            {item.caption && <figcaption>{item.caption}</figcaption>}
          </figure>
        ))}
      </div>
    </section>
  );
}
