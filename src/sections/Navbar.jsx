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
  const isFullPageProject = location.pathname === '/projects/MH1';
  
  const showOnHover = !isHomePage && !isFullPageProject;

  // SCROLL DIRECTION DETECTION - Enhanced for full-page projects
  useEffect(() => {
    let scrollTimeout;

    const handleWheel = (e) => {
      if (isFullPageProject) {
        const currentDelta = e.deltaY;
        
        if (currentDelta > 0) {
          setScrollDirection('down');
          setIsHovered(false);
        } else if (currentDelta < 0) {
          setScrollDirection('up');
          setIsHovered(true);
          
          clearTimeout(scrollTimeout);
          scrollTimeout = setTimeout(() => {
            if (!isOpen) {
              setIsHovered(false);
            }
          }, 2000);
        }
        return;
      }

      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setScrollDirection('down');
      } else if (currentScrollY < lastScrollY) {
        setScrollDirection('up');
      }
      
      setLastScrollY(currentScrollY);
    };

    const handleTouchStart = (e) => {
      if (!isFullPageProject) return;
      const touchY = e.touches[0].clientY;
      setLastScrollY(touchY);
    };

    const handleTouchMove = (e) => {
      if (!isFullPageProject) return;
      const currentTouchY = e.touches[0].clientY;
      
      if (currentTouchY < lastScrollY - 10) {
        setScrollDirection('down');
        setIsHovered(false);
      } else if (currentTouchY > lastScrollY + 10) {
        setScrollDirection('up');
        setIsHovered(true);
        
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          if (!isOpen) {
            setIsHovered(false);
          }
        }, 2000);
      }
      setLastScrollY(currentTouchY);
    };

    window.addEventListener('wheel', handleWheel, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      clearTimeout(scrollTimeout);
    };
  }, [lastScrollY, isFullPageProject, isOpen]);

  // MOUSE HOVER LOGIC - Only for full-page projects
  useEffect(() => {
    if (!isFullPageProject) return;

    let hoverTimeout;

    const handleMouseMove = (e) => {
      if (e.clientY < 60) {
        setIsHovered(true);
        clearTimeout(hoverTimeout);
      } else {
        if (scrollDirection !== 'up' && !isOpen) {
          hoverTimeout = setTimeout(() => {
            setIsHovered(false);
          }, 500);
        }
      }
    };

    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(hoverTimeout);
    };
  }, [isFullPageProject, scrollDirection, isOpen]);

  // Keep navbar visible when menu is open
  useEffect(() => {
    if (isOpen) {
      setIsHovered(true);
    }
  }, [isOpen]);

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

  const shouldShow = isFullPageProject 
    ? isHovered || isOpen || scrollDirection === 'up'
    : (isHomePage 
        ? true 
        : isHovered || scrollDirection === 'up' || isOpen || lastScrollY < 50);

  return (
    <>
      {/* Main Navbar */}
      <header 
        ref={ref}
        className={`navbar-header ${shouldShow ? 'visible' : 'hidden'}`}
        onMouseEnter={() => {
          if (showOnHover) setIsHovered(true);
          if (isFullPageProject) setIsHovered(true);
        }}
        onMouseLeave={() => {
          if (showOnHover) {
            const timeout = setTimeout(() => setIsHovered(false), 300);
            return () => clearTimeout(timeout);
          }
          if (isFullPageProject && scrollDirection !== 'up' && !isOpen) {
            const timeout = setTimeout(() => setIsHovered(false), 500);
            return () => clearTimeout(timeout);
          }
        }}
      >
        <div className="navbar-container">
          <div className="navbar-inner">
            <a href="/" className="navbar-brand">
              Kaden
            </a>

            <nav className="hidden md:block">
              <NavItems />
            </nav>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="navbar-mobile-button"
              aria-label="Toggle menu"
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
          <div className="navbar-mobile-overlay">
            <div className="navbar-mobile-content">
              <NavItems mobile onClick={() => setIsOpen(false)} />
            </div>
          </div>
        )}
      </header>

      {/* Invisible hover strip - only for non-fullpage projects */}
      {!shouldShow && showOnHover && (
        <div 
          className="navbar-hover-strip regular"
          onMouseEnter={() => setIsHovered(true)}
        />
      )}

      {/* Special hover strip for full-page projects */}
      {isFullPageProject && (
        <div 
          className="navbar-hover-strip fullpage"
          onMouseEnter={() => setIsHovered(true)}
        />
      )}
    </>
  );
});

export default Navbar;