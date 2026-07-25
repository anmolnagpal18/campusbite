import React from 'react';
import Card from './Card';

export const StatCard = ({ title, value, icon, className = '' }) => {
  return (
    <Card className={`flex items-center justify-between hover:translate-y-0 ${className}`}>
      <div>
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">
          {title}
        </span>
        <span className="text-3xl font-extrabold text-white tracking-tight">
          {value}
        </span>
      </div>
      {icon && (
        <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-2xl">
          {icon}
        </div>
      )}
    </Card>
  );
};
export default StatCard;
