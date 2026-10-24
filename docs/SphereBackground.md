# Sphere background

A fixed canvas behind the whole site (`src/sphere/`, mounted in `_app.jsx`): a light-gray vector
sphere, zoomed in so only the **centre 30%** of it is visible.

* **Fixed camera, vertical motion.** Scrolling rolls the sphere about the horizontal screen axis by
  **45° per page length** (one viewport height), so every point on it moves straight up the screen.
  For that to read as clean vertical movement, each pattern's lattice is aligned with the roll axis
  (its pole sits on that axis): lines run along or across the motion, never diagonally. Do not tilt a
  pattern's pole off that axis — the lattice would turn as it rolls (the diagonal zig-zag). `radial` is
  the one exception: its pole is on screen at scroll 0 and rolls away upwards.
* **Zoom.** `VISIBLE_FRACTION` in `sphere/math.js` (0.3): the viewport's longer side spans this fraction of
  the sphere's diameter. Lower = more zoomed-in/flatter; higher = more curvature.
* **Rotation.** `DEGREES_PER_SCREEN` (45).
* **Patterns** (`sphere/patterns.js`, drawn by `sphere/live.js` for the visible patch only):
  `geodesic` (triangles + nodes), `hex` (honeycomb + nodes), `latlong` (square-celled grid + nodes),
  `globe` (equal-angle parallels and meridians), `radial` (rings and spokes to a hub), `rhombus`
  (diamond lattice + nodes), `scan` (dotted lines), `dust`.
* **Where each appears.** Per section: `sphere: '<name>'` on the section (project pages), else by section
  type, section id, then route — tables in `sphere/config.js`. Add a pattern by writing a `draw(f, sink)`
  function in `live.js` and listing it in `patterns.js`.
* **Showing through.** Sections that should show the sphere need a transparent background (see
  `sphere.css`). Pages with their own full-screen image (contact, fotos, the spin and carousel sections)
  cover it by design.

## Shelved: the home camera intro

The viewfinder intro on the home page is switched off, not removed: `SHOW_CAMERA_INTRO` in
`src/views/Home.jsx` (`false`). Set it to `true` to bring it back unchanged.
