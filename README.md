# Portfolio

A 3D, scroll-driven portfolio built with **Next.js** (Pages Router), React, three.js / react-three-fiber and GSAP.

```bash
npm install
npm run dev          # http://localhost:3000
```

Requires **Node.js ≥ 20.9**.

## Routes

| URL | Source | Notes |
|---|---|---|
| `/` and `/home` | `src/pages/index.jsx`, `home.jsx` | Globe home page (WebGL, client-only) |
| `/projects/:project_id` | `src/pages/projects/[project_id].jsx` | One page per project in `src/constants/projectsData.js` (`mh1`, `mh2`) |
| `/fotos/:fotoId` | `src/pages/fotos/[fotoId].jsx` | One page per foto in `src/constants/index.js` |
| `/contact` | `src/pages/contact.jsx` | Contact form |
| `/test` | `src/pages/test.jsx` | 3D model smoke test |
| anything else | `src/pages/404.jsx` | Real HTTP 404 |

Add a project to `projectsData.js` (or a foto to `constants/index.js`) and its URL exists automatically,
in dev, in the Node server and in the static export.

## Project layout

```
src/pages/        routes only (thin) — Next.js turns every file here into a URL
src/views/        the page components the routes render (Home, ProjectPage, FotoPage)
src/sections/     section components (hero, spin, explode, carousel, ...)
src/scroll/       the scroll engine — see docs/ScrollArchitecture.md
src/constants/    project and foto data
public/           static files served as-is (3D models, textures, images)
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server with hot reload |
| `npm run build` / `npm start` | Production build / Node.js server |
| `npm run start:server` | Same server via `server.js` (for hosts that want a startup file, e.g. cPanel Node.js apps) |
| `npm run build:static` | Static export into `out/` (upload to any web host) |
| `npm run serve:static` | Preview `out/` locally like a typical web host |
| `npm test` | Unit tests for the scroll logic |

Deploying: **[docs/Deployment.md](docs/Deployment.md)**. Scroll system: **[docs/ScrollArchitecture.md](docs/ScrollArchitecture.md)**.
Browser tests: `tests/e2e/README.md`.
