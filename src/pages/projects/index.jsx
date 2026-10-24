// "/projects" — an index of every project in constants/projectsData.js (data-driven or bespoke).
import Head from 'next/head';
import Link from 'next/link';
import { ALL_PROJECTS } from '@/constants/projectsData.js';
import { projectTitle, projectCover } from '@/projects/normalize.js';
import { assetPath } from '@/utils/assetPath.js';

export default function ProjectsIndex() {
  const projects = Object.values(ALL_PROJECTS);
  return (
    <>
      <Head>
        <title>Work · Kaden Ng</title>
      </Head>
      <main className="pi-page">
        <header className="pi-head">
          <h1>Work</h1>
          <p>Selected projects. Each opens as its own scrolling page.</p>
        </header>
        <div className="pi-grid">
          {projects.map((p) => {
            const cover = projectCover(p);
            return (
              <Link key={p.id} href={`/projects/${p.id}`} className="pi-card">
                {cover ? <img className="pi-card__cover" src={assetPath(cover)} alt="" loading="lazy" /> : <div className="pi-card__cover" />}
                <div className="pi-card__body">
                  {p.tag && <p className="pi-card__tag">{p.tag}</p>}
                  <h2>{projectTitle(p)}</h2>
                  {p.summary && <p>{p.summary}</p>}
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </>
  );
}
