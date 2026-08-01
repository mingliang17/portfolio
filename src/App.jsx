import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import React, { lazy, Suspense, useRef } from 'react';

import { useNavbarHeight } from './hooks/index.js';
import Navbar from './components/common/Navbar.jsx';
import Contact from './sections/Contact.jsx';
import ProjectPage from './pages/templates/ProjectPage.jsx';
import TestModelSimple from '@/testing/TestModelSimple.jsx';
import FotoPage from './pages/templates/FotoPage.jsx';

const Home = lazy(() => import('./pages/Home.jsx'));
// const Earth = lazy(() => import('./pages/projects/Earth.jsx'));

// Derived from Vite's `base` config (see vite.config.mjs). This is '/' for a
// normal build hosted at a domain root, or '/portfolio/' for the GitHub
// Pages build. React Router's basename should not have a trailing slash.
const basename = import.meta.env.BASE_URL.replace(/\/$/, '');

const App = () => {
  const navRef = useRef(null);
  useNavbarHeight(navRef);

  return (
    <main className="w-full relative bg-gray-400">
      <Router basename={basename}>
        <Navbar ref={navRef} />
        <Suspense fallback={<div>Loading...</div>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/home" element={<Home />} />
            <Route path="/projects/:project_id" element={<ProjectPage />} />
            <Route path="/fotos/:fotoId" element={<FotoPage />} />
            <Route path="/test" element={<TestModelSimple />} />
            <Route path="*" element={<Contact />} />

          </Routes>
        </Suspense>
      </Router>
    </main>
  );
};

export default App;