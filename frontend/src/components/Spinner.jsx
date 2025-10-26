import React from 'react';
import { useSystemSettings } from '../context/SystemSettingsContext';

const Spinner = () => {
  const { settings } = useSystemSettings();
  
  return (
    <div className="flex justify-center items-center p-4">
      <div 
        className="animate-spin rounded-full h-8 w-8 border-b-2"
        style={{ 
          borderColor: settings?.primaryColor || '#2563eb',
          borderTopColor: 'transparent'
        }}
      ></div>
    </div>
  );
};

export default Spinner;

