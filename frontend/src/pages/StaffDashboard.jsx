import React, { useState, useEffect } from 'react';
import dashboardService from '../services/dashboard';
import { PageHeader } from '../components/common/PageHeader';
import { StatCard } from '../components/common/StatCard';
import { ChefHat, ShoppingBag } from 'lucide-react';

export const StaffDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await dashboardService.getStaffStats();
        if (res.success) {
          setStats(res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader 
        title={`Staff Portal - ${loading ? '...' : stats?.vendor_shop_name}`} 
        description="Welcome to your workspace. Manage food preparation and order queue."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard 
          title="Orders Preparing" 
          value={loading ? '...' : stats?.preparing_orders} 
          icon={<ChefHat className="h-6 w-6 text-amber-400" />} 
        />
        <StatCard 
          title="Orders Ready" 
          value={loading ? '...' : stats?.ready_orders} 
          icon={<ShoppingBag className="h-6 w-6 text-emerald-400" />} 
        />
      </div>
    </div>
  );
};

export default StaffDashboard;
