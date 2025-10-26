import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook to detect scroll position and determine optimal popup placement
 * @returns {object} - Object containing scroll position info and optimal placement
 */
export const useScrollPosition = () => {
  const [scrollInfo, setScrollInfo] = useState({
    scrollY: 0,
    windowHeight: 0,
    documentHeight: 0,
    scrollPercentage: 0,
    placement: 'center',
    isAnimating: false
  });
  
  const timeoutRef = useRef(null);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    const updateScrollInfo = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollPercentage = (scrollY / (documentHeight - windowHeight)) * 100;

      // Determine optimal placement based on scroll position
      let newPlacement = 'center';
      
      if (scrollPercentage < 20) {
        // Near top of page - show popup at top
        newPlacement = 'top';
      } else if (scrollPercentage > 80) {
        // Near bottom of page - show popup at bottom
        newPlacement = 'bottom';
      } else {
        // Middle of page - show popup in center
        newPlacement = 'center';
      }

      // Check if placement is changing
      setScrollInfo(prev => {
        const placementChanged = prev.placement !== newPlacement;
        
        // Don't animate on initial load
        if (!isInitializedRef.current) {
          isInitializedRef.current = true;
          return {
            scrollY,
            windowHeight,
            documentHeight,
            scrollPercentage,
            placement: newPlacement,
            isAnimating: false
          };
        }
        
        if (placementChanged) {
          // Clear any existing timeout
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
          
          // Set animating state
          const newState = {
            scrollY,
            windowHeight,
            documentHeight,
            scrollPercentage,
            placement: newPlacement,
            isAnimating: true
          };
          
          // Clear animating state after animation completes
          timeoutRef.current = setTimeout(() => {
            setScrollInfo(prevState => ({
              ...prevState,
              isAnimating: false
            }));
          }, 300); // Match CSS transition duration
          
          return newState;
        }
        
        return {
          scrollY,
          windowHeight,
          documentHeight,
          scrollPercentage,
          placement: newPlacement,
          isAnimating: false
        };
      });
    };

    // Initial call
    updateScrollInfo();

    // Add event listener
    window.addEventListener('scroll', updateScrollInfo, { passive: true });
    window.addEventListener('resize', updateScrollInfo, { passive: true });

    // Cleanup
    return () => {
      window.removeEventListener('scroll', updateScrollInfo);
      window.removeEventListener('resize', updateScrollInfo);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return scrollInfo;
};

/**
 * Get CSS classes for popup positioning based on scroll position
 * @param {string} placement - 'top', 'center', or 'bottom'
 * @param {boolean} isAnimating - Whether the popup is currently animating
 * @returns {object} - Object with container and modal classes
 */
export const getScrollBasedModalClasses = (placement = 'center', isAnimating = false) => {
  const baseContainerClasses = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex p-4 overflow-y-auto';
  
  const placementClasses = {
    top: 'items-start justify-center pt-8 sm:pt-16',
    center: 'items-center justify-center',
    bottom: 'items-end justify-center pb-8 sm:pb-16'
  };

  const containerClasses = `${baseContainerClasses} ${placementClasses[placement] || placementClasses.center}`;

  // Enhanced modal classes with smooth animations
  const modalClasses = `
    bg-white dark:bg-gray-800 rounded-lg shadow-2xl 
    w-full max-w-md max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-4rem)] 
    overflow-y-auto mx-4 transform transition-all duration-300 ease-in-out
    ${isAnimating ? 'animate-pulse' : ''}
  `.trim();

  return {
    container: containerClasses,
    modal: modalClasses
  };
};
