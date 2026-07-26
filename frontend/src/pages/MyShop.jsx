import React, { useState, useEffect } from 'react';
import vendorShopService from '../services/vendorShop';
import PageHeader from '../components/common/PageHeader';
import Card from '../components/common/Card';
import ShopForm from '../components/vendor/ShopForm';
import Loader from '../components/common/Loader';
import toast from 'react-hot-toast';

export const MyShop = () => {
  const [shopData, setShopData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchShopDetails = async () => {
    try {
      const res = await vendorShopService.getShopDetails();
      if (res && res.success) {
        setShopData(res.data);
      }
    } catch (err) {
      toast.error('Failed to load shop details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShopDetails();
  }, []);

  const handleFormSubmit = async (formData) => {
    setSaving(true);
    try {
      const res = await vendorShopService.updateShopDetails(formData);
      if (res && res.success) {
        setShopData(res.data);
        toast.success('Shop Updated Successfully');
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to update shop details.';
      toast.error(errMsg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Shop Profile"
        description="Update your restaurant details, canteen location, opening hours and open/closed status."
        breadcrumbItems={[
          { label: 'Dashboard', path: '/vendor/dashboard' },
          { label: 'My Shop' }
        ]}
      />

      <Card className="max-w-2xl">
        {loading ? (
          <div className="py-12">
            <Loader size="md" />
          </div>
        ) : (
          <ShopForm
            initialData={shopData}
            onSubmit={handleFormSubmit}
            loading={saving}
          />
        )}
      </Card>
    </div>
  );
};

export default MyShop;
