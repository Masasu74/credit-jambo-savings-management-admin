import React from 'react';

const CustomCheckbox = ({
  checked = false,
  onChange,
  label,
  disabled = false,
  size = 'md',
  color = 'blue',
  className = '',
  labelClassName = '',
  containerClassName = '',
  showBackground = true,
  id,
  name,
  ...props
}) => {
  // Size variants
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  // Color variants
  const colorClasses = {
    blue: {
      checked: 'bg-blue-600 border-blue-600',
      unchecked: 'bg-white border-gray-300',
      dark: {
        checked: 'bg-blue-600 border-blue-600',
        unchecked: 'bg-gray-700 border-gray-600'
      }
    },
    green: {
      checked: 'bg-green-600 border-green-600',
      unchecked: 'bg-white border-gray-300',
      dark: {
        checked: 'bg-green-600 border-green-600',
        unchecked: 'bg-gray-700 border-gray-600'
      }
    },
    red: {
      checked: 'bg-red-600 border-red-600',
      unchecked: 'bg-white border-gray-300',
      dark: {
        checked: 'bg-red-600 border-red-600',
        unchecked: 'bg-gray-700 border-gray-600'
      }
    },
    purple: {
      checked: 'bg-purple-600 border-purple-600',
      unchecked: 'bg-white border-gray-300',
      dark: {
        checked: 'bg-purple-600 border-purple-600',
        unchecked: 'bg-gray-700 border-gray-600'
      }
    }
  };

  // Icon size variants
  const iconSizeClasses = {
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  const handleClick = () => {
    if (!disabled && onChange) {
      onChange(!checked);
    }
  };

  const checkboxClasses = `
    ${sizeClasses[size]}
    border-2 rounded cursor-pointer flex items-center justify-center transition-colors
    ${checked 
      ? colorClasses[color].checked 
      : colorClasses[color].unchecked
    }
    ${disabled 
      ? 'opacity-50 cursor-not-allowed' 
      : 'hover:opacity-80'
    }
    ${className}
  `.trim();

  const labelClasses = `
    text-sm font-medium cursor-pointer select-none
    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
    ${labelClassName}
  `.trim();

  const containerClasses = `
    flex items-center gap-3
    ${showBackground ? 'p-4 rounded-lg transition-colors bg-gray-50 dark:bg-gray-700' : ''}
    ${containerClassName}
  `.trim();

  const CheckIcon = () => (
    <svg 
      className={`${iconSizeClasses[size]} text-white`} 
      fill="currentColor" 
      viewBox="0 0 20 20"
    >
      <path 
        fillRule="evenodd" 
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
        clipRule="evenodd" 
      />
    </svg>
  );

  return (
    <div className={containerClasses}>
      <div 
        className={checkboxClasses}
        onClick={handleClick}
        role="checkbox"
        aria-checked={checked}
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
            e.preventDefault();
            handleClick();
          }
        }}
        {...props}
      >
        {checked && <CheckIcon />}
      </div>
      
      {label && (
        <span 
          className={labelClasses}
          onClick={handleClick}
        >
          {label}
        </span>
      )}
      
      {/* Hidden input for form compatibility */}
      <input
        type="checkbox"
        checked={checked}
        onChange={() => {}} // Handled by our custom click handler
        disabled={disabled}
        id={id}
        name={name}
        className="sr-only"
        tabIndex={-1}
      />
    </div>
  );
};

export default CustomCheckbox;
