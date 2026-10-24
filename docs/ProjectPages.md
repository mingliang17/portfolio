# Project pages

Every project lives at `/projects/<id>` and is a **scroll stage**: a list of full-screen
sections the visitor scrolls through (see `ScrollArchitecture.md`), over the sphere
background (see `SphereBackground.md`). You can build a page at three levels of freedom.

| Level | You edit | Use it for |
|---|---|---|
| **1. Data-driven** | one `sections: [...]` array in the data file | most projects: reorder, repeat, mix any section types |
| **2. New section type** | one component + one `registerSectionType` call | a layout several projects will share |
| **3. Bespoke page** | one hand-written React file | a project that needs its own layout, mixed with templates |

`/projects` lists every project in `constants/projectsData.js` automatically.

```
src/
  constants/
    projectsData.js          ALL_PROJECTS — add a project here
    showcaseProjects.js      two placeholder projects: Atlas (level 1) and Lumen (level 3)
  projects/
    normalize.js             data → ordered section configs (pure, tested)
    sectionTypes.jsx         the section-type REGISTRY + section(type, config)
    buildSections.js         project → ScrollStage sections
    ProjectStage.jsx         ScrollStage + section dots
    customPages.js           id → bespoke page component
    blocks/                  layout sections (Split, Gallery, MediaSection, Stats, Timeline) + the Media image/video primitive
    pages/Lumen.jsx          a bespoke page
    index.js                 public API:  import { ProjectStage, section, Media } from '@/projects'
  views/templates/ProjectPage.jsx   picks data-driven or bespoke
  pages/projects/[project_id].jsx   the route (one static page per project)
  pages/projects/index.jsx          the /projects index
```

---

## 1. A data-driven page

Add an entry to `ALL_PROJECTS` (`constants/projectsData.js`):

```js
export const PROJECT_X = {
  id: 'x',                    // the URL: /projects/x
  title: 'X',                 // browser tab + /projects card
  tag: 'Research',            // small label on the /projects card (optional)
  summary: 'One sentence.',   // /projects card (optional)
  cover: 'assets/projects/x/cover.jpg',   // /projects card image (optional; else the hero's)
  sections: [
    { type: 'hero', title: 'X', subtitle: '…', image: 'assets/projects/x/hero.jpg' },
    { type: 'split', side: 'left', title: '…', body: ['…'], media: { type: 'image', src: 'assets/projects/x/a.jpg' } },
    { type: 'carousel', id: 'renders', images: [{ id: 1, image: 'assets/projects/x/r1.jpg', title: '…', description: '…' }] },
  ],
};
// …then add it to ALL_PROJECTS at the bottom of the file.
```

* The array is the page, in order. Types can repeat; give repeats an `id` if you want stable deep links
  (`#renders`); otherwise they get `split`, `split-2`, …
* `enabled: false` on an entry hides it without deleting it.
* Paths are **relative to `public/`** (`assets/projects/x/a.jpg`) or absolute URLs. Components resolve them
  with `assetPath()`, so sub-folder hosting keeps working.
* Videos: `{ type: 'video', src: '….mp4', poster: '….jpg' }`, or several formats with
  `sources: [{ src: '….webm', type: 'video/webm' }, { src: '….mp4', type: 'video/mp4' }]`.
  They are muted and loop, and play only while their section is on screen.
* The old object form (`sections: { hero: { enabled: true, … }, map: …, carousels: [...] }`, used by MH1/MH2)
  still works and is converted automatically.

### Section types

Every entry also accepts: `id`, `label` (nav dot tooltip), `sphere` (background pattern name),
`transition`, `transitionStyle`, `keepMounted` (see `ScrollStage.jsx`).

