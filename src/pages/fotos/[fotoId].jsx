// "/fotos/:fotoId" — one static page per foto in constants/index.js.
import Head from 'next/head';
import FotoPage from '@/views/templates/FotoPage.jsx';
import { allFotos, getFotoById } from '@/constants/index.js';

export async function getStaticPaths() {
  return { paths: allFotos.map((f) => ({ params: { fotoId: f.id } })), fallback: false };
}

export async function getStaticProps({ params }) {
  const foto = getFotoById(params.fotoId);
  if (!foto) return { notFound: true };
  return { props: { fotoId: foto.id, title: foto.title } };
}

export default function FotoRoute({ fotoId, title }) {
  return (
    <>
      <Head>
        <title>{`${title} · Kaden Ng`}</title>
      </Head>
      <FotoPage fotoId={fotoId} />
    </>
  );
}
