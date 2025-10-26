/**
 * Scroll restoration utilities for React Router
 */
import React from 'react';

/**
 * Scroll to top of page
 */
export const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    left: 0,
    behavior: 'smooth'
  });
};

/**
 * Scroll to top immediately (without smooth behavior)
 */
export const scrollToTopImmediate = () => {
  window.scrollTo(0, 0);
};

/**
 * Custom scroll restoration function for React Router
 * This will be called on every route change
 */
export const scrollRestoration = () => {
  // Small delay to ensure the page has rendered
  setTimeout(() => {
    scrollToTopImmediate();
  }, 0);
};

/**
 * Hook to scroll to top when component mounts
 */
export const useScrollToTop = () => {
  React.useEffect(() => {
    scrollToTopImmediate();
  }, []);
};

/**
 * Hook to scroll to top when dependencies change
 */
export const useScrollToTopOnChange = (dependencies = []) => {
  React.useEffect(() => {
    scrollToTopImmediate();
  }, dependencies);
};

/**
 * Hook to scroll to top on route change
 * This is an alternative to the ScrollToTop component
 */
export const useScrollToTopOnRouteChange = () => {
  const { pathname } = React.useRouter?.() || {};
  
  React.useEffect(() => {
    if (pathname) {
      scrollToTopImmediate();
    }
  }, [pathname]);
};
