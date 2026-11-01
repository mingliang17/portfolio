// src/utils/stripFrame.js
//
// Layout maths for the polaroid menu on the home page. Pure (no three.js, no DOM): unit-tested in Node.
//
// TWO COLUMNS: projects down the left of the globe, snaps down the right. Each column is a straight vertical
// line of polaroids, flat to the screen, with a deterministic hand-made wobble per card (a little rotation, a
// little sideways and up/down drift) so the line reads as pinned up by hand rather than laid out by a machine.
// Cards leave FRAME_MARGIN (10%) of the screen empty outside them, scale with the screen, and the column scrolls
// when it holds more cards than fit.
//
// Everything is in CSS pixels, y down, like the page. StripCarousel turns it into world units.

export const FRAME_MARGIN = 0.1; // fraction of the screen left empty outside the polaroids (each side)
export const CARD_HEIGHT_FRAC = 0.15; // polaroid height as a fraction of min(width, height)
export const CARD_ASPECT = 0.857; // polaroid width / height
export const CARD_GAP = 0.03; // pitch = card height × (1 + gap): neighbours nearly touch
export const MAX_SPREAD = 1.7; // with few cards, spacing opens up to this × the pitch
export const MAX_ROTATION = (6 * Math.PI) / 180; // largest tilt of a card
export const MIN_ROTATION = (1.2 * Math.PI) / 180; // smallest: every card is a little crooked
export const FRAME_CAMERA = { fovDeg: 50, distance: 9 };

/** Card, margin and opening sizes in CSS pixels for a viewport. */
export function frameMetrics(W, H) {
  const mx = FRAME_MARGIN * W;
  const my = FRAME_MARGIN * H;
  let cardH = Math.max(56, CARD_HEIGHT_FRAC * Math.min(W, H));
  // Never let the two columns eat more than 60% of a narrow screen.
  cardH = Math.min(cardH, (0.6 * W - 2 * mx) / (2.8 * CARD_ASPECT));
  cardH = Math.max(40, cardH);
  const cardW = cardH * CARD_ASPECT;
  const pitch = cardH * (1 + CARD_GAP);
  const colInset = mx + cardW * 0.66; // column centre line from the screen edge (room left for the sideways wobble)
  const openingRadius = Math.max(40, Math.min(W / 2 - (mx + cardW * 1.5), H / 2 - my * 0.5));
  return { W, H, mx, my, cardH, cardW, pitch, colInset, openingRadius };
}

/**
 * The two columns. `y0`/`y1` are the first and last slot centres; `count` is how many cards fit.
 * @returns {{metrics: object, columns: {id:'V1'|'V2', side:'left'|'right', x:number, y0:number, y1:number, span:number, pitch:number, count:number, bandHalf:number}[]}}
 */
export function columnLayout(W, H) {
  const m = frameMetrics(W, H);
  const y0 = m.my + m.cardH / 2;
  const y1 = H - m.my - m.cardH / 2;
  const span = Math.max(0, y1 - y0);
  const count = Math.max(1, Math.floor(span / m.pitch + 1e-6) + 1);
  const make = (id, side, x) => ({ id, side, x, y0, y1, span, pitch: m.pitch, count, bandHalf: m.cardW * 1.1 });
  return { metrics: m, columns: [make('V1', 'left', m.colInset), make('V2', 'right', W - m.colInset)] };
}

/**
 * Pixel y of slot `slot` (fractional while the column scrolls). With fewer items than slots the cards are spread
 * out (up to MAX_SPREAD × the pitch) and centred; with more, the column scrolls and slot k sits k pitches down.
 */
export function slotY(col, slot, itemCount) {
  if (itemCount >= col.count) return col.y0 + slot * col.pitch;
  const pitch = itemCount > 1 ? Math.min(col.pitch * MAX_SPREAD, col.span / (itemCount - 1)) : 0;
  return col.y0 + col.span / 2 + (slot - (itemCount - 1) / 2) * pitch;
}

// ── The hand-made wobble ──────────────────────────────────────────────────────────────────────────

/** Deterministic pseudo-random in [-1, 1] from a string and a salt: the same card always wobbles the same way. */
export function seeded(id, salt = 0) {
  let h = 2166136261 ^ salt;
  const s = String(id);
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  h ^= h >>> 15;
  h = Math.imul(h, 2246822519);
  h ^= h >>> 13;
  return ((h >>> 0) / 4294967295) * 2 - 1;
}

/**
 * How one card is thrown off the straight line. dx/dy are fractions of the card's width/height.
 * @returns {{rot:number, dx:number, dy:number, scale:number}} rot in radians, anticlockwise
 */
export function cardJitter(id) {
  const r = seeded(id, 1);
  const rot = Math.sign(r || 1) * (MIN_ROTATION + Math.abs(r) * (MAX_ROTATION - MIN_ROTATION));
  return { rot, dx: seeded(id, 2) * 0.14, dy: seeded(id, 3) * 0.06, scale: 1 + seeded(id, 4) * 0.04 };
}

/** Where a column's cards can be scrubbed, as a rectangle in CSS pixels (used to keep the globe from stealing touches). */
export const columnBand = (col) => ({ x0: col.x - col.bandHalf, x1: col.x + col.bandHalf, y0: col.y0 - col.pitch, y1: col.y1 + col.pitch });
