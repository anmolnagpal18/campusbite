import React, { useState, useEffect } from 'react';
import PageHeader from '../components/common/PageHeader';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import ConfirmDialog from '../components/common/ConfirmDialog';
import CategoryTable from '../components/vendor/CategoryTable';
import FoodItemTable from '../components/vendor/FoodItemTable';
import CategoryModal from '../components/vendor/CategoryModal';
import FoodItemModal from '../components/vendor/FoodItemModal';
import MenuPreview from '../components/vendor/MenuPreview';
import EmptyState from '../components/common/EmptyState';

import categoryService from '../services/category';
import foodItemService from '../services/foodItem';
import vendorShopService from '../services/vendorShop';
import toast from 'react-hot-toast';
import { FolderPlus, PlusCircle, ChefHat } from 'lucide-react';

export const MenuManagement = () => {
  const [activeTab, setActiveTab] = useState('categories');

  const [restaurant, setRestaurant] = useState(null);

  // Categories lists
  const [categories, setCategories] = useState([]);
  const [catTotal, setCatTotal] = useState(0);
  const [catPage, setCatPage] = useState(1);
  const [catSearch, setCatSearch] = useState('');
  const [catLoading, setCatLoading] = useState(true);

  // Items lists
  const [items, setItems] = useState([]);
  const [itemTotal, setItemTotal] = useState(0);
  const [itemPage, setItemPage] = useState(1);
  const [itemSearch, setItemSearch] = useState('');
  const [itemCategory, setItemCategory] = useState('');
  const [itemAvailability, setItemAvailability] = useState('');
  const [itemPageSize, setItemPageSize] = useState(10);
  const [itemLoading, setItemLoading] = useState(true);

  // Selections & Bulks
  const [selectedItemIds, setSelectedItemIds] = useState([]);

  // All categories & items for live menu preview
  const [allCategories, setAllCategories] = useState([]);
  const [allItems, setAllItems] = useState([]);

  // Modals state
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [catSubmitting, setCatSubmitting] = useState(false);

  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemSubmitting, setItemSubmitting] = useState(false);

  // Deletions
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // { type: 'category' | 'item' | 'bulk_items', obj: ... }

  const fetchRestaurant = async () => {
    try {
      const res = await vendorShopService.getShopDetails();
      if (res && res.success) {
        setRestaurant(res.data);
      }
    } catch (err) {
      console.error('Failed to load restaurant info', err);
    }
  };

  const fetchCategories = async () => {
    setCatLoading(true);
    try {
      const res = await categoryService.getCategories(catPage, catSearch);
      if (res && res.success && res.data) {
        setCategories(res.data.results);
        setCatTotal(res.data.count);
      }
    } catch (err) {
      toast.error('Failed to load categories.');
    } finally {
      setCatLoading(false);
    }
  };

  const fetchItems = async () => {
    setItemLoading(true);
    try {
      const res = await foodItemService.getFoodItems(
        itemPage, 
        itemSearch, 
        itemCategory, 
        itemAvailability, 
        itemPageSize
      );
      if (res && res.success && res.data) {
        setItems(res.data.results);
        setItemTotal(res.data.count);
      }
    } catch (err) {
      toast.error('Failed to load food items.');
    } finally {
      setItemLoading(false);
    }
  };

  const syncMenuPreview = async () => {
    try {
      // Fetch full unpaginated categories & items lists for customer preview panel
      const catRes = await categoryService.getCategories(1, '');
      const itemsRes = await foodItemService.getFoodItems(1, '', '', '', 200);
      
      if (catRes && catRes.success && catRes.data) {
        setAllCategories(catRes.data.results);
      }
      if (itemsRes && itemsRes.success && itemsRes.data) {
        setAllItems(itemsRes.data.results);
      }
    } catch (err) {
      console.error('Preview sync failed', err);
    }
  };

  useEffect(() => {
    fetchRestaurant();
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [catPage, catSearch]);

  useEffect(() => {
    fetchItems();
    setSelectedItemIds([]); // reset selections on filter change
  }, [itemPage, itemSearch, itemCategory, itemAvailability, itemPageSize]);

  useEffect(() => {
    syncMenuPreview();
  }, [categories, items]);

  const handleCategorySubmit = async (data) => {
    setCatSubmitting(true);
    try {
      if (editingCat) {
        await categoryService.updateCategory(editingCat.id, data);
        toast.success('Category updated successfully');
      } else {
        await categoryService.createCategory(data);
        toast.success('Category created successfully');
      }
      setCatModalOpen(false);
      setEditingCat(null);
      fetchCategories();
    } catch (err) {
      const errMsg = err.response?.data?.category_name?.[0] || 'Validation error occurred.';
      toast.error(errMsg);
    } finally {
      setCatSubmitting(false);
    }
  };

  const handleItemSubmit = async (formData) => {
    setItemSubmitting(true);
    try {
      if (editingItem) {
        await foodItemService.updateFoodItem(editingItem.id, formData);
        toast.success('Food item updated successfully');
      } else {
        await foodItemService.createFoodItem(formData);
        toast.success('Food item created successfully');
      }
      setItemModalOpen(false);
      setEditingItem(null);
      fetchItems();
    } catch (err) {
      const errMsg = err.response?.data?.item_name?.[0] || err.response?.data?.food_image?.[0] || 'Validation error occurred.';
      toast.error(errMsg);
    } finally {
      setItemSubmitting(false);
    }
  };

  const handleDeleteTrigger = (type, obj) => {
    setDeleteTarget({ type, obj });
    setDeleteConfirmOpen(true);
  };

  // Reordering handler
  const handleReorder = async (itemId, direction) => {
    const idx = items.findIndex((i) => i.id === itemId);
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    
    if (targetIdx >= 0 && targetIdx < items.length) {
      const currentItem = items[idx];
      const targetItem = items[targetIdx];
      
      const payload = [
        { id: currentItem.id, display_order: targetItem.display_order || idx + 1 },
        { id: targetItem.id, display_order: currentItem.display_order || idx }
      ];

      try {
        await foodItemService.reorderFoodItems(payload);
        toast.success('Menu order updated');
        fetchItems();
      } catch (err) {
        toast.error('Failed to save display order reorder.');
      }
    }
  };

  // Bulk operation execution
  const handleBulkAction = async (action, value) => {
    if (action === 'delete') {
      setDeleteTarget({ type: 'bulk_items', obj: selectedItemIds });
      setDeleteConfirmOpen(true);
      return;
    }

    try {
      const payload = {
        action,
        item_ids: selectedItemIds
      };
      if (action === 'change_availability') {
        payload.availability = value;
      } else if (action === 'move_category') {
        payload.category_id = value;
      }

      await foodItemService.bulkOperations(payload);
      toast.success('Bulk update completed successfully');
      setSelectedItemIds([]);
      fetchItems();
    } catch (err) {
      toast.error('Bulk action failed.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    const { type, obj } = deleteTarget;

    try {
      if (type === 'category') {
        await categoryService.deleteCategory(obj.id);
        toast.success('Category deleted successfully');
        fetchCategories();
        fetchItems();
      } else if (type === 'item') {
        await foodItemService.deleteFoodItem(obj.id);
        toast.success('Food item deleted successfully');
        fetchItems();
      } else if (type === 'bulk_items') {
        await foodItemService.bulkOperations({
          action: 'delete',
          item_ids: obj
        });
        toast.success(`Successfully deleted ${obj.length} food items`);
        setSelectedItemIds([]);
        fetchItems();
      }
    } catch (err) {
      toast.error('Action execution failed.');
    } finally {
      setDeleteConfirmOpen(false);
      setDeleteTarget(null);
    }
  };

  const hasNoCategories = categories.length === 0 && !catSearch && !catLoading;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Menu Management"
        description="Configure food categories and list individual food dishes available for order."
        breadcrumbItems={[
          { label: 'Dashboard', path: '/vendor/dashboard' },
          { label: 'Menu Management' }
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="hover:translate-y-0">
            {hasNoCategories ? (
              <EmptyState
                title="Your menu is empty."
                message="Create your first category to start adding food items."
                icon={<ChefHat className="h-12 w-12 text-purple-400" />}
                actionText="Add Category"
                onActionClick={() => {
                  setEditingCat(null);
                  setCatModalOpen(true);
                }}
              />
            ) : (
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-white/5 pb-4 mb-6 gap-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setActiveTab('categories')}
                      className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all border ${activeTab === 'categories' ? 'bg-purple-500/10 border-purple-500/30 text-purple-400' : 'bg-transparent border-transparent text-gray-400 hover:text-gray-200'}`}
                    >
                      Categories
                    </button>
                    <button
                      onClick={() => setActiveTab('items')}
                      className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all border ${activeTab === 'items' ? 'bg-purple-500/10 border-purple-500/30 text-purple-400' : 'bg-transparent border-transparent text-gray-400 hover:text-gray-200'}`}
                    >
                      Food Items
                    </button>
                  </div>

                  <div>
                    {activeTab === 'categories' ? (
                      <Button
                        size="sm"
                        onClick={() => {
                          setEditingCat(null);
                          setCatModalOpen(true);
                        }}
                        icon={<FolderPlus className="h-4 w-4" />}
                      >
                        Add Category
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => {
                          setEditingItem(null);
                          setItemModalOpen(true);
                        }}
                        icon={<PlusCircle className="h-4 w-4" />}
                        disabled={categories.length === 0}
                      >
                        Add Food Item
                      </Button>
                    )}
                  </div>
                </div>

                {activeTab === 'categories' ? (
                  <CategoryTable
                    categories={categories}
                    loading={catLoading}
                    onEdit={(cat) => {
                      setEditingCat(cat);
                      setCatModalOpen(true);
                    }}
                    onDelete={(cat) => handleDeleteTrigger('category', cat)}
                    searchVal={catSearch}
                    onSearchChange={(val) => {
                      setCatSearch(val);
                      setCatPage(1);
                    }}
                    currentPage={catPage}
                    totalCount={catTotal}
                    onPageChange={setCatPage}
                  />
                ) : (
                  <div className="space-y-4">
                    {/* Filters Section */}
                    <div className="flex flex-wrap gap-4 items-center bg-white/[0.01] p-3 rounded-2xl border border-white/5">
                      <select
                        value={itemCategory}
                        onChange={(e) => {
                          setItemCategory(e.target.value);
                          setItemPage(1);
                        }}
                        className="px-4 py-2.5 rounded-xl glass-input text-xs font-semibold text-gray-300 focus:outline-none"
                      >
                        <option value="">All Categories</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>{c.category_name}</option>
                        ))}
                      </select>

                      <select
                        value={itemAvailability}
                        onChange={(e) => {
                          setItemAvailability(e.target.value);
                          setItemPage(1);
                        }}
                        className="px-4 py-2.5 rounded-xl glass-input text-xs font-semibold text-gray-300 focus:outline-none"
                      >
                        <option value="">All Availabilities</option>
                        <option value="AVAILABLE">Available</option>
                        <option value="OUT_OF_STOCK">Out of Stock</option>
                      </select>
                    </div>

                    <FoodItemTable
                      items={items}
                      categories={allCategories}
                      loading={itemLoading}
                      onEdit={(item) => {
                        setEditingItem(item);
                        setItemModalOpen(true);
                      }}
                      onDelete={(item) => handleDeleteTrigger('item', item)}
                      searchVal={itemSearch}
                      onSearchChange={(val) => {
                        setItemSearch(val);
                        setItemPage(1);
                      }}
                      currentPage={itemPage}
                      totalCount={itemTotal}
                      onPageChange={setItemPage}
                      pageSize={itemPageSize}
                      onPageSizeChange={setItemPageSize}
                      
                      // Bulk actions props
                      selectedItemIds={selectedItemIds}
                      onSelectionChange={setSelectedItemIds}
                      onBulkAction={handleBulkAction}
                      
                      // Reorder callback
                      onReorder={handleReorder}
                    />
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>

        <div className="lg:col-span-1">
          <MenuPreview
            categories={allCategories}
            items={allItems}
            restaurant={restaurant}
          />
        </div>
      </div>

      <CategoryModal
        isOpen={catModalOpen}
        onClose={() => setCatModalOpen(false)}
        onSubmit={handleCategorySubmit}
        editingCategory={editingCat}
        loading={catSubmitting}
      />

      <FoodItemModal
        isOpen={itemModalOpen}
        onClose={() => setItemModalOpen(false)}
        onSubmit={handleItemSubmit}
        categories={categories}
        editingItem={editingItem}
        loading={itemSubmitting}
      />

      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDeleteConfirm}
        type="danger"
        title={
          deleteTarget?.type === 'category'
            ? 'Delete Category?'
            : deleteTarget?.type === 'bulk_items'
            ? `Delete ${deleteTarget.obj?.length} food items?`
            : 'Delete Food Item?'
        }
        message={
          deleteTarget?.type === 'category'
            ? 'Deleting this category will also hide all food items inside it. Are you sure you want to proceed?'
            : deleteTarget?.type === 'bulk_items'
            ? 'Are you sure you want to hide the selected food items? This action hides the selected items from customers.'
            : 'Are you sure you want to delete this food item? This action will hide it from the customer menu.'
        }
        confirmText="Delete"
      />
    </div>
  );
};

export default MenuManagement;
