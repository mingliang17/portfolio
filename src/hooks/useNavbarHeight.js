import { useEffect, useCallback } from 'react';

export const useNavbarHeight = (navRef, updateDelay = 100) => {
  useEffect(() => {
    const updateNavbarHeight = () => {
      const navbar = navRef.current;
      if (!navbar) {
        console.warn('⚠️ Navbar ref not available yet');
        return;
      }
      
      // Force the navbar to be visible for measurement
      const originalStyle = navbar.style.cssText;
      navbar.style.opacity = '1';
      navbar.style.transform = 'translateY(0)';
      navbar.style.pointerEvents = 'auto';
      
      const navHeight = navbar.offsetHeight || 0;
      document.documentElement.style.setProperty('--nav-height', `${navHeight}px`);
      console.log('📏 Navbar height calculated:', navHeight + 'px');
      
      // Restore original styles
      navbar.style.cssText = originalStyle;
    };

    // Calculate multiple times to ensure accuracy
    updateNavbarHeight();
    const timer1 = setTimeout(updateNavbarHeight, updateDelay);
    const timer2 = setTimeout(updateNavbarHeight, updateDelay * 5);

    // Recalculate on window resize
    const handleResize = () => {
      console.log('🔄 Window resized, recalculating navbar height');
      updateNavbarHeight();
    };
    
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      window.removeEventListener('resize', handleResize);
    };
  }, [navRef, updateDelay]);
};

export default useNavbarHeight;