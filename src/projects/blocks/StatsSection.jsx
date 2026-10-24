// src/projects/blocks/StatsSection.jsx — a statement and key figures.
//   { eyebrow?, statement, stats: [{ value, label }] }
import React from 'react';

export default function StatsSection({ eyebrow, statement, stats = [], isActive }) {
  return (
    <section className={`blk blk-stats ${isActive ? 'is-in' : ''}`}>
      <div className="blk-stats__inner">
        {eyebrow && <p className="blk-eyebrow" data-in style={{ '--i': 0 }}>{eyebrow}</p>}
        {statement && <p className="blk-statement" data-in style={{ '--i': 1 }}>{statement}</p>}
        <ul className="blk-stats__row">
          {stats.map((s, i) => (
            <li key={s.label} data-in style={{ '--i': 2 + i }}>
              <strong>{s.value}</strong>
              <span>{s.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
