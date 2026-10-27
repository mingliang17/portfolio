// src/utils/stripFrame.js
//
// Layout maths for the polaroid frame on the home page. Pure (no three.js, no DOM): unit-tested in Node.
//
// THE IDEA: "a rectangle mapped onto an oval, framing the globe"
//   1. On screen, the polaroids run along a ROUNDED RECTANGLE (a superellipse) that leaves FRAME_MARGIN (10%) of
//      every side empty: the frame is laid out in screen space, so it fills the screen at any aspect ratio.
//   2. Behind each point of that ring sits a big sphere, centred on the globe. A card sits ON the sphere at the
//      point where the ray through its ring position hits it, tangent to it (eased by CURVATURE). Cards in the
//      middle of a side face you; towards the corners they turn away and narrow: the flat rectangle wraps
//      around an oval, like a film reel around the globe.
//   3. PINWHEEL: each strip owns one corner and stops one card short of the next, so the four interlock
//      (top → right → bottom → left, clockwise) instead of colliding.
//
// Screen position of a point on the sphere (camera on +Z at distance D, vertical fov f), as used throughout:
//   ndcX = Px / ((D − Pz)·tan(f/2)·aspect)      ndcY = Py / ((D − Pz)·tan(f/2))

export const FRAME_MARGIN = 0.1; // fraction of each viewport dimension left empty outside the polaroids
export const CARD_HEIGHT_FRAC = 0.15; // polaroid height as a fraction of min(width, height)
export const CARD_ASPECT = 0.857; // polaroid width / height
export const CARD_GAP = 0.1; // gap between neighbouring cards, as a fraction of the card's length along the strip
export const CURVATURE = 0.7; // 0 = cards face the camera, 1 = fully tangent to the sphere
export const RING_SQUARENESS = 3.4; // superellipse exponent: 2 = ellipse, ∞ = rectangle
export const MAX_TILT = (62 * Math.PI) / 180; // how far from the view axis the ring's farthest point sits on the sphere
export const FRAME_CAMERA = { fovDeg: 50, distance: 9 };

const tanHalf = (fovDeg) => Math.tan((fovDeg * Math.PI) / 360);

/** Card and frame sizes in CSS pixels for a viewport. */
export function frameMetrics(W, H) {
  const mx = FRAME_MARGIN * W;
  const my = FRAME_MARGIN * H;
  const cardH = Math.max(56, CARD_HEIGHT_FRAC * Math.min(W, H));
  const cardW = cardH * CARD_ASPECT;
  const innerHalfW = W / 2 - mx - cardW; // half-size of the opening the polaroids frame
  const innerHalfH = H / 2 - my - cardH;
  return { W, H, mx, my, cardH, cardW, innerHalfW, innerHalfH, openingRadius: Math.max(40, Math.min(innerHalfW, innerHalfH)) };
}

// ── The ring on screen ─────────────────────────────────────────────────────────────────────────────

const SAMPLES = 1440;

/**
 * Sample the ring clockwise starting at the top-left corner. Table of NDC points with cumulative pixel length `s`.
 * The ring's centre line sits half a card inside the margin, so the cards' OUTER edge is exactly at the margin.
 */
function buildRing(m, N) {
  const X = 1 - (2 * (m.mx + m.cardW / 2)) / m.W; // half-width of the centre line, NDC
  const Y = 1 - (2 * (m.my + m.cardH / 2)) / m.H;
  const e = 2 / N;
  const start = (-Math.PI) / 4;
  const xs = new Float64Array(SAMPLES + 1);
  const ys = new Float64Array(SAMPLES + 1);
  const s = new Float64Array(SAMPLES + 1);
  for (let i = 0; i <= SAMPLES; i++) {
    const phi = start + (i / SAMPLES) * Math.PI * 2; // clockwise from the top-left corner
    const sn = Math.sin(phi);
    const cs = Math.cos(phi);
    xs[i] = X * Math.sign(sn) * Math.abs(sn) ** e;
    ys[i] = Y * Math.sign(cs) * Math.abs(cs) ** e;
    if (i > 0) s[i] = s[i - 1] + Math.hypot(((xs[i] - xs[i - 1]) * m.W) / 2, ((ys[i] - ys[i - 1]) * m.H) / 2);
  }
  const at = (phi) => s[Math.round(((phi - start) / (Math.PI * 2)) * SAMPLES)];
  return {
    X, Y, xs, ys, s, total: s[SAMPLES],
    corners: { TL: 0, TR: at(Math.PI / 4), BR: at((3 * Math.PI) / 4), BL: at((5 * Math.PI) / 4) },
  };
}

