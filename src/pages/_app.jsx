// src/pages/_app.jsx — wraps every route. Global CSS may ONLY be imported here (Pages Router rule).
import { useRef } from 'react';
import Head from 'next/head';

import '@fortawesome/fontawesome-free/css/all.min.css';
import '@/styles/index.css';

import Navbar from '@/components/common/Navbar.jsx';
import { useNavbarHeight } from '@/hooks/index.js';

export default function App({ Component, pageProps }) {
  const navRef = useRef(null);
  useNavbarHeight(navRef);

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Kaden Ng</title>
      </Head>
      <main className="w-full relative bg-gray-400">
        <Navbar ref={navRef} />
        <Component {...pageProps} />
      </main>
    </>
  );
}
