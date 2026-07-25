import React from 'react';
import DataTable from '../common/DataTable';
import StatusBadge from '../common/StatusBadge';
import Button from '../common/Button';
import { Edit2, Trash2 } from 'lucide-react';

export const CategoryTable = ({ 
  categories = [], 
  loading, 
  onEdit, 
  onDelete, 
  searchVal, 
  onSearchChange,
  currentPage,
  totalCount,
  onPageChange
}) => {
  const headers = [
    { label: 'Category Name' },
    { label: 'Display Order' },
    { label: 'Total Items' },
    { label: 'Status' },
    { label: 'Actions', className: 'text-right' }
  ];

  return (
    <DataTable
      headers={headers}
      data={categories}
      loading={loading}
      emptyMessage="No categories created yet."
      searchVal={searchVal}
      onSearchChange={onSearchChange}
      searchPlaceholder="Search categories..."
      currentPage={currentPage}
      totalCount={totalCount}
      onPageChange={onPageChange}
      renderRow={(cat) => (
        <tr key={cat.id} className="hover:bg-white/[0.02] transition-colors">
          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-200">
            {cat.category_name}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
            {cat.display_order}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
            {cat.total_items} items
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <StatusBadge status={cat.status === 'ACTIVE' ? 'APPROVED' : 'REJECTED'} />
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(cat)}
              icon={<Edit2 className="h-3.5 w-3.5" />}
            />
            <Button
              variant="danger"
              size="sm"
              onClick={() => onDelete(cat)}
              icon={<Trash2 className="h-3.5 w-3.5" />}
            />
          </td>
        </tr>
      )}
    />
  );
};

export default CategoryTable;
