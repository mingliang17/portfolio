// "/contact" — previously reachable only by accident (it was the router's catch-all page).
import Head from 'next/head';
import Contact from '@/sections/Contact.jsx';

export default function ContactRoute() {
  return (
    <>
      <Head>
        <title>Contact · Kaden Ng</title>
      </Head>
      <Contact />
    </>
  );
}
