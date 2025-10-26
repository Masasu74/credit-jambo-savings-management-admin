// components/Loader.jsx
import React from 'react';
import { useSystemSettings } from '../context/SystemSettingsContext';

const Loader = () => {
  const { settings } = useSystemSettings();
  
  return (
    <div className="flex justify-center items-center h-screen bg-gray-50 dark:bg-gray-900">
      <div 
        className="animate-spin rounded-full h-12 w-12 border-b-2"
        style={{ 
          borderColor: settings?.primaryColor || '#2563eb',
          borderTopColor: 'transparent'
        }}
      ></div>
    </div>
  );
};

export default Loader;