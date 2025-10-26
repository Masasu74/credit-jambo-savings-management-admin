/**
 * Utility functions for formatting MongoDB and other database errors into user-friendly messages
 */

/**
 * Format MongoDB duplicate key errors into user-friendly messages
 * @param {Error} error - The MongoDB error object
 * @returns {string} - User-friendly error message
 */
export const formatDuplicateKeyError = (error) => {
  if (!error.message || !error.message.includes('E11000')) {
    return error.message;
  }

  // Parse the duplicate key error message
  const message = error.message;
  
  // Extract the field name and value from the error message
  const fieldMatch = message.match(/index:\s*([^_]+)_\d+\s+dup key:\s*{\s*([^:]+):\s*"([^"]+)"/);
  
  if (fieldMatch) {
    const [, indexName, fieldName, duplicateValue] = fieldMatch;
    
    // Map field names to user-friendly labels
    const fieldLabels = {
      'personalInfo.idNumber': 'ID/Passport Number',
      'personalInfo.email': 'Email Address',
      'personalInfo.phone': 'Phone Number',
      'customerCode': 'Customer Code',
      'email': 'Email Address',
      'phone': 'Phone Number',
      'idNumber': 'ID/Passport Number',
      'username': 'Username',
      'employeeId': 'Employee ID',
      'productCode': 'Product Code',
      'branchCode': 'Branch Code',
      'accountNumber': 'Account Number'
    };

    const friendlyFieldName = fieldLabels[fieldName] || fieldName;
    
    return `A record with this ${friendlyFieldName} (${duplicateValue}) already exists. Please use a different ${friendlyFieldName.toLowerCase()}.`;
  }

  // Fallback for unparseable duplicate key errors
  return 'This record already exists. Please check your input and try again.';
};

/**
 * Format MongoDB validation errors into user-friendly messages
 * @param {Error} error - The MongoDB validation error object
 * @returns {string} - User-friendly error message
 */
export const formatValidationError = (error) => {
  if (!error.errors) {
    return error.message;
  }

  const errors = Object.values(error.errors);
  const messages = errors.map(err => {
    const fieldName = err.path;
    const fieldLabels = {
      'personalInfo.fullName': 'Full Name',
      'personalInfo.dob': 'Date of Birth',
      'personalInfo.gender': 'Gender',
      'personalInfo.idNumber': 'ID/Passport Number',
      'contact.phone': 'Phone Number',
      'contact.email': 'Email Address',
      'branch': 'Branch',
      'customerCode': 'Customer Code'
    };

    const friendlyFieldName = fieldLabels[fieldName] || fieldName;
    
    if (err.kind === 'required') {
      return `${friendlyFieldName} is required.`;
    } else if (err.kind === 'enum') {
      return `${friendlyFieldName} must be one of: ${err.properties.enumValues.join(', ')}.`;
    } else if (err.kind === 'min' || err.kind === 'max') {
      return `${friendlyFieldName} ${err.message}.`;
    } else {
      return `${friendlyFieldName}: ${err.message}`;
    }
  });

  return messages.join(' ');
};

/**
 * Format MongoDB cast errors into user-friendly messages
 * @param {Error} error - The MongoDB cast error object
 * @returns {string} - User-friendly error message
 */
export const formatCastError = (error) => {
  if (!error.message || !error.message.includes('Cast to')) {
    return error.message;
  }

  const message = error.message;
  const fieldMatch = message.match(/Cast to (\w+) failed for value "([^"]+)" at path "([^"]+)"/);
  
  if (fieldMatch) {
    const [, expectedType, invalidValue, fieldPath] = fieldMatch;
    
    const fieldLabels = {
      'personalInfo.dob': 'Date of Birth',
      'employment.salary': 'Salary',
      'employment.monthlyRevenue': 'Monthly Revenue',
      'branch': 'Branch',
      'createdBy': 'Created By'
    };

    const friendlyFieldName = fieldLabels[fieldPath] || fieldPath;
    
    if (expectedType === 'ObjectId') {
      return `Invalid ${friendlyFieldName}. Please select a valid option.`;
    } else if (expectedType === 'Date') {
      return `Invalid date format for ${friendlyFieldName}. Please enter a valid date.`;
    } else if (expectedType === 'Number') {
      return `Invalid number format for ${friendlyFieldName}. Please enter a valid number.`;
    }
  }

  return 'Invalid data format. Please check your input and try again.';
};

/**
 * Main function to format any MongoDB error into a user-friendly message
 * @param {Error} error - The error object
 * @returns {string} - User-friendly error message
 */
export const formatMongoError = (error) => {
  if (!error) {
    return 'An unexpected error occurred.';
  }

  // Handle duplicate key errors
  if (error.code === 11000 || error.message?.includes('E11000')) {
    return formatDuplicateKeyError(error);
  }

  // Handle validation errors
  if (error.name === 'ValidationError') {
    return formatValidationError(error);
  }

  // Handle cast errors
  if (error.name === 'CastError') {
    return formatCastError(error);
  }

  // Handle other common MongoDB errors
  if (error.name === 'MongoError' || error.name === 'MongoServerError') {
    switch (error.code) {
      case 11000:
        return formatDuplicateKeyError(error);
      default:
        return 'Database error occurred. Please try again.';
    }
  }

  // Return the original message for non-MongoDB errors
  return error.message || 'An unexpected error occurred.';
};

/**
 * Format general application errors with context
 * @param {Error} error - The error object
 * @param {string} operation - The operation being performed (e.g., "create customer", "update loan")
 * @returns {string} - User-friendly error message
 */
export const formatApplicationError = (error, operation = 'perform this action') => {
  const formattedMessage = formatMongoError(error);
  
  // If it's already a user-friendly message, return it
  if (!formattedMessage.includes('E11000') && !formattedMessage.includes('Cast to')) {
    return formattedMessage;
  }

  // Otherwise, provide a generic message with the operation context
  return `Failed to ${operation}. ${formattedMessage}`;
};
