import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import React, { lazy, Suspense, useRef } from 'react';

import { useNavbarHeight } from './hooks/index.js';
import Navbar from './components/common/Navbar.jsx';
import Contact from './sections/Contact.jsx';
import ProjectPage from './pages/templates/ProjectPage.jsx';

const Home = lazy(() => import('./pages/Home.jsx'));
// const Earth = lazy(() => import('./pages/projects/Earth.jsx'));

const App = () => {
  const navRef = useRef(null);
  useNavbarHeight(navRef);

  return (
    <main className="w-full relative">
      <Router basename="portfolio">
        <Navbar ref={navRef} />
        <Suspense fallback={<div>Loading...</div>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/home" element={<Home />} />
            <Route path="/projects/:project_id" element={<ProjectPage />} />
            <Route path="*" element={<Contact />} />
          </Routes>
        </Suspense>
      </Router>
    </main>
  );
};

export default App;
