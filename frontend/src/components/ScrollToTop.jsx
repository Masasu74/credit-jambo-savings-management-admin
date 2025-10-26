import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Component that scrolls to top on route change
 * This should be placed inside the Router but outside of individual routes
 */
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll to top when pathname changes
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'auto' // Use 'auto' for immediate scroll, 'smooth' for animated
    });
  }, [pathname]);

  return null; // This component doesn't render anything
};

export default ScrollToTop;
