import React, { forwardRef } from 'react';

export const Input = forwardRef(({ 
  label, 
  error, 
  icon, 
  type = 'text', 
  placeholder, 
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
      <div className="relative">
        {icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          type={type}
          placeholder={placeholder}
          className={`w-full py-3 rounded-xl glass-input text-sm text-gray-200 ${icon ? 'pl-11' : 'px-4'}`}
          {...props}
        />
      </div>
      {error && (
        <span className="text-xs text-red-400 mt-1 block">
          {error}
        </span>
      )}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
