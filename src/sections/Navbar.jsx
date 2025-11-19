import { useState, useEffect, forwardRef } from 'react';
import { useLocation } from 'react-router-dom';
import { navLinks } from '../constants/index.js';
import { assetPath } from '../utils/assetPath.js'; 

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
  const [scrollDirection, setScrollDirection] = useState('up');
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isProjectMH1Controlled, setIsProjectMH1Controlled] = useState(false);
  const location = useLocation();
  
  const isHomePage = location.pathname === '/' || location.pathname === '/home';
  const isFullPageProject = location.pathname === '/projects/MH1';

  // Listen for ProjectMH1 navbar control events
  useEffect(() => {
    const handleProjectMH1Hide = () => {
      console.log('ProjectMH1: Hiding navbar');
      setIsProjectMH1Controlled(true);
      setIsVisible(false);
      setIsHovered(false);
    };

    const handleProjectMH1Show = () => {
      console.log('ProjectMH1: Showing navbar');
      setIsProjectMH1Controlled(false);
      setIsVisible(true);
    };

    window.addEventListener('projectMH1-navbar-hide', handleProjectMH1Hide);
    window.addEventListener('projectMH1-navbar-show', handleProjectMH1Show);

    return () => {
      window.removeEventListener('projectMH1-navbar-hide', handleProjectMH1Hide);
      window.removeEventListener('projectMH1-navbar-show', handleProjectMH1Show);
    };
  }, []);

  // SIMPLIFIED: Always show navbar on scroll up for ProjectMH1
  useEffect(() => {
    if (!isFullPageProject) return;

    const handleWheel = (e) => {
      // Show navbar on any scroll up movement
      if (e.deltaY < 0) { // Scroll up
        setIsProjectMH1Controlled(false);
        setIsVisible(true);
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: true });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [isFullPageProject]);

  // Regular scroll direction detection (only when not controlled by ProjectMH1 and not on ProjectMH1 page)
  useEffect(() => {
    if (isProjectMH1Controlled || isFullPageProject) return;

    let ticking = false;

    const updateScrollDirection = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY < 50) {
        setIsVisible(true);
        setScrollDirection('up');
      } else if (currentScrollY > lastScrollY) {
        setIsVisible(false);
        setScrollDirection('down');
      } else if (currentScrollY < lastScrollY) {
        setIsVisible(true);
        setScrollDirection('up');
      }
      
      setLastScrollY(currentScrollY);
      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(updateScrollDirection);
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY, isProjectMH1Controlled, isFullPageProject]);

  // Mouse hover logic
  useEffect(() => {
    let hoverTimeout;

    const handleMouseEnter = () => {
      setIsHovered(true);
      setIsProjectMH1Controlled(false);
      clearTimeout(hoverTimeout);
    };

    const handleMouseLeave = () => {
      hoverTimeout = setTimeout(() => {
        if (!isOpen && scrollDirection === 'down' && !isProjectMH1Controlled) {
          setIsHovered(false);
        }
      }, 300);
    };

    const navbar = document.querySelector('.navbar-header');
    if (navbar) {
      navbar.addEventListener('mouseenter', handleMouseEnter);
      navbar.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      if (navbar) {
        navbar.removeEventListener('mouseenter', handleMouseEnter);
        navbar.removeEventListener('mouseleave', handleMouseLeave);
      }
      clearTimeout(hoverTimeout);
    };
  }, [isOpen, scrollDirection, isProjectMH1Controlled]);

  // Keep navbar visible when menu is open
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setIsHovered(true);
      setIsProjectMH1Controlled(false);
    }
  }, [isOpen]);

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

  // Reset ProjectMH1 control when leaving the page
  useEffect(() => {
    if (!isFullPageProject) {
      setIsProjectMH1Controlled(false);
    }
  }, [isFullPageProject]);

  // Determine if navbar should be visible - SIMPLIFIED LOGIC
  const shouldShow = isProjectMH1Controlled 
    ? false // ProjectMH1 has full control
    : isVisible || isHovered || isOpen || scrollDirection === 'up';

  console.log('Navbar state:', { 
    shouldShow, 
    isVisible, 
    isHovered, 
    isOpen, 
    scrollDirection, 
    isProjectMH1Controlled 
  });

  return (
    <>
      {/* Main Navbar */}
      <header 
        ref={ref}
        className={`navbar-header ${isHomePage ? 'transparent' : 'dark'} ${
          shouldShow ? 'visible' : 'hidden'
        }`}
        onMouseEnter={() => {
          if (!isProjectMH1Controlled) setIsHovered(true);
        }}
        onMouseLeave={() => {
          if (!isOpen && scrollDirection === 'down' && !isProjectMH1Controlled) {
            const timeout = setTimeout(() => setIsHovered(false), 300);
            return () => clearTimeout(timeout);
          }
        }}
      >
        <div className="navbar-container">
          <div className="navbar-inner">
            <a href="/" className="navbar-brand">
              Kaden
            </a>

            <nav className="navbar-desktop-nav">
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

      {/* Invisible hover strip - always show for ProjectMH1 to allow manual reveal */}
      {isFullPageProject && !shouldShow && (
        <div 
          className="navbar-hover-strip fullpage"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: '50px',
            background: 'transparent',
            zIndex: 9998,
            cursor: 'pointer'
          }}
          onMouseEnter={() => {
            setIsProjectMH1Controlled(false);
            setIsHovered(true);
            setIsVisible(true);
          }}
        />
      )}
    </>
  );
});

export default Navbar;