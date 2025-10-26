import React from 'react';

const CustomRadio = ({
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
  value,
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
      checked: 'border-blue-600',
      unchecked: 'border-gray-300',
      dot: 'bg-blue-600',
      dark: {
        checked: 'border-blue-600',
        unchecked: 'border-gray-600',
        dot: 'bg-blue-600'
      }
    },
    green: {
      checked: 'border-green-600',
      unchecked: 'border-gray-300',
      dot: 'bg-green-600',
      dark: {
        checked: 'border-green-600',
        unchecked: 'border-gray-600',
        dot: 'bg-green-600'
      }
    },
    red: {
      checked: 'border-red-600',
      unchecked: 'border-gray-300',
      dot: 'bg-red-600',
      dark: {
        checked: 'border-red-600',
        unchecked: 'border-gray-600',
        dot: 'bg-red-600'
      }
    },
    purple: {
      checked: 'border-purple-600',
      unchecked: 'border-gray-300',
      dot: 'bg-purple-600',
      dark: {
        checked: 'border-purple-600',
        unchecked: 'border-gray-600',
        dot: 'bg-purple-600'
      }
    }
  };

  // Dot size variants
  const dotSizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3'
  };

  const handleClick = () => {
    if (!disabled && onChange) {
      onChange(value || true);
    }
  };

  const radioClasses = `
    ${sizeClasses[size]}
    border-2 rounded-full cursor-pointer flex items-center justify-center transition-colors
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

  const RadioDot = () => (
    <div 
      className={`${dotSizeClasses[size]} ${colorClasses[color].dot} rounded-full`}
    />
  );

  return (
    <div className={containerClasses}>
      <div 
        className={radioClasses}
        onClick={handleClick}
        role="radio"
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
        {checked && <RadioDot />}
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
        type="radio"
        checked={checked}
        onChange={() => {}} // Handled by our custom click handler
        disabled={disabled}
        id={id}
        name={name}
        value={value}
        className="sr-only"
        tabIndex={-1}
      />
    </div>
  );
};

export default CustomRadio;
