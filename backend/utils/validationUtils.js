/**
 * Validation utilities for common operations
 */

/**
 * Validates if an ID parameter is valid
 * @param {string} id - The ID to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export const isValidId = (id) => {
  return id && id !== 'undefined' && id !== 'null' && id.trim() !== '';
};

/**
 * Validates ID parameter and returns error response if invalid
 * @param {string} id - The ID to validate
 * @param {Object} res - Express response object
 * @returns {boolean} - True if valid, false if invalid (response already sent)
 */
export const validateIdParam = (id, res) => {
  if (!isValidId(id)) {
    res.status(400).json({
      success: false,
      message: 'Invalid ID parameter provided'
    });
    return false;
  }
  return true;
};

/**
 * Validates required fields in request body
 * @param {Object} body - Request body
 * @param {Array} requiredFields - Array of required field names
 * @param {Object} res - Express response object
 * @returns {boolean} - True if valid, false if invalid (response already sent)
 */
export const validateRequiredFields = (body, requiredFields, res) => {
  const missingFields = requiredFields.filter(field => !body[field]);
  
  if (missingFields.length > 0) {
    res.status(400).json({
      success: false,
      message: `Missing required fields: ${missingFields.join(', ')}`
    });
    return false;
  }
  return true;
};

/**
 * Validates email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid email format
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates phone number format (basic validation)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - True if valid phone format
 */
export const isValidPhone = (phone) => {
  const phoneRegex = /^[\+]?[0-9\s\-\(\)]{8,}$/;
  return phoneRegex.test(phone);
};
