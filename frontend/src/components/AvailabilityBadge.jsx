export const AvailabilityBadge = ({ isAvailable, className = '' }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isAvailable ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'} ${className}`}>
    {isAvailable ? 'Available' : 'Out of Stock'}
  </span>
);
