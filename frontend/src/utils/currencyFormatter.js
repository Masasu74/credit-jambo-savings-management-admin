/**
 * Currency Formatter Utility
 * Formats amounts in Rwandan Francs (RWF)
 */

/**
 * Format amount in RWF currency
 * @param {number} amount - The amount to format
 * @param {boolean} showSymbol - Whether to show "Frw" symbol (default: true)
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, showSymbol = true) => {
  if (amount === null || amount === undefined) return showSymbol ? 'Frw 0' : '0';
  
  const formattedNumber = new Intl.NumberFormat('en-RW', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
  
  return showSymbol ? `Frw ${formattedNumber}` : formattedNumber;
};

/**
 * Format amount using Intl.NumberFormat with RWF currency
 * @param {number} amount - The amount to format
 * @returns {string} Formatted currency string
 */
export const formatCurrencyIntl = (amount) => {
  if (amount === null || amount === undefined) return 'Frw 0';
  
  return new Intl.NumberFormat('en-RW', {
    style: 'currency',
    currency: 'RWF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

/**
 * Format amount in compact notation (e.g., 1.5M, 10K)
 * @param {number} amount - The amount to format
 * @returns {string} Formatted compact currency string
 */
export const formatCurrencyCompact = (amount) => {
  if (amount === null || amount === undefined) return 'Frw 0';
  
  const formattedNumber = new Intl.NumberFormat('en-RW', {
    notation: 'compact',
    minimumFractionDigits: 0,
    maximumFractionDigits: 1
  }).format(amount);
  
  return `Frw ${formattedNumber}`;
};

/**
 * Parse currency string to number
 * @param {string} currencyString - Currency string to parse
 * @returns {number} Parsed number
 */
export const parseCurrency = (currencyString) => {
  if (!currencyString) return 0;
  
  // Remove "Frw", "RWF", commas, and spaces
  const cleanedString = currencyString
    .replace(/Frw/gi, '')
    .replace(/RWF/gi, '')
    .replace(/,/g, '')
    .trim();
  
  return parseFloat(cleanedString) || 0;
};

export default formatCurrency;