/** NDC point at pixel distance `s` along the ring (clamped to the ring). */
export function ringAt(frame, s, out = [0, 0]) {
  const { xs, ys, s: tab, total } = frame.ring;
  const d = Math.min(Math.max(s, 0), total);
  let lo = 0;
  let hi = tab.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (tab[mid] <= d) lo = mid;
    else hi = mid;
  }
  const t = tab[hi] > tab[lo] ? (d - tab[lo]) / (tab[hi] - tab[lo]) : 0;
  out[0] = xs[lo] + (xs[hi] - xs[lo]) * t;
  out[1] = ys[lo] + (ys[hi] - ys[lo]) * t;
  return out;
}

// ── The sphere behind the ring ───────────────────────────────────────────────────────────────────

/**
 * Solve the frame for a viewport: the ring, and the radius of the sphere behind it, chosen so the ring's
 * farthest point sits MAX_TILT from the view axis (the cards turn away most there, but never edge-on).
 */
export function solveFrame(W, H, { fovDeg, distance: D } = FRAME_CAMERA, N = RING_SQUARENESS) {
  const metrics = frameMetrics(W, H);
  const aspect = W / H;
  const tanH = tanHalf(fovDeg);
  const ring = buildRing(metrics, N);

  let rho = 0; // largest distance of the ring from the screen centre, in vertical-NDC units
  for (let i = 0; i < ring.xs.length; i++) rho = Math.max(rho, Math.hypot(ring.xs[i] * aspect, ring.ys[i]));
  // ρ = R·sinψ / ((D − R·cosψ)·tanH)  ⇒  R = ρ·tanH·D / (sinψ + ρ·tanH·cosψ)
  const R = (rho * tanH * D) / (Math.sin(MAX_TILT) + rho * tanH * Math.cos(MAX_TILT));
  return { W, H, aspect, D, fovDeg, tanH, R, N, ring, metrics };
}

/**
 * Where the ray through an NDC point first meets the sphere: position and unit outward normal.
 * Always hits for ring points (the sphere's silhouette is larger than the ring by construction).
 */
export function hitSphere(frame, ndcX, ndcY, out = { p: [0, 0, 0], n: [0, 0, 1], depth: 0 }) {
  const { D, R, tanH, aspect } = frame;
  let dx = ndcX * tanH * aspect;
  let dy = ndcY * tanH;
  let dz = -1;
  const len = Math.hypot(dx, dy, dz);
  dx /= len; dy /= len; dz /= len;
  // |C + t·d|² = R², C = (0, 0, D)
  const b = D * dz;
  const c = D * D - R * R;
  const disc = Math.max(0, b * b - c);
  const t = -b - Math.sqrt(disc); // the nearer intersection
  const px = dx * t;
  const py = dy * t;
  const pz = D + dz * t;
  out.p[0] = px; out.p[1] = py; out.p[2] = pz;
  out.n[0] = px / R; out.n[1] = py / R; out.n[2] = pz / R;
  out.depth = D - pz;
  return out;
}

/** Upright card axes for a normal: z = normal, x = east (Y × z), y = z × x. Polaroids never roll. */
export function cardBasis(n) {
  const z = n;
  let x = [z[2], 0, -z[0]]; // Y × z
  const len = Math.hypot(x[0], x[1], x[2]) || 1;
  x = [x[0] / len, 0, x[2] / len];
  const y = [z[1] * x[2] - z[2] * x[1], z[2] * x[0] - z[0] * x[2], z[0] * x[1] - z[1] * x[0]];
  return { x, y, z };
}

// ── The four strips ──────────────────────────────────────────────────────────────────────────────

/**
 * The strips, clockwise: H1 top (starts at the top-left corner), V2 right (top-right), H2 bottom (bottom-right),
 * V1 left (bottom-left). Distances are pixels along the ring. Each strip stops one card short of the next
 * corner, because that corner's card belongs to the next strip.
 */
export function stripLayout(frame) {
  const { ring, metrics: m } = frame;
  const c = ring.corners;
  const make = (id, horizontal, from, nextCorner) => {
    const pitch = (horizontal ? m.cardW : m.cardH) * (1 + CARD_GAP);
    const limit = nextCorner - pitch;
    const count = Math.max(1, Math.floor((limit - from) / pitch + 1e-6) + 1);
    return { id, horizontal, from, limit, pitch, count, span: Math.max(0, limit - from) };
  };
  return [
    make('H1', true, c.TL, c.TR),
    make('V2', false, c.TR, c.BR),
    make('H2', true, c.BR, c.BL),
    make('V1', false, c.BL, ring.total),
  ];
}

/**
 * Distance along the ring of slot `slot` (fractional while scrolling). With fewer items than slots the cards are
 * spread out (up to 2.4× the normal pitch) and centred; with more, the strip scrolls.
 */
export function slotDistance(strip, slot, itemCount) {
  if (itemCount >= strip.count) return strip.from + slot * strip.pitch;
  const pitch = itemCount > 1 ? Math.min(strip.pitch * 2.4, strip.span / (itemCount - 1)) : 0;
  const mid = strip.from + strip.span / 2;
  return mid + (slot - (itemCount - 1) / 2) * pitch;
}
