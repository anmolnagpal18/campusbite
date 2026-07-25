import React from 'react';

export const Card = ({ children, className = '', ...props }) => {
  return (
    <div 
      className={`glass-card p-6 rounded-2xl border border-white/5 shadow-xl ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
export default Card;
