import React from 'react';

export const StatusBadge = ({ status }) => {
  const statusStyles = {
    APPROVED: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    PENDING: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    REJECTED: 'bg-red-500/10 text-red-400 border border-red-500/20',
  };

  const label = status?.toUpperCase() || 'PENDING';

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${statusStyles[label] || statusStyles.PENDING}`}>
      {label.toLowerCase()}
    </span>
  );
};
export default StatusBadge;
