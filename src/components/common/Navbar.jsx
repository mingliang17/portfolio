import { useState, useEffect, forwardRef } from 'react';
import { useLocation } from 'react-router-dom';
import { navLinks } from '../../constants/index.js';
import { ICONS } from '../../assets/icons.js';

const Navbar = forwardRef((props, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const location = useLocation();
  
  const isHomePage = location.pathname === '/' || location.pathname === '/home';

  // Split links for the centered layout
  const midPoint = Math.ceil(navLinks.length / 2);
  const leftLinks = navLinks.slice(0, midPoint);
  const rightLinks = navLinks.slice(midPoint);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'auto';
    return () => { document.body.style.overflow = 'auto'; };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e) => { if (e.key === 'Escape') setIsOpen(false); };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  return (
    <header 
      ref={ref}
      className={`navbar-header ${isHomePage ? 'transparent' : 'dark'}`}
      style={{
        opacity: isHovered || isOpen ? 1 : 0.4,
        transition: 'opacity 0.3s ease'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="navbar-container">
        <div className="navbar-inner-centered">
          
          {/* Left Side Links (Desktop Only) */}
          <nav className="navbar-side-nav left">
            <ul className="navbar-desktop-ul">
              {leftLinks.map((item) => (
                <li key={item.id}><a href={item.href} className="navbar-desktop-link">{item.name}</a></li>
              ))}
            </ul>
          </nav>

          {/* Center Logo */}
          <a href="/" className="navbar-brand-centered">
            Kaden
          </a>

          {/* Right Side Links (Desktop Only) */}
          <nav className="navbar-side-nav right">
            <ul className="navbar-desktop-ul">
              {rightLinks.map((item) => (
                <li key={item.id}><a href={item.href} className="navbar-desktop-link">{item.name}</a></li>
              ))}
            </ul>
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

      {/* Mobile Overlay */}
      {isOpen && (
        <div className="navbar-mobile-overlay">
          <div className="navbar-mobile-content">
            <ul className="navbar-mobile-ul">
              {navLinks.map((item) => (
                <li key={item.id}>
                  <a href={item.href} className="navbar-mobile-link" onClick={() => setIsOpen(false)}>
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </header>
  );
});

export default Navbar;