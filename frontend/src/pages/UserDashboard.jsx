import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { PageHeader } from '../components/common/PageHeader';
import { ShoppingBag, ArrowRight } from 'lucide-react';

export const UserDashboard = () => {
  const { user } = useAuth();
  return (
    <div className="space-y-6">
      <PageHeader 
        title={`Hello, ${user?.email || 'User'}!`} 
        description="Welcome to CampusBite! Browse available food stalls and place your order."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card p-6 rounded-2xl border border-white/5 flex flex-col justify-between shadow-xl">
          <div>
            <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl w-fit mb-4">
              <ShoppingBag className="h-6 w-6 text-purple-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-100">Order Delicious Food</h3>
            <p className="text-gray-400 text-sm mt-2 leading-relaxed font-sans">
              Explore your campus food court, order, and pick up when ready.
            </p>
          </div>
          <button className="flex items-center gap-2 mt-6 text-sm font-semibold text-purple-400 hover:text-purple-300 transition-colors w-fit cursor-pointer">
            Start Ordering <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
