import React, { useState, useEffect, useRef } from 'react';
import { FaSearch, FaChevronDown, FaChevronUp, FaTimes } from 'react-icons/fa';

const SearchableSelect = ({
  label,
  value,
  onChange,
  options = [],
  required = false,
  disabled = false,
  className = "",
  id,
  placeholder = "Search and select...",
  maxHeight = "300px",
  pageSize = 10,
  renderOption = null,
  searchFields = ['label'],
  noOptionsMessage = "No options found",
  loading = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filteredOptions, setFilteredOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  const selectId = id || label.toLowerCase().replace(/\s+/g, "-");

  // Find selected option when value changes
  useEffect(() => {
    if (value) {
      const found = options.find(opt => opt.value === value);
      setSelectedOption(found || null);
    } else {
      setSelectedOption(null);
    }
  }, [value, options]);

  // Filter options based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredOptions(options);
    } else {
      const filtered = options.filter(option => {
        return searchFields.some(field => {
          const fieldValue = option[field];
          if (typeof fieldValue === 'string') {
            return fieldValue.toLowerCase().includes(searchTerm.toLowerCase());
          }
          return false;
        });
      });
      setFilteredOptions(filtered);
    }
    // Only reset to page 1 if search term actually changed (not on initial load)
    if (searchTerm !== '') {
      setCurrentPage(1);
    }
  }, [searchTerm, searchFields]); // Removed 'options' dependency to prevent unnecessary re-runs

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm("");
        setCurrentPage(1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle options changes (initial load or actual updates)
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredOptions(options);
    }
  }, [options]); // Only depend on options, not searchTerm

  // Pagination
  const totalPages = Math.ceil(filteredOptions.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedOptions = filteredOptions.slice(startIndex, endIndex);
  


  const handleOptionSelect = (option) => {
    setSelectedOption(option);
    onChange({ target: { value: option.value } });
    setIsOpen(false);
    setSearchTerm("");
    setCurrentPage(1);
  };

  const handleClear = () => {
    setSelectedOption(null);
    onChange({ target: { value: "" } });
    setSearchTerm("");
    setCurrentPage(1);
  };

  const toggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      if (!isOpen) {
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    }
  };

  const handleSearchChange = (e) => {
    const newSearchTerm = e.target.value;
    setSearchTerm(newSearchTerm);
    // Reset to page 1 when search term changes
    setCurrentPage(1);
  };

  const goToPage = (page) => {
    const newPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(newPage);
  };

  const defaultRenderOption = (option) => (
    <div className="flex flex-col">
      <span className="font-medium text-gray-900">{option.label}</span>
      {option.subtitle && (
        <span className="text-sm text-gray-500">{option.subtitle}</span>
      )}
    </div>
  );

  return (
    <div className={`relative w-full ${className}`}>
      <label htmlFor={selectId} className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      <div className="relative">
        <div
          ref={dropdownRef}
          className={`relative w-full cursor-pointer ${
            disabled ? 'opacity-70 cursor-not-allowed' : ''
          }`}
        >
          {/* Display selected value or placeholder */}
          <div
            onClick={toggleDropdown}
            className={`h-12 px-4 border border-gray-300 dark:border-gray-600 rounded-xl text-sm focus:outline-none transition-all duration-200 w-full bg-white/90 dark:bg-gray-700/90 backdrop-blur-sm text-gray-900 dark:text-white shadow-sm hover:shadow-md flex items-center justify-between ${
              isOpen ? 'ring-2 ring-blue-500/20 border-blue-500' : ''
            }`}
          >
            {selectedOption ? (
              <div className="flex-1 text-left">
                {renderOption ? renderOption(selectedOption) : defaultRenderOption(selectedOption)}
              </div>
            ) : (
              <span className="text-gray-500">{placeholder}</span>
            )}
            
            <div className="flex items-center space-x-2">
              {selectedOption && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClear();
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <FaTimes size={14} />
                </button>
              )}
              {isOpen ? <FaChevronUp size={14} /> : <FaChevronDown size={14} />}
            </div>
          </div>

          {/* Dropdown */}
          {isOpen && (
            <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl shadow-lg">
              {/* Search input */}
              <div className="p-3 border-b border-gray-200 dark:border-gray-600">
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Options list */}
              <div className="max-h-60 overflow-y-auto">
                {loading ? (
                  <div className="p-4 text-center text-gray-500">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-2">Loading...</p>
                  </div>
                ) : paginatedOptions.length > 0 ? (
                  <div>
                    {paginatedOptions.map((option, index) => (
                      <div
                        key={`${option.value}-${currentPage}-${index}`}
                        onClick={() => handleOptionSelect(option)}
                        className="px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer border-b border-gray-100 dark:border-gray-600 last:border-b-0 transition-colors"
                      >
                        {renderOption ? renderOption(option) : defaultRenderOption(option)}
                      </div>
                    ))}
                    <div className="px-4 py-2 text-xs text-gray-500 bg-gray-50 dark:bg-gray-800 text-center">
                      Showing {startIndex + 1}-{Math.min(endIndex, filteredOptions.length)} of {filteredOptions.length} options
                    </div>
                  </div>
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    {searchTerm ? noOptionsMessage : "No options available"}
                  </div>
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div key={`pagination-${currentPage}`} className="p-3 border-t border-gray-200 dark:border-gray-600 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      goToPage(currentPage - 1);
                    }}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Page {currentPage} of {totalPages} ({filteredOptions.length} total options)
                  </span>
                  
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      goToPage(currentPage + 1);
                    }}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchableSelect;
