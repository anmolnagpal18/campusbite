import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Button } from '../common/Button';
import { Store, MapPin, Clock, Save, RotateCcw } from 'lucide-react';

export const ShopForm = ({ initialData, onSubmit, loading }) => {
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm();
  const openingTime = watch('opening_time');

  useEffect(() => {
    if (initialData) {
      reset({
        restaurant_name: initialData.restaurant_name,
        shop_area: initialData.shop_area,
        block: initialData.block,
        opening_time: initialData.opening_time ? initialData.opening_time.substring(0, 5) : '',
        closing_time: initialData.closing_time ? initialData.closing_time.substring(0, 5) : '',
        status: initialData.status
      });
    }
  }, [initialData, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="sm:col-span-2">
          <Input
            label="Restaurant Name"
            placeholder="Main Canteen Shop"
            icon={<Store className="h-5 w-5" />}
            error={errors.restaurant_name?.message}
            {...register('restaurant_name', {
              required: 'Restaurant name is required.',
              maxLength: { value: 100, message: 'Maximum 100 characters allowed.' }
            })}
          />
        </div>

        <Input
          label="Shop Area"
          placeholder="Canteen Area 1"
          icon={<MapPin className="h-5 w-5" />}
          error={errors.shop_area?.message}
          {...register('shop_area', { required: 'Shop area is required.' })}
        />

        <Input
          label="Block"
          placeholder="C Canteen Building"
          icon={<MapPin className="h-5 w-5" />}
          error={errors.block?.message}
          {...register('block', { required: 'Block is required.' })}
        />

        <Input
          label="Opening Time"
          type="time"
          icon={<Clock className="h-5 w-5" />}
          error={errors.opening_time?.message}
          {...register('opening_time', { required: 'Opening time is required.' })}
        />

        <Input
          label="Closing Time"
          type="time"
          icon={<Clock className="h-5 w-5" />}
          error={errors.closing_time?.message}
          {...register('closing_time', {
            required: 'Closing time is required.',
            validate: (value) => {
              if (openingTime && value && value <= openingTime) {
                return 'Closing time cannot be before or equal to opening time.';
              }
              return true;
            }
          })}
        />

        <div className="sm:col-span-2">
          <Select
            label="Shop Status"
            placeholder="Select Status"
            options={[
              { value: 'OPEN', label: 'Open' },
              { value: 'CLOSED', label: 'Closed' }
            ]}
            error={errors.status?.message}
            {...register('status', { required: 'Shop status is required.' })}
          />
        </div>
      </div>

      <div className="flex gap-3 justify-end border-t border-white/5 pt-6">
        <Button
          type="button"
          variant="secondary"
          onClick={() => reset()}
          icon={<RotateCcw className="h-4 w-4" />}
        >
          Reset
        </Button>
        <Button
          type="submit"
          loading={loading}
          icon={<Save className="h-4 w-4" />}
        >
          Save Changes
        </Button>
      </div>
    </form>
  );
};

export default ShopForm;
