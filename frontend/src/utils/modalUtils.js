/**
 * Utility functions for better modal positioning and user experience
 */

/**
 * Get optimal modal positioning classes
 * @param {string} size - Modal size: 'sm', 'md', 'lg', 'xl'
 * @param {boolean} scrollable - Whether modal should be scrollable
 * @returns {object} - Object with container and modal classes
 */
export const getModalClasses = (size = 'md', scrollable = true) => {
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md', 
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    '2xl': 'max-w-6xl'
  };

  const containerClasses = `
    fixed inset-0 bg-black bg-opacity-50 z-50 
    flex items-start justify-center 
    p-4 pt-8 sm:pt-16
    overflow-y-auto
  `.trim();

  const modalClasses = `
    bg-white dark:bg-gray-800 rounded-lg shadow-2xl 
    w-full ${sizeClasses[size]} 
    ${scrollable ? 'max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-4rem)] overflow-y-auto' : ''}
    mx-4
    transform transition-all duration-200 ease-out
  `.trim();

  return {
    container: containerClasses,
    modal: modalClasses
  };
};

/**
 * Get modal positioning for different screen sizes
 * @param {string} position - Position preference: 'top', 'center', 'auto'
 * @returns {string} - CSS classes for positioning
 */
export const getModalPosition = (position = 'auto') => {
  const positions = {
    top: 'items-start justify-center pt-8 sm:pt-16',
    center: 'items-center justify-center',
    auto: 'items-start justify-center pt-8 sm:pt-16 md:pt-20 lg:pt-24'
  };
  
  return positions[position] || positions.auto;
};

/**
 * Get responsive modal classes
 * @param {object} options - Configuration options
 * @returns {object} - Modal classes object
 */
export const getResponsiveModalClasses = (options = {}) => {
  const {
    size = 'md',
    position = 'auto',
    scrollable = true,
    fullScreen = false
  } = options;

  if (fullScreen) {
    return {
      container: 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4',
      modal: 'bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full h-full max-h-[95vh] overflow-hidden'
    };
  }

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-2xl', 
    xl: 'max-w-4xl',
    '2xl': 'max-w-6xl'
  };

  const containerClasses = `
    fixed inset-0 bg-black bg-opacity-50 z-50 
    flex ${getModalPosition(position)}
    p-4
    overflow-y-auto
  `.trim();

  const modalClasses = `
    bg-white dark:bg-gray-800 rounded-lg shadow-2xl 
    w-full ${sizeClasses[size]}
    ${scrollable ? 'max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-4rem)] overflow-y-auto' : ''}
    mx-4
    transform transition-all duration-200 ease-out
    my-4
  `.trim();

  return {
    container: containerClasses,
    modal: modalClasses
  };
};

/**
 * Common modal sizes for consistency
 */
export const MODAL_SIZES = {
  SMALL: 'sm',
  MEDIUM: 'md', 
  LARGE: 'lg',
  EXTRA_LARGE: 'xl',
  EXTRA_EXTRA_LARGE: '2xl'
};

/**
 * Common modal positions
 */
export const MODAL_POSITIONS = {
  TOP: 'top',
  CENTER: 'center', 
  AUTO: 'auto'
};
