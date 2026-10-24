// src/pages/_app.jsx — wraps every route. Global CSS may ONLY be imported here (Pages Router rule).
import { useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

import '@fortawesome/fontawesome-free/css/all.min.css';
import '@/styles/index.css';

import Navbar from '@/components/common/Navbar.jsx';
import { useNavbarHeight } from '@/hooks/index.js';
import SphereBackground from '@/sphere/SphereBackground.jsx';

export default function App({ Component, pageProps }) {
  const navRef = useRef(null);
  useNavbarHeight(navRef);
  const { pathname } = useRouter(); // route pattern, e.g. '/projects/[project_id]' (picks the sphere pattern)

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Kaden Ng</title>
      </Head>
      {/* Fixed vector-sphere background; pages/sections above it are transparent (see sphere.css). */}
      <SphereBackground route={pathname} />
      <main className="w-full relative">
        <Navbar ref={navRef} />
        <Component {...pageProps} />
      </main>
    </>
  );
}
