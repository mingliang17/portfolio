// src/utils/stripFrame.js
//
// Layout maths for the polaroid menu on the home page. Pure (no three.js, no DOM): unit-tested in Node.
//
// TWO ENDLESS COLUMNS: projects down the left of the globe, snaps down the right. Each column is a straight vertical
// strip of polaroids, flat to the screen, that runs OFF the top and bottom of the page, like a reel with no end.
// The strip is a loop: scrolling never runs out, the list simply comes round again. Each card has a deterministic
// hand-made wobble (a little rotation, a little sideways and up/down drift) so it reads as pinned up by hand.
//
// A column is described by the position of its CENTRE: item i sits `wrapOffset(i, scroll, N)` card-slots away from
// the middle of the screen. When a place is selected its own cards are scrolled to the middle (startScroll), so the
// colour sits in the centre of the screen with the greyed-out rest above and below it.
//
// Everything is in CSS pixels, y down, like the page. StripCarousel turns it into world units.

export const FRAME_MARGIN = 0.1; // empty border at each SIDE of the screen outside the columns (fraction of the width)
export const CARD_HEIGHT_FRAC = 0.225; // polaroid height as a fraction of min(width, height) (1.5 × the original 0.15)
export const CARD_ASPECT = 0.857; // polaroid width / height
export const CARD_GAP = 0.03; // pitch = card height × (1 + gap): neighbours nearly touch
export const OVERSCAN = 0.7; // cards are kept this many card-heights beyond the screen edge, so they run off it
export const MAX_ROTATION = (6 * Math.PI) / 180; // largest tilt of a card
export const MIN_ROTATION = (1.2 * Math.PI) / 180; // smallest: every card is a little crooked
export const EDGE_DEAD_ZONE = 0.4; // the middle 40% of a column's height does not scroll it
export const EDGE_MAX_SPEED = 2.2; // card-slots per second when the pointer is at the very top or bottom
export const FRAME_CAMERA = { fovDeg: 50, distance: 9 };

/** Card, margin and opening sizes in CSS pixels for a viewport. */
export function frameMetrics(W, H) {
  const mx = FRAME_MARGIN * W;
  const my = FRAME_MARGIN * H;
  let cardH = Math.max(56, CARD_HEIGHT_FRAC * Math.min(W, H));
  // Never let the two columns eat more than 60% of a narrow screen (on portrait phones this caps the 1.5× size).
  cardH = Math.min(cardH, (0.6 * W - 2 * mx) / (2.8 * CARD_ASPECT));
  cardH = Math.max(40, cardH);
  const cardW = cardH * CARD_ASPECT;
  const pitch = cardH * (1 + CARD_GAP);
  const colInset = mx + cardW * 0.66; // column centre line from the screen edge (room left for the sideways wobble)
  const openingRadius = Math.max(40, Math.min(W / 2 - (mx + cardW * 1.5), H / 2 - my * 0.5));
  return { W, H, mx, my, cardH, cardW, pitch, colInset, openingRadius };
}

/**
 * The two columns. `yMid` is the vertical centre of the screen; a card is kept while it is within `reach` of it
 * (a little past the screen edge); `slots` is how many card positions that range holds.
 * @returns {{metrics: object, columns: {id:'V1'|'V2', side:'left'|'right', x:number, pitch:number, yMid:number, reach:number, slots:number, bandHalf:number}[]}}
 */
export function columnLayout(W, H) {
  const m = frameMetrics(W, H);
  const reach = H / 2 + m.cardH * OVERSCAN;
  const slots = Math.floor((2 * reach) / m.pitch) + 1;
  const make = (id, side, x) => ({ id, side, x, pitch: m.pitch, yMid: H / 2, reach, slots, bandHalf: m.cardW * 1.1 });
  return { metrics: m, columns: [make('V1', 'left', m.colInset), make('V2', 'right', W - m.colInset)] };
}

// ── The endless loop ──────────────────────────────────────────────────────────────────────────────

/**
 * How many card-slots item `i` is from the middle of the screen when the column is scrolled to `scroll`
 * (scroll = the item at the middle; fractional while it glides). The loop wraps, so the answer is the nearest
 * copy, in [-N/2, N/2).
 */
export function wrapOffset(i, scroll, N) {
  if (N <= 1) return 0;
  const d = (((i - scroll) % N) + N) % N; // 0 … N
  return d >= N / 2 ? d - N : d;
}

/**
 * Extra laps to draw so a short list still fills the strip: `[0]` when the list is long enough that no item
 * appears twice on screen, else `[-L … L]` (the same few cards come round again).
 */
export function lapOffsets(N, slots) {
  if (N >= slots) return [0];
  const L = Math.ceil(slots / (2 * Math.max(1, N)));
  return Array.from({ length: 2 * L + 1 }, (_, k) => k - L);
}

/** Where to scroll to when a place opens: its own (first) cards in the middle of the screen. */
export function startScroll(items, country) {
  let m = 0;
  while (m < items.length && items[m].country === country) m++;
  return m > 0 ? (m - 1) / 2 : 0;
}

/**
 * How fast a pointer at height `y` (px) scrolls the column, in card-slots per second (positive = the cards move
 * up, i.e. you read further down the list). Nothing in the middle; ramps up towards the top and bottom edges.
 */
export function edgeScrollSpeed(y, H) {
  const u = (y - H / 2) / (H / 2); // -1 (top) … 1 (bottom)
  const a = Math.abs(u);
  if (a <= EDGE_DEAD_ZONE) return 0;
  return Math.sign(u) * EDGE_MAX_SPEED * Math.pow(Math.min(1, (a - EDGE_DEAD_ZONE) / (1 - EDGE_DEAD_ZONE)), 1.5);
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

/** The area of a column that scrolls it (the whole height of the screen), in CSS pixels. */
export const columnBand = (col, H) => ({ x0: col.x - col.bandHalf, x1: col.x + col.bandHalf, y0: 0, y1: H });
