import { useState, useEffect, forwardRef } from 'react';
import { useLocation } from 'react-router-dom';
import { navLinks } from '../constants/index.js';
import { assetPath } from '../utils/assetPath.js'; 

const NavItems = ({ mobile = false, onClick = () => {} }) => (
  <ul className={mobile ? "flex flex-col space-y-4" : "flex space-x-8"}>
    {navLinks.map((item) => (
      <li key={item.id}>
        <a 
          href={item.href} 
          className="text-neutral-400 hover:text-white transition-colors"
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
  const [scrollDirection, setScrollDirection] = useState('up');
  const [lastScrollY, setLastScrollY] = useState(0);
  const location = useLocation();
  
  const isHomePage = location.pathname === '/' || location.pathname === '/home';
  const showOnHover = !isHomePage;

  // Scroll direction detection
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setScrollDirection('down');
      } else if (currentScrollY < lastScrollY) {
        setScrollDirection('up');
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'auto';
    return () => { document.body.style.overflow = 'auto'; };
  }, [isOpen]);

  // Close menu on Escape key
  useEffect(() => {
    const handleEscape = (e) => { if (e.key === 'Escape') setIsOpen(false); };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  const shouldShow = isHomePage 
    ? true 
    : isHovered || scrollDirection === 'up' || isOpen || lastScrollY < 50;

  return (
    <>
      {/* Main Navbar */}
      <header 
        ref={ref}
        className={`fixed top-0 left-0 right-0 z-50 bg-black/90 transition-all duration-300 ${
          shouldShow ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full'
        }`}
        onMouseEnter={() => showOnHover && setIsHovered(true)}
        onMouseLeave={() => showOnHover && setIsHovered(false)}
        style={{ 
          pointerEvents: shouldShow ? 'auto' : 'none' 
        }}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            <a href="/" className="text-neutral-400 font-bold text-xl hover:text-white transition-colors">
              Kaden
            </a>

            <nav className="hidden md:block">
              <NavItems />
            </nav>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden text-neutral-400 z-60 hover:text-white focus:outline-none"
              aria-label="Toggle menu"
              style={{ pointerEvents: 'auto' }}
            >
              <img 
                src={assetPath(isOpen ? 'close.svg' : 'menu.svg')} 
                alt={isOpen ? 'Close menu' : 'Open menu'} 
                className="w-6 h-6" 
              />
            </button>
          </div>
        </div>

        {isOpen && (
          <div className="md:hidden fixed inset-0 bg-black/95 z-40 pt-16">
            <div className="p-6">
              <NavItems mobile onClick={() => setIsOpen(false)} />
            </div>
          </div>
        )}
      </header>

      {/* Invisible hover strip - only shows when navbar is hidden on non-home pages */}
      {!shouldShow && showOnHover && (
        <div 
          className="fixed top-0 left-0 right-0 h-[var(--nav-height)] z-40 bg-transparent"
          onMouseEnter={() => {
            console.log('Hover strip activated');
            setIsHovered(true);
          }}
          style={{ pointerEvents: 'auto' }}
        />
      )}
    </>
  );
});

export default Navbar;