// Utility functions for API URL handling

/**
 * Get the base API URL for the current environment
 */
export const getApiBaseUrl = () => {
  if (import.meta.env.MODE === "development") {
    return "http://localhost:4000/api";
  }
  
  // Use environment variable if available
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // For production, use the Render backend URL
  return "https://anchor-finance-system.onrender.com/api";
};

/**
 * Get the base upload URL for the current environment
 */
export const getUploadBaseUrl = () => {
  if (import.meta.env.MODE === "development") {
    return "http://localhost:4000";
  }
  
  // Use environment variable if available
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace('/api', '');
  }
  
  // For production, use the Render backend URL
  return "https://anchor-finance-system.onrender.com";
};

/**
 * Generate a full upload URL for a file
 */
export const getUploadUrl = (filename) => {
  if (!filename) return null;
  
  // If it's already a full URL (http/https), return as is
  if (filename.startsWith('http://') || filename.startsWith('https://')) {
    return filename;
  }
  
  // If it's already a Cloudinary URL, return as is
  if (filename.includes('cloudinary.com')) {
    return filename;
  }
  
  // Otherwise, treat as local file
  return `${getUploadBaseUrl()}/api/uploads/${encodeURIComponent(filename)}`;
};

/**
 * Generate a full API URL for an endpoint
 */
export const getApiUrl = (endpoint) => {
  const baseUrl = getApiBaseUrl();
  return `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
};
