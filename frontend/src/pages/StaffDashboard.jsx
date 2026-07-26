import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import dashboardService from '../services/dashboard';
import deactivationService from '../services/deactivation';
import orderingService from '../services/ordering';
import { useAuth } from '../contexts/AuthContext';
import ROUTES from '../routes/constants';

import { PageHeader } from '../components/common/PageHeader';
import { StatCard } from '../components/common/StatCard';
import { Button } from '../components/common/Button';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { ChefHat, ShoppingBag, ShieldAlert, UserX } from 'lucide-react';
import toast from 'react-hot-toast';

export const StaffDashboard = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deactivating, setDeactivating] = useState(false);

  const [orderStats, setOrderStats] = useState({
    pending: 0,
    preparing: 0,
    ready: 0,
    completed: 0
  });

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
    const fetchOrdersForStats = async () => {
      try {
        const res = await orderingService.getOrders();
        if (res && res.success && res.data) {
          const orders = Array.isArray(res.data) ? res.data : (res.data.results || []);
          const pending = orders.filter(o => o.status === 'PENDING').length;
          const preparing = orders.filter(o => o.status === 'PREPARING').length;
          const ready = orders.filter(o => o.status === 'READY').length;
          const completed = orders.filter(o => o.status === 'COMPLETED').length;
          setOrderStats({ pending, preparing, ready, completed });
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchStats();
    fetchOrdersForStats();
  }, []);

  const handleDeactivate = async () => {
    setDeactivating(true);
    try {
      await deactivationService.deactivateSelfStaff();
      toast.success('Your account has been deactivated.');
      await logout();
      navigate(ROUTES.LOGIN);
    } catch (err) {
      toast.error('Deactivation failed.');
    } finally {
      setDeactivating(false);
      setConfirmOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title={`Staff Portal - ${loading ? '...' : stats?.vendor_shop_name}`} 
        description="Welcome to your workspace. Manage food preparation and order queue."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Pending Approval" 
          value={loading ? '...' : orderStats.pending} 
          icon={<ChefHat className="h-6 w-6 text-purple-400" />} 
        />
        <StatCard 
          title="Preparing Queue" 
          value={loading ? '...' : orderStats.preparing} 
          icon={<ChefHat className="h-6 w-6 text-amber-400" />} 
        />
        <StatCard 
          title="Ready for Pickup" 
          value={loading ? '...' : orderStats.ready} 
          icon={<ShoppingBag className="h-6 w-6 text-indigo-400" />} 
        />
        <StatCard 
          title="Completed Today" 
          value={loading ? '...' : orderStats.completed} 
          icon={<ShoppingBag className="h-6 w-6 text-emerald-400" />} 
        />
      </div>

      {/* Account Settings / Self Deactivation Card */}
      <div className="glass-card p-6 rounded-3xl border border-white/5 shadow-2xl max-w-md">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-rose-500/10 border border-rose-500/20 rounded-xl">
            <ShieldAlert className="h-5 w-5 text-rose-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-200">Account Safety</h3>
            <p className="text-xs text-gray-400">Permanently disable access to your staff dashboard profile.</p>
          </div>
        </div>

        <p className="text-xs text-gray-400 leading-relaxed mb-6">
          Deactivating your account will instantly log you out and terminate your active session. You will need to contact your vendor owner to restore your account.
        </p>

        <Button
          variant="danger"
          onClick={() => setConfirmOpen(true)}
          icon={<UserX className="h-4 w-4" />}
        >
          Deactivate My Account
        </Button>
      </div>

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDeactivate}
        type="danger"
        title="Deactivate Your Account?"
        message="This will terminate your current session immediately and block future logins. Are you sure you want to deactivate your staff profile?"
        confirmText="Deactivate"
        loading={deactivating}
      />
    </div>
  );
};

export default StaffDashboard;
