import React from 'react';

export const StatusBadge = ({ status }) => {
  const statusStyles = {
    // Approval statuses
    APPROVED: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    PENDING: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    REJECTED: 'bg-red-500/10 text-red-400 border border-red-500/20',
    
    // Order statuses
    PREPARING: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    READY: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
    COMPLETED: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    CANCELLED: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',

    // Order types
    INSTANT: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20',
    PREORDER: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',

    // Payment statuses
    SUCCESS: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    FAILED: 'bg-red-500/10 text-red-400 border border-red-500/20',
  };

  const label = status?.toUpperCase() || 'PENDING';

  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusStyles[label] || 'bg-gray-500/10 text-gray-400 border border-gray-500/20'}`}>
      {label.replace('_', ' ')}
    </span>
  );
};
export default StatusBadge;
