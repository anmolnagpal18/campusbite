import React from 'react';
import Button from './Button';

export const EmptyState = ({ 
  title = 'No records found', 
  message, 
  icon,
  actionText,
  onActionClick
}) => {
  return (
    <div className="py-12 px-4 text-center border border-dashed border-white/5 rounded-2xl bg-white/[0.01] flex flex-col items-center justify-center max-w-sm mx-auto my-4">
      {icon && (
        <div className="p-3 bg-white/5 border border-white/5 rounded-2xl text-gray-400 mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-sm font-bold text-gray-200">{title}</h3>
      {message && (
        <p className="text-xs text-gray-400 mt-1 leading-relaxed max-w-xs">
          {message}
        </p>
      )}
      {actionText && onActionClick && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onActionClick}
          className="mt-4"
        >
          {actionText}
        </Button>
      )}
    </div>
  );
};
export default EmptyState;
