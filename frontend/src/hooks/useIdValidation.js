import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

/**
 * Custom hook to validate ID parameters from useParams
 * @param {string} id - The ID from useParams
 * @param {string} entityName - Name of the entity (e.g., 'employee', 'customer')
 * @param {string} redirectPath - Path to redirect to if ID is invalid
 * @returns {boolean} - True if ID is valid, false otherwise
 */
export const useIdValidation = (id, entityName = 'item', redirectPath = '/') => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!id || id === 'undefined' || id === 'null') {
      toast.error(`Invalid ${entityName} ID`);
      navigate(redirectPath);
    }
  }, [id, entityName, redirectPath, navigate]);

  return id && id !== 'undefined' && id !== 'null';
};

/**
 * Utility function to validate ID before making API calls
 * @param {string} id - The ID to validate
 * @param {string} entityName - Name of the entity
 * @param {Function} navigate - Navigation function
 * @returns {boolean} - True if ID is valid, false otherwise
 */
export const validateId = (id, entityName = 'item', navigate = null) => {
  if (!id || id === 'undefined' || id === 'null') {
    toast.error(`Invalid ${entityName} ID`);
    if (navigate) {
      navigate('/');
    }
    return false;
  }
  return true;
};
