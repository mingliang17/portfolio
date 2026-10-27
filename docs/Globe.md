# The home-page globe

A vector world globe (flat-coloured countries, visible borders, atmosphere glow) with a polaroid frame that
appears around it when a country is selected.

```
public/data/countries-50m.json     country shapes (TopoJSON, Natural Earth 1:50m, 240 countries)
scripts/build-globe-data.mjs       regenerates that file (only needed to update the data)
src/globe/                         pure modules, unit-tested in Node
  topo.js                          TopoJSON → countries, borders; antimeridian + pole handling; point-in-polygon
  geo.js                           lon/lat ↔ 3D, "turn to face a country", camera distance, densified lines
  tessellate.js                    triangle mesh of one country (for the hover / selection highlight)
  themes.js                        Day / Neutral / Night palettes
  constants.js                     globe size, field of view
  landCanvas.js, useWorld.js       paints the country-fill texture; loads and decodes the data
  uiState.js                       tiny shared flags (is the pointer over a polaroid? was the globe dragged?)
src/components/home/
  Earth.jsx                        the globe scene: drag, auto-rotate, hover, select, zoom, pins, stars
  globe/GlobeParts.jsx             ocean + land shader, atmosphere, borders, highlight
  StripCarousel.jsx                the polaroid frame (its own canvas, over the globe)
src/utils/stripFrame.js            the frame's layout maths (pure, tested)
```

## How it behaves

* **Drag** to turn the globe (with inertia); north always stays up. It turns slowly by itself after a couple of
  seconds without interaction, and pauses while the pointer is over a country or one is selected.
* **Hover** a country: it lights up and a tooltip follows the pointer (flag, name, and how many projects / snaps).
* **Click any country** (or a pin): the globe turns to centre it and the camera moves in until the country fits
  the opening of the polaroid frame, while the polaroids fly in around the edge. Countries with work are tinted
  and have a pin whose height reflects how much there is. A country with no work says so in the badge; the frame
  still shows the work, ordered with the selected country's first (`getSortedProjects` / `getSortedFotos`).
* **Leave** with the ✕ in the badge, `Esc`, or by clicking the open sea: the camera moves back out.
* Day / Neutral / Night switch the palette.

Countries are matched to `globeProjects` in `constants/index.js` by their **ISO 3166-1 alpha-2 code** (`iso`, lower
case). To add a country with work, give it an `iso` and a `lat`/`lon` for its pin.

## The polaroid frame

The cards run along a **rounded rectangle that leaves 10% of the screen empty on every side**, laid out in screen
space so it fills any aspect ratio (laptop, ultrawide, phone). Behind each point of that ring is a big sphere
centred on the globe; each card sits on it, tangent to it, so the cards in the middle of a side face you and
those towards the corners turn away and narrow: a rectangle wrapped around an oval. Each strip owns one corner
and stops one card short of the next (a pinwheel), so the four interlock. With more items than slots a strip
scrolls as you move along it; with fewer, the cards spread out and centre.

All of it is tuned by a few constants at the top of `src/utils/stripFrame.js`:

| constant | default | meaning |
|---|---|---|
| `FRAME_MARGIN` | `0.1` | empty border on every side, as a fraction of the screen |
| `CARD_HEIGHT_FRAC` | `0.15` | card height as a fraction of the screen's shorter side |
| `CURVATURE` | `0.7` | `0` = cards face the camera, `1` = fully tangent to the sphere |
| `RING_SQUARENESS` | `3.4` | `2` = ellipse, larger = more rectangular |
| `MAX_TILT` | `62°` | how far the most turned-away card is from facing you |

Camera and sizes of the globe itself: `src/globe/constants.js` (`BASE_SILHOUETTE` is how big it is at rest) and the
zoom easing in `Earth.jsx`.

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

## Tests

`npm test` covers the globe maths (conventions agree with three.js `SphereGeometry`, picking, framing, the
tessellation's area, border densifying) and the frame layout (10% buffer at every aspect ratio, ring on a sphere,
pinwheel ownership, slot spreading).
