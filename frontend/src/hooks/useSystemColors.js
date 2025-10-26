import { useState, useEffect } from 'react';
import { useSystemSettings } from '../context/SystemSettingsContext';

export const useSystemColors = () => {
  // Default colors fallback
  const defaultColors = {
    primary: '#00b050',
    secondary: '#008238',
    accent: '#6bc96b',
    success: '#00b050',
    warning: '#f59e0b',
    error: '#ef4444'
  };

  const [colors, setColors] = useState(defaultColors);
  
  // Safely get settings with error handling
  let settings = null;
  try {
    const { settings: systemSettings } = useSystemSettings();
    settings = systemSettings;
  } catch (error) {
    if (import.meta.env.MODE === 'development') {
      console.error('Error getting system settings in useSystemColors:', error);
    }
  }

  useEffect(() => {
    const handleSettingsUpdate = () => {
      try {
        const newColors = {
          primary: settings?.primaryColor || defaultColors.primary,
          secondary: settings?.secondaryColor || defaultColors.secondary,
          accent: settings?.accentColor || defaultColors.accent,
          success: settings?.successColor || defaultColors.success,
          warning: settings?.warningColor || defaultColors.warning,
          error: settings?.errorColor || defaultColors.error
        };
        if (import.meta.env.MODE === 'development') {
          console.log('useSystemColors: Updated colors from settings:', newColors);
        }
        setColors(newColors);
      } catch (error) {
        if (import.meta.env.MODE === 'development') {
          console.error('Error updating colors from settings:', error);
        }
        setColors(defaultColors);
      }
    };

    // Listen for system settings updates
    const handleCustomEvent = (event) => {
      try {
        if (event.detail) {
          const newColors = {
            primary: event.detail.primaryColor || defaultColors.primary,
            secondary: event.detail.secondaryColor || defaultColors.secondary,
            accent: event.detail.accentColor || defaultColors.accent,
            success: event.detail.successColor || defaultColors.success,
            warning: event.detail.warningColor || defaultColors.warning,
            error: event.detail.errorColor || defaultColors.error
          };
          if (import.meta.env.MODE === 'development') {
            console.log('useSystemColors: Updated colors from event:', newColors);
          }
          setColors(newColors);
        }
      } catch (error) {
        if (import.meta.env.MODE === 'development') {
          console.error('Error updating colors from event:', error);
        }
        setColors(defaultColors);
      }
    };

    window.addEventListener('systemSettingsUpdated', handleCustomEvent);
    
    // Initial update
    handleSettingsUpdate();

    return () => {
      window.removeEventListener('systemSettingsUpdated', handleCustomEvent);
    };
  }, [settings]);

  return { colors };
};

// Utility function to apply colors to any element
export const applySystemColors = (element, colorType = 'primary') => {
  if (!element) return;
  
  const colors = {
    primary: getComputedStyle(document.documentElement).getPropertyValue('--primary-color'),
    secondary: getComputedStyle(document.documentElement).getPropertyValue('--secondary-color'),
    accent: getComputedStyle(document.documentElement).getPropertyValue('--accent-color'),
    success: getComputedStyle(document.documentElement).getPropertyValue('--success-color'),
    warning: getComputedStyle(document.documentElement).getPropertyValue('--warning-color'),
    error: getComputedStyle(document.documentElement).getPropertyValue('--error-color')
  };

  const color = colors[colorType] || colors.primary;
  element.style.setProperty('--current-color', color);
};
