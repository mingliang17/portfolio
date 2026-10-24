// "/projects/:project_id" — one static page per project in constants/projectsData.js.
// Add a project there and it becomes routable automatically (dev, `next start` and static export).
import dynamic from 'next/dynamic';
import Head from 'next/head';
import PageLoading from '@/components/common/PageLoading.jsx';
import { getProjectById, getProjectIds } from '@/constants/projectsData.js';
import { projectTitle } from '@/projects/normalize.js';

// The scroll stage drives WebGL canvases and reads window size: client-only.
const ProjectPage = dynamic(() => import('@/views/templates/ProjectPage.jsx'), {
  ssr: false,
  loading: () => <PageLoading />,
});

export async function getStaticPaths() {
  return {
    paths: getProjectIds().map((project_id) => ({ params: { project_id } })),
    fallback: false, // unknown ids → 404 (required for static export)
  };
}

export async function getStaticProps({ params }) {
  const project = getProjectById(params.project_id);
  if (!project) return { notFound: true };
  const title = projectTitle(project);
  return { props: { projectId: params.project_id, title } };
}

export default function ProjectRoute({ projectId, title }) {
  return (
    <>
      <Head>
        <title>{`${title} · Kaden Ng`}</title>
      </Head>
      <ProjectPage projectId={projectId} />
    </>
  );
}
