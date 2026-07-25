import React from 'react';
import Breadcrumb from './Breadcrumb';

export const PageHeader = ({ title, description, breadcrumbItems = [] }) => {
  return (
    <div className="mb-6 space-y-2">
      {breadcrumbItems.length > 0 && (
        <Breadcrumb items={breadcrumbItems} />
      )}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            {title}
          </h1>
          {description && (
            <p className="text-sm text-gray-400 mt-1">
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
export default PageHeader;
