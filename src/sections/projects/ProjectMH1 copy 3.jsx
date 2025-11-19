import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';

const ProjectMH1 = () => {
  const [currentSection, setCurrentSection] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const totalSections = 5;

  // Scroll logic
  useEffect(() => {
    let timeout;
    let lastScrollTime = Date.now();
    let accumulatedDelta = 0;

    const handleWheel = (e) => {
      e.preventDefault();
      
      const now = Date.now();
      const timeSinceLastScroll = now - lastScrollTime;
      
      if (timeSinceLastScroll > 200) {
        accumulatedDelta = 0;
      }
      
      lastScrollTime = now;
      accumulatedDelta += e.deltaY;
      
      const threshold = 100;
      
      if (Math.abs(accumulatedDelta) > threshold && !isScrolling) {
        if (accumulatedDelta > 0 && currentSection < totalSections - 1) {
          setCurrentSection(prev => prev + 1);
          accumulatedDelta = 0;
        } else if (accumulatedDelta < 0 && currentSection > 0) {
          setCurrentSection(prev => prev - 1);
          accumulatedDelta = 0;
        }
      }
    };

    const handleKeyDown = (e) => {
      if (isScrolling) return;
      
      if (e.key === 'ArrowDown' && currentSection < totalSections - 1) {
        setCurrentSection(prev => prev + 1);
      } else if (e.key === 'ArrowUp' && currentSection > 0) {
        setCurrentSection(prev => prev - 1);
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentSection, isScrolling]);

  useEffect(() => {
    setIsScrolling(true);
    const timeout = setTimeout(() => setIsScrolling(false), 1000);
    return () => clearTimeout(timeout);
  }, [currentSection]);

  // Section Navigation Dots
  const NavigationDots = () => (
    <div className="navigation-dots">
      {Array.from({ length: totalSections }).map((_, i) => (
        <button
          key={i}
          onClick={() => setCurrentSection(i)}
          className={`nav-dot ${i === currentSection ? 'active' : ''}`}
          aria-label={`Go to page ${i + 1}`}
        />
      ))}
    </div>
  );

  return (
    <div className="project-container">
      <style jsx>{`
        .project-container {
          position: relative;
          height: 100vh;
          overflow: hidden;
          background: #000;
          color: white;
        }

        .section-container {
          transition: transform 1s cubic-bezier(0.645, 0.045, 0.355, 1);
          height: 100%;
        }

        .section {
          height: 100vh;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .page-label {
          font-size: 8rem;
          font-weight: bold;
          color: white;
          text-align: center;
        }

        .page-1 .page-label {
          background: linear-gradient(45deg, #f59e0b, #d97706, #f59e0b);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .page-2 .page-label {
          background: linear-gradient(45deg, #3b82f6, #1d4ed8, #3b82f6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .page-3 .page-label {
          background: linear-gradient(45deg, #10b981, #047857, #10b981);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .page-4 .page-label {
          background: linear-gradient(45deg, #8b5cf6, #7c3aed, #8b5cf6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .page-5 .page-label {
          background: linear-gradient(45deg, #ec4899, #db2777, #ec4899);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .navigation-dots {
          position: fixed;
          right: 2rem;
          top: 50%;
          transform: translateY(-50%);
          z-index: 100;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .nav-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 2px solid white;
          background: transparent;
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .nav-dot:hover {
          background: rgba(255, 255, 255, 0.5);
        }

        .nav-dot.active {
          background: white;
          transform: scale(1.3);
        }

        /* Background colors for each page */
        .page-1 {
          background: linear-gradient(135deg, #0f172a, #1e293b);
        }

        .page-2 {
          background: linear-gradient(135deg, #1e3a8a, #3730a3);
        }

        .page-3 {
          background: linear-gradient(135deg, #065f46, #064e3b);
        }

        .page-4 {
          background: linear-gradient(135deg, #5b21b6, #7e22ce);
        }

        .page-5 {
          background: linear-gradient(135deg, #9d174d, #831843);
        }
      `}</style>

      <NavigationDots />

      <div 
        className="section-container"
        style={{
          transform: `translateY(-${currentSection * 100}vh)`,
        }}
      >
        {/* Page 1 */}
        <section className="section page-1">
          <div className="page-label">
            Page 1
          </div>
        </section>

        {/* Page 2 */}
        <section className="section page-2">
          <div className="page-label">
            Page 2
          </div>
        </section>

        {/* Page 3 */}
        <section className="section page-3">
          <div className="page-label">
            Page 3
          </div>
        </section>

        {/* Page 4 */}
        <section className="section page-4">
          <div className="page-label">
            Page 4
          </div>
        </section>

        {/* Page 5 */}
        <section className="section page-5">
          <div className="page-label">
            Page 5
          </div>
        </section>
      </div>
    </div>
  );
};

export default ProjectMH1;