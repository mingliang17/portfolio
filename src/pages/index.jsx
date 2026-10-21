// "/"  — the globe home page. WebGL, so it renders on the client only.
import dynamic from 'next/dynamic';
import PageLoading from '@/components/common/PageLoading.jsx';

const Home = dynamic(() => import('@/views/Home.jsx'), { ssr: false, loading: () => <PageLoading /> });

export default function IndexPage() {
  return <Home />;
}
