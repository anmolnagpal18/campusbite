import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import { Save, X, Image as ImageIcon } from 'lucide-react';

export const FoodItemModal = ({ isOpen, onClose, onSubmit, categories = [], editingItem, loading }) => {
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm();
  const [imagePreview, setImagePreview] = useState(null);

  const foodImageFile = watch('food_image');

  useEffect(() => {
    if (editingItem) {
      reset({
        category: editingItem.category,
        item_name: editingItem.item_name,
        description: editingItem.description,
        price: editingItem.price,
        quantity: editingItem.quantity,
        availability: editingItem.availability
      });
      setImagePreview(editingItem.food_image || null);
    } else {
      reset({
        category: '',
        item_name: '',
        description: '',
        price: '',
        quantity: 0,
        availability: 'AVAILABLE'
      });
      setImagePreview(null);
    }
  }, [editingItem, reset, isOpen]);

  useEffect(() => {
    if (foodImageFile && foodImageFile.length > 0) {
      const file = foodImageFile[0];
      setImagePreview(URL.createObjectURL(file));
    }
  }, [foodImageFile]);

  const handleFormSubmit = (data) => {
    const formData = new FormData();
    formData.append('category', data.category);
    formData.append('item_name', data.item_name);
    formData.append('description', data.description || '');
    formData.append('price', data.price);
    formData.append('quantity', data.quantity);
    formData.append('availability', data.availability);
    
    if (foodImageFile && foodImageFile.length > 0) {
      formData.append('food_image', foodImageFile[0]);
    }
    
    onSubmit(formData);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingItem ? 'Edit Food Item' : 'Add Food Item'}
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 max-h-[75vh] overflow-y-auto px-1">
        <Select
          label="Category"
          placeholder="Select Category"
          options={categories.map((c) => ({ value: c.id, label: c.category_name }))}
          error={errors.category?.message}
          {...register('category', { required: 'Category is required.' })}
        />

        <Input
          label="Item Name"
          placeholder="e.g. Cheese Pizza, Veg Burger"
          error={errors.item_name?.message}
          {...register('item_name', { required: 'Item name is required.' })}
        />

        <div className="w-full">
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Description
          </label>
          <textarea
            placeholder="Describe the item ingredients, preparation details, etc."
            rows="3"
            className="w-full px-4 py-3 rounded-xl glass-input text-sm text-gray-200"
            {...register('description')}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Price ($)"
            type="number"
            step="0.01"
            placeholder="0.00"
            error={errors.price?.message}
            {...register('price', {
              required: 'Price is required.',
              valueAsNumber: true,
              validate: (val) => val > 0 || 'Price must be greater than 0.'
            })}
          />

          <Input
            label="Available Quantity"
            type="number"
            placeholder="0"
            error={errors.quantity?.message}
            {...register('quantity', {
              required: 'Quantity is required.',
              valueAsNumber: true,
              validate: (val) => val >= 0 || 'Quantity must be greater than or equal to 0.'
            })}
          />
        </div>

        <Select
          label="Availability"
          placeholder="Select Availability"
          options={[
            { value: 'AVAILABLE', label: 'Available' },
            { value: 'OUT_OF_STOCK', label: 'Out of Stock' }
          ]}
          error={errors.availability?.message}
          {...register('availability', { required: 'Availability is required.' })}
        />

        <div className="space-y-2">
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Food Image
          </label>
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
              ) : (
                <ImageIcon className="h-6 w-6 text-gray-500" />
              )}
            </div>
            <label className="px-4 py-2.5 rounded-xl border border-purple-500/30 hover:border-purple-500/80 text-purple-400 hover:text-purple-300 bg-transparent text-xs font-semibold cursor-pointer transition-colors">
              Choose Image
              <input
                type="file"
                accept="image/*"
                className="hidden"
                {...register('food_image')}
              />
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
          <Button variant="secondary" size="sm" onClick={onClose} icon={<X className="h-4 w-4" />}>
            Cancel
          </Button>
          <Button type="submit" size="sm" loading={loading} icon={<Save className="h-4 w-4" />}>
            Save Item
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default FoodItemModal;
