import { useState, useEffect } from 'react';

export const SearchBox = ({ onSearch, placeholder = "Search..." }) => {
  const [query, setQuery] = useState('');

  // Basic debounce implementation
  useEffect(() => {
    const handler = setTimeout(() => onSearch(query), 300);
    return () => clearTimeout(handler);
  }, [query, onSearch]);

  return (
    <div className="relative w-full max-w-sm">
      <input
        type="text"
        className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
    </div>
  );
};
