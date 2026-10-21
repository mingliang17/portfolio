import { useState, useEffect, forwardRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { navLinks } from '../../constants/index.js';
import { ICONS } from '../../assets/icons.js';
import { useScrollLock } from '../../scroll/index.js';

const Navbar = forwardRef((props, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { pathname } = useRouter(); // the route pattern ('/', '/home', '/projects/[project_id]'), never has a trailing slash

  const isHomePage = pathname === '/' || pathname === '/home';

  // Split links for the centered layout
  const midPoint = Math.ceil(navLinks.length / 2);
  const leftLinks = navLinks.slice(0, midPoint);
  const rightLinks = navLinks.slice(midPoint);

  // Ref-counted lock: closing the menu can no longer re-enable scrolling that
  // something else (e.g. a modal) still wants locked.
  useScrollLock(isOpen);

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
                <li key={item.id}><Link href={item.href} className="navbar-desktop-link">{item.name}</Link></li>
              ))}
            </ul>
          </nav>

          {/* Center Logo */}
          <Link href="/" className="navbar-brand-centered">
            Kaden
          </Link>

          {/* Right Side Links (Desktop Only) */}
          <nav className="navbar-side-nav right">
            <ul className="navbar-desktop-ul">
              {rightLinks.map((item) => (
                <li key={item.id}><Link href={item.href} className="navbar-desktop-link">{item.name}</Link></li>
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
              src={(isOpen ? ICONS.close : ICONS.menu).src} 
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
                  <Link href={item.href} className="navbar-mobile-link" onClick={() => setIsOpen(false)}>
                    {item.name}
                  </Link>
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