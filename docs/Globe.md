# The home-page globe

A vector world globe (flat-coloured countries, visible borders, atmosphere glow), a ring of constellations
drifting around it, and a polaroid menu that opens down both sides when you pick something.

```
public/data/countries-50m.json     country shapes (TopoJSON, Natural Earth 1:50m, 240 countries)
scripts/build-globe-data.mjs       regenerates that file (only needed to update the data)
public/assets/constellations/      placeholder images for the constellations' test projects and snaps
src/constants/constellations.js    the constellation shapes + their PLACEHOLDER projects and snaps
src/globe/                         pure modules, unit-tested in Node
  topo.js                          TopoJSON → countries, borders; antimeridian + pole handling; point-in-polygon
  geo.js                           lon/lat ↔ 3D, "turn to face a country", camera distance, densified lines
  tessellate.js                    triangle mesh of one country (for the hover / selection highlight)
  constellationRing.js             where the constellations sit; how the camera flies to one
  themes.js, constants.js          Day / Neutral / Night palettes; globe size and field of view
  landCanvas.js, useWorld.js       paints the country-fill texture; loads and decodes the data
  uiState.js                       tiny shared flags (pointer over a polaroid? where are the columns?)
src/components/home/
  Earth.jsx                        the scene: drag, auto-rotate, hover, select, zoom, pins, stars, constellations
  Constellations.jsx               draws the constellations (glowing stars, lines, halo, hit area)
  globe/GlobeParts.jsx             ocean + land shader, atmosphere, borders, highlight
  StripCarousel.jsx                the polaroid menu (its own canvas, over the globe)
src/utils/stripFrame.js            the polaroid columns' layout and hand-made wobble (pure, tested)
```

## How it behaves

* **Turn the globe yourself.** Drag with the mouse or a finger (with inertia), or use the arrow keys. It also turns
  slowly on its own after a couple of seconds without interaction, and pauses while the pointer is over a country
  or something is open. North always stays up.
* **Hover** any country: it lights up and a tooltip follows the pointer (flag, name, and how much work there is).
* **Only places with work can be opened.** A country (or constellation) with projects or snaps shows a pointer cursor
  and "n projects · n snaps"; one without says "no projects or snaps yet" and is hover-only.
* **Open one** by clicking it (or a pin): a country is turned to face you and the camera moves in until it fits the
  gap between the two polaroid columns; a constellation is flown to the same way. The polaroids fly in.
* **Leave** with the ✕ in the badge, `Esc`, or a click on empty space: the camera moves back out.
* Day / Neutral / Night switch the palette.

Countries are matched to `globeProjects` in `constants/index.js` by their **ISO 3166-1 alpha-2 code** (`iso`, lower
case). To add a country with work, give it an `iso` and a `lat`/`lon` for its pin.

## The polaroid menu

Two straight vertical columns, one either side of the globe: **projects on the left, snaps on the right**. Each card
is a little crooked (a small rotation, a little drift sideways and up or down, a hair of size change), always the same
for the same card, so the line reads as pinned up by hand. A thin string runs through the pins. The cards leave 10% of
the screen empty outside them and scale with the screen. Move the mouse along a column, use the wheel over it, or
drag it with a finger to scroll; it stops at both ends. A card straightens up and grows when you point at it.

The selected place's own work comes first (`getSortedProjects` / `getSortedFotos`); everything that belongs
elsewhere stays in the columns but is lightly greyed out (colour drained, slightly dimmed).

Tuned by constants at the top of `src/utils/stripFrame.js`:

| constant | default | meaning |
|---|---|---|
| `FRAME_MARGIN` | `0.1` | empty border outside the columns, as a fraction of the screen |
| `CARD_HEIGHT_FRAC` | `0.15` | card height as a fraction of the screen's shorter side |
| `CARD_GAP` | `0.03` | how close neighbours sit (pitch = height × (1 + gap)) |
| `MAX_ROTATION` / `MIN_ROTATION` | `6°` / `1.2°` | how crooked the cards are |
| `MAX_SPREAD` | `1.7` | with few cards, how far apart they spread |

How much a place is greyed out: `GRAY_AMOUNT` and `GRAY_DIM` in `StripCarousel.jsx`.

## Constellations

Eight constellations lie flat on a plane behind the globe and turn **anticlockwise in 2D** around it
(`RING_SPEED` in `src/globe/constellationRing.js`; they pause while you point at one or one is open). Stars glow
and twinkle, thin lines join them, and a soft halo surrounds each figure: **warm gold for constellations with
work, cool blue for those without**. They behave like countries: hover for a tooltip, click one with work to fly
the camera to it and open the polaroid menu.

The shapes and the PLACEHOLDER work are in `src/constants/constellations.js`: Orion (2 projects, 3 snaps), Ursa Major
(1, 2), Cassiopeia (0, 2), and Cygnus (1 project) have some; Scorpius, Lyra, Crux and Gemini have none.
To give a constellation real work, add items whose `country` is the constellation's `name` (the same field the real
projects and photos use), then delete the placeholders. To add a constellation, add an entry with star coordinates
(x right, y up, about −1…1) and `lines` (pairs of star indices). The globe is smaller than it was so the ring has
room (`BASE_SILHOUETTE` in `src/globe/constants.js`).

## The data

`public/data/countries-50m.json` is Natural Earth's 1:50m admin-0 countries (public domain) in the `world-atlas`
TopoJSON, with an ISO code and a short name added, and duplicate entries merged. Borders follow Natural Earth's
conventions for disputed areas. To regenerate:

```
npm i --no-save world-atlas i18n-iso-countries
node scripts/build-globe-data.mjs
```

Two quirks of the source are handled in `topo.js`: polygons that cross the antimeridian (Russia's far east, Fiji)
are unwrapped, and Antarctica's coastline, which encloses the pole, is closed through it. Both are covered by tests
(`src/globe/globe.test.mjs` checks that every country's area on the sphere matches reality).

## A note on dragging

The pointer handler listens on the element R3F itself listens on (`events.connected` in `Earth.jsx`), not on the
`<canvas>` and not on `canvas.parentElement`. The theme toggle (`<Html fullscreen>`) is laid over the whole canvas in
a container that is a *sibling* of the canvas's own container, so a press lands on that overlay and never reaches the
canvas or its parent; only the outer R3F element sees it bubble. (Hover still worked either way, because R3F listens
there too, which is why a broken drag is easy to miss.) The cursor is set on the same element so the overlay inherits it.

## Tests

`npm test` covers the globe maths (conventions agree with three.js `SphereGeometry`, picking, framing, tessellation
area, border densifying), the polaroid layout (10% buffer, columns, scrolling, the seeded wobble), the constellation
ring (anticlockwise, no overlaps at any screen shape or ring angle, fly-to projection) and the constellation data
(valid shapes, some with work and some without, real images and links).
