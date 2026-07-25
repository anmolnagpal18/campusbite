import React from 'react';
import DataTable from '../common/DataTable';
import StatusBadge from '../common/StatusBadge';
import Button from '../common/Button';
import { Edit2, Trash2, Image as ImageIcon } from 'lucide-react';

export const FoodItemTable = ({
  items = [],
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
    { label: 'Image' },
    { label: 'Item Name' },
    { label: 'Category' },
    { label: 'Price' },
    { label: 'Quantity' },
    { label: 'Availability' },
    { label: 'Last Updated' },
    { label: 'Actions', className: 'text-right' }
  ];

  return (
    <DataTable
      headers={headers}
      data={items}
      loading={loading}
      emptyMessage="No food items created yet."
      searchVal={searchVal}
      onSearchChange={onSearchChange}
      searchPlaceholder="Search food items..."
      currentPage={currentPage}
      totalCount={totalCount}
      onPageChange={onPageChange}
      renderRow={(item) => (
        <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="h-10 w-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
              {item.food_image ? (
                <img src={item.food_image} alt={item.item_name} className="h-full w-full object-cover" />
              ) : (
                <ImageIcon className="h-5 w-5 text-gray-500" />
              )}
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-200">
            {item.item_name}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
            {item.category_name}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-purple-400">
            ${parseFloat(item.price).toFixed(2)}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
            {item.quantity}
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <StatusBadge status={item.availability === 'AVAILABLE' ? 'APPROVED' : 'REJECTED'} />
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400">
            {new Date(item.updated_at).toLocaleDateString()}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(item)}
              icon={<Edit2 className="h-3.5 w-3.5" />}
            />
            <Button
              variant="danger"
              size="sm"
              onClick={() => onDelete(item)}
              icon={<Trash2 className="h-3.5 w-3.5" />}
            />
          </td>
        </tr>
      )}
    />
  );
};

export default FoodItemTable;
