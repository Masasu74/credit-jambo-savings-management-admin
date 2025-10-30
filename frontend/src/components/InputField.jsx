import { useSystemColors } from "../hooks/useSystemColors";

const InputField = ({
  label,
  type = "text",
  value,
  onChange,
  required = false,
  placeholder = "",
  className = "",
  id,
  min,
  max,
  name,
  helpText
}) => {
  const { colors } = useSystemColors();
  const inputId = id || label.toLowerCase().replace(/\s+/g, "-");

  // Fallback colors
  const fallbackColors = {
    primary: '#374151',
    secondary: '#111827',
    accent: '#6b7280',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444'
  };

  const currentColors = colors || fallbackColors;

  return (
    <div className={`flex flex-col gap-2 w-full ${className}`}>
      <label htmlFor={inputId} className="text-sm font-semibold text-gray-700 dark:text-gray-300">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        id={inputId}
        name={name}
        type={type}
        value={value || ''}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        min={min}
        max={max}
        className="h-12 px-4 border border-gray-300 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 transition-all duration-200 w-full bg-white/90 dark:bg-gray-700/90 backdrop-blur-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 shadow-sm hover:shadow-md"
        style={{
          '--focus-ring-color': currentColors.primary,
          '--focus-border-color': currentColors.primary
        }}
        onFocus={(e) => {
          e.target.style.borderColor = currentColors.primary;
          e.target.style.boxShadow = `0 0 0 2px ${currentColors.primary}20`;
        }}
        onBlur={(e) => {
          e.target.style.borderColor = '#d1d5db';
          e.target.style.boxShadow = 'none';
        }}
      />
      {helpText && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{helpText}</p>
      )}
    </div>
  );
};

export default InputField;
