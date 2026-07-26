import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import orderingService from '../services/ordering';
import ROUTES from '../routes/constants';

import { PageHeader } from '../components/common/PageHeader';
import { StatCard } from '../components/common/StatCard';
import { Button } from '../components/common/Button';
import { StatusBadge } from '../components/common/StatusBadge';
import { ShoppingBag, ArrowRight, Clock, Star, Landmark, Receipt } from 'lucide-react';
import toast from 'react-hot-toast';

export const UserDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    spent: 0.00,
    favourite: 'No orders yet'
  });
  const [recentOrder, setRecentOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await orderingService.getOrders();
      if (res && res.success && res.data) {
        const orders = Array.isArray(res.data) ? res.data : (res.data.results || []);
        
        // 1. Calculate stats
        const total = orders.length;
        const pending = orders.filter(o => ['PENDING', 'PREPARING', 'READY'].includes(o.status)).length;
        const completed = orders.filter(o => o.status === 'COMPLETED').length;
        const spent = orders
          .filter(o => o.payment_status === 'SUCCESS' && o.status !== 'CANCELLED')
          .reduce((sum, o) => sum + parseFloat(o.grand_total), 0);

        // Find favourite restaurant by occurrences
        const restaurantCounts = {};
        let favourite = 'No orders yet';
        let maxCount = 0;
        
        orders.forEach(o => {
          const name = o.restaurant_details?.restaurant_name;
          if (name) {
            restaurantCounts[name] = (restaurantCounts[name] || 0) + 1;
            if (restaurantCounts[name] > maxCount) {
              maxCount = restaurantCounts[name];
              favourite = name;
            }
          }
        });

        setStats({ total, pending, completed, spent, favourite });

        // 2. Get recent order
        if (total > 0) {
          setRecentOrder(orders[0]); // list is ordered newest first by backend
        }
      }
    } catch (err) {
      toast.error('Failed to load dashboard statistics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-8">
      <PageHeader 
        title={`Welcome back, ${user?.email?.split('@')[0] || 'Foodie'}!`} 
        description="Explore the best canteens and track your campus orders in real-time."
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard 
          title="Total Orders" 
          value={loading ? '...' : stats.total} 
          icon={<ShoppingBag className="h-6 w-6 text-purple-400" />} 
        />
        <StatCard 
          title="Pending Pickup" 
          value={loading ? '...' : stats.pending} 
          icon={<Clock className="h-6 w-6 text-amber-400 animate-pulse" />} 
        />
        <StatCard 
          title="Completed Orders" 
          value={loading ? '...' : stats.completed} 
          icon={<ShoppingBag className="h-6 w-6 text-emerald-400" />} 
        />
        <StatCard 
          title="Favourite Stall" 
          value={loading ? '...' : stats.favourite} 
          icon={<Star className="h-6 w-6 text-amber-400" />} 
        />
        <StatCard 
          title="Total Spent" 
          value={loading ? '...' : `₹${stats.spent.toFixed(2)}`} 
          icon={<Receipt className="h-6 w-6 text-cyan-400" />} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Order Summary */}
        <div className="lg:col-span-2 glass-card p-6 rounded-3xl border border-white/5 shadow-2xl flex flex-col justify-between space-y-6">
          <div>
            <h3 className="text-base font-bold text-gray-100 mb-4">Your Recent Order</h3>
            {loading ? (
              <div className="space-y-3">
                <div className="h-4 bg-white/5 rounded w-1/4 animate-pulse" />
                <div className="h-10 bg-white/5 rounded-xl animate-pulse" />
              </div>
            ) : recentOrder ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
                  <div>
                    <h4 className="text-sm font-bold text-gray-200">{recentOrder.restaurant_details?.restaurant_name}</h4>
                    <span className="text-[10px] text-gray-400 font-semibold">{recentOrder.order_number}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-purple-400 block">₹{parseFloat(recentOrder.grand_total).toFixed(2)}</span>
                    <span className="text-[10px] text-gray-400 font-semibold">
                      {new Date(recentOrder.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">Status:</span>
                    <StatusBadge status={recentOrder.status} />
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate(`${ROUTES.ORDERS}?orderId=${recentOrder.id}`)}
                  >
                    Track Progress
                  </Button>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-gray-500">No recent orders. Place your first order today!</div>
            )}
          </div>
        </div>

        {/* Quick actions Browse Food card */}
        <div className="glass-card p-6 rounded-3xl border border-white/5 shadow-2xl flex flex-col justify-between">
          <div>
            <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl w-fit mb-4">
              <ShoppingBag className="h-6 w-6 text-purple-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-100">Order Delicious Food</h3>
            <p className="text-gray-400 text-sm mt-2 leading-relaxed">
              Explore your campus food stalls, choose instant checkout or preorder pickup slots, and collect using secure QR scanning.
            </p>
          </div>
          
          <Button
            variant="primary"
            className="mt-6 flex items-center justify-center gap-2 text-xs"
            onClick={() => navigate(ROUTES.BROWSE_FOOD)}
            icon={<ArrowRight className="h-4 w-4" />}
          >
            Browse Food Court
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
