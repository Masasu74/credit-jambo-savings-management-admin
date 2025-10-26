import { useSystemColors } from '../hooks/useSystemColors';
import { useSystemSettings } from '../context/SystemSettingsContext';

// Default color palette
export const DEFAULT_COLORS = {
  primary: '#2563eb',
  secondary: '#64748b',
  accent: '#f59e0b',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444'
};

// Color utility functions
export const getSystemColors = () => {
  try {
    const { colors } = useSystemColors();
    const { settings } = useSystemSettings();
    
    // Priority: useSystemColors > settings > defaults
    return {
      primary: colors?.primary || settings?.primaryColor || DEFAULT_COLORS.primary,
      secondary: colors?.secondary || settings?.secondaryColor || DEFAULT_COLORS.secondary,
      accent: colors?.accent || settings?.accentColor || DEFAULT_COLORS.accent,
      success: colors?.success || settings?.successColor || DEFAULT_COLORS.success,
      warning: colors?.warning || settings?.warningColor || DEFAULT_COLORS.warning,
      error: colors?.error || settings?.errorColor || DEFAULT_COLORS.error
    };
  } catch (error) {
    console.error('Error getting system colors:', error);
    return DEFAULT_COLORS;
  }
};

// CSS class generators for dynamic colors
export const getColorClasses = (colorType = 'primary') => {
  const colors = getSystemColors();
  const color = colors[colorType] || colors.primary;
  
  return {
    bg: `bg-[${color}]`,
    text: `text-[${color}]`,
    border: `border-[${color}]`,
    hover: `hover:bg-[${color}]`,
    focus: `focus:ring-[${color}]`,
    style: { color, backgroundColor: color, borderColor: color }
  };
};

// Status color mapping
export const getStatusColors = () => {
  const colors = getSystemColors();
  
  return {
    active: colors.success,
    pending: colors.warning,
    completed: colors.primary,
    overdue: colors.error,
    approved: colors.success,
    rejected: colors.error,
    disbursed: colors.primary,
    defaulted: colors.error
  };
};

// Chart colors for consistent data visualization
export const getChartColors = () => {
  const colors = getSystemColors();
  
  return {
    primary: colors.primary,
    secondary: colors.secondary,
    accent: colors.accent,
    success: colors.success,
    warning: colors.warning,
    error: colors.error,
    // Additional chart colors
    purple: '#8B5CF6',
    cyan: '#06B6D4',
    pink: '#EC4899',
    indigo: '#6366F1',
    teal: '#14B8A6',
    orange: '#F97316'
  };
};

// Utility to convert hex to RGB for opacity
export const hexToRgb = (hex) => {
  if (!hex) return [37, 99, 235]; // Default blue
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : [37, 99, 235];
};

// Utility to create color with opacity
export const colorWithOpacity = (hex, opacity = 1) => {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${opacity})`;
};

// Helper function to load image for PDF
export const loadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

// Hook for easy color access in components
export const useColors = () => {
  const colors = getSystemColors();
  
  return {
    colors,
    getColorClasses,
    getStatusColors,
    getChartColors,
    colorWithOpacity,
    // Convenience methods
    primary: colors.primary,
    secondary: colors.secondary,
    accent: colors.accent,
    success: colors.success,
    warning: colors.warning,
    error: colors.error
  };
};
