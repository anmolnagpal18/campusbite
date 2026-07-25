import React from 'react';
import DataTable from '../common/DataTable';
import StatusBadge from '../common/StatusBadge';
import Button from '../common/Button';
import { Edit2, Trash2, Image as ImageIcon, ChevronUp, ChevronDown, CheckSquare, Square, RefreshCw, Move, Trash } from 'lucide-react';

export const FoodItemTable = ({
  items = [],
  categories = [],
  loading,
  onEdit,
  onDelete,
  searchVal,
  onSearchChange,
  currentPage,
  totalCount,
  onPageChange,
  pageSize,
  onPageSizeChange,
  
  // Selection
  selectedItemIds = [],
  onSelectionChange,
  onBulkAction,
  
  // Reorder
  onReorder
}) => {
  const headers = [
    {
      label: (
        <button 
          type="button"
          onClick={() => {
            if (selectedItemIds.length === items.length && items.length > 0) {
              onSelectionChange([]);
            } else {
              onSelectionChange(items.map(i => i.id));
            }
          }}
          className="text-gray-400 hover:text-gray-200 transition-colors focus:outline-none"
        >
          {selectedItemIds.length === items.length && items.length > 0 ? (
            <CheckSquare className="h-4 w-4 text-purple-400" />
          ) : (
            <Square className="h-4 w-4" />
          )}
        </button>
      ),
      className: 'w-10'
    },
    { label: 'Image' },
    { label: 'Item Name' },
    { label: 'Category' },
    { label: 'Price' },
    { label: 'Quantity' },
    { label: 'Availability' },
    { label: 'Display Order' },
    { label: 'Last Updated' },
    { label: 'Actions', className: 'text-right' }
  ];

  const handleToggleSelect = (id) => {
    if (selectedItemIds.includes(id)) {
      onSelectionChange(selectedItemIds.filter(selectedId => selectedId !== id));
    } else {
      onSelectionChange([...selectedItemIds, id]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Bulk Action Panel */}
      {selectedItemIds.length > 0 && (
        <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in">
          <span className="text-xs font-semibold text-purple-300">
            Selected {selectedItemIds.length} food items
          </span>
          <div className="flex flex-wrap gap-2 items-center justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onBulkAction('change_availability', 'AVAILABLE')}
              icon={<RefreshCw className="h-3.5 w-3.5" />}
            >
              Mark Available
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onBulkAction('change_availability', 'OUT_OF_STOCK')}
              icon={<RefreshCw className="h-3.5 w-3.5" />}
            >
              Mark Out of Stock
            </Button>

            <div className="relative inline-block">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    onBulkAction('move_category', parseInt(e.target.value));
                    e.target.value = '';
                  }
                }}
                className="px-3 py-1.5 bg-purple-950/20 border border-purple-500/30 text-purple-300 rounded-xl text-xs font-bold focus:outline-none"
              >
                <option value="">Move Category...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id} className="bg-[#12101b] text-gray-200">
                    {cat.category_name}
                  </option>
                ))}
              </select>
            </div>

            <Button
              variant="danger"
              size="sm"
              onClick={() => onBulkAction('delete')}
              icon={<Trash className="h-3.5 w-3.5" />}
            >
              Hide Selected
            </Button>

            <button
              onClick={() => onSelectionChange([])}
              className="text-xs text-gray-400 hover:text-gray-200 underline ml-2 cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Pagination Page Size Controller */}
      <div className="flex justify-end gap-2 items-center text-xs text-gray-400">
        <span>Show:</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(parseInt(e.target.value))}
          className="px-2 py-1 rounded bg-white/5 border border-white/10 text-gray-300 font-semibold focus:outline-none"
        >
          <option value={10}>10 per page</option>
          <option value={25}>25 per page</option>
          <option value={50}>50 per page</option>
        </select>
      </div>

      <DataTable
        headers={headers}
        data={items}
        loading={loading}
        emptyMessage="No food items created yet."
        searchVal={searchVal}
        onSearchChange={onSearchChange}
        searchPlaceholder="Search items by name..."
        currentPage={currentPage}
        totalCount={totalCount}
        onPageChange={onPageChange}
        pageSize={pageSize}
        renderRow={(item, idx) => (
          <tr key={item.id} className={`hover:bg-white/[0.02] transition-colors ${selectedItemIds.includes(item.id) ? 'bg-purple-500/5' : ''}`}>
            <td className="px-6 py-4 whitespace-nowrap">
              <button 
                type="button"
                onClick={() => handleToggleSelect(item.id)}
                className="text-gray-400 hover:text-gray-200 transition-colors focus:outline-none"
              >
                {selectedItemIds.includes(item.id) ? (
                  <CheckSquare className="h-4 w-4 text-purple-400" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
              </button>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="h-10 w-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                {item.food_thumbnail ? (
                  <img src={item.food_thumbnail} alt={item.item_name} className="h-full w-full object-cover" />
                ) : item.food_image ? (
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
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-300">{item.display_order}</span>
                <div className="flex flex-col">
                  <button 
                    disabled={idx === 0 && currentPage === 1}
                    onClick={() => onReorder(item.id, 'up')}
                    className="text-gray-500 hover:text-gray-300 disabled:opacity-30 disabled:hover:text-gray-500 cursor-pointer"
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                  <button 
                    disabled={idx === items.length - 1 && currentPage * pageSize >= totalCount}
                    onClick={() => onReorder(item.id, 'down')}
                    className="text-gray-500 hover:text-gray-300 disabled:opacity-30 disabled:hover:text-gray-500 cursor-pointer"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
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
    </div>
  );
};

export default FoodItemTable;
