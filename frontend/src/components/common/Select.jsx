import React, { forwardRef } from 'react';

export const Select = forwardRef(({ 
  label, 
  error, 
  options = [], 
  placeholder = 'Select option', 
  className = '', 
  ...props 
}, ref) => {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          {label}
        </label>
      )}
      <select
        ref={ref}
        className="w-full px-4 py-3 rounded-xl glass-input text-sm text-gray-200"
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-[#12101b] text-gray-200">
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <span className="text-xs text-red-400 mt-1 block">
          {error}
        </span>
      )}
    </div>
  );
});

Select.displayName = 'Select';
export default Select;