| `type` | Kind | Config |
|---|---|---|
| `hero` | page | `title`, `subtitle`, `image`, `apertureVideo?`, `overlayVideo?` (camera-viewfinder intro → polaroid) |
| `map` | page | `images`, `logos`, `description` (default to the project's `assets.map/logos`, `metadata`) |
| `model` | page | 3D model props (`modelUrl`, `scale`, `position`, `backgroundColor`: `'transparent'` shows the sphere) |
| `anime` | long | `length`, 3D animation props |
| `spin` | long | `checkpoints`, `modelUrl`, … |
| `explode` | long | `checkpoints`, `modelPath`, … |
| `appear` | long | `checkpoints`, `modelPath`, … |
| `carousel` | page | `title`, `images: [{ id, image, title, description, information }]` |
| `split` | page | `title`, `eyebrow?`, `body` (string or array), `facts?: [{ label, value }]`, `media`, `side: 'left' \| 'right'` (where the **text** goes) |
| `gallery` | page | `title?`, `items: [{ src, type?, alt?, caption?, span?: [cols, rows] }]`, `columns` (3), `rows?`, `layout: 'grid' \| 'mosaic'` |
| `media` | page | full-bleed `media`, `title?`, `eyebrow?`, `caption?`, `align: 'left' \| 'right' \| 'center'` |
| `stats` | page | `eyebrow?`, `statement`, `stats: [{ value, label }]` |
| `timeline` | long | `title?`, `eyebrow?`, `steps: [{ title, text, media }]`; scroll steps through them |
| `custom` | either | `Component`, `props`, `kind`, `length` (code only; see level 3) |

*page* = one screen. *long* = several screens of scrolling with a 0→1 `progress`;
`length` is how many screens (defaults are sensible), `checkpoints` makes scrolling settle on each step.

---

## 2. A new reusable section type

1. Write the component (take `isActive` / `isVisible` / `progress` from the scene; fill the parent;
   no `position: fixed/sticky`; keep its background transparent).
2. Register it in `sectionTypes.jsx` (or call `registerSectionType` from anywhere that runs before the page renders):

```jsx
registerSectionType('quote', (cfg) => ({
  kind: 'page',
  label: cfg.author,
  render: (scene) => <Quote {...cfg} isActive={scene.isActive} />,
}));
```

3. Give it a default background in `sphere/config.js` → `TYPE_PATTERNS` (`quote: 'dust'`), and add the name to
   `BUILT_IN_TYPES` in `normalize.js` (the tests check that the two lists agree).

Now `{ type: 'quote', author: '…' }` works in any project's `sections`.

---

## 3. A bespoke page

When a project needs its own layout, hand-write the page and still use the templates.

1. Create `src/projects/pages/MyProject.jsx`:

```jsx
import { useMemo } from 'react';
import { ProjectStage, section } from '@/projects';

export default function MyProject({ project }) {
  const sections = useMemo(() => [
    section('hero', { title: 'Mine', image: project.assets.hero }, project),   // ready-made
    { id: 'intro', label: 'Intro', kind: 'page', sphere: 'globe',               // written by hand
      render: (scene) => <MyIntro active={scene.isActive} /> },
    { id: 'study', label: 'Study', kind: 'long', length: 3, checkpoints: 3,     // scroll-driven
      render: (scene) => <MyStudy progress={scene.progress} /> },
    section('carousel', { id: 'renders', images: [...] }),                       // ready-made again
  ], [project]);
  return <ProjectStage id={project.id} sections={sections} />;
}
```

2. Register it in `customPages.js`: `myProject: MyProject`.
3. Point the project at it: `page: 'myProject'` in its data entry (keep `id`, `title`, `summary`, `cover` there
   so the index and the page title work).

`src/projects/pages/Lumen.jsx` is a complete example: four template sections, a typographic
overture and a scroll-driven "light study" written for that project alone.

### Scene object

`render(scene)` receives `{ isActive, isVisible, isNear, progress, … }` (see `ScrollStage.jsx`):
`isActive` – this is the section on screen; `isVisible` – any part is visible (during transitions);
`progress` – 0→1 through a `long` section.

---

## Background pattern per section

Each section sets the sphere pattern behind it: `sphere: 'hex'` on the entry (or spec).
When omitted, it comes from its type (`TYPE_PATTERNS` in `sphere/config.js`).
Names: `geodesic`, `hex`, `latlong`, `globe`, `radial`, `rhombus`, `scan`, `dust`.
For sections to show it, give them a transparent background.

## Tests

`npm test` covers the data layer (`src/projects/projects.test.mjs`): legacy and array forms, id
de-duplication, every built-in type implemented, and that **every image/video the showcase projects
reference exists in `public/`**.
