import { HashRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect, useRef } from "react";

import Navbar from "./sections/Navbar.jsx";
import Hero from "./sections/Hero.jsx";
import About from "./sections/About.jsx";
import Projects from "./sections/Projects.jsx";
import Clients from "./sections/Clients.jsx";
import Contact from "./sections/Contact.jsx";
import Footer from "./sections/Footer.jsx";
import Experience from "./sections/Experience.jsx";
import Home from "./sections/Home.jsx";
import ProjectMH1 from "./sections/projects/ProjectMH1.jsx";

const App = () => {
  const navRef = useRef(null);

  useEffect(() => {
    const updateNavbarHeight = () => {
      const navbar = navRef.current;
      if (!navbar) return;
      
      // Force the navbar to be visible for measurement
      const originalStyle = navbar.style.cssText;
      navbar.style.opacity = '1';
      navbar.style.transform = 'translateY(0)';
      navbar.style.pointerEvents = 'auto';
      
      const navHeight = navbar.offsetHeight || 0;
      document.documentElement.style.setProperty('--nav-height', `${navHeight}px`);
      console.log('Navbar height calculated:', navHeight);
      
      // Restore original styles
      navbar.style.cssText = originalStyle;
    };

    // Calculate multiple times to ensure accuracy
    updateNavbarHeight();
    const timer1 = setTimeout(updateNavbarHeight, 100);
    const timer2 = setTimeout(updateNavbarHeight, 500);

    const handleResize = () => {
      updateNavbarHeight();
    };
    
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <main className="w-full relative">
      <Router>
        <Navbar ref={navRef} />
        
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/hero" element={<Hero />} />
          <Route path="/about" element={<About />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/work" element={<Experience />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/projects/MH1" element={<ProjectMH1 />} />
          <Route path="*" element={<h1>404 Not Found</h1>} />
          <Route path="/footer" element={<Footer />} />
        </Routes>
      </Router>
    </main>
  );
};

export default App;