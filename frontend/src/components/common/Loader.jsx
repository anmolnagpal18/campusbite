import React from 'react';

export const Loader = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'h-5 w-5 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-3'
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`animate-spin rounded-full border-t-purple-500 border-r-transparent border-b-purple-500 border-l-transparent ${sizeClasses[size]}`}></div>
    </div>
  );
};
export default Loader;
