# Deploying

The same code deploys two ways. **Both are tested** (see "What was verified" at the bottom).

| | A. Static export | B. Node.js server |
|---|---|---|
| Command | `npm run build:static` | `npm run build` then `npm start` (or `node server.js`) |
| Result | a folder of plain files (`out/`) | a running Node process |
| Needs on the host | any web server (Apache, nginx, LiteSpeed, S3…) | Node.js ≥ 20.9 |
| Same site? | yes | yes |

**Which one?** Every page on this site is generated at build time (there is no server-side rendering,
database or API route), so the two produce the same website. Use **A** unless your host or plan
specifically wants a Node app. It works on the cheapest shared plan and has nothing to keep running.
Use **B** if you want a Node process (for example because you plan to add API routes later).

> **hosting.com:** I could not find hosting.com's own documentation on Node.js support, and I have not
> deployed to their platform. Which option applies depends on your plan: if the control panel has a
> Node.js application option (often called "Setup Node.js App" or "Node.js Selector") or you have a
> VPS, B is available; otherwise use A. Check your plan's Node.js version is **≥ 20.9** before choosing B.

---

## Before either: run it locally

```bash
npm install
npm run dev            # http://localhost:3000
```

Check these URLs. Each should load, and the last two should show the "Page not found" page:

`/` · `/home` · `/projects/mh1` · `/projects/mh2` · `/fotos/foto-au-1` · `/contact` · `/test` · `/projects/nope` · `/nope`

---

## A. Static export (works on any host)

```bash
npm run build:static   # writes ./out
npm run serve:static   # optional: preview ./out at http://localhost:4000 like a real host
```

1. Upload the **contents** of `out/` (not the folder itself) into your site's web root, usually `public_html/`.
2. **Include the hidden file `.htaccess`** (and `_next/static/.htaccess`). In cPanel File Manager enable
   *Settings → Show Hidden Files*; most FTP clients have a "show hidden files" option. It sets the 404 page,
   compression and caching. Without it the site still works, only slower to load and with the host's default 404 page.
3. Open the URLs from the checklist above on your real domain.

How routing works without a server: every route is its own `folder/index.html` (for example
`out/projects/mh1/index.html`), so `https://yoursite.com/projects/mh1/` is served by the web server's normal
directory handling and **no rewrite rules are needed**. `/projects/mh1` (no slash) is redirected to the slash
form by the server automatically. Unknown URLs get `404.html` with a real 404 status.

**Size:** `out/` is ~310 MB because it contains everything in `public/` (3D models, and ~286 MB of images under
`assets/`). Check your plan's disk and upload limits. Compressing the large images (see
`docs/ImageOptimisation.md`) is the biggest win for both upload size and page load.

### Hosting in a sub-folder (e.g. `https://example.com/portfolio/`)

```bash
NEXT_PUBLIC_BASE_PATH=/portfolio npm run build:static     # Windows PowerShell: $env:NEXT_PUBLIC_BASE_PATH="/portfolio"; npm run build:static
```

Upload the contents of `out/` into the `portfolio/` folder, and edit `.htaccess` so the error page reads
`ErrorDocument 404 /portfolio/404.html`.

---

## B. Node.js server

```bash
npm install
npm run build
npm start              # next start, http://localhost:3000   (or: PORT=8080 npm start)
```

`server.js` does the same thing but as an explicit startup file, which is what Node hosts that ask for an
"application startup file" want:

```bash
NODE_ENV=production PORT=3000 node server.js
```

### cPanel-style "Setup Node.js App"

1. Create the application: choose Node **≥ 20.9**, set the application root (e.g. `portfolio`),
   the application URL (your domain), and the startup file `server.js`.
2. Shared plans often limit build memory. The safest route is to **build on your own computer**, then upload:
   `.next/`, `public/`, `package.json`, `package-lock.json`, `next.config.mjs`, `server.js`.
3. In the panel click **Run NPM Install** (or run `npm install --omit=dev` in the app's terminal).
4. Set environment variable `NODE_ENV=production` (and `NEXT_PUBLIC_BASE_PATH` only if you use a sub-path,
   and it must also have been set when you ran `npm run build`).
5. Restart the app and run the URL checklist.

### VPS

```bash
npm install && npm run build
npm install -g pm2
pm2 start server.js --name portfolio    # env: PORT=3000 NODE_ENV=production
pm2 save && pm2 startup
```

Then reverse-proxy your domain to `127.0.0.1:3000` (nginx: `location / { proxy_pass http://127.0.0.1:3000; proxy_set_header Host $host; }`)
and add HTTPS (e.g. certbot).

---

## Configuration

| Variable | When | Meaning |
|---|---|---|
| `NEXT_PUBLIC_BASE_PATH` | build time | Host under a sub-path, e.g. `/portfolio`. Must be set for the **build**, not just at runtime. |
| `BUILD_TARGET=static` | build time | Set for you by `npm run build:static`. |
| `PORT` | runtime (Node) | Port to listen on. Hosts usually set it themselves. |
| `NODE_ENV=production` | runtime (Node) | Set for production. |

The routing and build options live in `next.config.mjs`; routes are the files in `src/pages/`.

## Adding pages

- **A new project or foto:** add it to `src/constants/projectsData.js` / `src/constants/index.js`.
  Its URL is generated automatically (`getStaticPaths`). Rebuild and redeploy.
- **A new top-level page:** add a file to `src/pages/` (e.g. `about.jsx` → `/about`).

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `/projects/mh1` works but refreshing a deep page gives a 404 (static) | You uploaded the `out` *folder* inside `public_html` instead of its contents, or the `projects/mh1/index.html` files didn't upload. |
| Page loads but 3D models/images 404 | Sub-path hosting without `NEXT_PUBLIC_BASE_PATH` at build time. |
| Everything is slow / models re-download every visit | `.htaccess` wasn't uploaded (hidden file) or your server ignores it. |
| Node app won't start: "requires Node.js ≥ 20.9" | Select a newer Node version in the panel. |
| `next build` is killed on a shared host | Out of memory. Build locally and upload the build (step 2 above). |
| Contact form does nothing | It uses EmailJS; check that its keys in `src/sections/Contact.jsx` are valid. |

## Known caveats

- **React 18 is deprecated in Next.js 16** and will be dropped in Next.js 17 (the build prints a warning).
  Staying on React 18 was deliberate: the 3D code uses `@react-three/fiber` 8, which needs React 18.
  The upgrade path is React 19 + `@react-three/fiber` 9 + `@react-three/drei` 10. It is a separate,
  testable task and should be done before moving to Next.js 17.
- The Pages Router is used (not the App Router) for the same reason: Next's App Router bundles its own
  React 19, which `@react-three/fiber` 8 can't run on.

## What was verified

All run against real Chromium with real input (`tests/e2e/`):

- `next dev`, `next build` + `next start`, and the static export each serve every route with the right
  status (200 for pages, 404 for unknown projects/fotos/URLs), with no hydration or runtime errors.
- `server.js` serves the pages, returns real 404s, redirects `/x` → `/x/`, and sends immutable cache headers for models.
- Client-side navigation (navbar links, Back button) works without a full reload.
- The scroll system's end-to-end suites pass on `next dev` and on the static export.
- A static export built with `NEXT_PUBLIC_BASE_PATH=/portfolio` loads every page with zero failed requests.

**Not verified:** an actual deployment to hosting.com (no access), Apache `.htaccess` behaviour on a live
server (tested with an equivalent Node static server instead), Safari and Firefox.
