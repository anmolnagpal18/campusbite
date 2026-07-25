import React from 'react';

export const EmptyState = ({ message = 'No data available', icon }) => {
  return (
    <div className="py-12 text-center text-gray-400 text-sm border border-dashed border-white/5 rounded-2xl bg-white/[0.01] flex flex-col items-center justify-center gap-3">
      {icon && <div className="text-gray-500">{icon}</div>}
      <p>{message}</p>
    </div>
  );
};
export default EmptyState;
