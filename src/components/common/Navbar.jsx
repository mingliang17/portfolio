// src/components/common/Navbar.jsx
// SIMPLIFIED: Always visible, opacity changes on hover only

import { useState, useEffect, forwardRef } from 'react';
import { useLocation } from 'react-router-dom';
import { navLinks } from '../../constants/index.js';
import { ICONS } from '../../assets/icons.js';

const NavItems = ({ mobile = false, onClick = () => {} }) => (
  <ul className={mobile ? "navbar-mobile-ul" : "navbar-desktop-ul"}>
    {navLinks.map((item) => (
      <li key={item.id} className={mobile ? "navbar-mobile-li" : "navbar-desktop-li"}>
        <a 
          href={item.href} 
          className={mobile ? "navbar-mobile-link" : "navbar-desktop-link"}
          onClick={onClick}
        >
          {item.name}
        </a>
      </li>
    ))}
  </ul>
);

const Navbar = forwardRef((props, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const location = useLocation();
  
  const isHomePage = location.pathname === '/' || location.pathname === '/home';

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'auto';
    return () => { document.body.style.overflow = 'auto'; };
  }, [isOpen]);

  // Close menu on Escape key
  useEffect(() => {
    const handleEscape = (e) => { 
      if (e.key === 'Escape') setIsOpen(false); 
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  return (
    <>
      {/* Main Navbar - SIMPLIFIED: Always visible */}
      <header 
        ref={ref}
        className={`navbar-header navbar-always-visible ${isHomePage ? 'transparent' : 'dark'}`}
        style={{
          opacity: isHovered || isOpen ? 1 : 0.4,
          transition: 'opacity 0.3s ease'
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="navbar-container">
          <div className="navbar-inner">
            <a href="/" className="navbar-brand">
              Kaden
            </a>

            <nav className="navbar-desktop-nav">
              <NavItems />
            </nav>

            {/* Mobile Menu Button */}
            <button 
              className="navbar-mobile-button"
              onClick={() => setIsOpen(!isOpen)}
              aria-label={isOpen ? 'Close menu' : 'Open menu'}
            >
              <img 
                src={isOpen ? ICONS.close : ICONS.menu} 
                alt=""
                className="navbar-mobile-icon"
              />
            </button>
          </div>
        </div>

        {isOpen && (
          <div className="navbar-mobile-overlay">
            <div className="navbar-mobile-content">
              <NavItems mobile onClick={() => setIsOpen(false)} />
            </div>
          </div>
        )}
      </header>
    </>
  );
});

export default Navbar;