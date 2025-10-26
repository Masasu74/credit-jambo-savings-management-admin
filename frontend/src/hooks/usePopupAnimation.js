import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook for managing popup animations without conflicts
 * @param {boolean} isOpen - Whether the popup is open
 * @returns {object} - Animation state and classes
 */
export const usePopupAnimation = (isOpen) => {
  const [animationState, setAnimationState] = useState({
    shouldRender: false,
    isVisible: false,
    isInitialRender: true,
    isAnimating: false
  });

  const timeoutRef = useRef(null);
  const initialTimeoutRef = useRef(null);

  useEffect(() => {
    // Clear any existing timeouts
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (initialTimeoutRef.current) clearTimeout(initialTimeoutRef.current);

    if (isOpen) {
      // Start entrance animation
      setAnimationState(prev => ({
        ...prev,
        shouldRender: true,
        isInitialRender: true,
        isAnimating: false
      }));

      // Small delay to ensure DOM is ready
      initialTimeoutRef.current = setTimeout(() => {
        setAnimationState(prev => ({
          ...prev,
          isVisible: true
        }));

        // Allow position animations after entrance completes
        timeoutRef.current = setTimeout(() => {
          setAnimationState(prev => ({
            ...prev,
            isInitialRender: false
          }));
        }, 300);
      }, 10);
    } else {
      // Start exit animation
      setAnimationState(prev => ({
        ...prev,
        isVisible: false,
        isInitialRender: true,
        isAnimating: false
      }));

      // Wait for exit animation to complete before unmounting
      timeoutRef.current = setTimeout(() => {
        setAnimationState(prev => ({
          ...prev,
          shouldRender: false
        }));
      }, 300);
    }

    // Cleanup function
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (initialTimeoutRef.current) clearTimeout(initialTimeoutRef.current);
    };
  }, [isOpen]);

  // Function to trigger position change animation
  const triggerPositionAnimation = () => {
    if (animationState.isInitialRender) return;

    setAnimationState(prev => ({
      ...prev,
      isAnimating: true
    }));

    // Clear animation state after duration
    setTimeout(() => {
      setAnimationState(prev => ({
        ...prev,
        isAnimating: false
      }));
    }, 300);
  };

  return {
    ...animationState,
    triggerPositionAnimation
  };
};
