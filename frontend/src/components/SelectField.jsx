const SelectField = ({
  label,
  name,
  value,
  onChange,
  options = [],
  required = false,
  disabled = false,
  className = "",
  id,
}) => {
  const selectId = id || label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className={`flex flex-col gap-2 w-full ${className}`}>
      <label htmlFor={selectId} className="text-sm font-semibold text-gray-700 dark:text-gray-300">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        id={selectId}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        className="h-12 px-4 border border-gray-300 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 w-full bg-white/90 dark:bg-gray-700/90 backdrop-blur-sm text-gray-900 dark:text-white disabled:opacity-70 shadow-sm hover:shadow-md"
      >
        <option value="" className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white">-- Select {label} --</option>
        {options.map((option) => {
          const val = typeof option === "object" ? option.value : option;
          const label = typeof option === "object" ? option.label : option;
          return (
            <option key={val} value={val} className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
              {label}
            </option>
          );
        })}
      </select>
    </div>
  );
};

export default SelectField;
