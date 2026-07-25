import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import { Save, X } from 'lucide-react';

export const CategoryModal = ({ isOpen, onClose, onSubmit, editingCategory, loading }) => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    if (editingCategory) {
      reset({
        category_name: editingCategory.category_name,
        display_order: editingCategory.display_order,
        status: editingCategory.status
      });
    } else {
      reset({
        category_name: '',
        display_order: 0,
        status: 'ACTIVE'
      });
    }
  }, [editingCategory, reset, isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingCategory ? 'Edit Category' : 'Add Category'}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Category Name"
          placeholder="e.g. Breakfast, Desserts"
          error={errors.category_name?.message}
          {...register('category_name', { required: 'Category name is required.' })}
        />

        <Input
          label="Display Order"
          type="number"
          placeholder="0"
          error={errors.display_order?.message}
          {...register('display_order', {
            required: 'Display order is required.',
            valueAsNumber: true,
            min: { value: 0, message: 'Must be greater than or equal to 0.' }
          })}
        />

        <Select
          label="Status"
          placeholder="Select Status"
          options={[
            { value: 'ACTIVE', label: 'Active' },
            { value: 'INACTIVE', label: 'Inactive' }
          ]}
          error={errors.status?.message}
          {...register('status', { required: 'Status is required.' })}
        />

        <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
          <Button variant="secondary" size="sm" onClick={onClose} icon={<X className="h-4 w-4" />}>
            Cancel
          </Button>
          <Button type="submit" size="sm" loading={loading} icon={<Save className="h-4 w-4" />}>
            Save
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CategoryModal;
