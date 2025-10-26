/**
 * Safely renders a value as a string to prevent React object rendering errors
 * @param {any} value - The value to render
 * @param {string} fallback - Fallback string if value is invalid
 * @returns {string} - Safe string representation
 */
export const safeRender = (value, fallback = 'N/A') => {
  if (value === null || value === undefined) {
    return fallback;
  }
  
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  
  if (typeof value === 'object') {
    // If it's an object, try to extract a meaningful property
    if (value.fullName) return String(value.fullName);
    if (value.name) return String(value.name);
    if (value.title) return String(value.title);
    if (value.label) return String(value.label);
    if (value._id) return String(value._id);
    if (value.id) return String(value.id);
    
    // If it's a Date object
    if (value instanceof Date) {
      return value.toLocaleDateString();
    }
    
    // Last resort: convert to JSON (but this might not be user-friendly)
    return JSON.stringify(value);
  }
  
  return String(value) || fallback;
};

/**
 * Safely extracts a user's display name from a user object
 * @param {object|string} user - User object or string
 * @param {string} fallback - Fallback string
 * @returns {string} - Safe user display name
 */
export const safeUserName = (user, fallback = 'Unknown User') => {
  if (!user) return fallback;
  
  if (typeof user === 'string') return user;
  
  if (typeof user === 'object') {
    return user.fullName || user.firstName || user.name || user.email || user._id || fallback;
  }
  
  return String(user) || fallback;
};

/**
 * Safely extracts a display name from any object
 * @param {object|string} obj - Object or string
 * @param {string} fallback - Fallback string
 * @returns {string} - Safe display name
 */
export const safeDisplayName = (obj, fallback = 'Unknown') => {
  if (!obj) return fallback;
  
  if (typeof obj === 'string') return obj;
  
  if (typeof obj === 'object') {
    // Try different name properties
    if (obj.fullName) return String(obj.fullName);
    if (obj.personalInfo?.fullName) return String(obj.personalInfo.fullName);
    if (obj.user?.fullName) return String(obj.user.fullName);
    if (obj.firstName && obj.lastName) return `${obj.firstName} ${obj.lastName}`;
    if (obj.firstName) return String(obj.firstName);
    if (obj.name) return String(obj.name);
    if (obj.title) return String(obj.title);
    if (obj.email) return String(obj.email);
    if (obj.employeeId) return String(obj.employeeId);
    if (obj._id) return String(obj._id);
    if (obj.id) return String(obj.id);
    
    return fallback;
  }
  
  return String(obj) || fallback;
};
