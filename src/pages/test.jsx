// "/test" — 3D model smoke-test page (WebGL → client only).
import dynamic from 'next/dynamic';
import PageLoading from '@/components/common/PageLoading.jsx';

const TestModelSimple = dynamic(() => import('@/testing/TestModelSimple.jsx'), {
  ssr: false,
  loading: () => <PageLoading />,
});

export default function TestRoute() {
  return <TestModelSimple />;
}
