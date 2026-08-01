// src/pages/FotoPage.jsx
// Reusable foto/snap page — architecture mirrors ProjectPage
// Shows a large polaroid, metadata, and optional caption.
import React, { useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import gsap from 'gsap';
import { getFotoById } from '../../constants/index.js';

// ── Polaroid display component ──────────────────────────────────────────────
const FotoPolaroid = ({ foto }) => {
  const polaroidRef = useRef(null);
  const imgRef      = useRef(null);

  useEffect(() => {
    if (!polaroidRef.current) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      gsap.set(polaroidRef.current, { opacity: 0, y: 60, rotation: -6, scale: 0.88 });
      gsap.set('.foto-caption-text', { opacity: 0, y: 12 });
      gsap.set('.foto-meta-item', { opacity: 0, x: -10 });

      tl.to(polaroidRef.current, { opacity: 1, y: 0, rotation: -2, scale: 1, duration: 0.9, ease: 'back.out(1.4)' })
        .to('.foto-caption-text', { opacity: 1, y: 0, duration: 0.5 }, '-=0.3')
        .to('.foto-meta-item', { opacity: 1, x: 0, duration: 0.4, stagger: 0.08 }, '-=0.3');
    }, polaroidRef);
    return () => ctx.revert();
  }, [foto?.id]);

  if (!foto) return null;

  const handleMouseEnter = () => {
    gsap.to(polaroidRef.current, { y: -8, rotation: -1, scale: 1.015, duration: 0.3, ease: 'power2.out' });
  };
  const handleMouseLeave = () => {
    gsap.to(polaroidRef.current, { y: 0, rotation: -2, scale: 1, duration: 0.5, ease: 'elastic.out(1, 0.5)' });
  };
  const handleClick = () => {
    // Nudge bounce
    gsap.to(polaroidRef.current, {
      keyframes: [
        { scale: 0.96, rotation: -3, duration: 0.08 },
        { scale: 1.04, rotation: -1, duration: 0.15, ease: 'back.out(3)' },
        { scale: 1,    rotation: -2, duration: 0.3,  ease: 'elastic.out(1, 0.4)' },
      ]
    });
  };

  return (
    <div
      ref={polaroidRef}
      className="foto-polaroid"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      style={{ cursor: 'pointer' }}
    >
      <div className="foto-polaroid-img">
        <img ref={imgRef} src={foto.heroImage} alt={foto.title} />
        <div className="foto-polaroid-img-overlay" />
      </div>
      <div className="foto-polaroid-body">
        <p className="foto-caption-text">{foto.caption || foto.title}</p>
        {foto.date && <span className="foto-date foto-caption-text">{foto.date}</span>}
      </div>
    </div>
  );
};

// ── Metadata sidebar ────────────────────────────────────────────────────────
const FotoMeta = ({ foto }) => {
  if (!foto) return null;
  const fields = [
    { label: 'Title',   value: foto.title },
    { label: 'Country', value: foto.country },
    { label: 'Date',    value: foto.date || '—' },
    { label: 'Caption', value: foto.caption || '—' },
  ];
  return (
    <aside className="foto-meta">
      <h1 className="foto-meta-heading">{foto.title}</h1>
      <div className="foto-meta-divider" />
      {fields.map(f => (
        <div key={f.label} className="foto-meta-item">
          <span className="foto-meta-label">{f.label}</span>
          <span className="foto-meta-value">{f.value}</span>
        </div>
      ))}
      <a href="/" className="foto-back-btn">← Back to Globe</a>
    </aside>
  );
};

// ── Page component ──────────────────────────────────────────────────────────
const FotoPage = ({ fotoId: propFotoId = null }) => {
  const { fotoId: paramFotoId } = useParams() || {};
  const id   = propFotoId || paramFotoId;
  const foto = getFotoById(id);

  const bgRef = useRef(null);
  useEffect(() => {
    if (!bgRef.current) return;
    gsap.fromTo(bgRef.current, { opacity: 0 }, { opacity: 1, duration: 1.2, ease: 'power2.out' });
  }, []);

  return (
    <div className="foto-page" ref={bgRef}>
      {foto && (
        <div
          className="foto-page-bg"
          style={{ backgroundImage: `url(${foto.heroImage})` }}
        />
      )}
      <div className="foto-page-scrim" />

      <div className="foto-page-layout">
        <FotoMeta foto={foto} />
        <main className="foto-main">
          {foto ? (
            <FotoPolaroid foto={foto} />
          ) : (
            <div className="foto-not-found">
              <p>Snap not found.</p>
              <a href="/">← Return home</a>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default FotoPage;