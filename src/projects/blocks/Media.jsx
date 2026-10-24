// src/projects/blocks/Media.jsx — an image or a video, from data: { type: 'image' | 'video', src, poster?, alt? }.
// Paths are public-relative (e.g. 'assets/projects/atlas/hero.svg') or absolute URLs.
// Videos are muted + looping (so browsers allow autoplay) and play only while `play` is true.
// Give a video `src` alone, or `sources: [{ src, type }]` to offer several formats (first one the browser can play wins).
import React, { useEffect, useRef } from 'react';
import { assetPath } from '@/utils/assetPath.js';

export default function Media({ media, play = true, className = '', fit = 'cover' }) {
  const ref = useRef(null);
  const isVideo = media?.type === 'video';

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (play) v.play?.().catch(() => {}); // autoplay can be refused; the poster stays visible
    else v.pause?.();
  }, [play, media?.src]);

  if (!media?.src && !media?.sources?.length) return <div className={`blk-media blk-media--empty ${className}`} aria-hidden="true" />;

  if (isVideo) {
    return (
      <video
        ref={ref}
        className={`blk-media ${className}`}
        style={{ objectFit: fit }}
        src={media.sources ? undefined : assetPath(media.src)}
        poster={media.poster ? assetPath(media.poster) : undefined}
        muted
        loop
        playsInline
        preload="metadata"
        aria-label={media.alt}
      >
        {media.sources?.map((s) => <source key={s.src} src={assetPath(s.src)} type={s.type} />)}
      </video>
    );
  }
  return <img className={`blk-media ${className}`} style={{ objectFit: fit }} src={assetPath(media.src)} alt={media.alt ?? ''} draggable={false} />;
}
