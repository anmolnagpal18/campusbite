import { useState } from 'react';

export const FilterSidebar = ({ onFilterChange }) => {
  const [filters, setFilters] = useState({
    is_vegetarian: false,
    is_vegan: false,
    is_jain: false,
    is_spicy: false,
    available_only: false,
  });

  const handleToggle = (key) => {
    const newFilters = { ...filters, [key]: !filters[key] };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const filterOptions = [
    { key: 'is_vegetarian', label: 'Vegetarian Only' },
    { key: 'is_vegan', label: 'Vegan Only' },
    { key: 'is_jain', label: 'Jain Friendly' },
    { key: 'is_spicy', label: 'Spicy Items' },
    { key: 'available_only', label: 'In Stock Only' },
  ];

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
      <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4">Filters</h3>
      <div className="space-y-3">
        {filterOptions.map((opt) => (
          <label key={opt.key} className="flex items-center gap-3 cursor-pointer group">
            <div className="relative flex items-center">
              <input
                type="checkbox"
                className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 checked:border-blue-600 checked:bg-blue-600 transition-all"
                checked={filters[opt.key]}
                onChange={() => handleToggle(opt.key)}
              />
              <svg
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none opacity-0 peer-checked:opacity-100 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="3"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white">
              {opt.label}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
};
