
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HashRouter } from 'react-router-dom';
import { lazy, Suspense } from 'react';

import React, { useEffect, useRef } from 'react';
import {useNavbarHeight} from './hooks/index.js';
import Navbar from './sections/Navbar.jsx';
import Contact from './sections/Contact.jsx'

const Home = lazy(() => import('./pages/Home.jsx'));
const Mh1 = lazy(() => import('./pages/projects/Mh1.jsx'));

const Earth = lazy(() => import('./components/3d/Earth.jsx'));

const App = () => {
  const navRef = useRef(null);
  useNavbarHeight(navRef);

  return (
    <main className="w-full relative">
      <Router basename="portfolio">
        <Navbar ref={navRef} />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/projects/mh1" element={<Mh1 />} />
          <Route path="*" element={<Contact />} />
        </Routes>
      </Router>
    </main>
  );
};

export default App;