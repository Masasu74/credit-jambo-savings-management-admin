// 📁 components/TextareaField.jsx
const TextareaField = ({
    label,
    value,
    onChange,
    required = false,
    placeholder = "",
    className = "",
    rows = 4,
    id
  }) => {
    const inputId = id || label.toLowerCase().replace(/\s+/g, "-");
  
    return (
      <div className={`flex flex-col gap-1 w-full ${className}`}>
        <label htmlFor={inputId} className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <textarea
          id={inputId}
          value={value || ''}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          rows={rows}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition w-full resize-none bg-white/90 dark:bg-gray-700/90 backdrop-blur-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 shadow-sm hover:shadow-md"
        />
      </div>
    );
  };
  
  export default TextareaField;
  