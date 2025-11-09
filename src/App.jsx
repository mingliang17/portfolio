// import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// HashRouter is better for GitHub Pages and other static hosting, use Browser when you have server control
import { HashRouter as Router, Routes, Route } from "react-router-dom";


import Navbar from "./sections/navbar.jsx";
import Hero from "./sections/hero.jsx";
import About from "./sections/About.jsx";
import Projects from "./sections/Projects.jsx";
import Clients from "./sections/Clients.jsx";
import Contact from "./sections/Contact.jsx";
import Footer from "./sections/Footer.jsx";
import Experience from "./sections/Experience.jsx";
import Home from "./sections/Home.jsx";

const App = () => {
  return (
    <main className="w-full relative border-4 border-red-400">
      <Router>
        <Navbar />

        <Routes>
          {/* Main Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/hero" element={<Hero />} />
          <Route path="/about" element={<About />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/work" element={<Experience />} />
          <Route path="/contact" element={<Contact />} />

          {/* Catch-all for unmatched routes */}
          <Route path="*" element={<h1>404 Not Found</h1>} />
        </Routes>

        <Footer />
      </Router>
    </main>
  );
};

export default App;
