import { useEffect } from 'react';
import { useSystemSettings } from '../context/SystemSettingsContext';

const DynamicTitle = () => {
  const { settings, loading } = useSystemSettings();

  useEffect(() => {
    const updateTitle = () => {
      console.log('DynamicTitle: Updating title with settings:', settings, 'loading:', loading);
      
      // Wait for settings to load
      if (loading) {
        console.log('DynamicTitle: Still loading settings, using fallback');
        document.title = 'Credit Jambo Ltd - Savings Management System';
        return;
      }
      
      if (settings?.companyName) {
        const newTitle = `${settings.companyName} - Savings Management System`;
        console.log('DynamicTitle: Setting title to:', newTitle);
        
        // Use setTimeout to ensure the update happens after any other DOM updates
        setTimeout(() => {
          document.title = newTitle;
          
          // Also update the title tag in the head
          const titleTag = document.querySelector('title');
          if (titleTag) {
            titleTag.textContent = newTitle;
          }
          
          console.log('DynamicTitle: Title updated to:', document.title);
        }, 100);
      } else {
        const fallbackTitle = 'Credit Jambo Ltd - Savings Management System';
        console.log('DynamicTitle: Using fallback title:', fallbackTitle);
        
        setTimeout(() => {
          document.title = fallbackTitle;
          
          const titleTag = document.querySelector('title');
          if (titleTag) {
            titleTag.textContent = fallbackTitle;
          }
        }, 100);
      }
    };

    updateTitle();
  }, [settings?.companyName, loading]);

  return null; // This component doesn't render anything
};

export default DynamicTitle;
