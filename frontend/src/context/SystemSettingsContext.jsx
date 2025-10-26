import { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useAppContext } from './AppContext';
import { toast } from 'react-toastify';
import { getUploadUrl } from '../utils/apiUtils';

const SystemSettingsContext = createContext();

export const useSystemSettings = () => {
  const context = useContext(SystemSettingsContext);
  if (!context) {
    throw new Error('useSystemSettings must be used within a SystemSettingsProvider');
  }
  return context;
};

export const SystemSettingsProvider = ({ children }) => {
  const { api } = useAppContext();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  // Default settings fallback
  const defaultSettings = {
    companyName: 'Credit Jambo Ltd',
    companySlogan: 'Your Trusted Savings Partner',
    companyDescription: 'A comprehensive savings management system for secure financial growth',
    contactEmail: 'hello@creditjambo.com',
    contactPhone: '+250 788 268 451',
    contactAddress: 'NM 233 St, Nyamagumba Musanze – Rwanda',
    website: 'https://creditjambo.com',
    logo: getUploadUrl('logo.png'),
    favicon: getUploadUrl('favicon.png'),
    loginBackground: getUploadUrl('login-background.png'),
    primaryColor: '#00b050',
    secondaryColor: '#008238',
    accentColor: '#6bc96b',
    successColor: '#00b050',
    warningColor: '#f59e0b',
    errorColor: '#ef4444',
    currency: 'RWF',
    currencySymbol: 'Frw',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24',
    timezone: 'Africa/Kigali',
    businessType: 'Savings Management Institution',
    features: {
      customerManagement: true,
      savingsManagement: true,
      transactionManagement: true,
      deviceVerification: true,
      reporting: true,
      notifications: true
    }
  };

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/system-settings/public');
      console.log('System settings response:', response.data);
      if (response.data.success) {
        console.log('System settings loaded successfully:', response.data.data);
        setSettings(response.data.data);
      } else {
        console.log('Using default settings');
        setSettings(defaultSettings);
      }
    } catch (error) {
      console.error('Error fetching system settings:', error);
      console.log('Using default settings due to error');
      setSettings(defaultSettings);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings) => {
    try {
      const response = await api.put('/system-settings', newSettings);
      if (response.data.success) {
        setSettings(response.data.data);
        toast.success('System settings updated successfully');
        return true;
      }
    } catch (error) {
      console.error('Error updating system settings:', error);
      toast.error('Failed to update system settings');
      return false;
    }
  };

  const refreshSettings = () => {
    fetchSettings();
  };

  // Apply CSS custom properties for colors
  useEffect(() => {
    if (settings) {
      const root = document.documentElement;
      
      // Ensure we have valid color values with fallbacks
      const primaryColor = settings.primaryColor || '#374151';
      const secondaryColor = settings.secondaryColor || '#111827';
      const accentColor = settings.accentColor || '#6b7280';
      const successColor = settings.successColor || '#10b981';
      const warningColor = settings.warningColor || '#f59e0b';
      const errorColor = settings.errorColor || '#ef4444';
      
      // Set CSS custom properties
      root.style.setProperty('--primary-color', primaryColor);
      root.style.setProperty('--secondary-color', secondaryColor);
      root.style.setProperty('--accent-color', accentColor);
      root.style.setProperty('--success-color', successColor);
      root.style.setProperty('--warning-color', warningColor);
      root.style.setProperty('--error-color', errorColor);
      
      console.log('SystemSettingsContext: Applied system colors:', {
        primary: primaryColor,
        secondary: secondaryColor,
        accent: accentColor,
        success: successColor,
        warning: warningColor,
        error: errorColor
      });
      
      // Also log the CSS custom properties
      console.log('SystemSettingsContext: CSS custom properties set:', {
        '--primary-color': getComputedStyle(document.documentElement).getPropertyValue('--primary-color'),
        '--secondary-color': getComputedStyle(document.documentElement).getPropertyValue('--secondary-color'),
        '--success-color': getComputedStyle(document.documentElement).getPropertyValue('--success-color')
      });
      
      // Force a re-render of components that use these colors
      const event = new CustomEvent('systemSettingsUpdated', { 
        detail: {
          primaryColor,
          secondaryColor,
          accentColor,
          successColor,
          warningColor,
          errorColor
        }
      });
      window.dispatchEvent(event);
      
      // Force CSS recalculation by adding/removing a class
      document.body.classList.add('settings-updated');
      setTimeout(() => {
        document.body.classList.remove('settings-updated');
      }, 100);
      
      // Update any inline styles that might be using the old colors
      const styleElements = document.querySelectorAll('[style*="rgb(37, 99, 235)"]');
      styleElements.forEach(element => {
        const computedStyle = window.getComputedStyle(element);
        if (computedStyle.backgroundColor === 'rgb(37, 99, 235)') {
          element.style.backgroundColor = primaryColor;
        }
        if (computedStyle.color === 'rgb(37, 99, 235)') {
          element.style.color = primaryColor;
        }
      });
    }
  }, [settings]);

  // Fetch settings on mount
  useEffect(() => {
    fetchSettings();
  }, []);

  const value = {
    settings: settings || defaultSettings,
    loading,
    updateSettings,
    refreshSettings,
    defaultSettings
  };

  // Ensure we always return valid settings
  if (!value.settings) {
    console.warn('SystemSettingsContext: No settings available, using defaults');
    value.settings = defaultSettings;
  }

  return (
    <SystemSettingsContext.Provider value={value}>
      {children}
    </SystemSettingsContext.Provider>
  );
};

SystemSettingsProvider.propTypes = {
  children: PropTypes.node.isRequired
};
