export const StatusBadge = ({ status }) => {
  const getColors = () => {
    switch (status) {
      case 'APPROVED': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'REJECTED': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'SUSPENDED': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case true: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'; // is_active
      case false: return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const label = typeof status === 'boolean' ? (status ? 'Active' : 'Inactive') : status;

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getColors()}`}>
      {label}
    </span>
  );
};
