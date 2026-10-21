// Any URL that matches no route. Static export writes this to /404.html.
import Head from 'next/head';
import Link from 'next/link';

export default function NotFound() {
  return (
    <>
      <Head>
        <title>Page not found · Kaden Ng</title>
      </Head>
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#050505', color: '#fff', textAlign: 'center', padding: '6rem 1rem 2rem' }}>
        <div>
          <p style={{ opacity: 0.5, letterSpacing: '0.2em' }}>404</p>
          <h1 style={{ fontSize: 'clamp(2rem, 6vw, 4rem)', fontWeight: 800, margin: '0.5rem 0 1.5rem' }}>Page not found</h1>
          <p style={{ marginBottom: '2rem', opacity: 0.7 }}>That page doesn’t exist, or the project hasn’t been published yet.</p>
          <Link href="/" style={{ color: '#f59e0b', marginRight: '1.5rem' }}>← Home</Link>
          <Link href="/contact" style={{ color: '#f59e0b' }}>Contact</Link>
        </div>
      </div>
    </>
  );
}
