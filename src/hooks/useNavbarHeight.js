import { useEffect } from 'react';

export const useNavbarHeight = (navRef, updateDelay = 100) => {
  useEffect(() => {
    const updateNavbarHeight = () => {
      const navbar = navRef.current;
      if (!navbar) return;
      
      // Get the actual height
      const navHeight = navbar.offsetHeight || 0;
      document.documentElement.style.setProperty('--nav-height', `${navHeight}px`);
      console.log('📏 Navbar height updated:', navHeight + 'px');
    };

    // Initial calculation
    updateNavbarHeight();

    // Re-run after a delay to catch layout shifts/fonts loading
    const timer1 = setTimeout(updateNavbarHeight, updateDelay);
    const timer2 = setTimeout(updateNavbarHeight, updateDelay * 5);

    const handleResize = () => updateNavbarHeight();
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      window.removeEventListener('resize', handleResize);
    };
  }, [navRef, updateDelay]);
};

export default useNavbarHeight;