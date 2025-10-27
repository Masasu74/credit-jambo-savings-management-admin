import { useEffect } from 'react';
import { useSystemSettings } from '../context/SystemSettingsContext';
import { getUploadUrl } from '../utils/apiUtils';

const DynamicFavicon = () => {
  const { settings } = useSystemSettings();

  useEffect(() => {
    const updateFavicon = () => {
      // Remove existing favicon links
      const existingLinks = document.querySelectorAll("link[rel*='icon']");
      existingLinks.forEach(link => link.remove());
      
      let faviconUrl = '';
      let faviconType = 'image/x-icon';
      
      if (settings?.favicon) {
        // Check if it's already a full URL (from Cloudinary)
        if (settings.favicon.startsWith('http')) {
          faviconUrl = settings.favicon;
        } else {
          // Use the favicon from system settings with getUploadUrl
          faviconUrl = getUploadUrl(settings.favicon);
        }
        
        // Set appropriate type based on file extension
        const fileExt = settings.favicon.split('.').pop()?.toLowerCase();
        if (fileExt === 'ico') {
          faviconType = 'image/x-icon';
        } else if (fileExt === 'png') {
          faviconType = 'image/png';
        } else {
          faviconType = 'image/x-icon';
        }
      } else {
        // Fallback to default favicon - serve from public directory
        faviconUrl = '/main-favicon.png';
        faviconType = 'image/png';
      }
      
      // Add cache-busting parameter
      const cacheBuster = Date.now();
      const finalUrl = faviconUrl + (faviconUrl.includes('?') ? '&' : '?') + 'v=' + cacheBuster;
      
      // Create multiple favicon links for better browser compatibility
      const faviconLinks = [
        { rel: 'shortcut icon', type: faviconType, href: finalUrl },
        { rel: 'icon', type: faviconType, href: finalUrl },
        { rel: 'apple-touch-icon', type: faviconType, href: finalUrl }
      ];
      
      faviconLinks.forEach(({ rel, type, href }) => {
        const link = document.createElement('link');
        link.rel = rel;
        link.type = type;
        link.href = href;
        document.head.appendChild(link);
      });
      
      // Note: Title updates are handled by DynamicTitle component
    };

    updateFavicon();

    // Listen for favicon update events
    const handleFaviconUpdate = () => {
      if (import.meta.env.MODE === 'development') {
        console.log('Favicon update event received');
      }
      updateFavicon();
    };

    window.addEventListener('faviconUpdated', handleFaviconUpdate);

    return () => {
      window.removeEventListener('faviconUpdated', handleFaviconUpdate);
    };
  }, [settings?.favicon]);

  return null; // This component doesn't render anything
};

export default DynamicFavicon;
