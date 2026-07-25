import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ShoppingBag, ArrowRight } from 'lucide-react';

export const UserDashboard = () => {
  const { user } = useAuth();
  return (
    <div className="space-y-6">
      <div className="p-8 rounded-3xl bg-gradient-to-r from-purple-800/40 to-indigo-800/40 border border-white/5 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"></div>
        <h1 className="text-3xl font-bold text-white mb-2">Hello, {user?.email}!</h1>
        <p className="text-gray-300">Welcome to CampusBite! Browse available food stalls and place your order.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card p-6 rounded-2xl border border-white/5 flex flex-col justify-between">
          <div>
            <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl w-fit mb-4">
              <ShoppingBag className="h-6 w-6 text-purple-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-100">Order Delicious Food</h3>
            <p className="text-gray-400 text-sm mt-2 leading-relaxed">
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
