import React, { useState, useEffect, useRef } from 'react';
import { FaChevronLeft, FaChevronRight, FaExpand, FaCompress } from 'react-icons/fa';

const MobileResponsiveWrapper = ({ children, title = "Dashboard" }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [currentView, setCurrentView] = useState(0);
  const [views, setViews] = useState([]);
  const containerRef = useRef(null);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Extract views from children
  useEffect(() => {
    if (React.Children.count(children) > 0) {
      const childViews = React.Children.toArray(children).map((child, index) => ({
        id: index,
        component: child,
        title: child.props?.title || `View ${index + 1}`
      }));
      setViews(childViews);
    }
  }, [children]);

  // Touch handlers for swipe gestures
  const handleTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && currentView < views.length - 1) {
      setCurrentView(currentView + 1);
    }
    if (isRightSwipe && currentView > 0) {
      setCurrentView(currentView - 1);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft' && currentView > 0) {
        setCurrentView(currentView - 1);
      } else if (e.key === 'ArrowRight' && currentView < views.length - 1) {
        setCurrentView(currentView + 1);
      } else if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      } else if (e.key === 'F11') {
        e.preventDefault();
        setIsFullscreen(!isFullscreen);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentView, views.length, isFullscreen]);

  // Fullscreen functionality
  useEffect(() => {
    if (isFullscreen) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }, [isFullscreen]);

  if (!isMobile) {
    return <div className="w-full">{children}</div>;
  }

  return (
    <div 
      ref={containerRef}
      className={`w-full ${isFullscreen ? 'fixed inset-0 z-50 bg-white dark:bg-gray-900' : ''}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Mobile Header */}
      <div className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-gray-900 dark:text-white truncate">
              {title}
            </h1>
            {views.length > 1 && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {currentView + 1} of {views.length}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {views.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentView(Math.max(0, currentView - 1))}
                  disabled={currentView === 0}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Previous view"
                >
                  <FaChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setCurrentView(Math.min(views.length - 1, currentView + 1))}
                  disabled={currentView === views.length - 1}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Next view"
                >
                  <FaChevronRight size={16} />
                </button>
              </>
            )}
            
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullscreen ? <FaCompress size={16} /> : <FaExpand size={16} />}
            </button>
          </div>
        </div>

        {/* Progress Indicator */}
        {views.length > 1 && (
          <div className="mt-3 flex gap-1">
            {views.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentView(index)}
                className={`flex-1 h-1 rounded-full transition-all duration-200 ${
                  index === currentView
                    ? 'bg-blue-500'
                    : 'bg-gray-200 dark:bg-gray-700'
                }`}
                aria-label={`Go to view ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Mobile Content */}
      <div className="p-4 pb-20">
        {views.length > 0 && views[currentView] && (
          <div className="transform transition-transform duration-300 ease-in-out">
            {views[currentView].component}
          </div>
        )}
      </div>

      {/* Mobile Navigation Hints */}
      <div className="fixed bottom-4 left-4 right-4 z-30">
        <div className="bg-black bg-opacity-75 text-white text-center py-2 px-4 rounded-lg text-sm">
          {views.length > 1 ? (
            <span>Swipe left/right or use arrow keys to navigate</span>
          ) : (
            <span>Scroll to view all content</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileResponsiveWrapper;
