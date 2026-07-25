import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Breadcrumb = ({ items = [] }) => {
  return (
    <nav className="flex" aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-2 text-xs font-semibold text-gray-400">
        <li className="inline-flex items-center">
          <Link to="/" className="inline-flex items-center hover:text-white transition-colors">
            <Home className="mr-1.5 h-3.5 w-3.5" />
            Home
          </Link>
        </li>
        {items.map((item, idx) => (
          <li key={idx} className="inline-flex items-center">
            <ChevronRight className="h-3.5 w-3.5 mx-1 text-gray-600" />
            {item.path ? (
              <Link to={item.path} className="hover:text-white transition-colors">
                {item.label}
              </Link>
            ) : (
              <span className="text-gray-300">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};
export default Breadcrumb;
