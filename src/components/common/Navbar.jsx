import { useState, useEffect, forwardRef, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { navLinks } from '../../constants/index.js';
import { ICONS } from '../../assets/index.js';

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
  
  const hoverTimeoutRef = useRef(null);

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

  // Show navbar on scroll up for ProjectMH1
  useEffect(() => {
    if (!isFullPageProject) return;

    const handleWheel = (e) => {
      if (e.deltaY < 0) { // Scroll up
        setIsProjectMH1Controlled(false);
        setIsVisible(true);
        
        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = setTimeout(() => {
          if (!isHovered && !isOpen) {
            setIsVisible(false);
          }
        }, 2000);
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: true });
    return () => {
      window.removeEventListener('wheel', handleWheel);
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, [isFullPageProject, isHovered, isOpen]);

  // Regular scroll direction detection
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
      setIsVisible(true);
      setIsHovered(false);
    }
  }, [isFullPageProject]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  // Handle mouse enter (show navbar)
  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    
    setIsProjectMH1Controlled(false);
    setIsHovered(true);
    setIsVisible(true);
  };

  // Handle mouse leave (hide navbar after delay)
  const handleMouseLeave = () => {
    if (isFullPageProject && !isOpen) {
      hoverTimeoutRef.current = setTimeout(() => {
        if (!isOpen) {
          setIsHovered(false);
          setIsVisible(false);
          setIsProjectMH1Controlled(true);
        }
      }, 500);
    }
  };

  // Determine if navbar should be visible
  const shouldShow = isProjectMH1Controlled 
    ? false 
    : isVisible || isHovered || isOpen || scrollDirection === 'up';

  return (
    <>
      {/* Main Navbar */}
      <header 
        ref={ref}
        className={`navbar-header ${shouldShow ? 'visible' : 'hidden'} ${isHomePage ? 'transparent' : 'dark'}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
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

      {/* Invisible hover strip for Project MH1 */}
      {isFullPageProject && !shouldShow && (
        <div 
          className="navbar-hover-strip"
          onMouseEnter={handleMouseEnter}
        />
      )}
    </>
  );
});

export default Navbar;