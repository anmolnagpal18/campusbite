import React from 'react';
import Loader from './Loader';

export const Button = ({ 
  children, 
  onClick, 
  type = 'button', 
  variant = 'primary', 
  size = 'md', 
  loading = false, 
  disabled = false, 
  className = '',
  icon,
  ...props 
}) => {
  const baseStyles = 'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 cursor-pointer focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg shadow-purple-500/10 hover:shadow-purple-500/20',
    secondary: 'bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/10',
    success: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    outline: 'border border-purple-500/30 hover:border-purple-500/80 text-purple-400 hover:text-purple-300 bg-transparent'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-6 py-3.5 text-base'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading ? <Loader size="sm" /> : icon}
      {children}
    </button>
  );
};
export default Button;
