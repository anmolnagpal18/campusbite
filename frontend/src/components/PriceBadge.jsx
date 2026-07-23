export const PriceBadge = ({ price, currency = '₹', className = '' }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 ${className}`}>
    {currency}{parseFloat(price).toFixed(2)}
  </span>
);
