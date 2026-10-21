// Shown while a client-only page (3D / WebGL) loads its code. Server-rendered into the HTML.
export default function PageLoading() {
  return <div style={{ minHeight: '100vh', background: '#000' }} aria-busy="true" />;
}
