# Scroll end-to-end tests

Real-browser checks for the scroll system (Chromium via Playwright, Python). They drive real
wheel / keyboard / touch input against the dev server using the `?scrolldebug` engine handle
(`window.__scrollStage`).

```bash
pip install playwright && playwright install chromium
tests/e2e/run.sh routes.py                        # every URL: status, rendering, hydration errors, client-side nav
tests/e2e/run.sh scroll_mh1.py                    # long sections, wall, momentum, keys, nav, hash
tests/e2e/run.sh scroll_mh2.py                    # page-to-page flicks, deep links
tests/e2e/run.sh scroll_touch.py                  # real touch drags and flings
tests/e2e/run.sh scroll_resize_reduced_motion.py
```

By default the site is started with `next dev`. Test the other deployment modes with
`MODE=start tests/e2e/run.sh ...` (`next build` + `next start`) or `MODE=static tests/e2e/run.sh ...`
(`build:static` + a static-host-like server); add `SKIP_BUILD=1` to reuse an existing build.

Each prints `PASS`/`FAIL` per check and `ALL PASS` at the end, and exit with status 0 only if everything passed.
The pure logic has fast unit tests too: `npm test`.

## Notes for maintainers

- **Cheap mode** (`launch()` default): blocks `.glb`/`.gltf` and images, strips filters,
  `backdrop-filter`, animations and carousel content. This is deliberate. These tests check
  *engine logic*, and the gesture timing (`settleDelay` = 120 ms) is only meaningful when
  frames are fast. In software-rendered headless Chromium the carousel alone drops to ~2 fps,
  which spaces synthetic wheel events more than 120 ms apart and turns one "swipe" into several
  gestures. Pass `launch(p, models=True)` for real-asset runs (slow; screenshots only).
- Section ids, lengths and totals (`23.75` screens for `mh1`) come from `projectsData.js`;
  update the expectations if the project data changes.
- A stubbed HDR is served for `*.hdr` because drei's `<Environment preset>` fetches from a CDN.
